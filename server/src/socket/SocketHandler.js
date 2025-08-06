const GameState = require('../models/GameState');
const logger = require('../utils/logger');
const StatsStorage = require('../models/StatsStorage');
const TeamStorage = require('../models/TeamStorage');
const TikTokHandler = require('./TikTokHandler');
const PresalaHandler = require('./PresalaHandler');
const axios = require('axios');
const { normalizeString, removeEmojis, flagToCountryMap } = require('../utils/textUtils');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.gameState = new GameState();
    this.tikTokHandler = new TikTokHandler(this.gameState, this.io, this);
    this.presalaHandler = new PresalaHandler(this.gameState);
    this.centralBrainUrl = process.env.CENTRAL_BRAIN_URL || 'http://localhost:5001';
    this.setupSocketEvents();
    
    // El estado de la presala ahora se gestiona directamente en GameState.
    // this.presalaState = {
    //   isActive: false,
    //   timeLeft: 180,
    //   maxTime: 180,
    //   lastTimeUpdate: null,
    // };
    this.lastPresalaTimeUpdate = null; // Usaremos esto para el cálculo de delta
    this.resetTimer = null; // Para el reinicio automático
    
    // Bucle de juego unificado
    this.gameLoopInterval = setInterval(() => {
      this.update();
    }, 1000 / 60); // 60 FPS
  }

  setupSocketEvents() {
    this.io.on('connection', (socket) => {
      logger.info(`Cliente conectado: ${socket.id}`);
      
      socket.emit('gameState', this.gameState.getState());
      socket.emit('presalaState', this.gameState.presala);
      
      socket.on('spawnEnemy', (data) => {
        logger.debug(`Spawning enemy: ${data.enemyType} en lane ${data.laneId}`);
        this.gameState.createEnemy(data.laneId, data.enemyType || 'basic');
      });
      
      socket.on('shootBullet', (laneId) => {
        logger.debug(`Shooting bullet en lane ${laneId}`);
        this.gameState.shootBullet(laneId);
      });
      
      socket.on('shootAllBullets', () => {
        logger.debug('Shooting all bullets');
        this.gameState.shootAllBullets();
      });
      
      socket.on('startWaves', () => {
        logger.info('Starting waves');
        this.gameState.startWaves();
      });
      
      socket.on('pauseWaves', () => {
        logger.info('Pausing waves');
        this.gameState.pauseWaves();
      });
      
      socket.on('stopWaves', () => {
        logger.warn('Stopping waves by admin request');
        this.fullReset(); // Forzar un reseteo completo desde el admin
      });
      
      socket.on('forceNextWave', () => {
        logger.info('Forcing next wave');
        this.gameState.forceNextWave();
      });

      socket.on('spawnTurret', (laneId) => {
        logger.debug(`Spawning turret en lane ${laneId}`);
        this.gameState.spawnTurret(laneId);
      });
      
      socket.on('spawnFreezeBall', (laneId) => {
        logger.debug(`Spawning freeze ball en lane ${laneId}`);
        this.gameState.spawnFreezeBall(laneId);
      });
      
      
      socket.on('startPresala', () => {
        logger.info('Admin starting presala');
        this.startPresala();
      });

      socket.on('stopPresala', () => {
        logger.info('Admin stopping presala');
        this.stopPresala();
      });

      socket.on('resetPresala', () => {
        logger.warn('Admin resetting presala');
        this.fullReset();
      });
      
      socket.on('tiktok-event', ({ event_type, data }) => {
        this.tikTokHandler.handleEvent(event_type, data);
      });

      socket.on('addCoins', ({ laneId, amount }) => {
        this.tikTokHandler.handleEvent('addCoins', {
          user: `admin_user_${laneId}`,
          amount: amount,
          lane: laneId
        });
      });

      socket.on('join-team', ({ userId, teamName }) => {
        const raw = (teamName || '').toString();
        const trimmed = raw.trim();
        // Eliminar posibles selectores de variación (e.g. U+FE0F) para emojis de bandera
        const stripped = trimmed.replace(/[\uFE0E\uFE0F]/g, '');
        const flagKey = flagToCountryMap[stripped];
        const teamKey = flagKey || normalizeString(removeEmojis(stripped));
        this.gameState.assignUserToTeam(userId, teamKey);
      });

      socket.on('connect-tiktok', ({ tiktokUser }) => {
        logger.info(`Recibida solicitud para conectar con @${tiktokUser}. Emitiendo evento de socket...`);
        // El Cerebro Central está conectado al servidor del juego a través de un socket.
        // Emitimos un evento directamente a través de ese socket.
        this.io.emit('connect-tiktok', { tiktokUser });
        
        // Notificar al admin que la solicitud fue enviada.
        socket.emit('tiktok-connection-pending', { message: `Solicitud para conectar con @${tiktokUser} enviada.` });
      });
      
      socket.on('disconnect', () => {
        logger.info(`Cliente desconectado: ${socket.id}`);
      });

     // --- EVENTOS DE ADMINISTRADOR ---
     socket.on('admin:setEnergy', (data) => {
       this.tikTokHandler.handleAdminEvent('admin:setEnergy', data);
     });

     socket.on('admin:updatePresalaConfig', (data) => {
       this.gameState.updatePresalaConfig(data.time, data.points);
     });

     socket.on('getStats', () => {
       socket.emit('statsUpdate', StatsStorage.getStats());
     });

     socket.on('admin:resetAllStats', () => {
       logger.warn('[ADMIN] Solicitud de reseteo total recibida.');
       const statsReset = StatsStorage.reset();
       const teamsReset = TeamStorage.reset();
       
       if (statsReset && teamsReset) {
         logger.info('[ADMIN] Estadísticas y equipos reseteados correctamente.');
         // Forzar actualización en todos los clientes conectados
         this.io.emit('statsUpdate', StatsStorage.getStats());
         this.fullReset(); // También resetea el estado del juego actual
       } else {
         logger.error('[ADMIN] Error durante el reseteo total.');
       }
     });
   });
 }

  startPresala() {
    if (this.gameState.presala.isActive) return;
    
    this.gameState.presala.isActive = true;
    this.gameState.presala.timeLeft = this.gameState.presala.maxTime;
    this.lastPresalaTimeUpdate = Date.now();
    
    this.io.emit('presalaStarted');
    logger.info('Presala iniciada');
  }

  stopPresala(isReset = false) {
    if (!this.gameState.presala.isActive) return;
    
    this.gameState.presala.isActive = false;
    this.io.emit('stopAudio'); // Detener cualquier audio en el cliente
    this.endPresala(isReset);
  }

  resetPresala() {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
    
    this.gameState.resetPresalaState();
    
    this.io.emit('presalaReset');
    this.io.emit('stopAudio'); // Detener cualquier audio en el cliente
    logger.info('Presala reseteada y evento emitido a los clientes.');
  }

  endPresala(isReset = false) {
    this.gameState.presala.isActive = false;

    if (isReset) {
      logger.info("Fin de presala por reseteo, no se calculan resultados.");
      return;
    }
    
    const teams = Object.entries(this.gameState.presala.teams)
      .map(([name, data]) => ({ name, points: data.points }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 4);
    
    const results = {
      classifiedPlayers: teams,
      totalTeams: Object.keys(this.gameState.presala.teams).length,
      duration: this.gameState.presala.maxTime - this.gameState.presala.timeLeft
    };
    
    this.io.emit('presalaEnded', results);
    logger.info({ classified: teams }, 'Presala terminada.');

    // Reiniciar el estado del juego principal
    this.gameState.stopWaves();

    // Asignar equipos a las lanes
    teams.forEach((team, index) => {
      if (index < this.gameState.lanes.length) {
        this.gameState.lanes[index].team = team.name;
      }
    });

    // Ya no se inicia automáticamente, se hará desde el panel de admin.
    logger.info('Transición a juego principal preparada. Esperando inicio manual.');
  }

  // Esta función ya no es necesaria aquí, TikTokHandler se encarga de la lógica de puntos.
  // handlePresalaEvent(eventType, data) { ... }

  getPresalaState() {
    const presalaState = this.gameState.presala;
    return {
      ...presalaState,
      timeLeft: Math.ceil(presalaState.timeLeft),
      teams: Object.fromEntries(
        Object.entries(presalaState.teams).map(([team, data]) => [
          team,
          { ...data, members: [...data.members] }
        ])
      ),
    };
  }

  update() {
    const now = Date.now();

    // Actualizar lógica de presala
    if (this.gameState.presala.isActive) {
      const deltaTime = (now - (this.lastPresalaTimeUpdate || now)) / 1000;
      this.gameState.presala.timeLeft -= deltaTime;
      this.lastPresalaTimeUpdate = now;

      // Actualizar rankings de equipos
      this.gameState.updateTeamRankings();

      // Comprobar si 4 equipos han clasificado
      const classifiedCount = Object.values(this.gameState.presala.teams).filter(team => team.points >= 1000).length;

      if (this.gameState.presala.timeLeft <= 0 || classifiedCount >= 4) {
        this.gameState.presala.timeLeft = 0;
        this.endPresala();
      }
    }

    // Actualizar lógica del juego principal (si está activo)
    if (this.gameState.waveSystem.isActive) {
        const wasGameOver = this.gameState.globalGameOver;
        this.gameState.updateGame();
        const isGameOver = this.gameState.globalGameOver;

        // Si el juego acaba de terminar, iniciar el temporizador de reinicio
        if (isGameOver && !wasGameOver) {
            logger.info('El juego ha terminado. Iniciando temporizador de reinicio automático de 2 minutos.');
            this.resetTimer = setTimeout(() => {
                logger.info('Reiniciando el juego automáticamente...');
                this.fullReset();
            }, 120000); // 2 minutos
        }
    }

    // Emitir estados
    this.broadcastGameState();
    this.broadcastPresalaState();
  }

  broadcastGameState() {
    this.io.emit('gameState', this.gameState.getState());
  }

  broadcastPresalaState() {
    const presalaState = this.getPresalaState();
    this.io.emit('presalaState', presalaState);

    // La lógica de interacción ha sido centralizada en TikTokHandler para asegurar
    // que los datos del avatar se envíen correctamente con cada evento.
    // Ya no es necesario este bloque de código.
  }

  getServerStats() {
    return {
      connectedClients: this.io.engine.clientsCount,
      gameState: this.gameState.getState(),
      presalaState: this.getPresalaState(),
      timestamp: new Date().toISOString()
    };
  }

  destroy() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
    this.gameState.stopWaves();
  }

  fullReset() {
    logger.warn('Ejecutando reinicio completo del juego y la presala.');
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
    this.gameState.stopWaves(true); // Reinicia el juego principal
    this.resetPresala(); // Reinicia la presala
  }
}

module.exports = SocketHandler;