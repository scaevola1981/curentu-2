import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const caleFisier = path.join(__dirname, 'loturiProducere.json');
if (!fs.existsSync(caleFisier)) {
  fs.writeFileSync(caleFisier, JSON.stringify({ loturi: [] }, null, 2), 'utf-8');
}

const adapter = new JSONFile(caleFisier);
const db = new Low(adapter, { loturi: [] });

async function initializeDatabase() {
  await db.read();
  db.data.loturi = db.data.loturi || [];
  await db.write();
}

async function adaugaLot(lot) {
  try {
    await db.read();
    const newId = db.data.loturi.length > 0 ? Math.max(...db.data.loturi.map(l => l.id)) + 1 : 1;
    const newLot = { id: newId, ...lot };
    db.data.loturi.push(newLot);
    await db.write();
    return newLot;
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