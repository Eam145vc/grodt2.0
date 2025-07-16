import asyncio
import os
import requests
from TikTokLive import TikTokLiveClient
from TikTokLive.events import ConnectEvent, CommentEvent, GiftEvent, LikeEvent, FollowEvent

# --- Configuración ---
# El unique_id del usuario de TikTok a monitorear.
# Asegúrate de que el usuario esté transmitiendo en vivo.
TIKTOK_UNIQUE_ID = os.environ.get("TIKTOK_UNIQUE_ID", "@miUsuarioTikTok")

# La URL del "Cerebro Central" que recibirá los eventos.
# Aún no lo hemos creado, pero esta será su dirección.
CENTRAL_BRAIN_URL = os.environ.get("CENTRAL_BRAIN_URL", "http://localhost:3000/event")

# --- Cliente de TikTok Live ---
client: TikTokLiveClient = TikTokLiveClient(unique_id=TIKTOK_UNIQUE_ID)

# --- Funciones de Ayuda ---
def send_to_central_brain(event_type: str, data: dict):
    """
    Envía un evento al Cerebro Central a través de una solicitud HTTP POST.
    """
    try:
        payload = {
            "source": "python-listener",
            "event_type": event_type,
            "data": data
        }
        print(f"Enviando evento al Cerebro Central: {event_type}")
        response = requests.post(CENTRAL_BRAIN_URL, json=payload, timeout=5)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error al enviar el evento al Cerebro Central: {e}")

# --- Manejadores de Eventos ---
@client.on(ConnectEvent)
async def on_connect(event: ConnectEvent):
    print(f"Conectado a la sala de @{event.unique_id} (Room ID: {client.room_id})")
    send_to_central_brain("connect", {"unique_id": event.unique_id, "room_id": client.room_id})

@client.on(CommentEvent)
async def on_comment(event: CommentEvent):
    print(f"Comentario de {event.user.nickname}: {event.comment}")
    send_to_central_brain("comment", {
        "user": event.user.nickname,
        "comment": event.comment
    })

@client.on(GiftEvent)
async def on_gift(event: GiftEvent):
    # Se manejan los regalos con "streak" para no enviar eventos duplicados.
    if event.gift.streakable and not event.streaking:
        print(f"{event.user.unique_id} envió {event.repeat_count}x \"{event.gift.name}\"")
        send_to_central_brain("gift", {
            "user": event.user.unique_id,
            "gift_name": event.gift.name,
            "count": event.repeat_count
        })
    elif not event.gift.streakable:
        print(f"{event.user.unique_id} envió \"{event.gift.name}\"")
        send_to_central_brain("gift", {
            "user": event.user.unique_id,
            "gift_name": event.gift.name,
            "count": 1
        })

@client.on(LikeEvent)
async def on_like(event: LikeEvent):
    print(f"{event.user.unique_id} envió {event.like_count} likes. Total: {event.total_like_count}")
    send_to_central_brain("like", {
        "user": event.user.unique_id,
        "count": event.like_count,
        "total": event.total_like_count
    })

@client.on(FollowEvent)
async def on_follow(event: FollowEvent):
    print(f"{event.user.unique_id} ahora sigue al anfitrión.")
    send_to_central_brain("follow", {"user": event.user.unique_id})

# --- Ejecución Principal ---
if __name__ == '__main__':
    try:
        print("Iniciando el listener de Python para TikTok...")
        # Inicia el cliente. Esto bloqueará el hilo principal.
        client.run()
    except KeyboardInterrupt:
        print("Listener detenido manualmente.")
    except Exception as e:
        print(f"Ocurrió un error inesperado: {e}")
