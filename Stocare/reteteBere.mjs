// Stocare/reteteBere.js
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { DATA_PATH } from './config.mjs';


const caleFisier = path.join(DATA_PATH, 'reteteBere.json');
if (!fs.existsSync(caleFisier)) {
  fs.writeFileSync(caleFisier, JSON.stringify({ retete: [] }, null, 2), 'utf-8');
}

const adapter = new JSONFile(caleFisier);
const db = new Low(adapter, { retete: [] });

const reteteInitiale = [
  {
    id: 1,
    denumire: "ADAPTOR LA SITUATIE - CB 01",
    tip: "Blondă",
    concentratieMust: "12 ±0.50°Plato",
    concentratieAlcool: "5 ±0.5% vol",
    image: "/adaptor.png",
    durata: 0,
    rezultat: { cantitate: 1000, unitate: "litri" },
    ingrediente: [
      { denumire: "Malt Pale Ale", cantitate: 400, unitate: "kg", tip: "malt" },
      { denumire: "Zahar brun", cantitate: 20, unitate: "kg", tip: "aditiv" },
      { denumire: "Drojdie BE 256", cantitate: 0.5, unitate: "kg", tip: "drojdie" },
      { denumire: "Drojdie F2", cantitate: 0.5, unitate: "kg", tip: "drojdie" },
      { denumire: "Hamei Bitter", cantitate: 1, unitate: "kg", tip: "hamei" },
      { denumire: "Hamei Aroma", cantitate: 0.8, unitate: "kg", tip: "hamei" },
      { denumire: "Irish Moss", cantitate: 0.3, unitate: "kg", tip: "aditiv" }
    ]
  },
  {
    id: 2,
    denumire: "INTRERUPATOR DE MUNCA - CB 02",
    tip: "IPA",
    concentratieMust: "16 - 20,5 ±1°Plato",
    concentratieAlcool: "7 - 9,5 ±1 %vol",
    image: "/intrerupator.png",
    durata: 7,
    rezultat: { cantitate: 1000, unitate: "litri" },
    ingrediente: [
      { denumire: "Malt Pale Ale", cantitate: 372, unitate: "kg", tip: "malt" },
      { denumire: "Drojdie BE 256", cantitate: 0.5, unitate: "kg", tip: "drojdie" },
      { denumire: "Drojdie F2", cantitate: 0.4, unitate: "kg", tip: "drojdie" },
      { denumire: "Hamei Bitter", cantitate: 1.15, unitate: "kg", tip: "hamei" },
      { denumire: "Hamei Aroma", cantitate: 2.4, unitate: "kg", tip: "hamei" },
      { denumire: "Irish Moss", cantitate: 0.3, unitate: "kg", tip: "aditiv" }
    ]
  },
  {
    id: 3,
    denumire: "USB AMPER ALE - CB 03",
    tip: "Pale Ale",
    concentratieMust: "13.8 ± 0.50°Plato",
    concentratieAlcool: "6 ± 0.50 %vol",
    image: "/usb-amper-ale.png",
    durata: 0,
    rezultat: { cantitate: 1000, unitate: "litri" },
    ingrediente: [
      { denumire: "Malt", cantitate: 300, unitate: "kg", tip: "malt" },
      { denumire: "Drojdie Fermentis U.S 05", cantitate: 0.5, unitate: "kg", tip: "drojdie" },
      { denumire: "Hamei Bitter", cantitate: 0.7, unitate: "kg", tip: "hamei" },
      { denumire: "Hamei Aroma", cantitate: 2.4, unitate: "kg", tip: "hamei" },
      { denumire: "Irish Moss", cantitate: 0.3, unitate: "kg", tip: "aditiv" }
    ]
  }
];

async function initializeazaBazaDeDate() {
  await db.read();
  if (!db.data.retete || db.data.retete.length === 0) {
    db.data.retete = [...reteteInitiale]; // Use spread to avoid reference issues
    await db.write();
    console.log("Baza de date pentru rețete inițializată cu date implicite.");
  }
}

async function getReteteBere() {
  try {
    await db.read();
    return db.data.retete || [...reteteInitiale]; // Return a copy of initial recipes as fallback
  } catch (error) {
    console.error("Eroare la citirea rețetelor:", error.message, error.stack);
    return [...reteteInitiale]; // Fallback to initial data
  }
}

// Initialize database on module load
initializeazaBazaDeDate().catch(error => {
  console.error("Eroare la inițializarea bazei de date pentru rețete:", error.message, error.stack);
});

export { getReteteBere };