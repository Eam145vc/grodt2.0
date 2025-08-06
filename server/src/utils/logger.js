const pino = require('pino');

// Configuración para desarrollo: logs legibles y coloridos.
const developmentLogger = pino({
  level: 'debug', // Muestra todos los logs desde debug hacia arriba
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
});

// Configuración para producción: logs en formato JSON para eficiencia.
const productionLogger = pino({
  level: 'info', // En producción, solo logs desde info hacia arriba
});

// Exportar el logger apropiado según el entorno.
// Si no se especifica NODE_ENV, se asume 'development'.
const logger = process.env.NODE_ENV === 'production' ? productionLogger : developmentLogger;

module.exports = logger;