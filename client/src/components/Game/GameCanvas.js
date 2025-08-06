import React, { useRef, useEffect } from 'react';

const teamToCountryCode = {
  'argentina': 'ar',
  'bolivia': 'bo',
  'chile': 'cl',
  'colombia': 'co',
  'costa rica': 'cr',
  'cuba': 'cu',
  'ecuador': 'ec',
  'el salvador': 'sv',
  'guatemala': 'gt',
  'honduras': 'hn',
  'mexico': 'mx',
  'nicaragua': 'ni',
  'panama': 'pa',
  'paraguay': 'py',
  'peru': 'pe',
  'puerto rico': 'pr',
  'republica dominicana': 'do',
  'uruguay': 'uy',
  'venezuela': 've',
  'brasil': 'br'
};

const GameCanvas = ({ gameState }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef();
  const particlesRef = useRef([]);
  const turretImagesRef = useRef({});
  const baseImageRef = useRef(null);
  const enemyImagesRef = useRef({});
  const flagImagesRef = useRef({});

  useEffect(() => {
    const basicTurretImg = new Image();
    basicTurretImg.src = '/towerDefense_tile291.png';
    const rapidFireTurretImg = new Image();
    rapidFireTurretImg.src = '/towerDefense_tile250.png';
    const baseImg = new Image();
    baseImg.src = '/scifiStructure_03.png';
    
    turretImagesRef.current = {
      basic: basicTurretImg,
      rapidFire: rapidFireTurretImg
    };
    baseImageRef.current = baseImg;
  }, []);

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
        if (lane.team) {
          const countryCode = teamToCountryCode[lane.team.toLowerCase()];
          if (countryCode) {
            const flagSrc = `https://flagpedia.net/data/flags/w80/${countryCode}.png`;
            let flagImg = flagImagesRef.current[flagSrc];
            if (!flagImg) {
              flagImg = new Image();
              flagImg.src = flagSrc;
              flagImagesRef.current[flagSrc] = flagImg;
            }

            if (flagImg.complete && flagImg.naturalHeight !== 0) {
              const pulse = 0.5 + Math.sin(time * 5) * 0.5; // Pulsación aún más rápida
              ctx.globalAlpha = 0.20 + (0.10 * pulse); // Transparencia base de 0.20, pulsando hasta 0.30
              
              ctx.save();
              // Mover el punto de origen al centro del carril para rotar
              ctx.translate(x + laneWidth / 2, canvas.height / 2);
              ctx.rotate(-Math.PI / 2); // Rotar 90 grados a la izquierda
              // Dibujar la imagen rotada
              ctx.drawImage(flagImg, -canvas.height / 2, -laneWidth / 2, canvas.height, laneWidth);
              ctx.restore();
              
              ctx.globalAlpha = 1.0; // Restaurar alpha
            }
          }
        }

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

        // Los indicadores de carril ahora se manejan en GameUI.js

        // El nombre del equipo ahora se maneja en GameUI.js

        // DIBUJAR BASE Y TORRETAS
        const baseImg = baseImageRef.current;
        if (baseImg?.complete) {
          const baseWidth = 80;
          const baseHeight = 80;
          ctx.drawImage(baseImg, laneX - baseWidth / 2, canvas.height - baseHeight, baseWidth, baseHeight);
        }

        const turretWidth = 75;
        const turretHeight = 75;
        const basicTurretImg = turretImagesRef.current.basic;
        const rapidFireTurretImg = turretImagesRef.current.rapidFire;

        const drawTurret = (img, x, y, rotation) => {
          if (img?.complete) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.drawImage(img, -turretWidth / 2, -turretHeight / 2, turretWidth, turretHeight);
            ctx.restore();
          }
        };

        if (lane.rapidFireTurretActive) {
          // Dos torretas
          drawTurret(basicTurretImg, laneX + 20, canvas.height - 60, -Math.PI / 2); // 90 grados a la izquierda
          drawTurret(rapidFireTurretImg, laneX - 20, canvas.height - 60, 0); // 0 grados
        } else {
          // Una torreta
          drawTurret(basicTurretImg, laneX, canvas.height - 60, -Math.PI / 2); // 90 grados a la izquierda
        }

        // Dibujar torretas inteligentes
        if (lane.turrets && Array.isArray(lane.turrets)) {
          lane.turrets.forEach(turret => {
            if (turret.alive && turret.type === 'intelligent') {
              const rotation = turret.side === 'left' ? -Math.PI / 4 : -3 * Math.PI / 4; // -45 y -135 grados
              drawTurret(basicTurretImg, x + turret.x, turret.y + 20, rotation); // Bajar 20px
              if (turret.user && turret.user.avatarBase64) {
                const img = new Image();
                img.src = turret.user.avatarBase64;
                if (img.complete) {
                  ctx.drawImage(img, x + turret.x - 15, turret.y + 5, 30, 30); // Bajar 20px
                }
              }
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

        // El renderizado de las torretas ahora se maneja con imágenes

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

              // DIBUJAR IMAGEN DEL ENEMIGO (ENCIMA DE TODO)
              if (enemy.image) {
                let img = enemyImagesRef.current[enemy.image];
                if (!img) {
                  img = new Image();
                  img.src = enemy.image;
                  enemyImagesRef.current[enemy.image] = img;
                }

                if (img.complete) {
                  const imageSize = enemyType.size * 2.5;
                  ctx.drawImage(
                    img,
                    laneX - imageSize / 2,
                    enemy.y - imageSize / 2,
                    imageSize,
                    imageSize
                  );
                }
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
              if (bullet.isRapidFire && bullet.avatarBase64) {
                // Proyectil de fuego rápido con avatar
                const bulletSize = 12;
                ctx.fillStyle = 'rgba(138, 43, 226, 0.5)';
                ctx.shadowColor = '#8a2be2';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(bulletX, bullet.y, bulletSize, 0, Math.PI * 2);
                ctx.fill();

                const img = new Image();
                img.src = bullet.avatarBase64;
                if (img.complete) {
                  ctx.save();
                  ctx.beginPath();
                  ctx.arc(bulletX, bullet.y, bulletSize - 2, 0, Math.PI * 2);
                  ctx.clip();
                  ctx.drawImage(img, bulletX - (bulletSize - 2), bullet.y - (bulletSize - 2), (bulletSize - 2) * 2, (bulletSize - 2) * 2);
                  ctx.restore();
                }
              } else {
                // Proyectil normal
                const isRapidFire = bullet.isRapidFire;
                const isIntelligent = bullet.type === 'intelligent';
                const trailColor = isIntelligent ? 'rgba(255, 255, 0, 0.4)' : isRapidFire ? 'rgba(138, 43, 226, 0.4)' : 'rgba(0, 255, 255, 0.4)';
                for (let i = 1; i <= 5; i++) {
                  ctx.fillStyle = trailColor.replace('0.4', (0.4 - i * 0.06).toString());
                  ctx.beginPath();
                  ctx.arc(bulletX, bullet.y + i * 8, isRapidFire ? 12 - i : 8 - i, 0, Math.PI * 2);
                  ctx.fill();
                }

                const bulletSize = isIntelligent ? 4 : isRapidFire ? 10 : 6;
                const bulletGradient = ctx.createRadialGradient(bulletX, bullet.y, 0, bulletX, bullet.y, bulletSize);

                if (isIntelligent) {
                  bulletGradient.addColorStop(0, '#ffffff');
                  bulletGradient.addColorStop(0.5, '#ffff00');
                  bulletGradient.addColorStop(1, '#ffaa00');
                } else if (isRapidFire) {
                  bulletGradient.addColorStop(0, '#ffffff');
                  bulletGradient.addColorStop(0.5, '#ff00ff');
                  bulletGradient.addColorStop(1, '#8000ff');
                } else {
                  bulletGradient.addColorStop(0, '#ffffff');
                  bulletGradient.addColorStop(0.5, '#00ffff');
                  bulletGradient.addColorStop(1, '#0080ff');
                }

                ctx.fillStyle = bulletGradient;
                ctx.shadowColor = isIntelligent ? '#ffff00' : isRapidFire ? '#ff00ff' : '#00ffff';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(bulletX, bullet.y, bulletSize, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = isIntelligent ? '#ffff00' : isRapidFire ? '#ff00ff' : '#00ffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(bulletX, bullet.y, bulletSize + 3, 0, Math.PI * 2);
                ctx.stroke();
              }
              ctx.shadowBlur = 0;
            }
          });
        }
      });

      // La línea verde de las bases ya no es necesaria

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
      height={520} // Altura reducida
      className="game-canvas-modern"
      style={{
        position: 'absolute',
        width: '100%',
        height: 'calc(100% - 180px)', // Altura calculada
        top: '180px', // Bajar para empezar debajo de las instrucciones
        left: 0,
      }}
    />
  );
};

export default GameCanvas;