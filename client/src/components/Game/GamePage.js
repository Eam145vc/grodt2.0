import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import GameUI from './GameUI';
import GameCanvas from './GameCanvas'; // Importar el GameCanvas moderno

const GamePage = () => {
  const socketRef = useRef(null);
  const gameContainerRef = useRef(null);
  const [gameState, setGameState] = useState({
    lanes: [
      { id: 1, baseHealth: 100, enemies: [], bullets: [], enemyProjectiles: [], turrets: [], freezeBalls: [], doubleBulletsActive: false, isGameOver: false, team: null, energy: 0 },
      { id: 2, baseHealth: 100, enemies: [], bullets: [], enemyProjectiles: [], turrets: [], freezeBalls: [], doubleBulletsActive: false, isGameOver: false, team: null, energy: 0 },
      { id: 3, baseHealth: 100, enemies: [], bullets: [], enemyProjectiles: [], turrets: [], freezeBalls: [], doubleBulletsActive: false, isGameOver: false, team: null, energy: 0 },
      { id: 4, baseHealth: 100, enemies: [], bullets: [], enemyProjectiles: [], turrets: [], freezeBalls: [], doubleBulletsActive: false, isGameOver: false, team: null, energy: 0 }
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
    activePowerUps: {
      turrets: [],
      freezeBalls: [],
      doubleBullets: []
    }
  });

  useEffect(() => {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    socketRef.current = io(socketUrl);

    socketRef.current.on('connect', () => {
      console.log('Conectado al servidor');
    });
    
    socketRef.current.on('disconnect', () => {
      console.log('Desconectado del servidor');
    });
    
    socketRef.current.on('gameState', (newGameState) => {
      setGameState(JSON.parse(JSON.stringify(newGameState)));
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const updateScale = () => {
      if (gameContainerRef.current) {
        const { clientWidth: viewportWidth, clientHeight: viewportHeight } = document.documentElement;
        const nativeWidth = 400;
        const nativeHeight = 700;

        // Reserve 15% of the height at the bottom
        const availableHeight = viewportHeight * 0.85;

        const scaleX = viewportWidth / nativeWidth;
        const scaleY = availableHeight / nativeHeight;
        const scale = Math.min(scaleX, scaleY);
        
        const scaledWidth = nativeWidth * scale;
        const scaledHeight = nativeHeight * scale;

        gameContainerRef.current.style.transform = `scale(${scale})`;
        gameContainerRef.current.style.left = `${(viewportWidth - scaledWidth) / 2}px`;
        // Center the game in the top 85% of the screen
        gameContainerRef.current.style.top = `${(availableHeight - scaledHeight) / 2}px`;
      }
    };

    window.addEventListener('resize', updateScale);
    updateScale();

    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div className="game-page-wrapper">
      <div className="game-viewport">
        <div
          ref={gameContainerRef}
          className="game-container-vertical"
          style={{
            position: 'absolute',
            width: '400px',
            height: '700px',
            transformOrigin: 'top left',
          }}
        >
          {/* Canvas del juego usando el GameCanvas moderno */}
          <div className="game-canvas-container">
            <GameCanvas gameState={gameState} />
            <GameUI gameState={gameState} />
            
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
    </div>
  );
};

export default GamePage;