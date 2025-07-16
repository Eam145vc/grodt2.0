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
        turrets: [], // Nuevo: torretas en el lane
        freezeBalls: [], // Nuevo: bolas de hielo
        doubleBulletsActive: false, // Nuevo: balas dobles activas
        doubleBulletsEndTime: 0, // Nuevo: tiempo cuando terminan las balas dobles
        isGameOver: false 
      },
      { 
        id: 2, 
        baseHealth: 100, 
        enemies: [], 
        bullets: [], 
        enemyProjectiles: [],
        turrets: [],
        freezeBalls: [],
        doubleBulletsActive: false,
        doubleBulletsEndTime: 0,
        isGameOver: false 
      },
      { 
        id: 3, 
        baseHealth: 100, 
        enemies: [], 
        bullets: [], 
        enemyProjectiles: [],
        turrets: [],
        freezeBalls: [],
        doubleBulletsActive: false,
        doubleBulletsEndTime: 0,
        isGameOver: false 
      },
      { 
        id: 4, 
        baseHealth: 100, 
        enemies: [], 
        bullets: [], 
        enemyProjectiles: [],
        turrets: [],
        freezeBalls: [],
        doubleBulletsActive: false,
        doubleBulletsEndTime: 0,
        isGameOver: false 
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
    
    // Power-ups activos (para mostrar en el admin)
    this.activePowerUps = {
      turrets: [], // { laneId, endTime }
      freezeBalls: [], // { laneId, endTime }
      doubleBullets: [] // { laneId, endTime }
    };
  }

  // Crear nueva torreta
  spawnTurret(laneId) {
    const lane = this.lanes.find(l => l.id === laneId);
    if (!lane || lane.isGameOver) return;

    const turret = {
      id: Date.now() + Math.random(),
      laneId: laneId,
      x: Math.random() > 0.5 ? 15 : 85, // Lado aleatorio (izquierda o derecha del lane)
      y: 500, // Posición inicial
      lastShoot: Date.now(),
      shootInterval: 2000, // Disparar cada 2 segundos
      endTime: Date.now() + 60000, // 60 segundos de duración
      alive: true
    };

    lane.turrets.push(turret);
    
    // Agregar a power-ups activos
    this.activePowerUps.turrets.push({
      laneId: laneId,
      endTime: turret.endTime
    });
  }

  // Crear bola de hielo
  spawnFreezeBall(laneId) {
    const lane = this.lanes.find(l => l.id === laneId);
    if (!lane || lane.isGameOver) return;

    const freezeBall = {
      id: Date.now() + Math.random(),
      laneId: laneId,
      x: 50, // Centro del lane
      y: 580, // Desde la base
      speed: 6,
      freezeTime: 5000, // 5 segundos de congelamiento
      affectedEnemies: [], // Enemigos que fueron congelados
      alive: true
    };

    lane.freezeBalls.push(freezeBall);
  }

  // Activar balas dobles
  activateDoubleBullets(laneId) {
    const lane = this.lanes.find(l => l.id === laneId);
    if (!lane || lane.isGameOver) return;

    const endTime = Date.now() + 20000; // 20 segundos
    lane.doubleBulletsActive = true;
    lane.doubleBulletsEndTime = endTime;
    
    // Agregar a power-ups activos
    this.activePowerUps.doubleBullets.push({
      laneId: laneId,
      endTime: endTime
    });
  }

  // Lógica de actualización para power-ups
  updatePowerUps() {
    const currentTime = Date.now();
    
    this.lanes.forEach(lane => {
      // Actualizar torretas
      lane.turrets = lane.turrets.filter(turret => {
        if (currentTime > turret.endTime) {
          turret.alive = false;
          return false;
        }

        // Mover torreta siguiendo al enemigo más adelantado
        const closestEnemy = this.findClosestEnemyInLane(lane);
        if (closestEnemy) {
          turret.y = Math.max(100, Math.min(550, closestEnemy.y - 50));
        }

        // Disparar si es tiempo
        if (currentTime - turret.lastShoot >= turret.shootInterval && closestEnemy) {
          this.shootTurretBullet(turret, closestEnemy);
          turret.lastShoot = currentTime;
        }

        return true;
      });

      // Actualizar bolas de hielo
      lane.freezeBalls = lane.freezeBalls.filter(freezeBall => {
        freezeBall.y -= freezeBall.speed;
        
        // Verificar colisión con enemigos
        lane.enemies.forEach(enemy => {
          if (enemy.alive && !freezeBall.affectedEnemies.includes(enemy.id)) {
            const distance = Math.sqrt(
              Math.pow(freezeBall.x - 50, 2) + Math.pow(freezeBall.y - enemy.y, 2)
            );
            
            if (distance < 25) { // Radio de efecto
              // Congelar enemigo
              enemy.frozen = true;
              enemy.frozenEndTime = currentTime + freezeBall.freezeTime;
              enemy.originalSpeed = enemy.speed;
              enemy.speed = 0;
              freezeBall.affectedEnemies.push(enemy.id);
            }
          }
        });

        // Eliminar si sale de pantalla
        return freezeBall.y > -50;
      });

      // Actualizar estado de balas dobles
      if (lane.doubleBulletsActive && currentTime > lane.doubleBulletsEndTime) {
        lane.doubleBulletsActive = false;
      }

      // Actualizar enemigos congelados
      lane.enemies.forEach(enemy => {
        if (enemy.frozen && currentTime > enemy.frozenEndTime) {
          enemy.frozen = false;
          enemy.speed = enemy.originalSpeed;
          enemy.justUnfrozen = true; // Para efecto visual
          
          // Quitar efecto visual después de un tiempo
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

  // Encontrar enemigo más adelantado en un lane
  findClosestEnemyInLane(lane) {
    return lane.enemies
      .filter(enemy => enemy.alive)
      .reduce((closest, enemy) => {
        return !closest || enemy.y > closest.y ? enemy : closest;
      }, null);
  }

  // Disparar bala desde torreta
  shootTurretBullet(turret, targetEnemy) {
    const lane = this.lanes.find(l => l.id === turret.laneId);
    if (!lane) return;

    const bullet = {
      id: Date.now() + Math.random(),
      x: turret.x,
      y: turret.y,
      targetY: targetEnemy.y,
      speed: 8,
      damage: 1,
      alive: true,
      fromTurret: true // Identificar que viene de torreta
    };

    lane.bullets.push(bullet);
  }

  // Métodos existentes...
  createEnemy(laneId, enemyType = 'basic') {
    const lane = this.lanes.find(l => l.id === laneId);
    if (!lane || lane.isGameOver) return null;

    const typeKey = enemyType.toUpperCase();
    const enemyConfig = ENEMY_TYPES[typeKey] || ENEMY_TYPES.BASIC;
    
    const enemy = {
      id: Date.now() + Math.random(),
      laneId: laneId,
      type: enemyType,
      x: 50,
      y: 0,
      health: enemyConfig.health,
      maxHealth: enemyConfig.health,
      speed: enemyConfig.speed,
      damage: enemyConfig.damage,
      alive: true,
      lastShoot: Date.now(),
      canShoot: enemyConfig.canShoot,
      shootInterval: enemyConfig.shootInterval,
      shootDamage: enemyConfig.shootDamage,
      frozen: false, // Nuevo: estado de congelamiento
      frozenEndTime: 0, // Nuevo: cuando termina el congelamiento
      originalSpeed: enemyConfig.speed, // Nuevo: velocidad original
      justUnfrozen: false // Nuevo: para efecto visual
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
      damage: lane.doubleBulletsActive ? 2 : 1, // Daño doble si está activo
      alive: true,
      isDouble: lane.doubleBulletsActive, // Para renderizado especial
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

    // Actualizar power-ups primero
    this.updatePowerUps();

    this.lanes.forEach(lane => {
      if (lane.isGameOver) return;

      // Actualizar enemigos
      lane.enemies = lane.enemies.filter(enemy => {
        if (!enemy.alive) return false;

        // Solo mover si no está congelado
        if (!enemy.frozen) {
          enemy.y += enemy.speed;
        }

        // Verificar si llegó a la base
        if (enemy.y >= 580) {
          lane.baseHealth -= enemy.damage;
          enemy.alive = false;
          
          if (lane.baseHealth <= 0) {
            lane.baseHealth = 0;
            lane.isGameOver = true;
          }
          return false;
        }

        // Enemigos que disparan (sniper)
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

      // Actualizar balas
      lane.bullets = lane.bullets.filter(bullet => {
        if (!bullet.alive) return false;

        bullet.y -= bullet.speed;

        // Verificar colisiones con enemigos
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

      // Actualizar proyectiles enemigos
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
    
    // Reset del juego
    this.lanes.forEach(lane => {
      lane.baseHealth = 100;
      lane.enemies = [];
      lane.bullets = [];
      lane.enemyProjectiles = [];
      lane.turrets = []; // Limpiar torretas
      lane.freezeBalls = []; // Limpiar bolas de hielo
      lane.doubleBulletsActive = false; // Desactivar balas dobles
      lane.doubleBulletsEndTime = 0;
      lane.isGameOver = false;
    });
    
    // Limpiar power-ups activos
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
    
    // Lógica de spawn por oleadas
    const waveMultiplier = Math.floor(this.waveSystem.currentWave / 5) + 1;
    const enemiesPerWave = Math.min(2 + Math.floor(this.waveSystem.currentWave / 3), 8);
    
    if (this.waveSystem.spawnInterval) {
      clearInterval(this.waveSystem.spawnInterval);
    }
    
    let enemiesSpawned = 0;
    this.waveSystem.spawnInterval = setInterval(() => {
      if (enemiesSpawned >= enemiesPerWave || this.globalGameOver) {
        clearInterval(this.waveSystem.spawnInterval);
        return;
      }
      
      const aliveLanes = this.lanes.filter(lane => !lane.isGameOver);
      if (aliveLanes.length === 0) return;
      
      const randomLane = aliveLanes[Math.floor(Math.random() * aliveLanes.length)];
      const enemyType = this.getRandomEnemyType();
      
      this.createEnemy(randomLane.id, enemyType);
      enemiesSpawned++;
    }, 1000 / waveMultiplier);
  }

  getRandomEnemyType() {
    const wave = this.waveSystem.currentWave;
    const types = ['basic'];
    
    if (wave >= 2) types.push('mini');
    if (wave >= 3) types.push('special1');
    if (wave >= 5) types.push('tank');
    if (wave >= 7) types.push('sniper');
    if (wave >= 10 && wave % 5 === 0) types.push('boss');
    
    return types[Math.floor(Math.random() * types.length)];
  }

  getState() {
    return {
      lanes: this.lanes,
      waveSystem: this.waveSystem,
      globalGameOver: this.globalGameOver,
      winner: this.winner,
      enemyTypes: this.enemyTypes,
      activePowerUps: this.activePowerUps // Incluir power-ups activos
    };
  }
}

module.exports = GameState;