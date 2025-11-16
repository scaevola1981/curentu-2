import { contextBridge, ipcRenderer } from "electron";

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
  onUpdateReady: createListener("update_ready"),
  onUpdateError: createListener("update_error"),
  installUpdate: () => ipcRenderer.send("install_update"),

  // ============================
  // ℹ️ INFORMAȚII SISTEM
  // ============================
  platform: process.platform,
  isDev: process.env.NODE_ENV === "development",
});

contextBridge.exposeInMainWorld("electronAPI", {
  getVersion: () => ipcRenderer.invoke("get-app-version"),
  quitApp: () => ipcRenderer.send("quit-app"),
  reloadApp: () => ipcRenderer.send("reload-app"),

  // TEST UPDATER 🔥
  testUpdate: (type) => ipcRenderer.send("test-update", type)
});

console.log("🔗 Preload OK");


console.log("🛡️ Preload loaded (contextIsolation active)");
