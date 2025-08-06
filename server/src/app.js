const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const SocketHandler = require('./socket/SocketHandler');
const logger = require('./utils/logger');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Configuración de CORS para Socket.IO
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5001", "http://localhost:5004"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5001", "http://localhost:5004"],
  credentials: true
}));
app.use(express.json());

// Servir himnos estáticos
app.use(
  '/himnos_latam',
  express.static(path.join(__dirname, '../../himnos_latam'))
);

// Rutas básicas
app.get('/', (req, res) => {
  res.json({ 
    message: 'Tower Defense Server corriendo correctamente',
    timestamp: new Date().toISOString(),
    connectedClients: io.engine.clientsCount
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connectedClients: io.engine.clientsCount
  });
});

// Endpoint para obtener la configuración de los regalos
app.get('/api/gift-config', (req, res) => {
  try {
    const configPath = path.join(__dirname, 'config', 'gift-config.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    res.json(JSON.parse(configData));
  } catch (error) {
    logger.error('Error al leer gift-config.json:', error);
    res.status(500).json({ error: 'No se pudo cargar la configuración de regalos.' });
  }
});

// Inicializar el handler de sockets
const socketHandler = new SocketHandler(io);

// Ruta para obtener estadísticas del juego
app.get('/stats', (req, res) => {
  res.json(socketHandler.getServerStats());
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`🚀 Servidor Tower Defense corriendo en puerto ${PORT}`);
  logger.info(`📊 Panel Admin: http://localhost:5004/admin`);
  logger.info(`🎮 Juego: http://localhost:5004/game`);
  logger.info(`📈 Stats: http://localhost:${PORT}/stats`);
});

// Manejo de errores
process.on('unhandledRejection', (err) => {
  logger.error({ err }, '❌ Unhandled Promise Rejection:');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, '❌ Uncaught Exception:');
  process.exit(1);
});

// Cleanup al cerrar el servidor
process.on('SIGTERM', () => {
  logger.info('🛑 Cerrando servidor...');
  socketHandler.destroy();
  server.close(() => {
    logger.info('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('🛑 Cerrando servidor...');
  socketHandler.destroy();
  server.close(() => {
    logger.info('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});