const GameState = require('../models/GameState');
const TikTokHandler = require('./TikTokHandler');
const PresalaHandler = require('./PresalaHandler');
const axios = require('axios');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.gameState = new GameState();
    this.tikTokHandler = new TikTokHandler(this.gameState);
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
    
    // Bucle de juego unificado
    this.gameLoopInterval = setInterval(() => {
      this.update();
    }, 1000 / 60); // 60 FPS
  }

  setupSocketEvents() {
    this.io.on('connection', (socket) => {
      console.log(`Cliente conectado: ${socket.id}`);
      
      socket.emit('gameState', this.gameState.getState());
      socket.emit('presalaState', this.gameState.presala);
      
      socket.on('spawnEnemy', (data) => {
        console.log(`Spawning enemy: ${data.enemyType} en lane ${data.laneId}`);
        this.gameState.createEnemy(data.laneId, data.enemyType || 'basic');
      });
      
      socket.on('shootBullet', (laneId) => {
        console.log(`Shooting bullet en lane ${laneId}`);
        this.gameState.shootBullet(laneId);
      });
      
      socket.on('shootAllBullets', () => {
        console.log('Shooting all bullets');
        this.gameState.shootAllBullets();
      });
      
      socket.on('startWaves', () => {
        console.log('Starting waves');
        this.gameState.startWaves();
      });
      
      socket.on('pauseWaves', () => {
        console.log('Pausing waves');
        this.gameState.pauseWaves();
      });
      
      socket.on('stopWaves', () => {
        console.log('Stopping waves');
        this.gameState.stopWaves();
      });
      
      socket.on('forceNextWave', () => {
        console.log('Forcing next wave');
        this.gameState.forceNextWave();
      });

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
      
      socket.on('startPresala', () => {
        console.log('Starting presala');
        this.startPresala();
      });

      socket.on('stopPresala', () => {
        console.log('Stopping presala');
        this.stopPresala();
      });

      socket.on('resetPresala', () => {
        console.log('Resetting presala');
        this.resetPresala();
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
        // Lógica centralizada en GameState para manejar la asignación de equipos
        this.gameState.assignUserToTeam(userId, teamName);
      });

      socket.on('connect-tiktok', async ({ tiktokUser }) => {
        console.log(`Recibida solicitud para conectar con @${tiktokUser}. Enviando al Cerebro Central...`);
        try {
          await axios.post(`${this.centralBrainUrl}/connect-tiktok`, { tiktokUser });
          console.log(`Solicitud de conexión para @${tiktokUser} enviada correctamente al Cerebro Central.`);
          // Opcional: notificar al admin que la solicitud fue enviada.
          socket.emit('tiktok-connection-pending', { message: `Solicitud para conectar con @${tiktokUser} enviada.` });
        } catch (error) {
          console.error(`Error al enviar la solicitud de conexión al Cerebro Central: ${error.message}`);
          // Notificar al admin sobre el error.
          socket.emit('tiktok-error', { message: 'No se pudo comunicar con el Cerebro Central.' });
        }
      });
      
      socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`);
      });

     // --- EVENTOS DE ADMINISTRADOR ---
     socket.on('admin:setEnergy', (data) => {
       this.tikTokHandler.handleAdminEvent('admin:setEnergy', data);
     });
    });
  }

  startPresala() {
    if (this.gameState.presala.isActive) return;
    
    this.gameState.presala.isActive = true;
    this.gameState.presala.timeLeft = this.gameState.presala.maxTime;
    this.lastPresalaTimeUpdate = Date.now();
    
    this.io.emit('presalaStarted');
    console.log('Presala iniciada');
  }

  stopPresala(isReset = false) {
    if (!this.gameState.presala.isActive) return;
    
    this.gameState.presala.isActive = false;
    this.endPresala(isReset);
  }

  resetPresala() {
    this.gameState.presala.isActive = false;
    this.gameState.presala.teams = {};
    this.gameState.presala.userTeam = {};
    this.gameState.presala.timeLeft = this.gameState.presala.maxTime;
    
    this.io.emit('presalaReset');
    console.log('Presala reseteada y evento emitido a los clientes.');
  }

  endPresala(isReset = false) {
    this.gameState.presala.isActive = false;

    if (isReset) {
      console.log("Fin de presala por reseteo, no se calculan resultados.");
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
    console.log('Presala terminada. Clasificados:', teams);

    // Reiniciar el estado del juego principal
    this.gameState.stopWaves();

    // Asignar equipos a las lanes
    teams.forEach((team, index) => {
      if (index < this.gameState.lanes.length) {
        this.gameState.lanes[index].team = team.name;
      }
    });

    // Ya no se inicia automáticamente, se hará desde el panel de admin.
    console.log('Transición a juego principal preparada. Esperando inicio manual.');
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

      // Comprobar si 4 equipos han clasificado
      const classifiedCount = Object.values(this.gameState.presala.teams).filter(team => team.points >= 1000).length;

      if (this.gameState.presala.timeLeft <= 0 || classifiedCount >= 4) {
        this.gameState.presala.timeLeft = 0;
        this.endPresala();
      }
    }

    // Actualizar lógica del juego principal (si está activo)
    if (this.gameState.waveSystem.isActive) {
        this.gameState.updateGame();
    }

    // Emitir estados
    this.broadcastGameState();
    this.broadcastPresalaState();
  }

  broadcastGameState() {
    this.io.emit('gameState', this.gameState.getState());
  }

  broadcastPresalaState() {
    this.io.emit('presalaState', this.getPresalaState());
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
    this.gameState.stopWaves();
  }
}

module.exports = SocketHandler;