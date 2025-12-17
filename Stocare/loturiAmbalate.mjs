import { LowSync } from 'lowdb';
import { JSONFileSync } from 'lowdb/node';
import { fileURLToPath } from 'url';
import path from 'path';
import { DATA_PATH } from './config.mjs';

// Obține calea absolută către fișierul JSON

// Structura de date implicită
const defaultData = { loturi: [] };

// Inițializează LowDB cu JSONFileSync (versiunea sincronă)
const adapter = new JSONFileSync(path.join(DATA_PATH, 'loturiAmbalate.json'));
const db = new LowSync(adapter, defaultData);

// Citește baza de date și inițializează cu date implicite dacă este necesar
db.read();

if (!db.data || !db.data.loturi) {
  db.data = defaultData;
  db.write();
  console.log('Baza de date pentru loturi inițializată cu date implicite');
}

/**
 * Inițializează baza de date cu structura implicită
 */
export function initializeDatabase() {
  db.read();
  if (!db.data || !db.data.loturi || db.data.loturi.length === 0) {
    db.data = defaultData;
    db.write();
    console.log('Baza de date pentru loturi inițializată cu date implicite');
  }
}

/**
 * Adaugă un nou lot în baza de date
 * @param {Object} lot - Datele lotului de adăugat
 * @returns {Object} - Lotul adăugat cu ID-ul generat
 */
export async function adaugaLot(lot) {
  try {
    db.read();
    
    const loturi = db.data.loturi || [];
    const newId = loturi.length > 0 ? Math.max(...loturi.map(l => l.id)) + 1 : 1;
    const newLot = { 
      id: newId, 
      ...lot,
      dataCreare: new Date().toISOString()
    };
    
    loturi.push(newLot);
    db.data.loturi = loturi;
    db.write();
    
    console.log('Lot adăugat cu succes:', newLot.id);
    return newLot;
  } catch (error) {
    console.error('Eroare la adăugarea lotului:', error.message, error.stack);
    throw error;
  }
}

/**
 * Returnează toate loturile existente
 * @returns {Array} - Lista cu toate loturile
 */
export async function obtineLoturi() {
  try {
    db.read();
    return db.data?.loturi || [];
  } catch (error) {
    console.error('Eroare la obținerea loturilor:', error.message, error.stack);
    throw error;
  }
}

/**
 * Actualizează un lot existent
 * @param {number} id - ID-ul lotului de actualizat
 * @param {Object} updatedLot - Datele actualizate ale lotului
 * @returns {Object|null} - Lotul actualizat sau null dacă nu a fost găsit
 */
export async function actualizeazaLot(id, updatedLot) {
  try {
    db.read();
    const loturi = db.data.loturi || [];
    const index = loturi.findIndex(l => l.id === parseInt(id));
    
    if (index === -1) {
      throw new Error('Lotul nu a fost găsit');
    }
    
    loturi[index] = { 
      ...loturi[index], 
      ...updatedLot, 
      id: parseInt(id),
      dataActualizare: new Date().toISOString()
    };
    
    db.data.loturi = loturi;
    db.write();
    
    console.log('Lot actualizat cu succes:', id);
    return loturi[index];
  } catch (error) {
    console.error('Eroare la actualizarea lotului:', error.message, error.stack);
    throw error;
  }
}

/**
 * Șterge un lot din baza de date
 * @param {number} id - ID-ul lotului de șters
 * @returns {Array} - Lista actualizată de loturi
 */
export async function stergeLot(id) {
  try {
    db.read();
    const loturi = db.data.loturi || [];
    const newLoturi = loturi.filter(l => l.id !== parseInt(id));
    
    if (newLoturi.length === loturi.length) {
      throw new Error('Lotul nu a fost găsit');
    }
    
    db.data.loturi = newLoturi;
    db.write();
    
    console.log('Lot șters cu succes:', id);
    return newLoturi;
  } catch (error) {
    console.error('Eroare la ștergerea lotului:', error.message, error.stack);
    throw error;
  }
}

/**
 * Șterge toate loturile din baza de date
 * @returns {Array} - Lista goală
 */
export async function stergeToateLoturie() {
  try {
    db.read();
    db.data.loturi = [];
    db.write();
    
    console.log('Toate loturile au fost șterse');
    return [];
  } catch (error) {
    console.error('Eroare la ștergerea tuturor loturilor:', error.message, error.stack);
    throw error;
  }
}

/**
 * Obține un lot specific după ID
 * @param {number} id - ID-ul lotului căutat
 * @returns {Object|null} - Lotul găsit sau null
 */
export async function obtineLotDupaId(id) {
  try {
    db.read();
    const loturi = db.data.loturi || [];
    return loturi.find(l => l.id === parseInt(id)) || null;
  } catch (error) {
    console.error('Eroare la căutarea lotului:', error.message, error.stack);
    throw error;
  }
}

/**
 * Exportă loturile în format CSV
 * @returns {string} - Datele în format CSV
 */
export async function exportaLoturi() {
  try {
    db.read();
    const loturi = db.data.loturi || [];
    
    if (loturi.length === 0) {
      return 'id,nume,dataCreare,status\n';
    }
    
    const headers = Object.keys(loturi[0]).join(',');
    const csvRows = [
      headers,
      ...loturi.map(lot => 
        Object.values(lot).map(value => 
          typeof value === 'string' ? `"${value}"` : value
        ).join(',')
      )
    ];
    
    return csvRows.join('\n');
  } catch (error) {
    console.error('Eroare la exportarea loturilor:', error.message, error.stack);
    throw error;
  }
}

// Inițializează baza de date la încărcarea modulului
initializeDatabase();