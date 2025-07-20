"use client"

import { useReducer, useEffect, useRef } from "react"
import io from "socket.io-client"

// Mover allCountries fuera del componente para que sea una constante estable
const allCountries = [
  { id: 1, name: "México", code: "mx" },
  { id: 2, name: "Colombia", code: "co" },
  { id: 3, name: "Argentina", code: "ar" },
  { id: 4, name: "Brasil", code: "br" },
  { id: 5, name: "Perú", code: "pe" },
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
  { id: 16, name: "Panamá", code: "pa" },
  { id: 17, name: "El Salvador", code: "sv" },
  { id: 18, name: "Cuba", code: "cu" },
  { id: 19, name: "República Dominicana", code: "do" },
  { id: 20, name: "Puerto Rico", code: "pr" },
]

const initialState = {
  countries: [],
  timeLeft: 180,
  isActive: false,
  classifiedPlayers: [], // Array de IDs (teamName)
  gamePhase: "waiting",
  isConnected: false,
}

// Reducer para manejar toda la lógica de estado de forma centralizada
const presalaReducer = (state, action) => {
  switch (action.type) {
    case "CONNECTION_STATUS":
      return { ...state, isConnected: action.payload }
    case "UPDATE_STATE": {
      const { teams, timeLeft, isActive } = action.payload
      const newState = { ...state }

      if (timeLeft !== undefined) newState.timeLeft = timeLeft
      if (isActive !== undefined) newState.isActive = isActive

      if (isActive && state.gamePhase === "waiting") newState.gamePhase = "active"
      if (!isActive && state.gamePhase === "active") newState.gamePhase = "waiting"
      if (isActive && timeLeft > 0 && timeLeft <= 10) newState.gamePhase = "ending"
      
      if (!teams) return newState

      const activeTeams = Object.entries(teams)
        .filter(([_, teamData]) => teamData.points > 0 || teamData.members.length > 0)
        .map(([teamName, teamData]) => {
          const countryInfo = allCountries.find(
            (c) => c.name.toLowerCase() === teamName.toLowerCase()
          )
          return {
            id: teamName, // Usar teamName como ID estable
            name: countryInfo?.name || teamName,
            code: countryInfo?.code || "xx",
            points: teamData.points || 0,
          }
        })

      if (activeTeams.length === 0) {
        newState.countries = allCountries.slice(0, 6).map((country) => ({
          ...country,
          id: country.name,
          points: 0,
        }))
      } else {
        activeTeams.sort((a, b) => b.points - a.points)
        newState.countries = activeTeams
      }

      // Lógica de clasificación
      const targetPoints = 1000
      const classifiedIds = new Set(state.classifiedPlayers)
      let classifiedUpdated = false

      newState.countries.forEach(country => {
        if (country.points >= targetPoints && !classifiedIds.has(country.id)) {
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
        classifiedPlayers: action.payload.classifiedPlayers.map(p => p.name) || [],
      }
    case "RESET":
      return {
        ...initialState,
        countries: allCountries.slice(0, 6).map((country) => ({
          ...country,
          id: country.name,
          points: 0,
        })),
      }
    default:
      return state
  }
}

const ClasificatoriasPresala = () => {
  const socketRef = useRef(null)
  const [state, dispatch] = useReducer(presalaReducer, initialState)
  const { countries, timeLeft, isActive, classifiedPlayers, gamePhase, isConnected } = state

  useEffect(() => {
    dispatch({ type: "RESET" })

    const socket = io("http://localhost:5000")
    socketRef.current = socket

    const onConnect = () => dispatch({ type: "CONNECTION_STATUS", payload: true })
    const onDisconnect = () => dispatch({ type: "CONNECTION_STATUS", payload: false })
    const onPresalaState = (data) => dispatch({ type: "UPDATE_STATE", payload: data })
    const onPresalaStarted = () => dispatch({ type: "START" })
    const onPresalaEnded = (results) => dispatch({ type: "END", payload: results })
    const onPresalaReset = () => dispatch({ type: "RESET" })

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("presalaState", onPresalaState)
    socket.on("presalaStarted", onPresalaStarted)
    socket.on("presalaEnded", onPresalaEnded)
    socket.on("presalaReset", onPresalaReset)

    return () => {
      console.log("🧹 Limpiando conexión...")
      socket.disconnect()
    }
  }, [])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const visibleCountries = state.countries
    .map((country, index) => ({
      ...country,
      trackPosition: index,
      progress: Math.min(95, (country.points / 1000) * 100),
    }))
    .slice(0, 6)

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "400px",
        margin: "0 auto",
        background: "linear-gradient(180deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)",
        minHeight: "100vh",
        color: "white",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated Stars Background - FASTER */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
          radial-gradient(2px 2px at 20px 30px, #eee, transparent),
          radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
          radial-gradient(1px 1px at 90px 40px, #fff, transparent),
          radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.6), transparent),
          radial-gradient(2px 2px at 160px 30px, #ddd, transparent),
          radial-gradient(1px 1px at 200px 50px, rgba(255,255,255,0.7), transparent),
          radial-gradient(2px 2px at 250px 90px, #ccc, transparent)
        `,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 100px",
          animation: "starsMoveFast 8s linear infinite",
        }}
      />

      {/* Nebula Effect */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
          radial-gradient(circle at 30% 20%, rgba(138, 43, 226, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 70% 80%, rgba(0, 191, 255, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 20% 60%, rgba(255, 20, 147, 0.06) 0%, transparent 50%)
        `,
          animation: "nebulaDrift 15s ease-in-out infinite alternate",
        }}
      />

      {/* Header */}
      <div
        style={{
          background: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(15px)",
          padding: "20px",
          borderBottom: "2px solid rgba(255, 255, 255, 0.1)",
          position: "relative",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "15px",
          }}
        >
          <div
            style={{
              fontSize: "22px",
              fontWeight: "900",
              backgroundImage:
                gamePhase === "ending"
                  ? "linear-gradient(45deg, #ff6b6b, #ee5a24)"
                  : gamePhase === "finished"
                    ? "linear-gradient(45deg, #00d2d3, #54a0ff)"
                    : gamePhase === "active"
                      ? "linear-gradient(45deg, #feca57, #ff9ff3)"
                      : "linear-gradient(45deg, #5f27cd, #00d2d3)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "5px",
              textShadow: "0 0 30px rgba(255, 255, 255, 0.3)",
            }}
          >
            🚀{" "}
            {gamePhase === "finished"
              ? "MISIÓN COMPLETADA"
              : gamePhase === "ending"
                ? "CUENTA REGRESIVA"
                : gamePhase === "active"
                  ? "CARRERA ESPACIAL"
                  : "CLASIFICATORIAS ESPACIALES"}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "rgba(255, 255, 255, 0.6)",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            {gamePhase === "finished"
              ? "Preparándose para el juego principal..."
              : gamePhase === "waiting"
                ? "Esperando el inicio..."
                : "Presala Latinoamérica"}
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          {[
            {
              label: "TIEMPO",
              value: formatTime(timeLeft),
              color: gamePhase === "ending" ? "#ff6b6b" : "#4ecdc4",
              icon: "⏰",
            },
            {
              label: "CLASIFICADOS",
              value: `${classifiedPlayers.length}/4`,
              color: "#45b7d1",
              icon: "🏆",
            },
            {
              label: "PUNTOS",
              value: countries.reduce((sum, c) => sum + c.points, 0).toLocaleString(),
              color: "#f7b731",
              icon: "⭐",
            },
          ].map((stat, index) => (
            <div
              key={index}
              style={{
                flex: 1,
                background: "rgba(255, 255, 255, 0.05)",
                border: `1px solid ${stat.color}40`,
                borderRadius: "12px",
                padding: "12px 8px",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background: `linear-gradient(90deg, transparent, ${stat.color}20, transparent)`,
                  animation: "scanEffect 3s linear infinite",
                }}
              />
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: stat.color,
                  marginBottom: "2px",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: "9px",
                  color: "rgba(255, 255, 255, 0.5)",
                  textTransform: "uppercase",
                }}
              >
                {stat.icon} {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Connection Status */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "15px",
            fontSize: "12px",
            color: isConnected ? "#2ecc71" : "#e74c3c",
          }}
        >
          {isConnected ? "🟢 CONECTADO" : "🔴 DESCONECTADO"}
        </div>
      </div>

      {/* Game Status Banner */}
      <div
        style={{
          textAlign: "center",
          padding: "15px 20px",
        }}
      >
        <span
          style={{
            backgroundImage:
              gamePhase === "ending"
                ? "linear-gradient(135deg, #ff6b6b, #ee5a24)"
                : gamePhase === "active"
                  ? "linear-gradient(135deg, #feca57, #ff9ff3)"
                  : gamePhase === "finished"
                    ? "linear-gradient(135deg, #00d2d3, #54a0ff)"
                    : "linear-gradient(135deg, #5f27cd, #00d2d3)",
            color: "white",
            padding: "8px 20px",
            borderRadius: "25px",
            fontSize: "12px",
            fontWeight: "900",
            textTransform: "uppercase",
            letterSpacing: "1px",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
          }}
        >
          {gamePhase === "ending"
            ? "🚨 ÚLTIMOS SEGUNDOS"
            : gamePhase === "active"
              ? "🏁 CARRERA EN PROGRESO"
              : gamePhase === "finished"
                ? "🎯 MISIÓN COMPLETADA"
                : "⏳ ESPERANDO LANZAMIENTO"}
        </span>
      </div>

      {/* Vertical Space Race */}
      <div
        style={{
          padding: "20px 15px",
          paddingBottom: "120px",
          position: "relative",
        }}
      >
        {/* Finish Line at Top */}
        <div
          style={{
            position: "absolute",
            top: "30px",
            left: "15px",
            right: "15px",
            height: "6px",
            background: "linear-gradient(90deg, #ffd700, #ffed4e, #ffd700)",
            borderRadius: "3px",
            boxShadow: "0 0 25px rgba(255, 215, 0, 0.8)",
            zIndex: 10,
            animation: "finishLineGlow 2s ease-in-out infinite alternate",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-20px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "linear-gradient(135deg, #ffd700, #ffed4e)",
              color: "#000",
              padding: "6px 15px",
              borderRadius: "15px",
              fontSize: "11px",
              fontWeight: "bold",
              boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)",
            }}
          >
            🏁 LÍNEA DE META
          </div>
        </div>

        {/* Vertical Lanes */}
        <div
          style={{
            marginTop: "60px",
            display: "flex",
            gap: "8px",
            height: "420px",
            position: "relative",
          }}
        >
          {visibleCountries.map((country, index) => {
            const isQualified = classifiedPlayers.includes(country.id)
            const isLeading = index === 0 && country.points > 0

            return (
              <div
                key={country.id}
                style={{
                  flex: 1,
                  position: "relative",
                  background: isQualified
                    ? "linear-gradient(180deg, rgba(46, 204, 113, 0.2) 0%, rgba(39, 174, 96, 0.1) 100%)"
                    : "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%)",
                  borderRadius: "25px",
                  border: isQualified ? "2px solid rgba(46, 204, 113, 0.5)" : "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: isQualified ? "0 0 25px rgba(46, 204, 113, 0.3)" : "0 4px 15px rgba(0, 0, 0, 0.1)",
                  overflow: "hidden",
                  transform: isLeading ? "scale(1.02)" : "scale(1)",
                  transition: "all 0.3s ease",
                }}
              >
                {/* Lane Grid Pattern */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "2px",
                    height: "100%",
                    background:
                      "repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 0px, rgba(255, 255, 255, 0.3) 15px, transparent 15px, transparent 30px)",
                    animation: "gridMove 2s linear infinite",
                  }}
                />

                {/* Rocket */}
                <div
                  style={{
                    position: "absolute",
                    bottom: `${(country.progress / 100) * 100}%`,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "28px",
                    transition: "bottom 0.8s ease-out",
                    filter: "drop-shadow(0 0 15px rgba(255, 255, 255, 0.6))",
                    animation: gamePhase === "active" ? "rocketThrust 0.8s ease-in-out infinite alternate" : "none",
                  }}
                >
                  🚀{/* Rocket Thrust Effect */}
                  {gamePhase === "active" && country.progress > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "-15px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontSize: "16px",
                        animation: "thrustFlicker 0.3s ease-in-out infinite alternate",
                      }}
                    >
                      🔥
                    </div>
                  )}
                </div>

                {/* Country Info at Bottom */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "-50px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  <img
                    src={`https://flagpedia.net/data/flags/w80/${country.code}.png`}
                    alt={country.name}
                    style={{
                      width: "28px",
                      height: "20px",
                      borderRadius: "4px",
                      border: "2px solid rgba(255, 255, 255, 0.4)",
                      marginBottom: "6px",
                      display: "block",
                      margin: "0 auto 6px auto",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: "bold",
                      color: isQualified ? "#2ecc71" : "white",
                      marginBottom: "2px",
                      textShadow: "0 1px 3px rgba(0, 0, 0, 0.8)",
                    }}
                  >
                    {country.name}
                  </div>
                  <div
                    style={{
                      fontSize: "9px",
                      color: "rgba(255, 255, 255, 0.6)",
                      background: "rgba(0, 0, 0, 0.6)",
                      padding: "2px 6px",
                      borderRadius: "8px",
                    }}
                  >
                    {country.points} pts
                  </div>
                </div>

                {/* Position Badge */}
                <div
                  style={{
                    position: "absolute",
                    top: "-15px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundImage:
                      index < 3
                        ? "linear-gradient(135deg, #ffd700, #ffed4e)"
                        : "linear-gradient(135deg, #95a5a6, #7f8c8d)",
                    color: index < 3 ? "#000" : "#fff",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "bold",
                    border: "2px solid white",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  {index + 1}
                </div>

                {/* Progress Percentage */}
                <div
                  style={{
                    position: "absolute",
                    top: "15px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: "11px",
                    fontWeight: "bold",
                    color: isQualified ? "#2ecc71" : "#4ecdc4",
                    background: "rgba(0, 0, 0, 0.8)",
                    padding: "4px 8px",
                    borderRadius: "10px",
                    border: `1px solid ${isQualified ? "#2ecc71" : "#4ecdc4"}40`,
                  }}
                >
                  {Math.round(country.progress)}%
                </div>

                {/* Qualification Effects */}
                {isQualified && (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "linear-gradient(180deg, rgba(46, 204, 113, 0.3) 0%, transparent 50%)",
                        borderRadius: "25px",
                        animation: "qualifiedPulse 2s ease-in-out infinite",
                        pointerEvents: "none",
                      }}
                    />

                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        fontSize: "20px",
                        animation: "celebrationBounce 1s ease-in-out infinite",
                      }}
                    >
                      🎯
                    </div>
                  </>
                )}

                {/* Leader Crown */}
                {isLeading && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-25px",
                      right: "5px",
                      fontSize: "16px",
                      animation: "crownGlow 2s ease-in-out infinite alternate",
                    }}
                  >
                    👑
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Instructions */}
      <div
        style={{
          position: "absolute",
          bottom: "15px",
          left: "15px",
          right: "15px",
          background: "rgba(0, 0, 0, 0.9)",
          backdropFilter: "blur(20px)",
          padding: "15px",
          borderRadius: "15px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          textAlign: "center",
        }}
      >
        {gamePhase === "finished" ? (
          <div style={{ fontSize: "12px", color: "#4ecdc4", fontWeight: "bold" }}>
            🎉 ¡Clasificatorias completadas! Los ganadores avanzan al juego principal
          </div>
        ) : gamePhase === "waiting" ? (
          <div style={{ fontSize: "12px", color: "#45b7d1", fontWeight: "bold" }}>
            💬 Escribe "/equipo [país]" en los comentarios para unirte a la misión
          </div>
        ) : (
          <>
            <div style={{ fontSize: "12px", marginBottom: "6px", fontWeight: "bold" }}>
              <span style={{ color: "#4ecdc4" }}>👍 LIKE = +1 punto</span> |
              <span style={{ color: "#ff6b6b" }}> 🎁 REGALO = +1-50 puntos</span>
            </div>
            <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.6)" }}>
              🚀 Solo los 6 primeros compiten • Llega a 1000 puntos para clasificar al torneo principal
            </div>
          </>
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes starsMoveFast {
          from { transform: translateY(0px); }
          to { transform: translateY(-100px); }
        }
        
        @keyframes nebulaDrift {
          0% { transform: scale(1) rotate(0deg); }
          100% { transform: scale(1.1) rotate(3deg); }
        }
        
        @keyframes scanEffect {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        @keyframes finishLineGlow {
          0% { box-shadow: 0 0 25px rgba(255, 215, 0, 0.8); }
          100% { box-shadow: 0 0 35px rgba(255, 215, 0, 1), 0 0 50px rgba(255, 215, 0, 0.6); }
        }
        
        @keyframes gridMove {
          from { transform: translateX(-50%) translateY(0px); }
          to { transform: translateX(-50%) translateY(-30px); }
        }
        
        @keyframes rocketThrust {
          0% { transform: translateX(-50%) translateY(0px); }
          100% { transform: translateX(-50%) translateY(-4px); }
        }
        
        @keyframes thrustFlicker {
          0% { opacity: 0.8; transform: translateX(-50%) scale(1); }
          100% { opacity: 1; transform: translateX(-50%) scale(1.2); }
        }
        
        @keyframes qualifiedPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        
        @keyframes celebrationBounce {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.3); }
        }
        
        @keyframes crownGlow {
          0% { filter: drop-shadow(0 0 5px #ffd700); }
          100% { filter: drop-shadow(0 0 15px #ffd700) drop-shadow(0 0 25px #ffed4e); }
        }
      `}</style>
    </div>
  )
}

export default ClasificatoriasPresala
