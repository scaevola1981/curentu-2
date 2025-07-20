import { LowSync } from "lowdb";
import { JSONFileSync } from "lowdb/node";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const materialeInitiale = [
  {
    id: 1,
    denumire: "Malt",
    tip: "malt",
    cantitate: 0,
    unitate: "kg",
    producator: "Generic Malt",
    codProdus: "MALT-001",
    lot: "",
    subcategorie: "",
  },
  {
    id: 2,
    denumire: "Malt Pale Ale",
    tip: "malt",
    cantitate: 0,
    unitate: "kg",
    producator: "Generic Malt",
    codProdus: "MALT-002",
    lot: "",
    subcategorie: "",
  },
  {
    id: 3,
    denumire: "Drojdie Fermentis U.S 05",
    tip: "drojdie",
    cantitate: 0,
    unitate: "g",
    producator: "Fermentis",
    codProdus: "DROJDIE-001",
    lot: "",
    subcategorie: "",
  },
  {
    id: 4,
    denumire: "Drojdie F2",
    tip: "drojdie",
    cantitate: 0,
    unitate: "g",
    producator: "Fermentis",
    codProdus: "DROJDIE-002",
    lot: "",
    subcategorie: "",
  },
  {
    id: 5,
    denumire: "Drojdie B.E 256",
    tip: "drojdie",
    cantitate: 0,
    unitate: "g",
    producator: "Fermentis",
    codProdus: "DROJDIE-003",
    lot: "",
    subcategorie: "",
  },
  {
    id: 6,
    denumire: "B.E 256",
    tip: "drojdie",
    cantitate: 0,
    unitate: "g",
    producator: "Fermentis",
    codProdus: "DROJDIE-004",
    lot: "",
    subcategorie: "",
  },
  {
    id: 7,
    denumire: "Hamei Bitter",
    tip: "hamei",
    cantitate: 0,
    unitate: "kg",
    producator: "Generic Hops",
    codProdus: "HAMEI-001",
    lot: "",
    subcategorie: "",
  },
  {
    id: 8,
    denumire: "Hamei Aroma",
    tip: "hamei",
    cantitate: 0,
    unitate: "kg",
    producator: "Generic Hops",
    codProdus: "HAMEI-002",
    lot: "",
    subcategorie: "",
  },
  {
    id: 9,
    denumire: "Irish Moss",
    tip: "aditiv",
    cantitate: 0,
    unitate: "pachete",
    producator: "Generic Additives",
    codProdus: "ADITIV-001",
    lot: "",
    subcategorie: "",
  },
  {
    id: 10,
    denumire: "Zahar brun",
    tip: "aditiv",
    cantitate: 0,
    unitate: "kg",
    producator: "Generic Additives",
    codProdus: "ADITIV-002",
    lot: "",
    subcategorie: "",
  },
];

// Structura default pentru baza de date
const defaultData = { materiiPrime: materialeInitiale };

// Inițializează baza de date cu date default
const adapter = new JSONFileSync(path.join(__dirname, "db.json"));
const db = new LowSync(adapter, defaultData);

// Citește datele existente sau creează fișierul cu date default
db.read();

// Dacă fișierul nu există sau nu are structura corectă, inițializează cu date default
if (!db.data || !db.data.materiiPrime) {
  db.data = defaultData;
  db.write();
}

// Inițializează baza de date cu ingredientele specificate dacă nu există deja
export function initializeDatabase() {
  db.read();
  if (!db.data || !db.data.materiiPrime || db.data.materiiPrime.length === 0) {
    db.data = defaultData;
    db.write();
    console.log('Baza de date inițializată cu materiale default');
  }
}

// Preluare materiale
export function getMateriiPrime() {
  try {
    db.read();
    return db.data?.materiiPrime || [];
  } catch (error) {
    console.error("Eroare la citirea materiilor prime:", error);
    return [];
  }
}

// Adăugare sau suplimentare material
export function adaugaSauSuplimenteazaMaterial(material) {
  try {
    db.read();
    const materii = db.data.materiiPrime || [];
    
    const existingMaterialIndex = materii.findIndex(
      (m) =>
        m.denumire === material.denumire &&
        m.unitate === material.unitate &&
        m.producator === material.producator &&
        m.codProdus === material.codProdus &&
        m.lot === material.lot
    );

    if (existingMaterialIndex >= 0) {
      // Actualizează cantitatea existentă
      materii[existingMaterialIndex].cantitate = Number(
        (materii[existingMaterialIndex].cantitate + material.cantitate).toFixed(2)
      );
    } else {
      // Adaugă material nou
      const initialMaterial = materialeInitiale.find(
        (m) =>
          m.denumire === material.denumire &&
          m.unitate === material.unitate &&
          m.producator === material.producator &&
          m.codProdus === material.codProdus
      );
      
      const newId = initialMaterial
        ? initialMaterial.id
        : materii.length > 0
        ? Math.max(...materii.map((m) => parseInt(m.id))) + 1
        : 1;
      
      materii.push({ ...material, id: newId });
    }
    
    db.data.materiiPrime = materii;
    db.write();
    return true;
  } catch (error) {
    console.error("Eroare în adaugaSauSuplimenteazaMaterial:", error);
    return false;
  }
}

// Actualizare material (pentru suplimentare cantitate cu PUT)
export function actualizeazaMaterial(id, material) {
  try {
    db.read();
    const materii = db.data.materiiPrime || [];
    const existingMaterialIndex = materii.findIndex((m) => m.id === Number(id));
    
    if (existingMaterialIndex >= 0) {
      materii[existingMaterialIndex] = {
        ...materii[existingMaterialIndex],
        ...material,
        id: Number(id),
        cantitate: Number(material.cantitate.toFixed(2)),
      };
      db.data.materiiPrime = materii;
      db.write();
      return true;
    }
    return false;
  } catch (error) {
    console.error("Eroare la actualizarea materialului:", error);
    return false;
  }
}

// Ștergere material după ID
export function stergeMaterial(id) {
  try {
    db.read();
    db.data.materiiPrime = db.data.materiiPrime.filter(
      (m) => m.id !== Number(id)
    );
    db.write();
    return true;
  } catch (error) {
    console.error("Eroare la ștergerea materialului:", error);
    return false;
  }
}

// Ștergere toate materialele
export function stergeToateMaterialele() {
  try {
    db.read();
    db.data.materiiPrime = [];
    db.write();
    return true;
  } catch (error) {
    console.error("Eroare la ștergerea tuturor materialelor:", error);
    return false;
  }
}

// Inițializare la import
initializeDatabase();