import { app } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detectează dacă rulează în Electron sau Node.js standalone
const isElectron = typeof app !== 'undefined';

// Path persistent pentru date (AppData pe Windows, ~/.config pe Linux)
const getDataPath = () => {
  if (isElectron && app.isPackaged) {
    // Production: AppData
    return app.getPath('userData');
  } else if (isElectron) {
    // Development Electron
    return path.join(process.cwd(), 'Stocare');
  } else {
    // Node.js standalone (npm run dev server)
    return __dirname;
  }
};

const DATA_PATH = getDataPath();

// Asigură-te că directorul există
if (!fs.existsSync(DATA_PATH)) {
  fs.mkdirSync(DATA_PATH, { recursive: true });
}

export { DATA_PATH };