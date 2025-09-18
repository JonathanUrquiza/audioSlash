# AudioSlash - Dockerfile para deployment
FROM python:3.11-slim

# Configurar directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema necesarias para moviepy
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements primero (para cache de Docker layers)
COPY requirements.txt .

# Instalar dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código de la aplicación
COPY . .

# Crear carpetas necesarias
RUN mkdir -p uploads audios

# Puerto por defecto
EXPOSE 5000

# Variables de entorno por defecto para producción
ENV FLASK_ENV=production
ENV FLASK_DEBUG=false
ENV HOST=0.0.0.0
ENV PORT=5000

# Comando para ejecutar la aplicación
CMD ["python", "app.py"]
