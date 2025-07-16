const PRESALA_CONFIG = require('../config/presalaConfig');

class PresalaHandler {
  constructor(gameState) {
    this.gameState = gameState;
  }

  handleJoinTeam(userId, teamName) {
    const normalizedTeamName = teamName.toLowerCase();

    if (!PRESALA_CONFIG.ALLOWED_TEAMS.includes(normalizedTeamName)) {
      console.log(`Intento de unirse a un equipo no válido: ${teamName}`);
      return;
    }

    const { teams, userTeam } = this.gameState.presala;

    // Si el usuario ya estaba en un equipo, removerlo del equipo anterior
    if (userTeam[userId]) {
      const oldTeam = userTeam[userId];
      if (teams[oldTeam]) {
        teams[oldTeam].members.delete(userId);
      }
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

    console.log(`Usuario ${userId} se ha unido al equipo ${normalizedTeamName}`);
  }
}

module.exports = PresalaHandler;