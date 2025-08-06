const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const STATS_FILE_PATH = path.join(__dirname, '..', '..', 'data', 'stats.json');

const defaultStats = {
  winsByTeam: {},
  pointsByUser: {},
  giftsByUser: {}
};

class StatsStorage {
  constructor() {
    this.stats = this.load();
  }

  load() {
    try {
      if (fs.existsSync(STATS_FILE_PATH)) {
        const data = fs.readFileSync(STATS_FILE_PATH, 'utf8');
        return JSON.parse(data);
      } else {
        this.save(defaultStats);
        return { ...defaultStats };
      }
    } catch (error) {
      logger.error({ err: error }, '[StatsStorage] Error al cargar estadísticas');
      return { ...defaultStats };
    }
  }

  save(stats) {
    try {
      fs.writeFileSync(STATS_FILE_PATH, JSON.stringify(stats, null, 2));
    } catch (error) {
      logger.error({ err: error }, '[StatsStorage] Error al guardar estadísticas');
    }
  }

  getStats() {
    return this.stats;
  }

  addWin(teamName) {
    if (!this.stats.winsByTeam[teamName]) {
      this.stats.winsByTeam[teamName] = 0;
    }
    this.stats.winsByTeam[teamName]++;
    this.save(this.stats);
    logger.info(`[StatsStorage] Victoria registrada para ${teamName}. Total: ${this.stats.winsByTeam[teamName]}`);
  }

  addPoints(userId, points) {
    if (!this.stats.pointsByUser[userId]) {
      this.stats.pointsByUser[userId] = 0;
    }
    this.stats.pointsByUser[userId] += points;
    this.save(this.stats);
  }
  
  addGift(userId, giftName, count) {
      if (!this.stats.giftsByUser[userId]) {
          this.stats.giftsByUser[userId] = {};
      }
      if (!this.stats.giftsByUser[userId][giftName]) {
          this.stats.giftsByUser[userId][giftName] = 0;
      }
      this.stats.giftsByUser[userId][giftName] += count;
      this.save(this.stats);
  }

  reset() {
    try {
      if (fs.existsSync(STATS_FILE_PATH)) {
        fs.unlinkSync(STATS_FILE_PATH);
        logger.warn('[StatsStorage] Archivo de estadísticas eliminado.');
      }
      this.stats = { ...defaultStats };
      return true;
    } catch (error) {
      logger.error({ err: error }, '[StatsStorage] Error al resetear estadísticas');
      return false;
    }
  }
}

// Exportar una única instancia (Singleton)
module.exports = new StatsStorage();