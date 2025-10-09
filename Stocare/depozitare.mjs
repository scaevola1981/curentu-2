// Stocare/depozitare.js
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const caleFisier = path.join(__dirname, 'depozitare.json');
if (!fs.existsSync(caleFisier)) {
  fs.mkdirSync(path.dirname(caleFisier), { recursive: true });
  fs.writeFileSync(caleFisier, JSON.stringify({
    loturi: [],
  }, null, 2), 'utf-8');
  console.log(`Fișierul ${caleFisier} a fost creat.`);
}

const adapter = new JSONFile(caleFisier);
const db = new Low(adapter, { loturi: [] });

async function initializeazaBazaDeDate() {
  await db.read();
  if (!db.data.loturi) {
    db.data = { loturi: [] };
    await db.write();
    console.log("Baza de date pentru loturi inițializată cu date implicite.");
  }
}

async function getLoturi() {
  await db.read();
  return db.data.loturi || [];
}

async function addLot(lot) {
  await db.read();
  db.data.loturi.push(lot);
  await db.write();
  return true;
}

async function updateLot(lotId, updatedLot) {
  await db.read();
  const index = db.data.loturi.findIndex(l => l.id === lotId);
  if (index !== -1) {
    db.data.loturi[index] = { ...db.data.loturi[index], ...updatedLot };
    db.data.loturi = db.data.loturi.filter(l => parseFloat(l.cantitate) > 0);
    await db.write();
    return true;
  }
  return false;
}

async function removeLot(lotId) {
  await db.read();
  db.data.loturi = db.data.loturi.filter(l => l.id !== lotId);
  await db.write();
  return true;
}

// Inițializare la încărcare
initializeazaBazaDeDate().catch(error => {
  console.error("Eroare la inițializarea bazei de date pentru loturi:", error.message, error.stack);
});

export {
  getLoturi,
  addLot,
  updateLot,
  removeLot,
};