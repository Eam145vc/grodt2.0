import React, { useState, useEffect } from 'react';

const StatsPanel = ({ socket }) => {
  const [stats, setStats] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (socket) {
      socket.on('statsUpdate', (newStats) => {
        setStats(newStats);
      });

      // Solicitar estadísticas al conectar
      socket.emit('getStats');

      return () => {
        socket.off('statsUpdate');
      };
    }
  }, [socket]);

  const requestStats = () => {
    if (socket) {
      socket.emit('getStats');
    }
  };

  if (!show) {
    return (
      <div className="admin-section-v2">
        <button className="admin-button-v2" onClick={() => { setShow(true); requestStats(); }}>
          📊 Mostrar Estadísticas
        </button>
      </div>
    );
  }

  if (!stats) {
    return <div className="admin-section-v2">Cargando estadísticas...</div>;
  }

  const topDonors = Object.entries(stats.pointsByUser)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  return (
    <div className="admin-section-v2 stats-panel">
      <h3 className="section-title">📊 Panel de Estadísticas</h3>
      <button className="admin-button-v2" onClick={() => setShow(false)} style={{ marginBottom: '15px' }}>
        Ocultar Estadísticas
      </button>
      <button className="admin-button-v2" onClick={requestStats} style={{ marginBottom: '15px', marginLeft: '10px' }}>
        Actualizar
      </button>

      <div className="stats-grid">
        <div className="stat-card">
          <h4>🏆 Victorias por Equipo</h4>
          <ul>
            {Object.entries(stats.winsByTeam).map(([team, wins]) => (
              <li key={team}><strong>{team}:</strong> {wins} victoria(s)</li>
            ))}
          </ul>
        </div>

        <div className="stat-card">
          <h4>💰 Top 10 Donantes (por Puntos)</h4>
          <ol>
            {topDonors.map(([user, points]) => (
              <li key={user}><strong>{user}:</strong> {points.toLocaleString()} puntos</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;