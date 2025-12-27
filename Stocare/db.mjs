// === db.mjs — Baza de date completă și curată pentru CURENTU’ ===

import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { join } from "path";
import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, unlinkSync, readFileSync } from "fs";
import { homedir } from 'os';
import { DATA_PATH } from './config.mjs';

// === CONFIGURARE CALE ===
// === CONFIGURARE CALE ===
// Prioritize USER_DATA_PATH from Electron (AppData), then config, then user Documents
const dbDir = process.env.USER_DATA_PATH
  ? join(process.env.USER_DATA_PATH, "Stocare")
  : (DATA_PATH || join(homedir(), "Documents", "CurentuApp"));

if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });

const dbPath = join(dbDir, "db.json");
const backupsDir = join(dbDir, "backups");

console.log(`[📦] Baza de date activă: ${dbPath}`);

// === 🔹 STRUCTURI INITIALE CORECTE ===

const reteteBereInitiale = [
  {
    id: 1,
    denumire: "ADAPTOR LA SITUATIE - CB 01",
    tip: "Blondă",
    concentratieMust: "12 ±0.50°Plato",
    concentratieAlcool: "5 ±0.5% vol",
    image: "/adaptor.png",
    durata: 0,
    rezultat: { cantitate: 1000, unitate: "litri" },
    ingrediente: [
      { denumire: "Malt Pale Ale", cantitate: 400, unitate: "kg", tip: "malt" },
      { denumire: "Zahar brun", cantitate: 20, unitate: "kg", tip: "aditiv" },
      { denumire: "Drojdie BE 256", cantitate: 0.5, unitate: "kg", tip: "drojdie" },
      { denumire: "Drojdie F2", cantitate: 0.5, unitate: "kg", tip: "drojdie" },
      { denumire: "Hamei Bitter", cantitate: 1, unitate: "kg", tip: "hamei" },
      { denumire: "Hamei Aroma", cantitate: 0.8, unitate: "kg", tip: "hamei" },
      { denumire: "Irish Moss", cantitate: 0.3, unitate: "kg", tip: "aditiv" }
    ]
  },
  {
    id: 2,
    denumire: "INTRERUPATOR DE MUNCA - CB 02",
    tip: "IPA",
    concentratieMust: "16 - 20,5 ±1°Plato",
    concentratieAlcool: "7 - 9,5 ±1 %vol",
    image: "/intrerupator.png",
    durata: 7,
    rezultat: { cantitate: 1000, unitate: "litri" },
    ingrediente: [
      { denumire: "Malt Pale Ale", cantitate: 372, unitate: "kg", tip: "malt" },
      { denumire: "Drojdie BE 256", cantitate: 0.5, unitate: "kg", tip: "drojdie" },
      { denumire: "Drojdie F2", cantitate: 0.4, unitate: "kg", tip: "drojdie" },
      { denumire: "Hamei Bitter", cantitate: 1.15, unitate: "kg", tip: "hamei" },
      { denumire: "Hamei Aroma", cantitate: 2.4, unitate: "kg", tip: "hamei" },
      { denumire: "Irish Moss", cantitate: 0.3, unitate: "kg", tip: "aditiv" }
    ]
  },
  {
    id: 3,
    denumire: "USB AMPER ALE - CB 03",
    tip: "Pale Ale",
    concentratieMust: "13.8 ± 0.50°Plato",
    concentratieAlcool: "6 ± 0.50 %vol",
    image: "/usb-amper-ale.png",
    durata: 0,
    rezultat: { cantitate: 1000, unitate: "litri" },
    ingrediente: [
      { denumire: "Malt", cantitate: 300, unitate: "kg", tip: "malt" },
      { denumire: "Drojdie Fermentis U.S 05", cantitate: 0.5, unitate: "kg", tip: "drojdie" },
      { denumire: "Hamei Bitter", cantitate: 0.7, unitate: "kg", tip: "hamei" },
      { denumire: "Hamei Aroma", cantitate: 2.4, unitate: "kg", tip: "hamei" },
      { denumire: "Irish Moss", cantitate: 0.3, unitate: "kg", tip: "aditiv" }
    ]
  }
];

const fermentatoareInitiale = [
  { id: 1, nume: "Fermentator 1", capacitate: 1000, ocupat: false, reteta: null, cantitate: 0, dataInceput: null, imagine: "/Imagini/fermentator.png" },
  { id: 2, nume: "Fermentator 2", capacitate: 1000, ocupat: false, reteta: null, cantitate: 0, dataInceput: null, imagine: "/Imagini/fermentator.png" },
  { id: 3, nume: "Fermentator 3", capacitate: 1000, ocupat: false, reteta: null, cantitate: 0, dataInceput: null, imagine: "/Imagini/fermentator.png" },
  { id: 4, nume: "Fermentator 4", capacitate: 1000, ocupat: false, reteta: null, cantitate: 0, dataInceput: null, imagine: "/Imagini/fermentator.png" },
  { id: 5, nume: "Fermentator 5", capacitate: 2000, ocupat: false, reteta: null, cantitate: 0, dataInceput: null, imagine: "/Imagini/fermentator.png" },
  { id: 6, nume: "Fermentator 6", capacitate: 2000, ocupat: false, reteta: null, cantitate: 0, dataInceput: null, imagine: "/Imagini/fermentator.png" }
];

const defaultData = {
  materiiPrime: [], // Vor fi populate sau default
  materialeAmbalare: [],
  fermentatoare: fermentatoareInitiale,
  reteteBere: reteteBereInitiale,
  loturiAmbalate: [],
  iesiriBere: [],
  rebuturi: [],
};

const safeBackupsDir = join(homedir(), "Documents", "Curentu_Safe_Backups");

// === 🔹 SYSTEM BACKUP ===
function performBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    // 1. Internal Backup (App Data)
    if (!existsSync(backupsDir)) {
      mkdirSync(backupsDir, { recursive: true });
    }

    if (existsSync(dbPath)) {
      const backupFile = join(backupsDir, `db-${timestamp}.json`);
      copyFileSync(dbPath, backupFile);
      console.log(`[🛡️] Backup intern creat: ${backupFile}`);

      // Internal Rotation (Keep last 30)
      const files = readdirSync(backupsDir)
        .map(f => ({ name: f, path: join(backupsDir, f), time: statSync(join(backupsDir, f)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);

      if (files.length > 30) {
        files.slice(30).forEach(file => {
          try {
            unlinkSync(file.path);
          } catch (e) {
            console.error(`Eroare stergere backup intern vechi: ${e.message}`);
          }
        });
      }

      // 2. EXTERNAL SAFE BACKUP (My Documents - Survives Uninstall)
      if (!existsSync(safeBackupsDir)) {
        mkdirSync(safeBackupsDir, { recursive: true });
      }

      const safeBackupFile = join(safeBackupsDir, `db-${timestamp}.json`);
      copyFileSync(dbPath, safeBackupFile);
      console.log(`[🏰] SAFE Backup extern creat: ${safeBackupFile}`);

      // External Rotation (Keep last 50)
      const safeFiles = readdirSync(safeBackupsDir)
        .filter(f => f.endsWith(".json"))
        .map(f => ({ name: f, path: join(safeBackupsDir, f), time: statSync(join(safeBackupsDir, f)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);

      if (safeFiles.length > 50) {
        safeFiles.slice(50).forEach(file => {
          try {
            unlinkSync(file.path);
          } catch (e) {
            console.error(`Eroare stergere safe backup vechi: ${e.message}`);
          }
        });
      }
    }
  } catch (error) {
    console.error(`[⚠️] Eroare la crearea backup-ului: ${error.message}`);
  }
}

// === 🔹 HELPERS ===
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/-/g, "")
    .replace(/fermentis|drojdie|us|u\.s|be|w|s|f|04|05|256|2|34\/70/g, "") // remove common yeast prefixes/suffixes to find base type if needed
    .replace(/\s+/g, "")
    .trim();
}

// === 🔹 MIGRARE DATE VECHI ===
function migrateOldData(key, oldFileName, oldKey) {
  const oldPath = join(dbDir, oldFileName);
  if (existsSync(oldPath)) {
    try {
      const content = readFileSync(oldPath, 'utf8');
      const json = JSON.parse(content);
      if (json && json[oldKey] && Array.isArray(json[oldKey]) && json[oldKey].length > 0) {
        console.log(`[🔄] Migrare: Preluat ${json[oldKey].length} inregistrari din ${oldFileName}`);
        return json[oldKey];
      }
    } catch (e) {
      console.error(`[⚠️] Eroare la citirea ${oldFileName}: ${e.message}`);
    }
  }
  return null;
}

// === 🔹 INIT DB ===
const adapter = new JSONFile(dbPath);
const db = new Low(adapter, defaultData);

export async function initializeDb() {
  performBackup();
  await db.read();

  let modified = false;

  // Dacă DB este gol sau nou, încercăm migrarea datelor vechi
  if (!db.data) {
    db.data = { ...defaultData };
    modified = true;
  }

  // --- MIGRARE ---
  // Doar dacă listele sunt goale în DB-ul current, încercăm să le populăm din fișiere vechi

  // 1. Materii Prime
  if (!db.data.materiiPrime || db.data.materiiPrime.length === 0) {
    const oldData = migrateOldData('materiiPrime', 'ingrediente.json', 'materiiPrime');
    if (oldData) {
      db.data.materiiPrime = oldData;
      modified = true;
    }
  }

  // 2. Fermentatoare (păstrăm default-ul nostru dacă structura veche e dubioasă, dar încercăm)
  // Fermentatoarele vechi aveau "ocupat" deci sunt ok.
  if (!db.data.fermentatoare || db.data.fermentatoare.length === 0) {
    const oldData = migrateOldData('fermentatoare', 'fermentatoare.json', 'fermentatoare');
    if (oldData) {
      // Verificăm dacă structura e compatibilă
      if (oldData[0] && oldData[0].nume) {
        db.data.fermentatoare = oldData;
        modified = true;
      }
    }
  }

  // 3. Rețete
  if (!db.data.reteteBere || db.data.reteteBere.length === 0) {
    const oldData = migrateOldData('reteteBere', 'reteteBere.json', 'retete');
    if (oldData) {
      db.data.reteteBere = oldData;
      modified = true;
    } else {
      // Fallback la default corect
      db.data.reteteBere = reteteBereInitiale;
      modified = true;
    }
  }

  // 4. Loturi Ambalate
  if (!db.data.loturiAmbalate || db.data.loturiAmbalate.length === 0) {
    const oldData = migrateOldData('loturiAmbalate', 'loturiAmbalate.json', 'loturi');
    if (oldData) {
      db.data.loturiAmbalate = oldData;
      modified = true;
    }
  }

  // 5. Materiale Ambalare
  if (!db.data.materialeAmbalare || db.data.materialeAmbalare.length === 0) {
    const oldData = migrateOldData('materialeAmbalare', 'materialeAmbalare.json', 'materialeAmbalare');
    if (oldData) {
      db.data.materialeAmbalare = oldData;
      modified = true;
    }
  }

  // 6. Ieșiri Bere
  if (!db.data.iesiriBere || db.data.iesiriBere.length === 0) {
    const oldData = migrateOldData('iesiriBere', 'iesiriBere.json', 'iesiri');
    if (oldData) {
      db.data.iesiriBere = oldData;
      modified = true;
    }
  }

  // Finalizare default
  if (!db.data.fermentatoare || db.data.fermentatoare.length === 0) {
    db.data.fermentatoare = fermentatoareInitiale;
    modified = true;
  }
  if (!db.data.reteteBere || db.data.reteteBere.length === 0) {
    db.data.reteteBere = reteteBereInitiale;
    modified = true;
  }

  // 7. MIGRARE: Leagă ingredientele din rețete de ID-urile din stoc (Fuzzy Match)
  // Aceasta rulează de fiecare dată pentru a prinde ingredientele noi sau corectate
  if (db.data.reteteBere && db.data.materiiPrime) {
    let reteteModified = false;
    db.data.reteteBere.forEach(reteta => {
      if (reteta.ingrediente) {
        reteta.ingrediente.forEach(ing => {
          // Dacă ingredientul nu are ID, încercăm să-l găsim
          if (!ing.id) {
            // 1. Încercare potrivire exactă
            let match = db.data.materiiPrime.find(mp => mp.denumire === ing.denumire);

            // 2. Dacă nu, încercare normalizată simplă
            if (!match) {
              match = db.data.materiiPrime.find(mp =>
                normalizeName(mp.denumire) === normalizeName(ing.denumire)
              );
            }

            // 3. Fallback specific pentru Drojdii (care au nume complicate in retete)
            if (!match && ing.tip === 'drojdie') {
              // Caută ceva ce conține codul din denumirea ingredientului
              const codes = ["US-05", "US 05", "BE-256", "BE 256", "S-23", "S 23", "F2"];
              const foundCode = codes.find(c => ing.denumire.includes(c) || ing.denumire.includes(c.replace("-", " ")));

              if (foundCode) {
                const cleanCode = foundCode.replace("-", "").replace(" ", "");
                match = db.data.materiiPrime.find(mp => mp.denumire.replace("-", "").replace(" ", "").includes(cleanCode));
              }
            }

            if (match) {
              ing.id = match.id;
              reteteModified = true;
              console.log(`[🔗] Link creat: Rețeta '${reteta.denumire}' -> Ing '${ing.denumire}' legat de Stoc ID ${match.id} (${match.denumire})`);
            } else {
              console.warn(`[⚠️] Warning: Nu s-a găsit stoc pentru ingredientul '${ing.denumire}' din rețeta '${reteta.denumire}'`);
            }
          }
        });
      }
    });

    if (reteteModified) {
      modified = true;
    }
  }

  if (modified) {
    await db.write();
    console.log("[✓] Baza de date consolidată și salvată.");
  }
}

export { db };
