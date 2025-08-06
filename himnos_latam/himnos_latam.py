import yt_dlp
import os

# Lista completa de países hispanohablantes en Latinoamérica
paises = [
    "Argentina", "Bolivia", "Chile", "Colombia", "Costa Rica",
    "Cuba", "Ecuador", "El Salvador", "Guatemala", "Honduras",
    "México", "Nicaragua", "Panamá", "Paraguay", "Perú",
    "Puerto Rico", "República Dominicana", "Uruguay", "Venezuela"
]

# Crear la carpeta 'himnos' si no existe
output_folder = 'himnos'
if not os.path.exists(output_folder):
    os.makedirs(output_folder)

# Configuración de yt-dlp para descargar audio MP3
ydl_opts = {
    'format': 'bestaudio/best',
    'outtmpl': os.path.join(output_folder, 'Himno Nacional de %(title)s.%(ext)s'),
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'mp3',
        'preferredquality': '192',
    }],
    'noplaylist': True,
    'default_search': 'ytsearch1',  # Solo el primer resultado
    'quiet': False
}

def descargar_himnos():
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        for pais in paises:
            consulta = f"Himno Nacional {pais} versión oficial"
            print(f"\n🔍 Buscando: {consulta}")
            try:
                ydl.download([consulta])
            except Exception as e:
                print(f"⚠️ Error al descargar el himno de {pais}: {e}")

if __name__ == "__main__":
    descargar_himnos()