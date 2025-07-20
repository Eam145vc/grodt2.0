import React, { useState } from 'react';

const AdminPanel = (props) => {
  const {
    gameState,
    isConnected,
    onConnectTikTok,
    tiktokConnection,
    setTiktokUser,
    tiktokUser,
    socket
  } = props;

  console.log(`%c[AdminPanel] Renderizando. Props recibidas:`, 'color: orange; font-weight: bold;', { socket: !!socket, isConnected });

  const [energyInputs, setEnergyInputs] = useState({ 1: '', 2: '', 3: '', 4: '' });

  if (!gameState || !gameState.lanes) {
    return <div>Cargando estado del juego...</div>;
  }

  const handleEnergyInputChange = (laneId, value) => {
    setEnergyInputs(prev => ({ ...prev, [laneId]: value }));
  };

  const handleSetEnergyClick = (laneId) => {
    console.log(`%c[AdminPanel] Clic en 'Establecer' para carril ${laneId}.`, 'color: cyan;');
    const energyValue = parseInt(energyInputs[laneId], 10);
    
    if (!socket) {
      console.error("[AdminPanel] ERROR: El objeto socket es NULO al hacer clic.");
      return;
    }

    if (isNaN(energyValue)) {
      console.error(`[AdminPanel] ERROR: El valor introducido '${energyInputs[laneId]}' no es un número válido.`);
      return;
    }
    
    console.log(`%c[AdminPanel] Socket válido encontrado. Emitiendo evento 'admin:setEnergy'.`, 'color: lightgreen;', { laneId, energy: energyValue });
    socket.emit('admin:setEnergy', { laneId, energy: energyValue });
  };

  return (
    <div style={{ border: '2px solid red', padding: '10px', margin: '10px' }}>
      <div className="admin-section">
        <h3>⚡ Controles de Energía</h3>
        <div className="energy-controls">
          {gameState.lanes.map(lane => (
            <div key={lane.id} className="energy-control-lane">
              <span>Carril {lane.id} ({lane.team ? lane.team.name : 'N/A'}):</span>
              <input
                type="number"
                placeholder="Energía"
                className="energy-input"
                value={energyInputs[lane.id]}
                onChange={(e) => handleEnergyInputChange(lane.id, e.target.value)}
              />
              <button
                className="admin-button"
                onClick={() => handleSetEnergyClick(lane.id)}
                disabled={!isConnected}
              >
                Establecer
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="admin-section">
        <h3>📹 Conexión TikTok Live</h3>
        <div className="tiktok-connect">
          <input
            type="text"
            placeholder="@usuario de TikTok"
            className="tiktok-user-input"
            value={tiktokUser}
            onChange={(e) => setTiktokUser(e.target.value)}
            disabled={tiktokConnection.isConnected}
          />
          <button
            className="admin-button tiktok"
            onClick={onConnectTikTok}
            disabled={!isConnected || !tiktokUser || tiktokConnection.isConnected}
          >
            {tiktokConnection.isConnecting ? 'Conectando...' : 'Conectar'}
          </button>
        </div>
        <div className={`connection-status ${tiktokConnection.status}`}>
          {tiktokConnection.message}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;