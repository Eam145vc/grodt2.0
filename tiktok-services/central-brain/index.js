const express = require('express');
const http = require('http');
const { io } = require("socket.io-client");
const fetch = require('node-fetch');
const Fuse = require('fuse.js');
const { createClient } = require('redis');

// --- Configuración ---
const PORT = process.env.PORT || 5001;
const GAME_SERVER_URL = process.env.GAME_SERVER_URL || "http://localhost:5000";
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_CHANNEL = 'tiktok-events';
const TEAM_COMMAND_COOLDOWN = 10 * 60 * 1000; // 10 minutos en milisegundos

// --- Clientes ---
const gameSocket = io(GAME_SERVER_URL, {
    reconnectionAttempts: 5,
    reconnectionDelay: 5000,
});
const redisClient = createClient({ url: `redis://${REDIS_HOST}:${REDIS_PORT}` });

// --- Configuración de Eventos de Socket ---
gameSocket.on('connect', () => {
    console.log(`Conectado al servidor del juego en ${GAME_SERVER_URL}`);
});

gameSocket.on('connect-tiktok', (data) => {
    console.log("Orden de conexión recibida del servidor del juego.");
    connectToTikTok(data.tiktokUser);
});

gameSocket.on('disconnect', () => {
    console.log('Desconectado del servidor del juego.');
});

gameSocket.on('connect_error', (err) => {
    console.error(`Error de conexión con el servidor del juego: ${err.message}`);
});

// --- Equipos válidos para la presala ---
const VALID_TEAMS = [
    'argentina', 'bolivia', 'chile', 'colombia', 'costa rica', 'cuba',
    'ecuador', 'el salvador', 'guatemala', 'honduras', 'mexico', 'nicaragua',
    'panama', 'paraguay', 'peru', 'puerto rico', 'republica dominicana',
    'uruguay', 'venezuela', 'brasil'
];

// --- Configuración de Búsqueda Difusa ---
const fuse = new Fuse(VALID_TEAMS, {
  includeScore: true,
  threshold: 0.4,
});

// --- Lógica de Cooldown para Comandos de Equipo ---
const processedEvents = new Set();
const EVENT_TIMEOUT = 2000; // 2 segundos para considerar un evento como duplicado

/**
 * Verifica si un evento ya ha sido procesado recientemente.
 * @param {string} eventId - El ID único del evento.
 * @returns {boolean} - True si el evento es un duplicado.
 */
function isDuplicate(eventId) {
    if (processedEvents.has(eventId)) {
        return true;
    }
    return false;
}

/**
 * Marca un evento como procesado y lo elimina después de un tiempo.
 * @param {string} eventId - El ID único del evento.
 */
function markAsProcessed(eventId) {
    processedEvents.add(eventId);
    setTimeout(() => {
        processedEvents.delete(eventId);
    }, EVENT_TIMEOUT);
}

/**
 * Detectar comando de equipo en comentarios
 * @param {string} comment - El comentario del usuario
 * @returns {string|null} - El nombre del equipo si es válido, null si no
 */
function detectTeamCommand(comment) {
    if (!comment || typeof comment !== 'string') return null;

    const normalizedComment = comment.toLowerCase().trim();
    let potentialTeamName = '';

    // Extraer el nombre del equipo del comando
    const prefixes = ['/', '#', '@'];
    if (prefixes.some(p => normalizedComment.startsWith(p))) {
        potentialTeamName = normalizedComment.substring(1).trim();
    } else {
        const match = normalizedComment.match(/^(?:equipo|team|pais)\s+(.+)$/);
        if (match) {
            potentialTeamName = match[1].trim();
        }
    }

    if (!potentialTeamName) {
        return null;
    }

    // Usar Fuse.js para encontrar la mejor coincidencia
    const results = fuse.search(potentialTeamName);

    if (results.length > 0) {
        // Devolver el nombre del equipo más probable
        return results[0].item;
    }

    return null;
}

// --- Lógica Principal de Manejo de Eventos ---
function handleTikTokEvent(rawMessage) {
    try {
        const { source, event_type, data } = JSON.parse(rawMessage);

        // Crear un ID único para de-duplicación
        const eventId = `${event_type}-${data.user}-${data.gift_id || data.comment || ''}-${data.count || ''}`;
        if (isDuplicate(eventId)) {
            console.log(`[${source}] Evento duplicado ignorado: ${event_type} de ${data.user}`);
            return;
        }
        markAsProcessed(eventId);
        
        console.log(`[${source}] Evento procesado: ${event_type}`);

        // --- Manejo de Comandos de Equipo (sin Cooldown) ---
        if (event_type === 'comment' && data.comment) {
            const teamName = detectTeamCommand(data.comment);
            if (teamName) {
                if (gameSocket.connected) {
                    // Simplemente reenviamos el evento al servidor del juego
                    gameSocket.emit('join-team', { userId: data.user, teamName });
                }
                return; // Terminar el procesamiento para este comentario
            }
        }

        // --- Manejo de Otros Eventos (likes, gifts, etc.) ---
        if (gameSocket.connected) {
            // No es necesario filtrar duplicados aquí, Redis ya garantiza la entrega
            gameSocket.emit('tiktok-event', { event_type, data });
            
            // Logueo específico para visualización
            if (event_type === 'like') {
                console.log(`👍 ${data.user} envió ${data.count || 1} likes`);
            } else if (event_type === 'gift') {
                console.log(`🎁 ${data.user} envió ${data.count || 1}x "${data.gift_name}"`);
            }
        } else {
            console.error('❌ No se pudo enviar el evento: no hay conexión con el servidor del juego.');
        }

    } catch (error) {
        console.error('Error al procesar el mensaje de Redis:', error);
    }
}

// --- Inicialización del Servidor y Conexiones ---
async function main() {
    const app = express();
    const server = http.createServer(app);

    // Endpoint de salud para monitoreo
    app.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            gameSocketConnected: gameSocket.connected,
            redisConnected: redisClient.isOpen,
        });
    });
    
    server.listen(PORT, () => {
        console.log(`🧠 El Cerebro Central está escuchando en el puerto ${PORT}`);
    });

    // Conectar al servidor del juego
    gameSocket.connect();

    // Conectar a Redis y suscribirse al canal
    try {
        await redisClient.connect();
        console.log('🔌 Conectado a Redis.');
        
        await redisClient.subscribe(REDIS_CHANNEL, (message) => {
            handleTikTokEvent(message);
        });
        console.log(`📡 Suscrito al canal de Redis: ${REDIS_CHANNEL}`);

    } catch (err) {
        console.error('❌ Error fatal al conectar con Redis:', err);
        process.exit(1); // Salir si no se puede conectar a Redis
    }
}

// --- Lógica de Conexión con TikTok ---
const listenerConnections = {
    python: { connected: false, host: 'http://localhost:5003' },
    nodejs: { connected: false, host: 'http://localhost:5002' }
};
let currentTiktokUser = null;

async function connectToTikTok(tiktokUser) {
    console.log(`Iniciando conexión con TikTok Live para @${tiktokUser}...`);
    currentTiktokUser = tiktokUser;
    Object.values(listenerConnections).forEach(l => l.connected = false);

    const connectionPromises = Object.values(listenerConnections).map(listener =>
        fetch(`${listener.host}/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tiktokUser }),
        }).catch(err => console.error(`Error al solicitar conexión a ${listener.host}: ${err.message}`))
    );
    
    await Promise.all(connectionPromises);
}

function checkAllListenersConnected() {
    const allConnected = Object.values(listenerConnections).every(l => l.connected);
    if (allConnected) {
        console.log(`✅ Todos los listeners conectados a @${currentTiktokUser}.`);
        gameSocket.emit('tiktok-connected', { user: currentTiktokUser });
    }
}

main();