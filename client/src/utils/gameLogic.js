// Constantes del juego
export const GAME_CONSTANTS = {
  LANES: 4,
  BASE_HEALTH: 100,
  ENEMY_HEALTH: 5,
  BULLET_DAMAGE: 1,
  ENEMY_SPEED: 2,
  BULLET_SPEED: 8,
  CANVAS_WIDTH: 400,
  CANVAS_HEIGHT: 600,
  ENEMY_SIZE: 15,
  BULLET_SIZE: 5
};

// Funciones de utilidad
export const createEnemy = (laneId) => {
  return {
    id: Date.now() + Math.random(),
    laneId,
    x: 50,
    y: 0,
    health: GAME_CONSTANTS.ENEMY_HEALTH,
    maxHealth: GAME_CONSTANTS.ENEMY_HEALTH,
    speed: GAME_CONSTANTS.ENEMY_SPEED,
    alive: true
  };
};

export const createBullet = (laneId, targetEnemy) => {
  if (!targetEnemy) return null;
  
  return {
    id: Date.now() + Math.random(),
    laneId,
    x: 50,
    y: GAME_CONSTANTS.CANVAS_HEIGHT - 20,
    targetX: targetEnemy.x,
    targetY: targetEnemy.y,
    speed: GAME_CONSTANTS.BULLET_SPEED,
    damage: GAME_CONSTANTS.BULLET_DAMAGE,
    alive: true
  };
};

export const findClosestEnemy = (enemies) => {
  return enemies
    .filter(enemy => enemy.alive)
    .reduce((closest, enemy) => {
      return !closest || enemy.y > closest.y ? enemy : closest;
    }, null);
};

export const checkCollision = (obj1, obj2, threshold = 30) => {
  return Math.abs(obj1.x - obj2.x) < threshold && 
         Math.abs(obj1.y - obj2.y) < threshold;
};

export const moveEnemy = (enemy) => {
  return {
    ...enemy,
    y: enemy.y + enemy.speed
  };
};

export const moveBullet = (bullet) => {
  return {
    ...bullet,
    y: bullet.y - bullet.speed
  };
};

export const isOffScreen = (object, canvasHeight = GAME_CONSTANTS.CANVAS_HEIGHT) => {
  return object.y < 0 || object.y > canvasHeight;
};

export const calculateScore = (enemiesKilled) => {
  return enemiesKilled * 10;
};