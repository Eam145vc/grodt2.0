from TikTokLive import TikTokLiveClient
from TikTokLive.events import ConnectEvent, CommentEvent, DisconnectEvent

# --- Configuración ---
TIKTOK_USER = "@losperilla"

# --- Creación del Cliente ---
print(f"--- Creando cliente para {TIKTOK_USER} (usando librería parcheada) ---")
client = TikTokLiveClient(unique_id=TIKTOK_USER)

# --- Definición de Eventos ---
@client.on(ConnectEvent)
async def on_connect(event: ConnectEvent):
    print(f"¡CONEXIÓN EXITOSA (200 OK)! Conectado a la sala de @{event.unique_id}")
    print("Escuchando comentarios... (Presiona Ctrl+C para salir)")

@client.on(CommentEvent)
async def on_comment(event: CommentEvent):
    print(f"{event.user.nickname} -> {event.comment}")

@client.on(DisconnectEvent)
async def on_disconnect(event: DisconnectEvent):
    print("Cliente desconectado.")

# --- Ejecución ---
if __name__ == '__main__':
    print("Iniciando cliente con client.run()...")
    try:
        client.run()
    except Exception as e:
        print(f"Ha ocurrido un error fatal: {e}")
    finally:
        print("--- Script finalizado ---")