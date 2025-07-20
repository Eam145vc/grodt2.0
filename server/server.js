const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configuración CORS
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5001",
  methods: ["GET", "POST"]
}));

// Configuración Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5001",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());

// Tipos de enemigos
const ENEMY_TYPES = {
  BASIC: {
    id: 'basic',
    name: 'Básico',
    health: 5,
    speed: 1.5,
    damage: 5,
    color: '#e74c3c',
    size: 15,
    spawnRate: 'high'
  },
  MINI: {
    id: 'mini',
    name: 'Mini',
    health: 1,
    speed: 2.5,
    damage: 1,
    color: '#3498db',
    size: 8,
    spawnRate: 'medium-low',
    groupSize: 20
  },
  SPECIAL1: {
    id: 'special1',
    name: 'Especial 1',
    health: 10,
    speed: 2.5,
    damage: 10,
    color: '#f39c12',
    size: 18,
    spawnRate: 'low'
  },
  TANK: {
    id: 'tank',
    name: 'Tanque',
    health: 50,
    speed: 0.6,
    damage: 35,
    color: '#8e44ad',
    size: 25,
    spawnRate: 'medium'
  },
  SNIPER: {
    id: 'sniper',
    name: 'Sniper',
    health: 10,
    speed: 1.0,
    damage: 3,
    color: '#27ae60',
    size: 16,
    spawnRate: 'low',
    shootInterval: 3000,
    projectileSpeed: 4
  },
  BOSS: {
    id: 'boss',
    name: 'Boss',
    health: 15,
    speed: 3,
    damage: 20,
    color: '#c0392b',
    size: 30,
    spawnRate: 'very-low',
    splitsInto: 'special1',
    splitCount: 2
  }
};

const GameState = require('./src/models/GameState');
const TikTokHandler = require('./src/socket/TikTokHandler');

// Instancia única del estado del juego y del manejador
const gameState = new GameState();
const tikTokHandler = new TikTokHandler(gameState);


// Variables separadas para los timers
let waveTimer = null;
let spawnTimer = null;
let sniperTimers = new Map(); // Para manejar los disparos de snipers

// Funciones del juego
const createEnemy = (laneId, enemyType, waveNumber) => {
  const type = ENEMY_TYPES[enemyType.toUpperCase()];
  if (!type) return null;

  const enemy = {
    id: Date.now() + Math.random(),
    laneId,
    type: enemyType.toLowerCase(),
    x: 50,
    y: 0,
    health: type.health,
    maxHealth: type.health,
    speed: type.speed + (waveNumber * 0.1), // Ligero aumento de velocidad por oleada
    damage: type.damage,
    color: type.color,
    size: type.size,
    alive: true,
    lastShot: 0 // Para snipers
  };

  // Si es un sniper, programar sus disparos
  if (enemyType.toLowerCase() === 'sniper') {
    scheduleSnipeShot(enemy);
  }

  return enemy;
};

const createBullet = (laneId) => {
  const lane = gameState.lanes.find(l => l.id === laneId);
  if (!lane || !lane.enemies || lane.enemies.length === 0 || lane.isGameOver) return null;
  
  const closestEnemy = lane.enemies
    .filter(e => e.alive)
    .reduce((closest, enemy) => {
      return !closest || enemy.y > closest.y ? enemy : closest;
    }, null);
  
  if (!closestEnemy) return null;
  
  return {
    id: Date.now() + Math.random(),
    laneId,
    x: 50,
    y: 580,
    targetX: closestEnemy.x,
    targetY: closestEnemy.y,
    speed: 8,
    damage: 1,
    alive: true
  };
};

const createEnemyProjectile = (enemy) => {
  return {
    id: Date.now() + Math.random(),
    laneId: enemy.laneId,
    x: enemy.x,
    y: enemy.y,
    speed: ENEMY_TYPES.SNIPER.projectileSpeed,
    damage: enemy.damage,
    alive: true,
    fromSniper: true
  };
};

const scheduleSnipeShot = (sniper) => {
  const shootInterval = setInterval(() => {
    if (!sniper.alive) {
      clearInterval(shootInterval);
      sniperTimers.delete(sniper.id);
      return;
    }

    const lane = gameState.lanes.find(l => l.id === sniper.laneId);
    if (lane && !lane.isGameOver) {
      const projectile = createEnemyProjectile(sniper);
      if (projectile) {
        if (!lane.enemyProjectiles) lane.enemyProjectiles = [];
        lane.enemyProjectiles.push(projectile);
      }
    }
  }, ENEMY_TYPES.SNIPER.shootInterval);

  sniperTimers.set(sniper.id, shootInterval);
};

const handleBossDeath = (boss) => {
  const lane = gameState.lanes.find(l => l.id === boss.laneId);
  if (lane && ENEMY_TYPES.BOSS.splitsInto) {
    // Crear 2 Especial 1 en el mismo lugar
    for (let i = 0; i < ENEMY_TYPES.BOSS.splitCount; i++) {
      const newEnemy = createEnemy(boss.laneId, ENEMY_TYPES.BOSS.splitsInto, gameState.waveSystem.currentWave);
      if (newEnemy) {
        newEnemy.x = boss.x;
        newEnemy.y = boss.y;
        if (!lane.enemies) lane.enemies = [];
        lane.enemies.push(newEnemy);
      }
    }
  }
};

// Función para limpiar timers
const clearTimers = () => {
  if (waveTimer) {
    clearInterval(waveTimer);
    waveTimer = null;
  }
  if (spawnTimer) {
    clearInterval(spawnTimer);
    spawnTimer = null;
  }
  // Limpiar timers de snipers
  sniperTimers.forEach(timer => clearInterval(timer));
  sniperTimers.clear();
};

// Sistema de oleadas con diferentes tipos de enemigos
const getWaveTime = (waveNumber) => {
  return waveNumber <= 5 ? 15 : 20;
};

const getEnemySpawnPlan = (waveNumber) => {
  const plan = [];

  // OLEADA 1: 2 básicos
  if (waveNumber === 1) {
    plan.push({ type: 'basic', count: 2 });
  }
  // OLEADA 2: 3 básicos
  else if (waveNumber === 2) {
    plan.push({ type: 'basic', count: 3 });
  }
  // OLEADA 3: 4 básicos
  else if (waveNumber === 3) {
    plan.push({ type: 'basic', count: 4 });
  }
  // OLEADA 4: 2 básicos y 1 grupo de 5 minis
  else if (waveNumber === 4) {
    plan.push({ type: 'basic', count: 2 });
    plan.push({ type: 'mini', count: 1, isGroup: true, customGroupSize: 5 });
  }
  // OLEADA 5: 3 básicos y 1 grupo de 5 minis
  else if (waveNumber === 5) {
    plan.push({ type: 'basic', count: 3 });
    plan.push({ type: 'mini', count: 1, isGroup: true, customGroupSize: 5 });
  }
  // OLEADA 6: 1 tanque y 2 básicos
  else if (waveNumber === 6) {
    plan.push({ type: 'tank', count: 1 });
    plan.push({ type: 'basic', count: 2 });
  }
  // OLEADA 7: 2 grupos de 5 minis
  else if (waveNumber === 7) {
    plan.push({ type: 'mini', count: 1, isGroup: true, customGroupSize: 5 });
    plan.push({ type: 'mini', count: 1, isGroup: true, customGroupSize: 5 });
  }
  // OLEADA 8: 1 especial y 4 básicos
  else if (waveNumber === 8) {
    plan.push({ type: 'special1', count: 1 });
    plan.push({ type: 'basic', count: 4 });
  }
  // OLEADA 9: 1 tanque y 1 grupo de 5 minis
  else if (waveNumber === 9) {
    plan.push({ type: 'tank', count: 1 });
    plan.push({ type: 'mini', count: 1, isGroup: true, customGroupSize: 5 });
  }
  // OLEADA 10: 1 sniper y 5 básicos
  else if (waveNumber === 10) {
    plan.push({ type: 'sniper', count: 1 });
    plan.push({ type: 'basic', count: 5 });
  }
  // OLEADA 11: 2 tanques
  else if (waveNumber === 11) {
    plan.push({ type: 'tank', count: 2 });
  }
  // OLEADA 12: 1 especial, 1 sniper y 1 grupo de 5 minis
  else if (waveNumber === 12) {
    plan.push({ type: 'special1', count: 1 });
    plan.push({ type: 'sniper', count: 1 });
    plan.push({ type: 'mini', count: 1, isGroup: true, customGroupSize: 5 });
  }
  // OLEADA 13+
  else {
    const basicCount = Math.floor(waveNumber / 2);
    plan.push({ type: 'basic', count: basicCount });

    const miniGroups = Math.floor(waveNumber / 4);
    for (let i = 0; i < miniGroups; i++) {
      plan.push({ type: 'mini', count: 1, isGroup: true, customGroupSize: 5 });
    }
    
    if (waveNumber % 4 === 0) {
      plan.push({ type: 'special1', count: Math.floor(waveNumber / 6) });
    }
    if (waveNumber % 5 === 0) {
      plan.push({ type: 'tank', count: Math.floor(waveNumber / 6) });
    }
    if (waveNumber % 6 === 0) {
      plan.push({ type: 'sniper', count: Math.floor(waveNumber / 7) });
    }
    if (waveNumber % 10 === 0) {
      plan.push({ type: 'boss', count: 1 });
    }
  }

  console.log(`📊 Oleada ${waveNumber} (RE-BALANCE v16) spawn plan:`, plan);
  return plan;
};

const startWave = () => {
  if (gameState.globalGameOver) return;
  
  gameState.waveSystem.currentWave += 1;
  const waveTime = getWaveTime(gameState.waveSystem.currentWave);
  gameState.waveSystem.timeRemaining = waveTime;
  gameState.waveSystem.maxTime = waveTime;
  gameState.waveSystem.isActive = true;
  gameState.waveSystem.isPaused = false;
  
  console.log(`🌊 Iniciando oleada ${gameState.waveSystem.currentWave} (${waveTime}s)`);
  
  // Limpiar timers anteriores
  clearTimers();
  
  // Timer principal de la oleada
  waveTimer = setInterval(() => {
    if (!gameState.waveSystem.isPaused && gameState.waveSystem.isActive) {
      gameState.waveSystem.timeRemaining -= 1;
      
      if (gameState.waveSystem.timeRemaining <= 0) {
        clearTimers();
        startWave(); // Iniciar siguiente oleada automáticamente
      }
    }
  }, 1000);
  
  // Obtener plan de spawn para esta oleada
  const spawnPlan = getEnemySpawnPlan(gameState.waveSystem.currentWave);
  
  if (spawnPlan.length === 0) return;

  // SPAWN INMEDIATO DE TODOS LOS GRUPOS
  const spawnInterval = (waveTime * 1000) / spawnPlan.length; // Dividir tiempo por número de GRUPOS
  let currentPlanIndex = 0;
  
  // Función para spawnear un grupo completo
  const spawnGroup = (plan) => {
    gameState.lanes.forEach(lane => {
      if (!lane.isGameOver) {
        if (!lane.enemies) lane.enemies = [];
        
        if (plan.type === 'mini' && plan.isGroup) {
          // Grupo de minis
          const groupSize = plan.customGroupSize || ENEMY_TYPES.MINI.groupSize;
          console.log(`👾 Spawning ${groupSize} minis JUNTOS in lane ${lane.id}`);
          
          for (let i = 0; i < groupSize; i++) {
            const enemy = createEnemy(lane.id, plan.type, gameState.waveSystem.currentWave);
            if (enemy) {
              enemy.y = i * -40; // Espaciar verticalmente
              lane.enemies.push(enemy);
            }
          }
        }
        else {
          // Otros tipos (básicos, especiales, tanques, snipers, boss) - TODOS JUNTOS
          console.log(`⚡ Spawning ${plan.count} ${plan.type} JUNTOS in lane ${lane.id}`);
          
          for (let i = 0; i < plan.count; i++) {
            const enemy = createEnemy(lane.id, plan.type, gameState.waveSystem.currentWave);
            if (enemy) {
              enemy.y = i * -60; // Más espacio para enemigos grandes
              lane.enemies.push(enemy);
            }
          }
        }
      }
    });
  };

  // Spawnear el primer grupo inmediatamente
  if (currentPlanIndex < spawnPlan.length) {
    spawnGroup(spawnPlan[currentPlanIndex]);
    currentPlanIndex++;
  }

  // Timer para spawnear los siguientes grupos
  if (spawnPlan.length > 1) {
    spawnTimer = setInterval(() => {
      if (!gameState.waveSystem.isPaused && gameState.waveSystem.isActive && currentPlanIndex < spawnPlan.length) {
        spawnGroup(spawnPlan[currentPlanIndex]);
        currentPlanIndex++;
        
        // Si ya spawneamos todos los grupos, limpiar el timer
        if (currentPlanIndex >= spawnPlan.length) {
          clearInterval(spawnTimer);
          spawnTimer = null;
        }
      }
    }, spawnInterval);
  }
};

const pauseWaves = () => {
  gameState.waveSystem.isPaused = true;
  console.log('⏸️ Oleadas pausadas');
};

const resumeWaves = () => {
  gameState.waveSystem.isPaused = false;
  console.log('▶️ Oleadas reanudadas');
};

const stopWaves = () => {
  gameState.waveSystem.isActive = false;
  gameState.waveSystem.isPaused = false;
  gameState.waveSystem.currentWave = 0;
  gameState.waveSystem.timeRemaining = 15;
  gameState.waveSystem.maxTime = 15;
  
  // Limpiar timers
  clearTimers();
  
  // Reset del juego completo
  gameState.lanes = [
    { id: 1, baseHealth: 100, enemies: [], bullets: [], enemyProjectiles: [], isGameOver: false },
    { id: 2, baseHealth: 100, enemies: [], bullets: [], enemyProjectiles: [], isGameOver: false },
    { id: 3, baseHealth: 100, enemies: [], bullets: [], enemyProjectiles: [], isGameOver: false },
    { id: 4, baseHealth: 100, enemies: [], bullets: [], enemyProjectiles: [], isGameOver: false }
  ];
  gameState.globalGameOver = false;
  gameState.winner = null;
  
  console.log('🛑 Oleadas detenidas y juego reseteado');
};

// Verificar ganador
const checkWinner = () => {
  const aliveLanes = gameState.lanes.filter(lane => !lane.isGameOver);
  
  if (aliveLanes.length === 1) {
    gameState.globalGameOver = true;
    gameState.winner = aliveLanes[0].id;
    clearTimers();
    gameState.waveSystem.isActive = false;
    console.log(`🏆 ¡Jugador ${gameState.winner} ha ganado!`);
  } else if (aliveLanes.length === 0) {
    gameState.globalGameOver = true;
    gameState.winner = null;
    clearTimers();
    gameState.waveSystem.isActive = false;
    console.log('💀 ¡Todos los jugadores han perdido!');
  }
};

// Lógica del juego
const updateGame = () => {
  // Ahora solo llamamos al update del GameState
  gameState.updateGame();
};

// Función para crear una versión limpia del gameState
const getCleanGameState = () => {
  return gameState.getState();
};

// Socket.IO eventos
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  // Enviar estado inicial al conectar
  socket.emit('gameState', getCleanGameState());
  
  // --- EVENTOS DE ADMINISTRADOR ---
  socket.on('admin:setEnergy', (data) => {
    // Llamamos directamente al método del handler que ya tiene la lógica
    tikTokHandler.handleAdminEvent('admin:setEnergy', data);
    // No es necesario emitir aquí, el bucle principal ya lo hace
  });

  // --- EVENTOS DEL JUEGO (ej. desde el panel de admin) ---
  socket.on('startWaves', () => {
    gameState.startWaves();
  });

  socket.on('pauseWaves', () => {
    gameState.pauseWaves();
  });

  socket.on('stopWaves', () => {
    gameState.stopWaves();
  });

  socket.on('forceNextWave', () => {
    gameState.forceNextWave();
  });

  // --- EVENTOS DE TIKTOK (simulados o reales) ---
  // Aquí es donde el central-brain se conectaría
  // Por ahora, podemos usarlo para depuración si fuera necesario

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Game loop
setInterval(updateGame, 1000 / 60); // 60 FPS

// Enviar estado del juego cada frame
setInterval(() => {
  io.emit('gameState', getCleanGameState());
}, 1000 / 60);

// Rutas básicas
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', gameState: getCleanGameState() });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🎮 Juego disponible en: http://localhost:5001`);
  console.log(`⚙️  Admin disponible en: http://localhost:5001/admin`);
});