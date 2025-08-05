import { LowSync } from "lowdb";
import { JSONFileSync } from "lowdb/node";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

const defaultData = { materialeAmbalare: materialeAmbalareInitiale };

const adapter = new JSONFileSync(path.join(__dirname, "materialeAmbalare.json"));
const db = new LowSync(adapter, defaultData);

db.read();

if (!db.data || !db.data.materialeAmbalare) {
  db.data = defaultData;
  db.write();
}

export function initializeDatabase() {
  db.read();
  if (!db.data || !db.data.materialeAmbalare || db.data.materialeAmbalare.length === 0) {
    db.data = defaultData;
    db.write();
    console.log('Baza de date inițializată cu materiale de ambalare default');
  }
}

export async function getMaterials() {
  try {
    db.read();
    console.log('getMaterials - Current materialeAmbalare:', db.data.materialeAmbalare);
    return db.data?.materialeAmbalare || [];
  } catch (error) {
    console.error("Error reading packaging materials:", error.message, error.stack);
    throw error;
  }
}

export async function addMaterial(material) {
  try {
    db.read();
    const materials = db.data.materialeAmbalare || [];
    const existingMaterialIndex = materials.findIndex(
      (m) =>
        m.denumire === material.denumire &&
        m.unitate === material.unitate &&
        m.producator === material.producator &&
        m.codProdus === material.codProdus &&
        m.lot === material.lot
    );

    if (existingMaterialIndex >= 0) {
      const newQuantity = Number(
        (materials[existingMaterialIndex].cantitate + material.cantitate).toFixed(2)
      );
      if (newQuantity < 0) {
        throw new Error(
          `Nu se poate scădea ${material.cantitate} ${material.unitate} din ${materials[existingMaterialIndex].denumire}. Stoc disponibil: ${materials[existingMaterialIndex].cantitate} ${material.unitate}`
        );
      }
      materials[existingMaterialIndex].cantitate = newQuantity;
    } else {
      if (material.cantitate < 0) {
        throw new Error('Nu se poate adăuga o cantitate negativă pentru un material nou');
      }
      const maxId = materials.length > 0 ? Math.max(...materials.map(m => m.id)) : 0;
      const newMaterial = { id: maxId + 1, ...material, cantitate: Number(material.cantitate.toFixed(2)) };
      materials.push(newMaterial);
    }

    db.data.materialeAmbalare = materials;
    db.write();
    return materials[existingMaterialIndex] || materials[materials.length - 1];
  } catch (error) {
    console.error("Error adding packaging material:", error.message, error.stack);
    throw error;
  }
}

export async function updateMaterial(id, updatedMaterial) {
  try {
    db.read();
    const materials = db.data.materialeAmbalare || [];
    const index = materials.findIndex(m => m.id === parseInt(id));
    if (index === -1) throw new Error('Packaging material not found');
    if (updatedMaterial.cantitate < 0) {
      throw new Error('Cantitatea nu poate fi negativă');
    }
    materials[index] = { ...materials[index], ...updatedMaterial, id: parseInt(id), cantitate: Number(updatedMaterial.cantitate.toFixed(2)) };
    db.data.materialeAmbalare = materials;
    db.write();
    return materials[index];
  } catch (error) {
    console.error("Error updating packaging material:", error.message, error.stack);
    throw error;
  }
}

export async function deleteMaterial(id) {
  try {
    db.read();
    const materials = db.data.materialeAmbalare || [];
    const newMaterials = materials.filter(m => m.id !== parseInt(id));
    if (newMaterials.length === materials.length) throw new Error('Packaging material not found');
    db.data.materialeAmbalare = newMaterials;
    db.write();
    return newMaterials;
  } catch (error) {
    console.error("Error deleting packaging material:", error.message, error.stack);
    throw error;
  }
}

export async function deleteAllMaterials() {
  try {
    db.read();
    db.data.materialeAmbalare = [];
    db.write();
    return [];
  } catch (error) {
    console.error("Error deleting all packaging materials:", error.message, error.stack);
    throw error;
  }
}

export async function exportMaterials() {
  try {
    db.read();
    const materials = db.data.materialeAmbalare || [];
    const headers = ['id', 'denumire', 'cantitate', 'unitate', 'producator', 'codProdus', 'lot', 'tip', 'subcategorie'];
    const csvRows = [
      headers.join(','),
      ...materials.map(m => 
        `"${m.id}","${m.denumire}",${m.cantitate},"${m.unitate}","${m.producator || ''}","${m.codProdus || ''}","${m.lot || ''}","${m.tip || ''}","${m.subcategorie || ''}"`
      )
    ];
    return csvRows.join('\n');
  } catch (error) {
    console.error("Error exporting packaging materials:", error.message, error.stack);
    throw error;
  }
}

initializeDatabase();