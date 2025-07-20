const axios = require('axios');

// --- Configuración ---
const LISTENER_PORT = process.env.NODEJS_LISTENER_PORT || 5002;
const LISTENER_URL = `http://localhost:${LISTENER_PORT}/connect`;
const TIKTOK_USER = 'oraculo_vidente'; // El usuario de TikTok para conectar

/**
 * Envía una solicitud POST al listener de Node.js para iniciar la conexión
 * con un usuario de TikTok específico.
 */
const testTikTokConnection = async () => {
    const payload = { tiktokUser: TIKTOK_USER };
    console.log(`Enviando solicitud a ${LISTENER_URL} para conectar con @${TIKTOK_USER}...`);

    try {
        const response = await axios.post(LISTENER_URL, payload, { timeout: 10000 });
        console.log('Respuesta del servidor:');
        console.log(response.data);
    } catch (error) {
        console.error(`Error al conectar con el listener: ${error.message}`);
        console.log("Asegúrate de que el listener (main.js) se esté ejecutando en una terminal separada.");
    }
};

testTikTokConnection();