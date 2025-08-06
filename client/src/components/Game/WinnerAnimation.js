import React, { useRef, useEffect } from 'react';

const WinnerAnimation = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef();
  const particlesRef = useRef([]);
  const rocketsRef = useRef([]);
  const confettiRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Lógica de la animación irá aquí

    // Lanzar fuegos artificiales periódicamente
    const launchFireworks = () => {
      if (rocketsRef.current.length < 5) { // Limitar el número de cohetes en pantalla
        rocketsRef.current.push({
          x: Math.random() * canvas.width,
          y: canvas.height,
          vx: Math.random() * 2 - 1,
          vy: -Math.random() * 5 - 5,
          color: `hsl(${Math.random() * 360}, 100%, 50%)`
        });
      }
    };
    const fireworkInterval = setInterval(launchFireworks, 500);

    // Generar confeti
    for (let i = 0; i < 100; i++) {
      confettiRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        vx: Math.random() * 2 - 1,
        vy: Math.random() * 2 + 1,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
        size: Math.random() * 5 + 2
      });
    }

    const animate = () => {
      // Limpiar canvas con efecto de estela
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // DIBUJAR FUEGOS ARTIFICIALES Y CONFETI (FONDO)
      // Actualizar y dibujar cohetes
      rocketsRef.current = rocketsRef.current.filter(rocket => {
        rocket.x += rocket.vx;
        rocket.y += rocket.vy;
        rocket.vy += 0.1; // Gravedad

        ctx.fillStyle = rocket.color;
        ctx.beginPath();
        ctx.arc(rocket.x, rocket.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Explotar cohete
        if (rocket.vy >= 0) {
          for (let i = 0; i < 50; i++) {
            particlesRef.current.push({
              x: rocket.x,
              y: rocket.y,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              life: 60,
              color: rocket.color
            });
          }
          return false;
        }
        return true;
      });

      // Actualizar y dibujar partículas de explosión
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // Gravedad
        p.life--;

        ctx.globalAlpha = p.life / 60;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        return p.life > 0;
      });

      // Actualizar y dibujar confeti
      confettiRef.current.forEach(c => {
        c.x += c.vx;
        c.y += c.vy;

        if (c.y > canvas.height) {
          c.y = -c.size;
          c.x = Math.random() * canvas.width;
        }

        ctx.fillStyle = c.color;
        ctx.fillRect(c.x, c.y, c.size, c.size * 1.5);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      clearInterval(fireworkInterval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={700}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 100
      }}
    />
  );
};

export default WinnerAnimation;