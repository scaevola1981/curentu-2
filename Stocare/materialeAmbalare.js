const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');

// Configurăm calea către fișierul JSON care va servi ca bază de date pentru materialele de ambalare
const adapter = new FileSync(path.join(__dirname, 'packaging.json'));
const db = low(adapter);

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

// Funcție pentru a inițializa baza de date cu materialele de ambalare specificate
function initializeDatabase() {
  // Inițializăm baza de date cu materialele de ambalare
  db.defaults({ materialeAmbalare: materialeAmbalareInitiale }).write();
}

// Funcție pentru a prelua toate materialele de ambalare
function getMaterialeAmbalare() {
  try {
    return db.get('materialeAmbalare').value();
  } catch (error) {
    console.error('Eroare la citirea datelor din lowDB:', error);
    return [...materialeAmbalareInitiale];
  }
}

// Funcție pentru a adăuga sau actualiza un material de ambalare
function adaugaSauSuplimenteazaMaterialAmbalare(material) {
  try {
    console.log('Încercare de a adăuga/actualiza material de ambalare:', material);
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
      console.log('Actualizare material existent la index:', existingMaterialIndex);
      db.get('materialeAmbalare')
        .find({ id: materii[existingMaterialIndex].id })
        .assign({ cantitate: Number((materii[existingMaterialIndex].cantitate + material.cantitate).toFixed(2)) })
        .write();
      newMaterial = db.get('materialeAmbalare').find({ id: materii[existingMaterialIndex].id }).value();
    } else {
      // Verificăm dacă materialul există în materialeAmbalareInitiale pentru a păstra ID-ul
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
      console.log('Adăugare material nou cu ID:', newId);
      newMaterial = { ...material, id: material.id || newId };
      db.get('materialeAmbalare').push(newMaterial).write();
    }
    console.log('Material de ambalare salvat cu succes, conținut nou:', getMaterialeAmbalare());
    return true;
  } catch (error) {
    console.error('Eroare în adaugaSauSuplimenteazaMaterialAmbalare:', error);
    return false;
  }
}

// Funcție pentru a șterge un material de ambalare după ID
function stergeMaterialAmbalare(id) {
  try {
    console.log('Ștergere material de ambalare cu ID:', id);
    db.get('materialeAmbalare').remove({ id }).write();
    console.log('Material de ambalare șters cu succes');
    return true;
  } catch (error) {
    console.error('Eroare la ștergerea materialului de ambalare:', error);
    return false;
  }
}

// Funcție pentru a șterge toate materialele de ambalare
function stergeToateMaterialeleAmbalare() {
  try {
    console.log('Ștergere toate materialele de ambalare');
    db.set('materialeAmbalare', []).write();
    console.log('Toate materialele de ambalare au fost șterse cu succes');
    return true;
  } catch (error) {
    console.error('Eroare la ștergerea tuturor materialelor de ambalare:', error);
    return false;
  }
}

// Funcție pentru a exporta materialele de ambalare în CSV
function exportMaterialeAmbalare() {
  try {
    console.log('Exportare materiale de ambalare în CSV');
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

    // Salvăm fișierul CSV local
    fs.writeFileSync(path.join(__dirname, 'materiale_ambalare.csv'), csvContent, { encoding: 'utf-8' });
    console.log('CSV exportat cu succes în materiale_ambalare.csv');
  } catch (error) {
    console.error('Eroare la exportarea materialelor de ambalare:', error);
  }
}

// Inițializăm baza de date
initializeDatabase();

module.exports = {
  materialeAmbalareInitiale,
  getMaterialeAmbalare,
  adaugaSauSuplimenteazaMaterialAmbalare,
  stergeMaterialAmbalare,
  stergeToateMaterialeleAmbalare,
  exportMaterialeAmbalare
};