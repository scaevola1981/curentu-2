
import { db } from "./db.mjs";

export async function getMateriiPrime() {
  try {
    await db.read();
    return db.data?.materiiPrime || [];
  } catch (error) {
    console.error("Eroare la citirea materiilor prime:", error);
    return [];
  }
}

export async function adaugaSauSuplimenteazaMaterial(material) {
  try {
    await db.read();
    const materii = db.data.materiiPrime || [];

    const existingMaterialIndex = materii.findIndex(
      (m) =>
        m.denumire === material.denumire &&
        m.unitate === material.unitate &&
        m.producator === material.producator &&
        m.codProdus === material.codProdus &&
        m.lot === material.lot
    );

    if (existingMaterialIndex >= 0) {
      materii[existingMaterialIndex].cantitate = Number(
        (materii[existingMaterialIndex].cantitate + material.cantitate).toFixed(2)
      );
    } else {
      // Calculăm ID nou
      const newId = materii.length > 0
        ? Math.max(...materii.map((m) => parseInt(m.id))) + 1
        : 1;

      materii.push({ ...material, id: newId });
    }

    db.data.materiiPrime = materii;
    await db.write();
    return true;
  } catch (error) {
    console.error("Eroare în adaugaSauSuplimenteazaMaterial:", error);
    return false;
  }
}

export async function actualizeazaMaterial(id, material) {
  try {
    await db.read();
    const materii = db.data.materiiPrime || [];
    const existingMaterialIndex = materii.findIndex((m) => m.id === Number(id));

    if (existingMaterialIndex >= 0) {
      materii[existingMaterialIndex] = {
        ...materii[existingMaterialIndex],
        ...material,
        id: Number(id),
        cantitate: Number(material.cantitate.toFixed(2)),
      };
      db.data.materiiPrime = materii;
      await db.write();
      return true;
    }
    return false;
  } catch (error) {
    console.error("Eroare la actualizarea materialului:", error);
    return false;
  }
}

export async function stergeMaterial(id) {
  try {
    await db.read();
    db.data.materiiPrime = db.data.materiiPrime.filter((m) => m.id !== Number(id));
    await db.write();
    return true;
  } catch (error) {
    console.error("Eroare la ștergerea materialului:", error);
    return false;
  }
}

export async function stergeToateMaterialele() {
  try {
    await db.read();
    db.data.materiiPrime = [];
    await db.write();
    return true;
  } catch (error) {
    console.error("Eroare la ștergerea tuturor materialelor:", error);
    return false;
  }
}
