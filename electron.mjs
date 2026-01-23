import { app, BrowserWindow, ipcMain, Menu } from "electron";
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
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

// ==========================================
// 🔄 AUTO-UPDATER CONFIGURATION
// ==========================================
// Configure logger to write to server debug log
autoUpdater.logger = {
  info: (msg) => {
    const logPath = path.join(app.getPath("userData"), "server-debug.log");
    appendFileSync(logPath, `[UPDATER INFO] ${msg}\n`);
    console.log(`[UPDATER] ${msg}`);
  },
  warn: (msg) => {
    const logPath = path.join(app.getPath("userData"), "server-debug.log");
    appendFileSync(logPath, `[UPDATER WARN] ${msg}\n`);
    console.warn(`[UPDATER] ${msg}`);
  },
  error: (msg) => {
    const logPath = path.join(app.getPath("userData"), "server-debug.log");
    appendFileSync(logPath, `[UPDATER ERROR] ${msg}\n`);
    console.error(`[UPDATER] ${msg}`);
  },
  debug: (msg) => {
    const logPath = path.join(app.getPath("userData"), "server-debug.log");
    appendFileSync(logPath, `[UPDATER DEBUG] ${msg}\n`);
    console.debug(`[UPDATER] ${msg}`);
  }
};

// Security: Only check for updates in production mode
autoUpdater.autoDownload = false; // 🛑 Disable auto-download (manual only)
autoUpdater.autoInstallOnAppQuit = true;

// Auto-updater events
autoUpdater.on('update-available', (info) => {
  console.log('🔄 Update available:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update_available', info);
  }
});

autoUpdater.on('update-not-available', (info) => {
  console.log('✅ App is up to date:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update_not_available', info);
  }
});

autoUpdater.on('download-progress', (progress) => {
  const msg = `Downloaded ${progress.percent.toFixed(2)}% (${progress.transferred}/${progress.total})`;
  console.log('📥', msg);
  if (mainWindow) {
    mainWindow.webContents.send('download_progress', progress);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('✅ Update downloaded:', info.version);
  if (mainWindow) {
    mainWindow.webContents.send('update_downloaded', info);
  }
});

autoUpdater.on('error', (err) => {
  console.error('❌ Update error:', err);
  if (mainWindow) {
    mainWindow.webContents.send('update_error', err.message);
  }
});

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

  // ✅ Prevent double-start (in-memory check)
  if (serverProcess) {
    log("⚠️ [ELECTRON] Server process checks indicate it is already running (in-memory). Skipping start.");
    return true;
  }

  // ✅ Pre-flight port check: Detect zombie servers from previous runs
  try {
    const http = await import('http');
    await new Promise((resolve, reject) => {
      const req = http.get('http://127.0.0.1:3001/health', (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          reject(new Error(`Unexpected status: ${res.statusCode}`));
        }
      });
      req.on('error', reject);
      req.setTimeout(500);
    });
    // If we reach here, port 3001 is already responding
    console.log("[ELECTRON] ⚠️ Pre-flight check: Port 3001 already responding. Assuming zombie server exists. Skipping fork.");
    return true; // Server already running from previous session
  } catch (e) {
    // Port not in use - this is expected, continue to start server
    console.log("[ELECTRON] ✅ Pre-flight check: Port 3001 is free. Proceeding to start server.");
  }

  try {
    // 🧹 LOG ROTATION: Rename old log if exists
    if (existsSync(logPath)) {
      const oldLogPath = path.join(app.getPath("userData"), "server-debug.old.log");
      try {
        if (existsSync(oldLogPath)) {
          // Optional: delete very old log or just overwrite
          // fs.unlinkSync(oldLogPath); 
        }
        // Rename current to old (overwrite)
        import('fs').then(fs => fs.renameSync(logPath, oldLogPath));
        console.log(`[ELECTRON] 🔄 Log rotated: server-debug.log -> server-debug.old.log`);
      } catch (e) {
        console.error(`[ELECTRON] ⚠️ Log rotation failed: ${e.message}`);
      }
    }

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
      serverProcess = null; // ✅ Reset global variable
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

    // 🔧 DEBUGGING: Deschide DevTools DOAR în development
    if (!app.isPackaged) {
      console.log("🔍 Opening DevTools for development...");
      mainWindow.webContents.openDevTools();
    }
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

  // ✅ CONSTANT FIX: Prioritize Dev Server in Development Mode
  if (!app.isPackaged && process.env.NODE_ENV === 'development') {
    console.log(`🌐 [LOAD] Loading from Vite dev server (DEVELOPMENT)`);
    await mainWindow.loadURL("http://localhost:5173");
  } else if (existsSync(indexFile)) {
    console.log(`✅ [LOAD] Loading from file: ${indexFile}`);
    await mainWindow.loadFile(indexFile);
  } else {
    // Fallback or error
    console.log(`🌐 [LOAD] Loading from Vite dev server (Fallback)`);
    await mainWindow.loadURL("http://localhost:5173");
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Check for updates automatically after window is created (production only)
  if (app.isPackaged) {
    setTimeout(() => {
      console.log('[UPDATER] Checking for updates...');
      autoUpdater.checkForUpdatesAndNotify();
    }, 3000); // Wait 3 seconds for server to stabilize
  }
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
  if (!app.isPackaged) {
    console.log("⚠️ Updates disabled in development mode");
    return { status: "disabled", message: "Updates disabled in dev mode" };
  }
  
  try {
    const result = await autoUpdater.checkForUpdates();
    // ⚠️ CRITICAL FIX: Return simple object, NOT the full result (contains complex types)
    return result ? { version: result.updateInfo.version } : null;
  } catch (e) {
    console.error("Update check failed:", e);
    throw new Error(e.message);
  }
});

// 🆕 Print to PDF
ipcMain.handle("print-to-pdf", async (event, htmlContent, title) => {
  console.log("📢 Print to PDF requested:", title);
  
  // Create a hidden window for rendering
  let printWindow = new BrowserWindow({
    show: false,
    width: 800,
    height: 1200, // A4 aspect ratio approx
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      offscreen: true // Enable offscreen rendering
    }
  });

  try {
    // Load the HTML content
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
             /* Add basic print styles */
             body { background: white; margin: 0; padding: 0; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;
    
    // Load content directly via data URL to avoid file IO overhead for temp files
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    
    // Generate PDF
    const data = await printWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { top: 0, bottom: 0, left: 0, right: 0 } // Margins are handled by CSS in printReport
    });
    
    // Save file
    const fs = await import('fs');
    const path = await import('path');
    const downloadsPath = app.getPath('downloads');
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${safeTitle}_${Date.now()}.pdf`;
    const filePath = path.join(downloadsPath, filename);
    
    fs.writeFileSync(filePath, data);
    console.log(`✅ PDF saved to: ${filePath}`);
    
    // Clean up
    printWindow.close();
    printWindow = null;
    
    return { success: true, filePath };
  } catch (error) {
    console.error("❌ PDF Generation Error:", error);
    if (printWindow) printWindow.close();
    throw error;
  }
});

// 🆕 Start download manually
ipcMain.handle("start-download", () => {
  console.log("📢 Start download requested");
  autoUpdater.downloadUpdate();
});


ipcMain.handle("install_update", () => {
  console.log("📢 Install update requested");
  autoUpdater.quitAndInstall();
});

// ✅ Improved cleanup to prevent EADDRINUSE
app.on("before-quit", () => {
  if (serverProcess) {
    console.log("[ELECTRON] 🛑 before-quit: Killing server process...");
    serverProcess.kill();
    serverProcess = null;
  }
});

app.on("window-all-closed", () => {
  // Kill server process when app closes (Mac behavior compatibility)
  if (serverProcess) {
    console.log("[ELECTRON] 🛑 window-all-closed: Killing server process...");
    serverProcess.kill();
    serverProcess = null;
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
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