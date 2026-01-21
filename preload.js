const { contextBridge, ipcRenderer } = require("electron");

// Wrapper sigur pentru evenimente IPC (fără memory leaks)
const createListener = (channel) => (callback) => {
  ipcRenderer.removeAllListeners(channel);
  ipcRenderer.on(channel, (_event, data) => callback(data));
};

contextBridge.exposeInMainWorld("electronAPI", {
  // ============================
  // 🔧 APLICAȚIE
  // ============================
  getVersion: () => ipcRenderer.invoke("get-app-version"),
  quitApp: () => ipcRenderer.send("quit-app"),
  reloadApp: () => ipcRenderer.send("reload-app"),

  // ============================
  // 🆕 AUTO-UPDATER
  // ============================
  onUpdateAvailable: createListener("update_available"),
  onUpdateNotAvailable: createListener("update_not_available"),
  onDownloadProgress: createListener("download_progress"),
  onUpdateDownloaded: createListener("update_downloaded"),
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  installUpdate: () => ipcRenderer.invoke("install_update"),

  // ============================
  // ℹ️ INFORMAȚII SISTEM
  // ============================
  platform: process.platform,

  // ============================
  // 🔇 STUB METHODS (prevent console errors)
  // ============================
  onAutofillEnable: () => { }, // Stub method - not implemented
  setAddresses: () => { }      // Stub method - not implemented
});

console.log("🔗 Preload OK (CommonJS)");
