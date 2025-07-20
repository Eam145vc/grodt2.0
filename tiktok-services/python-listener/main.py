import asyncio
import os
import requests
from flask import Flask, request, jsonify
from TikTokLive import TikTokLiveClient
from TikTokLive.events import ConnectEvent, CommentEvent, DisconnectEvent, LikeEvent, GiftEvent
from asgiref.wsgi import WsgiToAsgi

# --- Configuración Global ---
CENTRAL_BRAIN_URL = os.environ.get("CENTRAL_BRAIN_URL", "http://localhost:5001/event")
PORT = int(os.environ.get("PYTHON_LISTENER_PORT", 5003))
client: TikTokLiveClient = None
flask_app = Flask(__name__)
app = WsgiToAsgi(flask_app)

# --- Funciones de Ayuda ---
def send_to_central_brain(event_type: str, data: dict):
    try:
        payload = {"source": "python-listener", "event_type": event_type, "data": data}
        requests.post(CENTRAL_BRAIN_URL, json=payload, timeout=5)
    except requests.exceptions.RequestException as e:
        print(f"Error al enviar el evento al Cerebro Central: {e}")

# --- Manejadores de Eventos de TikTok ---
async def on_connect(event: ConnectEvent):
    print(f"Conectado a la sala de @{event.unique_id}")
    send_to_central_brain("status", {"status": "connected", "user": event.unique_id, "message": f"Conectado a @{event.unique_id}"})

async def on_comment(event: CommentEvent):
    print(f"{event.user.nickname} -> {event.comment}")
    send_to_central_brain("comment", {"user": event.user.unique_id.lower(), "comment": event.comment})

async def on_disconnect(event: DisconnectEvent):
    print("Desconectado de TikTok.")
    send_to_central_brain("status", {"status": "disconnected", "message": "Desconectado del Live"})

async def on_like(event: LikeEvent):
    print(f"{event.user.nickname} envió {event.count} likes.")
    send_to_central_brain('like', {
        "user": event.user.unique_id.lower(),
        "count": event.count,
        "total": 0
    })

async def on_gift(event: GiftEvent):
    # Si el regalo es parte de una racha, solo actuar cuando la racha termina.
    if event.gift.streakable and not event.streaking:
        print(f"{event.user.nickname} envió {event.repeat_count}x \"{event.gift.name}\" (ID: {event.gift.id}, Valor: {event.gift.diamond_count})")
        send_to_central_brain('gift', {
            "user": event.user.unique_id.lower(),
            "gift_id": event.gift.id,
            "gift_name": event.gift.name,
            "count": event.repeat_count,
            "value": event.gift.diamond_count
        })
    # Si el regalo no es parte de una racha, procesarlo inmediatamente.
    elif not event.gift.streakable:
        print(f"{event.user.nickname} envió \"{event.gift.name}\" (ID: {event.gift.id}, Valor: {event.gift.diamond_count})")
        send_to_central_brain('gift', {
            "user": event.user.unique_id.lower(),
            "gift_id": event.gift.id,
            "gift_name": event.gift.name,
            "count": 1,
            "value": event.gift.diamond_count
        })

# --- Lógica del Cliente de TikTok ---
async def run_tiktok_client(tiktok_user: str):
    global client
    try:
        print(f"DEBUG: Preparando para iniciar cliente para @{tiktok_user}...")
        client = TikTokLiveClient(unique_id=f"@{tiktok_user}")

        client.add_listener(ConnectEvent, on_connect)
        client.add_listener(CommentEvent, on_comment)
        client.add_listener(DisconnectEvent, on_disconnect)
        client.add_listener(LikeEvent, on_like)
        client.add_listener(GiftEvent, on_gift)

        await client.start()
    except Exception as e:
        import traceback
        print(f"ERROR CRÍTICO al iniciar TikTok client para @{tiktok_user}: {e}")
        traceback.print_exc()
        send_to_central_brain("status", {"status": "error", "message": str(e)})

# --- Endpoints de Flask ---
@flask_app.route('/connect', methods=['POST'])
async def connect_tiktok():
    data = request.get_json()
    tiktok_user = data.get('tiktokUser')
    if not tiktok_user:
        return jsonify({"error": "tiktokUser es requerido"}), 400
    
    print(f"Iniciando conexión con @{tiktok_user} como una tarea de asyncio...")
    asyncio.create_task(run_tiktok_client(tiktok_user))
    
    return jsonify({"status": "ok", "message": f"Intentando conectar a @{tiktok_user}"}), 200
