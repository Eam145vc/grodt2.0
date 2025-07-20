const PRESALA_CONFIG = require('../config/presalaConfig');

class PresalaHandler {
  constructor(gameState) {
    this.gameState = gameState;
  }

  // La lógica para unirse a un equipo ha sido centralizada en GameState.js
  // para permitir que funcione tanto en la presala como en el juego principal.
  // Este método ya no es necesario aquí.
}

module.exports = PresalaHandler;