"use client"

import { useReducer, useEffect, useRef, useMemo } from "react"
import io from "socket.io-client"

// Países de Latinoamérica
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
  classifiedPlayers: [],
  gamePhase: "waiting",
  isConnected: false,
}

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
          const countryInfo = allCountries.find((c) => c.name.toLowerCase() === teamName.toLowerCase())
          return {
            id: teamName,
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

      const targetPoints = 1000
      const classifiedIds = new Set(state.classifiedPlayers)
      let classifiedUpdated = false

      newState.countries.forEach((country) => {
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
        classifiedPlayers: action.payload.classifiedPlayers.map((p) => p.name) || [],
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
  const { timeLeft, classifiedPlayers, gamePhase } = state
  const presalaContainerRef = useRef(null)


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
    const onPresalaInteraction = (data) => {
      // La funcionalidad de la bola de energía ha sido eliminada.
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("presalaState", onPresalaState)
    socket.on("presalaStarted", onPresalaStarted)
    socket.on("presalaEnded", onPresalaEnded)
    socket.on("presalaReset", onPresalaReset)
    socket.on("presalaInteraction", onPresalaInteraction)

    return () => {
      console.log("🧹 Limpiando conexión...")
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

  const visibleCountries = useMemo(() => {
    return state.countries
      .map((country, index) => ({
        ...country,
        trackPosition: index,
        progress: Math.min(100, (country.points / 1000) * 100),
      }))
      .slice(0, 6)
  }, [state.countries])

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
        overflow: "hidden",
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

      {/* Header with Holographic Effect */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(138, 43, 226, 0.1) 100%)",
          backdropFilter: "blur(20px)",
          padding: "20px",
          borderBottom: "2px solid rgba(138, 43, 226, 0.3)",
          position: "relative",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Holographic Scan Line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, transparent, #00d4ff, transparent)",
            animation: "holographicScan 3s linear infinite",
          }}
        />

        {/* Enhanced Stats */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            gap: "12px",
          }}
        >
          {[
            {
              label: "TIEMPO",
              value: formatTime(timeLeft),
              color: gamePhase === "ending" ? "#ff4757" : "#00d4ff",
              icon: "⏰",
              glow: gamePhase === "ending",
            },
            {
              label: "CLASIFICADOS",
              value: `${classifiedPlayers.length}/4`,
              color: "#2ed573",
              icon: "🏆",
              glow: classifiedPlayers.length > 0,
            },
          ].map((stat, index) => (
            <div
              key={index}
              style={{
                flex: 1,
                background: `linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(${stat.color === "#00d4ff" ? "0, 212, 255" : stat.color === "#2ed573" ? "46, 213, 115" : "255, 71, 87"}, 0.1) 100%)`,
                border: `2px solid ${stat.color}40`,
                borderRadius: "16px",
                padding: "16px 12px",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
                boxShadow: stat.glow ? `0 0 25px ${stat.color}40` : "0 4px 15px rgba(0, 0, 0, 0.2)",
                transform: stat.glow ? "scale(1.05)" : "scale(1)",
                transition: "all 0.3s ease",
              }}
            >
              {/* Animated Border */}
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  left: "0",
                  right: "0",
                  bottom: "0",
                  borderRadius: "16px",
                  background: `linear-gradient(45deg, ${stat.color}60, ${stat.color}40, ${stat.color}60)`,
                  zIndex: -1,
                  animation: "borderGlow 3s ease-in-out infinite",
                }}
              />

              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "900",
                  color: stat.color,
                  marginBottom: "4px",
                  textShadow: `0 0 10px ${stat.color}80`,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "rgba(255, 255, 255, 0.7)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  fontWeight: "600",
                }}
              >
                {stat.icon} {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Race Area */}
      <div
        style={{
          padding: "0 16px 24px 16px",
          position: "relative",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
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

        {/* Position Badges */}
        <div
          style={{
            display: "flex",
            position: "relative",
            top: "12px",
            height: "36px",
            gap: "10px",
            marginBottom: "8px",
          }}
        >
          {visibleCountries.map((country, index) => (
            <div
              key={`badge-${country.id}`}
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  background:
                    index < 4
                      ? "linear-gradient(135deg, #ffd700, #ffed4e)"
                      : "linear-gradient(135deg, #95a5a6, #7f8c8d)",
                  color: index < 4 ? "#000" : "#fff",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: "900",
                  border: "3px solid white",
                  boxShadow:
                    index < 4
                      ? "0 0 20px rgba(255, 215, 0, 0.6), 0 4px 15px rgba(0, 0, 0, 0.3)"
                      : "0 4px 15px rgba(0, 0, 0, 0.3)",
                  animation:
                    index === 0 && country.points > 0 ? "leaderGlow 2s ease-in-out infinite alternate" : "none",
                }}
              >
                {index + 1}
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Finish Line */}
        <div
          style={{
            position: "relative",
            top: "12px",
            left: "0",
            right: "0",
            height: "8px",
            background: "linear-gradient(90deg, #ffd700, #ffed4e, #ffd700)",
            borderRadius: "4px",
            boxShadow: "0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4)",
            zIndex: 10,
            animation: "finishLineIntense 1.5s ease-in-out infinite alternate",
            border: "2px solid rgba(255, 255, 255, 0.3)",
          }}
        />

        {/* Race Tracks */}
        <div
          style={{
            marginTop: "16px",
            display: "flex",
            gap: "10px",
            flexGrow: 1,
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
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "0",
                    bottom: "15%",
                    left: 0,
                    right: 0,
                    background: isQualified
                      ? "linear-gradient(180deg, rgba(46, 213, 115, 0.25) 0%, rgba(39, 174, 96, 0.15) 50%, rgba(46, 213, 115, 0.05) 100%)"
                      : "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(138, 43, 226, 0.08) 50%, rgba(0, 212, 255, 0.05) 100%)",
                    borderRadius: "30px",
                    border: isQualified ? "2px solid rgba(46, 213, 115, 0.6)" : "2px solid rgba(138, 43, 226, 0.3)",
                    boxShadow: isQualified
                      ? "0 0 30px rgba(46, 213, 115, 0.4), inset 0 0 20px rgba(46, 213, 115, 0.1)"
                      : "0 8px 25px rgba(0, 0, 0, 0.2), inset 0 0 20px rgba(138, 43, 226, 0.1)",
                    overflow: "hidden",
                    transform: isLeading ? "scale(1.03)" : "scale(1)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  {/* Enhanced Track Grid */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "0",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "3px",
                      height: "calc(100% + 40px)",
                      background: isQualified
                        ? "repeating-linear-gradient(to bottom, rgba(46, 213, 115, 0.6) 0px, rgba(46, 213, 115, 0.6) 20px, transparent 20px, transparent 40px)"
                        : "repeating-linear-gradient(to bottom, rgba(138, 43, 226, 0.4) 0px, rgba(138, 43, 226, 0.4) 20px, transparent 20px, transparent 40px)",
                      animation: "enhancedGridMove 1.5s linear infinite",
                    }}
                  />

                  {/* Rocket Container */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: `${country.progress}%`,
                      left: "50%",
                      transform: "translateX(-50%)",
                      transition: "bottom 1s cubic-bezier(0.4, 0, 0.2, 1)",
                      animation:
                        gamePhase === "active" ? "enhancedRocketThrust 0.6s ease-in-out infinite alternate" : "none",
                      width: "64px",
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
                        width: "100%",
                        height: "auto",
                        filter: "brightness(1.2) contrast(1.1) drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))",
                      }}
                    />

                    {/* Country Flag */}
                    <img
                      src={`https://flagpedia.net/data/flags/w80/${country.code}.png`}
                      alt={country.name}
                      style={{
                        position: "absolute",
                        top: "18px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "42px",
                        height: "28px",
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
                            bottom: "-4px", // Subido más arriba
                            left: "50%",
                            fontSize: "20px",
                            animation: "enhancedThrustFlicker 0.2s ease-in-out infinite alternate",
                          }}
                        >
                          🔥
                        </div>
                      </>
                    )}
                  </div>

                  {/* Enhanced Country Info */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-60px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "800",
                        color: isQualified ? "#2ed573" : "white",
                        marginBottom: "4px",
                        textShadow: isQualified ? "0 0 10px rgba(46, 213, 115, 0.8)" : "0 2px 4px rgba(0, 0, 0, 0.8)",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {country.name}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "rgba(255, 255, 255, 0.8)",
                        background: "linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(138, 43, 226, 0.3))",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        fontWeight: "600",
                      }}
                    >
                      {country.points} pts
                    </div>
                  </div>

                  {/* Enhanced Progress Indicator */}
                  <div
                    style={{
                      position: "absolute",
                      top: "20px",
                      left: "50%",
                      transform: "translateX(-50%)",
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
                            "linear-gradient(180deg, rgba(46, 213, 115, 0.4) 0%, rgba(46, 213, 115, 0.1) 50%, transparent 100%)",
                          borderRadius: "30px",
                          animation: "qualifiedIntense 1.5s ease-in-out infinite",
                          pointerEvents: "none",
                        }}
                      />

                      <div
                        style={{
                          position: "absolute",
                          top: "40%",
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
                        top: "-30px",
                        right: "8px",
                        fontSize: "20px",
                        animation: "crownMajestic 2s ease-in-out infinite alternate",
                        filter: "drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))",
                      }}
                    >
                      👑
                    </div>
                  )}
                </div>

                {/* Enhanced Energy Balls */}
              </div>
            )
          })}
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
          from { transform: translateX(-50%) translateY(0px); }
          to { transform: translateX(-50%) translateY(-40px); }
        }
        
        @keyframes enhancedRocketThrust {
          0% { transform: translateX(-50%) translateY(0px) rotate(-1deg); }
          100% { transform: translateX(-50%) translateY(-6px) rotate(1deg); }
        }
        
        @keyframes enhancedThrustFlicker {
          0% { opacity: 0.7; transform: translateX(-50%) rotate(180deg) scale(1); }
          100% { opacity: 1; transform: translateX(-50%) rotate(180deg) scale(1.3); }
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
            transform: rotate(-5deg) scale(1);
          }
          100% { 
            filter: drop-shadow(0 0 25px rgba(255, 215, 0, 1)) drop-shadow(0 0 40px rgba(255, 215, 0, 0.6));
            transform: rotate(5deg) scale(1.1);
          }
        }

      `}</style>
    </div>
  )
}

export default ClasificatoriasPresala
