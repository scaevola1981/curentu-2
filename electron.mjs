import { app, BrowserWindow, ipcMain, Menu } from "electron";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { existsSync } from "fs";

// ==========================================
// 🧩 CONFIG DE BAZĂ
// ==========================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const { autoUpdater } = require("electron-updater");

let mainWindow = null;

app.commandLine.appendSwitch("disable-gpu-sandbox");
app.commandLine.appendSwitch("disable-software-rasterizer");

// ==========================================
// 🌐 AUTO-UPDATER
// ==========================================
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = false;

function setupAutoUpdater() {
  console.log("🔍 Verific update-uri...");

  // FORCE DEV UPDATES (User Request)
  if (!app.isPackaged) {
    autoUpdater.forceDevUpdateConfig = true;
    console.log("⚠️ Dev Mode: Force Update Config ENABLED");
  }

  autoUpdater.on("update-available", (info) => {
    console.log("📦 Update disponibil:", info.version);
    mainWindow?.webContents.send("update_available", {
      version: info.version,
      releaseDate: info.releaseDate
    });
  });

  autoUpdater.on("download-progress", (progressObj) => {
    console.log(`⬇️ Progres descărcare: ${Math.round(progressObj.percent)}%`);
    mainWindow?.webContents.send("download_progress", {
      percent: Math.round(progressObj.percent),
      transferred: progressObj.transferred,
      total: progressObj.total,
      bytesPerSecond: progressObj.bytesPerSecond
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    console.log("✅ Update descărcat:", info.version);
    mainWindow?.webContents.send("update_ready", {
      version: info.version
    });
  });

  autoUpdater.on("error", (err) => {
    console.error("❌ AutoUpdater Error:", err);
    mainWindow?.webContents.send("update_error", err.message);
  });

  autoUpdater.on("checking-for-update", () => {
    console.log("🔍 Verificare update-uri în curs...");
  });

  autoUpdater.on("update-not-available", (info) => {
    console.log("✓ Nu există update-uri disponibile. Versiune curentă:", info.version);
    mainWindow?.webContents.send("update_not_available", info);
  });

  // DISABLED: Prevents 404 errors on Mac when update server unavailable
  // autoUpdater.checkForUpdatesAndNotify();
  console.log("⚠️ Auto-update checking is DISABLED for production stability");
}

ipcMain.on("install_update", () => {
  console.log("🛠 Instalare update...");
  autoUpdater.quitAndInstall();
});

// =============================
// 🔥 TEST UPDATER (DEV ONLY)
// =============================
ipcMain.on("test-update", (_, type) => {
  if (!mainWindow) return;

  console.log("⚡ Test updater trigger:", type);

  switch (type) {
    case "available":
      mainWindow.webContents.send("update_available");
      break;
    case "ready":
      mainWindow.webContents.send("update_ready");
      break;
    case "error":
      mainWindow.webContents.send("update_error", "Eroare simulată");
      break;
  }
});

// ==========================================
// 🟦 SERVER EXPRESS
// ==========================================

async function startServer() {
  const fs = require("fs");
  const logPath = path.join(app.getPath("userData"), "server-debug.log");

  function log(msg) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
    console.log(msg);
  }

  try {
    const serverPath = app.isPackaged
      ? path.join(process.resourcesPath, "app.asar.unpacked", "server.mjs")
      : path.join(__dirname, "server.mjs");
    log(`🔍 Server path: ${serverPath}`);
    log(`🔍 File exists: ${existsSync(serverPath)}`);

    if (!existsSync(serverPath)) {
      log("⚠️ server.mjs lipsă");
      return false;
    }

    log("✅ server.mjs găsit, pornire în fundal...");

    const serverUrl = pathToFileURL(serverPath);
    log(`🔍 Server URL: ${serverUrl.href}`);

    // Importăm serverul în FUNDAL - nu așteptăm
    import(serverUrl.href)
      .then(() => {
        log("✅ Server importat cu succes!");
        log("⏳ Serverul pornește în fundal...");
      })
      .catch((err) => {
        log(`❌ Eroare import server: ${err.message}`);
      });

    // Returnăm IMEDIAT - nu așteptăm serverul
    return true;
  } catch (err) {
    log(`❌ Eroare: ${err.message}`);
    return false;
  }
}
// ==========================================
// 🪟 FEREASTRĂ PRINCIPALĂ
// ==========================================
function getIconPath() {
  const paths = [
    path.join(__dirname, "assets", "icon.ico"),
    path.join(__dirname, "assets", "icon.png"),
  ];
  return paths.find((p) => existsSync(p)) || null;
}

async function createWindow() {
  // Pornim serverul ÎNAINTE de fereastră
  process.env.USER_DATA_PATH = app.getPath("userData");
  await startServer();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    icon: getIconPath(),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  });

  // Ascundem meniul complet
  Menu.setApplicationMenu(null);

  // Afișăm fereastra când e gata
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Încărcăm UI-ul
  // În production (asar), dist/** e inclus în app.asar la calea __dirname/dist
  // În development, dist e în aceeași locație
  const indexFile = app.isPackaged
    ? path.join(__dirname, "dist", "index.html")
    : path.join(__dirname, "dist", "index.html");

  console.log(`🔍 [LOAD] app.isPackaged: ${app.isPackaged}`);
  console.log(`🔍 [LOAD] __dirname: ${__dirname}`);
  console.log(`🔍 [LOAD] indexFile path: ${indexFile}`);
  console.log(`🔍 [LOAD] File exists: ${existsSync(indexFile)}`);

  if (existsSync(indexFile)) {
    console.log(`✅ [LOAD] Loading from file: ${indexFile}`);
    await mainWindow.loadFile(indexFile);
  } else {
    // Development mode - Vite dev server
    console.log(`🌐 [LOAD] Loading from Vite dev server`);
    await mainWindow.loadURL("http://localhost:5173");
  }

  // Pornim auto-updater când UI-ul e încărcat
  setupAutoUpdater();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ==========================================
// 🔧 EVENIMENTE APLICAȚIE
// ==========================================
app.whenReady().then(createWindow);

// =============================
// 📢 IPC HANDLERS
// =============================
ipcMain.handle("get-app-version", () => app.getVersion());

ipcMain.handle("check-for-updates", async () => {
  console.log("📢 Manual update check requested");
  return autoUpdater.checkForUpdates();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (!BrowserWindow.getAllWindows().length) {
    createWindow();
  }
});

// ==========================================
// 🚨 ERORI GLOBALE
// ==========================================
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
});