const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const SocketHandler = require('./socket/SocketHandler');

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

// Inicializar el handler de sockets
const socketHandler = new SocketHandler(io);

// Ruta para obtener estadísticas del juego
app.get('/stats', (req, res) => {
  res.json(socketHandler.getServerStats());
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Servidor Tower Defense corriendo en puerto ${PORT}`);
  console.log(`📊 Panel Admin: http://localhost:5004/admin`);
  console.log(`🎮 Juego: http://localhost:5004/game`);
  console.log(`📈 Stats: http://localhost:${PORT}/stats`);
});

// Manejo de errores
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Cleanup al cerrar el servidor
process.on('SIGTERM', () => {
  console.log('🛑 Cerrando servidor...');
  socketHandler.destroy();
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Cerrando servidor...');
  socketHandler.destroy();
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});