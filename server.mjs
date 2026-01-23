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

// Default data structures - UNIFIED FOR v1.5.9
const DEFAULT_DATA = {
  // UNIFIED STOCK: Ingredients + Packaging Materials
  stocMateriale: [
    // === INGREDIENTE (Materii Prime) ===
    { id: 1, denumire: "Malt Pale Ale", cantitate: 1000, unitate: "kg", tip: "malt", categorie: "Ingredient", producator: "Generic", codProdus: "MALT-01", lot: "INIT-001" },
    { id: 2, denumire: "Malt", cantitate: 500, unitate: "kg", tip: "malt", categorie: "Ingredient", producator: "Generic", codProdus: "MALT-02", lot: "INIT-002" },
    { id: 3, denumire: "Drojdie BE 256", cantitate: 5, unitate: "kg", tip: "drojdie", categorie: "Ingredient", producator: "Fermentis", codProdus: "YEAST-01", lot: "INIT-003" },
    { id: 4, denumire: "Drojdie F2", cantitate: 5, unitate: "kg", tip: "drojdie", categorie: "Ingredient", producator: "Fermentis", codProdus: "YEAST-02", lot: "INIT-004" },
    { id: 5, denumire: "Drojdie Fermentis U.S 05", cantitate: 5, unitate: "kg", tip: "drojdie", categorie: "Ingredient", producator: "Fermentis", codProdus: "YEAST-03", lot: "INIT-005" },
    { id: 6, denumire: "Hamei Bitter", cantitate: 10, unitate: "kg", tip: "hamei", categorie: "Ingredient", producator: "Generic", codProdus: "HOPS-01", lot: "INIT-006" },
    { id: 7, denumire: "Hamei Aroma", cantitate: 10, unitate: "kg", tip: "hamei", categorie: "Ingredient", producator: "Generic", codProdus: "HOPS-02", lot: "INIT-007" },
    { id: 8, denumire: "Zahar brun", cantitate: 50, unitate: "kg", tip: "aditiv", categorie: "Ingredient", producator: "Generic", codProdus: "ADD-01", lot: "INIT-008" },
    { id: 9, denumire: "Irish Moss", cantitate: 300, unitate: "g", tip: "aditiv", categorie: "Ingredient", producator: "Generic", codProdus: "ADD-02", lot: "INIT-009" },
    // === AMBALAJE (Materiale Ambalare) ===
    { id: 10, denumire: "Sticle 0.33l", tip: "sticle", cantitate: 1012, unitate: "buc", categorie: "Ambalaj", producator: "Generic Packaging", codProdus: "STICLA-001", lot: "", subcategorie: "" },
    { id: 11, denumire: "Cutii 6 sticle", tip: "cutii", cantitate: 1089, unitate: "buc", categorie: "Ambalaj", producator: "Generic Packaging", codProdus: "CUTIE-001", lot: "", subcategorie: "" },
    { id: 12, denumire: "Cutii 12 sticle", tip: "cutii", cantitate: 784, unitate: "buc", categorie: "Ambalaj", producator: "Generic Packaging", codProdus: "CUTIE-002", lot: "", subcategorie: "" },
    { id: 13, denumire: "Cutii 24 sticle", tip: "cutii", cantitate: 635, unitate: "buc", categorie: "Ambalaj", producator: "Generic Packaging", codProdus: "CUTIE-003", lot: "", subcategorie: "" },
    { id: 14, denumire: "Keg 10l", tip: "keg", cantitate: 19, unitate: "buc", categorie: "Ambalaj", producator: "Generic Kegs", codProdus: "KEG-001", lot: "", subcategorie: "" },
    { id: 15, denumire: "Keg 20l", tip: "keg", cantitate: 77, unitate: "buc", categorie: "Ambalaj", producator: "Generic Kegs", codProdus: "KEG-002", lot: "", subcategorie: "" },
    { id: 16, denumire: "Keg 30l", tip: "keg", cantitate: 100, unitate: "buc", categorie: "Ambalaj", producator: "Generic Kegs", codProdus: "KEG-003", lot: "", subcategorie: "" },
    { id: 17, denumire: "Keg 40l", tip: "keg", cantitate: 64, unitate: "buc", categorie: "Ambalaj", producator: "Generic Kegs", codProdus: "KEG-004", lot: "", subcategorie: "" },
    { id: 18, denumire: "Keg 50l", tip: "keg", cantitate: 100, unitate: "buc", categorie: "Ambalaj", producator: "Generic Kegs", codProdus: "KEG-005", lot: "", subcategorie: "" },
    { id: 19, denumire: "Etichete", tip: "etichete", cantitate: 3017, unitate: "buc", categorie: "Ambalaj", producator: "Generic Labels", codProdus: "ETICHETA-001", lot: "", subcategorie: "" },
    { id: 20, denumire: "Capace", tip: "capace", cantitate: 3517, unitate: "buc", categorie: "Ambalaj", producator: "Generic Caps", codProdus: "CAPAC-001", lot: "", subcategorie: "" }
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
        { denumire: "Irish Moss", cantitate: 300, unitate: "g", tip: "aditiv", id: 9 }
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
        { denumire: "Irish Moss", cantitate: 300, unitate: "g", tip: "aditiv", id: 9 }
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
        { denumire: "Irish Moss", cantitate: 300, unitate: "g", tip: "aditiv", id: 9 }
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

    // === v1.5.9 MIGRATION: Unify materiiPrime + materialeAmbalare → stocMateriale ===
    let needsMigration = false;

    if (!data.stocMateriale && (data.materiiPrime || data.materialeAmbalare)) {
      console.log('[DB] 🔄 v1.5.9 MIGRATION: Converting to unified stocMateriale array...');
      needsMigration = true;

      const unified = [];
      let nextId = 1;

      // Migrate materiiPrime → stocMateriale with categorie: "Ingredient"
      if (data.materiiPrime && Array.isArray(data.materiiPrime)) {
        data.materiiPrime.forEach(item => {
          unified.push({
            ...item,
            categorie: 'Ingredient',
            id: nextId++
          });
        });
        console.log(`[DB] ✓ Migrated ${data.materiiPrime.length} ingredients`);
      }

      // Migrate materialeAmbalare → stocMateriale with categorie: "Ambalaj"
      if (data.materialeAmbalare && Array.isArray(data.materialeAmbalare)) {
        data.materialeAmbalare.forEach(item => {
          unified.push({
            ...item,
            categorie: 'Ambalaj',
            id: nextId++
          });
        });
        console.log(`[DB] ✓ Migrated ${data.materialeAmbalare.length} packaging materials`);
      }

      data.stocMateriale = unified;
      console.log(`[DB] ✅ Migration complete: ${unified.length} total materials in stocMateriale`);
    }

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
    merged.stocMateriale = ensureDefaults(merged.stocMateriale, DEFAULT_DATA.stocMateriale);
    merged.fermentatoare = ensureDefaults(merged.fermentatoare, DEFAULT_DATA.fermentatoare);
    merged.reteteBere = ensureDefaults(merged.reteteBere, DEFAULT_DATA.reteteBere);

    if (!merged.reteteBere || merged.reteteBere.length === 0) {
      merged.reteteBere = DEFAULT_DATA.reteteBere;
    }

    // If migration happened, save immediately
    if (needsMigration) {
      writeFileSync(dbPath, JSON.stringify(merged, null, 2), 'utf8');
      console.log('[DB] 💾 Migrated database saved');
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
console.log(`[SERVER] ✅ Database loaded with ${dbData.stocMateriale?.length || 0} materials (unified)`);

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
// 📦 UNIFIED API ENDPOINTS - v1.5.9
// ==========================================

// Helper: Unit Prediction System
function predictUnit(material) {
  const name = material.denumire?.toLowerCase() || '';
  const tip = material.tip?.toLowerCase() || '';

  // Drojdii and Aditivi → grame (g) for small portions
  if (tip === 'drojdie' || tip === 'aditiv' ||
    name.includes('drojdie') || name.includes('irish moss') || name.includes('aditiv')) {
    return 'g';
  }

  // Malt și Hamei → kilograme (kg) for bulk
  if (tip === 'malt' || tip === 'hamei' || name.includes('malt') || name.includes('hamei')) {
    return 'kg';
  }

  // Default
  return material.unitate || 'kg';
}

// Helper: Input Conversion (0.3 kg → 300g for Irish Moss)
function convertInput(material) {
  const name = material.denumire?.toLowerCase() || '';
  const isSmallPortion = name.includes('irish moss') || material.tip === 'aditiv' || material.tip === 'drojdie';

  // If user inputs < 1.0 for small portion items AND unit is kg, convert to grams
  if (isSmallPortion && material.unitate === 'kg' && material.cantitate < 1.0) {
    return {
      cantitate: material.cantitate * 1000,  // 0.3 → 300
      unitate: 'g'
    };
  }

  return { cantitate: material.cantitate, unitate: material.unitate };
}

// --- UNIFIED STOCK MATERIALS ---
app.get("/api/stoc-materiale", (req, res) => {
  try {
    dbData = readDb();
    const { categorie } = req.query;

    let materials = dbData.stocMateriale || [];

    // Filter by category if requested
    if (categorie) {
      materials = materials.filter(m => m.categorie === categorie);
    }

    res.json(materials);
  } catch (error) {
    console.error("Error getting stoc materiale:", error);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.post("/api/stoc-materiale", (req, res) => {
  try {
    dbData = readDb();
    let material = req.body;

    // Auto-predict unit if not provided
    if (!material.unitate) {
      material.unitate = predictUnit(material);
    }

    // Apply input conversion
    const converted = convertInput(material);
    material.cantitate = converted.cantitate;
    material.unitate = converted.unitate;

    // Check if material exists (same name, unitate, and categorie)
    const existing = dbData.stocMateriale.find(m =>
      m.denumire === material.denumire &&
      m.unitate === material.unitate &&
      m.categorie === material.categorie
    );

    if (existing) {
      existing.cantitate = Number((existing.cantitate + Number(material.cantitate)).toFixed(2));
    } else {
      const maxId = dbData.stocMateriale.length > 0 ? Math.max(...dbData.stocMateriale.map(m => m.id)) : 0;
      dbData.stocMateriale.push({
        id: maxId + 1,
        ...material,
        cantitate: Number(material.cantitate),
        categorie: material.categorie || 'Ingredient' // Default to Ingredient if not specified
      });
    }

    writeDb(dbData);
    res.status(201).json({ succes: true });
  } catch (error) {
    console.error("Error adding material:", error);
    res.status(500).json({ error: "Eroare la salvare" });
  }
});

app.put("/api/stoc-materiale/:id", (req, res) => {
  try {
    dbData = readDb();
    const id = parseInt(req.params.id);
    const index = dbData.stocMateriale.findIndex(m => m.id === id);
    if (index === -1) return res.status(404).json({ error: "Materialul nu a fost găsit" });

    dbData.stocMateriale[index] = { ...dbData.stocMateriale[index], ...req.body, id };
    writeDb(dbData);
    res.json({ succes: true });
  } catch (error) {
    console.error("Error updating material:", error);
    res.status(500).json({ error: "Eroare la actualizare" });
  }
});

app.delete("/api/stoc-materiale/:id", (req, res) => {
  try {
    dbData = readDb();
    const id = parseInt(req.params.id);
    dbData.stocMateriale = dbData.stocMateriale.filter(m => m.id !== id);
    writeDb(dbData);
    res.json({ succes: true });
  } catch (error) {
    console.error("Error deleting material:", error);
    res.status(500).json({ error: "Eroare la ștergere" });
  }
});

// --- BACKWARD COMPATIBILITY: Legacy Endpoints (DEPRECATED) ---
// Materii Prime (Ingredients)
app.get("/api/materii-prime", (req, res) => {
  try {
    dbData = readDb();
    const ingredients = (dbData.stocMateriale || []).filter(m => m.categorie === 'Ingredient');
    res.json(ingredients);
  } catch (error) {
    console.error("Error getting materii prime:", error);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.post("/api/materii-prime", (req, res) => {
  try {
    dbData = readDb();
    const material = { ...req.body, categorie: 'Ingredient' };

    // Use unified endpoint logic
    const converted = convertInput(material);
    material.cantitate = converted.cantitate;
    material.unitate = converted.unitate;

    const existing = dbData.stocMateriale.find(m =>
      m.denumire === material.denumire && m.unitate === material.unitate && m.categorie === 'Ingredient'
    );

    if (existing) {
      existing.cantitate = Number((existing.cantitate + Number(material.cantitate)).toFixed(2));
    } else {
      const maxId = dbData.stocMateriale.length > 0 ? Math.max(...dbData.stocMateriale.map(m => m.id)) : 0;
      dbData.stocMateriale.push({ id: maxId + 1, ...material, cantitate: Number(material.cantitate) });
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
    const index = dbData.stocMateriale.findIndex(m => m.id === id && m.categorie === 'Ingredient');
    if (index === -1) return res.status(404).json({ error: "Materialul nu a fost găsit" });

    dbData.stocMateriale[index] = { ...dbData.stocMateriale[index], ...req.body, id, categorie: 'Ingredient' };
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
    dbData.stocMateriale = dbData.stocMateriale.filter(m => !(m.id === id && m.categorie === 'Ingredient'));
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

    const oldLot = dbData.loturiAmbalate[index];
    const newData = req.body;

    // Update lot data
    dbData.loturiAmbalate[index] = {
      ...oldLot,
      ...newData,
      id,
      dataActualizare: new Date().toISOString()
    };

    // Update fermentator quantity with precision and auto-empty logic
    const fermentatorId = newData.fermentatorId || oldLot.fermentatorId;
    const fermentatorIndex = dbData.fermentatoare.findIndex(f => f.id === fermentatorId);

    if (fermentatorIndex !== -1) {
      const oldCantitate = oldLot.cantitate || 0;
      const newCantitate = newData.cantitate || 0;
      const diferenta = Number((oldCantitate - newCantitate).toFixed(2));

      const cantitateRamasa = Number((dbData.fermentatoare[fermentatorIndex].cantitate + diferenta).toFixed(2));

      // Auto-empty logic: If remaining < 0.5L, reset fermentor automatically
      if (cantitateRamasa < 0.5) {
        console.log(`[AUTO-EMPTY] Fermentator ${fermentatorId}: ${cantitateRamasa}L < 0.5L → GOL automat`);
        dbData.fermentatoare[fermentatorIndex].ocupat = false;
        dbData.fermentatoare[fermentatorIndex].reteta = null;
        dbData.fermentatoare[fermentatorIndex].cantitate = 0;
      } else {
        dbData.fermentatoare[fermentatorIndex].cantitate = cantitateRamasa;
      }
    }

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
    const index = dbData.loturiAmbalate.findIndex(l => l.id === id);
    if (index === -1) return res.status(404).json({ error: "Lotul nu a fost găsit" });
    
    // Soft delete / Storno logic
    dbData.loturiAmbalate[index].stornat = true;
    dbData.loturiAmbalate[index].dataStornare = new Date().toISOString();
    
    writeDb(dbData);
    res.json({ message: "Lot stornat cu succes (Soft Delete)" });
  } catch (error) {
    console.error("Error deleting lot:", error);
    res.status(500).json({ error: "Eroare la ștergere" });
  }
});

// Storno Explicit Route (Alternative to DELETE override)
app.patch("/api/ambalare/:id/storno", (req, res) => {
  try {
    dbData = readDb();
    const id = parseInt(req.params.id);
    const index = dbData.loturiAmbalate.findIndex(l => l.id === id);
    if (index === -1) return res.status(404).json({ error: "Lotul nu a fost găsit" });

    if (dbData.loturiAmbalate[index].stornat) {
        return res.status(400).json({ error: "Lotul este deja stornat" });
    }

    // Logic: Mark as stornat
    dbData.loturiAmbalate[index].stornat = true;
    dbData.loturiAmbalate[index].dataStornare = new Date().toISOString();
    
    // NOTE: We do NOT restore to fermenter automatically here as that physical link is complex reversibility.
    // We just mark the Lot as removed/invalid.

    writeDb(dbData);
    res.json(dbData.loturiAmbalate[index]);
  } catch (error) {
    console.error("Error storno lot:", error);
    res.status(500).json({ error: "Eroare la stornare" });
  }
});

// --- MATERIALE AMBALARE (DEPRECATED - Use /api/stoc-materiale?categorie=Ambalaj) ---
app.get("/api/materiale-ambalare", (req, res) => {
  try {
    dbData = readDb();
    const packaging = (dbData.stocMateriale || []).filter(m => m.categorie === 'Ambalaj');
    res.json(packaging);
  } catch (error) {
    console.error("Error getting materiale ambalare:", error);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.post("/api/materiale-ambalare", (req, res) => {
  try {
    dbData = readDb();
    const material = { ...req.body, categorie: 'Ambalaj' };
    const maxId = dbData.stocMateriale.length > 0 ? Math.max(...dbData.stocMateriale.map(m => m.id)) : 0;
    const newMaterial = { id: maxId + 1, ...material, cantitate: Number(material.cantitate) };
    dbData.stocMateriale.push(newMaterial);
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
    const index = dbData.stocMateriale.findIndex(m => m.id === id && m.categorie === 'Ambalaj');
    if (index === -1) return res.status(404).json({ error: "Materialul nu a fost găsit" });

    dbData.stocMateriale[index] = { ...dbData.stocMateriale[index], ...req.body, id, categorie: 'Ambalaj' };
    writeDb(dbData);
    res.json(dbData.stocMateriale[index]);
  } catch (error) {
    console.error("Error updating material ambalare:", error);
    res.status(500).json({ error: "Eroare la actualizare" });
  }
});

app.delete("/api/materiale-ambalare/:id", (req, res) => {
  try {
    dbData = readDb();
    const id = parseInt(req.params.id);
    dbData.stocMateriale = dbData.stocMateriale.filter(m => !(m.id === id && m.categorie === 'Ambalaj'));
    writeDb(dbData);
    res.json(dbData.stocMateriale.filter(m => m.categorie === 'Ambalaj'));
  } catch (error) {
    console.error("Error deleting material ambalare:", error);
    res.status(500).json({ error: "Eroare la ștergere" });
  }
});

app.get("/api/materiale-ambalare/export", (req, res) => {
  try {
    dbData = readDb();
    const materiale = (dbData.stocMateriale || []).filter(m => m.categorie === 'Ambalaj');
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
    const index = dbData.iesiriBere.findIndex(i => i.id === id);
    if (index === -1) return res.status(404).json({ error: "Ieșirea nu a fost găsită" });
    
    const iesire = dbData.iesiriBere[index];

    // RESTORE STOCK LOGIC
    if (!iesire.stornat) {
        const lotId = parseInt(iesire.lotId);
        const lotIndex = dbData.loturiAmbalate.findIndex(l => l.id === lotId);
        
        if (lotIndex !== -1) {
            const currentQty = parseFloat(dbData.loturiAmbalate[lotIndex].cantitate || 0);
            const restoreQty = parseFloat(iesire.cantitate || 0);
            dbData.loturiAmbalate[lotIndex].cantitate = Number((currentQty + restoreQty).toFixed(2));
            console.log(`[STORNO] Restored ${restoreQty}L to Lot ${lotId}`);
        } else {
            console.warn(`[STORNO] Lot ${lotId} not found, cannot restore stock.`);
        }
    }

    // Mark as stornat instead of deleting
    dbData.iesiriBere[index].stornat = true;
    dbData.iesiriBere[index].dataStornare = new Date().toISOString();
    
    writeDb(dbData);
    res.json({ succes: true, message: "Ieșire stornată cu succes" });
  } catch (error) {
    console.error("Error deleting iesire:", error);
    res.status(500).json({ error: "Eroare la ștergere" });
  }
});

app.patch("/api/iesiri-bere/:id/storno", (req, res) => {
  try {
    dbData = readDb();
    const id = parseInt(req.params.id);
    const index = dbData.iesiriBere.findIndex(i => i.id === id);
    if (index === -1) return res.status(404).json({ error: "Ieșirea nu a fost găsită" });

    const iesire = dbData.iesiriBere[index];

    if (iesire.stornat) {
        return res.status(400).json({ error: "Ieșirea este deja stornată" });
    }

    // RESTORE STOCK LOGIC
    const lotId = parseInt(iesire.lotId);
    const lotIndex = dbData.loturiAmbalate.findIndex(l => l.id === lotId);
    
    if (lotIndex !== -1) {
        const currentQty = parseFloat(dbData.loturiAmbalate[lotIndex].cantitate || 0);
        const restoreQty = parseFloat(iesire.cantitate || 0);
        dbData.loturiAmbalate[lotIndex].cantitate = Number((currentQty + restoreQty).toFixed(2));
        console.log(`[STORNO] Restored ${restoreQty}L to Lot ${lotId}`);
    } else {
        console.warn(`[STORNO] Lot ${lotId} not found, cannot restore stock for Iesire ${id}`);
    }

    // Mark as stornat
    dbData.iesiriBere[index].stornat = true;
    dbData.iesiriBere[index].dataStornare = new Date().toISOString();
    
    writeDb(dbData);
    res.json({ succes: true, message: "Ieșire stornată cu succes" });
  } catch (error) {
    console.error("Error storno iesire:", error);
    res.status(500).json({ error: "Eroare la stornare" });
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
// Helper: Slugify names for fuzzy matching
function slugifyName(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '')        // Remove spaces
    .replace(/[.-]/g, '')        // Remove dots and dashes
    .replace(/pale/g, '')        // Normalize 'pale ale' variations
    .replace(/ale/g, '')
    .trim();
}

app.post("/api/productie/check", (req, res) => {
  try {
    dbData = readDb();
    const { retetaId, cantitate } = req.body;

    const reteta = dbData.reteteBere.find(r => r.id === parseInt(retetaId));
    if (!reteta) {
      return res.json({
        canProduce: false,
        missing: [],
        details: [],
        error: "Rețeta nu există"
      });
    }

    const factor = cantitate / reteta.rezultat.cantitate;
    const missing = [];
    const details = [];

    // Get ingredients from stocMateriale
    const ingredients = (dbData.stocMateriale || []).filter(m => m.categorie === 'Ingredient');

    for (const ing of reteta.ingrediente) {
      // Try to find by ID first
      let stocItem = ingredients.find(mp => mp.id === ing.id);

      // If not found by ID, try fuzzy name matching (slugify)
      if (!stocItem) {
        const slugRecipe = slugifyName(ing.denumire);
        stocItem = ingredients.find(mp => slugifyName(mp.denumire) === slugRecipe);

        if (stocItem) {
          console.log(`[MATCH] Recipe '${ing.denumire}' matched to stock '${stocItem.denumire}' (ID: ${stocItem.id})`);
        }
      }

      let necesar = ing.cantitate * factor;
      const disponibil = stocItem ? stocItem.cantitate : 0;

      // Unit conversion for comparison
      let disponibilConverted = disponibil;
      let necesarInStockUnit = necesar;

      if (stocItem && stocItem.unitate !== ing.unitate) {
        // If recipe needs kg but stock is in g
        if (stocItem.unitate === 'g' && ing.unitate === 'kg') {
          // Convert recipe requirement to grams
          necesarInStockUnit = necesar * 1000; // 0.05 kg = 50 g
          disponibilConverted = disponibil;     // Stock already in g
        }
        // If recipe needs g but stock is in kg
        else if (stocItem.unitate === 'kg' && ing.unitate === 'g') {
          necesarInStockUnit = necesar / 1000;  // 500 g = 0.5 kg
          disponibilConverted = disponibil;     // Stock already in kg
        }
        // For other units, convert stock to recipe unit for display
        else {
          disponibilConverted = disponibil;
        }
      }

      const isEnough = disponibilConverted >= necesarInStockUnit;

      details.push({
        nume: ing.denumire,
        necesarOriginal: Number(necesar.toFixed(2)),
        unitateNecesar: ing.unitate,
        disponibilOriginal: disponibil,
        disponibilConverted: Number(disponibilConverted.toFixed(2)),
        unitateStoc: stocItem ? stocItem.unitate : 'N/A',
        status: isEnough ? 'OK' : 'MISSING',
        matchedBy: stocItem ? (stocItem.id === ing.id ? 'ID' : 'Name') : 'NOT_FOUND'
      });

      if (!isEnough) {
        missing.push({
          nume: ing.denumire,
          necesar: Number(necesar.toFixed(2)),
          unitate: ing.unitate,
          disponibil: Number(disponibilConverted.toFixed(2)),
          unitateStoc: stocItem ? stocItem.unitate : 'N/A',
          diferenta: Number((necesarInStockUnit - disponibilConverted).toFixed(2))
        });
      }
    }

    res.json({
      canProduce: missing.length === 0,
      missing,
      details,
      success: true
    });
  } catch (error) {
    console.error("Error checking stock:", error);
    // ALWAYS return JSON to prevent API crash
    res.status(200).json({
      canProduce: false,
      success: false,
      error: error.message,
      missing: [],
      details: []
    });
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

    // Get ingredients from stocMateriale
    const ingredients = (dbData.stocMateriale || []).filter(m => m.categorie === 'Ingredient');

    // Consume ingredients from stocMateriale
    for (const ing of reteta.ingrediente) {
      // Try to find by ID first
      let stocIndex = dbData.stocMateriale.findIndex(mp => mp.id === ing.id && mp.categorie === 'Ingredient');

      // If not found by ID, try fuzzy name matching
      if (stocIndex === -1) {
        const slugRecipe = slugifyName(ing.denumire);
        stocIndex = dbData.stocMateriale.findIndex(mp =>
          mp.categorie === 'Ingredient' && slugifyName(mp.denumire) === slugRecipe
        );

        if (stocIndex !== -1) {
          console.log(`[MATCH] Recipe '${ing.denumire}' matched to stock '${dbData.stocMateriale[stocIndex].denumire}'`);
        }
      }

      if (stocIndex !== -1) {
        let necesar = ing.cantitate * factor;

        // Unit conversion if needed
        const stocItem = dbData.stocMateriale[stocIndex];
        if (stocItem.unitate !== ing.unitate) {
          // If stock is in g but recipe needs kg
          if (stocItem.unitate === 'g' && ing.unitate === 'kg') {
            necesar = necesar * 1000; // Convert kg to g
          }
          // If stock is in kg but recipe needs g
          else if (stocItem.unitate === 'kg' && ing.unitate === 'g') {
            necesar = necesar / 1000; // Convert g to kg
          }
        }

        dbData.stocMateriale[stocIndex].cantitate = Number((dbData.stocMateriale[stocIndex].cantitate - necesar).toFixed(3));
      } else {
        console.warn(`[WARNING] Ingredient '${ing.denumire}' not found in stock during production confirm`);
      }
    }

    // Update fermentator - round time to 30 minutes
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.round(minutes / 30) * 30;
    now.setMinutes(roundedMinutes);
    now.setSeconds(0);
    now.setMilliseconds(0);

    // Apply 10% production loss margin (2000L → 1800L available)
    const cantitateFinala = Number((cantitate * 0.9).toFixed(2));

    dbData.fermentatoare[fermentatorIndex] = {
      ...dbData.fermentatoare[fermentatorIndex],
      ocupat: true,
      reteta: reteta.denumire,
      cantitate: cantitateFinala,  // Stored with 10% loss already applied
      dataInceput: now.toISOString()
    };

    writeDb(dbData);
    res.json({ success: true, fermentatorId, cantitateFinala });
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
