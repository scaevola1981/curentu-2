import { db } from './db.mjs';

async function getFermentatoare() {
  try {
    await db.read();
    return db.data.fermentatoare || [];
  } catch (error) {
    console.error('Error reading fermentatoare:', error.message);
    return [];
  }
}

async function updateFermentator(id, updatedData) {
  try {
    await db.read();
    const fermentatoare = db.data.fermentatoare || [];
    const index = fermentatoare.findIndex(f => f.id === id);
    if (index === -1) {
      console.log(`Fermentator with id ${id} not found`);
      return false;
    }
    fermentatoare[index] = { ...fermentatoare[index], ...updatedData };
    db.data.fermentatoare = fermentatoare;
    await db.write();
    return true;
  } catch (error) {
    console.error('Error updating fermentator:', error.message);
    return false;
  }
}

export { getFermentatoare, updateFermentator };