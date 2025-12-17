// === db.mjs — Baza de date completă și curată pentru CURENTU’ ===

import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { join } from "path";
import { homedir } from "os";
import { existsSync, mkdirSync } from "fs";

// === CONFIGURARE CALE ===
const dbDir = join(homedir(), "Documents", "CurentuApp");
if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true });

const dbPath = join(dbDir, "db.json");
console.log(`[📦] Baza de date activă: ${dbPath}`);

// === 🔹 INGREDIENTE din rețetele CURENTU’ ===
const materiiPrimeInitiale = [
  // --- Malțuri ---
  {
    id: 1,
    denumire: "Malț Pale Ale",
    tip: "malt",
    cantitate: 0,
    unitate: "kg",
    producator: "Weyermann",
    codProdus: "MALT-PALEALE",
    subcategorie: "Malt de bază",
  },
  {
    id: 2,
    denumire: "Malț Pilsner",
    tip: "malt",
    cantitate: 0,
    unitate: "kg",
    producator: "Weyermann",
    codProdus: "MALT-PILS",
    subcategorie: "Malt de bază",
  },

  // --- Hamei ---
  {
    id: 3,
    denumire: "Hamei Citra",
    tip: "hamei",
    cantitate: 0,
    unitate: "kg",
    producator: "Yakima Chief",
    codProdus: "HOP-CITRA",
    subcategorie: "Aromatic",
  },
  {
    id: 4,
    denumire: "Hamei Mosaic",
    tip: "hamei",
    cantitate: 0,
    unitate: "kg",
    producator: "Yakima Chief",
    codProdus: "HOP-MOSAIC",
    subcategorie: "Aromatic",
  },
  {
    id: 5,
    denumire: "Hamei Saaz",
    tip: "hamei",
    cantitate: 0,
    unitate: "kg",
    producator: "Czech Hops",
    codProdus: "HOP-SAAZ",
    subcategorie: "Tradițional",
  },

  // --- Drojdii ---
  {
    id: 6,
    denumire: "Drojdie US 05",
    tip: "drojdie",
    cantitate: 0,
    unitate: "pachete",
    producator: "Fermentis",
    codProdus: "YST-US05",
    subcategorie: "Ale",
  },
  {
    id: 7,
    denumire: "Drojdie BE 256",
    tip: "drojdie",
    cantitate: 0,
    unitate: "pachete",
    producator: "Fermentis",
    codProdus: "YST-S23",
    subcategorie: "Lager",
  },
  {
    id: 8,
    denumire: "Drojdie F2",
    tip: "drojdie",
    cantitate: 0,
    unitate: "pachete",
    producator: "Fermentis",
    codProdus: "YST-S23",
    subcategorie: "Lager",
  },

  // --- Adjuvanți și altele ---
  {
    id: 9,
    denumire: "Irish Moss",
    tip: "aditiv",
    cantitate: 0,
    unitate: "kg",
    producator: "Whirlfloc",
    codProdus: "ADD-IM",
    subcategorie: "Clarificare",
  },
  {
    id: 10,
    denumire: "Zahăr brun",
    tip: "zahar",
    cantitate: 0,
    unitate: "kg",
    producator: "Generic",
    codProdus: "SUG-BRN",
    subcategorie: "Refermentare",
  },
  {
    id: 11,
    denumire: "Apă filtrată",
    tip: "apa",
    cantitate: 0,
    unitate: "litri",
    producator: "Intern",
    codProdus: "WAT-FILT",
    subcategorie: "Apă tehnologică",
  },
];

// === 🔹 MATERIALE AMBALARE ===
const materialeAmbalareInitiale = [
  {
    id: 1,
    denumire: "Sticle 0.33l",
    tip: "sticle",
    cantitate: 0,
    unitate: "buc",
    producator: "Generic Packaging",
    codProdus: "STICLA-033",
  },
  {
    id: 2,
    denumire: "Cutii 6 sticle",
    tip: "cutii",
    cantitate: 0,
    unitate: "buc",
    producator: "Generic Packaging",
    codProdus: "CUTIE-6",
  },
  {
    id: 3,
    denumire: "Cutii 12 sticle",
    tip: "cutii",
    cantitate: 0,
    unitate: "buc",
    producator: "Generic Packaging",
    codProdus: "CUTIE-12",
  },
  {
    id: 4,
    denumire: "Cutii 20 sticle",
    tip: "cutii",
    cantitate: 0,
    unitate: "buc",
    producator: "Generic Packaging",
    codProdus: "CUTIE-12",
  },
  {
    id: 5,
    denumire: "Keg 10l",
    tip: "keg",
    cantitate: 0,
    unitate: "buc",
    producator: "Generic Kegs",
    codProdus: "KEG-10",
  },
  {
    id: 6,
    denumire: "Keg 20l",
    tip: "keg",
    cantitate: 0,
    unitate: "buc",
    producator: "Generic Kegs",
    codProdus: "KEG-20",
  },
  {
    id: 7,
    denumire: "Keg 40l",
    tip: "keg",
    cantitate: 0,
    unitate: "buc",
    producator: "Generic Kegs",
    codProdus: "KEG-40",
  },
  {
    id: 8,
    denumire: "Etichete",
    tip: "etichete",
    cantitate: 0,
    unitate: "buc",
    producator: "Generic Labels",
    codProdus: "ETICHETA-001",
  },
  {
    id: 9,
    denumire: "Capace",
    tip: "capace",
    cantitate: 0,
    unitate: "buc",
    producator: "Generic Caps",
    codProdus: "CAPAC-001",
  },
];

// === 🔹 FERMENTATOARE ===
const fermentatoareInitiale = [
  { id: 1, denumire: "F1", capacitate: 1000, unitate: "L", status: "liber" },
  { id: 2, denumire: "F2", capacitate: 1000, unitate: "L", status: "liber" },
  { id: 3, denumire: "F3", capacitate: 1000, unitate: "L", status: "liber" },
  { id: 4, denumire: "F4", capacitate: 1000, unitate: "L", status: "liber" },
  { id: 5, denumire: "F5", capacitate: 2000, unitate: "L", status: "liber" },
  { id: 6, denumire: "F6", capacitate: 2000, unitate: "L", status: "liber" },
];

// === 🔹 REȚETE CURENTU’ ===
const reteteBereInitiale = [
  {
    id: 1,
    nume: "USB Amper Ale",
    stil: "American Pale Ale",
    abv: 5.2,
    volum: 1000,
    descriere:
      "O bere echilibrată, cu note fructate de citrice și un finish curat.",
    ingrediente: [
      "Malț Pale Ale",
      "Hamei Citra",
      "Drojdie US-05",
      "Apă filtrată",
    ],
  },
  {
    id: 2,
    nume: "Întrerupător de Muncă",
    stil: "IPA",
    abv: 6.4,
    volum: 1000,
    descriere:
      "IPA intens aromată, cu amăreală echilibrată și accente tropicale.",
    ingrediente: [
      "Malț Pale Ale",
      "Hamei Mosaic",
      "Hamei Citra",
      "Drojdie US-05",
    ],
  },
  {
    id: 3,
    nume: "Adaptor la Situație",
    stil: "Pilsner",
    abv: 4.8,
    volum: 1000,
    descriere: "Berea de relaxare totală – limpede, ușoară și clasică.",
    ingrediente: ["Malț Pilsner", "Hamei Saaz", "Drojdie S-23", "Apă filtrată"],
  },
];

// === 🔹 STRUCTURA COMPLETĂ ===
const defaultData = {
  materiiPrime: materiiPrimeInitiale,
  materialeAmbalare: materialeAmbalareInitiale,
  fermentatoare: fermentatoareInitiale,
  reteteBere: reteteBereInitiale,
  loturiAmbalate: [],
  iesiriBere: [],
  rebuturi: [],
};

// === 🔹 INIȚIALIZARE BAZĂ DE DATE ===
const adapter = new JSONFile(dbPath);
const db = new Low(adapter, defaultData);

export async function initializeDb() {
  await db.read();

  if (!db.data) {
    db.data = defaultData;
    await db.write();
    console.log(
      "[✓] Baza de date creată cu valori implicite (inclusiv rețete)."
    );
  } else {
    let modified = false;

    // Completează lipsurile
    for (const key of Object.keys(defaultData)) {
      if (!db.data[key]) {
        db.data[key] = defaultData[key];
        modified = true;
      }
    }

    // ✅ Adaugă automat rețetele dacă lipsesc sau sunt goale
    if (!db.data.reteteBere || db.data.reteteBere.length === 0) {
      db.data.reteteBere = [
        {
          id: 1,
          nume: "USB Amper Ale",
          stil: "American Pale Ale",
          abv: 5.2,
          volum: 1000,
          descriere:
            "O bere echilibrată, cu note fructate de citrice și un finish curat.",
          ingrediente: [
            "Malț Pale Ale",
            "Hamei Citra",
            "Drojdie US-05",
            "Apă filtrată",
          ],
        },
        {
          id: 2,
          nume: "Întrerupător de Muncă",
          stil: "IPA",
          abv: 6.4,
          volum: 1000,
          descriere:
            "IPA intens aromată, cu amăreală echilibrată și accente tropicale.",
          ingrediente: [
            "Malț Pale Ale",
            "Hamei Mosaic",
            "Hamei Citra",
            "Drojdie US-05",
          ],
        },
        {
          id: 3,
          nume: "Adaptor la Situație",
          stil: "Pilsner",
          abv: 4.8,
          volum: 1000,
          descriere: "Berea de relaxare totală – limpede, ușoară și clasică.",
          ingrediente: [
            "Malț Pilsner",
            "Hamei Saaz",
            "Drojdie S-23",
            "Apă filtrată",
          ],
        },
      ];
      modified = true;
      console.log("[✓] Rețetele implicite au fost adăugate automat.");
    }

    if (modified) {
      await db.write();
    }

    console.log("[✓] Baza de date verificată și completă.");
  }
}

export { db };
