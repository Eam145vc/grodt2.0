import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const useSocket = (serverUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000') => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState({
    baseHealth: 100,
    lanes: [
      { id: 1, enemies: [], bullets: [] },
      { id: 2, enemies: [], bullets: [] },
      { id: 3, enemies: [], bullets: [] },
      { id: 4, enemies: [], bullets: [] }
    ],
    isGameOver: false,
    score: 0
  });

  useEffect(() => {
    // Conectar al servidor
    socketRef.current = io(serverUrl);
    
    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('Conectado al servidor');
    });
    
    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('Desconectado del servidor');
    });
    
    socketRef.current.on('gameState', (newGameState) => {
      setGameState(newGameState);
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [serverUrl]);

  const spawnEnemy = (laneId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('spawnEnemy', laneId);
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

  const resetGame = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('resetGame');
    }
  };

  return {
    gameState,
    isConnected,
    spawnEnemy,
    shootBullet,
    shootAllBullets,
    resetGame
  };
};

export default useSocket;