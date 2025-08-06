const { TikTokLiveConnection } = require('tiktok-live-connector');
const express = require('express');
const { createClient } = require('redis');
const axios = require('axios');

// --- Configuración ---
const PORT = process.env.NODEJS_LISTENER_PORT || 5002;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_CHANNEL = 'tiktok-events';

// --- Clientes ---
const redisClient = createClient({ url: `redis://${REDIS_HOST}:${REDIS_PORT}` });
redisClient.on('error', (err) => console.error('Error en el Cliente Redis', err));
redisClient.connect();
let connection = null;
let availableGifts = {};

// --- Funciones de Ayuda ---
const getAvatarAsBase64 = async (url) => {
    if (!url) return null;
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://www.tiktok.com/'
            }
        });
        const contentType = response.headers['content-type'] || 'image/webp';
        const base64 = Buffer.from(response.data, 'binary').toString('base64');
        return `data:${contentType};base64,${base64}`;
    } catch (error) {
        console.error(`Error al descargar el avatar desde ${url}:`, error.message);
        return null;
    }
};

const sendToCentralBrain = async (eventType, data) => {
    try {
        const payload = {
            source: 'nodejs-listener',
            event_type: eventType,
            data: data
        };
        const message = JSON.stringify(payload);
        await redisClient.publish(REDIS_CHANNEL, message);
    } catch (error) {
        console.error(`Error al publicar evento en Redis: ${error.message}`);
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

    client.on('chat', async (data) => {
        console.log(`Comentario de ${data.user.uniqueId}: ${data.comment}`);
        const avatarUrl = data.user?.profilePicture?.urls[0];
        const avatarBase64 = await getAvatarAsBase64(avatarUrl);
        sendToCentralBrain('comment', {
            user: data.user.uniqueId.toLowerCase(),
            comment: data.comment,
            avatarBase64: avatarBase64
        });
    });

    client.on('gift', async (data) => {
        if (data.giftType === 1 && !data.repeatEnd) {
            return;
        }

        const giftInfo = availableGifts[data.giftId];
        const giftName = giftInfo ? giftInfo.name : `ID ${data.giftId}`;
        const giftValue = giftInfo ? giftInfo.value : 0;

        console.log(`${data.user.uniqueId} envió ${data.repeatCount}x "${giftName}" (ID: ${data.giftId}, Valor: ${giftValue})`);
        
        const avatarUrl = data.user?.profilePicture?.urls[0];
        const avatarBase64 = await getAvatarAsBase64(avatarUrl);
        sendToCentralBrain('gift', {
            user: data.user.uniqueId.toLowerCase(),
            gift_id: data.giftId,
            gift_name: giftName,
            count: data.repeatCount,
            value: giftValue,
            avatarBase64: avatarBase64
        });
    });

    client.on('like', async (data) => {
        console.log(`${data.user.uniqueId} envió ${data.likeCount} likes. Total: ${data.totalLikeCount}`);
        const avatarUrl = data.user?.profilePicture?.urls[0];
        const avatarBase64 = await getAvatarAsBase64(avatarUrl);
        sendToCentralBrain('like', {
            user: data.user.uniqueId.toLowerCase(),
            count: data.likeCount,
            total: data.totalLikeCount,
            avatarBase64: avatarBase64
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