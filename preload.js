import { contextBridge, ipcRenderer } from 'electron';

// Expune API-uri sigure către renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Obține versiunea aplicației
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Control aplicație
  quitApp: () => ipcRenderer.send('quit-app'),
  reloadApp: () => ipcRenderer.send('reload-app'),
  
  // Informații sistem
  platform: process.platform,
  isDev: process.env.NODE_ENV === 'development'
});

console.log('🔗 Preload script loaded successfully');