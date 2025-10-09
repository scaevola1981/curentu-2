import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const caleFisier = path.join(__dirname, 'fermentatoare.json');
console.log('Resolved file path for fermentatoare.json:', caleFisier); // Debug log

const fermentatoareInitiale = [
  { id: 1, nume: "Fermentator 1", capacitate: 1000, ocupat: false, reteta: null, cantitate: 0, dataInceput: null, imagine: "/Imagini/fermentator.png" },
  { id: 2, nume: "Fermentator 2", capacitate: 1000, ocupat: false, reteta: null, cantitate: 0, dataInceput: null, imagine: "/Imagini/fermentator.png" },
  { id: 3, nume: "Fermentator 3", capacitate: 1000, ocupat: false, reteta: null, cantitate: 0, dataInceput: null, imagine: "/Imagini/fermentator.png" },
  { id: 4, nume: "Fermentator 4", capacitate: 1000, ocupat: false, reteta: null, cantitate: 0, dataInceput: null, imagine: "/Imagini/fermentator.png" },
  { id: 5, nume: "Fermentator 5", capacitate: 2000, ocupat: false, reteta: null, cantitate: 0, dataInceput: null, imagine: "/Imagini/fermentator.png" },
  { id: 6, nume: "Fermentator 6", capacitate: 2000, ocupat: false, reteta: null, cantitate: 0, dataInceput: null, imagine: "/Imagini/fermentator.png" }
];

const adapter = new JSONFile(caleFisier);
const db = new Low(adapter, { fermentatoare: [] });

async function initializeDatabase() {
  try {
    console.log('Attempting to read fermentatoare.json from:', caleFisier); // Debug log
    await db.read();
    console.log('Current db.data after read:', db.data); // Debug log
    if (!db.data || !db.data.fermentatoare || db.data.fermentatoare.length === 0) {
      console.log('fermentatoare.json is empty or missing. Initializing with default data.'); // Debug log
      db.data = { fermentatoare: [...fermentatoareInitiale] }; // Deep copy to avoid mutation
      await db.write();
      console.log('Successfully initialized fermentatoare.json with:', db.data); // Debug log
    } else {
      console.log('fermentatoare.json already contains data:', db.data.fermentatoare); // Debug log
    }
  } catch (error) {
    console.error('Failed to initialize fermentatoare database:', error.message, error.stack);
    throw error; // Rethrow to catch in server logs
  }
}

async function getFermentatoare() {
  try {
    await db.read();
    console.log('getFermentatoare - Current db.data:', db.data); // Debug log
    return db.data.fermentatoare || [];
  } catch (error) {
    console.error('Error reading fermentatoare:', error.message, error.stack);
    return [];
  }
}

async function updateFermentator(id, updatedData) {
  try {
    await db.read();
    const fermentatoare = db.data.fermentatoare || [];
    const index = fermentatoare.findIndex(f => f.id === id);
    if (index === -1) {
      console.log(`Fermentator with id ${id} not found`); // Debug log
      return false;
    }
    fermentatoare[index] = { ...fermentatoare[index], ...updatedData };
    db.data.fermentatoare = fermentatoare;
    await db.write();
    console.log(`Updated fermentator ${id}:`, fermentatoare[index]); // Debug log
    return true;
  } catch (error) {
    console.error('Error updating fermentator:', error.message, error.stack);
    return false;
  }
}

// Initialize database and handle errors
initializeDatabase().catch(error => {
  console.error('Initialization failed:', error.message, error.stack);
});

export { getFermentatoare, updateFermentator };