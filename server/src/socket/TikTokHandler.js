const logger = require('../utils/logger');
const TeamStorage = require('../models/TeamStorage');
const StatsStorage = require('../models/StatsStorage');
const giftConfig = require('../config/gift-config.json');
const { normalizeString, removeEmojis, flagToCountryMap } = require('../utils/textUtils');
const PRESALA_CONFIG = require('../config/presalaConfig');

// Mapeo de acciones a tipos de enemigos para mayor claridad
const actionToEnemyType = {
  'Básico': 'basic',
  'Especial': 'special1',
  'Tanque': 'tank',
  'JEFE': 'boss'
};

const COMBO_WINDOW = 3000; // 3 segundos para acumular regalos
const TEAM_COMMAND_COOLDOWN = 10 * 60 * 1000; // 10 minutos

class TikTokHandler {
  constructor(gameState, io, socketHandler) {
    this.gameState = gameState;
    this.io = io;
    this.socketHandler = socketHandler;
    this.userGiftCombos = new Map();
    this.userCooldowns = new Map();
    this.processedEventIds = new Set(); // Para de-duplicación de eventos
    
    // Crear un mapa de búsqueda para un acceso rápido a la configuración de regalos
    this.giftMap = new Map();
    giftConfig.lanes.forEach(lane => {
      lane.gifts.forEach(gift => {
        // Normalizar el nombre del regalo para tener una clave consistente
        this.giftMap.set(normalizeString(gift.name), {
          laneId: lane.laneId,
          action: gift.action,
          originalName: gift.name // Guardar el nombre original para los logs
        });
      });
    });
    giftConfig.powerups.forEach(powerup => {
        // Normalizar también los power-ups
        this.giftMap.set(normalizeString(powerup.name), {
            isPowerup: true,
            action: powerup.action,
            originalName: powerup.name // Guardar el nombre original
        });
    });
  }

  handleEvent(eventType, data) {
    const presalaState = this.gameState && this.gameState.presala ? this.gameState.presala.isActive : 'indefinido';
    logger.debug(`[TikTokHandler] Evento recibido: '${eventType}'. Estado de presala activa: ${presalaState}`);
    // --- Lógica de De-duplicación ---
    // Usamos el ID del regalo si existe, si no, creamos un ID compuesto.
    const eventId = data.gift_id || `${eventType}-${data.user}-${data.count}`;
    if (this.processedEventIds.has(eventId)) {
      logger.warn(`[TikTokHandler] Evento duplicado ignorado: ${eventId}`);
      return;
    }
    this.processedEventIds.add(eventId);
    setTimeout(() => this.processedEventIds.delete(eventId), 10000); // Limpiar después de 10s

    const logData = { ...data };
    if (logData.avatarBase64) {
      delete logData.avatarBase64;
    }
    // logger.debug({ eventType, data: logData }, '[TikTokHandler] Received event');
    const userId = data.user;
    if (!userId) return;

    // El cambio de equipo por comentario debe funcionar siempre
    if (eventType === 'comment') {
      this.handleTeamChangeComment(data);
    }

    // Si la presala está activa, manejar eventos de presala
    if (this.gameState.presala.isActive) {
      if (eventType === 'like' || eventType === 'gift' || eventType === 'comment') {
        this.handlePresalaEvent(eventType, data);
      }
      return;
    }

    // Si el juego principal está activo
    if (this.gameState.waveSystem.isActive) {
      if (eventType === 'gift') {
        this.handleGameGift(data);
      } else if (eventType === 'like') {
        this.handleGameLike(data);
      }
    }
  }

  handleTeamChangeComment(data) {
    const { user, comment } = data;
    // Leer comentario crudo y limpiar selectores de variación
    const raw = (comment || '').toString();
    const cleanedRaw = raw.replace(/[\uFE0E\uFE0F]/g, '');
    logger.debug(`[TikTokHandler] raw cleaned comment: '${cleanedRaw}'`);
    logger.debug(`[TikTokHandler] cleanedRaw codepoints: ${Array.from(cleanedRaw).map(c => c.codePointAt(0)).join(',')}`);
    logger.debug(`[TikTokHandler] raw cleaned comment: '${cleanedRaw}'`);
    // Intentar mapear emoji de bandera a país
    const flagMatch = cleanedRaw.match(/(?:\uD83C[\uDDE6-\uDDFF]){2}/gu);
    let targetTeam = flagToCountryMap[flagMatch ? flagMatch[0] : ''];
    if (!targetTeam) {
      // Si no es emoji, normalizar texto (eliminar tildes y otros emojis)
      const normalizedComment = normalizeString(cleanedRaw);
      const afterRemove = removeEmojis(cleanedRaw);
      logger.debug(`[TikTokHandler] after removeEmojis: '${afterRemove}' (codepoints: ${Array.from(afterRemove).map(c => c.codePointAt(0)).join(',')})`);
      logger.debug(`[TikTokHandler] normalized comment: '${normalizedComment}'`);
      logger.debug(`[TikTokHandler] allowed teams (normalized): ${PRESALA_CONFIG.ALLOWED_TEAMS.map(team => normalizeString(team)).join(', ')}`);
      logger.debug(`[TikTokHandler] normalized comment: '${normalizedComment}'`);
      logger.debug(`[TikTokHandler] allowed teams (normalized): ${PRESALA_CONFIG.ALLOWED_TEAMS.map(team => normalizeString(team)).join(', ')}`);
      targetTeam = PRESALA_CONFIG.ALLOWED_TEAMS.find(
        (team) => normalizeString(team) === normalizedComment
      );
    }

    if (targetTeam) {
      if (this.isUserInCooldown(user)) {
        logger.debug(`[TikTokHandler] Comando de equipo de ${user} ignorado por cooldown.`);
        return;
      }

      logger.info(`[TikTokHandler] El usuario ${user} se cambió al equipo ${targetTeam}.`);
      TeamStorage.setTeam(user, targetTeam);
      this.startUserCooldown(user);
      
      // Actualizar siempre el estado del juego en vivo para reflejar el cambio
      this.gameState.assignUserToTeam(user, targetTeam);

      // Si la presala está activa, notificar a los clientes del cambio
      if (this.gameState.presala.isActive) {
          this.socketHandler.broadcastPresalaState();
      }
    }
  }

  isUserInCooldown(userId) {
    if (this.userCooldowns.has(userId)) {
        const cooldownEndTime = this.userCooldowns.get(userId);
        if (Date.now() < cooldownEndTime) {
            return true;
        }
    }
    return false;
  }

  startUserCooldown(userId) {
      const cooldownEndTime = Date.now() + TEAM_COMMAND_COOLDOWN;
      this.userCooldowns.set(userId, cooldownEndTime);
      logger.debug(`[TikTokHandler] Cooldown de 10 minutos iniciado para ${userId}.`);
      setTimeout(() => {
          this.userCooldowns.delete(userId);
      }, TEAM_COMMAND_COOLDOWN);
  }

  handleGameGift(data) {
    const { user, gift_name, count = 1, avatarBase64, value = 0 } = data;
    // Normalizar el nombre del regalo recibido para que coincida con el mapa
    const normalizedGiftName = normalizeString(gift_name);
    const giftInfo = this.giftMap.get(normalizedGiftName);

    if (!giftInfo) {
      logger.warn(`[TikTokHandler] Regalo '${gift_name}' no tiene una acción de juego definida.`);
      return;
    }
    
    // Acumular regalos para combos
    const comboKey = `${user}-${normalizedGiftName}`;
    if (this.userGiftCombos.has(comboKey)) {
      const combo = this.userGiftCombos.get(comboKey);
      // No sumar. El 'count' del evento es el total actual de la ráfaga.
      combo.count = count;
      combo.totalValue = value * count;
      clearTimeout(combo.timer);
      combo.timer = setTimeout(() => this.processCombo(comboKey), COMBO_WINDOW);
    } else {
      const combo = {
        user,
        gift_name: normalizedGiftName, // Usar el nombre normalizado como clave
        original_gift_name: gift_name, // Guardar el nombre original para logs
        count,
        avatarBase64,
        value, // Guardar el valor individual del regalo
        totalValue: value * count,
        timer: setTimeout(() => this.processCombo(comboKey), COMBO_WINDOW)
      };
      this.userGiftCombos.set(comboKey, combo);
    }
  }

  processCombo(comboKey) {
    if (!this.userGiftCombos.has(comboKey)) return;

    const { user, gift_name, original_gift_name, count, avatarBase64, totalValue } = this.userGiftCombos.get(comboKey);
    this.userGiftCombos.delete(comboKey);

    logger.debug(`[TikTokHandler] Procesando combo: ${count}x "${gift_name}" del usuario ${user}.`);

    const giftInfo = this.giftMap.get(gift_name); // gift_name ya está normalizado
    const comboGiftInfo = this.giftMap.get(normalizeString(`${giftInfo.originalName} x5`));

    // Manejar Power-ups (no tienen combos, se aplican por cada unidad)
    if (giftInfo && giftInfo.isPowerup) {
        const userTeam = TeamStorage.getTeam(user);
        if (!userTeam) {
            logger.warn(`[TikTokHandler] Usuario ${user} envió un power-up pero no tiene equipo asignado. Se ignora.`);
            return;
        }
        const targetLane = this.getLaneForUser(userTeam);
        if (targetLane) {
            logger.info(`[GIFT] 🎁 Power-up '${giftInfo.action}' x${count} activado por ${user} para el equipo ${userTeam} (carril ${targetLane.id}).`);
            
            let powerUpName = '';
            if (giftInfo.action === 'Bola de Hielo') {
                powerUpName = '🧊 Bola de Hielo';
            } else if (giftInfo.action === 'Cañón Inteligente') {
                powerUpName = '🏗️ Cañón Inteligente';
            } else if (giftInfo.action === 'Super Cañón') {
                powerUpName = '🔥 Super Cañón';
            }

            if (powerUpName) {
                const message = `⚡ ${user} (${userTeam}) activó ${count > 1 ? `${count}x ` : ''}${powerUpName} para el carril ${targetLane.id}.`;
                this.gameState.addEventToLog(message);
            }

            for (let i = 0; i < count; i++) {
                if (giftInfo.action === 'Bola de Hielo') {
                    this.gameState.spawnFreezeBall(targetLane.id);
                } else if (giftInfo.action === 'Cañón Inteligente') {
                    this.gameState.spawnTurret(targetLane.id, { userId: user, avatarBase64 });
                } else if (giftInfo.action === 'Super Cañón') {
                    this.gameState.addRapidFireToQueue(targetLane.id, {
                        userId: user,
                        avatarBase64,
                        duration: 20000 // 20 segundos de duración
                    });
                }
            }
        }
        return;
    }

    // Manejar regalos de ataque con lógica de combos
    if (comboGiftInfo && count >= 5) {
      const comboCount = Math.floor(count / 5);
      const remainingCount = count % 5;

      const comboEnemyType = actionToEnemyType[comboGiftInfo.action];
      const targetLaneId = comboGiftInfo.laneId;
      
      logger.info(`[GIFT] 🎁 Combo de ${original_gift_name}: ${comboCount}x '${comboEnemyType}' para carril ${targetLaneId} (enviado por ${user}).`);
      this.gameState.createEnemyBatch(targetLaneId, comboEnemyType, comboCount, avatarBase64);
      const message = `🎁 ${user} envió un combo de ${original_gift_name} x5, invocando ${comboCount}x enemigo '${comboEnemyType}' en el carril ${targetLaneId}.`;
      this.gameState.addEventToLog(message);

      if (remainingCount > 0) {
        const singleEnemyType = actionToEnemyType[giftInfo.action];
        logger.debug(`[TikTokHandler] Restantes: ${remainingCount}x '${singleEnemyType}' en carril ${giftInfo.laneId}.`);
        this.gameState.createEnemyBatch(giftInfo.laneId, singleEnemyType, remainingCount, avatarBase64);
        const remainingMessage = `🎁 ...y ${remainingCount}x enemigo '${singleEnemyType}' en el carril ${giftInfo.laneId}.`;
        this.gameState.addEventToLog(remainingMessage);
      }
    } else {
      // No hay combo o no se alcanzó el mínimo
      const enemyType = actionToEnemyType[giftInfo.action];
      const targetLaneId = giftInfo.laneId;
      logger.info(`[GIFT] 🎁 Regalo normal: ${count}x '${original_gift_name}' (${enemyType}) para carril ${targetLaneId} (enviado por ${user}).`);
      this.gameState.createEnemyBatch(targetLaneId, enemyType, count, avatarBase64);
      const message = `🎁 ${user} envió ${count}x ${original_gift_name}, invocando ${count > 1 ? `${count}x ` : ''}enemigo '${enemyType}' en el carril ${targetLaneId}.`;
      this.gameState.addEventToLog(message);
    }
    
    // Añadir monedas al equipo del usuario
    const userTeam = TeamStorage.getTeam(user);
    if (!userTeam) {
        logger.warn(`[TikTokHandler] Usuario ${user} envió un regalo pero no tiene equipo asignado. No se pueden añadir monedas.`);
        return;
    }
    const supportLane = this.getLaneForUser(userTeam);
    if (supportLane && totalValue > 0) {
        // La lógica de monedas ahora solo se aplica a regalos que NO son power-ups.
        // La lógica de monedas ahora solo se aplica a regalos que NO son power-ups.
        // this.addCoins(user, totalValue, supportLane.id, avatarBase64);
        
        // Registrar estadísticas de regalos
        if (totalValue > 0) {
            StatsStorage.addPoints(user, totalValue);
            StatsStorage.addGift(user, original_gift_name, count);
        }
    }
  }
  
  handleGameLike(data) {
      const { user, count = 1 } = data;
      const userTeam = TeamStorage.getTeam(user);
      if (!userTeam) {
        logger.warn(`[TikTokHandler] Usuario ${user} envió un like pero no tiene equipo asignado. Se ignora.`);
        return;
      }
      const targetLane = this.getLaneForUser(userTeam);
      if (targetLane) {
          const energyGain = count * 20; // Cada like ahora da 3 de energía
          targetLane.energy = Math.min(1000, targetLane.energy + energyGain);
          // logger.debug(`[TikTokHandler] +${energyGain} de energía para carril ${targetLane.id}. Total: ${targetLane.energy}`);
          const message = `👍 ${user} (${userTeam}) dio ${count} like(s), +${energyGain} de energía para el carril ${targetLane.id}.`;
          this.gameState.addEventToLog(message);
      }
  }

  getLaneForUser(userTeam) {
    if (!userTeam) return null;
    return this.gameState.lanes.find(lane => lane.team === userTeam);
  }

  handlePresalaEvent(eventType, data) {
    try {
      const { user, avatarBase64 } = data;
      const userTeam = TeamStorage.getTeam(user);

      logger.debug(`[PRESALA] Iniciando handlePresalaEvent para usuario: ${user}, equipo: ${userTeam}`);
      logger.debug(`[PRESALA] Estado actual de presala.teams:`, this.gameState.presala.teams);

      if (!userTeam) {
        logger.warn(`[PRESALA] Evento de ${user} ignorado. El usuario debe elegir un equipo para participar.`);
        return;
      }

      let points = 0;
      let interactionValue = 0;
      let ballCount = 0;

      if (eventType === 'like') {
        points = PRESALA_CONFIG.POINTS_PER_LIKE * (data.count || 1);
        interactionValue = 1;
        ballCount = points;
      } else if (eventType === 'gift') {
        const coinValue = data.value || data.count || 1;
        points = coinValue * (data.count || 1) * PRESALA_CONFIG.POINTS_PER_GIFT;
        interactionValue = coinValue;
        ballCount = data.count || 1;
      } else if (eventType === 'comment') {
        points = PRESALA_CONFIG.POINTS_PER_COMMENT;
        interactionValue = 1;
        ballCount = 1;
      }

      if (points > 0) {
        const teams = this.gameState.presala.teams;

        const getLeader = (currentTeams) => {
          if (!currentTeams || Object.keys(currentTeams).length === 0) {
            return null;
          }
          
          const teamsWithPoints = Object.keys(currentTeams).filter(
            (team) => currentTeams[team].points > 0
          );

          if (teamsWithPoints.length === 0) {
            return null;
          }

          return teamsWithPoints.reduce((leader, team) => {
            if (!leader || currentTeams[team].points > currentTeams[leader].points) {
              return team;
            }
            return leader;
          }, null);
        };

        const oldLeader = getLeader(teams);
        logger.debug(`[PRESALA] Líder antiguo detectado: ${oldLeader}`);

        if (!teams[userTeam]) {
          logger.debug(`[PRESALA] Creando entrada para el nuevo equipo: ${userTeam}`);
          teams[userTeam] = { points: 0, members: new Set() };
        }
        teams[userTeam].points += points;
        logger.debug(`[PRESALA] Equipo ${userTeam} ganó ${points} puntos. Total: ${teams[userTeam].points}`);

        this.io.emit('presalaInteraction', {
          teamId: userTeam,
          avatarBase64: avatarBase64,
          interactionValue: interactionValue,
          ballCount: ballCount,
        });

        const newLeader = getLeader(teams);
        logger.debug(`[PRESALA] Nuevo líder detectado: ${newLeader}`);

        if (newLeader && newLeader !== oldLeader) {
          logger.info(`[PRESALA] Cambio de líder detectado. Antiguo: ${oldLeader || 'Ninguno'}, Nuevo: ${newLeader}. Emitiendo evento...`);
          this.io.emit('newPresalaLeader', { teamName: newLeader });
        }
      }
    } catch (error) {
      logger.error('[PRESALA] CRASH DETECTADO en handlePresalaEvent:', error);
    }
  }

  handleAdminEvent(eventType, data) {
    logger.info({ data }, `[TikTokHandler] Recibido evento de admin: ${eventType}`);
    switch (eventType) {
      case 'admin:setEnergy':
        const { laneId, energy } = data;
        const lane = this.gameState.lanes.find(l => l.id === laneId);
        if (lane) {
          lane.energy = Math.max(0, Math.min(1000, energy));
          logger.info(`[ADMIN] Energía del carril ${laneId} establecida a ${lane.energy}`);
        } else {
          logger.error(`[ADMIN] No se encontró el carril con ID: ${laneId}`);
        }
        break;
      default:
        logger.warn(`[ADMIN] Evento desconocido: ${eventType}`);
    }
  }
}

module.exports = TikTokHandler;