import { db } from './db.mjs';

/**
 * Adaugă un nou lot în baza de date
 */
export async function adaugaLot(lot) {
  try {
    await db.read();

    const loturi = db.data.loturiAmbalate || [];
    const newId = loturi.length > 0 ? Math.max(...loturi.map(l => l.id)) + 1 : 1;
    const newLot = {
      id: newId,
      ...lot,
      dataCreare: new Date().toISOString()
    };

    loturi.push(newLot);
    db.data.loturiAmbalate = loturi;
    await db.write();

    console.log('Lot adăugat cu succes:', newLot.id);
    return newLot;
  } catch (error) {
    console.error('Eroare la adăugarea lotului:', error.message);
    throw error;
  }
}

/**
 * Returnează toate loturile existente
 */
export async function obtineLoturi() {
  try {
    await db.read();
    return db.data?.loturiAmbalate || [];
  } catch (error) {
    console.error('Eroare la obținerea loturilor:', error.message);
    throw error;
  }
}

/**
 * Actualizează un lot existent
 */
export async function actualizeazaLot(id, updatedLot) {
  try {
    await db.read();
    const loturi = db.data.loturiAmbalate || [];
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

    db.data.loturiAmbalate = loturi;
    await db.write();

    console.log('Lot actualizat cu succes:', id);
    return loturi[index];
  } catch (error) {
    console.error('Eroare la actualizarea lotului:', error.message);
    throw error;
  }
}

/**
 * Șterge un lot din baza de date
 */
export async function stergeLot(id) {
  try {
    await db.read();
    const loturi = db.data.loturiAmbalate || [];
    const newLoturi = loturi.filter(l => l.id !== parseInt(id));

    if (newLoturi.length === loturi.length) {
      throw new Error('Lotul nu a fost găsit');
    }

    db.data.loturiAmbalate = newLoturi;
    await db.write();

    console.log('Lot șters cu succes:', id);
    return newLoturi;
  } catch (error) {
    console.error('Eroare la ștergerea lotului:', error.message);
    throw error;
  }
}

/**
 * Obține un lot specific după ID
 */
export async function obtineLotDupaId(id) {
  try {
    await db.read();
    const loturi = db.data.loturiAmbalate || [];
    return loturi.find(l => l.id === parseInt(id)) || null;
  } catch (error) {
    console.error('Eroare la căutarea lotului:', error.message);
    throw error;
  }
}