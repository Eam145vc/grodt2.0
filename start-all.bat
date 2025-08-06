@echo off
echo "Iniciando servidor de Redis..."
docker start redis-server

echo "Iniciando servicios de la aplicacion..."
npm run start:dev