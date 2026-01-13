import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname } from "path";
import { existsSync, mkdirSync, copyFileSync, writeFileSync, readFileSync } from "fs";
import os from "os";

// ==========================================
// 🔧 PATH CONFIGURATION & DYNAMIC IMPORTS
// ==========================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Constants
const PORT = 3001;
let stocarePath;
let isDev = !process.env.USER_DATA_PATH || process.env.NODE_ENV === 'development';

// 1. Determine Module Path (Where the .mjs files are)
// In production (packaged), these are in app.asar.unpacked
let modulesPath;

if (isDev) {
  modulesPath = path.join(__dirname, "Stocare");
  console.log(`[SERVER] 🔧 DEV MODE - Modules path: ${modulesPath}`);
} else {
  // PROD: Use process.resourcesPath to find app.asar.unpacked
  // Usually: resources/app.asar.unpacked/dist/Stocare OR resources/app.asar.unpacked/Stocare
  // We'll check both to be safe, defaulting to the dist one if it exists (Electron Builder common)
  const unpackedBase = path.join(process.resourcesPath, 'app.asar.unpacked');
  const distStocare = path.join(unpackedBase, 'dist', 'Stocare');
  const rootStocare = path.join(unpackedBase, 'Stocare');

  if (existsSync(distStocare)) {
    modulesPath = distStocare;
  } else if (existsSync(rootStocare)) {
    modulesPath = rootStocare;
  } else {
    // Fallback for some configs
    modulesPath = path.join(process.resourcesPath, 'Stocare');
  }
  console.log(`[SERVER] 📦 PROD MODE - Modules path determined: ${modulesPath}`);
}

// 2. Dynamic Import Helper
const importModule = async (filename) => {
  const modulePath = path.join(modulesPath, filename);
  // URL normalization is CRITICAL for Windows (file:///C:/...)
  const moduleUrl = pathToFileURL(modulePath).href;
  try {
    return await import(moduleUrl);
  } catch (err) {
    console.error(`[SERVER] 💥 Failed to import ${filename} from ${moduleUrl}`, err);
    throw err;
  }
};

// 3. Load Modules
console.log("[SERVER] ⏳ Loading modules...");
const {
  getMateriiPrime,
  adaugaSauSuplimenteazaMaterial,
  actualizeazaMaterial,
  stergeMaterial,
  stergeToateMaterialele,
} = await importModule("ingrediente.mjs");

const {
  getFermentatoare,
  updateFermentator,
} = await importModule("fermentatoare.mjs");

const {
  adaugaLot,
  obtineLoturi,
  actualizeazaLot,
  stergeLot,
  obtineLotDupaId,
} = await importModule("loturiAmbalate.mjs");

const {
  getMaterialeAmbalare,
  adaugaMaterialAmbalare,
  actualizeazaMaterialAmbalare,
  stergeMaterialAmbalare,
  stergeToateMaterialeleAmbalare,
  exportaMaterialeAmbalare,
  getMaterialePentruLot,
} = await importModule("materialeAmbalare.mjs");

const { getReteteBere } = await importModule("reteteBere.mjs");

const {
  getIesiriBere,
  adaugaIesireBere,
  getIesiriPentruLot,
  getSumarIesiriPeRetete,
  getStatisticiIesiri,
  stergeIesireBere,
  exportaIesiriCSV,
  getIesiriPerioada,
} = await importModule("iesiriBere.mjs");

const { checkStock, confirmProduction } = await importModule("productie.mjs");
const { initializeDb } = await importModule("db.mjs");

console.log("[SERVER] ✅ All modules loaded successfully!");


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
// 📂 STORAGE & DB INIT
// ==========================================

// Determinăm calea de stocare pentru DB (Writable)
let storagePath;

if (isDev) {
  storagePath = path.join(__dirname, "Stocare");
  console.log(`[SERVER] 🔧 DEV MODE - Storage path: ${storagePath}`);
} else {
  storagePath = path.join(process.env.USER_DATA_PATH, "Stocare");
  console.log(`[SERVER] 🔒 PROD MODE - Using secure storage: ${storagePath}`);

  if (!existsSync(storagePath)) {
    mkdirSync(storagePath, { recursive: true });
    console.log(`[SERVER] 📁 Created Main Storage Directory: ${storagePath}`);
  }
}

// Default Data Config
const DEFAULT_INGREDIENTS = [
  {
    "id": 1,
    "denumire": "Malt",
    "tip": "malt",
    "cantitate": 1000,
    "unitate": "kg",
    "producator": "Generic Malt",
    "codProdus": "MALT-001",
    "lot": "",
    "subcategorie": ""
  },
  {
    "id": 2,
    "denumire": "Hamei Bitter",
    "tip": "hamei",
    "cantitate": 50,
    "unitate": "kg",
    "producator": "Generic Hops",
    "codProdus": "HAMEI-001",
    "lot": "",
    "subcategorie": ""
  },
  {
    "id": 3,
    "denumire": "Drojdie US-05",
    "tip": "drojdie",
    "cantitate": 10,
    "unitate": "kg",
    "producator": "Fermentis",
    "codProdus": "DROJDIE-001",
    "lot": "",
    "subcategorie": ""
  }
];

// Initialize DB Logic
const targetDb = path.join(storagePath, "db.json");

// Ensure DB exists and populate if empty
if (!existsSync(targetDb)) {
  console.log(`[INIT] 🆕 db.json missing at ${targetDb}`);

  // Try to find a template
  let templateDb = path.join(modulesPath, "db.json");

  if (existsSync(templateDb)) {
    console.log(`[INIT] 📄 Found template at ${templateDb}, copying...`);
    copyFileSync(templateDb, targetDb);
  } else {
    console.log(`[INIT] ⚠️ Template not found. Creating fresh DB with defaults.`);
    const emptyDb = {
      materiiPrime: DEFAULT_INGREDIENTS,
      materialeAmbalare: [],
      fermentatoare: [],
      reteteBere: [],
      lotProductie: [],
      istoric: []
    };
    writeFileSync(targetDb, JSON.stringify(emptyDb, null, 2), 'utf8');
    console.log(`[INIT] ✅ Created fresh DB with default ingredients.`);
  }
} else {
  // DB Exists - Check if empty and force populate materials if needed
  try {
    const dbContent = JSON.parse(readFileSync(targetDb, 'utf8'));
    if (!dbContent.materiiPrime || dbContent.materiiPrime.length === 0) {
      console.log(`[INIT] 📭 db.json exists but 'materiiPrime' is empty. Injecting defaults...`);
      dbContent.materiiPrime = DEFAULT_INGREDIENTS;
      writeFileSync(targetDb, JSON.stringify(dbContent, null, 2), 'utf8');
      console.log(`[INIT] ✅ Injected default ingredients successfully.`);
    }
  } catch (e) {
    console.error(`[INIT] ❌ Error checking/populating existing DB:`, e);
  }
}


// Determine image path (Unpacked logic)
const imagePath = existsSync(path.join(__dirname, "dist", "Imagini"))
  ? path.join(__dirname, "dist", "Imagini")
  : path.join(__dirname, "public", "Imagini");

console.log(`[SERVER] 📊 Database path: ${targetDb}`);
console.log(`[SERVER] 🖼️  Image path: ${imagePath}`);


const app = express();


app.disable("x-powered-by");

// Updated CORS to allow all origins (fixes file:// issues)
app.use(
  cors({
    origin: "*", // ✅ Allow all origins including file://
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Confirm-Delete"],
  })
);

// Middleware for basic security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  // res.setHeader("X-Frame-Options", "DENY"); // Can interfere with some Electron setups, optional
  next();
});


// Middleware to protect sensitive files in /static
const protectStatic = (req, res, next) => {
  const forbiddenExtensions = [".json", ".env", ".log"];
  const forbiddenDirs = ["/backups", "/.git"];

  const normalizedUrl = req.url.toLowerCase();

  // Block sensitive extensions
  if (forbiddenExtensions.some(ext => normalizedUrl.endsWith(ext))) {
    console.warn(`[SECURITY] Blocked access to sensitive file: ${req.url}`);
    return res.status(403).send("Forbidden");
  }

  // Block sensitive directories
  if (forbiddenDirs.some(dir => normalizedUrl.includes(dir))) {
    console.warn(`[SECURITY] Blocked access to sensitive directory: ${req.url}`);
    return res.status(403).send("Forbidden");
  }

  next();
};

// Middleware to prevent caching
app.use((req, res, next) => {
  res.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  res.header("Surrogate-Control", "no-store");
  next();
});

// Middleware to require confirmation for DELETE operations
const requireDeleteConfirmation = (req, res, next) => {
  const confirmHeader = req.headers['x-confirm-delete'];

  if (confirmHeader !== 'true') {
    console.warn(`[SECURITY] DELETE blocked without confirmation: ${req.method} ${req.url}`);
    return res.status(403).json({
      error: "Confirmare necesară",
      message: "Pentru ștergere, trimiteți header-ul X-Confirm-Delete: true"
    });
  }

  console.log(`[SECURITY] DELETE confirmed: ${req.method} ${req.url}`);
  next();
};


app.use("/static", protectStatic, express.static(storagePath));
app.use("/Imagini", express.static(imagePath)); // ✅ Serve images
app.use(express.json());

// ==========================================
// 🏥 HEALTH CHECK ENDPOINT
// ==========================================
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    port: PORT
  });
});


function valideazaMaterial(material) {
  const erori = [];
  if (
    !material.denumire ||
    typeof material.denumire !== "string" ||
    material.denumire.trim() === ""
  ) {
    erori.push("Denumirea este obligatorie");
  }
  if (material.cantitate === undefined || material.cantitate === null) {
    erori.push("Cantitatea este obligatorie");
  } else {
    const cantitate = parseFloat(material.cantitate);
    if (isNaN(cantitate) || cantitate <= 0) {
      erori.push("Cantitatea trebuie să fie un număr pozitiv");
    }
  }
  if (
    !material.unitate ||
    typeof material.unitate !== "string" ||
    material.unitate.trim() === ""
  ) {
    erori.push("Unitatea este obligatorie");
  }
  return erori;
}

app.get("/api/materii-prime", async (req, res) => {
  try {
    const materii = await getMateriiPrime();
    console.log("Răspuns GET /api/materii-prime:", materii);
    res.json(materii);
  } catch (error) {
    console.error(
      "Eroare la preluarea materiilor prime:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.post("/api/materii-prime", async (req, res) => {
  const erori = valideazaMaterial(req.body);
  if (erori.length > 0) {
    return res.status(400).json({ error: "Date invalide", detalii: erori });
  }
  try {
    const rezultat = await adaugaSauSuplimenteazaMaterial(req.body);
    if (rezultat) {
      res.status(201).json({ succes: true });
    } else {
      res.status(500).json({ error: "Eroare la salvare" });
    }
  } catch (error) {
    console.error(
      "Eroare la adăugarea materialului:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Eroare la salvare" });
  }
});

app.put("/api/materii-prime/:id", async (req, res) => {
  const erori = valideazaMaterial(req.body);
  if (erori.length > 0) {
    return res.status(400).json({ error: "Date invalide", detalii: erori });
  }
  try {
    const rezultat = await actualizeazaMaterial(req.params.id, req.body);
    if (rezultat) {
      res.json({ succes: true });
    } else {
      res.status(404).json({ error: "Materialul nu a fost găsit" });
    }
  } catch (error) {
    console.error(
      "Eroare la actualizarea materialului:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Eroare la actualizare" });
  }
});

app.delete("/api/materii-prime/:id", requireDeleteConfirmation, async (req, res) => {
  try {
    const rezultat = await stergeMaterial(req.params.id);
    if (rezultat) {
      res.json({ succes: true });
    } else {
      res.status(404).json({ error: "Materialul nu a fost găsit" });
    }
  } catch (error) {
    console.error(
      "Eroare la ștergerea materialului:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Eroare la ștergere" });
  }
});

app.delete("/api/materii-prime", requireDeleteConfirmation, async (req, res) => {
  try {
    const rezultat = await stergeToateMaterialele();
    if (rezultat) {
      res.json({ succes: true });
    } else {
      res.status(500).json({ error: "Eroare la ștergerea materialelor" });
    }
  } catch (error) {
    console.error(
      "Eroare la ștergerea tuturor materialelor:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Eroare la ștergerea materialelor" });
  }
});

app.get("/api/retete-bere", async (req, res) => {
  try {
    const retete = await getReteteBere();
    console.log("Rețete returnate:", retete);
    res.json(retete);
  } catch (error) {
    console.error("Eroare la obținerea rețetelor:", error);
    res.status(500).json({ error: "Nu s-au putut încărca rețetele" });
  }
});

app.get("/api/fermentatoare", async (req, res) => {
  try {
    const fermentatoare = await getFermentatoare();
    console.log("Răspuns GET /api/fermentatoare:", fermentatoare);
    if (!fermentatoare || fermentatoare.length === 0) {
      console.warn("Nu s-au găsit fermentatoare în baza de date");
    }
    res.json(fermentatoare);
  } catch (error) {
    console.error(
      "Eroare la preluarea fermentatoarelor:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.put("/api/fermentatoare/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const dateActualizate = req.body;
    const rezultat = await updateFermentator(id, dateActualizate);
    if (rezultat) {
      res.json({ succes: true });
    } else {
      res.status(404).json({ error: "Fermentatorul nu a fost găsit" });
    }
  } catch (error) {
    console.error(
      "Eroare la actualizarea fermentatorului:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Eroare la actualizare" });
  }
});

app.get("/api/loturi-ambalate", async (req, res) => {
  try {
    const loturi = await obtineLoturi();
    res.json(loturi || []);
  } catch (error) {
    console.error("Eroare la obținerea loturilor ambalate:", error);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.post("/api/loturi-ambalate", async (req, res) => {
  try {
    const lot = req.body;
    const lotNou = await adaugaLot(lot);
    res.status(201).json(lotNou);
  } catch (error) {
    console.error("Eroare la adăugarea lotului ambalat:", error);
    res.status(500).json({ error: "Eroare la salvare" });
  }
});

app.get("/api/ambalare/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID invalid" });
    }
    const lot = await obtineLotDupaId(id);
    if (!lot) {
      return res.status(404).json({ error: "Lotul nu a fost găsit" });
    }
    res.json(lot);
  } catch (error) {
    console.error("Eroare la obținerea lotului:", error.message, error.stack);
    res.status(500).json({ error: "Eroare la obținerea lotului" });
  }
});

app.put("/api/ambalare/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID invalid" });
    }
    const updatedLot = req.body;
    const lot = await actualizeazaLot(id, updatedLot);
    if (!lot) {
      return res.status(404).json({ error: "Lotul nu a fost găsit" });
    }
    res.json(lot);
  } catch (error) {
    console.error(
      "Eroare la actualizarea lotului:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Eroare la actualizare" });
  }
});

app.delete("/api/ambalare/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID invalid" });
    }
    console.log(`Caut lotul cu ID: ${id}`);
    const result = await stergeLot(id);
    console.log(`Lotul cu ID ${id} a fost șters`);
    res.json({ message: "Lot șters cu succes" });
  } catch (error) {
    console.error("Eroare la ștergerea lotului:", error.message, error.stack);
    if (error.message === "Lotul nu a fost găsit") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Eroare la ștergere" });
    }
  }
});

app.get("/api/materiale-ambalare", async (req, res) => {
  try {
    const materiale = await getMaterialeAmbalare();
    console.log("Materiale ambalare returnate:", materiale);
    res.json(materiale);
  } catch (error) {
    console.error(
      "Eroare la preluarea materialelor de ambalare:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Eroare internă a serverului" });
  }
});

app.post("/api/materiale-ambalare", async (req, res) => {
  const erori = valideazaMaterial(req.body);
  if (erori.length > 0) {
    return res.status(400).json({ error: "Date invalide", detalii: erori });
  }
  try {
    const materialNou = await adaugaMaterialAmbalare(req.body);
    res.status(201).json(materialNou);
  } catch (error) {
    console.error(
      "Eroare la adăugarea materialului de ambalare:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Eroare la salvare" });
  }
});

app.put("/api/materiale-ambalare/:id", async (req, res) => {
  const erori = valideazaMaterial(req.body);
  if (erori.length > 0) {
    return res.status(400).json({ error: "Date invalide", detalii: erori });
  }
  try {
    const materialActualizat = await actualizeazaMaterialAmbalare(
      req.params.id,
      req.body
    );
    if (materialActualizat) {
      res.json(materialActualizat);
    } else {
      res.status(404).json({ error: "Materialul de ambalare nu a fost găsit" });
    }
  } catch (error) {
    console.error(
      "Eroare la actualizarea materialului de ambalare:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Eroare la actualizare" });
  }
});

app.delete("/api/materiale-ambalare/:id", async (req, res) => {
  try {
    const materialeActualizate = await stergeMaterialAmbalare(req.params.id);
    if (materialeActualizate) {
      res.json(materialeActualizate);
    } else {
      res.status(404).json({ error: "Materialul de ambalare nu a fost găsit" });
    }
  } catch (error) {
    console.error(
      "Eroare la ștergerea materialului de ambalare:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Eroare la ștergere" });
  }
});

app.delete("/api/materiale-ambalare", async (req, res) => {
  try {
    const rezultat = await stergeToateMaterialeleAmbalare();
    if (rezultat) {
      res.json({ succes: true });
    } else {
      res
        .status(500)
        .json({ error: "Eroare la ștergerea materialelor de ambalare" });
    }
  } catch (error) {
    console.error(
      "Eroare la ștergerea tuturor materialelor de ambalare:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ error: "Eroare la ștergerea materialelor de ambalare" });
  }
});

app.get("/api/materiale-ambalare/export", async (req, res) => {
  try {
    const csvData = await exportaMaterialeAmbalare();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=materiale-ambalare.csv"
    );
    res.send(csvData);
  } catch (error) {
    console.error(
      "Eroare la exportarea materialelor de ambalare:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Eroare la export" });
  }
});

app.get("/api/iesiri-bere", async (req, res) => {
  try {
    const iesiri = await getIesiriBere();
    res.json(iesiri);
  } catch (error) {
    console.error("Eroare la obținerea ieșirilor:", error);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.post("/api/iesiri-bere", async (req, res) => {
  try {
    const {
      lotId,
      reteta,
      cantitate,
      numarUnitatiScoase,
      ambalaj,
      motiv,
      dataIesire,
      utilizator,
      observatii,
      detaliiIesire,
    } = req.body;

    console.log("Received payload for /api/iesiri-bere:", req.body);

    if (!lotId || !reteta || cantitate === undefined || cantitate === null) {
      return res.status(400).json({
        error: "Date invalide. LotId, reteta și cantitatea sunt obligatorii.",
      });
    }

    const parsedCantitate = parseFloat(cantitate);
    if (isNaN(parsedCantitate) || parsedCantitate <= 0) {
      return res.status(400).json({
        error: "Cantitatea trebuie să fie un număr pozitiv.",
      });
    }

    if (
      numarUnitatiScoase !== undefined &&
      (isNaN(parseInt(numarUnitatiScoase)) || parseInt(numarUnitatiScoase) < 0)
    ) {
      return res.status(400).json({
        error: "NumarUnitatiScoase trebuie să fie un număr nenegativ.",
      });
    }

    const iesireNoua = await adaugaIesireBere({
      lotId: lotId.toString(),
      reteta,
      cantitate: parsedCantitate,
      numarUnitatiScoase:
        numarUnitatiScoase !== undefined
          ? parseInt(numarUnitatiScoase)
          : undefined,
      ambalaj,
      motiv,
      dataIesire,
      utilizator,
      observatii,
      detaliiIesire,
    });

    res.status(201).json({
      id: iesireNoua.id,
      message: "Ieșire înregistrată cu succes",
      data: iesireNoua,
    });
  } catch (error) {
    console.error("Eroare la înregistrarea ieșirii:", error.message);
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/iesiri-bere/lot/:lotId", async (req, res) => {
  try {
    const { lotId } = req.params;
    const iesiri = await getIesiriPentruLot(lotId);
    res.json(iesiri);
  } catch (error) {
    console.error("Eroare la obținerea ieșirilor pentru lot:", error);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.get("/api/iesiri-bere/sumar", async (req, res) => {
  try {
    const sumar = await getSumarIesiriPeRetete();
    res.json(sumar);
  } catch (error) {
    console.error("Eroare la obținerea sumarului:", error);
    res.status(500).json({ error: "Eroare la calcularea sumarului" });
  }
});

app.get("/api/iesiri-bere/statistici", async (req, res) => {
  try {
    const statistici = await getStatisticiIesiri();
    res.json(statistici);
  } catch (error) {
    console.error("Eroare la obținerea statisticilor:", error);
    res.status(500).json({ error: "Eroare la calcularea statisticilor" });
  }
});

app.get("/api/iesiri-bere/perioada", async (req, res) => {
  try {
    const { dataInceput, dataSfarsit } = req.query;
    if (!dataInceput || !dataSfarsit) {
      return res.status(400).json({
        error: "Parametrii dataInceput și dataSfarsit sunt obligatorii",
      });
    }
    const iesiri = await getIesiriPerioada(dataInceput, dataSfarsit);
    res.json(iesiri);
  } catch (error) {
    console.error("Eroare la obținerea ieșirilor pe perioadă:", error);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.delete("/api/iesiri-bere/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const rezultat = await stergeIesireBere(parseInt(id));
    if (rezultat) {
      res.json({ succes: true, message: "Ieșire ștearsă cu succes" });
    } else {
      res.status(404).json({ error: "Ieșirea nu a fost găsită" });
    }
  } catch (error) {
    console.error("Eroare la ștergerea ieșirii:", error);
    res.status(500).json({ error: "Eroare la ștergere" });
  }
});

app.get("/api/iesiri-bere/export/csv", async (req, res) => {
  try {
    const csvData = await exportaIesiriCSV();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=iesiri-bere-${new Date().toISOString().split("T")[0]
      }.csv`
    );
    res.send("\uFEFF" + csvData);
  } catch (error) {
    console.error("Eroare la exportarea ieșirilor:", error);
    res.status(500).json({ error: "Eroare la export" });
  }
});

app.get("/api/rebuturi", async (req, res) => {
  try {
    const iesiri = await getIesiriBere();
    const rebuturi = iesiri.filter(
      (iesire) => iesire.motiv === "rebut" || iesire.motiv === "pierdere"
    );
    const rebuturiCuMateriale = await Promise.all(
      rebuturi.map(async (iesire) => {
        const lot = await obtineLotDupaId(parseInt(iesire.lotId));

        const unitati = iesire.numarUnitatiScoase || lot?.cantitateSticle || 0;

        // detectare box size
        const boxSize = (() => {
          if (unitati >= 24 && unitati % 24 === 0) return 24;
          if (unitati >= 20 && unitati % 20 === 0) return 20;
          if (unitati >= 12 && unitati % 12 === 0) return 12;
          if (unitati >= 6 && unitati % 6 === 0) return 6;
          return null;
        })();

        // Dacă nu avem boxSize, putem folosi logica din calcul cutii din front-end
        // Sau pur și simplu returnam 0
        const cutii = boxSize ? Math.ceil(unitati / boxSize) : 0;

        return {
          ...iesire,
          packagingType: lot?.packagingType || "N/A",
          bottleSize: lot?.bottleSize || "N/A",
          boxType: boxSize ? `Cutie ${boxSize} sticle` : "N/A",
          cutiiPierdute: cutii, // adaugăm câmpul calculat
        };
      })
    );

    res.json(rebuturiCuMateriale);
  } catch (error) {
    console.error("Eroare la obținerea rebuturilor:", error);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`[SERVER] 🚀 Server running at http://localhost:${PORT}`);
  console.log(`[SERVER] 📂 Storage Directory Is: ${storagePath}`);

  // Call init here to ensure it happens after module load
  try {
    await initializeDb();
  } catch (e) {
    console.error("[SERVER] Failed to run initializeDb:", e);
  }
});
