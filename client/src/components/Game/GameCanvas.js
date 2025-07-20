import React, { useRef, useEffect } from 'react';

const GameCanvas = ({ gameState }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const drawGame = () => {
      // Limpiar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Dibujar fondo de carriles
      const laneWidth = canvas.width / 4;
      for (let i = 0; i < 4; i++) {
        const x = i * laneWidth;
        
        // Líneas separadoras
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
        
        // Números de carril
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${i + 1}`, x + laneWidth / 2, 30);
      }
      
      // Dibujar línea de la base
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 20);
      ctx.lineTo(canvas.width, canvas.height - 20);
      ctx.stroke();
      
      // Dibujar información de la oleada y tiempo por carril
      gameState.lanes.forEach((lane, laneIndex) => {
        const laneX = laneIndex * laneWidth + laneWidth / 2;
        
        // Salud de la base
        ctx.fillStyle = '#2ecc71'; // Verde para la salud
        const healthBarWidth = (lane.baseHealth / 100) * (laneWidth - 40); // Ancho de la barra de salud
        ctx.fillRect(laneX - (laneWidth - 40) / 2, canvas.height - 15, healthBarWidth, 10);
        
        // Texto de salud
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${lane.baseHealth}/100`, laneX, canvas.height - 20); // Ajustar posición
        
        // Reloj y número de oleada
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '12px Arial'; // Fuente más legible
        ctx.textAlign = 'center';
        const timeFormatted = `${Math.floor(gameState.waveSystem.timeRemaining / 60).toString().padStart(2, '0')}:${(gameState.waveSystem.timeRemaining % 60).toString().padStart(2, '0')}`;
        ctx.fillText(`⏰ ${timeFormatted} | Oleada: ${gameState.waveSystem.currentWave}`, laneX, canvas.height - 10); // Ajustar posición para visibilidad
        
        // Dibujar enemigos
        
        // Dibujar enemigos con diferentes estilos por tipo
        if (lane.enemies && Array.isArray(lane.enemies)) {
          lane.enemies.forEach(enemy => {
            if (enemy && enemy.alive) {
              // Valores por defecto seguros
              const enemyType = {
                color: '#e74c3c',
                size: 15,
                ...((gameState.enemyTypes && enemy.type) ? gameState.enemyTypes[enemy.type.toUpperCase()] : {})
              };
              
              // Sombra del enemigo
              const enemyX = laneX - laneWidth/2 + enemy.x;

              // Sombra del enemigo
              ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
              ctx.beginPath();
              ctx.arc(enemyX + 2, enemy.y + 2, enemyType.size + 2, 0, Math.PI * 2);
              ctx.fill();
              
              // Cuerpo del enemigo con color específico
              ctx.fillStyle = enemyType.color;
              ctx.shadowColor = enemyType.color;
              ctx.shadowBlur = 5;
              ctx.beginPath();
              
              // Formas específicas por tipo
              if (enemy.type === 'tank') {
                // Tanque - rectángulo
                ctx.fillRect(enemyX - enemyType.size/2, enemy.y - enemyType.size/2,
                            enemyType.size, enemyType.size);
              } else if (enemy.type === 'mini') {
                // Mini - triángulo pequeño
                ctx.beginPath();
                ctx.moveTo(enemyX, enemy.y - enemyType.size/2);
                ctx.lineTo(enemyX - enemyType.size/2, enemy.y + enemyType.size/2);
                ctx.lineTo(enemyX + enemyType.size/2, enemy.y + enemyType.size/2);
                ctx.closePath();
                ctx.fill();
              } else if (enemy.type === 'sniper') {
                // Sniper - diamante
                ctx.beginPath();
                ctx.moveTo(enemyX, enemy.y - enemyType.size/2);
                ctx.lineTo(enemyX + enemyType.size/2, enemy.y);
                ctx.lineTo(enemyX, enemy.y + enemyType.size/2);
                ctx.lineTo(enemyX - enemyType.size/2, enemy.y);
                ctx.closePath();
                ctx.fill();
              } else if (enemy.type === 'boss') {
                // Boss - estrella
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                  const angle = (i * Math.PI) / 4;
                  const radius = i % 2 === 0 ? enemyType.size : enemyType.size / 2;
                  const px = enemyX + Math.cos(angle) * radius;
                  const py = enemy.y + Math.sin(angle) * radius;
                  if (i === 0) ctx.moveTo(px, py);
                  else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
              } else {
                // Básico y Especial 1 - círculo
                ctx.arc(enemyX, enemy.y, enemyType.size, 0, Math.PI * 2);
                ctx.fill();
              }
              
              ctx.shadowBlur = 0;
              
              // Borde del enemigo
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1;
              ctx.stroke();
              
              // NUEVA SECCIÓN: Solo números de vida arriba del enemigo
              if (enemy.health && enemy.maxHealth) {
                const healthY = enemy.y - enemyType.size - 15; // Arriba del enemigo
                
                // Fondo semi-transparente para el número
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                const textWidth = ctx.measureText(enemy.health).width;
                ctx.fillRect(laneX - textWidth/2 - 3, healthY - 10, textWidth + 6, 14);
                
                // Número de vida con color según porcentaje
                const healthPercent = enemy.health / enemy.maxHealth;
                if (healthPercent > 0.7) {
                  ctx.fillStyle = '#00ff00'; // Verde
                } else if (healthPercent > 0.4) {
                  ctx.fillStyle = '#ffaa00'; // Amarillo
                } else {
                  ctx.fillStyle = '#ff4444'; // Rojo
                }
                
                // Sombra del texto para mejor legibilidad
                ctx.shadowColor = '#000000';
                ctx.shadowBlur = 2;
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 1;
                
                ctx.fillText(enemy.health, laneX, healthY);
                
                // Limpiar sombra
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
              }
            }
          });
        }
        
        // Dibujar torretas
        const turretY = canvas.height - 35;
        
        // Torreta Estándar (siempre visible)
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(laneX - 15, turretY, 30, 15);
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(laneX - 5, turretY - 10, 10, 10);

        // Torreta de Poder (condicional)
        if (lane.doubleBulletsActive) {
            ctx.fillStyle = '#f1c40f'; // Color dorado
            ctx.fillRect(laneX - 25, turretY - 20, 50, 20);
            ctx.fillStyle = '#f39c12';
            ctx.fillRect(laneX - 8, turretY - 35, 16, 15);
        }

        // Dibujar balas
        lane.bullets.forEach(bullet => {
          if (bullet.alive) {
            const bulletSize = bullet.isDouble ? 8 : 5;
            const bulletColor = bullet.isDouble ? '#f1c40f' : '#3498db';
            
            ctx.fillStyle = bulletColor;
            ctx.shadowColor = bulletColor;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(bullet.x + (laneIndex * laneWidth), bullet.y, bulletSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Efecto de brillo
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(bullet.x + (laneIndex * laneWidth) - 2, bullet.y - 2, bulletSize / 2, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      });
    };

    drawGame();
  }, [gameState]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={600}
      style={{
        background: 'linear-gradient(180deg, #2c3e50 0%, #34495e 100%)',
        borderRadius: '20px',
        display: 'block'
      }}
    />
  );
};

export default GameCanvas;