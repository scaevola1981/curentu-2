import { db } from './db.mjs';

export async function getMaterialeAmbalare() {
  try {
    await db.read();
    return db.data?.materialeAmbalare || [];
  } catch (error) {
    console.error("Eroare la citirea materialelor de ambalare:", error.message);
    throw error;
  }
}

export async function adaugaMaterialAmbalare(material) {
  try {
    await db.read();
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
    await db.write();
    return materiale[indexMaterialExistent] || materiale[materiale.length - 1];
  } catch (error) {
    console.error("Eroare la adăugarea materialului de ambalare:", error.message);
    throw error;
  }
}

export async function actualizeazaMaterialAmbalare(id, materialActualizat) {
  try {
    await db.read();
    const materiale = db.data.materialeAmbalare || [];
    const index = materiale.findIndex((m) => m.id === parseInt(id));
    if (index === -1) throw new Error("Material de ambalare negăsit");
    if (materialActualizat.cantitate < 0) {
      throw new Error("Cantitatea nu poate fi negativă");
    }
    materiale[index] = { ...materiale[index], ...materialActualizat, id: parseInt(id), cantitate: Number(materialActualizat.cantitate.toFixed(2)) };
    db.data.materialeAmbalare = materiale;
    await db.write();
    return materiale[index];
  } catch (error) {
    console.error("Eroare la actualizarea materialului de ambalare:", error.message);
    throw error;
  }
}

export async function stergeMaterialAmbalare(id) {
  try {
    await db.read();
    const materiale = db.data.materialeAmbalare || [];
    const materialeNoi = materiale.filter((m) => m.id !== parseInt(id));
    if (materialeNoi.length === materiale.length) throw new Error("Material de ambalare negăsit");
    db.data.materialeAmbalare = materialeNoi;
    await db.write();
    return materialeNoi;
  } catch (error) {
    console.error("Eroare la ștergerea materialului de ambalare:", error.message);
    throw error;
  }
}

export async function stergeToateMaterialeleAmbalare() {
  try {
    await db.read();
    db.data.materialeAmbalare = [];
    await db.write();
    return [];
  } catch (error) {
    console.error("Eroare la ștergerea tuturor materialelor de ambalare:", error.message);
    throw error;
  }
}

export async function exportaMaterialeAmbalare() {
  try {
    await db.read();
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
    console.error("Eroare la exportarea materialelor de ambalare:", error.message);
    throw error;
  }
}

export async function getMaterialePentruLot(lotId, numarUnitatiScoase, ambalaj, boxType) {
  try {
    await db.read();
    const materiale = db.data.materialeAmbalare || [];
    const materialeLot = {
      capace: 0,
      etichete: 0,
      cutii: 0,
      sticle: 0,
      keguri: 0,
      alteMateriale: [],
    };

    if (ambalaj === 'sticle') {
      const capace = materiale.find(m => m.denumire === 'Capace' && m.tip === 'capace' && m.unitate === 'buc');
      const etichete = materiale.find(m => m.denumire === 'Etichete' && m.tip === 'etichete' && m.unitate === 'buc');
      const sticle = materiale.find(m => m.denumire.includes('Sticle') && m.tip === 'sticle' && m.unitate === 'buc');

      if (capace) materialeLot.capace = parseInt(numarUnitatiScoase);
      if (etichete) materialeLot.etichete = parseInt(numarUnitatiScoase);
      if (sticle) materialeLot.sticle = parseInt(numarUnitatiScoase);

      if (boxType) {
        const sticlePerCutie = parseInt(boxType.split(' ')[0]);
        if (sticlePerCutie) {
          const cutieDenumire = `Cutii ${sticlePerCutie} sticle`;
          const cutie = materiale.find(m => m.denumire === cutieDenumire && m.tip === 'cutii' && m.unitate === 'buc');
          if (cutie) {
            const numarCutii = Math.ceil(numarUnitatiScoase / sticlePerCutie);
            materialeLot.cutii = numarCutii;
          }
        }
      }
    } else if (ambalaj === 'keguri') {
      const keg = materiale.find(m => m.denumire === boxType && m.tip === 'keg' && m.unitate === 'buc');
      if (keg) materialeLot.keguri = parseInt(numarUnitatiScoase);
    }

    return materialeLot;
  } catch (error) {
    console.error('Eroare la obținerea materialelor pentru lot:', error.message);
    return { capace: 0, etichete: 0, cutii: 0, sticle: 0, keguri: 0, alteMateriale: [] };
  }
}