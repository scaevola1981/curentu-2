import { app, BrowserWindow, ipcMain, Menu } from "electron";
import { createRequire } from 'module';
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { existsSync } from "fs";

// ==========================================
// 🧩 CONFIG DE BAZĂ
// ==========================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const { autoUpdater } = require("electron-updater");
let mainWindow = null;
let serverProcess = null;

app.commandLine.appendSwitch("disable-gpu-sandbox");
app.commandLine.appendSwitch("disable-software-rasterizer");

// ==========================================
// 🌐 AUTO-UPDATER
// ==========================================
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = false; // instalarea va fi făcută manual după confirmare

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

  // Verifică automat după pornire
  autoUpdater.checkForUpdatesAndNotify();
}

// IPC — instalare update la cerere
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

function startServer() {
  return new Promise((resolve) => {
   const serverPath = app.isPackaged
  ? path.join(process.resourcesPath, "server.mjs")
  : path.join(__dirname, "server.mjs");

    if (!existsSync(serverPath)) {
      console.log("⚠️ server.mjs lipsă – se continuă fără server.");
      return resolve(false);
    }

    console.log("🚀 Pornim serverul Express...");

    serverProcess = spawn("node", [serverPath], {
      cwd: __dirname,
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    });

    serverProcess.stdout.on("data", (d) =>
      console.log("[SERVER]", d.toString().trim())
    );
    serverProcess.stderr.on("data", (d) =>
      console.log("[SERVER ERR]", d.toString().trim())
    );

    setTimeout(() => {
      waitForServer().finally(() => resolve(true));
    }, 2500);
  });
}

function stopServer() {
  if (serverProcess && !serverProcess.killed) {
    console.log("🛑 Oprire server...");
    serverProcess.kill("SIGTERM");
  }
}

// ==========================================
// 🪟 FEREASTRĂ PRINCIPALĂ
// ==========================================
function getIconPath() {
  const p = [
    path.join(__dirname, "assets", "icon.ico"),
    path.join(__dirname, "assets", "icon.png"),
  ];
  return p.find((x) => existsSync(x)) || null;
}

async function createWindow() {
  startServer();

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

  Menu.setApplicationMenu(null);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  const indexFile = path.join(__dirname, "dist", "index.html");

  if (existsSync(indexFile)) {
    await mainWindow.loadFile(indexFile);
  } else {
    await mainWindow.loadURL("http://localhost:5173");
  }

  // 🔥 PORNEȘTE AUTO-UPDATER CÂND UI ESTE GATA
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
  stopServer();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (!BrowserWindow.getAllWindows().length) createWindow();
});

// ==========================================
// 🚨 ERORI GLOBALE
// ==========================================
process.on("uncaughtException", (err) =>
  console.error("💥 Uncaught:", err)
);
process.on("unhandledRejection", (reason) =>
  console.error("💥 Rejected:", reason)
);
