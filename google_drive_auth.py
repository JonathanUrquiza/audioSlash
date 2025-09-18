import os
import pickle
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from config import SCOPES, CREDENTIALS_FILE, TOKEN_FILE

class GoogleDriveAuth:
    def __init__(self):
        self.service = None
        self.creds = None
        
    def autenticar(self):
        """Autentica con Google Drive API"""
        # Cargar credenciales existentes si existen
        if os.path.exists(TOKEN_FILE):
            with open(TOKEN_FILE, 'rb') as token:
                self.creds = pickle.load(token)
        
        # Si no hay credenciales válidas disponibles, permite al usuario autenticarse
        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                self.creds.refresh(Request())
            else:
                if not os.path.exists(CREDENTIALS_FILE):
                    print(f"ERROR: No se encontró el archivo {CREDENTIALS_FILE}")
                    print("Necesitas descargar las credenciales desde Google Cloud Console")
                    return False
                
                flow = InstalledAppFlow.from_client_secrets_file(
                    CREDENTIALS_FILE, SCOPES)
                self.creds = flow.run_local_server(port=0)
            
            # Guardar credenciales para la próxima ejecución
            with open(TOKEN_FILE, 'wb') as token:
                pickle.dump(self.creds, token)
        
        # Crear el servicio de Google Drive
        self.service = build('drive', 'v3', credentials=self.creds)
        print("✅ Autenticación exitosa con Google Drive")
        return True
    
    def obtener_servicio(self):
        """Retorna el servicio autenticado de Google Drive"""
        if not self.service:
            if not self.autenticar():
                return None
        return self.service
