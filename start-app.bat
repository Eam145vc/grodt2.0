@echo off
ECHO Iniciando Servidor Node.js en una nueva ventana...
start "Server" cmd /c "cd server && npm start"

ECHO Iniciando Cliente React en una nueva ventana...
start "Client" cmd /c "cd client && npm start"

ECHO Ambos servicios se estan iniciando en segundo plano.