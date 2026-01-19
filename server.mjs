import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname } from "path";
import { existsSync, mkdirSync, copyFileSync, writeFileSync, readFileSync } from "fs";
import os from "os";

// ==========================================
// 🔧 PATH CONFIGURATION
// ==========================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3001;
let isDev = !process.env.USER_DATA_PATH || process.env.NODE_ENV === 'development';

console.log(`[SERVER] 🚀 Starting in ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);

// ==========================================
// 📂 STORAGE PATHS - FIXED FOR WINDOWS
// ==========================================
let storagePath;
let modulesPath;

if (isDev) {
  storagePath = path.join(__dirname, "Stocare");
  modulesPath = storagePath;
  console.log(`[SERVER] 🔧 DEV MODE - Storage: ${storagePath}`);
} else {
  // PRODUCTION: Force use %APPDATA%/curentu-app/Stocare
  storagePath = path.join(process.env.USER_DATA_PATH, "Stocare");

  // Modules are in app.asar.unpacked
  const unpackedBase = path.join(process.resourcesPath, 'app.asar.unpacked');
  const possiblePaths = [
    path.join(unpackedBase, 'Stocare'),
    path.join(unpackedBase, 'dist', 'Stocare'),
    path.join(process.resourcesPath, 'Stocare')
  ];

  modulesPath = possiblePaths.find(p => existsSync(p)) || possiblePaths[0];
  console.log(`[SERVER] 📦 PROD MODE - Storage: ${storagePath}`);
  console.log(`[SERVER] 📦 PROD MODE - Modules: ${modulesPath}`);
}

// Ensure storage directory exists
if (!existsSync(storagePath)) {
  mkdirSync(storagePath, { recursive: true });
  console.log(`[SERVER] 📁 Created storage directory: ${storagePath}`);
}

const dbPath = path.join(storagePath, "db.json");
const backupsDir = path.join(storagePath, "backups");

// ==========================================
// 🗄️ INLINE DATABASE OPERATIONS
// ==========================================

// Default data structures
const DEFAULT_DATA = {
  materiiPrime: [
    { id: 1, denumire: "Malt Pale Ale", cantitate: 1000, unitate: "kg", tip: "malt", producator: "Generic", codProdus: "MALT-01", lot: "INIT-001" },
    { id: 2, denumire: "Malt", cantitate: 500, unitate: "kg", tip: "malt", producator: "Generic", codProdus: "MALT-02", lot: "INIT-002" },
    { id: 3, denumire: "Drojdie BE 256", cantitate: 5, unitate: "kg", tip: "drojdie", producator: "Fermentis", codProdus: "YEAST-01", lot: "INIT-003" },
    { id: 4, denumire: "Drojdie F2", cantitate: 5, unitate: "kg", tip: "drojdie", producator: "Fermentis", codProdus: "YEAST-02", lot: "INIT-004" },
    { id: 5, denumire: "Drojdie Fermentis U.S 05", cantitate: 5, unitate: "kg", tip: "drojdie", producator: "Fermentis", codProdus: "YEAST-03", lot: "INIT-005" },
    { id: 6, denumire: "Hamei Bitter", cantitate: 10, unitate: "kg", tip: "hamei", producator: "Generic", codProdus: "HOPS-01", lot: "INIT-006" },
    { id: 7, denumire: "Hamei Aroma", cantitate: 10, unitate: "kg", tip: "hamei", producator: "Generic", codProdus: "HOPS-02", lot: "INIT-007" },
    { id: 8, denumire: "Zahar brun", cantitate: 50, unitate: "kg", tip: "aditiv", producator: "Generic", codProdus: "ADD-01", lot: "INIT-008" },
    { id: 9, denumire: "Irish Moss", cantitate: 5, unitate: "kg", tip: "aditiv", producator: "Generic", codProdus: "ADD-02", lot: "INIT-009" }
  ],
  /* COPIAT EXACT DIN materialeAmbalare.json */
  materialeAmbalare: [
    { id: 1, denumire: "Sticle 0.33l", tip: "sticle", cantitate: 1012, unitate: "buc", producator: "Generic Packaging", codProdus: "STICLA-001", lot: "", subcategorie: "" },
    { id: 2, denumire: "Cutii 6 sticle", tip: "cutii", cantitate: 1089, unitate: "buc", producator: "Generic Packaging", codProdus: "CUTIE-001", lot: "", subcategorie: "" },
    { id: 3, denumire: "Cutii 12 sticle", tip: "cutii", cantitate: 784, unitate: "buc", producator: "Generic Packaging", codProdus: "CUTIE-002", lot: "", subcategorie: "" },
    { id: 4, denumire: "Cutii 24 sticle", tip: "cutii", cantitate: 635, unitate: "buc", producator: "Generic Packaging", codProdus: "CUTIE-003", lot: "", subcategorie: "" },
    { id: 5, denumire: "Keg 10l", tip: "keg", cantitate: 19, unitate: "buc", producator: "Generic Kegs", codProdus: "KEG-001", lot: "", subcategorie: "" },
    { id: 6, denumire: "Keg 20l", tip: "keg", cantitate: 77, unitate: "buc", producator: "Generic Kegs", codProdus: "KEG-002", lot: "", subcategorie: "" },
    { id: 7, denumire: "Keg 30l", tip: "keg", cantitate: 100, unitate: "buc", producator: "Generic Kegs", codProdus: "KEG-003", lot: "", subcategorie: "" },
    { id: 8, denumire: "Keg 40l", tip: "keg", cantitate: 64, unitate: "buc", producator: "Generic Kegs", codProdus: "KEG-004", lot: "", subcategorie: "" },
    { id: 9, denumire: "Keg 50l", tip: "keg", cantitate: 100, unitate: "buc", producator: "Generic Kegs", codProdus: "KEG-005", lot: "", subcategorie: "" },
    { id: 10, denumire: "Etichete", tip: "etichete", cantitate: 3017, unitate: "buc", producator: "Generic Labels", codProdus: "ETICHETA-001", lot: "", subcategorie: "" },
    { id: 11, denumire: "Capace", tip: "capace", cantitate: 3517, unitate: "buc", producator: "Generic Caps", codProdus: "CAPAC-001", lot: "", subcategorie: "" }
  ],
  fermentatoare: [
    { id: 1, nume: "Fermentator 1", capacitate: 1000, ocupat: false, reteta: null, cantitate: 0, dataInceput: null, imagine: "/Imagini/fermentator.png" },
    { id: 2, nume: "Fermentator 2", capacitate: 1000, ocupat: false, reteta: null, cantitate: 0, dataInceput: null, imagine: "/Imagini/fermentator.png" },
    { id: 3, nume: "Fermentator 3", capacitate: 1000, ocupat: false, reteta: null, cantitate: 0, dataInceput: null, imagine: "/Imagini/fermentator.png" },
    { id: 4, nume: "Fermentator 4", capacitate: 1000, ocupat: false, reteta: null, cantitate: 0, dataInceput: null, imagine: "/Imagini/fermentator.png" },
    { id: 5, nume: "Fermentator 5", capacitate: 2000, ocupat: false, reteta: null, cantitate: 0, dataInceput: null, imagine: "/Imagini/fermentator.png" },
    { id: 6, nume: "Fermentator 6", capacitate: 2000, ocupat: false, reteta: null, cantitate: 0, dataInceput: null, imagine: "/Imagini/fermentator.png" }
  ],
  reteteBere: [
    {
      id: 1, denumire: "ADAPTOR LA SITUATIE - CB 01", tip: "Blondă",
      concentratieMust: "12 ±0.50°Plato", concentratieAlcool: "5 ±0.5% vol",
      image: "/adaptor.png", durata: 0, rezultat: { cantitate: 1000, unitate: "litri" },
      ingrediente: [
        { denumire: "Malt Pale Ale", cantitate: 400, unitate: "kg", tip: "malt", id: 1 },
        { denumire: "Zahar brun", cantitate: 20, unitate: "kg", tip: "aditiv", id: 8 },
        { denumire: "Drojdie BE 256", cantitate: 0.5, unitate: "kg", tip: "drojdie", id: 3 },
        { denumire: "Drojdie F2", cantitate: 0.5, unitate: "kg", tip: "drojdie", id: 4 },
        { denumire: "Hamei Bitter", cantitate: 1, unitate: "kg", tip: "hamei", id: 6 },
        { denumire: "Hamei Aroma", cantitate: 0.8, unitate: "kg", tip: "hamei", id: 7 },
        { denumire: "Irish Moss", cantitate: 0.3, unitate: "kg", tip: "aditiv", id: 9 }
      ]
    },
    {
      id: 2, denumire: "INTRERUPATOR DE MUNCA - CB 02", tip: "IPA",
      concentratieMust: "16 - 20,5 ±1°Plato", concentratieAlcool: "7 - 9,5 ±1 %vol",
      image: "/intrerupator.png", durata: 7, rezultat: { cantitate: 1000, unitate: "litri" },
      ingrediente: [
        { denumire: "Malt Pale Ale", cantitate: 372, unitate: "kg", tip: "malt", id: 1 },
        { denumire: "Drojdie BE 256", cantitate: 0.5, unitate: "kg", tip: "drojdie", id: 3 },
        { denumire: "Drojdie F2", cantitate: 0.4, unitate: "kg", tip: "drojdie", id: 4 },
        { denumire: "Hamei Bitter", cantitate: 1.15, unitate: "kg", tip: "hamei", id: 6 },
        { denumire: "Hamei Aroma", cantitate: 2.4, unitate: "kg", tip: "hamei", id: 7 },
        { denumire: "Irish Moss", cantitate: 0.3, unitate: "kg", tip: "aditiv", id: 9 }
      ]
    },
    {
      id: 3, denumire: "USB AMPER ALE - CB 03", tip: "Pale Ale",
      concentratieMust: "13.8 ± 0.50°Plato", concentratieAlcool: "6 ± 0.50 %vol",
      image: "/usb-amper-ale.png", durata: 0, rezultat: { cantitate: 1000, unitate: "litri" },
      ingrediente: [
        { denumire: "Malt", cantitate: 300, unitate: "kg", tip: "malt", id: 2 },
        { denumire: "Drojdie Fermentis U.S 05", cantitate: 0.5, unitate: "kg", tip: "drojdie", id: 5 },
        { denumire: "Hamei Bitter", cantitate: 0.7, unitate: "kg", tip: "hamei", id: 6 },
        { denumire: "Hamei Aroma", cantitate: 2.4, unitate: "kg", tip: "hamei", id: 7 },
        { denumire: "Irish Moss", cantitate: 0.3, unitate: "kg", tip: "aditiv", id: 9 }
      ]
    }
  ],
  loturiAmbalate: [],
  iesiriBere: [],
  rebuturi: []
};

// Database helper functions
function readDb() {
  try {
    if (!existsSync(dbPath)) {
      writeFileSync(dbPath, JSON.stringify(DEFAULT_DATA, null, 2), 'utf8');
      console.log(`[DB] Created new database at ${dbPath}`);
      return { ...DEFAULT_DATA };
    }
    const content = readFileSync(dbPath, 'utf8');
    const data = JSON.parse(content);

    // Ensure all required fields exist
    const merged = { ...DEFAULT_DATA, ...data };
    // Helper to ensure defaults exist
    function ensureDefaults(currentList, defaultList) {
      if (!Array.isArray(currentList) || currentList.length === 0) return [...defaultList];

      const currentIds = new Set(currentList.map(item => item.id));
      const missing = defaultList.filter(item => !currentIds.has(item.id));
      return [...currentList, ...missing];
    }

    // Merge default data into existing data
    // CRITICAL FIX: If list is empty in file, FORCE defaults
    merged.materiiPrime = ensureDefaults(merged.materiiPrime, DEFAULT_DATA.materiiPrime);
    merged.materialeAmbalare = ensureDefaults(merged.materialeAmbalare, DEFAULT_DATA.materialeAmbalare);
    merged.fermentatoare = ensureDefaults(merged.fermentatoare, DEFAULT_DATA.fermentatoare);
    merged.reteteBere = ensureDefaults(merged.reteteBere, DEFAULT_DATA.reteteBere);
    if (!merged.reteteBere || merged.reteteBere.length === 0) {
      merged.reteteBere = DEFAULT_DATA.reteteBere;
    }
    return merged;
  } catch (err) {
    console.error(`[DB] Error reading database:`, err);
    return { ...DEFAULT_DATA };
  }
}

function writeDb(data) {
  try {
    // Create backup
    if (!existsSync(backupsDir)) mkdirSync(backupsDir, { recursive: true });
    if (existsSync(dbPath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFile = path.join(backupsDir, `db-${timestamp}.json`);
      copyFileSync(dbPath, backupFile);
    }

    writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`[DB] Error writing database:`, err);
    return false;
  }
}

// Initialize database
console.log(`[SERVER] 📊 Database path: ${dbPath}`);
let dbData = readDb();
console.log(`[SERVER] ✅ Database loaded with ${dbData.materiiPrime?.length || 0} ingredients`);

// ==========================================
// 🛡️ GLOBAL ERROR HANDLERS
// ==========================================
process.on('uncaughtException', (err) => {
  console.error('[SERVER] 💥 UNCAUGHT EXCEPTION:', err);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[SERVER] 💥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

// ==========================================
// 🌐 EXPRESS APP SETUP
// ==========================================
const app = express();
app.disable("x-powered-by");

// CORS - Allow everything including file://
app.use(cors({
  origin: "*",
  credentials: false,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Confirm-Delete"],
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

// Prevent caching
app.use((req, res, next) => {
  res.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  next();
});

app.use(express.json());

// Static files
const imagePath = existsSync(path.join(__dirname, "dist", "Imagini"))
  ? path.join(__dirname, "dist", "Imagini")
  : path.join(__dirname, "public", "Imagini");
app.use("/Imagini", express.static(imagePath));
console.log(`[SERVER] 🖼️ Image path: ${imagePath}`);

// ==========================================
// 🏥 HEALTH CHECK
// ==========================================
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), port: PORT });
});

// ==========================================
// 📦 API ENDPOINTS
// ==========================================

// --- MATERII PRIME ---
app.get("/api/materii-prime", (req, res) => {
  try {
    dbData = readDb();
    res.json(dbData.materiiPrime || []);
  } catch (error) {
    console.error("Error getting materii prime:", error);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.post("/api/materii-prime", (req, res) => {
  try {
    dbData = readDb();
    const material = req.body;
    const existing = dbData.materiiPrime.find(m =>
      m.denumire === material.denumire && m.unitate === material.unitate
    );

    if (existing) {
      existing.cantitate = Number((existing.cantitate + Number(material.cantitate)).toFixed(2));
    } else {
      const maxId = dbData.materiiPrime.length > 0 ? Math.max(...dbData.materiiPrime.map(m => m.id)) : 0;
      dbData.materiiPrime.push({ id: maxId + 1, ...material, cantitate: Number(material.cantitate) });
    }

    writeDb(dbData);
    res.status(201).json({ succes: true });
  } catch (error) {
    console.error("Error adding material:", error);
    res.status(500).json({ error: "Eroare la salvare" });
  }
});

app.put("/api/materii-prime/:id", (req, res) => {
  try {
    dbData = readDb();
    const id = parseInt(req.params.id);
    const index = dbData.materiiPrime.findIndex(m => m.id === id);
    if (index === -1) return res.status(404).json({ error: "Materialul nu a fost găsit" });

    dbData.materiiPrime[index] = { ...dbData.materiiPrime[index], ...req.body, id };
    writeDb(dbData);
    res.json({ succes: true });
  } catch (error) {
    console.error("Error updating material:", error);
    res.status(500).json({ error: "Eroare la actualizare" });
  }
});

app.delete("/api/materii-prime/:id", (req, res) => {
  try {
    dbData = readDb();
    const id = parseInt(req.params.id);
    dbData.materiiPrime = dbData.materiiPrime.filter(m => m.id !== id);
    writeDb(dbData);
    res.json({ succes: true });
  } catch (error) {
    console.error("Error deleting material:", error);
    res.status(500).json({ error: "Eroare la ștergere" });
  }
});

// --- FERMENTATOARE ---
app.get("/api/fermentatoare", (req, res) => {
  try {
    dbData = readDb();
    res.json(dbData.fermentatoare || []);
  } catch (error) {
    console.error("Error getting fermentatoare:", error);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.put("/api/fermentatoare/:id", (req, res) => {
  try {
    dbData = readDb();
    const id = parseInt(req.params.id);
    const index = dbData.fermentatoare.findIndex(f => f.id === id);
    if (index === -1) return res.status(404).json({ error: "Fermentatorul nu a fost găsit" });

    dbData.fermentatoare[index] = { ...dbData.fermentatoare[index], ...req.body, id };
    writeDb(dbData);
    res.json({ succes: true });
  } catch (error) {
    console.error("Error updating fermentator:", error);
    res.status(500).json({ error: "Eroare la actualizare" });
  }
});

// --- RETETE BERE ---
app.get("/api/retete-bere", (req, res) => {
  try {
    dbData = readDb();
    res.json(dbData.reteteBere || []);
  } catch (error) {
    console.error("Error getting retete:", error);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

// --- LOTURI AMBALATE ---
app.get("/api/loturi-ambalate", (req, res) => {
  try {
    dbData = readDb();
    res.json(dbData.loturiAmbalate || []);
  } catch (error) {
    console.error("Error getting loturi:", error);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.post("/api/loturi-ambalate", (req, res) => {
  try {
    dbData = readDb();
    const lot = req.body;
    const maxId = dbData.loturiAmbalate.length > 0 ? Math.max(...dbData.loturiAmbalate.map(l => l.id)) : 0;
    const newLot = { id: maxId + 1, ...lot, dataCreare: new Date().toISOString() };
    dbData.loturiAmbalate.push(newLot);
    writeDb(dbData);
    res.status(201).json(newLot);
  } catch (error) {
    console.error("Error adding lot:", error);
    res.status(500).json({ error: "Eroare la salvare" });
  }
});

app.get("/api/ambalare/:id", (req, res) => {
  try {
    dbData = readDb();
    const id = parseInt(req.params.id);
    const lot = dbData.loturiAmbalate.find(l => l.id === id);
    if (!lot) return res.status(404).json({ error: "Lotul nu a fost găsit" });
    res.json(lot);
  } catch (error) {
    console.error("Error getting lot:", error);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.put("/api/ambalare/:id", (req, res) => {
  try {
    dbData = readDb();
    const id = parseInt(req.params.id);
    const index = dbData.loturiAmbalate.findIndex(l => l.id === id);
    if (index === -1) return res.status(404).json({ error: "Lotul nu a fost găsit" });

    dbData.loturiAmbalate[index] = { ...dbData.loturiAmbalate[index], ...req.body, id };
    writeDb(dbData);
    res.json(dbData.loturiAmbalate[index]);
  } catch (error) {
    console.error("Error updating lot:", error);
    res.status(500).json({ error: "Eroare la actualizare" });
  }
});

app.delete("/api/ambalare/:id", (req, res) => {
  try {
    dbData = readDb();
    const id = parseInt(req.params.id);
    dbData.loturiAmbalate = dbData.loturiAmbalate.filter(l => l.id !== id);
    writeDb(dbData);
    res.json({ message: "Lot șters cu succes" });
  } catch (error) {
    console.error("Error deleting lot:", error);
    res.status(500).json({ error: "Eroare la ștergere" });
  }
});

// --- MATERIALE AMBALARE ---
app.get("/api/materiale-ambalare", (req, res) => {
  try {
    dbData = readDb();
    res.json(dbData.materialeAmbalare || []);
  } catch (error) {
    console.error("Error getting materiale ambalare:", error);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.post("/api/materiale-ambalare", (req, res) => {
  try {
    dbData = readDb();
    const material = req.body;
    const maxId = dbData.materialeAmbalare.length > 0 ? Math.max(...dbData.materialeAmbalare.map(m => m.id)) : 0;
    const newMaterial = { id: maxId + 1, ...material, cantitate: Number(material.cantitate) };
    dbData.materialeAmbalare.push(newMaterial);
    writeDb(dbData);
    res.status(201).json(newMaterial);
  } catch (error) {
    console.error("Error adding material ambalare:", error);
    res.status(500).json({ error: "Eroare la salvare" });
  }
});

app.put("/api/materiale-ambalare/:id", (req, res) => {
  try {
    dbData = readDb();
    const id = parseInt(req.params.id);
    const index = dbData.materialeAmbalare.findIndex(m => m.id === id);
    if (index === -1) return res.status(404).json({ error: "Materialul nu a fost găsit" });

    dbData.materialeAmbalare[index] = { ...dbData.materialeAmbalare[index], ...req.body, id };
    writeDb(dbData);
    res.json(dbData.materialeAmbalare[index]);
  } catch (error) {
    console.error("Error updating material ambalare:", error);
    res.status(500).json({ error: "Eroare la actualizare" });
  }
});

app.delete("/api/materiale-ambalare/:id", (req, res) => {
  try {
    dbData = readDb();
    const id = parseInt(req.params.id);
    dbData.materialeAmbalare = dbData.materialeAmbalare.filter(m => m.id !== id);
    writeDb(dbData);
    res.json(dbData.materialeAmbalare);
  } catch (error) {
    console.error("Error deleting material ambalare:", error);
    res.status(500).json({ error: "Eroare la ștergere" });
  }
});

app.get("/api/materiale-ambalare/export", (req, res) => {
  try {
    dbData = readDb();
    const materiale = dbData.materialeAmbalare || [];
    const headers = ["id", "denumire", "cantitate", "unitate", "producator", "codProdus", "lot", "tip", "subcategorie"];
    const rows = [
      headers.join(","),
      ...materiale.map(m => `"${m.id}","${m.denumire}",${m.cantitate},"${m.unitate}","${m.producator || ""}","${m.codProdus || ""}","${m.lot || ""}","${m.tip || ""}","${m.subcategorie || ""}"`)
    ];
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=materiale-ambalare.csv");
    res.send(rows.join("\n"));
  } catch (error) {
    console.error("Error exporting materiale:", error);
    res.status(500).json({ error: "Eroare la export" });
  }
});

// --- IESIRI BERE ---
app.get("/api/iesiri-bere", (req, res) => {
  try {
    dbData = readDb();
    res.json(dbData.iesiriBere || []);
  } catch (error) {
    console.error("Error getting iesiri:", error);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.post("/api/iesiri-bere", (req, res) => {
  try {
    dbData = readDb();
    const iesire = req.body;
    const maxId = dbData.iesiriBere.length > 0 ? Math.max(...dbData.iesiriBere.map(i => i.id)) : 0;
    const newIesire = { id: maxId + 1, ...iesire, dataIesire: iesire.dataIesire || new Date().toISOString() };
    dbData.iesiriBere.push(newIesire);
    writeDb(dbData);
    res.status(201).json({ id: newIesire.id, message: "Ieșire înregistrată", data: newIesire });
  } catch (error) {
    console.error("Error adding iesire:", error);
    res.status(500).json({ error: "Eroare la salvare" });
  }
});

app.get("/api/iesiri-bere/lot/:lotId", (req, res) => {
  try {
    dbData = readDb();
    const { lotId } = req.params;
    const iesiri = (dbData.iesiriBere || []).filter(i => i.lotId === lotId || i.lotId === parseInt(lotId));
    res.json(iesiri);
  } catch (error) {
    console.error("Error getting iesiri for lot:", error);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.get("/api/iesiri-bere/sumar", (req, res) => {
  try {
    dbData = readDb();
    const iesiri = dbData.iesiriBere || [];
    const sumar = {};
    iesiri.forEach(i => {
      if (!sumar[i.reteta]) sumar[i.reteta] = 0;
      sumar[i.reteta] += parseFloat(i.cantitate) || 0;
    });
    res.json(sumar);
  } catch (error) {
    console.error("Error getting sumar:", error);
    res.status(500).json({ error: "Eroare" });
  }
});

app.get("/api/iesiri-bere/statistici", (req, res) => {
  try {
    dbData = readDb();
    const iesiri = dbData.iesiriBere || [];
    res.json({
      total: iesiri.length,
      totalCantitate: iesiri.reduce((sum, i) => sum + (parseFloat(i.cantitate) || 0), 0)
    });
  } catch (error) {
    console.error("Error getting statistici:", error);
    res.status(500).json({ error: "Eroare" });
  }
});

app.delete("/api/iesiri-bere/:id", (req, res) => {
  try {
    dbData = readDb();
    const id = parseInt(req.params.id);
    dbData.iesiriBere = dbData.iesiriBere.filter(i => i.id !== id);
    writeDb(dbData);
    res.json({ succes: true, message: "Ieșire ștearsă cu succes" });
  } catch (error) {
    console.error("Error deleting iesire:", error);
    res.status(500).json({ error: "Eroare la ștergere" });
  }
});

// --- REBUTURI ---
app.get("/api/rebuturi", (req, res) => {
  try {
    dbData = readDb();
    const iesiri = dbData.iesiriBere || [];
    const rebuturi = iesiri.filter(i => i.motiv === "rebut" || i.motiv === "pierdere");
    res.json(rebuturi);
  } catch (error) {
    console.error("Error getting rebuturi:", error);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

// --- PRODUCTIE ---
app.post("/api/productie/check", (req, res) => {
  try {
    dbData = readDb();
    const { retetaId, cantitate } = req.body;

    const reteta = dbData.reteteBere.find(r => r.id === parseInt(retetaId));
    if (!reteta) return res.status(404).json({ error: "Rețeta nu există" });

    const factor = cantitate / reteta.rezultat.cantitate;
    const missing = [];
    const details = [];

    for (const ing of reteta.ingrediente) {
      const stocItem = dbData.materiiPrime.find(mp => mp.id === ing.id);
      const necesar = ing.cantitate * factor;
      const disponibil = stocItem ? stocItem.cantitate : 0;
      const isEnough = disponibil >= necesar;

      details.push({
        nume: ing.denumire,
        necesarOriginal: Number(necesar.toFixed(2)),
        unitateNecesar: ing.unitate,
        disponibilOriginal: disponibil,
        unitateStoc: stocItem ? stocItem.unitate : 'N/A',
        status: isEnough ? 'OK' : 'MISSING'
      });

      if (!isEnough) {
        missing.push({
          nume: ing.denumire,
          necesar: Number(necesar.toFixed(2)),
          unitate: ing.unitate,
          disponibil,
          diferenta: Number((necesar - disponibil).toFixed(2))
        });
      }
    }

    res.json({ canProduce: missing.length === 0, missing, details });
  } catch (error) {
    console.error("Error checking stock:", error);
    // Explicit JSON error for client handling - Prevents "Unexpected token <"
    res.status(500).json({ error: error.message, missing: [], details: [] });
  }
});

app.post("/api/productie/confirm", (req, res) => {
  try {
    dbData = readDb();
    const { retetaId, fermentatorId, cantitate } = req.body;

    const reteta = dbData.reteteBere.find(r => r.id === parseInt(retetaId));
    if (!reteta) return res.status(404).json({ error: "Rețeta nu există" });

    const fermentatorIndex = dbData.fermentatoare.findIndex(f => f.id === parseInt(fermentatorId));
    if (fermentatorIndex === -1) return res.status(404).json({ error: "Fermentatorul nu există" });
    if (dbData.fermentatoare[fermentatorIndex].ocupat) return res.status(400).json({ error: "Fermentatorul este ocupat" });

    const factor = cantitate / reteta.rezultat.cantitate;

    // Consume ingredients
    for (const ing of reteta.ingrediente) {
      const stocIndex = dbData.materiiPrime.findIndex(mp => mp.id === ing.id);
      if (stocIndex !== -1) {
        const necesar = ing.cantitate * factor;
        dbData.materiiPrime[stocIndex].cantitate = Number((dbData.materiiPrime[stocIndex].cantitate - necesar).toFixed(3));
      }
    }

    // Update fermentator - round time to 30 minutes
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.round(minutes / 30) * 30;
    now.setMinutes(roundedMinutes);
    now.setSeconds(0);
    now.setMilliseconds(0);

    dbData.fermentatoare[fermentatorIndex] = {
      ...dbData.fermentatoare[fermentatorIndex],
      ocupat: true,
      reteta: reteta.denumire,
      cantitate: Number(cantitate),
      dataInceput: now.toISOString()
    };

    writeDb(dbData);
    res.json({ success: true, fermentatorId });
  } catch (error) {
    console.error("Error confirming production:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 🚀 START SERVER
// ==========================================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[SERVER] 🚀 Server running at http://localhost:${PORT}`);
  console.log(`[SERVER] 📂 Storage: ${storagePath}`);
});
