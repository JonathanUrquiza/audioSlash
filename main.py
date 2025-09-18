#!/usr/bin/env python3
"""
AudioSlash - Extractor automático de audio desde Google Drive
Detecta grabaciones de Google Meet y extrae su audio automáticamente
"""

import time
import sys
from pathlib import Path

from google_drive_auth import GoogleDriveAuth
from video_processor import VideoProcessor
from config import crear_carpetas, INTERVALO_VERIFICACION

def main():
    print("🎬 AudioSlash - Iniciando extractor de audio")
    print("=" * 50)
    
    # Crear carpetas necesarias
    crear_carpetas()
    
    # Autenticar con Google Drive
    auth = GoogleDriveAuth()
    service = auth.obtener_servicio()
    
    if not service:
        print("❌ No se pudo autenticar con Google Drive")
        print("Asegúrate de tener el archivo credentials.json")
        return
    
    # Inicializar procesador de videos
    processor = VideoProcessor(service)
    
    print(f"✅ Sistema iniciado correctamente")
    print(f"⏰ Verificando cada {INTERVALO_VERIFICACION//60} minutos")
    print("🔄 Presiona Ctrl+C para detener")
    print("=" * 50)
    
    try:
        while True:
            # Buscar nuevos videos
            nuevos_videos = processor.buscar_nuevos_videos()
            
            if nuevos_videos:
                print(f"📹 {len(nuevos_videos)} video(s) nuevo(s) encontrado(s)")
                
                for video in nuevos_videos:
                    print(f"\n🎬 Procesando: {video['name']}")
                    success = processor.procesar_video(video)
                    
                    if success:
                        print("✅ Procesado exitosamente")
                    else:
                        print("❌ Error en el procesamiento")
                    
                    print("-" * 30)
            else:
                print("📭 No se encontraron videos nuevos")
            
            # Esperar antes de la próxima verificación
            print(f"😴 Esperando {INTERVALO_VERIFICACION//60} minutos...")
            time.sleep(INTERVALO_VERIFICACION)
    
    except KeyboardInterrupt:
        print("\n👋 Deteniendo AudioSlash...")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
