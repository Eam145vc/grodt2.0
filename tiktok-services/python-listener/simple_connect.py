import asyncio
from TikTokLive import TikTokLiveClient
from TikTokLive.events import ConnectEvent, CommentEvent, DisconnectEvent

# El usuario al que nos vamos a conectar
TIKTOK_USER = "@losperilla"

async def on_connect(event: ConnectEvent):
    """Se activa al conectar."""
    print(f"¡Conectado a @{event.unique_id}!")

async def on_comment(event: CommentEvent):
    """Se activa con cada comentario."""
    print(f"{event.user.nickname} -> {event.comment}")

async def on_disconnect(event: DisconnectEvent):
    """Se activa al desconectar."""
    print("Desconectado.")

async def main():
    """Función principal."""
    print(f"--- Intentando conectar a {TIKTOK_USER} ---")
    
    # Crear el cliente
    client = TikTokLiveClient(unique_id=TIKTOK_USER)

    # Aplicar parche de cabeceras
    print("DEBUG: Aplicando parche de cabeceras...")
    try:
        client.web.headers["Accept-Language"] = "es-CO,es;q=0.9"
        client.web.user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
        print("DEBUG: Cabeceras aplicadas.")
    except Exception as e:
        print(f"ALERTA: No se pudieron aplicar las cabeceras: {e}")
    
    # Añadir los listeners
    client.add_listener(ConnectEvent, on_connect)
    client.add_listener(CommentEvent, on_comment)
    client.add_listener(DisconnectEvent, on_disconnect)

    try:
        # Iniciar la conexión y mantenerla activa
        await client.start()
    except Exception as e:
        print(f"Ocurrió un error: {e}")
    finally:
        print("--- Script finalizado ---")

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nOperación interrumpida.")