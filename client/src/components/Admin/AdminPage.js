import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const AdminPage = () => {
  const socketRef = useRef(null);
  const [gameState, setGameState] = useState({
    lanes: [
      { id: 1, baseHealth: 100, enemies: [], bullets: [], enemyProjectiles: [], isGameOver: false },
      { id: 2, baseHealth: 100, enemies: [], bullets: [], enemyProjectiles: [], isGameOver: false },
      { id: 3, baseHealth: 100, enemies: [], bullets: [], enemyProjectiles: [], isGameOver: false },
      { id: 4, baseHealth: 100, enemies: [], bullets: [], enemyProjectiles: [], isGameOver: false }
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
    enemyTypes: {}
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');
    
    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('Admin conectado al servidor');
    });
    
    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('Admin desconectado del servidor');
    });
    
    socketRef.current.on('gameState', (newGameState) => {
      setGameState(newGameState);
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const spawnEnemy = (laneId, enemyType) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('spawnEnemy', { laneId, enemyType });
    }
  };

  const shootBullet = (laneId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('shootBullet', laneId);
    }
  };

  const shootAllBullets = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('shootAllBullets');
    }
  };

  const startWaves = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('startWaves');
    }
  };

  const pauseWaves = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('pauseWaves');
    }
  };

  const stopWaves = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('stopWaves');
    }
  };

  const forceNextWave = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('forceNextWave');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEnemyTypeIcon = (type) => {
    const icons = {
      basic: '🟢',
      mini: '🔵',
      special1: '🟡',
      tank: '🟤',
      sniper: '🎯',
      boss: '🔴'
    };
    return icons[type] || '👾';
  };

  const getEnemyTypeName = (type) => {
    const names = {
      basic: 'Básico',
      mini: 'Mini',
      special1: 'Especial 1',
      tank: 'Tanque',
      sniper: 'Sniper',
      boss: 'Boss'
    };
    return names[type] || type;
  };

  const enemyTypes = ['basic', 'mini', 'special1', 'tank', 'sniper', 'boss'];

  return (
    <div className="admin-container-v2">
      <div className="admin-panel-v2">
        <div className="admin-header">
          <h1 className="admin-title-v2">🎮 Centro de Control Avanzado</h1>
          <div className="admin-subtitle">Sistema Multi-Enemigos Tower Defense</div>
        </div>
        
        {/* Estado de conexión */}
        <div className={`connection-status-v2 ${isConnected ? 'connected' : 'disconnected'}`}>
          <div className="connection-indicator">
            {isConnected ? '🟢' : '🔴'}
          </div>
          <span>{isConnected ? 'Conectado al servidor' : 'Desconectado del servidor'}</span>
        </div>

        {/* Panel de estado de oleadas */}
        <div className="wave-status-panel">
          <div className="wave-info">
            <div className="wave-counter">
              <h3>🌊 Oleada {gameState.waveSystem.currentWave}</h3>
              <div className="wave-timer">
                ⏱️ {formatTime(gameState.waveSystem.timeRemaining)}
              </div>
              <div className="wave-duration">
                Duración: {gameState.waveSystem.maxTime}s
              </div>
            </div>
            <div className="game-stats">
              <div className="stat-item">
                <span className="stat-label">👾 Enemigos Totales:</span>
                <span className="stat-value">
                  {gameState.lanes.reduce((total, lane) => total + (lane.enemies ? lane.enemies.length : 0), 0)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">🎯 Proyectiles:</span>
                <span className="stat-value">
                  {gameState.lanes.reduce((total, lane) => total + (lane.enemyProjectiles ? lane.enemyProjectiles.length : 0), 0)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">⚔️ Estado:</span>
                <span className={`stat-value status-${
                  gameState.waveSystem.isActive ?
                    (gameState.waveSystem.isPaused ? 'paused' : 'active') : 'stopped'
                }`}>
                  {gameState.waveSystem.isActive ?
                    (gameState.waveSystem.isPaused ? '⏸️ Pausado' : '▶️ Activo') : '⏹️ Detenido'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Controles de oleadas */}
        <div className="admin-section-v2">
          <h3 className="section-title">🌊 Control de Oleadas</h3>
          <div className="wave-controls">
            <button
              className="admin-button-v2 wave-start"
              onClick={startWaves}
              disabled={!isConnected || (gameState.waveSystem.isActive && !gameState.waveSystem.isPaused)}
            >
              {gameState.waveSystem.isActive && gameState.waveSystem.isPaused ? '▶️ Reanudar' : '🚀 Iniciar'}
            </button>
            <button
              className="admin-button-v2 wave-pause"
              onClick={pauseWaves}
              disabled={!isConnected || !gameState.waveSystem.isActive || gameState.waveSystem.isPaused}
            >
              ⏸️ Pausar
            </button>
            <button
              className="admin-button-v2 wave-stop"
              onClick={stopWaves}
              disabled={!isConnected}
            >
              🛑 Detener & Reset
            </button>
            <button
              className="admin-button-v2 wave-next"
              onClick={forceNextWave}
              disabled={!isConnected || !gameState.waveSystem.isActive}
            >
              ⏭️ Siguiente Oleada
            </button>
          </div>
        </div>
        
        {/* Estado de jugadores */}
        <div className="admin-section-v2">
          <h3 className="section-title">👥 Estado de Jugadores</h3>
          <div className="players-grid">
            {gameState.lanes.map((lane, index) => (
              <div 
                key={lane.id} 
                className={`player-card ${lane.isGameOver ? 'eliminated' : 'alive'}`}
              >
                <div className="player-header">
                  <h4>Jugador {index + 1}</h4>
                  <div className={`player-status ${lane.isGameOver ? 'dead' : 'alive'}`}>
                    {lane.isGameOver ? '💀' : '❤️'}
                  </div>
                </div>
                <div className="player-stats">
                  <div className="stat-row">
                    <span>❤️ Vida:</span>
                    <span className={`health-value ${
                      lane.baseHealth > 66 ? 'high' : 
                      lane.baseHealth > 33 ? 'medium' : 'low'
                    }`}>
                      {lane.baseHealth}/100
                    </span>
                  </div>
                  <div className="stat-row">
                    <span>👾 Enemigos:</span>
                    <span>{lane.enemies ? lane.enemies.length : 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>🔫 Balas:</span>
                    <span>{lane.bullets ? lane.bullets.length : 0}</span>
                  </div>
                  <div className="stat-row">
                    <span>🎯 Proyectiles:</span>
                    <span>{lane.enemyProjectiles ? lane.enemyProjectiles.length : 0}</span>
                  </div>
                </div>
                <div className="health-bar">
                  <div 
                    className="health-fill"
                    style={{ 
                      width: `${lane.baseHealth}%`,
                      backgroundColor: lane.baseHealth > 66 ? '#00ff88' : 
                                     lane.baseHealth > 33 ? '#ffaa00' : '#ff4444'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spawn manual de enemigos por tipo */}
        <div className="admin-section-v2">
          <h3 className="section-title">👾 Spawn Manual de Enemigos</h3>
          
          {enemyTypes.map(enemyType => (
            <div key={enemyType} className="enemy-spawn-section">
              <h4 className="enemy-type-title">
                {getEnemyTypeIcon(enemyType)} {getEnemyTypeName(enemyType)}
                {gameState.enemyTypes && gameState.enemyTypes[enemyType.toUpperCase()] && (
                  <span className="enemy-stats">
                    ({gameState.enemyTypes[enemyType.toUpperCase()].health} HP, 
                    {gameState.enemyTypes[enemyType.toUpperCase()].damage} DMG)
                  </span>
                )}
              </h4>
              <div className="enemy-spawn-controls">
                {gameState.lanes.map((lane, index) => (
                  <button 
                    key={`${enemyType}-${lane.id}`}
                    className={`admin-button-v2 spawn-enemy-type ${lane.isGameOver ? 'disabled' : ''}`}
                    onClick={() => spawnEnemy(lane.id, enemyType)}
                    disabled={!isConnected || lane.isGameOver}
                  >
                    {lane.isGameOver ? '💀' : getEnemyTypeIcon(enemyType)} P{index + 1}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Controles de disparos */}
        <div className="admin-section-v2">
          <h3 className="section-title">🔫 Control de Disparos</h3>
          <div className="shoot-controls">
            <div className="individual-shoots">
              {gameState.lanes.map((lane, index) => (
                <button 
                  key={lane.id}
                  className={`admin-button-v2 shoot-bullet ${lane.isGameOver ? 'disabled' : ''}`}
                  onClick={() => shootBullet(lane.id)}
                  disabled={!isConnected || lane.isGameOver}
                >
                  🔫 P{index + 1}
                </button>
              ))}
            </div>
            <button 
              className="admin-button-v2 shoot-all" 
              onClick={shootAllBullets}
              disabled={!isConnected}
            >
              🚀 Disparar Todos
            </button>
          </div>
        </div>

        {/* Panel de ganador */}
        {gameState.globalGameOver && (
          <div className="winner-panel">
            {gameState.winner ? (
              <>
                <h2 className="winner-announcement">🏆 ¡SUPERVIVIENTE!</h2>
                <div className="winner-details">
                  <h3>Jugador {gameState.winner} Ha Sobrevivido</h3>
                  <p>Oleadas Resistidas: {gameState.waveSystem.currentWave}</p>
                  <p>El último defensor en pie</p>
                </div>
              </>
            ) : (
              <>
                <h2 className="winner-announcement">💀 ANIQUILACIÓN TOTAL</h2>
                <div className="winner-details">
                  <h3>Todos los defensores han caído</h3>
                  <p>Oleadas Resistidas: {gameState.waveSystem.currentWave}</p>
                  <p>La invasión ha triunfado</p>
                </div>
              </>
            )}
          </div>
        )}
        
        <div className="admin-footer">
          <p>🔗 <a 
            href="/game" 
            className="game-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver Pantalla de Juego
          </a></p>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;