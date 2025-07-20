import asyncio
import logging
from TikTokLive import TikTokLiveClient
from TikTokLive.events import ConnectEvent, DisconnectEvent

# Configura un logger básico para ver los mensajes de la librería
logging.basicConfig(level=logging.INFO)

# El nuevo usuario de TikTok sugerido para la prueba
TIKTOK_USER = "@problems"

async def on_connect(event: ConnectEvent):
    print(f"¡ÉXITO! Conectado a la sala de @{event.unique_id}")
    client.stop()

async def on_disconnect(event: DisconnectEvent):
    reason = getattr(event, 'reason', 'No especificada')
    print(f"AVISO: Desconectado del Live. Razón: {reason}")

async def main():
    global client
    print(f"--- Iniciando script de diagnóstico para el usuario: {TIKTOK_USER} ---")

    try:
        print(f"DEBUG: Creando cliente para @{TIKTOK_USER}...")
        client = TikTokLiveClient(unique_id=TIKTOK_USER)

        print("DEBUG: Configurando cabeceras post-creación (replicando proyecto funcional)...")
        client.web.headers["Accept-Language"] = "es-CO,es;q=0.9"
        client.web.user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
        print("DEBUG: Cabeceras configuradas.")

        print("\nPASO CRÍTICO: Intentando iniciar la conexión con client.start()...")
        await client.start()
        print("DIAGNÓSTICO: client.start() ha finalizado sin bloquearse.")

    except Exception as e:
        import traceback
        print(f"\nERROR CRÍTICO: Ocurrió una excepción durante la conexión.")
        traceback.print_exc()

    finally:
        print("\n--- Script de diagnóstico finalizado ---")

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nOperación interrumpida por el usuario.")