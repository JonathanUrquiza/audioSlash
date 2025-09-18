# 🎬 AudioSlash - Interfaz Web

## ¿Qué hace?
AudioSlash es una aplicación web que te permite extraer audio de videos de forma sencilla con una interfaz moderna.

## ✨ Características
- **Drag & Drop**: Arrastra videos directamente a la página
- **Múltiples formatos**: MP4, AVI, MOV, MKV, WMV, FLV, WEBM
- **Progreso en tiempo real**: Ve el progreso de extracción
- **Descarga automática**: Descarga el MP3 resultante
- **Historial**: Ve todos los archivos de audio extraídos
- **Interfaz moderna**: Diseño responsive y fácil de usar

## 🚀 Cómo usar

### 1. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 2. Ejecutar la aplicación
```bash
python app.py
```

### 3. Abrir navegador
Ve a: **http://localhost:5000**

## 📱 Cómo funciona

1. **Subir video**: Arrastra tu video a la zona de carga o haz clic para seleccionar
2. **Esperar**: La aplicación procesará automáticamente y mostrará el progreso
3. **Descargar**: Una vez completado, descarga tu archivo MP3
4. **Historial**: Todos tus archivos quedan guardados para descarga posterior

## 📁 Estructura de archivos
- `uploads/` - Videos temporales (se eliminan después)
- `audios/` - Archivos MP3 extraídos (permanentes)
- `templates/` - Archivos HTML de la interfaz
- `static/` - Archivos CSS y JavaScript

## ⚙️ Configuración
- **Tamaño máximo**: Sin límite (videos de cualquier tamaño)
- **Puerto**: 5000 (cambiar en app.py si es necesario)
- **Formatos de salida**: MP3 (alta calidad)

## 🛠️ Solución de problemas

**Error: "No module named 'moviepy'"**
- Ejecuta: `pip install -r requirements.txt`

**Error: "Address already in use"**
- Cambia el puerto en app.py (línea final): `app.run(port=5001)`

**Video no se procesa**
- Verifica que sea un formato soportado
- Videos muy grandes tardarán más tiempo en procesarse

## 💡 Tips
- Los archivos quedan guardados hasta que los elimines manualmente
- Puedes procesar múltiples videos (uno a la vez)
- La aplicación funciona completamente offline
- Compatible con grabaciones de Google Meet

¡Disfruta extrayendo audio de tus videos! 🎵
