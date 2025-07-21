import React from 'react';

const GameUI = ({ gameState }) => {
  if (!gameState || !gameState.lanes) {
    return null;
  }

  const getEnergyGlow = (energy) => {
    if (energy === 1000) return '#ff00ff'; // Máximo - Magenta
    if (energy > 600) return '#ffaa00'; // Alto - Naranja
    if (energy > 300) return '#00ffff'; // Medio - Cyan
    return '#666666'; // Bajo - Gris
  };

  const getHealthGlow = (health) => {
    if (health > 70) return '#00ff88';
    if (health > 40) return '#ffaa00';
    return '#ff4444';
  };

  return (
    <div style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      pointerEvents: 'none',
      fontFamily: 'Arial, monospace'
    }}>
      
      {/* Panel de información superior mejorado */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '95%',
        maxWidth: '400px',
        background: 'rgba(0, 0, 0, 0.8)',
        border: '1px solid rgba(0, 255, 255, 0.5)',
        borderRadius: '15px',
        padding: '15px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {/* Oleada */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                color: '#00ffff', 
                fontSize: '12px', 
                marginBottom: '5px',
                textShadow: '0 0 10px #00ffff'
              }}>
                WAVE
              </div>
              <div style={{ 
                color: '#ffffff', 
                fontSize: '24px', 
                fontWeight: 'bold',
                textShadow: '0 0 15px #00ffff'
              }}>
                {gameState.waveSystem.currentWave}
              </div>
            </div>

            {/* Tiempo */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                color: '#ffaa00', 
                fontSize: '12px', 
                marginBottom: '5px',
                textShadow: '0 0 10px #ffaa00'
              }}>
                TIME
              </div>
              <div style={{ 
                color: '#ffffff', 
                fontSize: '20px', 
                fontWeight: 'bold',
                fontFamily: 'monospace',
                textShadow: '0 0 15px #ffaa00'
              }}>
                {Math.floor(gameState.waveSystem.timeRemaining / 60)
                  .toString()
                  .padStart(2, '0')}
                :{(gameState.waveSystem.timeRemaining % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>

          {/* Estado del juego */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {gameState.waveSystem.isActive && !gameState.waveSystem.isPaused && (
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#00ff88',
                borderRadius: '50%',
                boxShadow: '0 0 10px #00ff88',
                animation: 'pulse 1s infinite'
              }} />
            )}
            {gameState.waveSystem.isPaused && (
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#ffaa00',
                borderRadius: '50%',
                boxShadow: '0 0 10px #ffaa00',
                animation: 'pulse 1s infinite'
              }} />
            )}
            <span style={{ 
              color: '#cccccc', 
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              {gameState.waveSystem.isActive 
                ? (gameState.waveSystem.isPaused ? 'PAUSED' : 'ACTIVE') 
                : 'WAITING'}
            </span>
          </div>
        </div>
      </div>

      {/* Contenedor principal para carriles y bases */}
      <div style={{
        position: 'absolute',
        top: '130px', // Espacio para el panel superior
        left: '10px',
        right: '10px',
        bottom: '10px',
        display: 'flex',
        justifyContent: 'space-around',
        gap: '5px'
      }}>
        {gameState.lanes.map((lane, index) => (
          <div key={lane.id} style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            {/* Contenedor para la barra de energía y su valor */}
            <div style={{
              position: 'relative',
              width: '100%',
              flexGrow: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '90px' // Espacio para la base en la parte inferior
            }}>
              {/* Barra de energía */}
              <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '8px',
                background: 'rgba(0, 0, 0, 0.7)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '10px',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  width: '100%',
                  height: `${((lane.energy || 0) / 1000) * 100}%`,
                  background: `linear-gradient(to top, ${getEnergyGlow(lane.energy || 0)}, rgba(255,255,255,0.8))`,
                  borderRadius: '10px',
                  boxShadow: `0 0 15px ${getEnergyGlow(lane.energy || 0)}`,
                  transition: 'height 0.3s ease'
                }} />
              </div>

              {/* Indicador numérico de energía */}
              <div style={{
                position: 'absolute',
                left: 'calc(50% + 10px)',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '5px',
                padding: '2px 4px',
                fontSize: '10px',
                color: '#00ffff',
                fontFamily: 'monospace'
              }}>
                {lane.energy || 0}
              </div>
            </div>

            {/* Contenedor para la información de la base */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              width: '90%',
              background: 'rgba(0, 0, 0, 0.8)',
              borderRadius: '15px',
              border: '1px solid rgba(0, 255, 255, 0.3)',
              padding: '5px',
            }}>
              {/* Barra de vida */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '3px'
                }}>
                  <span style={{ fontSize: '10px', color: '#00ffff', fontFamily: 'monospace' }}>
                    BASE
                  </span>
                  <span style={{ fontSize: '10px', color: '#ffffff', fontFamily: 'monospace' }}>
                    {lane.baseHealth}/100
                  </span>
                </div>
                <div style={{
                  height: '6px',
                  background: 'rgba(0, 0, 0, 0.7)',
                  border: '1px solid rgba(0, 255, 255, 0.3)',
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${lane.baseHealth}%`,
                    background: `linear-gradient(to right, ${getHealthGlow(lane.baseHealth)}, rgba(255,255,255,0.8))`,
                    borderRadius: '10px',
                    boxShadow: `0 0 8px ${getHealthGlow(lane.baseHealth)}`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Nombre del equipo */}
              {lane.team && (
                <div style={{
                  fontSize: '10px',
                  color: '#00ffff',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  textShadow: '0 0 5px #00ffff'
                }}>
                  {lane.team.toUpperCase()}
                </div>
              )}
            </div>

            {/* Indicador de Power Mode */}
            {lane.doubleBulletsActive && (
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1,
                background: 'rgba(138, 43, 226, 0.8)',
                border: '1px solid rgba(255, 0, 255, 0.5)',
                borderRadius: '15px',
                padding: '4px 8px',
                fontSize: '10px',
                color: '#ff00ff',
                fontWeight: 'bold',
                textShadow: '0 0 10px #ff00ff',
                animation: 'pulse 1s infinite'
              }}>
                ⚡ POWER MODE
              </div>
            )}

            {/* Overlay de eliminado */}
            {lane.isGameOver && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 2,
                background: 'rgba(255, 0, 50, 0.2)',
                border: '2px solid rgba(255, 0, 50, 0.5)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  color: '#ff0032',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  transform: 'rotate(45deg)',
                  textShadow: '0 0 10px #ff0032',
                  opacity: 0.7
                }}>
                  ELIMINATED
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CSS para animaciones */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default GameUI;