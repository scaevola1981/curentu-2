import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let serverProcess = null;

// Configurație optimizată
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');

// Funcție simplificată pentru verificare server
function waitForServer(retries = 20, delay = 1000) {
  return new Promise((resolve, reject) => {
    const checkServer = (attempt = 0) => {
      // Folosim fetch cu timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      fetch('http://localhost:3001', { signal: controller.signal })
        .then(response => {
          clearTimeout(timeoutId);
          if (response.ok) {
            console.log('✅ Serverul Express rulează pe portul 3001');
            resolve(true);
          } else {
            throw new Error(`Server returned status: ${response.status}`);
          }
        })
        .catch(() => {
          clearTimeout(timeoutId);
          if (attempt < retries) {
            console.log(`⏳ Aștept serverul... (${attempt + 1}/${retries})`);
            setTimeout(() => checkServer(attempt + 1), delay);
          } else {
            reject(new Error('Serverul nu a pornit după ' + retries + ' încercări'));
          }
        });
    };
    checkServer();
  });
}

// Pornire server îmbunătățită
function startServer() {
  return new Promise((resolve, reject) => {
    try {
      const serverPath = path.join(__dirname, 'server.mjs');
      
      if (!existsSync(serverPath)) {
        console.warn('⚠️ server.mjs nu a fost găsit, serverul nu va porni');
        resolve(false);
        return;
      }

      console.log('🚀 Pornesc serverul Express...');
      serverProcess = spawn('node', [serverPath], {
        cwd: __dirname,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });

      // Logging pentru debug
      serverProcess.stdout.on('data', (data) => {
        console.log(`[Server] ${data.toString().trim()}`);
      });

      serverProcess.stderr.on('data', (data) => {
        console.error(`[Server Error] ${data.toString().trim()}`);
      });

      serverProcess.on('error', (error) => {
        console.error('❌ Eroare la pornirea serverului:', error);
        reject(error);
      });

      serverProcess.on('exit', (code) => {
        console.log(`Serverul s-a închis cu codul: ${code}`);
      });

      // Așteptă mai mult pentru server
      setTimeout(() => {
        waitForServer()
          .then(() => resolve(true))
          .catch(error => {
            console.warn('⚠️ Serverul nu a răspuns, dar continuăm:', error.message);
            resolve(false); // Nu reject, continuă fără server
          });
      }, 3000);

    } catch (error) {
      console.error('❌ Eroare la configurarea serverului:', error);
      reject(error);
    }
  });
}

// Oprire server
function stopServer() {
  if (serverProcess && !serverProcess.killed) {
    console.log('🛑 Oprește serverul Express...');
    serverProcess.kill('SIGTERM');
    
    // Forțează oprirea după 3 secunde
    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
    }, 3000);
    
    serverProcess = null;
  }
}

// Cale icon
function getIconPath() {
  const paths = [
    path.join(__dirname, 'assets', 'icon.ico'),
    path.join(__dirname, 'assets', 'icon.png'),
    path.join(__dirname, 'public', 'Imagini', 'icon.ico'),
    path.join(__dirname, 'public', 'icon.ico')
  ];
  
  const foundPath = paths.find(p => existsSync(p));
  console.log(foundPath ? `✅ Icon găsit: ${foundPath}` : '⚠️ Icon nu a fost găsit');
  return foundPath;
}

// Creare fereastră principală
async function createWindow() {
  console.log('🪟 Creare fereastră principală...');

  // Încearcă să pornească serverul (non-blocking)
  startServer().catch(error => {
    console.warn('⚠️ Serverul nu a pornit:', error.message);
  });

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    icon: getIconPath(),
    titleBarStyle: 'default',
    autoHideMenuBar: true
  });

  // Ascunde meniul default
  Menu.setApplicationMenu(null);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('✅ Fereastra afișată');
  });

  // Gestionare erori la încărcare
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Eroare la încărcare:', errorCode, errorDescription);
  });

  // Încarcă aplicația
  try {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    
    if (existsSync(indexPath)) {
      await mainWindow.loadFile(indexPath);
      console.log('✅ Aplicația React încărcată din build-ul de producție');
    } else {
      // Fallback la dev server sau pagină de eroare
      try {
        await mainWindow.loadURL('http://localhost:5173');
        console.log('✅ Încărcat de la dev server Vite');
      } catch (err) {
        await mainWindow.loadURL(`data:text/html;charset=utf-8,
          <html><body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1>🚨 Aplicația nu este construită</h1>
            <p>Rulează <code>npm run build:react</code> pentru a construi aplicația.</p>
            <p>Eroare: dist/index.html nu a fost găsit</p>
          </body></html>
        `);
      }
    }
  } catch (error) {
    console.error('❌ Eroare critică la încărcare:', error);
    showErrorWindow(error.message);
  }

  // Event listeners
  mainWindow.on('closed', () => {
    console.log('🪟 Fereastra închisă');
    mainWindow = null;
  });

  // Securitate
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}

// Fereastră de eroare simplificată
function showErrorWindow(message) {
  const errorWindow = new BrowserWindow({
    width: 600,
    height: 400,
    modal: true,
    parent: mainWindow,
    alwaysOnTop: true
  });

  errorWindow.loadURL(`data:text/html;charset=utf-8,
    <html>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          padding: 40px; 
          text-align: center; 
          background: #f8f9fa;
        }
        h1 { color: #dc3545; }
        .error { 
          background: #fff; 
          padding: 20px; 
          border-radius: 8px; 
          border: 1px solid #dee2e6;
          margin: 20px 0;
        }
        button { 
          padding: 10px 20px; 
          margin: 5px; 
          border: none; 
          border-radius: 4px;
          cursor: pointer;
        }
        .quit { background: #dc3545; color: white; }
        .reload { background: #28a745; color: white; }
      </style>
      <body>
        <h1>⚠️ Eroare</h1>
        <div class="error">${message}</div>
        <button class="reload" onclick="location.reload()">Reîncarcă</button>
        <button class="quit" onclick="window.close()">Închide</button>
      </body>
    </html>
  `);
}

// IPC Handlers
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.on('quit-app', () => {
  console.log('🛑 Închidere aplicație solicitată');
  app.quit();
});
ipcMain.on('reload-app', () => {
  console.log('🔄 Reîncărcare aplicație');
  mainWindow?.reload();
});

// Event handlers aplicație
app.whenReady().then(() => {
  console.log('🚀 Aplicația Electron este gata');
  createWindow();
});

app.on('window-all-closed', () => {
  console.log('🔚 Toate ferestrele închise');
  stopServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', (event) => {
  console.log('🛑 Închidere aplicație...');
  stopServer();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Gestionare erori globale
process.on('uncaughtException', (error) => {
  console.error('💥 Eroare neașteptată:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promise respinsă:', reason);
});