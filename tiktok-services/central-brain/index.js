const express = require('express');
const http = require('http');
const { io } = require("socket.io-client");

// --- Configuración ---
const PORT = process.env.PORT || 3000;
const GAME_SERVER_URL = process.env.GAME_SERVER_URL || "http://localhost:3001"; // Asumiendo que el servidor del juego corre en el puerto 3001

// --- Conexión con el Servidor del Juego ---
const gameSocket = io(GAME_SERVER_URL, {
    reconnectionAttempts: 5,
    reconnectionDelay: 5000,
});

gameSocket.on('connect', () => {
    console.log(`Conectado al servidor del juego en ${GAME_SERVER_URL}`);
});

gameSocket.on('disconnect', () => {
    console.log('Desconectado del servidor del juego.');
});

gameSocket.on('connect_error', (err) => {
    console.error(`Error de conexión con el servidor del juego: ${err.message}`);
});


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


// --- Servidor Express ---
const app = express();
app.use(express.json());

app.post('/event', (req, res) => {
    const { source, event_type, data } = req.body;
    console.log(`Evento recibido de ${source}: ${event_type}`, data);

    // Detectar comando de equipo en los comentarios
    if (event_type === 'comment' && data.comment.startsWith('/equipo ')) {
      const teamName = data.comment.split(' ')[1];
      if (teamName) {
        gameSocket.emit('join-team', { userId: data.user, teamName });
        console.log(`Usuario ${data.user} intentando unirse al equipo ${teamName}`);
        return res.status(200).send({ status: 'ok', message: 'Comando de equipo procesado.' });
      }
    }

    if (isDuplicate(event_type, data)) {
        return res.status(200).send({ status: 'ok', message: 'Evento duplicado ignorado.' });
    }

    // Aquí se procesa el evento y se decide qué acción tomar en el juego.
    // Por ahora, simplemente reenviamos el evento al servidor del juego.
    if (gameSocket.connected) {
      gameSocket.emit('tiktok-event', { event_type, data });
      console.log(`Evento '${event_type}' enviado al servidor del juego.`);
    } else {
        console.error('No se pudo enviar el evento: no hay conexión con el servidor del juego.');
    }

    res.status(200).send({ status: 'ok', message: 'Evento procesado.' });
});

const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`El Cerebro Central está escuchando en el puerto ${PORT}`);
});