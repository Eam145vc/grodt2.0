import React from 'react';

// --- PARA EL DISEÑADOR DE IA ---
// Este componente, GameUI, es responsable de renderizar toda la interfaz de usuario (UI)
// que se superpone al canvas del juego. Recibe el `gameState` completo como una propiedad.
// El objetivo es mejorar visualmente la barra de energía vertical.

const GameUI = ({ gameState }) => {
  if (!gameState || !gameState.lanes) {
    return null;
  }

  // Esta función determina qué clase de CSS se aplica a la barra de energía
  // basándose en el nivel de energía actual.
  // El LLM de diseño puede añadir nuevas clases aquí para diferentes efectos.
  const getEnergyColor = (energy) => {
    if (energy === 1000) return 'rainbow-energy'; // Nivel máximo
    if (energy > 600) return 'bg-yellow-500'; // Nivel 3
    if (energy > 300) return 'bg-blue-500'; // Nivel 2
    return 'bg-gray-500'; // Nivel 1 (base)
  };

  return (
    // Contenedor principal que abarca toda el área del juego.
    <div className="game-ui-container">
      {gameState.lanes.map((lane, index) => (
        // Contenedor para cada carril individual.
        <div key={lane.id} className="lane-ui-lane">
          
          {/* --- BARRA DE ENERGÍA VERTICAL (OBJETIVO DE MEJORA) --- */}
          {/* Este es el elemento principal a mejorar. Es un contenedor que ocupa todo el carril
               y contiene la barra de energía que crece verticalmente. */}
          <div className="vertical-energy-bar-container">
            <div
              className={`vertical-energy-bar-fill ${getEnergyColor(lane.energy)}`}
              // La altura se calcula dinámicamente basada en la energía del carril (0 a 1000).
              style={{ height: `${(lane.energy / 1000) * 100}%` }}
            ></div>
          </div>

          {/* --- BLOQUE DE INFORMACIÓN INFERIOR --- */}
          {/* Este bloque contiene la barra de vida y la información de la oleada.
               Actualmente es funcional, pero el LLM de diseño puede proponer mejoras. */}
          <div className="info-block">
            <div className="health-bar-container">
              <div className="health-bar-fill" style={{ width: `${lane.baseHealth}%` }}></div>
              <span className="health-text">{lane.baseHealth}/100</span>
            </div>
            <div className="wave-info-text">
              <span>Oleada: {gameState.waveSystem.currentWave}</span>
              <span>Tiempo: {gameState.waveSystem.timeRemaining}s</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GameUI;