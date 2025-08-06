const ENEMY_TYPES = {
  BASIC: {
    health: 5,
    speed: 1.5,
    size: 15,
    color: '#e74c3c',
    damage: 5,
    canShoot: false,
    shootInterval: 0,
    shootDamage: 0
  },
  MINI: {
    health: 2,
    speed: 3.5,
    size: 8,
    color: '#3498db',
    damage: 1,
    canShoot: false,
    shootInterval: 0,
    shootDamage: 0
  },
  SPECIAL1: {
    health: 10,
    speed: 1.0,
    size: 13,
    color: '#f39c12',
    damage: 15,
    canShoot: false,
    shootInterval: 0,
    shootDamage: 0
  },
  TANK: {
    health: 20,
    speed: 0.6,
    size: 22,
    color: '#8e44ad',
    damage: 25,
    canShoot: false,
    shootInterval: 0,
    shootDamage: 0
  },
  SNIPER: {
    health: 6,
    speed: 1,
    size: 16,
    color: '#e67e22',
    damage: 5,
    canShoot: true,
    shootInterval: 3000,
    shootDamage: 1
  },
  BOSS: {
    health: 30,
    speed: 0.7,
    size: 30,
    color: '#c0392b',
    damage: 30,
    canShoot: false,
    shootInterval: 0,
    shootDamage: 0
  }
};

const ENEMY_IMAGE_MAP = {
  basic: '/kim-jong-il.png',
  special1: '/maduro.png',
  tank: '/putin.png',
  boss: '/trump.png'
};

const logger = require('../utils/logger');
const TeamStorage = require('./TeamStorage');
const StatsStorage = require('./StatsStorage');

const ENERGY_CONFIG = {
  MAX_ENERGY: 1000,
  MIN_SHOTS_PER_SECOND: 2,
  MAX_SHOTS_PER_SECOND: 7,
  MIN_DRAIN_AMOUNT: 5,
  MAX_DRAIN_AMOUNT: 75,
  DRAIN_INTERVAL: 5000,
  OVERDRIVE_DURATION: 5000
};

class GameState {
  constructor() {
    this.lanes = [
      {
        id: 1,
        baseHealth: 100, 
        enemies: [],
        bullets: [],
        enemyProjectiles: [],
        turrets: [{ id: 'basic', x: 50, y: 470, type: 'basic' }],
        turretQueue: [],
        freezeBalls: [],
        freezeBallQueue: [],
        lastFreezeBallTime: 0,
        rapidFireTurretActive: false,
        rapidFireTurretEndTime: 0,
        rapidFireTurretQueue: [],
        currentRapidFireUser: null,
        coins: 0,
        energy: 0,
        lastShotTime: 0,
        lastRapidFireShotTime: 0,
        lastDrainTime: 0,
        overdriveStartTime: 0,
        isGameOver: false,
        team: null
      },
      {
        id: 2,
        baseHealth: 100,
        enemies: [],
        bullets: [],
        enemyProjectiles: [],
        turrets: [{ id: 'basic', x: 50, y: 470, type: 'basic' }],
        turretQueue: [],
        freezeBalls: [],
        freezeBallQueue: [],
        lastFreezeBallTime: 0,
        rapidFireTurretActive: false,
        rapidFireTurretEndTime: 0,
        rapidFireTurretQueue: [],
        currentRapidFireUser: null,
        coins: 0,
        energy: 0,
        lastShotTime: 0,
        lastRapidFireShotTime: 0,
        lastDrainTime: 0,
        overdriveStartTime: 0,
        isGameOver: false,
        team: null
      },
      {
        id: 3,
        baseHealth: 100,
        enemies: [],
        bullets: [],
        enemyProjectiles: [],
        turrets: [{ id: 'basic', x: 50, y: 470, type: 'basic' }],
        turretQueue: [],
        freezeBalls: [],
        freezeBallQueue: [],
        lastFreezeBallTime: 0,
        rapidFireTurretActive: false,
        rapidFireTurretEndTime: 0,
        rapidFireTurretQueue: [],
        currentRapidFireUser: null,
        coins: 0,
        energy: 0,
        lastShotTime: 0,
        lastRapidFireShotTime: 0,
        lastDrainTime: 0,
        overdriveStartTime: 0,
        isGameOver: false,
        team: null
      },
      {
        id: 4,
        baseHealth: 100,
        enemies: [],
        bullets: [],
        enemyProjectiles: [],
        turrets: [{ id: 'basic', x: 50, y: 470, type: 'basic' }],
        turretQueue: [],
        freezeBalls: [],
        freezeBallQueue: [],
        lastFreezeBallTime: 0,
        rapidFireTurretActive: false,
        rapidFireTurretEndTime: 0,
        rapidFireTurretQueue: [],
        currentRapidFireUser: null,
        coins: 0,
        energy: 0,
        lastShotTime: 0,
        lastRapidFireShotTime: 0,
        lastDrainTime: 0,
        overdriveStartTime: 0,
        isGameOver: false,
        team: null
      }
    ];
    
    this.waveSystem = {
      isActive: false,
      isPaused: false,
      currentWave: 0,
      timeRemaining: 15,
      maxTime: 15,
      waveInterval: null,
      spawnInterval: null
    };
    
    this.globalGameOver = false;
    this.winner = null;
    this.lastSurvivor = null; // Para recordar al último en pie
    this.enemyTypes = ENEMY_TYPES;
    this.gameLoop = null;
    this.lastTime = Date.now();
    
    // SOLO AGREGUÉ ESTO
    this.activePowerUps = {
      turrets: [],
      freezeBalls: [],
      rapidFireTurrets: []
    };

    this.presala = {
      isActive: false,
      timeLeft: 180,
      maxTime: 180,
      teams: {}, // { 'colombia': { points: 0, members: new Set() } }
      userTeam: {}, // { 'userId': 'colombia' }
      targetPoints: 1000, // Valor por defecto
      activeTeams: [],
      waitingTeams: []
    };
    
    this.loadInitialTeams();
    this.updateTeamRankings(); // Asegurar que los rankings iniciales se calculen

    this.eventLog = [];
    this.maxLogSize = 50; // Mantener un máximo de 50 eventos en el log
  }

  resetPresalaState() {
    this.presala.isActive = false;
    this.presala.teams = {};
    this.presala.userTeam = {};
    this.presala.timeLeft = this.presala.maxTime;
    
    this.loadInitialTeams();
    this.updateTeamRankings();
  }

  loadInitialTeams() {
      // Carga silenciosa para evitar spam en la consola al inicio
      // Sembrar todos los equipos permitidos incluso si no hay miembros
      const PRESALA_CONFIG = require('../config/presalaConfig');
      for (const team of PRESALA_CONFIG.ALLOWED_TEAMS) {
          this.presala.teams[team] = { points: 0, members: new Set() };
      }
      const storedTeams = TeamStorage.load();
      const teamCounts = {};

    for (const userId in storedTeams) {
        const teamName = storedTeams[userId];
        if (!this.presala.teams[teamName]) {
            this.presala.teams[teamName] = { points: 0, members: new Set() };
        }
        this.presala.teams[teamName].members.add(userId);
        
        // Contar miembros por equipo para el log
        if (!teamCounts[teamName]) {
            teamCounts[teamName] = 0;
        }
        teamCounts[teamName]++;
    }
    
    logger.info(`[GameState] Cargados ${Object.keys(storedTeams).length} usuarios en ${Object.keys(this.presala.teams).length} equipos desde el almacenamiento.`);
    logger.info({ teamCounts }, '[GameState] Resumen de equipos cargados.');
  }

  assignUserToTeam(userId, teamName) {
    const normalizedTeamName = teamName.toLowerCase();
    const PRESALA_CONFIG = require('../config/presalaConfig');

    if (!PRESALA_CONFIG.ALLOWED_TEAMS.includes(normalizedTeamName)) {
      logger.warn(`[GameState] Intento de unirse a un equipo no válido: ${teamName}. Ignorando.`);
      return;
    }

    const { teams } = this.presala;
    const oldTeam = TeamStorage.getTeam(userId);

    // Si el usuario ya estaba en un equipo, removerlo del set de miembros del equipo anterior
    if (oldTeam && teams[oldTeam]) {
        teams[oldTeam].members.delete(userId);
    }

    // Añadir al nuevo equipo
    if (!teams[normalizedTeamName]) {
      teams[normalizedTeamName] = {
        points: 0,
        members: new Set()
      };
    }
    teams[normalizedTeamName].members.add(userId);
    
    // La única fuente de verdad es TeamStorage
    TeamStorage.setTeam(userId, normalizedTeamName);
    logger.info(`[GameState] Usuario ${userId} asignado al equipo ${normalizedTeamName} en TeamStorage.`);
  }

  updatePresalaConfig(time, points) {
    if (time !== undefined) {
      this.presala.maxTime = time;
      if (!this.presala.isActive) {
        this.presala.timeLeft = time;
      }
    }
    if (points !== undefined) {
      // Esta es una solución simple. Una solución más compleja podría
      // reevaluar los equipos clasificados si se cambia este valor a mitad de la presala.
      this.presala.targetPoints = points;
    }
    logger.info(`[GameState] Configuración de presala actualizada: Tiempo=${this.presala.maxTime}s, Puntos=${this.presala.targetPoints}`);
  }

  addEventToLog(message) {
    const timestamp = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const event = {
      id: Date.now() + Math.random(),
      timestamp,
      message
    };
    this.eventLog.unshift(event); // Añadir al principio para que los nuevos aparezcan arriba
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.pop(); // Eliminar el más antiguo si se supera el tamaño
    }
  }

  updateTeamRankings() {
    const allTeams = Object.entries(this.presala.teams).map(([name, data]) => ({
      id: name,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      points: data.points,
      members: data.members.size
    }));

    allTeams.sort((a, b) => b.points - a.points);

    this.presala.activeTeams = allTeams.slice(0, 4);
    this.presala.waitingTeams = allTeams.slice(4);
  }

  // SOLO AGREGUÉ ESTOS 3 MÉTODOS NUEVOS
  spawnTurret(laneId, user) {
    const lane = this.lanes.find(l => l.id === laneId);
    if (!lane || lane.isGameOver) return;

    lane.turretQueue.push(user);
  }

  spawnFreezeBall(laneId) {
    const lane = this.lanes.find(l => l.id === laneId);
    if (!lane || lane.isGameOver) return;

    // En lugar de spawnear directamente, la añadimos a la cola
    lane.freezeBallQueue.push({});
    logger.debug(`[GameState] Bola de Hielo añadida a la cola del carril ${laneId}. Total en cola: ${lane.freezeBallQueue.length}`);
  }

  addRapidFireToQueue(laneId, user) {
    const lane = this.lanes.find(l => l.id === laneId);
    if (!lane || lane.isGameOver) return;

    lane.rapidFireTurretQueue.push(user);
  }

  addCoins(laneId, amount) {
    const lane = this.lanes.find(l => l.id === laneId);
    if (lane) {
      lane.coins += amount;
    }
  }

  updateEnergyAndShooting(lane, currentTime) {
    // 1. Drenaje de Energía
    if (currentTime - lane.lastDrainTime > ENERGY_CONFIG.DRAIN_INTERVAL) {
      const energyRatio = lane.energy / ENERGY_CONFIG.MAX_ENERGY;
      let drainAmount = ENERGY_CONFIG.MIN_DRAIN_AMOUNT +
                        (ENERGY_CONFIG.MAX_DRAIN_AMOUNT - ENERGY_CONFIG.MIN_DRAIN_AMOUNT) * energyRatio;

      // Regla especial: no hay drenaje durante los primeros segundos de energía máxima
      if (lane.energy === ENERGY_CONFIG.MAX_ENERGY) {
        if (lane.overdriveStartTime === 0) {
          lane.overdriveStartTime = currentTime;
        }
        if (currentTime - lane.overdriveStartTime < ENERGY_CONFIG.OVERDRIVE_DURATION) {
          drainAmount = 0;
        }
      } else {
        lane.overdriveStartTime = 0;
      }
      
      lane.energy = Math.max(0, lane.energy - drainAmount);
      lane.lastDrainTime = currentTime;
    }

    // 2. Lógica de Disparo
    if (lane.energy > ENERGY_CONFIG.MAX_ENERGY) lane.energy = ENERGY_CONFIG.MAX_ENERGY;

    const energyRatio = lane.energy / ENERGY_CONFIG.MAX_ENERGY;
    const shotsPerSecond = ENERGY_CONFIG.MIN_SHOTS_PER_SECOND +
                         (ENERGY_CONFIG.MAX_SHOTS_PER_SECOND - ENERGY_CONFIG.MIN_SHOTS_PER_SECOND) * energyRatio;

    const cooldown = 1000 / shotsPerSecond;
    if (currentTime - lane.lastShotTime > cooldown) {
      this.shootBullet(lane.id, false); // Disparo de la torreta básica
      lane.lastShotTime = currentTime;
    }

    // Lógica de disparo para la torreta de fuego rápido
    if (lane.rapidFireTurretActive) {
      const rapidFireCooldown = 100; // Máxima velocidad
      if (currentTime - lane.lastRapidFireShotTime > rapidFireCooldown) {
        this.shootBullet(lane.id, true); // Disparo de la torreta de fuego rápido
        lane.lastRapidFireShotTime = currentTime;
      }
    }
  }

  // MANTUVE TODO LO ORIGINAL Y SOLO AGREGUÉ POWER-UPS AL updateGame
  createEnemy(laneId, enemyType = 'basic', avatarBase64 = null) {
    const lane = this.lanes.find(l => l.id === laneId);
    if (!lane || lane.isGameOver) return null;

    const typeKey = enemyType.toUpperCase();
    const enemyConfig = ENEMY_TYPES[typeKey] || ENEMY_TYPES.BASIC;
    
    const enemy = {
      id: Date.now() + Math.random(),
      laneId: laneId,
      type: enemyType,
      x: Math.random() * 80 + 10, // Posición X aleatoria dentro del carril (10 a 90)
      y: -Math.random() * 50 - 15, // Posición Y inicial aleatoria y negativa
      health: enemyConfig.health,
      maxHealth: enemyConfig.health,
      speed: enemyConfig.speed,
      damage: enemyConfig.damage,
      image: avatarBase64 || ENEMY_IMAGE_MAP[enemyType] || null, // Asignar avatar o imagen de oleada
      alive: true,
      lastShoot: Date.now(),
      canShoot: enemyConfig.canShoot,
      shootInterval: enemyConfig.shootInterval,
      shootDamage: enemyConfig.shootDamage,
      frozen: false,
      frozenEndTime: 0,
      originalSpeed: enemyConfig.speed,
      justUnfrozen: false
    };

    lane.enemies.push(enemy);
    return enemy;
  }

  createEnemyBatch(laneId, enemyType = 'basic', count = 1, avatarBase64 = null) {
    const lane = this.lanes.find(l => l.id === laneId);
    if (!lane || lane.isGameOver) return;

    const typeKey = enemyType.toUpperCase();
    const enemyConfig = ENEMY_TYPES[typeKey] || ENEMY_TYPES.BASIC;
    
    let enemiesSpawned = 0;
    const spawnInterval = setInterval(() => {
      if (enemiesSpawned >= count || lane.isGameOver) {
        clearInterval(spawnInterval);
        return;
      }

      const enemy = {
        id: Date.now() + Math.random() + enemiesSpawned,
        laneId: laneId,
        type: enemyType,
        x: Math.random() * 80 + 10,
        y: -Math.random() * 50 - 15,
        health: enemyConfig.health,
        maxHealth: enemyConfig.health,
        speed: enemyConfig.speed,
        damage: enemyConfig.damage,
        image: avatarBase64 || ENEMY_IMAGE_MAP[enemyType] || null,
        alive: true,
        lastShoot: Date.now(),
        canShoot: enemyConfig.canShoot,
        shootInterval: enemyConfig.shootInterval,
        shootDamage: enemyConfig.shootDamage,
        frozen: false,
        frozenEndTime: 0,
        originalSpeed: enemyConfig.speed,
        justUnfrozen: false
      };
      
      lane.enemies.push(enemy);
      enemiesSpawned++;

    }, 500);
  }

  shootBullet(laneId, isRapidFire) {
    const lane = this.lanes.find(l => l.id === laneId);
    if (!lane || lane.isGameOver) return;

    const closestEnemy = lane.enemies
      .filter(enemy => enemy.alive)
      .reduce((closest, enemy) => {
        return !closest || enemy.y > closest.y ? enemy : closest;
      }, null);

    if (!closestEnemy) return;

    let bulletX = 50;
    if (isRapidFire) {
      bulletX = 35; // Posición de la torreta de fuego rápido (izquierda)
    } else if (lane.rapidFireTurretActive) {
      bulletX = 65; // Posición ajustada de la torreta básica (derecha)
    }

    lane.bullets.push({
      id: Date.now() + Math.random(),
      x: bulletX,
      y: 500,
      targetY: closestEnemy.y,
      speed: 8,
      damage: 1,
      alive: true,
      fromTurret: true,
      isRapidFire: isRapidFire,
      avatarBase64: isRapidFire ? lane.currentRapidFireUser?.avatarBase64 : null
    });
  }

  shootAllBullets() {
    this.lanes.forEach(lane => {
      if (!lane.isGameOver) {
        this.shootBullet(lane.id);
      }
    });
  }

  updateGame() {
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // SOLO AGREGUÉ ESTA FUNCIÓN
    this.updatePowerUps();

    this.lanes.forEach(lane => {
      if (lane.isGameOver) return;

      // MANTUVE TODO ORIGINAL - Solo agregué verificación de congelamiento
      lane.enemies = lane.enemies.filter(enemy => {
        if (!enemy.alive) return false;

        // SOLO AGREGUÉ ESTO
        if (!enemy.frozen) {
          enemy.y += enemy.speed;
        }

        if (enemy.y >= 500) {
          lane.baseHealth -= enemy.damage;
          enemy.alive = false;
          
          if (lane.baseHealth <= 0) {
            lane.baseHealth = 0;
            lane.isGameOver = true;
          }
          return false;
        }

        if (enemy.canShoot && currentTime - enemy.lastShoot >= enemy.shootInterval) {
          const projectile = {
            id: Date.now() + Math.random(),
            x: 50,
            y: enemy.y,
            speed: 4,
            damage: enemy.shootDamage,
            alive: true
          };
          lane.enemyProjectiles.push(projectile);
          enemy.lastShoot = currentTime;
        }

        return true;
      });

      // TODO LO DEMÁS SE MANTIENE ORIGINAL
      lane.bullets = lane.bullets.filter(bullet => {
        if (!bullet.alive) return false;

        bullet.y -= bullet.speed;

        let hit = false;
        lane.enemies.forEach(enemy => {
          if (enemy.alive && Math.abs(bullet.y - enemy.y) < 20) {
            enemy.health -= bullet.damage;
            bullet.alive = false;
            hit = true;

            if (enemy.health <= 0) {
              enemy.alive = false;
            }
          }
        });

        return !hit && bullet.y > 0;
      });

      lane.enemyProjectiles = lane.enemyProjectiles.filter(projectile => {
        if (!projectile.alive) return false;

        projectile.y += projectile.speed;

        if (projectile.y >= 500) {
          lane.baseHealth -= projectile.damage;
          projectile.alive = false;
          
          if (lane.baseHealth <= 0) {
            lane.baseHealth = 0;
            lane.isGameOver = true;
          }
          return false;
        }

        return projectile.y < 520;
      });
    });

    this.checkGameOver();
  }

  // SOLO AGREGUÉ ESTA FUNCIÓN
  updatePowerUps() {
    const currentTime = Date.now();
    
    this.lanes.forEach(lane => {
      // Lógica de Drenaje y Disparo por Energía
      this.updateEnergyAndShooting(lane, currentTime);

      this.updateTurrets(lane, currentTime);
      this.updateFreezeBalls(lane, currentTime);

      // La lógica de torretas de power-up ya no es necesaria aquí
      lane.turrets = lane.turrets.filter(turret => {
        if (currentTime > turret.endTime) {
          turret.alive = false;
          return false;
        }

        const closestEnemy = lane.enemies
          .filter(enemy => enemy.alive)
          .reduce((closest, enemy) => {
            return !closest || enemy.y > closest.y ? enemy : closest;
          }, null);

        if (closestEnemy) {
          // CAMBIO: La torreta se mueve instantáneamente (velocidad máxima)
          // y siempre se posiciona 80 píxeles debajo del enemigo más cercano
          const targetY = Math.min(420, Math.max(100, closestEnemy.y + 80));
          turret.y = targetY;
        }

        // CAMBIO: Disparar cada 1 segundo (era 2 segundos) si hay enemigo
        if (currentTime - turret.lastShoot >= 1000 && closestEnemy) {
          const bullet = {
            id: Date.now() + Math.random(),
            x: turret.x,
            y: turret.y,
            targetY: closestEnemy.y,
            speed: 8,
            damage: 1,
            alive: true,
            fromTurret: true,
            type: turret.type === 'intelligent' ? 'intelligent' : 'basic'
          };
          lane.bullets.push(bullet);
          turret.lastShoot = currentTime;
        }

        return true;
      });

      // Actualizar bolas de hielo
      lane.freezeBalls = lane.freezeBalls.filter(freezeBall => {
        freezeBall.y -= freezeBall.speed;
        
        lane.enemies.forEach(enemy => {
          if (enemy.alive && !freezeBall.affectedEnemies.includes(enemy.id)) {
            const distance = Math.sqrt(
              Math.pow(freezeBall.x - 50, 2) + Math.pow(freezeBall.y - enemy.y, 2)
            );
            
            if (distance < 25) {
              enemy.frozen = true;
              enemy.frozenEndTime = currentTime + freezeBall.freezeTime;
              enemy.originalSpeed = enemy.speed;
              enemy.speed = 0;
              freezeBall.affectedEnemies.push(enemy.id);
            }
          }
        });

        return freezeBall.y > -50;
      });

      if (lane.rapidFireTurretActive && currentTime > lane.rapidFireTurretEndTime) {
        lane.rapidFireTurretActive = false;
        lane.currentRapidFireUser = null;
      }

      if (!lane.rapidFireTurretActive && lane.rapidFireTurretQueue.length > 0) {
        const nextUser = lane.rapidFireTurretQueue.shift();
        lane.rapidFireTurretActive = true;
        lane.rapidFireTurretEndTime = currentTime + nextUser.duration;
        lane.currentRapidFireUser = nextUser;
      }

      // Actualizar enemigos congelados
      lane.enemies.forEach(enemy => {
        if (enemy.frozen && currentTime > enemy.frozenEndTime) {
          enemy.frozen = false;
          enemy.speed = enemy.originalSpeed;
          enemy.justUnfrozen = true;
          
          setTimeout(() => {
            enemy.justUnfrozen = false;
          }, 500);
        }
      });
    });

    // Limpiar power-ups activos expirados
    this.activePowerUps.turrets = this.activePowerUps.turrets.filter(p => currentTime < p.endTime);
    this.activePowerUps.rapidFireTurrets = this.activePowerUps.rapidFireTurrets.filter(p => currentTime < p.endTime);
  }

  updateTurrets(lane, currentTime) {
    // Activar torretas de la cola si hay espacio
    if (lane.turretQueue.length > 0 && lane.turrets.length < 3) { // Máximo 2 torretas + la básica
      const user = lane.turretQueue.shift();
      
      // Determinar el lado disponible
      const existingSides = new Set(lane.turrets.filter(t => t.side).map(t => t.side));
      const side = !existingSides.has('left') ? 'left' : !existingSides.has('right') ? 'right' : null;

      if (side) {
        const turret = {
          id: Date.now() + Math.random(),
          laneId: lane.id,
          x: side === 'left' ? 15 : 85,
          y: 420,
          lastShoot: currentTime,
          shootInterval: 1000,
          endTime: currentTime + 60000,
          alive: true,
          user: user,
          side: side,
          type: 'intelligent'
        };
        lane.turrets.push(turret);
      }
    }
  }

  updateFreezeBalls(lane, currentTime) {
    const FREEZE_COOLDOWN = 15000; // 5s de efecto + 10s de espera

    if (lane.freezeBallQueue.length > 0 && currentTime - lane.lastFreezeBallTime > FREEZE_COOLDOWN) {
      lane.freezeBallQueue.shift(); // Sacar una bola de la cola
      lane.lastFreezeBallTime = currentTime;

      const freezeBall = {
        id: Date.now() + Math.random(),
        laneId: lane.id,
        x: 50,
        y: 500,
        speed: 6,
        freezeTime: 5000,
        affectedEnemies: [],
        alive: true
      };
      lane.freezeBalls.push(freezeBall);
      logger.debug(`[GameState] Lanzando Bola de Hielo en carril ${lane.id}. Siguientes en cola: ${lane.freezeBallQueue.length}`);
    }
  }

  checkGameOver() {
    const aliveLanes = this.lanes.filter(lane => !lane.isGameOver);

    // Si solo queda un carril, lo marcamos como el último superviviente
    if (aliveLanes.length === 1) {
      this.lastSurvivor = aliveLanes[0].id;
    }

    // El juego termina solo cuando ya no quedan carriles vivos
    if (aliveLanes.length <= 0) {
      this.globalGameOver = true;
      this.winner = this.lastSurvivor; // El ganador es el último que quedó en pie
      
      // Registrar la victoria si hay un ganador
      if (this.winner) {
        const winningLane = this.lanes.find(l => l.id === this.winner);
        if (winningLane && winningLane.team) {
          StatsStorage.addWin(winningLane.team);
          this.addEventToLog(`🏆 ¡El equipo ${winningLane.team} ha ganado la partida!`);
        }
      }

      this.stopWaves();
    }
  }

  startWaves() {
    if (this.globalGameOver) return;
    
    this.waveSystem.isActive = true;
    this.waveSystem.isPaused = false;
    
    if (!this.waveSystem.waveInterval) {
      this.waveSystem.waveInterval = setInterval(() => {
        if (!this.waveSystem.isPaused && this.waveSystem.isActive) {
          this.waveSystem.timeRemaining--;
          
          if (this.waveSystem.timeRemaining <= 0) {
            this.nextWave();
          }
        }
      }, 1000);
    }
    
    if (!this.gameLoop) {
      this.gameLoop = setInterval(() => {
        this.updateGame();
      }, 1000/60);
    }
  }

  pauseWaves() {
    this.waveSystem.isPaused = true;
  }

  stopWaves(fullReset = false) {
    this.waveSystem.isActive = false;
    this.waveSystem.isPaused = false;
    if (fullReset) {
      this.waveSystem.currentWave = 0;
    }
    this.waveSystem.timeRemaining = 15;
    
    if (this.waveSystem.waveInterval) {
      clearInterval(this.waveSystem.waveInterval);
      this.waveSystem.waveInterval = null;
    }
    
    if (this.waveSystem.spawnInterval) {
      clearInterval(this.waveSystem.spawnInterval);
      this.waveSystem.spawnInterval = null;
    }
    
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
    
    this.lanes.forEach(lane => {
      lane.baseHealth = 100;
      lane.enemies = [];
      lane.bullets = [];
      lane.enemyProjectiles = [];
      lane.turrets = [{ id: 'basic', x: 50, y: 470, type: 'basic' }];
      lane.turretQueue = [];
      lane.freezeBalls = [];
      lane.freezeBallQueue = [];
      lane.lastFreezeBallTime = 0;
      lane.rapidFireTurretActive = false;
      lane.rapidFireTurretEndTime = 0;
      lane.rapidFireTurretQueue = [];
      lane.currentRapidFireUser = null;
      lane.coins = 0;
      lane.energy = 0;
      lane.lastShotTime = 0;
      lane.lastRapidFireShotTime = 0;
      lane.lastDrainTime = 0;
      lane.overdriveStartTime = 0;
      lane.isGameOver = false;
      if (fullReset) {
        lane.team = null;
      }
    });
    
    // SOLO AGREGUÉ ESTO
    this.activePowerUps = {
      turrets: [],
      freezeBalls: [],
      rapidFireTurrets: []
    };
    
    if (fullReset) {
      this.globalGameOver = false;
      this.winner = null;
      this.eventLog = []; // Limpiar el log de eventos en un reseteo completo
    }
  }

  forceNextWave() {
    if (this.waveSystem.isActive && !this.waveSystem.isPaused) {
      this.nextWave();
    }
  }

  nextWave() {
    this.waveSystem.currentWave++;
    this.waveSystem.timeRemaining = this.waveSystem.maxTime;
    
    // Limpiar intervalo anterior
    if (this.waveSystem.spawnInterval) {
      clearInterval(this.waveSystem.spawnInterval);
    }
    
    // Definir composición de la oleada según el número
    const waveComposition = this.getWaveComposition(this.waveSystem.currentWave);
    const spawnDelay = this.getSpawnDelay(this.waveSystem.currentWave);
    
    logger.info(`Oleada ${this.waveSystem.currentWave}: Spawneando ${waveComposition.length} enemigos con delay ${spawnDelay}ms`);
    
    let enemyIndex = 0;
    this.waveSystem.spawnInterval = setInterval(() => {
      if (enemyIndex >= waveComposition.length || this.globalGameOver) {
        clearInterval(this.waveSystem.spawnInterval);
        this.waveSystem.spawnInterval = null;
        return;
      }
      
      // Obtener carriles activos (no game over)
      const aliveLanes = this.lanes.filter(lane => !lane.isGameOver);
      if (aliveLanes.length === 0) return;
      
      // Spawnnear el mismo tipo de enemigo en TODOS los carriles activos
      const enemyType = waveComposition[enemyIndex];
      logger.debug(`Spawneando ${enemyType} en todos los carriles activos`);
      
      aliveLanes.forEach(lane => {
        this.createEnemy(lane.id, enemyType);
      });
      
      enemyIndex++;
    }, spawnDelay);
  }

  getWaveComposition(waveNumber) {
    // Duración de la oleada en segundos
    const waveDuration = 15;
    const spawnDelay = this.getSpawnDelay(waveNumber) / 1000; // en segundos
    const enemyCount = Math.floor(waveDuration / spawnDelay) -1; // -1 para que no aparezca justo al final

    // Definir composición específica por oleada para progresión controlada
    if (waveNumber === 1) {
      return Array(enemyCount).fill('basic'); // Oleada de enemigos básicos
    } else if (waveNumber === 2) {
      return ['basic', 'mini', 'basic', 'mini', 'basic', 'mini', 'basic']; // Más fácil, solo básicos y minis
    } else if (waveNumber === 3) {
      return ['mini', 'basic', 'mini', 'basic', 'mini', 'basic', 'mini']; // Un poco más de ritmo
    } else if (waveNumber === 4) {
      return ['basic', 'mini', 'special1', 'basic', 'mini', 'basic', 'special1']; // Introducción suave de special1
    } else if (waveNumber === 5) {
      // Oleada de jefe
      return ['tank', 'special1', 'mini', 'boss', 'mini', 'special1', 'tank'];
    } else if (waveNumber === 6) {
      return ['mini', 'mini', 'special1', 'basic', 'special1', 'mini', 'tank', 'mini'];
    } else if (waveNumber === 7) {
      return ['special1', 'tank', 'sniper', 'mini', 'basic', 'special1', 'sniper', 'tank'];
    } else if (waveNumber === 8) {
      return ['tank', 'special1', 'sniper', 'mini', 'tank', 'basic', 'mini', 'sniper', 'special1'];
    } else if (waveNumber === 9) {
      return ['sniper', 'tank', 'special1', 'sniper', 'mini', 'tank', 'special1', 'sniper', 'tank'];
    } else if (waveNumber === 10) {
      // Oleada de jefe
      return ['sniper', 'tank', 'boss', 'special1', 'sniper', 'boss', 'tank', 'sniper', 'special1'];
    } else if (waveNumber % 5 === 0) {
      // Oleadas de jefe procedurales
      const composition = [];
      const bossCount = Math.floor(waveNumber / 10) + 1;
      
      for (let i = 0; i < enemyCount; i++) {
        const rand = Math.random();
        if (i % Math.floor(enemyCount / bossCount) === 0 && composition.filter(e => e === 'boss').length < bossCount) {
          composition.push('boss');
        } else if (rand < 0.3) {
          composition.push('tank');
        } else if (rand < 0.6) {
          composition.push('sniper');
        } else {
          composition.push('special1');
        }
      }
      return composition;
    } else {
      // Oleadas procedurales después de la 10
      const composition = [];
      const ratios = {
        basic: Math.max(0, 0.4 - (waveNumber * 0.02)),
        mini: Math.max(0, 0.3 - (waveNumber * 0.01)),
        special1: Math.min(0.5, 0.2 + (waveNumber * 0.015)),
        tank: Math.min(0.4, 0.1 + (waveNumber * 0.01)),
        sniper: Math.min(0.3, Math.max(0, (waveNumber - 6) * 0.02))
      };

      // Normalizar ratios
      const totalRatio = Object.values(ratios).reduce((sum, ratio) => sum + ratio, 0);
      for (const key in ratios) {
        ratios[key] /= totalRatio;
      }

      for (let i = 0; i < enemyCount; i++) {
        const rand = Math.random();
        let cumulativeRatio = 0;
        for (const type in ratios) {
          cumulativeRatio += ratios[type];
          if (rand < cumulativeRatio) {
            composition.push(type);
            break;
          }
        }
      }
      
      return composition;
    }
  }

  getSpawnDelay(waveNumber) {
    // Delay entre spawns - más rápido en oleadas altas
    if (waveNumber <= 3) {
      return 2000; // 2 segundos
    } else if (waveNumber <= 6) {
      return 1500; // 1.5 segundos
    } else if (waveNumber <= 10) {
      return 1200; // 1.2 segundos
    } else {
      return Math.max(800, 1200 - ((waveNumber - 10) * 50)); // Cada vez más rápido
    }
  }

  getState() {
    return {
      lanes: this.lanes.map(lane => ({
        id: lane.id,
        baseHealth: lane.baseHealth,
        enemies: lane.enemies,
        bullets: lane.bullets,
        enemyProjectiles: lane.enemyProjectiles,
        turrets: lane.turrets,
        freezeBalls: lane.freezeBalls,
        rapidFireTurretActive: lane.rapidFireTurretActive,
        rapidFireTurretEndTime: lane.rapidFireTurretEndTime,
        currentRapidFireUser: lane.currentRapidFireUser,
        coins: lane.coins,
        energy: lane.energy,
        isGameOver: lane.isGameOver,
        team: lane.team,
        // Ya no necesitamos enviar estos datos
        // doubleBulletsActive: lane.doubleBulletsActive,
        // doubleBulletsEndTime: lane.doubleBulletsEndTime,
      })),
      waveSystem: {
        isActive: this.waveSystem.isActive,
        isPaused: this.waveSystem.isPaused,
        currentWave: this.waveSystem.currentWave,
        timeRemaining: this.waveSystem.timeRemaining,
        maxTime: this.waveSystem.maxTime
        // NO enviamos los intervalos
      },
      globalGameOver: this.globalGameOver,
      winner: this.winner,
      enemyTypes: this.enemyTypes,
      activePowerUps: this.activePowerUps,
      eventLog: this.eventLog, // Enviar el log de eventos al cliente
      presala: {
        isActive: this.presala.isActive,
        timeLeft: this.presala.timeLeft,
        targetPoints: this.presala.targetPoints,
        activeTeams: this.presala.activeTeams,
        waitingTeams: this.presala.waitingTeams,
      }
    };
  }
}

module.exports = GameState;