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

  autoUpdater.on("update-available", () => {
    console.log("📦 Update disponibil");
    mainWindow?.webContents.send("update_available");
  });

  autoUpdater.on("update-downloaded", () => {
    console.log("⬇️ Update descărcat");
    mainWindow?.webContents.send("update_ready");
  });

  autoUpdater.on("error", (err) => {
    console.error("❌ AutoUpdater Error:", err);
    mainWindow?.webContents.send("update_error", err.message);
  });

  autoUpdater.checkForUpdatesAndNotify();
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
function waitForServer(retries = 20, delay = 1000) {
  return new Promise((resolve, reject) => {
    const check = (attempt) => {
      fetch("http://localhost:3001")
        .then((res) => {
          if (res.ok) return resolve(true);
          throw new Error("Bad status");
        })
        .catch(() => {
          if (attempt < retries) {
            setTimeout(() => check(attempt + 1), delay);
          } else {
            reject(new Error("Server timeout"));
          }
        });
    };
    check(0);
  });
}

async function startServer() {
  const fs = require("fs");
  const logPath = path.join(app.getPath("userData"), "server-debug.log");

  function log(msg) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
    console.log(msg);
  }

  try {
    // Determinăm path-ul către server.mjs
    const serverPath = app.isPackaged
      ? path.join(process.resourcesPath, "app.asar.unpacked", "server.mjs")
      : path.join(__dirname, "server.mjs");

    log(`🔍 Server path: ${serverPath}`);
    log(`🔍 File exists: ${existsSync(serverPath)}`);
    log(`🔍 process.resourcesPath: ${process.resourcesPath}`);
    log(`🔍 __dirname: ${__dirname}`);

    if (!existsSync(serverPath)) {
      log("⚠️ server.mjs lipsă la path principal");

      // Încercăm path-uri alternative
      const altPaths = [
        path.join(process.resourcesPath, "server.mjs"),
        path.join(process.resourcesPath, "app", "server.mjs"),
        path.join(__dirname, "server.mjs"),
      ];

      for (const altPath of altPaths) {
        log(`🔍 Trying: ${altPath} - exists: ${existsSync(altPath)}`);
      }

      log("❌ server.mjs nu a fost găsit în niciun path");
      return false;
    }

    log("✅ server.mjs găsit, pornire în același proces...");

    // Convertim path-ul în file:// URL pentru import() pe Windows
    const serverUrl = pathToFileURL(serverPath);
    log(`🔍 Server URL: ${serverUrl.href}`);

    // Importăm și rulăm serverul în același proces Electron
    const serverModule = await import(serverUrl.href);
    log("✅ Server importat cu succes!");

    // Așteaptă ca serverul să devină disponibil
    await new Promise((resolve) => setTimeout(resolve, 1000));

    await waitForServer();
    log("✅ Server răspunde pe http://localhost:3001");
    
    return true;
  } catch (err) {
    log(`❌ Eroare la pornirea serverului: ${err.message}`);
    log(`❌ Stack: ${err.stack}`);
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
  const indexFile = path.join(__dirname, "dist", "index.html");

  if (existsSync(indexFile)) {
    await mainWindow.loadFile(indexFile);
  } else {
    // Development mode - Vite dev server
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