const axios = require('axios');

// --- Configuración ---
const CENTRAL_BRAIN_PORT = process.env.PORT || 5001;
const CENTRAL_BRAIN_URL = `http://localhost:${CENTRAL_BRAIN_PORT}/connect-tiktok`;
const TIKTOK_USER = 'oraculo_vidente'; // El usuario de TikTok para conectar

/**
 * Envía una solicitud POST al Cerebro Central para que este, a su vez,
 * inicie la conexión en todos los listeners configurados.
 */
const testCentralOrchestration = async () => {
    const payload = { tiktokUser: TIKTOK_USER };
    console.log(`Enviando solicitud a ${CENTRAL_BRAIN_URL} para conectar con @${TIKTOK_USER}...`);

    try {
        const response = await axios.post(CENTRAL_BRAIN_URL, payload, { timeout: 10000 });
        console.log('Respuesta del Cerebro Central:');
        console.log(response.data);
    } catch (error) {
        console.error(`Error al conectar con el Cerebro Central: ${error.message}`);
        console.log("Asegúrate de que el Cerebro Central (index.js) se esté ejecutando.");
    }
};

testCentralOrchestration();