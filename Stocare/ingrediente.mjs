
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import process from "process";
import { DATA_PATH } from './config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getDbPath() {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    return path.join(DATA_PATH, "db.json");
  } else {
    const dbDir = path.join(homedir(), "Documents", "CurentuApp");

    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }

    return path.join(DATA_PATH, 'db.json');
  }
}

export const materialeInitiale = [
  // ... (lista ta de materialeInitiale rămâne neschimbată)
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
  // ... (restul materialelor)
];

const defaultData = { materiiPrime: materialeInitiale };
const adapter = new JSONFile(getDbPath());
const db = new Low(adapter, defaultData);

(async () => {
  await db.read();
  if (!db.data || !db.data.materiiPrime) {
    db.data = defaultData;
    await db.write();
  }
})();

export async function initializeDatabase() {
  await db.read();
  if (!db.data || !db.data.materiiPrime || db.data.materiiPrime.length === 0) {
    db.data = defaultData;
    await db.write();
    console.log("Baza de date inițializată cu materiale default");
  }
}

export async function getMateriiPrime() {
  try {
    await db.read();
    return db.data?.materiiPrime || [];
  } catch (error) {
    console.error("Eroare la citirea materiilor prime:", error);
    return [];
  }
}

export async function adaugaSauSuplimenteazaMaterial(material) {
  try {
    await db.read();
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
      materii[existingMaterialIndex].cantitate = Number(
        (materii[existingMaterialIndex].cantitate + material.cantitate).toFixed(2)
      );
    } else {
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
    await db.write();
    return true;
  } catch (error) {
    console.error("Eroare în adaugaSauSuplimenteazaMaterial:", error);
    return false;
  }
}

export async function actualizeazaMaterial(id, material) {
  try {
    await db.read();
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
      await db.write();
      return true;
    }
    return false;
  } catch (error) {
    console.error("Eroare la actualizarea materialului:", error);
    return false;
  }
}

export async function stergeMaterial(id) {
  try {
    await db.read();
    db.data.materiiPrime = db.data.materiiPrime.filter((m) => m.id !== Number(id));
    await db.write();
    return true;
  } catch (error) {
    console.error("Eroare la ștergerea materialului:", error);
    return false;
  }
}

export async function stergeToateMaterialele() {
  try {
    await db.read();
    db.data.materiiPrime = [];
    await db.write();
    return true;
  } catch (error) {
    console.error("Eroare la ștergerea tuturor materialelor:", error);
    return false;
  }
}

initializeDatabase().catch(console.error);
