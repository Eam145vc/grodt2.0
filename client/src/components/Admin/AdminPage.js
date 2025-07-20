import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { TIKTOK_GIFTS, ALLOWED_TEAMS } from '../../utils/constants';
import GameCanvas from '../Game/GameCanvas';
import AdminPanel from './AdminPanel';

const AdminPage = () => {
  const socketRef = useRef(null);
  const [gameState, setGameState] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [selectedGifts, setSelectedGifts] = useState({ 1: '', 2: '', 3: '', 4: '' });
  const [coinAmounts, setCoinAmounts] = useState({ 1: 10, 2: 10, 3: 10, 4: 10 });
  const [powerUpLane, setPowerUpLane] = useState(1);
  const [teamCommand, setTeamCommand] = useState('/equipo colombia');
  const [presalaUserId, setPresalaUserId] = useState('user123');
  const [presalaTeam, setPresalaTeam] = useState(ALLOWED_TEAMS[0]);
  const [presalaGiftAmount, setPresalaGiftAmount] = useState(10);
  const [tiktokUser, setTiktokUser] = useState('');
  const [tiktokConnection, setTiktokConnection] = useState({
    isConnected: false,
    isConnecting: false,
    message: 'Desconectado del Live',
    status: 'disconnected'
  });

  useEffect(() => {
    // Activar el scroll en el body cuando esta página esté activa
    document.body.classList.add('admin-page-active');

    const initialGifts = {};
    for (let i = 1; i <= 4; i++) {
      const firstGiftForLane = TIKTOK_GIFTS.find(g => g.lane === i);
      if (firstGiftForLane) {
        initialGifts[i] = firstGiftForLane.name;
      }
    }
    setSelectedGifts(initialGifts);

    socketRef.current = io('http://localhost:5000');
    
    socketRef.current.on('connect', () => {
      setIsConnected(true);
      setIsSocketReady(true);
      console.log('Admin conectado al servidor');
    });
    
    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('Admin desconectado del servidor');
    });
    
    socketRef.current.on('gameState', (newGameState) => {
      // Clonar el estado para forzar una nueva renderización
      setGameState(JSON.parse(JSON.stringify(newGameState)));
    });

    socketRef.current.on('tiktok-connection-status', (data) => {
      console.log("Received tiktok-connection-status", data);
      setTiktokConnection({
        isConnected: data.status === 'connected',
        isConnecting: false,
        message: data.message,
        status: data.status
      });
    });
    
    return () => {
      // Limpiar la clase del body cuando el componente se desmonte
      document.body.classList.remove('admin-page-active');
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleGiftChange = (laneId, giftName) => {
    setSelectedGifts(prev => ({ ...prev, [laneId]: giftName }));
  };

  const handleCoinChange = (laneId, amount) => {
    const newAmount = Math.max(1, parseInt(amount, 10) || 1);
    setCoinAmounts(prev => ({ ...prev, [laneId]: newAmount }));
  };

  const handleAddCoins = (laneId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('addCoins', { laneId, amount: coinAmounts[laneId] });
    }
  };

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

  const spawnTurret = (laneId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('spawnTurret', laneId);
    }
  };

  const spawnFreezeBall = (laneId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('spawnFreezeBall', laneId);
    }
  };

  const activateDoubleBullets = (laneId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('activateDoubleBullets', laneId);
    }
  };

  const simulateTikTokEvent = (eventType, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('tiktok-event', { event_type: eventType, data });
    }
  };

  const handleTeamCommand = () => {
    if (socketRef.current && isConnected && teamCommand.startsWith('/equipo ')) {
      const teamName = teamCommand.split(' ')[1];
      if (teamName) {
        socketRef.current.emit('join-team', { userId: 'admin_user', teamName });
      }
    }
  };

  const handleJoinTeam = () => {
    if (socketRef.current && isConnected && presalaUserId && presalaTeam) {
      socketRef.current.emit('join-team', { userId: presalaUserId, teamName: presalaTeam });
    }
  };

  const handleSendLike = () => {
    if (socketRef.current && isConnected && presalaUserId) {
      socketRef.current.emit('tiktok-event', {
        event_type: 'like',
        data: { user: presalaUserId, count: 1 }
      });
    }
  };

  const handleSendGift = () => {
    if (socketRef.current && isConnected && presalaUserId && presalaGiftAmount > 0) {
      socketRef.current.emit('tiktok-event', {
        event_type: 'gift',
        data: { user: presalaUserId, count: presalaGiftAmount }
      });
    }
  };

  const handleConnectTikTok = () => {
    if (socketRef.current && isConnected && tiktokUser) {
      setTiktokConnection({
        ...tiktokConnection,
        isConnecting: true,
        status: 'connecting',
        message: `Enviando orden para conectar con @${tiktokUser}...`
      });
      socketRef.current.emit('connect-tiktok', { tiktokUser });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeRemaining = (endTime) => {
    const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    return `${remaining}s`;
  };

  const getEnemyTypeIcon = (type) => {
    const icons = {
      basic: '🟢', mini: '🔵', special1: '🟡', tank: '🟤', sniper: '🎯', boss: '🔴'
    };
    return icons[type] || '👾';
  };

  const getEnemyTypeName = (type) => {
    const names = {
      basic: 'Básico', mini: 'Mini', special1: 'Especial 1', tank: 'Tanque', sniper: 'Sniper', boss: 'Boss'
    };
    return names[type] || type;
  };

  const enemyTypes = ['basic', 'mini', 'special1', 'tank', 'sniper', 'boss'];

  if (!gameState) {
    return <div className="loading-admin">Cargando panel de administración...</div>;
  }

  return (
    <div className="admin-layout-container">
      <div className="admin-grid">
        <div className="admin-header">
          <h1 className="admin-title-v2">🎮 Centro de Control Avanzado</h1>
          <div className="admin-subtitle">Sistema Multi-Enemigos Tower Defense</div>
        </div>

        <div className="admin-grid-col-1">
          {/* Columna de Controles Principales */}
          {isSocketReady ? (
            <AdminPanel
              gameState={gameState}
              isConnected={isConnected}
              onSpawnEnemy={spawnEnemy}
              onShootBullet={shootBullet}
              onShootAll={shootAllBullets}
              onReset={stopWaves}
              onConnectTikTok={handleConnectTikTok}
              tiktokConnection={tiktokConnection}
              setTiktokUser={setTiktokUser}
              tiktokUser={tiktokUser}
              socket={socketRef.current}
            />
          ) : (
            <div className="admin-section">
              <h3>Panel de Administrador</h3>
              <p>Estableciendo conexión con el servidor...</p>
            </div>
          )}
          <div className={`connection-status-v2 ${isConnected ? 'connected' : 'disconnected'}`}>
            <div className="connection-indicator">{isConnected ? '🟢' : '🔴'}</div>
            <span>{isConnected ? 'Conectado al servidor' : 'Desconectado del servidor'}</span>
          </div>

          <div className="wave-status-panel">
            <div className="wave-info">
              <div className="wave-counter">
                <h3>🌊 Oleada {gameState.waveSystem.currentWave}</h3>
                <div className="wave-timer">⏱️ {formatTime(gameState.waveSystem.timeRemaining)}</div>
                <div className="wave-duration">Duración: {gameState.waveSystem.maxTime}s</div>
              </div>
              <div className="game-stats">
                <div className="stat-item">
                  <span className="stat-label">👾 Enemigos Totales:</span>
                  <span className="stat-value">{gameState.lanes.reduce((total, lane) => total + (lane.enemies ? lane.enemies.length : 0), 0)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">🎯 Proyectiles:</span>
                  <span className="stat-value">{gameState.lanes.reduce((total, lane) => total + (lane.enemyProjectiles ? lane.enemyProjectiles.length : 0), 0)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">🏗️ Torretas:</span>
                  <span className="stat-value">{gameState.lanes.reduce((total, lane) => total + (lane.turrets ? lane.turrets.length : 0), 0)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">⚔️ Estado:</span>
                  <span className={`stat-value status-${gameState.waveSystem.isActive ? (gameState.waveSystem.isPaused ? 'paused' : 'active') : 'stopped'}`}>
                    {gameState.waveSystem.isActive ? (gameState.waveSystem.isPaused ? '⏸️ Pausado' : '▶️ Activo') : '⏹️ Detenido'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-section-v2">
            <h3 className="section-title">🌊 Control de Oleadas</h3>
            <div className="wave-controls">
              <button className="admin-button-v2 wave-start" onClick={startWaves} disabled={!isConnected || (gameState.waveSystem.isActive && !gameState.waveSystem.isPaused)}>
                {gameState.waveSystem.isActive && gameState.waveSystem.isPaused ? '▶️ Reanudar' : '🚀 Iniciar'}
              </button>
              <button className="admin-button-v2 wave-pause" onClick={pauseWaves} disabled={!isConnected || !gameState.waveSystem.isActive || gameState.waveSystem.isPaused}>
                ⏸️ Pausar
              </button>
              <button className="admin-button-v2 wave-stop" onClick={stopWaves} disabled={!isConnected}>
                🛑 Detener & Reset
              </button>
              <button className="admin-button-v2 wave-next" onClick={forceNextWave} disabled={!isConnected || !gameState.waveSystem.isActive}>
                ⏭️ Siguiente Oleada
              </button>
            </div>
          </div>

          <div className="admin-section-v2">
            <h3 className="section-title">⚡ Power-Ups</h3>
            {(gameState.activePowerUps.turrets.length > 0 || gameState.activePowerUps.doubleBullets.length > 0) && (
              <div className="powerups-status">
                <h4 style={{ color: '#00ff88', marginBottom: '10px' }}>🔥 Power-Ups Activos:</h4>
                {gameState.activePowerUps.turrets.length > 0 && (
                  <div className="powerup-indicator turret-active">
                    🏗️ Torretas activas: {gameState.activePowerUps.turrets.map(p => `P${p.laneId} (${formatTimeRemaining(p.endTime)})`).join(', ')}
                  </div>
                )}
                {gameState.activePowerUps.doubleBullets.length > 0 && (
                  <div className="powerup-indicator double-bullets-active">
                    🎯 Balas Dobles activas: {gameState.activePowerUps.doubleBullets.map(p => `P${p.laneId} (${formatTimeRemaining(p.endTime)})`).join(', ')}
                  </div>
                )}
              </div>
            )}
            <div className="powerup-section">
              <h4 className="powerup-title">🏗️ Torretas Laterales (60s)</h4>
              <p className="powerup-description">Spawn una torreta que sigue y dispara al enemigo más adelantado</p>
              <div className="powerup-controls">
                {gameState.lanes.map((lane, index) => (
                  <button key={`turret-${lane.id}`} className={`admin-button-v2 powerup-turret ${lane.isGameOver ? 'disabled' : ''}`} onClick={() => spawnTurret(lane.id)} disabled={!isConnected || lane.isGameOver}>
                    {lane.isGameOver ? '💀' : '🏗️'} P{index + 1}
                    {lane.turrets && lane.turrets.length > 0 && (<span className="turret-count"> ({lane.turrets.length})</span>)}
                  </button>
                ))}
              </div>
            </div>
            <div className="powerup-section">
              <h4 className="powerup-title">🧊 Bola de Hielo (5s congelamiento)</h4>
              <p className="powerup-description">Lanza una bola que congela todos los enemigos presentes</p>
              <div className="powerup-controls">
                {gameState.lanes.map((lane, index) => (
                  <button key={`freeze-${lane.id}`} className={`admin-button-v2 powerup-freeze ${lane.isGameOver ? 'disabled' : ''}`} onClick={() => spawnFreezeBall(lane.id)} disabled={!isConnected || lane.isGameOver}>
                    {lane.isGameOver ? '💀' : '🧊'} P{index + 1}
                    {lane.freezeBalls && lane.freezeBalls.length > 0 && (<span className="freeze-count"> ({lane.freezeBalls.length})</span>)}
                  </button>
                ))}
              </div>
            </div>
            <div className="powerup-section">
              <h4 className="powerup-title">🎯 Balas Dobles (20s duración)</h4>
              <p className="powerup-description">Las balas hacen doble daño y se ven más grandes</p>
              <div className="powerup-controls">
                {gameState.lanes.map((lane, index) => (
                  <button key={`double-${lane.id}`} className={`admin-button-v2 powerup-double ${lane.isGameOver ? 'disabled' : ''} ${lane.doubleBulletsActive ? 'active' : ''}`} onClick={() => activateDoubleBullets(lane.id)} disabled={!isConnected || lane.isGameOver || lane.doubleBulletsActive}>
                    {lane.isGameOver ? '💀' : lane.doubleBulletsActive ? '🎯✨' : '🎯'} P{index + 1}
                    {lane.doubleBulletsActive && (<span className="double-active"> (ACTIVO)</span>)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="admin-grid-col-2">
          {/* Canvas del Juego */}
          <div className="admin-section-v2">
            <GameCanvas gameState={gameState} />
          </div>

          {/* Columna de Estado y Spawns */}
          <div className="admin-section-v2">
            <h3 className="section-title">👥 Estado de Jugadores</h3>
            <div className="players-grid">
              {gameState.lanes.map((lane, index) => (
                <div key={lane.id} className={`player-card ${lane.isGameOver ? 'eliminated' : 'alive'}`}>
                  <div className="player-header">
                    <h4>Jugador {index + 1}</h4>
                    <div className={`player-status ${lane.isGameOver ? 'dead' : 'alive'}`}>{lane.isGameOver ? '💀' : '❤️'}</div>
                  </div>
                  <div className="player-stats">
                    <div className="stat-row">
                      <span>❤️ Vida:</span>
                      <span className={`health-value ${lane.baseHealth > 66 ? 'high' : lane.baseHealth > 33 ? 'medium' : 'low'}`}>{lane.baseHealth}/100</span>
                    </div>
                    <div className="stat-row"><span>👾 Enemigos:</span><span>{lane.enemies ? lane.enemies.length : 0}</span></div>
                    <div className="stat-row"><span>🔫 Balas:</span><span>{lane.bullets ? lane.bullets.length : 0}</span></div>
                    <div className="stat-row"><span>🎯 Proyectiles:</span><span>{lane.enemyProjectiles ? lane.enemyProjectiles.length : 0}</span></div>
                    <div className="stat-row"><span>🏗️ Torretas:</span><span>{lane.turrets ? lane.turrets.length : 0}</span></div>
                    <div className="stat-row"><span>🧊 Bolas Hielo:</span><span>{lane.freezeBalls ? lane.freezeBalls.length : 0}</span></div>
                    <div className="stat-row">
                      <span>🎯 Balas Dobles:</span>
                      <span className={lane.doubleBulletsActive ? 'powerup-active' : ''}>{lane.doubleBulletsActive ? 'ACTIVO' : 'Inactivo'}</span>
                    </div>
                  </div>
                  <div className="health-bar">
                    <div className="health-fill" style={{ width: `${lane.baseHealth}%`, backgroundColor: lane.baseHealth > 66 ? '#00ff88' : lane.baseHealth > 33 ? '#ffaa00' : '#ff4444' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-section-v2">
            <h3 className="section-title">👾 Spawn Manual de Enemigos</h3>
            {enemyTypes.map(enemyType => (
              <div key={enemyType} className="enemy-spawn-section">
                <h4 className="enemy-type-title">
                  {getEnemyTypeIcon(enemyType)} {getEnemyTypeName(enemyType)}
                  {gameState.enemyTypes && gameState.enemyTypes[enemyType.toUpperCase()] && (
                    <span className="enemy-stats">({gameState.enemyTypes[enemyType.toUpperCase()].health} HP, {gameState.enemyTypes[enemyType.toUpperCase()].damage} DMG)</span>
                  )}
                </h4>
                <div className="enemy-spawn-controls">
                  {gameState.lanes.map((lane, index) => (
                    <button key={`${enemyType}-${lane.id}`} className={`admin-button-v2 spawn-enemy-type ${lane.isGameOver ? 'disabled' : ''}`} onClick={() => spawnEnemy(lane.id, enemyType)} disabled={!isConnected || lane.isGameOver}>
                      {lane.isGameOver ? '💀' : getEnemyTypeIcon(enemyType)} P{index + 1}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="admin-section-v2">
            <h3 className="section-title">🔫 Control de Disparos</h3>
            <div className="shoot-controls">
              <div className="individual-shoots">
                {gameState.lanes.map((lane, index) => (
                  <button key={lane.id} className={`admin-button-v2 shoot-bullet ${lane.isGameOver ? 'disabled' : ''}`} onClick={() => shootBullet(lane.id)} disabled={!isConnected || lane.isGameOver}>
                    🔫 P{index + 1}
                  </button>
                ))}
              </div>
              <button className="admin-button-v2 shoot-all" onClick={shootAllBullets} disabled={!isConnected}>
                🚀 Disparar Todos
              </button>
            </div>
          </div>

          <div className="admin-section-v2">
            <h3 className="section-title">🎁 Pruebas de TikTok</h3>
            {[1, 2, 3, 4].map(laneId => {
              const giftsForLane = TIKTOK_GIFTS.filter(g => g.lane === laneId);
              return (
                <div key={laneId} className="powerup-section">
                  <h4 className="powerup-title">Carril {laneId}</h4>
                  <div className="powerup-controls">
                    <button className="admin-button-v2 like" onClick={() => simulateTikTokEvent('like', { user: 'test_user', count: 1, lane: laneId })} disabled={!isConnected}>
                      👍 Simular Like
                    </button>
                    <select value={selectedGifts[laneId]} onChange={(e) => handleGiftChange(laneId, e.target.value)} disabled={!isConnected || giftsForLane.length === 0} className="admin-select-v2">
                      {giftsForLane.map(gift => (
                        <option key={gift.name} value={gift.name}>{gift.name}</option>
                      ))}
                    </select>
                    <button className="admin-button-v2 gift" onClick={() => simulateTikTokEvent('gift', { user: 'test_user', gift_name: selectedGifts[laneId], count: 1, lane: laneId })} disabled={!isConnected || !selectedGifts[laneId]}>
                      Probar Regalo
                    </button>
                  </div>
                  <div className="powerup-controls" style={{ marginTop: '10px' }}>
                    <input
                      type="number"
                      value={coinAmounts[laneId]}
                      onChange={(e) => handleCoinChange(laneId, e.target.value)}
                      className="admin-input-v2"
                      disabled={!isConnected}
                    />
                    <button className="admin-button-v2 coins" onClick={() => handleAddCoins(laneId)} disabled={!isConnected}>
                      💰 Enviar Monedas
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="admin-section-v2">
            <h3 className="section-title">⚡ Pruebas de Power-Ups</h3>
            <div className="powerup-controls">
              <select value={powerUpLane} onChange={(e) => setPowerUpLane(parseInt(e.target.value, 10))} className="admin-select-v2">
                <option value={1}>Carril 1</option>
                <option value={2}>Carril 2</option>
                <option value={3}>Carril 3</option>
                <option value={4}>Carril 4</option>
              </select>
              <button className="admin-button-v2" onClick={() => simulateTikTokEvent('gift', { user: 'test_user', gift_name: 'Game Controller', count: 1, lane: powerUpLane })} disabled={!isConnected}>
                🏗️ Game Controller
              </button>
              <button className="admin-button-v2" onClick={() => simulateTikTokEvent('gift', { user: 'test_user', gift_name: 'Super GG', count: 1, lane: powerUpLane })} disabled={!isConnected}>
                🧊 Super GG
              </button>
            </div>
          </div>

          <div className="admin-section-v2">
            <h3 className="section-title">📢 Pruebas de Comandos</h3>
            <div className="powerup-controls">
              <input
                type="text"
                value={teamCommand}
                onChange={(e) => setTeamCommand(e.target.value)}
                className="admin-input-v2"
                style={{ flexGrow: 2 }}
                disabled={!isConnected}
              />
              <button className="admin-button-v2" onClick={handleTeamCommand} disabled={!isConnected}>
                Enviar Comando
              </button>
            </div>
          </div>
          <div className="admin-section-v2">
            <h3 className="section-title">🎯 Control de Presala</h3>
            <div className="powerup-controls">
              <button className="admin-button-v2" onClick={() => socketRef.current?.emit('startPresala')} disabled={!isConnected}>
                🚀 Iniciar Presala
              </button>
              <button className="admin-button-v2" onClick={() => socketRef.current?.emit('stopPresala')} disabled={!isConnected}>
                🛑 Detener Presala
              </button>
              <button className="admin-button-v2" onClick={() => socketRef.current?.emit('resetPresala')} disabled={!isConnected}>
                🔄 Reset Presala
              </button>
            </div>
            <div className="text-center mt-3">
              <p className="text-sm text-gray-300">
                🔗 <a href="/presala" className="game-link" target="_blank" rel="noopener noreferrer">
                  Ver Pantalla de Presala
                </a>
              </p>
            </div>
          </div>
        </div>
        
        <div className="admin-section-v2">
          <h3 className="section-title">📱 Simulación de TikTok en Presala</h3>
          <div className="powerup-section">
            <h4 className="powerup-title">Unirse a Equipo</h4>
            <div className="powerup-controls">
              <input
                type="text"
                placeholder="User ID"
                value={presalaUserId}
                onChange={(e) => setPresalaUserId(e.target.value)}
                className="admin-input-v2"
                disabled={!isConnected}
              />
              <select value={presalaTeam} onChange={(e) => setPresalaTeam(e.target.value)} className="admin-select-v2" disabled={!isConnected}>
                {ALLOWED_TEAMS.map(team => (
                  <option key={team} value={team}>{team.charAt(0).toUpperCase() + team.slice(1)}</option>
                ))}
              </select>
              <button className="admin-button-v2" onClick={handleJoinTeam} disabled={!isConnected || !presalaUserId || !presalaTeam}>
                Unirse
              </button>
            </div>
          </div>
          <div className="powerup-section">
            <h4 className="powerup-title">Simular Eventos</h4>
            <div className="powerup-controls">
              <button className="admin-button-v2 like" onClick={handleSendLike} disabled={!isConnected || !presalaUserId}>
                👍 Simular Like
              </button>
              <input
                type="number"
                value={presalaGiftAmount}
                onChange={(e) => setPresalaGiftAmount(parseInt(e.target.value, 10) || 1)}
                className="admin-input-v2"
                disabled={!isConnected}
              />
              <button className="admin-button-v2 gift" onClick={handleSendGift} disabled={!isConnected || !presalaUserId || presalaGiftAmount <= 0}>
                🎁 Enviar Regalo (Monedas)
              </button>
            </div>
          </div>
        </div>

        {gameState.globalGameOver && (
          <div className="winner-panel" style={{ gridColumn: 'span 2' }}>
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
        
        <div className="admin-footer" style={{ gridColumn: 'span 2' }}>
          <p>🔗 <a href="/game" className="game-link" target="_blank" rel="noopener noreferrer">
            Ver Pantalla de Juego
          </a></p>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;