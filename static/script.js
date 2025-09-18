// Variables globales
let currentJobId = null;
let progressInterval = null;

// Elementos del DOM
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const progressSection = document.getElementById('progress-section');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const progressMessage = document.getElementById('progress-message');
const resultSection = document.getElementById('result-section');
const errorSection = document.getElementById('error-section');
const errorMessage = document.getElementById('error-message');
const downloadBtn = document.getElementById('download-btn');
const retryBtn = document.getElementById('retry-btn');
const audioList = document.getElementById('audio-list');
const deleteAllBtn = document.getElementById('delete-all-btn');

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    clearCacheAndReset();
    loadAudioList();
});

// Limpiar caché al refrescar la página
window.addEventListener('beforeunload', function() {
    clearAllData();
});

// Resetear completamente al cargar la página
window.addEventListener('load', function() {
    clearCacheAndReset();
});

function setupEventListeners() {
    // Drag & Drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // File input
    fileInput.addEventListener('change', handleFileSelect);
    
    // Botones
    retryBtn.addEventListener('click', resetInterface);
    deleteAllBtn.addEventListener('click', deleteAllAudios);
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

function processFile(file) {
    // Validar archivo
    if (!isValidVideoFile(file)) {
        showError('Formato de archivo no válido. Solo se permiten videos.');
        return;
    }
    
    // Sin límite de tamaño - permite videos de cualquier tamaño
    // Nota: Videos muy grandes tardarán más en procesarse
    
    uploadFile(file);
}

function isValidVideoFile(file) {
    const validTypes = [
        'video/mp4', 'video/avi', 'video/quicktime', 
        'video/x-msvideo', 'video/x-matroska', 'video/webm'
    ];
    return validTypes.includes(file.type) || 
           /\.(mp4|avi|mov|mkv|wmv|flv|webm)$/i.test(file.name);
}

function uploadFile(file) {
    const formData = new FormData();
    formData.append('video', file);
    
    // Mostrar progreso
    showProgress();
    updateProgress(0, 'Subiendo archivo...');
    
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        
        currentJobId = data.job_id;
        startProgressTracking();
    })
    .catch(error => {
        showError(error.message);
    });
}

function startProgressTracking() {
    progressInterval = setInterval(checkProgress, 1000);
}

function checkProgress() {
    if (!currentJobId) return;
    
    fetch(`/progress/${currentJobId}`)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        
        updateProgress(data.progress, data.message);
        
        if (data.status === 'completed') {
            clearInterval(progressInterval);
            showResult(data.audio_file);
            loadAudioList(); // Actualizar lista
        } else if (data.status === 'error') {
            clearInterval(progressInterval);
            showError(data.message);
        }
    })
    .catch(error => {
        clearInterval(progressInterval);
        showError(error.message);
    });
}

function showProgress() {
    hideAllSections();
    progressSection.style.display = 'block';
}

function updateProgress(percent, message) {
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${percent}%`;
    progressMessage.textContent = message;
}

function showResult(audioFileName) {
    hideAllSections();
    resultSection.style.display = 'block';
    
    downloadBtn.onclick = () => {
        window.open(`/download/${audioFileName}`, '_blank');
    };
}

function showError(message) {
    hideAllSections();
    errorSection.style.display = 'block';
    errorMessage.textContent = message;
}

function hideAllSections() {
    progressSection.style.display = 'none';
    resultSection.style.display = 'none';
    errorSection.style.display = 'none';
}

function resetInterface() {
    hideAllSections();
    currentJobId = null;
    if (progressInterval) {
        clearInterval(progressInterval);
    }
    fileInput.value = '';
}

function loadAudioList() {
    fetch('/audios')
    .then(response => response.json())
    .then(audios => {
        if (audios.error) {
            console.error('Error cargando archivos:', audios.error);
            return;
        }
        
        displayAudioList(audios);
    })
    .catch(error => {
        console.error('Error cargando lista de audios:', error);
    });
}

function displayAudioList(audios) {
    if (audios.length === 0) {
        audioList.innerHTML = '<p class="no-files">No hay archivos de audio aún</p>';
        deleteAllBtn.style.display = 'none';
        return;
    }
    
    // Mostrar el botón "Borrar todos" si hay archivos
    deleteAllBtn.style.display = 'flex';
    
    const audioItems = audios.map(audio => `
        <div class="audio-item" data-filename="${audio.name}">
            <div class="audio-info">
                <i class="fas fa-music"></i>
                <div>
                    <div class="audio-name">${audio.name}</div>
                    <div class="audio-size">${formatFileSize(audio.size)}</div>
                </div>
            </div>
            <div class="audio-actions">
                <a href="${audio.url}" class="download-link" onclick="handleDownload('${audio.name}')">
                    <i class="fas fa-download"></i> Descargar
                </a>
                <button class="delete-btn" onclick="deleteAudio('${audio.name}')">
                    <i class="fas fa-trash"></i> Borrar
                </button>
            </div>
        </div>
    `).join('');
    
    audioList.innerHTML = audioItems;
}

function handleDownload(filename) {
    // Mostrar mensaje de que se eliminará después de la descarga
    const audioItem = document.querySelector(`[data-filename="${filename}"]`);
    if (audioItem) {
        const downloadLink = audioItem.querySelector('.download-link');
        downloadLink.innerHTML = '<i class="fas fa-download"></i> Descargando...';
        downloadLink.style.opacity = '0.6';
    }
    
    // Actualizar lista después de un breve delay (tiempo para que se complete la descarga)
    setTimeout(() => {
        loadAudioList();
        showTemporaryMessage('Archivo descargado y eliminado del servidor por seguridad');
    }, 2000);
}

function showTemporaryMessage(message, type = 'success') {
    // Crear elemento de mensaje temporal
    const messageDiv = document.createElement('div');
    messageDiv.className = 'temporary-message';
    messageDiv.textContent = message;
    
    // Definir colores según el tipo
    const backgroundColor = type === 'error' ? '#f44336' : '#4CAF50';
    
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(messageDiv);
    
    // Eliminar mensaje después de 3 segundos (4 segundos para errores)
    const timeout = type === 'error' ? 4000 : 3000;
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, timeout);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function clearCacheAndReset() {
    // Limpiar localStorage si existe
    if (typeof(Storage) !== "undefined") {
        localStorage.clear();
    }
    
    // Limpiar sessionStorage
    if (typeof(Storage) !== "undefined") {
        sessionStorage.clear();
    }
    
    // Resetear variables globales
    currentJobId = null;
    
    // Limpiar intervalos activos
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
    
    // Resetear interfaz
    resetInterface();
    
    // Limpiar input de archivo
    if (fileInput) {
        fileInput.value = '';
    }
    
    // Remover clases de drag
    if (uploadArea) {
        uploadArea.classList.remove('dragover');
    }
    
    // Limpiar mensajes temporales existentes
    const tempMessages = document.querySelectorAll('.temporary-message');
    tempMessages.forEach(msg => {
        if (msg.parentNode) {
            msg.parentNode.removeChild(msg);
        }
    });
    
    console.log('🧹 Caché limpiado y aplicación reseteada');
}

function deleteAudio(filename) {
    // Confirmar antes de borrar
    if (!confirm(`¿Estás seguro de que quieres borrar "${filename}"?`)) {
        return;
    }
    
    // Mostrar indicador de carga en el botón
    const audioItem = document.querySelector(`[data-filename="${filename}"]`);
    const deleteBtn = audioItem?.querySelector('.delete-btn');
    
    if (deleteBtn) {
        deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Borrando...';
        deleteBtn.disabled = true;
    }
    
    fetch(`/delete/${filename}`)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Mostrar mensaje de éxito
        showTemporaryMessage(`Archivo "${filename}" eliminado correctamente`);
        
        // Recargar la lista
        loadAudioList();
    })
    .catch(error => {
        console.error('Error borrando archivo:', error);
        showTemporaryMessage('Error borrando el archivo', 'error');
        
        // Restaurar el botón
        if (deleteBtn) {
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Borrar';
            deleteBtn.disabled = false;
        }
    });
}

function deleteAllAudios() {
    // Confirmar antes de borrar todos los archivos
    if (!confirm('¿Estás seguro de que quieres borrar TODOS los archivos de audio?\n\nEsta acción también limpiará el caché del servidor.')) {
        return;
    }
    
    // Mostrar indicador de carga en el botón
    deleteAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Borrando...';
    deleteAllBtn.disabled = true;
    
    fetch('/delete-all-audios', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Mostrar mensaje de éxito
        showTemporaryMessage(`${data.files_deleted} archivos eliminados y caché limpiado`);
        
        // Recargar la lista
        loadAudioList();
    })
    .catch(error => {
        console.error('Error borrando archivos:', error);
        showTemporaryMessage('Error borrando los archivos', 'error');
    })
    .finally(() => {
        // Restaurar el botón
        deleteAllBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Borrar todos';
        deleteAllBtn.disabled = false;
    });
}

function clearAllData() {
    // Cancelar cualquier trabajo en progreso
    if (currentJobId && progressInterval) {
        clearInterval(progressInterval);
        console.log('🛑 Trabajo cancelado por recarga de página');
    }
    
    // Limpiar caché del servidor
    fetch('/clear-cache', {
        method: 'POST'
    }).catch(error => {
        console.log('⚠️ Error limpiando caché del servidor:', error);
    });
    
    // Limpiar datos temporales
    currentJobId = null;
    progressInterval = null;
}
