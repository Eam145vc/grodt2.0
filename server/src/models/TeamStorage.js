const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const storagePath = path.join(__dirname, '..', '..', '..', 'data', 'user-teams.json');

class TeamStorage {
    constructor() {
        this.userTeams = this.load();
    }

    load() {
        try {
            if (fs.existsSync(storagePath)) {
                const data = fs.readFileSync(storagePath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            logger.error({ err: error }, "Error al cargar 'user-teams.json'");
        }
        return {};
    }

    save() {
        try {
            const dir = path.dirname(storagePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(storagePath, JSON.stringify(this.userTeams, null, 2));
        } catch (error) {
            logger.error({ err: error }, "Error al guardar 'user-teams.json'");
        }
    }

    setTeam(userId, teamName) {
        this.userTeams[userId] = teamName;
        this.save();
    }

    getTeam(userId) {
        return this.userTeams[userId];
    }

    reset() {
        try {
            this.userTeams = {};
            this.save();
            logger.warn('[TeamStorage] Almacenamiento de equipos reseteado.');
            return true;
        } catch (error) {
            logger.error({ err: error }, '[TeamStorage] Error al resetear el almacenamiento de equipos');
            return false;
        }
    }
}

module.exports = new TeamStorage();