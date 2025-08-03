import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurăm calea către fișierul JSON
const adapter = new JSONFile(path.join(__dirname, 'packaging.json'));
const db = new Low(adapter, { materialeAmbalare: [] }); // Added default data

// Lista inițială de materiale de ambalare
const materialeAmbalareInitiale = [
  { id: 1, denumire: "Sticle 0.33l", tip: "sticle", cantitate: 0, unitate: "buc", producator: "Generic Packaging", codProdus: "STICLA-001", lot: "", subcategorie: "" },
  { id: 2, denumire: "Cutii 6 sticle", tip: "cutii", cantitate: 0, unitate: "buc", producator: "Generic Packaging", codProdus: "CUTIE-001", lot: "", subcategorie: "" },
  { id: 3, denumire: "Cutii 12 sticle", tip: "cutii", cantitate: 0, unitate: "buc", producator: "Generic Packaging", codProdus: "CUTIE-002", lot: "", subcategorie: "" },
  { id: 4, denumire: "Cutii 24 sticle", tip: "cutii", cantitate: 0, unitate: "buc", producator: "Generic Packaging", codProdus: "CUTIE-003", lot: "", subcategorie: "" },
  { id: 5, denumire: "Keg 10l", tip: "keg", cantitate: 0, unitate: "buc", producator: "Generic Kegs", codProdus: "KEG-001", lot: "", subcategorie: "" },
  { id: 6, denumire: "Keg 20l", tip: "keg", cantitate: 0, unitate: "buc", producator: "Generic Kegs", codProdus: "KEG-002", lot: "", subcategorie: "" },
  { id: 7, denumire: "Keg 30l", tip: "keg", cantitate: 0, unitate: "buc", producator: "Generic Kegs", codProdus: "KEG-003", lot: "", subcategorie: "" },
  { id: 8, denumire: "Keg 40l", tip: "keg", cantitate: 0, unitate: "buc", producator: "Generic Kegs", codProdus: "KEG-004", lot: "", subcategorie: "" },
  { id: 9, denumire: "Keg 50l", tip: "keg", cantitate: 0, unitate: "buc", producator: "Generic Kegs", codProdus: "KEG-005", lot: "", subcategorie: "" },
  { id: 10, denumire: "Etichete", tip: "etichete", cantitate: 0, unitate: "buc", producator: "Generic Labels", codProdus: "ETICHETA-001", lot: "", subcategorie: "" },
  { id: 11, denumire: "Capace", tip: "capace", cantitate: 0, unitate: "buc", producator: "Generic Caps", codProdus: "CAPAC-001", lot: "", subcategorie: "" }
];

// Funcție pentru a inițializa baza de date
async function initializeDatabase() {
  try {
    console.log('Attempting to read packaging.json from:', path.join(__dirname, 'packaging.json')); // Debug log
    await db.read();
    console.log('Current db.data:', db.data); // Debug log
    if (!db.data || !db.data.materialeAmbalare || db.data.materialeAmbalare.length === 0) {
      console.log('packaging.json is empty or missing. Initializing with default data.'); // Debug log
      db.data = { materialeAmbalare: [...materialeAmbalareInitiale] };
      await db.write();
      console.log('Initialized packaging.json with:', db.data); // Debug log
    } else {
      console.log('packaging.json already contains data:', db.data.materialeAmbalare); // Debug log
    }
  } catch (error) {
    console.error('Failed to initialize packaging database:', error.message, error.stack);
    db.data = { materialeAmbalare: [...materialeAmbalareInitiale] }; // Fallback to default data
    await db.write();
    console.log('Fallback: Initialized packaging.json with default data:', db.data);
  }
}

// Funcție pentru a prelua toate materialele de ambalare
function getMaterialeAmbalare() {
  try {
    db.read();
    console.log('getMaterialeAmbalare - Current db.data:', db.data); // Debug log
    return db.data.materialeAmbalare || [];
  } catch (error) {
    console.error('Error reading materialeAmbalare:', error.message, error.stack);
    return [...materialeAmbalareInitiale];
  }
}

// Funcție pentru a adăuga sau actualiza un material de ambalare
function adaugaSauSuplimenteazaMaterialAmbalare(material) {
  try {
    console.log('Trying to add/update packaging material:', material); // Debug log
    const materii = db.get('materialeAmbalare').value();
    const existingMaterialIndex = materii.findIndex(
      (m) =>
        m.denumire === material.denumire &&
        m.unitate === material.unitate &&
        m.producator === material.producator &&
        m.codProdus === material.codProdus &&
        m.lot === material.lot
    );

    let newMaterial;
    if (existingMaterialIndex >= 0) {
      console.log('Updating existing material at index:', existingMaterialIndex); // Debug log
      const newQuantity = Number((materii[existingMaterialIndex].cantitate + material.cantitate).toFixed(2));
      if (newQuantity < 0) {
        console.error('Cannot reduce stock below 0 for:', material.denumire);
        return false;
      }
      db.get('materialeAmbalare')
        .find({ id: materii[existingMaterialIndex].id })
        .assign({ cantitate: newQuantity })
        .write();
      newMaterial = db.get('materialeAmbalare').find({ id: materii[existingMaterialIndex].id }).value();
    } else {
      const initialMaterial = materialeAmbalareInitiale.find(
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
      console.log('Adding new material with ID:', newId); // Debug log
      newMaterial = { ...material, id: material.id || newId };
      db.get('materialeAmbalare').push(newMaterial).write();
    }
    console.log('Packaging material saved successfully, new content:', getMaterialeAmbalare()); // Debug log
    return true;
  } catch (error) {
    console.error('Error in adaugaSauSuplimenteazaMaterialAmbalare:', error.message, error.stack);
    return false;
  }
}

// Funcție pentru a șterge un material de ambalare după ID
function stergeMaterialAmbalare(id) {
  try {
    console.log('Deleting packaging material with ID:', id); // Debug log
    db.get('materialeAmbalare').remove({ id }).write();
    console.log('Packaging material deleted successfully'); // Debug log
    return true;
  } catch (error) {
    console.error('Error deleting packaging material:', error.message, error.stack);
    return false;
  }
}

// Funcție pentru a șterge toate materialele de ambalare
function stergeToateMaterialeleAmbalare() {
  try {
    console.log('Deleting all packaging materials'); // Debug log
    db.set('materialeAmbalare', []).write();
    console.log('All packaging materials deleted successfully'); // Debug log
    return true;
  } catch (error) {
    console.error('Error deleting all packaging materials:', error.message, error.stack);
    return false;
  }
}

// Funcție pentru a exporta materialele de ambalare în CSV
function exportMaterialeAmbalare() {
  try {
    console.log('Exporting packaging materials to CSV'); // Debug log
    const materii = db.get('materialeAmbalare').value();
    const csvContent = [
      ['ID', 'Denumire', 'Cantitate', 'Unitate', 'Producator', 'Cod Produs', 'Lot', 'Tip', 'Subcategorie'],
      ...materii.map((m) => [
        m.id,
        `"${m.denumire}"`,
        m.cantitate,
        m.unitate,
        `"${m.producator || ''}"`,
        `"${m.codProdus || ''}"`,
        `"${m.lot || ''}"`,
        `"${m.tip || ''}"`,
        `"${m.subcategorie || ''}"`
      ])
    ]
      .map((row) => row.join(','))
      .join('\n');

    fs.writeFileSync(path.join(__dirname, 'materiale_ambalare.csv'), csvContent, { encoding: 'utf-8' });
    console.log('CSV exported successfully to materiale_ambalare.csv'); // Debug log
  } catch (error) {
    console.error('Error exporting packaging materials:', error.message, error.stack);
  }
}

// Inițializăm baza de date
initializeDatabase().catch(error => {
  console.error('Initialization failed:', error.message, error.stack);
});

export {
  materialeAmbalareInitiale,
  getMaterialeAmbalare,
  adaugaSauSuplimenteazaMaterialAmbalare,
  stergeMaterialAmbalare,
  stergeToateMaterialeleAmbalare,
  exportMaterialeAmbalare
};