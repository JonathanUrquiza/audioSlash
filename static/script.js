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

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadAudioList();
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
        return;
    }
    
    const audioItems = audios.map(audio => `
        <div class="audio-item" data-filename="${audio.name}">
            <div class="audio-info">
                <i class="fas fa-music"></i>
                <div>
                    <div class="audio-name">${audio.name}</div>
                    <div class="audio-size">${formatFileSize(audio.size)}</div>
                </div>
            </div>
            <a href="${audio.url}" class="download-link" onclick="handleDownload('${audio.name}')">
                <i class="fas fa-download"></i> Descargar
            </a>
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

function showTemporaryMessage(message) {
    // Crear elemento de mensaje temporal
    const messageDiv = document.createElement('div');
    messageDiv.className = 'temporary-message';
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(messageDiv);
    
    // Eliminar mensaje después de 3 segundos
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
