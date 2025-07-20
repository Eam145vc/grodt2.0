const axios = require('axios');

// --- Configuración de Diagnóstico ---
// Simula las variables de entorno para aislar la prueba.
process.env.CEREBRO_CENTRAL_API_URL = 'http://localhost:5001';
const TIKTOK_USER_TO_TEST = '@oraculo_vidente';
const CLIENT_ID_TO_TEST = 'mNwEIDy9x-l4zhHOAAAC';

// Configuración de la llamada a la API
const apiConfig = {
  method: 'POST', // Cambiar a 'GET' si es necesario
  endpoint: '/connect-tiktok', // Endpoint que se presume está fallando
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer simulated-token-for-testing', // Ejemplo de cabecera de autenticación
  },
  payload: {
    clientId: CLIENT_ID_TO_TEST,
    tiktokUser: TIKTOK_USER_TO_TEST,
  },
};

// --- Función de Diagnóstico ---
async function diagnoseApiCall() {
  const baseUrl = process.env.CEREBRO_CENTRAL_API_URL;
  const healthUrl = `${baseUrl}/health`;
  const fullUrl = `${baseUrl}${apiConfig.endpoint}`;

  console.log('--- Iniciando Diagnóstico de Conexión con Cerebro Central ---');
  console.log(`[INFO] URL Base: ${baseUrl}`);
  console.log(`[INFO] Endpoint de Health Check: ${healthUrl}`);
  console.log(`[INFO] Endpoint de Conexión: ${fullUrl}`);
  console.log(`[INFO] Método HTTP: ${apiConfig.method}`);
  console.log('[INFO] Cabeceras Enviadas:', JSON.stringify(apiConfig.headers, null, 2));
  console.log('[INFO] Payload Enviado:', JSON.stringify(apiConfig.payload, null, 2));
  console.log('----------------------------------------------------------');

  try {
    console.log('[ATTEMPT] Verificando estado del servicio...');
    try {
      const healthResponse = await axios.get(healthUrl, { timeout: 2000 });
      if (healthResponse.status === 200) {
        console.log('[SUCCESS] Health check exitoso. El servicio está en línea.');
      } else {
        console.error(`[ERROR] Health check devolvió un estado inesperado: ${healthResponse.status}`);
        return;
      }
    } catch (error) {
      console.error('[ERROR] Falló el Health Check. El servicio no está disponible o hay un problema de red.');
      return;
    }
  
    console.log('[ATTEMPT] Realizando la solicitud a la API...');
      const response = await axios({
        method: apiConfig.method,
        url: fullUrl,
      headers: apiConfig.headers,
      data: apiConfig.payload,
      timeout: 5000, // Timeout de 5 segundos
    });

    console.log('[SUCCESS] ¡Conexión exitosa!');
    console.log(`[INFO] Código de Estado: ${response.status}`);
    console.log('[INFO] Respuesta Recibida:', response.data);

  } catch (error) {
    console.error('[ERROR] La solicitud a la API falló.');
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error(`[DIAGNOSIS] Código de Estado: ${error.response.status}`);
      console.error('[DIAGNOSIS] Respuesta del Servidor:', error.response.data);
      if (error.response.status === 404) {
        console.error(`[DIAGNOSIS] Causa Probable (Error 404):`);
        console.error(`  1. La URL del endpoint '${apiConfig.endpoint}' es incorrecta.`);
        console.error(`  2. El método HTTP esperado por la API no es '${apiConfig.method}'.`);
        console.error(`  3. El servicio "Cerebro Central" no se está ejecutando o no es accesible en '${baseUrl}'.`);
      }
    } else if (error.request) {
      // La solicitud se hizo pero no se recibió respuesta
      console.error('[DIAGNOSIS] No se recibió respuesta del servidor.');
      console.error(`[DIAGNOSIS] Causa Probable:`);
      console.error(`  1. El servicio "Cerebro Central" no se está ejecutando en '${baseUrl}'.`);
      console.error(`  2. Hay un problema de red o un firewall bloqueando la conexión.`);
    } else {
      // Ocurrió un error al configurar la solicitud
      console.error('[DIAGNOSIS] Error al configurar la solicitud:', error.message);
    }
  } finally {
    console.log('--- Diagnóstico Finalizado ---');
  }
}

// Ejecutar el diagnóstico
diagnoseApiCall();