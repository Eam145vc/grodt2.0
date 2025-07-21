import React, { useRef, useEffect } from 'react';

const GameCanvas = ({ gameState }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef();
  const particlesRef = useRef([]);

  // Función para agregar partículas
  const addParticles = (x, y, color, count = 5) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 60,
        maxLife: 60,
        color,
        size: Math.random() * 3 + 1,
      });
    }
  };

  // Función para actualizar partículas
  const updateParticles = () => {
    particlesRef.current = particlesRef.current.filter((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
      return particle.life > 0;
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const drawGame = () => {
      time += 0.02;

      // Limpiar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fondo futurista con gradiente animado
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, `hsl(${240 + Math.sin(time) * 20}, 100%, 5%)`);
      gradient.addColorStop(0.3, `hsl(${260 + Math.sin(time * 1.2) * 15}, 80%, 8%)`);
      gradient.addColorStop(0.7, `hsl(${280 + Math.sin(time * 0.8) * 25}, 90%, 6%)`);
      gradient.addColorStop(1, `hsl(${300 + Math.sin(time * 1.5) * 10}, 70%, 4%)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Efecto de grid futurista
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      const laneWidth = canvas.width / 4;

      // Dibujar carriles con efectos neón
      gameState.lanes.forEach((lane, laneIndex) => {
        const x = laneIndex * laneWidth;
        const laneX = x + laneWidth / 2;

        // Fondo del carril con efectos especiales
        if (lane.isGameOver) {
          // Efecto de destrucción
          const destructionGradient = ctx.createLinearGradient(x, 0, x + laneWidth, 0);
          destructionGradient.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
          destructionGradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.2)');
          destructionGradient.addColorStop(1, 'rgba(255, 0, 0, 0.3)');
          ctx.fillStyle = destructionGradient;
          ctx.fillRect(x, 0, laneWidth, canvas.height);

          // Efecto de glitch
          for (let i = 0; i < 5; i++) {
            ctx.fillStyle = `rgba(255, 0, 0, ${0.1 + Math.random() * 0.2})`;
            ctx.fillRect(
              x + Math.random() * laneWidth,
              Math.random() * canvas.height,
              Math.random() * 50,
              Math.random() * 20
            );
          }
        }

        // Efecto de power-up activo
        if (lane.doubleBulletsActive) {
          const powerGradient = ctx.createLinearGradient(x, 0, x + laneWidth, 0);
          powerGradient.addColorStop(0, 'rgba(138, 43, 226, 0.15)');
          powerGradient.addColorStop(0.5, 'rgba(255, 0, 255, 0.1)');
          powerGradient.addColorStop(1, 'rgba(138, 43, 226, 0.15)');
          ctx.fillStyle = powerGradient;
          ctx.fillRect(x, 0, laneWidth, canvas.height);
        }

        // Líneas separadoras con efecto neón pulsante
        const pulseIntensity = 0.5 + Math.sin(time * 3) * 0.3;
        ctx.strokeStyle = lane.isGameOver
          ? `rgba(255, 0, 100, ${pulseIntensity})`
          : `rgba(0, 255, 255, ${pulseIntensity})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 15 + Math.sin(time * 4) * 5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Números de carril con estilo futurista - MOVIDOS MÁS ABAJO
        const numberY = 120; // Cambiado de 35 a 120 para dar espacio al UI
        ctx.fillStyle = lane.isGameOver ? '#ff0066' : '#00ffff';
        ctx.font = 'bold 20px Arial'; // Reducido de 24 a 20
        ctx.textAlign = 'center';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 20;
        ctx.fillText(`P${laneIndex + 1}`, laneX, numberY);

        // Hexágono decorativo alrededor del número - AJUSTADO
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const hx = laneX + Math.cos(angle) * 18; // Reducido de 20 a 18
          const hy = numberY - 10 + Math.sin(angle) * 18; // Ajustado a la nueva posición
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Nombre del equipo con estilo cyberpunk - AJUSTADO
        if (lane.team) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px Arial'; // Reducido de 12 a 10
          ctx.textAlign = 'center';
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 10;
          ctx.fillText(lane.team.toUpperCase(), laneX, numberY + 20); // Ajustado
          ctx.shadowBlur = 0;
        }

        // DIBUJAR TORRETAS con diseño futurista
        if (lane.turrets && Array.isArray(lane.turrets)) {
          lane.turrets.forEach((turret) => {
            if (turret.alive) {
              const turretX = x + turret.x;

              // Base de la torreta con efecto neón
              ctx.fillStyle = '#00ff88';
              ctx.shadowColor = '#00ff88';
              ctx.shadowBlur = 20;
              ctx.beginPath();
              ctx.arc(turretX, turret.y + 6, 12, 0, Math.PI * 2);
              ctx.fill();

              // Cuerpo principal hexagonal
              ctx.fillStyle = '#004d40';
              ctx.strokeStyle = '#00ff88';
              ctx.lineWidth = 2;
              ctx.beginPath();
              for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const hx = turretX + Math.cos(angle) * 8;
                const hy = turret.y + Math.sin(angle) * 8;
                if (i === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
              }
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              // Cañón con efecto láser
              ctx.fillStyle = '#00ffff';
              ctx.shadowColor = '#00ffff';
              ctx.shadowBlur = 15;
              ctx.fillRect(turretX - 2, turret.y - 12, 4, 16);

              // Punto de mira láser
              ctx.fillStyle = '#ff0080';
              ctx.beginPath();
              ctx.arc(turretX, turret.y - 15, 3, 0, Math.PI * 2);
              ctx.fill();

              ctx.shadowBlur = 0;
            }
          });
        }

        // DIBUJAR BOLAS DE HIELO con efectos mejorados
        if (lane.freezeBalls && Array.isArray(lane.freezeBalls)) {
          lane.freezeBalls.forEach((freezeBall) => {
            if (freezeBall.alive) {
              // Ondas de congelamiento múltiples
              for (let ring = 1; ring <= 3; ring++) {
                ctx.strokeStyle = `rgba(0, 255, 255, ${0.4 - ring * 0.1})`;
                ctx.lineWidth = 3;
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(laneX, freezeBall.y, 15 + ring * 10 + Math.sin(time * 4) * 5, 0, Math.PI * 2);
                ctx.stroke();
              }

              // Núcleo de hielo con gradiente
              const iceGradient = ctx.createRadialGradient(laneX, freezeBall.y, 0, laneX, freezeBall.y, 15);
              iceGradient.addColorStop(0, '#ffffff');
              iceGradient.addColorStop(0.5, '#00ffff');
              iceGradient.addColorStop(1, '#0080ff');

              ctx.fillStyle = iceGradient;
              ctx.shadowColor = '#00ffff';
              ctx.shadowBlur = 25;
              ctx.beginPath();
              ctx.arc(laneX, freezeBall.y, 12, 0, Math.PI * 2);
              ctx.fill();

              // Cristales de hielo orbitando
              for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 + time * 2;
                const cx = laneX + Math.cos(angle) * 20;
                const cy = freezeBall.y + Math.sin(angle) * 20;
                ctx.fillStyle = '#b3e5fc';
                ctx.beginPath();
                ctx.arc(cx, cy, 2, 0, Math.PI * 2);
                ctx.fill();
              }

              ctx.shadowBlur = 0;
            }
          });
        }

        // DIBUJAR ENEMIGOS con diseños futuristas
        if (lane.enemies && Array.isArray(lane.enemies)) {
          lane.enemies.forEach((enemy) => {
            if (enemy.alive) {
              const enemyType = gameState.enemyTypes[enemy.type?.toUpperCase()] || { color: '#ff0080', size: 15 };

              // Efecto de congelamiento mejorado
              if (enemy.frozen) {
                // Cápsula de hielo
                ctx.fillStyle = 'rgba(173, 216, 230, 0.8)';
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(laneX, enemy.y, enemyType.size + 8, 0, Math.PI * 2);
                ctx.fill();

                // Cristales de hielo
                for (let i = 0; i < 8; i++) {
                  const angle = (i / 8) * Math.PI * 2 + time;
                  const px = laneX + Math.cos(angle) * (enemyType.size + 12);
                  const py = enemy.y + Math.sin(angle) * (enemyType.size + 12);
                  ctx.fillStyle = '#87ceeb';
                  ctx.beginPath();
                  ctx.moveTo(px, py - 4);
                  ctx.lineTo(px + 2, py);
                  ctx.lineTo(px, py + 4);
                  ctx.lineTo(px - 2, py);
                  ctx.closePath();
                  ctx.fill();
                }
              }

              // Aura del enemigo
              const auraGradient = ctx.createRadialGradient(laneX, enemy.y, 0, laneX, enemy.y, enemyType.size + 10);
              auraGradient.addColorStop(0, `${enemyType.color}00`);
              auraGradient.addColorStop(1, `${enemyType.color}40`);
              ctx.fillStyle = auraGradient;
              ctx.beginPath();
              ctx.arc(laneX, enemy.y, enemyType.size + 10, 0, Math.PI * 2);
              ctx.fill();

              // Cuerpo del enemigo con efectos neón
              const enemyColor = enemy.frozen ? '#4169e1' : enemyType.color;
              ctx.fillStyle = enemyColor;
              ctx.shadowColor = enemyColor;
              ctx.shadowBlur = 15;
              ctx.beginPath();

              // Formas específicas mejoradas por tipo
              if (enemy.type === 'tank') {
                // Tanque - hexágono con detalles
                for (let i = 0; i < 6; i++) {
                  const angle = (i * Math.PI) / 3;
                  const hx = laneX + Math.cos(angle) * enemyType.size;
                  const hy = enemy.y + Math.sin(angle) * enemyType.size;
                  if (i === 0) ctx.moveTo(hx, hy);
                  else ctx.lineTo(hx, hy);
                }
                ctx.closePath();
                ctx.fill();

                // Detalles del tanque
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
              } else if (enemy.type === 'mini') {
                // Mini - triángulo con efectos
                ctx.beginPath();
                ctx.moveTo(laneX, enemy.y - enemyType.size);
                ctx.lineTo(laneX - enemyType.size, enemy.y + enemyType.size / 2);
                ctx.lineTo(laneX + enemyType.size, enemy.y + enemyType.size / 2);
                ctx.closePath();
                ctx.fill();
              } else if (enemy.type === 'sniper') {
                // Sniper - diamante con cruz
                ctx.beginPath();
                ctx.moveTo(laneX, enemy.y - enemyType.size);
                ctx.lineTo(laneX + enemyType.size, enemy.y);
                ctx.lineTo(laneX, enemy.y + enemyType.size);
                ctx.lineTo(laneX - enemyType.size, enemy.y);
                ctx.closePath();
                ctx.fill();

                // Cruz de francotirador
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(laneX - 5, enemy.y);
                ctx.lineTo(laneX + 5, enemy.y);
                ctx.moveTo(laneX, enemy.y - 5);
                ctx.lineTo(laneX, enemy.y + 5);
                ctx.stroke();
              } else if (enemy.type === 'boss') {
                // Boss - estrella compleja con múltiples capas
                ctx.beginPath();
                for (let i = 0; i < 12; i++) {
                  const angle = (i * Math.PI) / 6;
                  const radius = i % 2 === 0 ? enemyType.size : enemyType.size * 0.6;
                  const px = laneX + Math.cos(angle) * radius;
                  const py = enemy.y + Math.sin(angle) * radius;
                  if (i === 0) ctx.moveTo(px, py);
                  else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();

                // Núcleo del boss
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(laneX, enemy.y, enemyType.size * 0.3, 0, Math.PI * 2);
                ctx.fill();
              } else {
                // Básico - círculo con anillos
                ctx.arc(laneX, enemy.y, enemyType.size, 0, Math.PI * 2);
                ctx.fill();

                // Anillos concéntricos
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(laneX, enemy.y, enemyType.size * 0.7, 0, Math.PI * 2);
                ctx.stroke();
              }

              ctx.shadowBlur = 0;

              // Barra de vida futurista
              if (enemy.health && enemy.maxHealth) {
                const healthY = enemy.y - enemyType.size - 20;
                const barWidth = 30;
                const barHeight = 4;

                // Fondo de la barra
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(laneX - barWidth / 2, healthY, barWidth, barHeight);

                // Barra de vida con gradiente
                const healthPercent = enemy.health / enemy.maxHealth;
                const healthGradient = ctx.createLinearGradient(
                  laneX - barWidth / 2,
                  healthY,
                  laneX + barWidth / 2,
                  healthY
                );

                if (healthPercent > 0.7) {
                  healthGradient.addColorStop(0, '#00ff00');
                  healthGradient.addColorStop(1, '#80ff00');
                } else if (healthPercent > 0.4) {
                  healthGradient.addColorStop(0, '#ffff00');
                  healthGradient.addColorStop(1, '#ff8000');
                } else {
                  healthGradient.addColorStop(0, '#ff4000');
                  healthGradient.addColorStop(1, '#ff0040');
                }

                ctx.fillStyle = healthGradient;
                ctx.shadowColor = healthPercent > 0.7 ? '#00ff00' : healthPercent > 0.4 ? '#ffff00' : '#ff0000';
                ctx.shadowBlur = 8;
                ctx.fillRect(laneX - barWidth / 2, healthY, barWidth * healthPercent, barHeight);

                // Texto de vida
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.shadowColor = '#000000';
                ctx.shadowBlur = 3;
                ctx.fillText(enemy.health.toString(), laneX, healthY - 2);

                ctx.shadowBlur = 0;
              }

              // Agregar partículas ocasionalmente
              if (Math.random() < 0.1) {
                addParticles(laneX, enemy.y, enemyType.color, 2);
              }
            }
          });
        }

        // DIBUJAR PROYECTILES DE ENEMIGOS con efectos láser
        if (lane.enemyProjectiles && Array.isArray(lane.enemyProjectiles)) {
          lane.enemyProjectiles.forEach((projectile) => {
            if (projectile.alive) {
              // Trail del proyectil
              ctx.fillStyle = 'rgba(255, 0, 102, 0.3)';
              ctx.beginPath();
              ctx.arc(laneX, projectile.y + 15, 8, 0, Math.PI * 2);
              ctx.fill();

              // Proyectil principal
              ctx.fillStyle = '#ff0066';
              ctx.shadowColor = '#ff0066';
              ctx.shadowBlur = 20;
              ctx.beginPath();
              ctx.arc(laneX, projectile.y, 5, 0, Math.PI * 2);
              ctx.fill();

              // Núcleo brillante
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(laneX - 1, projectile.y - 1, 2, 0, Math.PI * 2);
              ctx.fill();

              // Efecto de energía
              ctx.strokeStyle = '#ff0066';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.arc(laneX, projectile.y, 8, 0, Math.PI * 2);
              ctx.stroke();

              ctx.shadowBlur = 0;
            }
          });
        }

        // DIBUJAR BALAS con efectos mejorados
        if (lane.bullets && Array.isArray(lane.bullets)) {
          lane.bullets.forEach((bullet) => {
            if (bullet.alive) {
              const bulletX = bullet.fromTurret ? x + bullet.x : laneX;

              // Trail extendido
              const trailColor = bullet.isDouble ? 'rgba(255, 0, 255, 0.4)' : 'rgba(0, 255, 255, 0.4)';
              for (let i = 1; i <= 5; i++) {
                ctx.fillStyle = trailColor.replace('0.4', (0.4 - i * 0.06).toString());
                ctx.beginPath();
                ctx.arc(bulletX, bullet.y + i * 8, bullet.isDouble ? 10 - i : 8 - i, 0, Math.PI * 2);
                ctx.fill();
              }

              // Bala principal con gradiente
              const bulletSize = bullet.isDouble ? 8 : 6;
              const bulletGradient = ctx.createRadialGradient(bulletX, bullet.y, 0, bulletX, bullet.y, bulletSize);

              if (bullet.isDouble) {
                bulletGradient.addColorStop(0, '#ffffff');
                bulletGradient.addColorStop(0.5, '#ff00ff');
                bulletGradient.addColorStop(1, '#8000ff');
              } else {
                bulletGradient.addColorStop(0, '#ffffff');
                bulletGradient.addColorStop(0.5, '#00ffff');
                bulletGradient.addColorStop(1, '#0080ff');
              }

              ctx.fillStyle = bulletGradient;
              ctx.shadowColor = bullet.isDouble ? '#ff00ff' : '#00ffff';
              ctx.shadowBlur = 20;
              ctx.beginPath();
              ctx.arc(bulletX, bullet.y, bulletSize, 0, Math.PI * 2);
              ctx.fill();

              // Anillo de energía
              ctx.strokeStyle = bullet.isDouble ? '#ff00ff' : '#00ffff';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(bulletX, bullet.y, bulletSize + 3, 0, Math.PI * 2);
              ctx.stroke();

              ctx.shadowBlur = 0;
            }
          });
        }
      });

      // Línea de las bases con efecto neón pulsante
      const basePulse = 0.7 + Math.sin(time * 4) * 0.3;
      ctx.strokeStyle = `rgba(0, 255, 136, ${basePulse})`;
      ctx.lineWidth = 6;
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 80);
      ctx.lineTo(canvas.width, canvas.height - 80);
      ctx.stroke();

      // Línea secundaria
      ctx.strokeStyle = `rgba(255, 255, 255, ${basePulse * 0.5})`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 82);
      ctx.lineTo(canvas.width, canvas.height - 82);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Dibujar partículas
      updateParticles();
      particlesRef.current.forEach((particle) => {
        const alpha = particle.life / particle.maxLife;
        ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const animate = () => {
      drawGame();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={700}
      className="game-canvas-modern"
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
      }}
    />
  );
};

export default GameCanvas;