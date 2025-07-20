@echo off
ECHO Activando entorno virtual de Python...
CALL tiktok-services/python-listener/venv/Scripts/activate.bat

ECHO Iniciando Listener de Python con Uvicorn (Sin Búfer)...
cd tiktok-services/python-listener
set PYTHONIOENCODING=utf-8
python -u -m uvicorn main:app --host 0.0.0.0 --port 5003