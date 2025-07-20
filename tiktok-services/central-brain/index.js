const express = require('express');
const http = require('http');
const { io } = require("socket.io-client");
const fetch = require('node-fetch');

// --- Configuración ---
const PORT = process.env.PORT || 5001;
const GAME_SERVER_URL = process.env.GAME_SERVER_URL || "http://localhost:5000"; // Corregido: puerto 5000

// --- Conexión con el Servidor del Juego ---
const gameSocket = io(GAME_SERVER_URL, {
    reconnectionAttempts: 5,
    reconnectionDelay: 5000,
});

// --- Configuración de Eventos de Socket ---
// Se configura UNA SOLA VEZ para evitar duplicados en reconexiones.
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

// --- Lógica para Evitar Duplicados ---
const recentEvents = new Map();
const EVENT_TIMEOUT = 5000; // 5 segundos

/**
 * Verifica si un evento es un duplicado.
 * @param {string} eventType - El tipo de evento.
 * @param {object} data - Los datos del evento.
 * @returns {boolean} - True si el evento es un duplicado, false en caso contrario.
 */
function isDuplicate(eventType, data) {
    // Crear un identificador único para el evento
    const eventId = `${eventType}-${data.user}-${data.gift_name || data.comment || ''}-${data.count || ''}`;
    const now = Date.now();

    if (recentEvents.has(eventId)) {
        // Si el evento ya existe y no ha expirado, es un duplicado.
        if (now - recentEvents.get(eventId) < EVENT_TIMEOUT) {
            console.log(`Evento duplicado detectado y descartado: ${eventId}`);
            return true;
        }
    }

    // Almacenar el evento con la marca de tiempo actual.
    recentEvents.set(eventId, now);

    // Limpiar eventos antiguos para no consumir memoria indefinidamente.
    for (const [key, timestamp] of recentEvents.entries()) {
        if (now - timestamp > EVENT_TIMEOUT) {
            recentEvents.delete(key);
        }
    }

    return false;
}

/**
 * Detectar comando de equipo en comentarios
 * @param {string} comment - El comentario del usuario
 * @returns {string|null} - El nombre del equipo si es válido, null si no
 */
function detectTeamCommand(comment) {
    if (!comment || typeof comment !== 'string') return null;
    
    const normalizedComment = comment.toLowerCase().trim();
    
    // Opción 1: El comentario empieza con un prefijo (ej: "/colombia", "#mexico")
    const prefixes = ['/', '#', '@'];
    if (prefixes.some(p => normalizedComment.startsWith(p))) {
        const teamName = normalizedComment.substring(1).trim();
        if (VALID_TEAMS.includes(teamName)) {
            return teamName;
        }
    }

    // Opción 2: El comentario usa un comando explícito (ej: "equipo colombia")
    const commandPatterns = [
        /^(?:equipo|team|pais)\s+(.+)$/
    ];
    
    for (const pattern of commandPatterns) {
        const match = normalizedComment.match(pattern);
        if (match) {
            const teamName = match[1].toLowerCase().trim();
            if (VALID_TEAMS.includes(teamName)) {
                return teamName;
            }
            // Opcional: buscar coincidencias parciales si se desea
            const partialMatch = VALID_TEAMS.find(team => team.startsWith(teamName));
            if (partialMatch) {
                return partialMatch;
            }
        }
    }
    
    return null;
}

// --- Servidor Express ---
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'TikTok Central Brain funcionando',
        connectedToGame: gameSocket.connected,
        validTeams: VALID_TEAMS,
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.post('/event', (req, res) => {
    const { source, event_type, data } = req.body;
    console.log(`Evento recibido de ${source}: ${event_type}`, data);

    // Manejar eventos de estado de conexión de los listeners
    if (event_type === 'status') {
        console.log(`Estado del listener ${source}: ${data.status}`);
        if (gameSocket.connected) {
            gameSocket.emit('tiktok-connection-status', data);
        }
        return res.status(200).send({ status: 'ok', message: 'Estado procesado.' });
    }

    // Detectar comando de equipo en los comentarios
    if (event_type === 'comment' && data.comment) {
        const teamName = detectTeamCommand(data.comment);
        if (teamName) {
            if (gameSocket.connected) {
                gameSocket.emit('join-team', { userId: data.user, teamName });
                console.log(`👥 Usuario ${data.user} intentando unirse al equipo ${teamName}`);
            }
            return res.status(200).send({
                status: 'ok',
                message: `Comando de equipo procesado: ${teamName}`,
                team: teamName
            });
        }
    }

    if (isDuplicate(event_type, data)) {
        return res.status(200).send({ status: 'ok', message: 'Evento duplicado ignorado.' });
    }

    // Procesar eventos de likes y gifts
    if (gameSocket.connected) {
        gameSocket.emit('tiktok-event', { event_type, data });
        console.log(`📡 Evento '${event_type}' enviado al servidor del juego.`);
        
        // Log especial para eventos de presala
        if (event_type === 'like') {
            console.log(`👍 ${data.user} envió ${data.count || 1} likes`);
        } else if (event_type === 'gift') {
            console.log(`🎁 ${data.user} envió ${data.count || 1}x "${data.gift_name}"`);
        }
    } else {
        console.error('❌ No se pudo enviar el evento: no hay conexión con el servidor del juego.');
    }

    res.status(200).send({ status: 'ok', message: 'Evento procesado.' });
});

// Endpoint para obtener equipos válidos
app.get('/teams', (req, res) => {
    res.json({ 
        validTeams: VALID_TEAMS,
        count: VALID_TEAMS.length
    });
});

// Endpoint para simular eventos (para testing)
app.post('/simulate', (req, res) => {
    const { user, type, team, gift, count } = req.body;
    
    if (!user || !type) {
        return res.status(400).json({ error: 'user y type son requeridos' });
    }
    
    let eventData = { user };
    
    switch (type) {
        case 'join-team':
            if (!team || !VALID_TEAMS.includes(team.toLowerCase())) {
                return res.status(400).json({ error: 'team inválido' });
            }
            if (gameSocket.connected) {
                gameSocket.emit('join-team', { userId: user, teamName: team.toLowerCase() });
            }
            return res.json({ status: 'ok', message: `Usuario ${user} unido al equipo ${team}` });
            
        case 'like':
            eventData.count = count || 1;
            break;
            
        case 'gift':
            eventData.gift_name = gift || 'heart';
            eventData.count = count || 1;
            break;
            
        default:
            return res.status(400).json({ error: 'Tipo de evento no válido' });
    }
    
    if (gameSocket.connected) {
        gameSocket.emit('tiktok-event', { event_type: type, data: eventData });
        res.json({ status: 'ok', message: `Evento ${type} simulado para ${user}` });
    } else {
        res.status(500).json({ error: 'No conectado al servidor del juego' });
    }
});
const server = http.createServer(app);


server.listen(PORT, () => {
    console.log(`🧠 El Cerebro Central está escuchando en el puerto ${PORT}`);
    console.log(`🎯 Endpoints disponibles:`);
    console.log(`   GET  /         - Estado del sistema`);
    console.log(`   POST /event    - Recibir eventos de TikTok`);
    console.log(`   GET  /teams    - Equipos válidos`);
    console.log(`   POST /simulate - Simular eventos`);
    console.log(`   POST /listener-status - Recibir estado de listeners`);
    console.log(`   POST /connect-tiktok - Iniciar conexión con TikTok`);
    console.log(`🎮 Conectando al servidor del juego en ${GAME_SERVER_URL}`);
    
    // Conectar al servidor del juego DESPUÉS de que el servidor Express esté listo
    gameSocket.connect();
});

// --- Lógica de Conexión con TikTok ---
const listenerConnections = {
    python: { connected: false, host: 'http://localhost:5003' },
    nodejs: { connected: false, host: 'http://localhost:5002' }
};
let currentTiktokUser = null;

app.post('/listener-status', (req, res) => {
    const { source, status } = req.body;
    if (listenerConnections[source]) {
        listenerConnections[source].connected = (status === 'connected');
        console.log(`Estado del listener ${source} actualizado a: ${status}`);
        checkAllListenersConnected();
    }
    res.sendStatus(200);
});

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

app.post('/connect-tiktok', (req, res) => {
    const { tiktokUser } = req.body;
    if (!tiktokUser) {
        return res.status(400).json({ error: 'tiktokUser es requerido' });
    }
    connectToTikTok(tiktokUser);
    res.status(200).json({ message: `Iniciando conexión con @${tiktokUser} en todos los listeners.` });
});

function checkAllListenersConnected() {
    const allConnected = Object.values(listenerConnections).every(l => l.connected);
    if (allConnected) {
        console.log(`✅ Todos los listeners conectados a @${currentTiktokUser}.`);
        gameSocket.emit('tiktok-connected', { user: currentTiktokUser });
    }
}