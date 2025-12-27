import { db } from './db.mjs';

async function getReteteBere() {
  try {
    await db.read();
    return db.data.reteteBere || [];
  } catch (error) {
    console.error("Eroare la citirea rețetelor:", error.message);
    return [];
  }
}

export { getReteteBere };