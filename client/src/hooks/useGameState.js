import { useState, useCallback } from 'react';

const useGameState = (initialState) => {
  const [gameState, setGameState] = useState(initialState);

  const updateGameState = useCallback((newState) => {
    setGameState(newState);
  }, []);

  const updateLane = useCallback((laneId, updates) => {
    setGameState(prevState => ({
      ...prevState,
      lanes: prevState.lanes.map(lane => 
        lane.id === laneId ? { ...lane, ...updates } : lane
      )
    }));
  }, []);

  const addEnemy = useCallback((laneId, enemy) => {
    setGameState(prevState => ({
      ...prevState,
      lanes: prevState.lanes.map(lane => 
        lane.id === laneId 
          ? { ...lane, enemies: [...lane.enemies, enemy] }
          : lane
      )
    }));
  }, []);

  const addBullet = useCallback((laneId, bullet) => {
    setGameState(prevState => ({
      ...prevState,
      lanes: prevState.lanes.map(lane => 
        lane.id === laneId 
          ? { ...lane, bullets: [...lane.bullets, bullet] }
          : lane
      )
    }));
  }, []);

  const updateBaseHealth = useCallback((newHealth) => {
    setGameState(prevState => ({
      ...prevState,
      baseHealth: newHealth,
      isGameOver: newHealth <= 0
    }));
  }, []);

  const updateScore = useCallback((newScore) => {
    setGameState(prevState => ({
      ...prevState,
      score: newScore
    }));
  }, []);

  return {
    gameState,
    updateGameState,
    updateLane,
    addEnemy,
    addBullet,
    updateBaseHealth,
    updateScore
  };
};

export default useGameState;