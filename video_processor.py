import os
import re
import io
import time
from pathlib import Path
from moviepy.editor import VideoFileClip
from googleapiclient.http import MediaIoBaseDownload
from config import (
    CARPETA_DESCARGAS, CARPETA_AUDIOS, CARPETA_PROCESADOS, 
    ARCHIVO_PROCESADOS, EXTENSIONES_VIDEO
)

class VideoProcessor:
    def __init__(self, drive_service):
        self.drive_service = drive_service
        self.videos_procesados = self.cargar_procesados()
    
    def cargar_procesados(self):
        """Carga la lista de videos ya procesados"""
        try:
            with open(ARCHIVO_PROCESADOS, 'r') as f:
                return set(line.strip() for line in f)
        except FileNotFoundError:
            return set()
    
    def guardar_procesado(self, video_id):
        """Marca un video como procesado"""
        with open(ARCHIVO_PROCESADOS, 'a') as f:
            f.write(f"{video_id}\n")
        self.videos_procesados.add(video_id)
    
    def es_grabacion_meet(self, nombre_archivo):
        """Verifica si el archivo es una grabación de Meet basándose en ID numérico"""
        # Buscar archivos MP4 que contengan solo números (o patrones similares)
        if not any(nombre_archivo.lower().endswith(ext) for ext in EXTENSIONES_VIDEO):
            return False
        
        # Extraer el nombre sin extensión
        nombre_sin_ext = Path(nombre_archivo).stem
        
        # Verificar si es solo números o contiene patrones típicos de Meet
        return (nombre_sin_ext.isdigit() or 
                re.match(r'^\d+.*', nombre_sin_ext) or
                'meet' in nombre_archivo.lower() or
                'recording' in nombre_archivo.lower())
    
    def buscar_nuevos_videos(self):
        """Busca nuevos videos de Meet en la raíz de Google Drive"""
        try:
            print("🔍 Buscando nuevos videos en Google Drive...")
            
            # Buscar archivos de video en la raíz
            query = f"parents in 'root' and ("
            query += " or ".join([f"name contains '{ext}'" for ext in EXTENSIONES_VIDEO])
            query += ") and trashed=false"
            
            results = self.drive_service.files().list(
                q=query,
                fields="nextPageToken, files(id, name, size, createdTime)"
            ).execute()
            
            items = results.get('files', [])
            nuevos_videos = []
            
            for item in items:
                if (item['id'] not in self.videos_procesados and 
                    self.es_grabacion_meet(item['name'])):
                    nuevos_videos.append(item)
                    print(f"📹 Nuevo video encontrado: {item['name']}")
            
            return nuevos_videos
            
        except Exception as e:
            print(f"❌ Error buscando videos: {e}")
            return []
    
    def descargar_video(self, file_id, file_name):
        """Descarga un video desde Google Drive"""
        try:
            print(f"⬇️ Descargando: {file_name}")
            
            request = self.drive_service.files().get_media(fileId=file_id)
            ruta_destino = CARPETA_DESCARGAS / file_name
            
            with open(ruta_destino, 'wb') as fh:
                downloader = MediaIoBaseDownload(fh, request)
                done = False
                while done is False:
                    status, done = downloader.next_chunk()
                    if status:
                        print(f"⏳ Progreso: {int(status.progress() * 100)}%")
            
            print(f"✅ Video descargado: {ruta_destino}")
            return ruta_destino
            
        except Exception as e:
            print(f"❌ Error descargando {file_name}: {e}")
            return None
    
    def extraer_audio(self, ruta_video):
        """Extrae el audio de un video usando moviepy"""
        try:
            print(f"🎵 Extrayendo audio de: {ruta_video.name}")
            
            # Crear nombre del archivo de audio
            nombre_audio = ruta_video.stem + '.mp3'
            ruta_audio = CARPETA_AUDIOS / nombre_audio
            
            # Extraer audio
            with VideoFileClip(str(ruta_video)) as video:
                audio = video.audio
                audio.write_audiofile(str(ruta_audio), verbose=False, logger=None)
                audio.close()
            
            print(f"✅ Audio extraído: {ruta_audio}")
            return ruta_audio
            
        except Exception as e:
            print(f"❌ Error extrayendo audio de {ruta_video.name}: {e}")
            return None
    
    def mover_video_procesado(self, ruta_video):
        """Mueve el video a la carpeta de procesados"""
        try:
            ruta_destino = CARPETA_PROCESADOS / ruta_video.name
            ruta_video.rename(ruta_destino)
            print(f"📁 Video movido a procesados: {ruta_destino}")
        except Exception as e:
            print(f"⚠️ No se pudo mover el video procesado: {e}")
    
    def procesar_video(self, file_info):
        """Procesa un video completo: descarga, extrae audio, limpia"""
        file_id = file_info['id']
        file_name = file_info['name']
        
        try:
            # Descargar video
            ruta_video = self.descargar_video(file_id, file_name)
            if not ruta_video:
                return False
            
            # Extraer audio
            ruta_audio = self.extraer_audio(ruta_video)
            if not ruta_audio:
                return False
            
            # Mover video a carpeta de procesados
            self.mover_video_procesado(ruta_video)
            
            # Marcar como procesado
            self.guardar_procesado(file_id)
            
            print(f"🎉 Video procesado exitosamente: {file_name}")
            return True
            
        except Exception as e:
            print(f"❌ Error procesando {file_name}: {e}")
            return False
