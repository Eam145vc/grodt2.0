import React from 'react';

const GameUI = ({ gameState, isConnected, onReset }) => {
  return (
    <>
      {/* UI del juego */}
      <div className="game-ui">
        <div className="health-display">
          ❤️ Base: {gameState.baseHealth}/100
        </div>
        <div className="score-display">
          ⭐ Score: {gameState.score}
        </div>
        <div style={{ 
          color: isConnected ? '#27ae60' : '#e74c3c',
          fontSize: '14px'
        }}>
          {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
        </div>
      </div>
      
      {/* Overlay de Game Over */}
      {gameState.isGameOver && (
        <div className="game-over-overlay">
          <h2>¡GAME OVER!</h2>
          <p>Score Final: {gameState.score}</p>
          <button onClick={onReset}>
            Reiniciar Juego
          </button>
        </div>
      )}
    </>
  );
};

export default GameUI;