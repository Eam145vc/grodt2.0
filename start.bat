@echo off
echo 🎮 Iniciando Tower Defense Game...
echo.

echo 📦 Instalando dependencias del servidor...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ❌ Error instalando dependencias del servidor
    pause
    exit /b %errorlevel%
)

echo.
echo 📦 Instalando dependencias del cliente...
cd ..\client
call npm install
if %errorlevel% neq 0 (
    echo ❌ Error instalando dependencias del cliente
    pause
    exit /b %errorlevel%
)

echo.
echo 🚀 Iniciando servidor en puerto 5000...
cd ..\server
start "Torre Defense Server" cmd /k "npm run dev"

echo.
echo ⏳ Esperando 3 segundos para que el servidor inicie...
timeout /t 3 /nobreak >nul

echo.
echo 🌐 Iniciando cliente en puerto 5001...
cd ..\client
start "Torre Defense Client" cmd /k "npm start"

echo.
echo ✅ ¡Todo listo!
echo.
echo 🎮 Juego: http://localhost:5001
echo ⚙️  Admin: http://localhost:5001/admin
echo.
echo 💡 Abre ambas URLs en pestañas diferentes
echo.
pause