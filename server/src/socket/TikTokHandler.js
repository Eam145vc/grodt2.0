const giftActions = {
  'GG': { enemy: 'basic' },
  'Love you so much': { enemy: 'basic' },
  'TikTok': { enemy: 'basic' },
  'It’s corn': { enemy: 'basic' },
  'Journey Pass': { enemy: 'tank' },
  'Friendship Necklace': { enemy: 'tank' },
  'Rosa': { enemy: 'tank' },
  'Heart': { enemy: 'tank' },
};

const comboActions = {
  'GG': { enemy: 'special1' },
  'Love you so much': { enemy: 'special1' },
  'TikTok': { enemy: 'special1' },
  'It’s corn': { enemy: 'special1' },
  'Journey Pass': { enemy: 'boss' },
  'Friendship Necklace': { enemy: 'boss' },
  'Rosa': { enemy: 'boss' },
  'Heart': { enemy: 'boss' },
};

const COMBO_WINDOW = 3000; // 3 segundos para detectar un combo

class TikTokHandler {
  constructor(gameState) {
    this.gameState = gameState;
    this.userCoins = new Map();
    this.userGiftCombos = new Map(); // Mapa para combos: userId -> { giftName, count, timer }
  }

  handleEvent(eventType, data) {
    if (data.lane === undefined) {
      console.log(`Evento ignorado: no tiene carril asignado. Evento: ${eventType}`, data);
      return;
    }

    switch (eventType) {
      case 'like':
        this.gameState.shootBullet(data.lane);
        break;
      case 'gift':
        this.handleGift(data);
        break;
      case 'addCoins':
        this.addCoins(data.user || 'test_user', data.amount, data.lane);
        break;
      default:
        console.log(`Evento desconocido o no manejado: ${eventType}`);
    }
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

    // Si ya hay un combo en proceso para este usuario y regalo
    if (this.userGiftCombos.has(comboKey)) {
      const combo = this.userGiftCombos.get(comboKey);
      combo.count++;
      // Reiniciar el temporizador
      clearTimeout(combo.timer);
      combo.timer = setTimeout(() => {
        this.processCombo(comboKey);
      }, COMBO_WINDOW);
    } else {
      // Iniciar un nuevo combo
      const combo = {
        user,
        gift_name,
        lane,
        count: 1,
        timer: setTimeout(() => {
          this.processCombo(comboKey);
        }, COMBO_WINDOW),
      };
      this.userGiftCombos.set(comboKey, combo);
    }
  }

  processCombo(comboKey) {
    if (!this.userGiftCombos.has(comboKey)) return;

    const { gift_name, count, lane } = this.userGiftCombos.get(comboKey);
    this.userGiftCombos.delete(comboKey); // Limpiar el combo procesado

    console.log(`[TikTokHandler] Procesando combo: ${count}x "${gift_name}" para el carril ${lane}`);

    // Lógica de combos de 5
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
      // Lógica para regalos individuales si no se alcanzó el combo
      const singleAction = giftActions[gift_name];
      if (singleAction) {
        console.log(`[TikTokHandler] No es combo. Generando ${count} enemigo(s) de tipo '${singleAction.enemy}'.`);
        for (let i = 0; i < count; i++) {
          this.gameState.createEnemy(lane, singleAction.enemy);
        }
      }
    }

    // Lógica para regalos de power-up (se ejecuta independientemente de los combos)
    if (gift_name === 'Game Controller') {
      console.log(`[TikTokHandler] Activando power-up 'Torreta' en el carril ${lane}.`);
      this.gameState.spawnTurret(lane);
    } else if (gift_name === 'Super GG') {
      console.log(`[TikTokHandler] Activando power-up 'Bola de Hielo' en el carril ${lane}.`);
      this.gameState.spawnFreezeBall(lane);
    }
  }
}

module.exports = TikTokHandler;