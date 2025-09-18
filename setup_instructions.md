# AudioSlash - Instrucciones de Configuración

## 1. Instalar Dependencias

```bash
pip install -r requirements.txt
```

## 2. Configurar Google Drive API

### Paso 1: Crear proyecto en Google Cloud Console
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a "APIs & Services" > "Library"
4. Busca "Google Drive API" y actívala

### Paso 2: Crear credenciales
1. Ve a "APIs & Services" > "Credentials"
2. Haz clic en "Create Credentials" > "OAuth client ID"
3. Si es la primera vez, configura la "OAuth consent screen":
   - User Type: External
   - Completa la información básica
   - En "Scopes", no agregues ninguno
   - En "Test users", agrega tu email
4. Selecciona "Desktop application"
5. Descarga el archivo JSON de credenciales
6. Renombra el archivo a `credentials.json` y colócalo en la carpeta del proyecto

## 3. Ejecutar el Programa

```bash
python main.py
```

La primera vez te pedirá autorización en el navegador.

## 4. Estructura de Carpetas Creadas

- `videos_descargados/` - Videos temporales descargados
- `audios_extraidos/` - Archivos MP3 finales
- `videos_procesados/` - Videos ya procesados
- `videos_procesados.txt` - Lista de videos ya procesados

## 5. Configuración Opcional

Puedes modificar `config.py` para:
- Cambiar nombres de carpetas
- Ajustar intervalo de verificación (por defecto 5 minutos)
- Modificar extensiones de video detectadas

## 6. Detener el Programa

Presiona `Ctrl+C` para detener el programa de forma segura.
