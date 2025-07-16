const { TikTokLiveConnection, WebcastEvent } = require('tiktok-live-connector');
const axios = require('axios');

// --- Configuración ---
// El unique_id del usuario de TikTok a monitorear.
const TIKTOK_UNIQUE_ID = process.env.TIKTOK_UNIQUE_ID || 'miUsuarioTikTok';

// La URL del "Cerebro Central" que recibirá los eventos.
const CENTRAL_BRAIN_URL = process.env.CENTRAL_BRAIN_URL || 'http://localhost:3000/event';

// --- Función de Ayuda ---
/**
 * Envía un evento al Cerebro Central a través de una solicitud HTTP POST.
 * @param {string} eventType - El tipo de evento (ej. "comment", "gift").
 * @param {object} data - El payload del evento.
 */
const sendToCentralBrain = async (eventType, data) => {
    try {
        const payload = {
            source: 'nodejs-listener',
            event_type: eventType,
            data: data
        };
        console.log(`Enviando evento al Cerebro Central: ${eventType}`);
        await axios.post(CENTRAL_BRAIN_URL, payload, { timeout: 5000 });
    } catch (error) {
        console.error(`Error al enviar el evento al Cerebro Central: ${error.message}`);
    }
};

// --- Cliente de TikTok Live ---
// Crear una nueva instancia de conexión y pasar el uniqueId.
const connection = new TikTokLiveConnection(TIKTOK_UNIQUE_ID, {
    // Habilitar información extendida de regalos para obtener nombres y detalles.
    enableExtendedGiftInfo: true
});

// --- Manejadores de Eventos ---
connection.on(WebcastEvent.CONNECTED, state => {
    console.log(`Conectado a la sala ${state.roomId}`);
    sendToCentralBrain('connect', { unique_id: TIKTOK_UNIQUE_ID, roomId: state.roomId });
});

connection.on(WebcastEvent.DISCONNECTED, () => {
    console.log('Desconectado.');
});

connection.on(WebcastEvent.CHAT, data => {
    console.log(`Comentario de ${data.user.uniqueId}: ${data.comment}`);
    sendToCentralBrain('comment', {
        user: data.user.uniqueId,
        comment: data.comment
    });
});

connection.on(WebcastEvent.GIFT, data => {
    // Solo procesar el evento final del "streak" para evitar duplicados.
    if (data.giftType === 1 && !data.repeatEnd) {
        // El "streak" de regalos está en progreso, se puede ignorar o manejar como un evento temporal.
        return;
    }
    console.log(`${data.user.uniqueId} envió ${data.repeatCount}x "${data.giftName}"`);
    sendToCentralBrain('gift', {
        user: data.user.uniqueId,
        gift_name: data.giftName,
        count: data.repeatCount
    });
});

connection.on(WebcastEvent.LIKE, data => {
    console.log(`${data.user.uniqueId} envió ${data.likeCount} likes. Total: ${data.totalLikeCount}`);
    sendToCentralBrain('like', {
        user: data.user.uniqueId,
        count: data.likeCount,
        total: data.totalLikeCount
    });
});

connection.on(WebcastEvent.FOLLOW, data => {
    console.log(`${data.user.uniqueId} ahora sigue al anfitrión.`);
    sendToCentralBrain('follow', { user: data.user.uniqueId });
});

connection.on(WebcastEvent.ERROR, err => {
    console.error('Error en la conexión:', err);
});

// --- Ejecución Principal ---
const startListener = () => {
    console.log('Iniciando el listener de Node.js para TikTok...');
    connection.connect().catch(err => {
        console.error('Fallo al conectar:', err);
    });
};

startListener();