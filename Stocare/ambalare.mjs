// Stocare/loturiProducere.js
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { DATA_PATH } from './config.mjs';


// Asigură-te că fișierul JSON există
const caleFisier = path.join(DATA_PATH, 'loturiAmbalate.json');
if (!fs.existsSync(caleFisier)) {
  fs.writeFileSync(caleFisier, JSON.stringify({ loturi: [] }, null, 2), 'utf-8');
}

const adapter = new JSONFile(caleFisier);
const db = new Low(adapter, { loturi: [] });

// Inițializează baza de date
async function initializeDatabase() {
  await db.read();
  db.data.loturi = db.data.loturi || [];
  await db.write();
}

function genereazaIdUnic() {
  return 'lot-' + Date.now();
}

async function adaugaLot(lot) {
  try {
    await db.read();
    const id = genereazaIdUnic();
    const lotNou = {
      id,
      reteta: lot.reteta || lot.retetaNume, // Support both Productie.jsx and Ambalare.jsx
      cantitate: lot.cantitate,
      fermentator: lot.fermentator || null, // Optional for Ambalare.jsx
      dataStart: lot.dataStart || new Date().toISOString(),
      ambalaj: lot.ambalaj || null, // From Ambalare.jsx
      numarUnitati: lot.numarUnitati || null, // From Ambalare.jsx
    };
    db.data.loturi.push(lotNou);
    await db.write();
    return lotNou;
  } catch (error) {
    console.error('Eroare la adăugarea lotului:', error);
    throw error;
  }
}

async function obtineLoturi() {
  try {
    await db.read();
    return db.data.loturi || [];
  } catch (error) {
    console.error('Eroare la obținerea loturilor:', error);
    return [];
  }
}

await initializeDatabase();

export { adaugaLot, obtineLoturi };