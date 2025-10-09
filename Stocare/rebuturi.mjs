import { LowSync } from 'lowdb';
import { JSONFileSync } from 'lowdb/node';
import path from 'path';

const __dirname = path.resolve();
const filePath = path.join(__dirname, 'Stocare', 'rebut.json');
const adapter = new JSONFileSync(filePath);
const db = new LowSync(adapter, { rebuturi: [] });

db.read();
if (!db.data || !db.data.rebuturi) {
  db.data = { rebuturi: [] };
  db.write();
  console.log('Baza de date pentru rebuturi inițializată cu date implicite');
}

export async function obtineRebuturi() {
  try {
    db.read();
    return db.data.rebuturi || [];
  } catch (error) {
    console.error('Eroare la obținerea rebuturilor:', error.message);
    return [];
  }
}

export async function adaugaRebut(rebut) {
  try {
    db.read();
    const rebuturi = db.data.rebuturi || [];
    const newId = rebuturi.length > 0 ? Math.max(...rebuturi.map(r => r.id)) + 1 : 1;
    
    const rebutNou = {
      id: newId,
      lotId: rebut.lotId,
      reteta: rebut.reteta || 'Necunoscut',
      cantitate: parseFloat(rebut.cantitate || 0).toFixed(2),
      ambalaj: rebut.ambalaj || 'necunoscut',
      dataRebut: new Date().toISOString(),
      motiv: rebut.motiv || 'ratat',
      sursa: rebut.sursa || 'unknown', // 'ambalare' or 'depozitare'
      bottleSize: rebut.bottleSize,
      kegSize: rebut.kegSize,
      boxType: rebut.boxType,
    };

    rebuturi.push(rebutNou);
    db.data.rebuturi = rebuturi;
    db.write();
    return rebutNou;
  } catch (error) {
    console.error('Eroare la adăugarea rebutului:', error.message);
    throw error;
  }
}