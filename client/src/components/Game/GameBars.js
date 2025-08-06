import React from 'react';

const GameBars = ({ gameState }) => {
  const getEnergyGlow = (energy) => {
    if (energy === 1000) return '#ff00ff';
    if (energy > 600) return '#ffaa00';
    if (energy > 300) return '#00ffff';
    return '#666666';
  };

  const getHealthGlow = (health) => {
    if (health > 70) return '#00ff88';
    if (health > 40) return '#ffaa00';
    return '#ff4444';
  };

  return (
    <div style={{
      position: 'absolute',
      top: '230px', // Bajar 10px
      left: '10px',
      right: '10px',
      bottom: '80px',
      display: 'flex',
      justifyContent: 'space-around',
      gap: '5px',
      pointerEvents: 'none'
    }}>
      {gameState.lanes.map((lane, index) => {
        const getLeftPosition = () => {
          switch (index) {
            case 0: return '-10px';
            case 1: return '-6px';
            case 2: return '-4px';
            default: return '5px';
          }
        };

        return (
          <div key={lane.id} style={{ flex: 1, position: 'relative' }}>
            <div style={{
              position: 'absolute',
              bottom: '0',
              top: '0',
              left: getLeftPosition(),
              width: '18px',
              display: 'flex',
              flexDirection: 'row',
              gap: '2px'
            }}>
            {/* Barra de energía */}
            <div style={{ position: 'relative', height: '100%', width: '8px' }}>
              <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: '100%',
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
              <span style={{ position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '12px' }}>⚡</span>
            </div>
            {/* Barra de vida */}
            <div style={{ position: 'relative', height: '100%', width: '8px' }}>
              <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: '100%',
                background: 'rgba(0, 0, 0, 0.7)',
                border: '1px solid rgba(255, 68, 68, 0.3)',
                borderRadius: '10px',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  width: '100%',
                  height: `${lane.baseHealth}%`,
                  background: `linear-gradient(to top, ${getHealthGlow(lane.baseHealth)}, rgba(255,255,255,0.8))`,
                  borderRadius: '10px',
                  boxShadow: `0 0 15px ${getHealthGlow(lane.baseHealth)}`,
                  transition: 'height 0.3s ease'
                }} />
              </div>
              <span style={{ position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '12px', color: 'red' }}>✚</span>
            </div>
          </div>
            </div>
        );
      })}
    </div>
  );
};

export default GameBars;
