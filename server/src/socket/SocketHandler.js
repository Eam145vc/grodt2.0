const GameState = require('../models/GameState');
const TikTokHandler = require('./TikTokHandler');
const PresalaHandler = require('./PresalaHandler');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.gameState = new GameState();
    this.tikTokHandler = new TikTokHandler(this.gameState);
    this.presalaHandler = new PresalaHandler(this.gameState);
    this.setupSocketEvents();
    
    // Enviar estado inicial cada 100ms
    this.gameStateInterval = setInterval(() => {
      this.broadcastGameState();
    }, 100);
  }

  setupSocketEvents() {
    this.io.on('connection', (socket) => {
      console.log(`Cliente conectado: ${socket.id}`);
      
      // Enviar estado actual al cliente recién conectado
      socket.emit('gameState', this.gameState.getState());
      
      // Evento: Spawn manual de enemigo
      socket.on('spawnEnemy', (data) => {
        console.log(`Spawning enemy: ${data.enemyType} en lane ${data.laneId}`);
        this.gameState.createEnemy(data.laneId, data.enemyType || 'basic');
      });
      
      // Evento: Disparar bala
      socket.on('shootBullet', (laneId) => {
        console.log(`Shooting bullet en lane ${laneId}`);
        this.gameState.shootBullet(laneId);
      });
      
      // Evento: Disparar todas las balas
      socket.on('shootAllBullets', () => {
        console.log('Shooting all bullets');
        this.gameState.shootAllBullets();
      });
      
      // Evento: Iniciar oleadas
      socket.on('startWaves', () => {
        console.log('Starting waves');
        this.gameState.startWaves();
      });
      
      // Evento: Pausar oleadas
      socket.on('pauseWaves', () => {
        console.log('Pausing waves');
        this.gameState.pauseWaves();
      });
      
      // Evento: Detener oleadas
      socket.on('stopWaves', () => {
        console.log('Stopping waves');
        this.gameState.stopWaves();
      });
      
      // Evento: Forzar siguiente oleada
      socket.on('forceNextWave', () => {
        console.log('Forcing next wave');
        this.gameState.forceNextWave();
      });

      // SOLO AGREGUÉ ESTOS 3 EVENTOS NUEVOS
      socket.on('spawnTurret', (laneId) => {
        console.log(`Spawning turret en lane ${laneId}`);
        this.gameState.spawnTurret(laneId);
      });
      
      socket.on('spawnFreezeBall', (laneId) => {
        console.log(`Spawning freeze ball en lane ${laneId}`);
        this.gameState.spawnFreezeBall(laneId);
      });
      
      socket.on('activateDoubleBullets', (laneId) => {
        console.log(`Activating double bullets en lane ${laneId}`);
        this.gameState.activateDoubleBullets(laneId);
      });
      
      // Evento: Recibir acción desde el Cerebro Central de TikTok
      socket.on('tiktok-event', ({ event_type, data }) => {
        this.tikTokHandler.handleEvent(event_type, data);
      });

      // Evento: Añadir monedas a un carril (simulado desde el panel de admin)
      socket.on('addCoins', ({ laneId, amount }) => {
        // Simulamos un evento de tipo 'addCoins' para que lo procese el TikTokHandler
        this.tikTokHandler.handleEvent('addCoins', {
          user: `admin_user_${laneId}`, // Un usuario de prueba para cada carril
          amount: amount,
          lane: laneId
        });
      });

      // Evento: Unirse a un equipo de la presala
      socket.on('join-team', ({ userId, teamName }) => {
        this.presalaHandler.handleJoinTeam(userId, teamName);
      });
      
      // Evento: Desconexión
      socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`);
      });
    });
  }

  broadcastGameState() {
    this.io.emit('gameState', this.gameState.getState());
  }

  getServerStats() {
    return {
      connectedClients: this.io.engine.clientsCount,
      gameState: this.gameState.getState(),
      timestamp: new Date().toISOString()
    };
  }

  destroy() {
    if (this.gameStateInterval) {
      clearInterval(this.gameStateInterval);
    }
    this.gameState.stopWaves();
  }
}

module.exports = SocketHandler;