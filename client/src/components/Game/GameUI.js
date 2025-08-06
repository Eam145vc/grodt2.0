import React, { useState, useEffect } from 'react';

const GameUI = ({ gameState }) => {
  const [giftConfig, setGiftConfig] = useState({ lanes: [] });

  useEffect(() => {
    fetch('/api/gift-config')
      .then(res => res.json())
      .then(data => setGiftConfig(data))
      .catch(err => console.error("Error al cargar la configuración de regalos:", err));
  }, []);

  if (!gameState || !gameState.lanes) {
    return null;
  }


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
        padding: '10px 5px', // Aumentado para ocupar más espacio
        backdropFilter: 'blur(10px)',
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)'
      }}>
        <div>
          <div style={{ textAlign: 'center', marginBottom: '5px' }}>
            <h5 style={{ color: '#00ffff', margin: '0', fontSize: '12px', textTransform: 'uppercase' }}>Poderes Especiales</h5>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            paddingBottom: '5px',
            alignItems: 'center'
          }}>
            {giftConfig.powerups?.map(powerup => (
              <div key={powerup.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={encodeURI(powerup.image)} alt={powerup.name} style={{ width: '30px', height: '30px' }} />
                <span style={{ color: '#ffffff', fontSize: '10px', textTransform: 'uppercase' }}>{powerup.action}</span>
              </div>
            ))}
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            borderTop: '1px solid rgba(0, 255, 255, 0.5)',
            paddingTop: '5px',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', gap: '10px' }}>
              <span>OLEADA: {gameState.waveSystem.currentWave}</span>
              <span>
                TIEMPO: {Math.floor(gameState.waveSystem.timeRemaining / 60).toString().padStart(2, '0')}:{(gameState.waveSystem.timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '5px' }}>
            <h5 style={{ color: '#00ffff', margin: '0', fontSize: '12px', textTransform: 'uppercase' }}>ATACA A TUS ENEMIGOS:</h5>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'stretch', // Para que las columnas tengan la misma altura
            textAlign: 'center',
            paddingTop: '5px',
          }}>
            {giftConfig.lanes.map(laneConfig => (
              <div key={laneConfig.laneId} style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(0, 255, 255, 0.2)',
                borderRadius: '5px',
                padding: '3px',
                margin: '0 1px'
              }}>
                <h4 style={{ color: '#00ffff', margin: '0 0 5px 0', fontSize: '12px' }}>
                  {gameState.lanes[laneConfig.laneId - 1]?.team || `P${laneConfig.laneId}`}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                  {laneConfig.gifts.map(gift => (
                    <div key={gift.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <img src={encodeURI(gift.image)} alt={gift.name} style={{ width: '25px', height: '25px' }} />
                        {gift.name.includes('x5') && <span style={{ color: '#ffffff', fontSize: '10px', fontWeight: 'bold', marginLeft: '2px' }}>x5</span>}
                      </div>
                      <span style={{ color: '#ffffff', fontSize: '10px' }}>{gift.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contenedor principal para carriles y bases */}
      <div style={{
        position: 'absolute',
        top: '180px', // Ajustado para empezar más arriba
        left: '10px',
        right: '10px',
        bottom: '25%', // Dejar espacio para el chat
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
            {/* El nombre del equipo se ha movido al panel superior */}

            {/* Las barras de energía y vida ahora se renderizan en GameBars.js */}

            {/* Contenedor para la información de la base (ahora solo para el nombre del equipo) */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              padding: '5px',
            }}>
              {/* El indicador de Wave y Time ahora es general y está fuera del map */}
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
                  ELIMINADO
                </div>
              </div>
            )}
          </div>
        ))}
        {/* El indicador de Wave y Time se ha movido al panel superior */}
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