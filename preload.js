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
  onDownloadProgress: createListener("download_progress"),
  onUpdateReady: createListener("update_ready"),
  onUpdateNotAvailable: createListener("update_not_available"), // Missing listener added
  onUpdateError: createListener("update_error"),
  installUpdate: () => ipcRenderer.send("install_update"),

  // ============================
  // ℹ️ INFORMAȚII SISTEM
  // ============================
  platform: process.platform,

  // TEST UPDATER 🔥
  testUpdate: (type) => ipcRenderer.send("test-update", type),

  // REAL UPDATE CHECK
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates")
});

console.log("🔗 Preload OK (CommonJS)");
