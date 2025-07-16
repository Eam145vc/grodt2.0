// Configuración del juego
export const GAME_CONFIG = {
  SERVER_URL: process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000',
  CLIENT_URL: 'http://localhost:5001',
  
  // Dimensiones del canvas
  CANVAS: {
    WIDTH: 400,
    HEIGHT: 600,
    ASPECT_RATIO: '9:16'
  },
  
  // Configuración de carriles
  LANES: {
    COUNT: 4,
    WIDTH: 100 // 400 / 4
  },
  
  // Configuración de enemigos
  ENEMY: {
    INITIAL_HEALTH: 5,
    SPEED: 2,
    SIZE: 15,
    SPAWN_Y: 0,
    COLOR: '#e74c3c',
    BORDER_COLOR: '#c0392b'
  },
  
  // Configuración de balas
  BULLET: {
    DAMAGE: 1,
    SPEED: 8,
    SIZE: 5,
    SPAWN_Y: 580,
    COLOR: '#f39c12',
    HIGHLIGHT_COLOR: '#fff'
  },
  
  // Configuración de la base
  BASE: {
    INITIAL_HEALTH: 100,
    Y_POSITION: 580,
    COLOR: '#e74c3c',
    LINE_WIDTH: 4
  },
  
  // Colores del UI
  COLORS: {
    LANE_SEPARATOR: '#3498db',
    LANE_NUMBER: '#ecf0f1',
    BACKGROUND_START: '#2c3e50',
    BACKGROUND_END: '#34495e',
    CONNECTED: '#27ae60',
    DISCONNECTED: '#e74c3c',
    SCORE: '#f39c12'
  },
  
  // Configuración de red
  NETWORK: {
    RECONNECTION_ATTEMPTS: 5,
    RECONNECTION_DELAY: 1000,
    TIMEOUT: 5000
  },
  
  // FPS del juego
  GAME_LOOP: {
    FPS: 60,
    INTERVAL: 1000 / 60
  }
};

// Estados del juego
export const GAME_STATES = {
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'gameOver',
  LOADING: 'loading'
};

// Tipos de eventos
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  GAME_STATE: 'gameState',
  SPAWN_ENEMY: 'spawnEnemy',
  SHOOT_BULLET: 'shootBullet',
  SHOOT_ALL_BULLETS: 'shootAllBullets',
  RESET_GAME: 'resetGame'
};

// Mensajes de la UI
export const UI_MESSAGES = {
  CONNECTED: '🟢 Conectado',
  DISCONNECTED: '🔴 Desconectado',
  GAME_OVER: '¡GAME OVER!',
  RESTART: 'Reiniciar Juego',
  LOADING: 'Cargando...'
};

// Regalos de TikTok para pruebas
export const TIKTOK_GIFTS = [
  { name: 'GG', lane: 1 },
  { name: 'Journey Pass', lane: 1 },
  { name: 'Love you so much', lane: 2 },
  { name: 'Friendship Necklace', lane: 2 },
  { name: 'TikTok', lane: 3 },
  { name: 'Rosa', lane: 3 },
  { name: 'It’s corn', lane: 4 },
  { name: 'Heart', lane: 4 },
];