const { TikTokLiveConnection } = require('tiktok-live-connector');
const axios = require('axios');
const express = require('express');

// --- Configuración ---
const CENTRAL_BRAIN_URL = process.env.CENTRAL_BRAIN_URL || 'http://localhost:5001/event';
const PORT = process.env.NODEJS_LISTENER_PORT || 5002;

// --- Cliente de TikTok Live (se inicializará bajo demanda) ---
let connection = null;
let availableGifts = {};

// --- Funciones de Ayuda ---
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

// --- Lógica de Conexión de TikTok ---
const runTikTokClient = (tiktokUser) => {
    console.log(`Iniciando conexión con @${tiktokUser}...`);
    connection = new TikTokLiveConnection(tiktokUser, {
        enableExtendedGiftInfo: true
    });

    addEventListeners(connection, tiktokUser);

    connection.connect().catch(err => {
        console.error(`Fallo al conectar con @${tiktokUser}:`, err);
    });
};

// --- Manejadores de Eventos ---
const addEventListeners = (client, tiktokUser) => {
    client.on('connected', async (state) => {
        console.log(`Conectado a la sala de @${tiktokUser} (ID: ${state.roomId})`);
        sendToCentralBrain('status', {
            status: 'connected',
            user: tiktokUser,
            message: `Conectado a @${tiktokUser}`
        });

        // Obtener la lista de regalos disponibles para esta sala
        try {
            const gifts = await client.fetchAvailableGifts();
            gifts.forEach(gift => {
                availableGifts[gift.id] = {
                    name: gift.name,
                    value: gift.diamond_count
                };
            });
            console.log(`Lista de ${gifts.length} regalos obtenida y almacenada.`);
        } catch (err) {
            console.error('No se pudo obtener la lista de regalos:', err);
        }
    });

    client.on('disconnected', () => {
        console.log('Desconectado.');
        sendToCentralBrain('status', {
            status: 'disconnected',
            message: 'Desconectado del Live'
        });
    });

    client.on('chat', data => {
        console.log(`Comentario de ${data.user.uniqueId}: ${data.comment}`);
        sendToCentralBrain('comment', {
            user: data.user.uniqueId.toLowerCase(),
            comment: data.comment
        });
    });

    client.on('gift', data => {
        if (data.giftType === 1 && !data.repeatEnd) {
            return;
        }

        const giftInfo = availableGifts[data.giftId];
        const giftName = giftInfo ? giftInfo.name : `ID ${data.giftId}`;
        const giftValue = giftInfo ? giftInfo.value : 0;

        console.log(`${data.user.uniqueId} envió ${data.repeatCount}x "${giftName}" (ID: ${data.giftId}, Valor: ${giftValue})`);
        
        sendToCentralBrain('gift', {
            user: data.user.uniqueId.toLowerCase(),
            gift_id: data.giftId,
            gift_name: giftName,
            count: data.repeatCount,
            value: giftValue
        });
    });

    client.on('like', data => {
        console.log(`${data.user.uniqueId} envió ${data.likeCount} likes. Total: ${data.totalLikeCount}`);
        sendToCentralBrain('like', {
            user: data.user.uniqueId.toLowerCase(),
            count: data.likeCount,
            total: data.totalLikeCount
        });
    });

    client.on('follow', data => {
        console.log(`${data.uniqueId} ahora sigue al anfitrión.`);
        sendToCentralBrain('follow', { user: data.uniqueId });
    });

    client.on('error', err => {
        console.error('Error en la conexión:', err);
        sendToCentralBrain('status', {
            status: 'error',
            message: err.toString()
        });
    });
};

// --- Servidor Express ---
const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.post('/connect', (req, res) => {
    const { tiktokUser } = req.body;

    if (!tiktokUser) {
        return res.status(400).json({ error: 'tiktokUser es requerido' });
    }

    if (connection && connection.isConnected()) {
        console.log('Ya hay una conexión activa. Desconectando primero...');
        connection.disconnect();
        connection = null;
    }

    runTikTokClient(tiktokUser);

    res.status(200).json({
        status: 'ok',
        message: `Intentando conectar a @${tiktokUser}`
    });
});

// --- Ejecución Principal ---
app.listen(PORT, () => {
    console.log(`Listener de Node.js escuchando en el puerto ${PORT}`);
});