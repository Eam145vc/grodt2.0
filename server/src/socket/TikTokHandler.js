const giftActions = {
  'GG': { enemy: 'basic' },
  'Love you so much': { enemy: 'basic' },
  'TikTok': { enemy: 'basic' },
  'It\'s corn': { enemy: 'basic' },
  'Journey Pass': { enemy: 'tank' },
  'Friendship Necklace': { enemy: 'tank' },
  'Rosa': { enemy: 'tank' },
  'Heart': { enemy: 'tank' }
};

const comboActions = {
  'GG': { enemy: 'special1' },
  'Love you so much': { enemy: 'special1' },
  'TikTok': { enemy: 'special1' },
  'It\'s corn': { enemy: 'special1' },
  'Journey Pass': { enemy: 'boss' },
  'Friendship Necklace': { enemy: 'boss' },
  'Rosa': { enemy: 'boss' },
  'Heart': { enemy: 'boss' }
};

const COMBO_WINDOW = 3000;

class TikTokHandler {
  constructor(gameState) {
    this.gameState = gameState;
    this.userCoins = new Map();
    this.userGiftCombos = new Map();
  }

  handleEvent(eventType, data) {
    const userId = data.user;
    if (!userId) return;

    // Si la presala está activa, manejar el evento de presala
    if (this.gameState.presala.isActive) {
      if (eventType === 'like' || eventType === 'gift') {
        this.handlePresalaEvent(eventType, data);
      }
      return; // No continuar al juego principal si la presala está activa
    }

    // Si el juego principal está activo
    if (this.gameState.waveSystem.isActive) {
      const userTeam = this.gameState.presala.userTeam[userId];
      const targetLane = this.getLaneForUser(userTeam);

      // Lógica para regalos que spawnean enemigos (ataques)
      const giftAction = giftActions[data.gift_name] || comboActions[data.gift_name];
      if (eventType === 'gift' && giftAction && giftAction.enemy) {
        // La lane de ataque viene del propio regalo, no del equipo del usuario
        const attackLane = data.lane;
        if (attackLane) {
          this.handleGift({ ...data, lane: attackLane });
        }
        return;
      }

      // Lógica para likes y regalos de apoyo (disparos, power-ups)
      if (targetLane) {
        switch (eventType) {
          case 'like':
            // Cada like añade 1 punto de energía
            const energyToAdd = data.count || 1;
            targetLane.energy = Math.min(1000, targetLane.energy + energyToAdd);
            console.log(`[TikTokHandler] +${energyToAdd} de energía para carril ${targetLane.id}. Total: ${targetLane.energy}`);
            break;
          case 'gift':
            this.handleGift({ ...data, lane: targetLane.id });
            break;
        }
      }
    }
  }

  getLaneForUser(userTeam) {
    if (!userTeam) return null;
    return this.gameState.lanes.find(lane => lane.team === userTeam);
  }

  handlePresalaEvent(eventType, data) {
    const userId = data.user;
    if (!userId) return;

    const userTeam = this.gameState.presala.userTeam[userId];
    if (!userTeam) {
      console.log(`Usuario ${userId} no está en ningún equipo para la presala`);
      return;
    }

    if (!this.gameState.presala.teams[userTeam]) {
      this.gameState.presala.teams[userTeam] = {
        points: 0,
        members: new Set()
      };
    }

    let points = 0;
    
    switch (eventType) {
      case 'like':
        points = 1 * (data.count || 1);
        break;
      case 'gift':
        const giftValue = this.getGiftValue(data.gift_name);
        points = giftValue * (data.count || 1);
        break;
    }

    if (points > 0) {
      this.gameState.presala.teams[userTeam].points += points;
      console.log(`[PRESALA] Equipo ${userTeam} ganó ${points} puntos (${eventType}). Total: ${this.gameState.presala.teams[userTeam].points}`);
    }
  }

  getGiftValue(giftName) {
    const giftValues = {
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
    };
    return giftValues[giftName] || 2;
  }

  addCoins(userId, amount, lane) {
    if (!this.userCoins.has(userId)) {
      this.userCoins.set(userId, 0);
    }
    let currentCoins = this.userCoins.get(userId);
    currentCoins += amount;
    if (currentCoins >= 100) {
      const powerUpCount = Math.floor(currentCoins / 100);
      for (let i = 0; i < powerUpCount; i++) {
        this.gameState.activateDoubleBullets(lane);
      }
      currentCoins %= 100;
    }
    this.userCoins.set(userId, currentCoins);
  }

  handleGift(giftData) {
    const { user, gift_name, lane } = giftData;
    const comboKey = `${user}-${gift_name}`;

    if (this.userGiftCombos.has(comboKey)) {
      const combo = this.userGiftCombos.get(comboKey);
      combo.count++;
      clearTimeout(combo.timer);
      combo.timer = setTimeout(() => {
        this.processCombo(comboKey);
      }, COMBO_WINDOW);
    } else {
      const combo = {
        user,
        gift_name,
        lane,
        count: 1,
        timer: setTimeout(() => {
          this.processCombo(comboKey);
        }, COMBO_WINDOW)
      };
      this.userGiftCombos.set(comboKey, combo);
    }
  }

  processCombo(comboKey) {
    if (!this.userGiftCombos.has(comboKey)) return;

    const { gift_name, count, lane } = this.userGiftCombos.get(comboKey);
    this.userGiftCombos.delete(comboKey);

    console.log(`[TikTokHandler] Procesando combo: ${count}x "${gift_name}" para el carril ${lane}`);

    if (count >= 5) {
      const comboAction = comboActions[gift_name];
      if (comboAction) {
        const comboCount = Math.floor(count / 5);
        console.log(`[TikTokHandler] Combo detectado. Generando ${comboCount} enemigo(s) de tipo '${comboAction.enemy}'.`);
        for (let i = 0; i < comboCount; i++) {
          this.gameState.createEnemy(lane, comboAction.enemy);
        }
        
        const remainingGifts = count % 5;
        if (remainingGifts > 0) {
          console.log(`[TikTokHandler] Procesando ${remainingGifts} regalos restantes.`);
          const singleAction = giftActions[gift_name];
          if (singleAction) {
            for (let i = 0; i < remainingGifts; i++) {
              this.gameState.createEnemy(lane, singleAction.enemy);
            }
          }
        }
      }
    } else {
      const singleAction = giftActions[gift_name];
      if (singleAction) {
        console.log(`[TikTokHandler] No es combo. Generando ${count} enemigo(s) de tipo '${singleAction.enemy}'.`);
        for (let i = 0; i < count; i++) {
          this.gameState.createEnemy(lane, singleAction.enemy);
        }
      }
    }

    if (gift_name === 'Game Controller') {
      console.log(`[TikTokHandler] Activando power-up 'Torreta' en el carril ${lane}.`);
      this.gameState.spawnTurret(lane);
    } else if (gift_name === 'Super GG') {
      console.log(`[TikTokHandler] Activando power-up 'Bola de Hielo' en el carril ${lane}.`);
      this.gameState.spawnFreezeBall(lane);
   }
 }

 handleAdminEvent(eventType, data) {
   console.log(`%c[TikTokHandler] Recibido evento de admin: ${eventType}`, 'color: yellow;', data);
   switch (eventType) {
     case 'admin:setEnergy':
       const { laneId, energy } = data;
       const lane = this.gameState.lanes.find(l => l.id === laneId);
       if (lane) {
         lane.energy = Math.max(0, Math.min(1000, energy));
         console.log(`%c[ADMIN] Energía del carril ${laneId} establecida a ${lane.energy}`, 'color: yellow; font-weight: bold;');
       } else {
         console.error(`[ADMIN] No se encontró el carril con ID: ${laneId}`);
       }
       break;
     default:
       console.log(`[ADMIN] Evento desconocido: ${eventType}`);
   }
 }
}

module.exports = TikTokHandler;