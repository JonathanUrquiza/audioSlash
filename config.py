import os
from pathlib import Path

# Configuración de carpetas
CARPETA_DESCARGAS = Path("videos_descargados")
CARPETA_AUDIOS = Path("audios_extraidos") 
CARPETA_PROCESADOS = Path("videos_procesados")

# Archivo para rastrear videos ya procesados
ARCHIVO_PROCESADOS = "videos_procesados.txt"

# Configuración de Google Drive API
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
CREDENTIALS_FILE = 'credentials.json'
TOKEN_FILE = 'token.json'

# Extensiones de video a buscar
EXTENSIONES_VIDEO = ['.mp4', '.mov', '.avi', '.mkv']

# Intervalo de verificación en segundos
INTERVALO_VERIFICACION = 300  # 5 minutos

# Crear carpetas si no existen
def crear_carpetas():
    CARPETA_DESCARGAS.mkdir(exist_ok=True)
    CARPETA_AUDIOS.mkdir(exist_ok=True)
    CARPETA_PROCESADOS.mkdir(exist_ok=True)
    
    # Crear archivo de procesados si no existe
    if not Path(ARCHIVO_PROCESADOS).exists():
        Path(ARCHIVO_PROCESADOS).touch()
