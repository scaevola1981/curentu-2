import { app, BrowserWindow, ipcMain, Menu } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync, appendFileSync } from "fs";
import { fork } from "child_process";

// ==========================================
// 🧩 CONFIG DE BAZĂ
// ==========================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

app.commandLine.appendSwitch("disable-gpu-sandbox");
app.commandLine.appendSwitch("disable-software-rasterizer");

// Auto-updater removed to simplify application and prevent 404 errors

// ==========================================
// 🟦 SERVER EXPRESS
// ==========================================

// Variabilă globală pentru proces server
let serverProcess = null;

// Helper function to wait for server to be ready
async function waitForServer(log, maxAttempts = 30, delayMs = 500) {
  const http = await import('http');

  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get('http://127.0.0.1:3001/health', (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            reject(new Error(`Health check failed: ${res.statusCode}`));
          }
        });
        req.on('error', reject);
        req.setTimeout(1000);
      });

      log(`✅ Server is ready and responding! (attempt ${i + 1})`);
      return true;
    } catch (err) {
      log(`⏳ Waiting for server... attempt ${i + 1}/${maxAttempts}`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return false;
}


async function startServer() {
  const logPath = path.join(app.getPath("userData"), "server-debug.log");

  function log(msg) {
    const timestamp = new Date().toISOString();
    appendFileSync(logPath, `[${timestamp}] ${msg}\n`);
    console.log(msg);
  }

  try {
    log("🚀 [ELECTRON] Starting server initialization...");

    const serverPath = app.isPackaged
      ? path.join(process.resourcesPath, "app.asar.unpacked", "server.mjs")
      : path.join(__dirname, "server.mjs");

    log(`🔍 Server path: ${serverPath}`);
    log(`🔍 File exists: ${existsSync(serverPath)}`);

    if (!existsSync(serverPath)) {
      log("⚠️ server.mjs lipsă");
      return false;
    }

    log("✅ server.mjs găsit, pornire ca child process...");

    // SOLUTION: Fork server.mjs as child process instead of importing
    // This avoids ESM module resolution issues in ASAR
    const env = {
      ...process.env,
      USER_DATA_PATH: app.getPath("userData"),
      NODE_ENV: app.isPackaged ? "production" : "development",
    };

    log(`🔍 Forking server with USER_DATA_PATH: ${env.USER_DATA_PATH}`);

    serverProcess = fork(serverPath, [], {
      env,
      stdio: ["pipe", "pipe", "pipe", "ipc"],
      execArgv: [], // Clear execArgv to avoid issues
    });

    // Log server output
    serverProcess.stdout.on("data", (data) => {
      const msg = data.toString().trim();
      log(`[SERVER] ${msg}`);
    });

    serverProcess.stderr.on("data", (data) => {
      const msg = data.toString().trim();
      log(`[SERVER ERROR] ${msg}`);
    });

    serverProcess.on("error", (err) => {
      log(`❌ Server process error: ${err.message}`);
      console.error("❌ Server process error:", err);
    });

    serverProcess.on("exit", (code, signal) => {
      log(`⚠️ Server process exited with code ${code}, signal ${signal}`);
    });

    // Active health check instead of fixed timeout
    log("⏳ Waiting for server to be ready...");
    const serverReady = await waitForServer(log);

    if (!serverReady) {
      log("❌ Server failed to respond after maximum attempts");
      return false;
    }

    log("✅ Server process started and verified ready!");
    return true;
  } catch (err) {
    log(`❌ Eroare: ${err.message}`);
    log(`❌ Stack: ${err.stack}`);
    console.error("❌ StartServer error:", err);
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

    // 🔧 DEBUGGING: Deschide DevTools AUTOMAT în production
    // TODO: Remove this after debugging is complete
    console.log("🔍 Opening DevTools for debugging...");
    mainWindow.webContents.openDevTools();
  });

  // 🔧 DEV TOOLS: Multiple shortcuts pentru deschidere consolă
  mainWindow.webContents.on("before-input-event", (event, input) => {
    // F12, Ctrl+Shift+I, sau Ctrl+Shift+J
    if (
      input.key === "F12" ||
      (input.control && input.shift && input.key === "I") ||
      (input.control && input.shift && input.key === "J")
    ) {
      mainWindow.webContents.toggleDevTools();
    }
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
  // Kill server process when app closes
  if (serverProcess) {
    serverProcess.kill();
  }

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