// Stocare/materialeAmbalare.js
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
  { id: 11, denumire: "Capace", tip: "capace", cantitate: 0, unitate: "buc", producator: "Generic Caps", codProdus: "CAPAC-001", lot: "", subcategorie: "" },
];

const dateInitiale = { materialeAmbalare: materialeAmbalareInitiale };

const adapter = new JSONFileSync(path.join(__dirname, "materialeAmbalare.json"));
const db = new LowSync(adapter, dateInitiale);

db.read();

if (!db.data || !db.data.materialeAmbalare) {
  db.data = dateInitiale;
  db.write();
}

function initializeazaBazaDeDate() {
  db.read();
  if (!db.data || !db.data.materialeAmbalare || db.data.materialeAmbalare.length === 0) {
    db.data = dateInitiale;
    db.write();
    console.log("Baza de date inițializată cu materiale de ambalare default");
  }
}

async function getMaterialeAmbalare() {
  try {
    db.read();
    console.log("getMaterialeAmbalare - Materiale curente:", db.data.materialeAmbalare);
    return db.data?.materialeAmbalare || [];
  } catch (error) {
    console.error("Eroare la citirea materialelor de ambalare:", error.message, error.stack);
    throw error;
  }
}

async function adaugaMaterialAmbalare(material) {
  try {
    db.read();
    const materiale = db.data.materialeAmbalare || [];
    const indexMaterialExistent = materiale.findIndex(
      (m) =>
        m.denumire === material.denumire &&
        m.unitate === material.unitate &&
        m.producator === material.producator &&
        m.codProdus === material.codProdus &&
        m.lot === material.lot
    );

    if (indexMaterialExistent >= 0) {
      const cantitateNoua = Number((materiale[indexMaterialExistent].cantitate + material.cantitate).toFixed(2));
      if (cantitateNoua < 0) {
        throw new Error(
          `Nu se poate scădea ${material.cantitate} ${material.unitate} din ${materiale[indexMaterialExistent].denumire}. Stoc disponibil: ${materiale[indexMaterialExistent].cantitate} ${material.unitate}`
        );
      }
      materiale[indexMaterialExistent].cantitate = cantitateNoua;
    } else {
      if (material.cantitate < 0) {
        throw new Error("Nu se poate adăuga o cantitate negativă pentru un material nou");
      }
      const idMaxim = materiale.length > 0 ? Math.max(...materiale.map((m) => m.id)) : 0;
      const materialNou = { id: idMaxim + 1, ...material, cantitate: Number(material.cantitate.toFixed(2)) };
      materiale.push(materialNou);
    }

    db.data.materialeAmbalare = materiale;
    db.write();
    return materiale[indexMaterialExistent] || materiale[materiale.length - 1];
  } catch (error) {
    console.error("Eroare la adăugarea materialului de ambalare:", error.message, error.stack);
    throw error;
  }
}

async function actualizeazaMaterialAmbalare(id, materialActualizat) {
  try {
    db.read();
    const materiale = db.data.materialeAmbalare || [];
    const index = materiale.findIndex((m) => m.id === parseInt(id));
    if (index === -1) throw new Error("Material de ambalare negăsit");
    if (materialActualizat.cantitate < 0) {
      throw new Error("Cantitatea nu poate fi negativă");
    }
    materiale[index] = { ...materiale[index], ...materialActualizat, id: parseInt(id), cantitate: Number(materialActualizat.cantitate.toFixed(2)) };
    db.data.materialeAmbalare = materiale;
    db.write();
    return materiale[index];
  } catch (error) {
    console.error("Eroare la actualizarea materialului de ambalare:", error.message, error.stack);
    throw error;
  }
}

async function stergeMaterialAmbalare(id) {
  try {
    db.read();
    const materiale = db.data.materialeAmbalare || [];
    const materialeNoi = materiale.filter((m) => m.id !== parseInt(id));
    if (materialeNoi.length === materiale.length) throw new Error("Material de ambalare negăsit");
    db.data.materialeAmbalare = materialeNoi;
    db.write();
    return materialeNoi;
  } catch (error) {
    console.error("Eroare la ștergerea materialului de ambalare:", error.message, error.stack);
    throw error;
  }
}

async function stergeToateMaterialeleAmbalare() {
  try {
    db.read();
    db.data.materialeAmbalare = [];
    db.write();
    return [];
  } catch (error) {
    console.error("Eroare la ștergerea tuturor materialelor de ambalare:", error.message, error.stack);
    throw error;
  }
}

async function exportaMaterialeAmbalare() {
  try {
    db.read();
    const materiale = db.data.materialeAmbalare || [];
    const headere = ["id", "denumire", "cantitate", "unitate", "producator", "codProdus", "lot", "tip", "subcategorie"];
    const randuriCSV = [
      headere.join(","),
      ...materiale.map((m) =>
        `"${m.id}","${m.denumire}",${m.cantitate},"${m.unitate}","${m.producator || ""}","${m.codProdus || ""}","${m.lot || ""}","${m.tip || ""}","${m.subcategorie || ""}"`
      ),
    ];
    return randuriCSV.join("\n");
  } catch (error) {
    console.error("Eroare la exportarea materialelor de ambalare:", error.message, error.stack);
    throw error;
  }
}

initializeazaBazaDeDate();

export {
  getMaterialeAmbalare,
  adaugaMaterialAmbalare,
  actualizeazaMaterialAmbalare,
  stergeMaterialAmbalare,
  stergeToateMaterialeleAmbalare,
  exportaMaterialeAmbalare,
};