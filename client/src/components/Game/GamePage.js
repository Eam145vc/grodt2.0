import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const GamePage = () => {
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const [gameState, setGameState] = useState({
    lanes: [
      { id: 1, baseHealth: 100, enemies: [], bullets: [], enemyProjectiles: [], turrets: [], freezeBalls: [], doubleBulletsActive: false, isGameOver: false },
      { id: 2, baseHealth: 100, enemies: [], bullets: [], enemyProjectiles: [], turrets: [], freezeBalls: [], doubleBulletsActive: false, isGameOver: false },
      { id: 3, baseHealth: 100, enemies: [], bullets: [], enemyProjectiles: [], turrets: [], freezeBalls: [], doubleBulletsActive: false, isGameOver: false },
      { id: 4, baseHealth: 100, enemies: [], bullets: [], enemyProjectiles: [], turrets: [], freezeBalls: [], doubleBulletsActive: false, isGameOver: false }
    ],
    waveSystem: {
      isActive: false,
      isPaused: false,
      currentWave: 0,
      timeRemaining: 15,
      maxTime: 15
    },
    globalGameOver: false,
    winner: null,
    enemyTypes: {},
    activePowerUps: { // Añadir estado para power-ups activos
      turrets: [],
      freezeBalls: [],
      doubleBullets: []
    }
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');
    
    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('Conectado al servidor');
    });
    
    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('Desconectado del servidor');
    });
    
    socketRef.current.on('gameState', (newGameState) => {
      // Clonar el estado para forzar una nueva renderización
      setGameState(JSON.parse(JSON.stringify(newGameState)));
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const drawGame = () => {
      // Limpiar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Dibujar fondo con gradiente
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0a0a0a');
      gradient.addColorStop(0.3, '#1a1a2e');
      gradient.addColorStop(0.7, '#16213e');
      gradient.addColorStop(1, '#0f3460');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const laneWidth = canvas.width / 4;
      
      // Dibujar carriles
      gameState.lanes.forEach((lane, laneIndex) => {
        const x = laneIndex * laneWidth;
        const laneX = x + laneWidth / 2;
        
        // Fondo del carril
        if (lane.isGameOver) {
          ctx.fillStyle = 'rgba(231, 76, 60, 0.15)';
          ctx.fillRect(x, 0, laneWidth, canvas.height);
        }
        
        // Efecto de balas dobles activas
        if (lane.doubleBulletsActive) {
          ctx.fillStyle = 'rgba(138, 43, 226, 0.1)';
          ctx.fillRect(x, 0, laneWidth, canvas.height);
        }

        // Líneas separadoras con efecto neón
        ctx.strokeStyle = lane.isGameOver ? '#e74c3c' : '#00d4ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = lane.isGameOver ? '#e74c3c' : '#00d4ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Números de carril
        ctx.fillStyle = lane.isGameOver ? '#e74c3c' : '#00ff88';
        ctx.font = 'bold 20px "Courier New"';
        ctx.textAlign = 'center';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 6;
        ctx.fillText(`P${laneIndex + 1}`, laneX, 30);
        ctx.shadowBlur = 0;
        
        // Indicador de balas dobles
        if (lane.doubleBulletsActive) {
          ctx.fillStyle = '#8a2be2';
          ctx.font = 'bold 12px Arial';
          ctx.fillText('DOBLE', laneX, 50);
        }

        // Vida de la base con barra visual
        const baseY = canvas.height - 60;
        const barWidth = laneWidth - 20;
        const barHeight = 12;
        const barX = x + 10;
        
        // Fondo de la barra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(barX, baseY, barWidth, barHeight);
        
        // Barra de vida
        const healthPercent = lane.baseHealth / 100;
        const healthWidth = barWidth * healthPercent;
        const healthColor = healthPercent > 0.6 ? '#00ff88' :
                           healthPercent > 0.3 ? '#ffaa00' : '#ff4444';
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, baseY, healthWidth, barHeight);
        
        // Texto de vida
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(`${lane.baseHealth}/100`, laneX, baseY + 25);

        // Indicadores de Oleada y Tiempo debajo de la salud
        const indicatorsY = baseY + 45;
        ctx.font = 'bold 10px "Courier New"';
        ctx.fillStyle = 'rgba(0, 255, 136, 0.8)';
        
        // Oleada
        ctx.textAlign = 'center';
        ctx.fillText('OLEADA', laneX - barWidth / 4, indicatorsY - 10);
        ctx.font = 'bold 14px "Courier New"';
        ctx.fillText(gameState.waveSystem.currentWave, laneX - barWidth / 4, indicatorsY + 5);

        // Tiempo
        ctx.font = 'bold 10px "Courier New"';
        ctx.fillText('TIEMPO', laneX + barWidth / 4, indicatorsY - 10);
        ctx.font = 'bold 14px "Courier New"';
        ctx.fillText(formatTime(gameState.waveSystem.timeRemaining), laneX + barWidth / 4, indicatorsY + 5);
        
        // Game Over overlay para carril
        if (lane.isGameOver) {
          ctx.fillStyle = 'rgba(231, 76, 60, 0.8)';
          ctx.fillRect(x, 0, laneWidth, canvas.height);
          
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 5;
          ctx.save();
          ctx.translate(laneX, canvas.height / 2);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText('ELIMINADO', 0, 0);
          ctx.restore();
          ctx.shadowBlur = 0;
        }
        
        // DIBUJAR TORRETAS
        if (lane.turrets && Array.isArray(lane.turrets)) {
          lane.turrets.forEach(turret => {
            if (turret.alive) {
              const turretX = x + turret.x;
              
              // Sombra de la torreta
              ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
              ctx.fillRect(turretX - 7, turret.y + 2, 14, 14);
              
              // Cuerpo de la torreta
              ctx.fillStyle = '#2ecc71';
              ctx.fillRect(turretX - 8, turret.y, 16, 12);
              
              // Cañón de la torreta
              ctx.fillStyle = '#27ae60';
              ctx.fillRect(turretX - 2, turret.y - 8, 4, 12);
              
              // Indicador de torreta
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 8px Arial';
              ctx.textAlign = 'center';
              ctx.fillText('T', turretX, turret.y + 8);
            }
          });
        }
        
        // DIBUJAR TORRETAS
        if (lane.turrets && Array.isArray(lane.turrets)) {
          lane.turrets.forEach(turret => {
            if (turret.alive) {
              const turretX = x + turret.x;
              
              // Sombra de la torreta
              ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
              ctx.fillRect(turretX - 7, turret.y + 2, 14, 14);
              
              // Cuerpo de la torreta
              ctx.fillStyle = '#2ecc71';
              ctx.fillRect(turretX - 8, turret.y, 16, 12);
              
              // Cañón de la torreta
              ctx.fillStyle = '#27ae60';
              ctx.fillRect(turretX - 2, turret.y - 8, 4, 12);
              
              // Indicador de torreta
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 8px Arial';
              ctx.textAlign = 'center';
              ctx.fillText('T', turretX, turret.y + 8);
            }
          });
        }
        
        // DIBUJAR TORRETAS
        if (lane.turrets && Array.isArray(lane.turrets)) {
          lane.turrets.forEach(turret => {
            if (turret.alive) {
              const turretX = x + turret.x;
              
              // Sombra de la torreta
              ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
              ctx.fillRect(turretX - 7, turret.y + 2, 14, 14);
              
              // Cuerpo de la torreta
              ctx.fillStyle = '#2ecc71';
              ctx.fillRect(turretX - 8, turret.y, 16, 12);
              
              // Cañón de la torreta
              ctx.fillStyle = '#27ae60';
              ctx.fillRect(turretX - 2, turret.y - 8, 4, 12);
              
              // Indicador de torreta
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 8px Arial';
              ctx.textAlign = 'center';
              ctx.fillText('T', turretX, turret.y + 8);
            }
          });
        }
        
        // DIBUJAR TORRETAS
        if (lane.turrets && Array.isArray(lane.turrets)) {
          lane.turrets.forEach(turret => {
            if (turret.alive) {
              const turretX = x + turret.x;
              
              // Sombra de la torreta
              ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
              ctx.fillRect(turretX - 7, turret.y + 2, 14, 14);
              
              // Cuerpo de la torreta
              ctx.fillStyle = '#2ecc71';
              ctx.fillRect(turretX - 8, turret.y, 16, 12);
              
              // Cañón de la torreta
              ctx.fillStyle = '#27ae60';
              ctx.fillRect(turretX - 2, turret.y - 8, 4, 12);
              
              // Indicador de torreta
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 8px Arial';
              ctx.textAlign = 'center';
              ctx.fillText('T', turretX, turret.y + 8);
            }
          });
        }
        
        // DIBUJAR BOLAS DE HIELO
        if (lane.freezeBalls && Array.isArray(lane.freezeBalls)) {
          lane.freezeBalls.forEach(freezeBall => {
            if (freezeBall.alive) {
              // Efecto de onda de hielo
              ctx.strokeStyle = 'rgba(0, 191, 255, 0.3)';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(laneX, freezeBall.y, 25, 0, Math.PI * 2);
              ctx.stroke();
              
              // Bola de hielo principal
              ctx.fillStyle = '#00bfff';
              ctx.shadowColor = '#00bfff';
              ctx.shadowBlur = 15;
              ctx.beginPath();
              ctx.arc(laneX, freezeBall.y, 12, 0, Math.PI * 2);
              ctx.fill();
              
              // Núcleo brillante
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(laneX - 3, freezeBall.y - 3, 4, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;
            }
          });
        }

        // Dibujar enemigos con diferentes estilos por tipo
        if (lane.enemies && Array.isArray(lane.enemies)) {
          lane.enemies.forEach(enemy => {
            if (enemy.alive) {
              const enemyType = gameState.enemyTypes[enemy.type?.toUpperCase()] ||
                               { color: '#e74c3c', size: 15 };
              
              // Efecto de congelamiento
              if (enemy.frozen) {
                // Overlay de hielo
                ctx.fillStyle = 'rgba(173, 216, 230, 0.7)';
                ctx.beginPath();
                ctx.arc(laneX, enemy.y, enemyType.size + 5, 0, Math.PI * 2);
                ctx.fill();
                
                // Partículas de hielo
                for (let i = 0; i < 5; i++) {
                  const angle = (i / 5) * Math.PI * 2;
                  const px = laneX + Math.cos(angle) * (enemyType.size + 8);
                  const py = enemy.y + Math.sin(angle) * (enemyType.size + 8);
                  ctx.fillStyle = '#87ceeb';
                  ctx.beginPath();
                  ctx.arc(px, py, 2, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
              
              // Efecto de descongelamiento
              if (enemy.justUnfrozen) {
                // Fragmentos de hielo rompiéndose
                for (let i = 0; i < 8; i++) {
                  const angle = (i / 8) * Math.PI * 2;
                  const distance = enemyType.size + 15;
                  const px = laneX + Math.cos(angle) * distance;
                  const py = enemy.y + Math.sin(angle) * distance;
                  ctx.fillStyle = '#add8e6';
                  ctx.beginPath();
                  ctx.arc(px, py, 3, 0, Math.PI * 2);
                  ctx.fill();
                }
              }

              // Sombra del enemigo
              ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
              ctx.beginPath();
              ctx.arc(laneX + 2, enemy.y + 2, enemyType.size + 2, 0, Math.PI * 2);
              ctx.fill();
              
              // Color del enemigo (azulado si está congelado)
              const enemyColor = enemy.frozen ? '#4169e1' : enemyType.color;
              ctx.fillStyle = enemyColor;
              ctx.shadowColor = enemyColor;
              ctx.shadowBlur = 5;
              ctx.beginPath();
              
              // Formas específicas por tipo
              if (enemy.type === 'tank') {
                ctx.fillRect(laneX - enemyType.size/2, enemy.y - enemyType.size/2,
                            enemyType.size, enemyType.size);
              } else if (enemy.type === 'mini') {
                ctx.beginPath();
                ctx.moveTo(laneX, enemy.y - enemyType.size/2);
                ctx.lineTo(laneX - enemyType.size/2, enemy.y + enemyType.size/2);
                ctx.lineTo(laneX + enemyType.size/2, enemy.y + enemyType.size/2);
                ctx.closePath();
                ctx.fill();
              } else if (enemy.type === 'sniper') {
                ctx.beginPath();
                ctx.moveTo(laneX, enemy.y - enemyType.size/2);
                ctx.lineTo(laneX + enemyType.size/2, enemy.y);
                ctx.lineTo(laneX, enemy.y + enemyType.size/2);
                ctx.lineTo(laneX - enemyType.size/2, enemy.y);
                ctx.closePath();
                ctx.fill();
              } else if (enemy.type === 'boss') {
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                  const angle = (i * Math.PI) / 4;
                  const radius = i % 2 === 0 ? enemyType.size : enemyType.size / 2;
                  const px = laneX + Math.cos(angle) * radius;
                  const py = enemy.y + Math.sin(angle) * radius;
                  if (i === 0) ctx.moveTo(px, py);
                  else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
              } else {
                ctx.arc(laneX, enemy.y, enemyType.size, 0, Math.PI * 2);
                ctx.fill();
              }
              
              ctx.shadowBlur = 0;
              
              // Borde del enemigo
              ctx.strokeStyle = enemy.frozen ? '#ffffff' : '#ffffff';
              ctx.lineWidth = enemy.frozen ? 2 : 1;
              ctx.stroke();
              
              // Números de vida arriba del enemigo
              if (enemy.health && enemy.maxHealth) {
                const healthY = enemy.y - enemyType.size - 15;
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                const textWidth = ctx.measureText(enemy.health).width;
                ctx.fillRect(laneX - textWidth/2 - 3, healthY - 10, textWidth + 6, 14);
                
                const healthPercent = enemy.health / enemy.maxHealth;
                if (healthPercent > 0.7) {
                  ctx.fillStyle = '#00ff00';
                } else if (healthPercent > 0.4) {
                  ctx.fillStyle = '#ffaa00';
                } else {
                  ctx.fillStyle = '#ff4444';
                }
                
                ctx.shadowColor = '#000000';
                ctx.shadowBlur = 2;
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 1;
                
                ctx.fillText(enemy.health, laneX, healthY);
                
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
              }
            }
          });
        }
        
        // Dibujar proyectiles de enemigos (sniper)
        if (lane.enemyProjectiles && Array.isArray(lane.enemyProjectiles)) {
          lane.enemyProjectiles.forEach(projectile => {
            if (projectile.alive) {
              ctx.fillStyle = '#ff0066';
              ctx.shadowColor = '#ff0066';
              ctx.shadowBlur = 10;
              ctx.beginPath();
              ctx.arc(laneX, projectile.y, 4, 0, Math.PI * 2);
              ctx.fill();
              
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(laneX - 1, projectile.y - 1, 2, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;
            }
          });
        }
        
        // Dibujar balas de defensa (incluyendo torretas)
        if (lane.bullets && Array.isArray(lane.bullets)) {
          lane.bullets.forEach(bullet => {
            if (bullet.alive) {
              // Posición X de la bala
              const bulletX = bullet.fromTurret ? x + bullet.x : laneX;
              
              // Efecto de trail
              const trailColor = bullet.isDouble ? 'rgba(138, 43, 226, 0.3)' : 'rgba(255, 215, 0, 0.3)';
              ctx.fillStyle = trailColor;
              ctx.beginPath();
              ctx.arc(bulletX, bullet.y + 8, bullet.isDouble ? 8 : 6, 0, Math.PI * 2);
              ctx.fill();
              
              // Bala principal
              const bulletColor = bullet.isDouble ? '#8a2be2' : '#ffd700';
              const bulletSize = bullet.isDouble ? 7 : 5;
              
              ctx.fillStyle = bulletColor;
              ctx.shadowColor = bulletColor;
              ctx.shadowBlur = 12;
              ctx.beginPath();
              ctx.arc(bulletX, bullet.y, bulletSize, 0, Math.PI * 2);
              ctx.fill();
              
              // Núcleo brillante
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(bulletX - 2, bullet.y - 2, 2, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;
            }
          });
        }
      });
      
      // Línea de las bases con efecto neón
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 80);
      ctx.lineTo(canvas.width, canvas.height - 80);
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    drawGame();
  }, [gameState]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeRemaining = (endTime) => {
    const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    return `${remaining}s`;
  };

  return (
    <div className="game-viewport">
      <div className="game-container-vertical">

        {/* Canvas del juego */}
        <div className="game-canvas-container">
          <canvas
            ref={canvasRef}
            width={400}
            height={600}
            className="game-canvas-modern"
          />
          
          {/* Overlay de ganador */}
          {gameState.globalGameOver && (
            <div className="winner-overlay">
              {gameState.winner ? (
                <>
                  <h1 className="winner-title">🏆 ¡VICTORIA!</h1>
                  <h2 className="winner-subtitle">Jugador {gameState.winner} Sobrevive</h2>
                  <p className="winner-score">Oleadas Completadas: {gameState.waveSystem.currentWave}</p>
                </>
              ) : (
                <>
                  <h1 className="winner-title">💀 ANIQUILACIÓN TOTAL</h1>
                  <h2 className="winner-subtitle">Todos los defensores han caído</h2>
                  <p className="winner-score">Oleadas Resistidas: {gameState.waveSystem.currentWave}</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamePage;