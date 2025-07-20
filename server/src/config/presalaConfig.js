const PRESALA_CONFIG = {
  // Configuración de clasificación
  POINTS_TO_QUALIFY: 1000,
  CLASSIFICATION_PERCENTAGE: 90,
  TOP_TEAMS_TO_QUALIFY: 4,
  
  // Configuración de puntos
  POINTS_PER_LIKE: 1,
  POINTS_PER_GIFT: 2,
  
  // Duración de la presala
  DURATION_SECONDS: 180,
  WARNING_TIME_SECONDS: 10,
  
  // Equipos permitidos
  ALLOWED_TEAMS: [
    'argentina',
    'bolivia', 
    'chile',
    'colombia',
    'costa rica',
    'cuba',
    'ecuador',
    'el salvador',
    'guatemala',
    'honduras',
    'mexico',
    'nicaragua',
    'panama',
    'paraguay',
    'peru',
    'puerto rico',
    'republica dominicana',
    'uruguay',
    'venezuela',
    'brasil'
  ],
  
  // Configuración de regalos específicos
  GIFT_VALUES: {
    'rose': 1,
    'heart': 2,
    'diamond': 5,
    'rocket': 10,
    'universe': 50,
    'GG': 2,
    'Love you so much': 2,
    'TikTok': 2,
    'It\'s corn': 2,
    'Journey Pass': 5,
    'Friendship Necklace': 5,
    'Rosa': 5,
    'Heart': 5,
    'Game Controller': 10,
    'Super GG': 10
  },
  
  // Comandos válidos para unirse a equipos
  TEAM_COMMAND_PATTERNS: [
    '/equipo {team}',
    'equipo {team}',
    '/team {team}',
    'team {team}',
    '#{team}',
    '@{team}',
    '{team}'
  ]
};

module.exports = PRESALA_CONFIG;