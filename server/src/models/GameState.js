const ENEMY_TYPES = {
  BASIC: {
    health: 5,
    speed: 2,
    size: 15,
    color: '#e74c3c',
    damage: 10,
    canShoot: false,
    shootInterval: 0,
    shootDamage: 0
  },
  MINI: {
    health: 2,
    speed: 4,
    size: 10,
    color: '#3498db',
    damage: 5,
    canShoot: false,
    shootInterval: 0,
    shootDamage: 0
  },
  SPECIAL1: {
    health: 8,
    speed: 1.5,
    size: 18,
    color: '#f39c12',
    damage: 15,
    canShoot: false,
    shootInterval: 0,
    shootDamage: 0
  },
  TANK: {
    health: 15,
    speed: 1,
    size: 22,
    color: '#8e44ad',
    damage: 25,
    canShoot: false,
    shootInterval: 0,
    shootDamage: 0
  },
  SNIPER: {
    health: 6,
    speed: 1.5,
    size: 16,
    color: '#e67e22',
    damage: 8,
    canShoot: true,
    shootInterval: 3000,
    shootDamage: 15
  },
  BOSS: {
    health: 30,
    speed: 0.8,
    size: 30,
    color: '#c0392b',
    damage: 40,
    canShoot: false,
    shootInterval: 0,
    shootDamage: 0
  }
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
        turrets: [], // SOLO AGREGUÉ ESTO
        freezeBalls: [], // SOLO AGREGUÉ ESTO
        doubleBulletsActive: false, // SOLO AGREGUÉ ESTO
        doubleBulletsEndTime: 0, // SOLO AGREGUÉ ESTO
        coins: 0,
        energy: 0,
        lastShotTime: 0,
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
        turrets: [], // SOLO AGREGUÉ ESTO
        freezeBalls: [], // SOLO AGREGUÉ ESTO
        doubleBulletsActive: false, // SOLO AGREGUÉ ESTO
        doubleBulletsEndTime: 0, // SOLO AGREGUÉ ESTO
        coins: 0,
        energy: 0,
        lastShotTime: 0,
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
        turrets: [], // SOLO AGREGUÉ ESTO
        freezeBalls: [], // SOLO AGREGUÉ ESTO
        doubleBulletsActive: false, // SOLO AGREGUÉ ESTO
        doubleBulletsEndTime: 0, // SOLO AGREGUÉ ESTO
        coins: 0,
        energy: 0,
        lastShotTime: 0,
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
        turrets: [], // SOLO AGREGUÉ ESTO
        freezeBalls: [], // SOLO AGREGUÉ ESTO
        doubleBulletsActive: false, // SOLO AGREGUÉ ESTO
        doubleBulletsEndTime: 0, // SOLO AGREGUÉ ESTO
        coins: 0,
        energy: 0,
        lastShotTime: 0,
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
    this.enemyTypes = ENEMY_TYPES;
    this.gameLoop = null;
    this.lastTime = Date.now();
    
    // SOLO AGREGUÉ ESTO
    this.activePowerUps = {
      turrets: [],
      freezeBalls: [],
      doubleBullets: []
    };

    this.presala = {
      isActive: false,
      timeLeft: 180,
      maxTime: 180,
      teams: {}, // { 'colombia': { points: 0, members: new Set() } }
      userTeam: {} // { 'userId': 'colombia' }
    };
  }

  assignUserToTeam(userId, teamName) {
    const normalizedTeamName = teamName.toLowerCase();
    const PRESALA_CONFIG = require('../config/presalaConfig');

    if (!PRESALA_CONFIG.ALLOWED_TEAMS.includes(normalizedTeamName)) {
      console.log(`[GameState] Intento de unirse a un equipo no válido: ${teamName}. Ignorando.`);
      return;
    }

    const { teams, userTeam } = this.presala;

    // Si el usuario ya estaba en un equipo, removerlo del equipo anterior
    const oldTeam = userTeam[userId];
    if (oldTeam && teams[oldTeam]) {
        teams[oldTeam].members.delete(userId);
        console.log(`Usuario ${userId} removido del equipo anterior ${oldTeam}.`);
    }

    // Añadir al nuevo equipo
    if (!teams[normalizedTeamName]) {
      teams[normalizedTeamName] = {
        points: 0,
        members: new Set()
      };
    }
    teams[normalizedTeamName].members.add(userId);
    userTeam[userId] = normalizedTeamName;

    console.log(`[GameState] Usuario ${userId} se ha unido al equipo ${normalizedTeamName}.`);
  }

  // SOLO AGREGUÉ ESTOS 3 MÉTODOS NUEVOS
  spawnTurret(laneId) {
    const lane = this.lanes.find(l => l.id === laneId);
    if (!lane || lane.isGameOver) return;

    const turret = {
      id: Date.now() + Math.random(),
      laneId: laneId,
      x: Math.random() > 0.5 ? 15 : 85,
      y: 500,
      lastShoot: Date.now(),
      shootInterval: 1000, // CAMBIO: 1 segundo en lugar de 2
      endTime: Date.now() + 60000,
      alive: true
    };

    lane.turrets.push(turret);
    this.activePowerUps.turrets.push({
      laneId: laneId,
      endTime: turret.endTime
    });
  }

  spawnFreezeBall(laneId) {
    const lane = this.lanes.find(l => l.id === laneId);
    if (!lane || lane.isGameOver) return;

    const freezeBall = {
      id: Date.now() + Math.random(),
      laneId: laneId,
      x: 50,
      y: 580,
      speed: 6,
      freezeTime: 5000,
      affectedEnemies: [],
      alive: true
    };

    lane.freezeBalls.push(freezeBall);
  }

  activateDoubleBullets(laneId) {
    const lane = this.lanes.find(l => l.id === laneId);
    if (!lane || lane.isGameOver) return;

    const endTime = Date.now() + 20000;
    lane.doubleBulletsActive = true;
    lane.doubleBulletsEndTime = endTime;
    lane.powerAmmo = 100; // Añadir 100 balas de poder al activar
    
    this.activePowerUps.doubleBullets.push({
      laneId: laneId,
      endTime: endTime
    });
  }

  addCoins(laneId, amount) {
    const lane = this.lanes.find(l => l.id === laneId);
    if (lane) {
      lane.coins += amount;
    }
  }

  updateEnergyAndShooting(lane, currentTime) {
    // 1. Drenaje de Energía
    if (currentTime - lane.lastDrainTime > 5000) {
      let drainAmount = 0;
      if (lane.energy > 600) { // Nivel 3 y 4
        drainAmount = 100;
      } else if (lane.energy > 300) { // Nivel 2
        drainAmount = 50;
      } else { // Nivel 1
        drainAmount = 10;
      }

      // Regla especial Nivel 4: el drenaje solo empieza después de 5s
      if (lane.energy === 1000) {
        if (lane.overdriveStartTime === 0) {
          lane.overdriveStartTime = currentTime;
        }
        if (currentTime - lane.overdriveStartTime < 5000) {
          drainAmount = 0; // No hay drenaje durante los primeros 5s de overdrive
        }
      } else {
        lane.overdriveStartTime = 0; // Resetear si la energía baja de 1000
      }
      
      lane.energy = Math.max(0, lane.energy - drainAmount);
      lane.lastDrainTime = currentTime;
    }

    // 2. Lógica de Disparo
    let shotsPerSecond = 2; // Nivel 1 (base)
    if (lane.energy > 1000) lane.energy = 1000; // Cap energy
    
    if (lane.energy > 600) { // Nivel 3
      shotsPerSecond = 4;
    } else if (lane.energy > 300) { // Nivel 2
      shotsPerSecond = 3;
    }

    if (lane.energy === 1000) { // Nivel 4
        shotsPerSecond = 5;
    }

    const cooldown = 1000 / shotsPerSecond;
    if (currentTime - lane.lastShotTime > cooldown) {
      this.shootBullet(lane.id);
      lane.lastShotTime = currentTime;
    }
  }

  // MANTUVE TODO LO ORIGINAL Y SOLO AGREGUÉ POWER-UPS AL updateGame
  createEnemy(laneId, enemyType = 'basic') {
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
      alive: true,
      lastShoot: Date.now(),
      canShoot: enemyConfig.canShoot,
      shootInterval: enemyConfig.shootInterval,
      shootDamage: enemyConfig.shootDamage,
      frozen: false, // SOLO AGREGUÉ ESTO
      frozenEndTime: 0, // SOLO AGREGUÉ ESTO
      originalSpeed: enemyConfig.speed, // SOLO AGREGUÉ ESTO
      justUnfrozen: false // SOLO AGREGUÉ ESTO
    };

    lane.enemies.push(enemy);
    return enemy;
  }

  shootBullet(laneId) {
    const lane = this.lanes.find(l => l.id === laneId);
    if (!lane || lane.isGameOver) return;

    const closestEnemy = lane.enemies
      .filter(enemy => enemy.alive)
      .reduce((closest, enemy) => {
        return !closest || enemy.y > closest.y ? enemy : closest;
      }, null);

    if (!closestEnemy) return;

    const bullet = {
      id: Date.now() + Math.random(),
      x: 50,
      y: 580,
      targetY: closestEnemy.y,
      speed: 8,
      damage: 1,
      alive: true,
      isDouble: false,
      fromTurret: false
    };

    lane.bullets.push(bullet);
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

        if (enemy.y >= 580) {
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

        if (projectile.y >= 580) {
          lane.baseHealth -= projectile.damage;
          projectile.alive = false;
          
          if (lane.baseHealth <= 0) {
            lane.baseHealth = 0;
            lane.isGameOver = true;
          }
          return false;
        }

        return projectile.y < 600;
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
          const targetY = Math.min(500, Math.max(100, closestEnemy.y + 80));
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
            fromTurret: true
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

      // La lógica de balas dobles ya no es necesaria
      // if (lane.doubleBulletsActive && currentTime > lane.doubleBulletsEndTime) {
      //   lane.doubleBulletsActive = false;
      // }

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
    this.activePowerUps.doubleBullets = this.activePowerUps.doubleBullets.filter(p => currentTime < p.endTime);
  }

  checkGameOver() {
    const aliveLanes = this.lanes.filter(lane => !lane.isGameOver);
    
    if (aliveLanes.length <= 1) {
      this.globalGameOver = true;
      
      if (aliveLanes.length === 1) {
        this.winner = aliveLanes[0].id;
      } else {
        this.winner = null;
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

  stopWaves() {
    this.waveSystem.isActive = false;
    this.waveSystem.isPaused = false;
    this.waveSystem.currentWave = 0;
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
      lane.turrets = []; // SOLO AGREGUÉ ESTO
      lane.freezeBalls = []; // SOLO AGREGUÉ ESTO
      lane.doubleBulletsActive = false; // SOLO AGREGUÉ ESTO
      lane.doubleBulletsEndTime = 0; // SOLO AGREGUÉ ESTO
      lane.isGameOver = false;
      lane.team = null;
    });
    
    // SOLO AGREGUÉ ESTO
    this.activePowerUps = {
      turrets: [],
      freezeBalls: [],
      doubleBullets: []
    };
    
    this.globalGameOver = false;
    this.winner = null;
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
    
    console.log(`Oleada ${this.waveSystem.currentWave}: Spawneando ${waveComposition.length} enemigos con delay ${spawnDelay}ms`);
    
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
      console.log(`Spawneando ${enemyType} en todos los carriles activos`);
      
      aliveLanes.forEach(lane => {
        this.createEnemy(lane.id, enemyType);
      });
      
      enemyIndex++;
    }, spawnDelay);
  }

  getWaveComposition(waveNumber) {
    // Definir composición específica por oleada para progresión controlada
    if (waveNumber === 1) {
      return ['basic', 'basic', 'basic'];
    } else if (waveNumber === 2) {
      return ['basic', 'basic', 'mini', 'basic'];
    } else if (waveNumber === 3) {
      return ['basic', 'mini', 'mini', 'basic', 'basic'];
    } else if (waveNumber === 4) {
      return ['mini', 'basic', 'special1', 'mini', 'basic'];
    } else if (waveNumber === 5) {
      return ['basic', 'special1', 'mini', 'tank', 'basic'];
    } else if (waveNumber === 6) {
      return ['mini', 'mini', 'special1', 'basic', 'special1', 'mini'];
    } else if (waveNumber === 7) {
      return ['special1', 'tank', 'sniper', 'mini', 'basic', 'special1'];
    } else if (waveNumber === 8) {
      return ['tank', 'special1', 'sniper', 'mini', 'tank', 'basic', 'mini'];
    } else if (waveNumber === 9) {
      return ['sniper', 'tank', 'special1', 'sniper', 'mini', 'tank', 'special1'];
    } else if (waveNumber === 10) {
      return ['tank', 'sniper', 'special1', 'boss', 'tank', 'sniper', 'special1'];
    } else if (waveNumber % 5 === 0) {
      // Oleadas boss cada 5
      const baseEnemies = ['tank', 'sniper', 'special1', 'tank'];
      const bossCount = Math.floor(waveNumber / 10) + 1;
      const composition = [...baseEnemies];
      for (let i = 0; i < bossCount; i++) {
        composition.push('boss');
      }
      composition.push(...baseEnemies);
      return composition;
    } else {
      // Oleadas procedurales después de la 10
      const composition = [];
      const enemyCount = Math.min(4 + Math.floor(waveNumber / 3), 12);
      
      // Distribución de enemigos basada en la oleada
      const basicRatio = Math.max(0.1, 0.4 - (waveNumber * 0.02));
      const miniRatio = Math.max(0.1, 0.3 - (waveNumber * 0.01));
      const specialRatio = Math.min(0.4, 0.2 + (waveNumber * 0.015));
      const tankRatio = Math.min(0.3, 0.1 + (waveNumber * 0.01));
      const sniperRatio = Math.min(0.2, Math.max(0, (waveNumber - 6) * 0.02));
      
      for (let i = 0; i < enemyCount; i++) {
        const rand = Math.random();
        if (rand < basicRatio) {
          composition.push('basic');
        } else if (rand < basicRatio + miniRatio) {
          composition.push('mini');
        } else if (rand < basicRatio + miniRatio + specialRatio) {
          composition.push('special1');
        } else if (rand < basicRatio + miniRatio + specialRatio + tankRatio) {
          composition.push('tank');
        } else {
          composition.push('sniper');
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
        doubleBulletsActive: lane.doubleBulletsActive,
        doubleBulletsEndTime: lane.doubleBulletsEndTime,
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
      presala: {
        ...this.presala,
        teams: Object.fromEntries(
          Object.entries(this.presala.teams).map(([team, data]) => [
            team,
            { ...data, members: [...data.members] } // Convertir Set a Array para JSON
          ])
        )
      }
    };
  }
}

module.exports = GameState;