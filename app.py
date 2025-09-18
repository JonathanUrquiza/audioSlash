#!/usr/bin/env python3
"""
AudioSlash - Interfaz web para extraer audio de videos
"""

import os
import uuid
import json
from pathlib import Path
from flask import Flask, render_template, request, jsonify, send_file, url_for
import datetime
from werkzeug.utils import secure_filename
from threading import Thread
import time
from moviepy.editor import VideoFileClip

app = Flask(__name__)
app.config['SECRET_KEY'] = 'audioSlash2024'
# Sin límite de tamaño - procesa videos de cualquier tamaño
# app.config['MAX_CONTENT_LENGTH'] = None

# Configuración de carpetas
UPLOAD_FOLDER = Path('uploads')
AUDIO_FOLDER = Path('audios')
ALLOWED_EXTENSIONS = {'.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm'}

# Crear carpetas
UPLOAD_FOLDER.mkdir(exist_ok=True)
AUDIO_FOLDER.mkdir(exist_ok=True)

# Almacén de progreso en memoria
progreso_jobs = {}

class VideoProcessor:
    def __init__(self):
        pass
    
    def allowed_file(self, filename):
        return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS
    
    def extraer_audio(self, video_path, job_id):
        """Extrae audio de video con seguimiento de progreso"""
        try:
            progreso_jobs[job_id] = {
                'status': 'processing',
                'progress': 0,
                'message': 'Iniciando extracción...'
            }
            
            # Crear nombre del archivo de audio
            nombre_audio = video_path.stem + '.mp3'
            audio_path = AUDIO_FOLDER / nombre_audio
            
            progreso_jobs[job_id]['message'] = 'Cargando video...'
            progreso_jobs[job_id]['progress'] = 10
            
            # Cargar el video
            with VideoFileClip(str(video_path)) as video:
                progreso_jobs[job_id]['message'] = 'Extrayendo audio...'
                progreso_jobs[job_id]['progress'] = 30
                
                # Extraer audio
                audio = video.audio
                
                progreso_jobs[job_id]['message'] = 'Generando archivo MP3...'
                progreso_jobs[job_id]['progress'] = 60
                
                # Guardar como MP3
                audio.write_audiofile(
                    str(audio_path), 
                    verbose=False, 
                    logger=None,
                    codec='mp3'
                )
                audio.close()
            
            progreso_jobs[job_id] = {
                'status': 'completed',
                'progress': 100,
                'message': 'Audio extraído exitosamente',
                'audio_file': nombre_audio
            }
            
            # Limpiar video original
            try:
                video_path.unlink()
            except:
                pass
                
            return str(audio_path)
            
        except Exception as e:
            progreso_jobs[job_id] = {
                'status': 'error',
                'progress': 0,
                'message': f'Error: {str(e)}'
            }
            return None

processor = VideoProcessor()

@app.route('/')
def index():
    # Agregar timestamp para evitar caché
    return render_template('index.html', moment=lambda: datetime.datetime.now())

@app.route('/upload', methods=['POST'])
def upload_video():
    if 'video' not in request.files:
        return jsonify({'error': 'No se seleccionó ningún archivo'}), 400
    
    file = request.files['video']
    
    if file.filename == '':
        return jsonify({'error': 'No se seleccionó ningún archivo'}), 400
    
    if not processor.allowed_file(file.filename):
        return jsonify({'error': 'Formato de archivo no permitido'}), 400
    
    try:
        # Generar ID único para el trabajo
        job_id = str(uuid.uuid4())
        
        # Guardar archivo
        filename = secure_filename(file.filename)
        file_path = UPLOAD_FOLDER / filename
        file.save(str(file_path))
        
        # Iniciar procesamiento en segundo plano
        thread = Thread(target=processor.extraer_audio, args=(file_path, job_id))
        thread.start()
        
        return jsonify({
            'job_id': job_id,
            'message': 'Archivo subido, iniciando procesamiento...'
        })
        
    except Exception as e:
        return jsonify({'error': f'Error subiendo archivo: {str(e)}'}), 500

@app.route('/progress/<job_id>')
def get_progress(job_id):
    if job_id in progreso_jobs:
        return jsonify(progreso_jobs[job_id])
    else:
        return jsonify({'error': 'Trabajo no encontrado'}), 404

@app.route('/download/<filename>')
def download_audio(filename):
    try:
        audio_path = AUDIO_FOLDER / filename
        if audio_path.exists():
            # Descargar archivo
            response = send_file(
                str(audio_path),
                as_attachment=True,
                download_name=filename
            )
            
            # Eliminar archivo después de descargarlo
            try:
                audio_path.unlink()
                print(f"🗑️ Archivo eliminado después de descarga: {filename}")
            except Exception as delete_error:
                print(f"⚠️ No se pudo eliminar {filename}: {delete_error}")
            
            return response
        else:
            return jsonify({'error': 'Archivo no encontrado'}), 404
    except Exception as e:
        return jsonify({'error': f'Error descargando archivo: {str(e)}'}), 500

@app.route('/audios')
def list_audios():
    """Lista todos los archivos de audio disponibles"""
    try:
        audios = []
        for audio_file in AUDIO_FOLDER.glob('*.mp3'):
            audios.append({
                'name': audio_file.name,
                'size': audio_file.stat().st_size,
                'url': url_for('download_audio', filename=audio_file.name)
            })
        return jsonify(audios)
    except Exception as e:
        return jsonify({'error': f'Error listando archivos: {str(e)}'}), 500

@app.route('/clear-cache', methods=['POST'])
def clear_server_cache():
    """Limpiar archivos temporales del servidor"""
    try:
        cleared_files = 0
        
        # Limpiar archivos en uploads
        for upload_file in UPLOAD_FOLDER.glob('*'):
            try:
                upload_file.unlink()
                cleared_files += 1
            except:
                pass
        
        # Limpiar archivos de progreso orfanos
        global progreso_jobs
        progreso_jobs.clear()
        
        print(f"🧹 Cache del servidor limpiado: {cleared_files} archivos eliminados")
        return jsonify({
            'status': 'success',
            'files_cleared': cleared_files,
            'message': 'Cache del servidor limpiado'
        })
    except Exception as e:
        return jsonify({'error': f'Error limpiando cache: {str(e)}'}), 500

if __name__ == '__main__':
    print("🎬 AudioSlash Web Interface")
    print("=" * 40)
    print("🌐 Abre tu navegador en: http://localhost:5000")
    print("🔄 Presiona Ctrl+C para detener")
    print("=" * 40)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
