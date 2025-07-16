import React from 'react';

const AdminPanel = ({
  gameState,
  isConnected,
  onSpawnEnemy,
  onShootBullet,
  onShootAll,
  onReset
}) => {
  return (
    <div className="admin-panel">
      <h1 className="admin-title">🎮 Panel de Control</h1>
      
      {/* Estado de conexión */}
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '🟢 Conectado al servidor' : '🔴 Desconectado del servidor'}
      </div>
      
      {/* Sección de enemigos */}
      <div className="admin-section">
        <h3>👾 Spawn Enemigos</h3>
        <div className="button-group">
          <button
            className="admin-button enemy"
            onClick={() => onSpawnEnemy(1)}
            disabled={!isConnected}
          >
            Carril 1
          </button>
          <button
            className="admin-button enemy"
            onClick={() => onSpawnEnemy(2)}
            disabled={!isConnected}
          >
            Carril 2
          </button>
          <button
            className="admin-button enemy"
            onClick={() => onSpawnEnemy(3)}
            disabled={!isConnected}
          >
            Carril 3
          </button>
          <button
            className="admin-button enemy"
            onClick={() => onSpawnEnemy(4)}
            disabled={!isConnected}
          >
            Carril 4
          </button>
        </div>
      </div>
      
      {/* Sección de disparos */}
      <div className="admin-section">
        <h3>🔫 Disparar Balas</h3>
        <div className="button-group">
          <button
            className="admin-button shoot"
            onClick={() => onShootBullet(1)}
            disabled={!isConnected}
          >
            Disparar C1
          </button>
          <button
            className="admin-button shoot"
            onClick={() => onShootBullet(2)}
            disabled={!isConnected}
          >
            Disparar C2
          </button>
          <button
            className="admin-button shoot"
            onClick={() => onShootBullet(3)}
            disabled={!isConnected}
          >
            Disparar C3
          </button>
          <button
            className="admin-button shoot"
            onClick={() => onShootBullet(4)}
            disabled={!isConnected}
          >
            Disparar C4
          </button>
        </div>
        
        <div className="button-group">
          <button
            className="admin-button special"
            onClick={onShootAll}
            disabled={!isConnected}
          >
            🚀 Disparar Todos
          </button>
        </div>
      </div>
      
      {/* Sección de control */}
      <div className="admin-section">
        <h3>⚙️ Control del Juego</h3>
        <div className="button-group">
          <button
            className="admin-button reset"
            onClick={onReset}
            disabled={!isConnected}
          >
            🔄 Reiniciar Juego
          </button>
        </div>
      </div>
      
      {/* Estado del juego */}
      <div className="status-display">
        <h3 style={{ color: 'white', marginBottom: '15px' }}>📊 Estado del Juego</h3>
        
        <div className="status-item">
          <span>❤️ Vida de la Base:</span>
          <span className="status-value" style={{ color: gameState.baseHealth > 50 ? '#27ae60' : '#e74c3c' }}>
            {gameState.baseHealth}/100
          </span>
        </div>
        
        <div className="status-item">
          <span>⭐ Puntuación:</span>
          <span className="status-value" style={{ color: '#f39c12' }}>
            {gameState.score}
          </span>
        </div>
        
        <div className="status-item">
          <span>🎮 Estado:</span>
          <span className="status-value" style={{ color: gameState.isGameOver ? '#e74c3c' : '#27ae60' }}>
            {gameState.isGameOver ? 'Game Over' : 'Jugando'}
          </span>
        </div>
        
        {/* Estado de carriles */}
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ color: 'white', marginBottom: '10px' }}>🛣️ Estado de Carriles:</h4>
          {gameState.lanes.map((lane, index) => (
            <div key={lane.id} className="status-item">
              <span>Carril {index + 1}:</span>
              <span className="status-value">
                👾 {lane.enemies.length} | 🔫 {lane.bullets.length}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div style={{
        marginTop: '20px',
        textAlign: 'center',
        color: 'white',
        fontSize: '16px'
      }}>
        <p>🔗 <a
          href="/game"
          style={{ color: '#3498db', textDecoration: 'underline' }}
          target="_blank"
        >
          Ver Juego en Pantalla Completa
        </a></p>
      </div>
    </div>
  );
};

export default AdminPanel;