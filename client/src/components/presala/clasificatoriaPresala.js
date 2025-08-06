"use client"

import { useReducer, useEffect, useRef, useMemo } from "react"
import io from "socket.io-client"

// Países de Latinoamérica
const allCountries = [
  { id: 1, name: "Mexico", code: "mx" },
  { id: 2, name: "Colombia", code: "co" },
  { id: 3, name: "Argentina", code: "ar" },
  { id: 4, name: "Brasil", code: "br" },
  { id: 5, name: "Peru", code: "pe" },
  { id: 6, name: "Chile", code: "cl" },
  { id: 7, name: "Venezuela", code: "ve" },
  { id: 8, name: "Ecuador", code: "ec" },
  { id: 9, name: "Uruguay", code: "uy" },
  { id: 10, name: "Paraguay", code: "py" },
  { id: 11, name: "Bolivia", code: "bo" },
  { id: 12, name: "Guatemala", code: "gt" },
  { id: 13, name: "Honduras", code: "hn" },
  { id: 14, name: "Nicaragua", code: "ni" },
  { id: 15, name: "Costa Rica", code: "cr" },
  { id: 16, name: "Panama", code: "pa" },
  { id: 17, name: "El Salvador", code: "sv" },
  { id: 18, name: "Cuba", code: "cu" },
  { id: 19, name: "Republica Dominicana", code: "do" },
  { id: 20, name: "Puerto Rico", code: "pr" },
  { id: 21, name: "Espana", code: "es" },
];

const mainCountries = ["Mexico", "Colombia", "Argentina", "Peru", "Chile", "Venezuela"];

const initialState = {
  activeTeams: mainCountries.slice(0, 4).map(name => {
    const countryInfo = allCountries.find(c => c.name === name);
    return { id: name, name: countryInfo.name, code: countryInfo.code, points: 0 };
  }),
  waitingTeams: mainCountries.slice(4).map(name => {
    const countryInfo = allCountries.find(c => c.name === name);
    return { id: name, name: countryInfo.name, code: countryInfo.code, points: 0 };
  }),
  timeLeft: 180,
  isActive: false,
  classifiedPlayers: [],
  gamePhase: "waiting",
  isConnected: false,
  energyBalls: [],
  pendingEnergyBalls: {},
  lastInteraction: {},
}

const presalaReducer = (state, action) => {
  switch (action.type) {
    case "CONNECTION_STATUS":
      return { ...state, isConnected: action.payload }
    case "UPDATE_STATE": {
      const { activeTeams, waitingTeams, timeLeft, isActive, targetPoints } = action.payload
      const newState = { ...state }

      if (targetPoints !== undefined) newState.targetPoints = targetPoints;
      if (timeLeft !== undefined) newState.timeLeft = timeLeft
      if (isActive !== undefined) newState.isActive = isActive
      if (activeTeams !== undefined) newState.activeTeams = activeTeams;
      if (waitingTeams !== undefined) newState.waitingTeams = waitingTeams;

      if (isActive && state.gamePhase === "waiting") newState.gamePhase = "active"
      if (!isActive && state.gamePhase === "active") newState.gamePhase = "waiting"
      if (isActive && timeLeft > 0 && timeLeft <= 10) newState.gamePhase = "ending"

      const classifiedIds = new Set(state.classifiedPlayers)
      let classifiedUpdated = false

      newState.activeTeams.forEach((country) => {
        if (country.points >= (newState.targetPoints || 1000) && !classifiedIds.has(country.id)) {
          classifiedIds.add(country.id)
          classifiedUpdated = true
        }
      })

      if (classifiedUpdated) {
        newState.classifiedPlayers = Array.from(classifiedIds)
      }

      return newState
    }
    case "START":
      return {
        ...state,
        isActive: true,
        gamePhase: "active",
        classifiedPlayers: [],
      }
    case "END":
      return {
        ...state,
        isActive: false,
        gamePhase: "finished",
        classifiedPlayers: action.payload.classifiedPlayers.map((p) => p.name) || [],
      }
    case "RESET":
      return {
        ...initialState
      }
    case "ADD_ENERGY_BALL":
      return {
        ...state,
        energyBalls: [...state.energyBalls, action.payload],
      }
    case "REMOVE_ENERGY_BALL":
      return {
        ...state,
        energyBalls: state.energyBalls.filter((ball) => ball.id !== action.payload.id),
      }
    case "UPDATE_LAST_INTERACTION":
      return {
        ...state,
        lastInteraction: {
          ...state.lastInteraction,
          [action.payload.teamId]: Date.now(),
        },
      }
    default:
      return state
  }
}


const anthemFileMap = {
  argentina: 'argentina.mp3',
  bolivia: 'bolivia.mp3',
  chile: 'chile.mp3',
  colombia: 'colombia.mp3',
  costarica: 'costarica.mp3',
  cuba: 'cuba.mp3',
  elsalvador: 'elsalvador.mp3',
  guatemala: 'guatemala.mp3',
  honduras: 'honduras.mp3',
  mexico: 'mexico.mp3',
  nicaragua: 'nicaragua.mp3',
  panama: 'panama.mp3',
  paraguay: 'paraguay.mp3',
  peru: 'peru.mp3',
  puertorico: 'puertorico.mp3',
  republicadominicana: 'republicadominicana.mp3',
  uruguay: 'uruguay.mp3',
  venezuela: 'venezuela.mp3',
  ecuador: 'ecuador.mp3',
  espana: 'espana.mp3',
  brasil: 'brasil.mp3',
};

const ClasificatoriasPresala = () => {
  const audioRef = useRef(null);
  const socketRef = useRef(null);
  const contextRef = useRef(null);
  const gainNodeRef = useRef(null);
  
  useEffect(() => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const context = new AudioCtx();
    contextRef.current = context;
    const gainNode = context.createGain();
    gainNodeRef.current = gainNode;
    gainNode.connect(context.destination);
  }, []);
  const [state, dispatch] = useReducer(presalaReducer, initialState)
  const { timeLeft, classifiedPlayers, gamePhase, energyBalls, activeTeams, waitingTeams } = state
  const presalaContainerRef = useRef(null)


  useEffect(() => {
    const socket = io("http://localhost:5000")
    socketRef.current = socket

    const onConnect = () => dispatch({ type: "CONNECTION_STATUS", payload: true })
    const onDisconnect = () => dispatch({ type: "CONNECTION_STATUS", payload: false })
    const onPresalaState = (data) => dispatch({ type: "UPDATE_STATE", payload: data })
    const onPresalaStarted = () => dispatch({ type: "START" })
    const onPresalaEnded = (results) => dispatch({ type: "END", payload: results })
    const onPresalaReset = () => dispatch({ type: "RESET" })
    const onPresalaInteraction = (data) => {
      if (data && data.teamId) {
        dispatch({ type: "UPDATE_LAST_INTERACTION", payload: { teamId: data.teamId } });
        const ballCount = data.ballCount || 1;
        // Calcular un retardo dinámico: más rápido para ráfagas grandes
        const delay = Math.max(10, 200 - ballCount);

        for (let i = 0; i < ballCount; i++) {
          setTimeout(() => {
            const newBall = {
              id: `ball-${Date.now()}-${Math.random()}-${i}`,
              teamId: data.teamId,
              avatarBase64: data.avatarBase64,
              interactionValue: data.interactionValue,
            };
            dispatch({ type: "ADD_ENERGY_BALL", payload: newBall });
          }, i * delay);
        }
      }
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("presalaState", onPresalaState)
    socket.on("presalaStarted", onPresalaStarted)
    socket.on("presalaEnded", onPresalaEnded)
    socket.on("presalaReset", onPresalaReset)
    socket.on("presalaInteraction", onPresalaInteraction)
    
    const stopCurrentAudio = () => {
      if (audioRef.current) {
        console.log('[Presala] Deteniendo audio por evento del servidor.');
        audioRef.current.pause();
        audioRef.current = null;
      }
    };

    // Listener para cambio de líder
    const onNewLeader = (data) => {
      console.log('[Presala] Evento newPresalaLeader recibido:', data);

      if (!data || !data.teamName) {
        console.error('[Presala] El evento newPresalaLeader no contiene teamName.');
        return;
      }

      const { teamName } = data;
      console.log(`[Presala] Nuevo líder detectado: ${teamName}`);

      const key = teamName.toLowerCase().replace(/\s+/g, '');
      console.log(`[Presala] Clave generada para el mapa: '${key}'`);

      const filename = anthemFileMap[key];
      if (!filename) {
        console.warn(`[Presala] No se encontró un himno para la clave '${key}' (equipo: ${teamName}).`);
        return;
      }
      console.log(`[Presala] Archivo de himno encontrado: ${filename}`);

      stopCurrentAudio();

      console.log(`[Presala] Creando nuevo elemento de audio para: /himnos_latam/himnos/${filename}`);
      const audio = new Audio(`/himnos_latam/himnos/${filename}`);
      audio.crossOrigin = 'anonymous';
      audio.preload = 'metadata';
      audio.loop = true;

      const fadeDuration = 3000;
      const fadeSteps = 30;
      const stepTime = fadeDuration / fadeSteps;

      audio.addEventListener('loadedmetadata', () => {
        console.log(`[Presala] Metadatos cargados para ${filename}. Duración: ${audio.duration}`);
        const startOffset = filename === 'venezuela.mp3' ? 10 : 5;
        if (audio.duration > startOffset) {
          audio.currentTime = startOffset;
        }
        audio.volume = 0;
        console.log('[Presala] Reproduciendo audio con fundido...');
        audio.play().catch(err => {
          console.error('[Presala] Error al intentar reproducir el himno:', err);
        });

        let currentStep = 0;
        const fadeInterval = setInterval(() => {
          currentStep++;
          const newVolume = Math.min(1, currentStep / fadeSteps);
          audio.volume = newVolume;
          if (currentStep >= fadeSteps) {
            clearInterval(fadeInterval);
            console.log('[Presala] Fundido de entrada completado.');
          }
        }, stepTime);
      });

      audio.addEventListener('error', (e) => {
        console.error(`[Presala] Error al cargar el archivo de audio: ${filename}`, e);
      });

      audio.load();
      audioRef.current = audio;
    };
    socket.on("newPresalaLeader", onNewLeader);
    socket.on("stopAudio", stopCurrentAudio);

    return () => {
      console.log("🧹 Limpiando conexión...")
      socket.off("newPresalaLeader", onNewLeader);
      socket.off("stopAudio", stopCurrentAudio);
      socket.disconnect()
    }
  }, [])

  useEffect(() => {
    const updateScale = () => {
      if (presalaContainerRef.current) {
        const { clientWidth: viewportWidth, clientHeight: viewportHeight } = document.documentElement
        const nativeWidth = 400
        const nativeHeight = 800

        const scaleX = viewportWidth / nativeWidth
        const scaleY = viewportHeight / nativeHeight
        const scale = Math.min(scaleX, scaleY)

        presalaContainerRef.current.style.transform = `scale(${scale})`
        presalaContainerRef.current.style.left = `${(viewportWidth - nativeWidth * scale) / 2}px`
        presalaContainerRef.current.style.top = `${(viewportHeight - nativeHeight * scale) / 2}px`
      }
    }

    window.addEventListener("resize", updateScale)
    updateScale()

    return () => window.removeEventListener("resize", updateScale)
  }, [])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const calculateBallSize = (value) => {
    const baseLikeSize = 30; // Tamaño 5/10 para likes

    if (value <= 1) {
      return baseLikeSize;
    }

    // Escala lineal simple para regalos
    const minGiftSize = 35; // Tamaño 6/10 para regalos de 1 moneda
    const maxGiftSize = 60; // Tamaño 10/10 para regalos de 1000 monedas
    const maxGiftValue = 1000;

    // Calcular la proporción del valor del regalo dentro del rango
    const scale = Math.min(value, maxGiftValue) / maxGiftValue;
    
    // Aplicar la escala lineal
    const size = minGiftSize + (maxGiftSize - minGiftSize) * scale;
    
    return size;
  };

  const visibleCountries = useMemo(() => {
    return activeTeams.map((country, index) => ({
      ...country,
      code: allCountries.find(c => c.name.toLowerCase() === country.name.toLowerCase())?.code || 'xx',
      trackPosition: index,
      progress: Math.min(100, (country.points / (state.targetPoints || 1000)) * 100),
    }))
  }, [activeTeams, state.targetPoints])
  // Mapa de posiciones de todos los países
  const rankMap = useMemo(() => {
    return [...activeTeams, ...waitingTeams]
      .sort((a, b) => b.points - a.points)
      .reduce((acc, c, idx) => {
        acc[c.id] = idx + 1;
        return acc;
      }, {});
  }, [activeTeams, waitingTeams]);

  return (
    <div
      ref={presalaContainerRef}
      style={{
        position: "absolute",
        width: "400px",
        height: "800px",
        background: "linear-gradient(180deg, #0a0a1a 0%, #1a1a3a 30%, #2a1a4a 70%, #3a2a5a 100%)",
        color: "white",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        overflow: "visible",
        transformOrigin: "top left",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 0 50px rgba(138, 43, 226, 0.3)",
      }}
    >
      {/* Animated Cosmic Background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(3px 3px at 30px 40px, #ffffff, transparent),
            radial-gradient(2px 2px at 80px 20px, rgba(138, 43, 226, 0.8), transparent),
            radial-gradient(1px 1px at 150px 60px, #00d4ff, transparent),
            radial-gradient(2px 2px at 200px 100px, rgba(255, 20, 147, 0.6), transparent),
            radial-gradient(1px 1px at 320px 80px, #ffffff, transparent),
            radial-gradient(3px 3px at 100px 150px, rgba(0, 255, 127, 0.4), transparent),
            radial-gradient(2px 2px at 250px 200px, #ffd700, transparent)
          `,
          backgroundRepeat: "repeat",
          backgroundSize: "350px 200px",
          animation: "cosmicDrift 12s linear infinite",
        }}
      />

      {/* Nebula Effects */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(138, 43, 226, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 70%, rgba(0, 191, 255, 0.12) 0%, transparent 60%),
            radial-gradient(ellipse at 50% 90%, rgba(255, 20, 147, 0.08) 0%, transparent 50%)
          `,
          animation: "nebulaFlow 20s ease-in-out infinite alternate",
        }}
      />

      {/* Section 1: Titles (20%) */}
      <div style={{ flex: '0 0 20%', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 10px 10px 10px', boxSizing: 'border-box' }}>
        {/* Banners container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center' }}>
          {/* Banner himno */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              padding: "6px 10px",
              background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white",
              textShadow: "0 1px 3px rgba(0,0,0,0.5)",
              fontSize: "8px",
              width: "fit-content"
            }}
          >
            <span style={{ fontWeight: "bold", fontSize: "14px", color: "#ffffff", textAlign: "center" }}>HAZ QUE SUENE EL HIMNO DE TU PAIS</span>
            <span style={{ fontWeight: "bold", fontSize: "10px", color: "#ffed4e", textAlign: "center" }}>ESCRIBE TU PAÍS EN EL CHAT PARA UNIRTE</span>
          </div>
          {/* Combined Banners */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Gift Multiplier Info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "6px 10px",
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "white",
                textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                fontSize: "12px",
                width: "fit-content"
              }}
            >
              <img src="/giftbox.png" alt="Regalo" style={{ width: "28px", height: "28px" }} />
              <span style={{ fontWeight: 'bold', color: '#ffed4e', fontSize: '14px' }}>X5</span>
              <span style={{ fontSize: '10px', fontWeight: 'bold', maxWidth: '120px', textAlign: 'center', lineHeight: '1.2' }}>cuentan x5 para APOYAR a tu PAÍS</span>
            </div>
            {/* Banner Tap Tap */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "6px 10px",
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "white",
                textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                fontSize: "12px",
                width: "fit-content"
              }}
            >
              <img src="/heart.png" alt="Corazón" style={{ width: "20px", height: "20px" }} />
              <span style={{ fontWeight: "bold", color: "#ffed4e" }}>X1</span>
              <span style={{ fontSize: '10px', fontWeight: 'bold', maxWidth: '120px', textAlign: 'center', lineHeight: '1.2' }}>TAP TAP cuentan x1 para APOYAR a tu PAÍS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Tracks (50%) */}
      <div style={{ flex: '0 0 20%', position: 'relative', padding: '0 5px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        {/* Waiting Banner */}
        {gamePhase === "waiting" && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 20,
              background: "linear-gradient(135deg, #8a2be2, #00d4ff)",
              color: "white",
              padding: "12px 24px",
              borderRadius: "30px",
              fontSize: "14px",
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: "2px",
              boxShadow: "0 8px 25px rgba(138, 43, 226, 0.4)",
              animation: "waitingPulse 2s ease-in-out infinite",
            }}
          >
            ⏳ ESPERANDO LANZAMIENTO
          </div>
        )}

        {/* Race Tracks */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            width: "100%",
            position: "relative",
            paddingRight: "20px", // Space for finish line
          }}
        >
          {/* Finish Line */}
          <div
            style={{
              position: "absolute",
              top: "0",
              right: "0px",
              bottom: "0",
              width: "8px",
              background: "linear-gradient(180deg, #ffd700, #ffed4e, #ffd700)",
              borderRadius: "4px",
              boxShadow: "0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4)",
              zIndex: 10,
              animation: "finishLineIntense 1.5s ease-in-out infinite alternate",
              border: "2px solid rgba(255, 255, 255, 0.3)",
            }}
          />

          {/* Active Lanes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {visibleCountries.map((country, index) => {
              const isQualified = classifiedPlayers.includes(country.id)
              const isLeading = index === 0 && country.points > 0

              return (
                <div
                  key={country.id}
                  style={{
                    height: "60px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: isQualified
                        ? "linear-gradient(90deg, rgba(46, 213, 115, 0.25) 0%, rgba(39, 174, 96, 0.15) 50%, rgba(46, 213, 115, 0.05) 100%)"
                        : "linear-gradient(90deg, rgba(255, 255, 255, 0.12) 0%, rgba(138, 43, 226, 0.08) 50%, rgba(0, 212, 255, 0.05) 100%)",
                      borderRadius: "30px",
                      border: isQualified ? "2px solid rgba(46, 213, 115, 0.6)" : "2px solid rgba(138, 43, 226, 0.3)",
                      boxShadow: isQualified
                        ? "0 0 30px rgba(46, 213, 115, 0.4), inset 0 0 20px rgba(46, 213, 115, 0.1)"
                        : "0 8px 25px rgba(0, 0, 0, 0.2), inset 0 0 20px rgba(138, 43, 226, 0.1)",
                      transform: isLeading ? "scale(1.03)" : "scale(1)",
                      zIndex: 11,
                      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    {/* Enhanced Track Grid */}
                    <div
                      style={{
                        position: "absolute",
                        left: "0",
                        top: "50%",
                        transform: "translateY(-50%)",
                        height: "3px",
                        width: "calc(100% + 40px)",
                        background: isQualified
                          ? "repeating-linear-gradient(to right, rgba(46, 213, 115, 0.6) 0px, rgba(46, 213, 115, 0.6) 20px, transparent 20px, transparent 40px)"
                          : "repeating-linear-gradient(to right, rgba(138, 43, 226, 0.4) 0px, rgba(138, 43, 226, 0.4) 20px, transparent 20px, transparent 40px)",
                        animation: "enhancedGridMove 1.5s linear infinite",
                      }}
                    />

                    {/* Rocket Container */}
                    <div
                      style={{
                        position: "absolute",
                        left: `${country.progress}%`,
                        top: "50%",
                        transform: country.progress === 0 ? "translate(0, -50%)" : "translate(-50%, -50%)",
                        transition: "left 1s cubic-bezier(0.4, 0, 0.2, 1)",
                        animation:
                          gamePhase === "active" ? "enhancedRocketThrust 0.6s ease-in-out infinite alternate" : "none",
                        height: "100%",
                        zIndex: 12,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        filter: isLeading
                          ? "drop-shadow(0 0 15px rgba(255, 215, 0, 0.8))"
                          : "drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))",
                      }}
                    >
                      {/* Rocket Image */}
                      <img
                        src="/cohete.png"
                        alt="Cohete"
                        style={{
                          height: "100%",
                          width: "auto",
                          transform: "rotate(90deg)",
                          filter: "brightness(1.2) contrast(1.1) drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))",
                        }}
                      />

                      {/* Country Flag */}
                      <img
                        src={`https://flagpedia.net/data/flags/w80/${country.code}.png`}
                        alt={country.name}
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          width: "28px",
                          height: "18px",
                          borderRadius: "4px",
                          border: "2px solid rgba(255, 255, 255, 0.8)",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />

                      {/* Enhanced Thrust Effect */}
                      {gamePhase === "active" && country.progress > 0 && (
                        <>
                          <div
                            style={{
                              position: "absolute",
                              left: "-20px",
                              top: "50%",
                              transform: "translateY(-50%) rotate(-90deg)",
                              fontSize: "20px",
                              animation: "enhancedThrustFlicker 0.2s ease-in-out infinite alternate",
                            }}
                          >
                            🔥
                          </div>
                        </>
                      )}
                    </div>


                    {/* Medal Position */}
                    <div style={{
                      position: "absolute",
                      right: "-20px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "30px",
                      zIndex: 12,
                    }}>
                      {rankMap[country.id] === 1 ? "🥇" : rankMap[country.id] === 2 ? "🥈" : rankMap[country.id] === 3 ? "🥉" : rankMap[country.id] === 4 ? "4to" : `${rankMap[country.id]}th`}
                    </div>

                    {/* Enhanced Progress Indicator */}
                    <div
                      style={{
                        position: "absolute",
                        right: "15px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "12px",
                        fontWeight: "800",
                        color: isQualified ? "#2ed573" : "#00d4ff",
                        background: "linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(138, 43, 226, 0.3))",
                        padding: "6px 12px",
                        borderRadius: "15px",
                        border: `2px solid ${isQualified ? "#2ed573" : "#00d4ff"}60`,
                        boxShadow: `0 0 15px ${isQualified ? "#2ed573" : "#00d4ff"}40`,
                        letterSpacing: "0.5px",
                      }}
                    >
                      {Math.round(country.progress)}%
                    </div>

                    {/* Enhanced Qualification Effects */}
                    {isQualified && (
                      <>
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background:
                              "linear-gradient(90deg, rgba(46, 213, 115, 0.4) 0%, rgba(46, 213, 115, 0.1) 50%, transparent 100%)",
                            borderRadius: "30px",
                            animation: "qualifiedIntense 1.5s ease-in-out infinite",
                            pointerEvents: "none",
                          }}
                        />

                        <div
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            fontSize: "24px",
                            animation: "celebrationSpin 2s ease-in-out infinite",
                            textShadow: "0 0 15px rgba(46, 213, 115, 0.8)",
                          }}
                        >
                          ✨
                        </div>
                      </>
                    )}

                    {/* Enhanced Leader Crown */}
                    {isLeading && (
                      <div
                        style={{
                          position: "absolute",
                          top: "-15px",
                          left: "50%",
                          transform: "translateX(-50%)",
                          fontSize: "20px",
                          animation: "crownMajestic 2s ease-in-out infinite alternate",
                          filter: "drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))",
                        }}
                      >
                        👑
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Enhanced Energy Balls */}
        {energyBalls.map((ball) => {
          const country = visibleCountries.find((c) => c.id === ball.teamId)
          if (!country) return null

          const trackIndex = country.trackPosition
          const trackHeight = 60 + 10 // height + gap
          const topPosition = trackIndex * trackHeight + trackHeight / 2

          const rocketProgress = Math.min(100, (country.points / 1000) * 100)
          const targetLeft = 15 + 0.85 * rocketProgress
          const ballSize = calculateBallSize(ball.interactionValue);

          return (
            <div
              key={ball.id}
              style={{
                position: "absolute",
                left: "0%",
                top: `${topPosition}px`,
                transform: "translateY(-50%)",
                width: `${ballSize}px`,
                height: `${ballSize}px`,
                borderRadius: "50%",
                backgroundImage: ball.avatarBase64 ? `url(${ball.avatarBase64})` : "radial-gradient(circle, #ffde59, #ff914d)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                boxShadow: "0 0 10px #ffde59, 0 0 20px #ff914d",
                zIndex: 15,
                animation: `energyBallRise ${
                  1 + Math.random() * 0.5
                }s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                "--target-left": `${targetLeft}%`,
              }}
              onAnimationEnd={() => {
                dispatch({ type: "REMOVE_ENERGY_BALL", payload: { id: ball.id } })
              }}
            />
          )
        })}
      </div>

      {/* Section 3: Bottom Area (30%) */}
      <div style={{ flex: '0 0 30%', position: 'relative', display: 'flex', padding: '0 10px 10px', boxSizing: 'border-box', gap: '10px' }}>
        {/* Waiting Teams Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ textAlign: 'center', color: '#aaa', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px', marginBottom: '5px', padding: '2px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
            EQUIPOS SIN CLASIFICAR
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '5px', padding: '0 5px', overflowY: 'auto' }}>
            {waitingTeams.map((country) => {
              const countryInfo = allCountries.find(c => c.name.toLowerCase() === country.name.toLowerCase());
              const lastInteractionTime = state.lastInteraction[country.id];
              const isActive = lastInteractionTime && (Date.now() - lastInteractionTime < 5000);

              const style = {
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.2)',
                padding: '4px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease',
                gap: '5px'
              };

              if (isActive) {
                style.animation = `teamGlow 1.5s infinite, teamPulse 1.5s infinite`;
              }
              
              return (
                <div key={country.id} style={style}>
                  <span style={{ marginRight: '4px', fontSize: '10px', fontWeight: '700' }}>
                    {rankMap[country.id] === 1 ? '🥇' : rankMap[country.id] === 2 ? '🥈' : rankMap[country.id] === 3 ? '🥉' : rankMap[country.id] === 4 ? '4th' : `${rankMap[country.id]}th`}
                  </span>
                  <img
                    src={`https://flagpedia.net/data/flags/w80/${countryInfo?.code || 'xx'}.png`}
                    alt={country.name}
                    style={{ width: '24px', height: '16px', borderRadius: '3px', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = "none" }}
                  />
                  <span style={{ color: 'white', fontWeight: '500', fontSize: '10px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {country.name}
                  </span>
                  <span style={{ color: '#ffed4e', fontWeight: 'bold', fontSize: '10px' }}>
                    {Math.round(country.points)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Webcam and Stats Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Webcam Placeholder */}
          <div style={{ width: '120px', height: '180px', border: '2px dashed rgba(255,255,255,0.3)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)' }}></div>
          
          {/* Stats */}
          <div style={{ display: "flex", flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '6px' }}>
              <span style={{ fontSize: "14px", fontWeight: "900", color: "#00d4ff" }}>{formatTime(timeLeft)}</span>
              <span style={{ fontSize: "8px", color: "#ffffff", letterSpacing: "1px" }}>TIEMPO</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '6px' }}>
              <span style={{ fontSize: "14px", fontWeight: "900", color: "#2ed573" }}>{classifiedPlayers.length}/4</span>
              <span style={{ fontSize: "8px", color: "#ffffff", letterSpacing: "1px" }}>CLASIFICADOS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced CSS Animations */}
      <style jsx>{`
        @keyframes cosmicDrift {
          from { transform: translateY(0px) rotate(0deg); }
          to { transform: translateY(-200px) rotate(360deg); }
        }
        
        @keyframes nebulaFlow {
          0% { transform: scale(1) rotate(0deg); opacity: 0.8; }
          100% { transform: scale(1.2) rotate(5deg); opacity: 1; }
        }
        
        @keyframes holographicScan {
          0% { left: -100%; opacity: 0; }
          50% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        
        @keyframes borderGlow {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }
        
        @keyframes waitingPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.9; }
          50% { transform: translate(-50%, -50%) scale(1.05); opacity: 1; }
        }
        
        @keyframes leaderGlow {
          0% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.6), 0 4px 15px rgba(0, 0, 0, 0.3); }
          100% { box-shadow: 0 0 35px rgba(255, 215, 0, 1), 0 0 50px rgba(255, 215, 0, 0.4), 0 4px 15px rgba(0, 0, 0, 0.3); }
        }
        
        @keyframes finishLineIntense {
          0% { 
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4);
            transform: scaleY(1);
          }
          100% { 
            box-shadow: 0 0 50px rgba(255, 215, 0, 1), 0 0 100px rgba(255, 215, 0, 0.6);
            transform: scaleY(1.1);
          }
        }
        
        @keyframes enhancedGridMove {
          from { transform: translateY(-50%) translateX(0px); }
          to { transform: translateY(-50%) translateX(-40px); }
        }
        
        @keyframes enhancedRocketThrust {
          0% { transform: translate(-50%, -50%) translateY(0px); }
          100% { transform: translate(-50%, -50%) translateY(-4px); }
        }
        
        @keyframes enhancedThrustFlicker {
          0% { opacity: 0.7; transform: translateY(-50%) rotate(-90deg) scale(1); }
          100% { opacity: 1; transform: translateY(-50%) rotate(-90deg) scale(1.3); }
        }
        
        
        @keyframes qualifiedIntense {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        
        @keyframes celebrationSpin {
          0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
          50% { transform: translate(-50%, -50%) scale(1.4) rotate(180deg); }
          100% { transform: translate(-50%, -50%) scale(1) rotate(360deg); }
        }
        
        @keyframes crownMajestic {
          0% {
            filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.8));
            transform: translateX(-50%) rotate(-5deg) scale(1);
          }
          100% {
            filter: drop-shadow(0 0 25px rgba(255, 215, 0, 1)) drop-shadow(0 0 40px rgba(255, 215, 0, 0.6));
            transform: translateX(-50%) rotate(5deg) scale(1.1);
          }
        }

        @keyframes energyBallRise {
          from {
            left: 0%;
            opacity: 1;
          }
          to {
            left: var(--target-left);
            opacity: 0;
          }
        }

        @keyframes teamGlow {
          0%, 100% {
            box-shadow: 0 0 8px rgba(0, 212, 255, 0.5), 0 0 12px rgba(138, 43, 226, 0.4);
            border-color: rgba(0, 212, 255, 0.7);
          }
          50% {
            box-shadow: 0 0 16px rgba(0, 212, 255, 0.8), 0 0 24px rgba(138, 43, 226, 0.6);
            border-color: rgba(0, 212, 255, 1);
          }
        }

        @keyframes teamPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  )
}

export default ClasificatoriasPresala
