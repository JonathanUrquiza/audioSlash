# 🚀 Deployment Guide - AudioSlash

## Variables de Entorno Requeridas

### 📋 **Variables Obligatorias para Producción:**

| Variable | Descripción | Valor por Defecto | Ejemplo |
|----------|-------------|-------------------|---------|
| `SECRET_KEY` | Clave secreta de Flask | `audioSlash2024-cambiar-en-produccion` | `mi-clave-super-secreta-aleatoria` |
| `FLASK_ENV` | Entorno de Flask | `development` | `production` |
| `FLASK_DEBUG` | Modo debug | `true` | `false` |
| `HOST` | Host del servidor | `0.0.0.0` | `0.0.0.0` |
| `PORT` | Puerto del servidor | `5000` | `8080` |

### 📋 **Variables Opcionales:**

| Variable | Descripción | Valor por Defecto | 
|----------|-------------|-------------------|
| `UPLOAD_FOLDER` | Carpeta de uploads | `uploads` |
| `AUDIO_FOLDER` | Carpeta de audios | `audios` |
| `MAX_CONTENT_LENGTH` | Límite de archivo (bytes) | `Sin límite` |

---

## 🌐 Deployment Options

### **1. Render.com (Recomendado - Gratis)**

1. **Conectar repositorio GitHub**
2. **Configurar variables de entorno:**
   ```bash
   SECRET_KEY=tu-clave-super-secreta-aleatoria
   FLASK_ENV=production
   FLASK_DEBUG=false
   PORT=10000
   ```
3. **Comando de inicio:** `gunicorn app:app`

### **2. Railway.app**

1. **Deploy desde GitHub**
2. **Variables de entorno:** Same as Render
3. **Puerto:** Railway detecta automáticamente

### **3. DigitalOcean App Platform**

1. **Create App → GitHub**
2. **Environment Variables:** Configurar variables
3. **Run Command:** `gunicorn --bind 0.0.0.0:$PORT app:app`

### **4. Heroku**

```bash
# Instalar Heroku CLI
heroku create audioslash-app

# Configurar variables
heroku config:set SECRET_KEY=tu-clave-secreta
heroku config:set FLASK_ENV=production  
heroku config:set FLASK_DEBUG=false

# Deploy
git push heroku main
```

### **5. Docker**

```bash
# Construir imagen
docker build -t audioslash .

# Ejecutar con variables de entorno
docker run -p 5000:5000 \
  -e SECRET_KEY=tu-clave-secreta \
  -e FLASK_ENV=production \
  -e FLASK_DEBUG=false \
  audioslash
```

### **6. Docker Compose**

```bash
# Editar docker-compose.yml con tus variables
# Ejecutar
docker-compose up -d
```

---

## 🔧 Desarrollo Local

### **Con variables de entorno:**

1. **Crear archivo `.env`:**
   ```bash
   cp .env.local .env
   # Editar .env con tus configuraciones
   ```

2. **Ejecutar:**
   ```bash
   python app.py
   ```

### **Sin variables de entorno:**
```bash
# Funciona con valores por defecto
python app.py
```

---

## ⚠️ Consideraciones de Seguridad

1. **NUNCA subir archivos `.env` a Git**
2. **Cambiar SECRET_KEY en producción**
3. **Deshabilitar DEBUG en producción**
4. **Usar HTTPS en producción**
5. **Configurar límites de archivos apropiados**

---

## 🎯 Comandos de Producción

### **Gunicorn (Servidor de producción):**
```bash
# Desarrollo
gunicorn --reload app:app

# Producción
gunicorn --bind 0.0.0.0:$PORT --workers 2 app:app
```

### **Nginx + Gunicorn (VPS):**
```bash
# Configurar proxy reverso
# Ver documentación específica de tu VPS
```
