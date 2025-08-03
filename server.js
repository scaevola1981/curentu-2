import express from "express";
import cors from "cors";
import {
  getMateriiPrime,
  adaugaSauSuplimenteazaMaterial,
  actualizeazaMaterial,
  stergeMaterial,
  stergeToateMaterialele,
} from "./Stocare/ingrediente.js";
import { getFermentatoare, updateFermentator } from "./Stocare/fermentatoare.js";
import { adaugaLot, obtineLoturi } from "./Stocare/loturiProducere.js";
import { getMaterialeAmbalare, adaugaSauSuplimenteazaMaterialAmbalare } from "./Stocare/materialeAmbalare.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = 3001;

app.use(cors());
app.use("/static", express.static("Stocare"));
app.use(express.json());

function validateMaterial(material) {
  const errors = [];
  if (!material.denumire || typeof material.denumire !== 'string' || material.denumire.trim() === '') {
    errors.push('Denumirea este obligatorie');
  }
  if (material.cantitate === undefined || material.cantitate === null) {
    errors.push('Cantitatea este obligatorie');
  } else {
    const cantitate = parseFloat(material.cantitate);
    if (isNaN(cantitate) || cantitate <= 0) {
      errors.push('Cantitatea trebuie să fie un număr pozitiv');
    }
  }
  if (!material.unitate || typeof material.unitate !== 'string' || material.unitate.trim() === '') {
    errors.push('Unitatea este obligatorie');
  }
  return errors;
}

app.get("/api/materii-prime", (req, res) => {
  try {
    const materii = getMateriiPrime();
    res.json(materii);
  } catch (error) {
    console.error("Eroare la preluarea materiilor:", error.message, error.stack);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.post("/api/materii-prime", (req, res) => {
  const errors = validateMaterial(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Date invalide", details: errors });
  }
  try {
    const rezultat = adaugaSauSuplimenteazaMaterial(req.body);
    if (rezultat) {
      res.status(201).json({ success: true });
    } else {
      res.status(500).json({ error: "Eroare la salvare" });
    }
  } catch (error) {
    console.error("Eroare la adăugarea materialului:", error.message, error.stack);
    res.status(500).json({ error: "Eroare la salvare" });
  }
});

app.put("/api/materii-prime/:id", (req, res) => {
  const errors = validateMaterial(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Date invalide", details: errors });
  }
  try {
    const rezultat = actualizeazaMaterial(req.params.id, req.body);
    if (rezultat) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Materialul nu a fost găsit" });
    }
  } catch (error) {
    console.error("Eroare la actualizarea materialului:", error.message, error.stack);
    res.status(500).json({ error: "Eroare la actualizare" });
  }
});

app.delete("/api/materii-prime/:id", (req, res) => {
  try {
    const rezultat = stergeMaterial(req.params.id);
    if (rezultat) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Materialul nu a fost găsit" });
    }
  } catch (error) {
    console.error("Eroare la ștergerea materialului:", error.message, error.stack);
    res.status(500).json({ error: "Eroare la ștergere" });
  }
});

app.delete("/api/materii-prime", (req, res) => {
  try {
    const rezultat = stergeToateMaterialele();
    if (rezultat) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: "Eroare la ștergerea materialelor" });
    }
  } catch (error) {
    console.error("Eroare la ștergerea tuturor materialelor:", error.message, error.stack);
    res.status(500).json({ error: "Eroare la ștergerea materialelor" });
  }
});

app.get('/api/reteteBere', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'Stocare', 'reteteBere.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const retete = JSON.parse(rawData);
    console.log('Returning reteteBere:', retete); // Debug log
    res.json(retete);
  } catch (error) {
    console.error('Eroare la citirea fișierului reteteBere.json:', error.message, error.stack);
    res.status(500).json({ error: 'Nu s-au putut încărca rețetele' });
  }
});

app.get('/api/fermentatoare', async (req, res) => {
  try {
    const fermentatoare = await getFermentatoare();
    console.log('GET /api/fermentatoare response:', fermentatoare); // Debug log
    if (!fermentatoare || fermentatoare.length === 0) {
      console.warn('No fermenters found in database'); // Debug log
    }
    res.json(fermentatoare);
  } catch (error) {
    console.error('Eroare la preluarea fermentatoarelor:', error.message, error.stack);
    res.status(500).json({ error: 'Eroare la preluarea datelor' });
  }
});

app.put('/api/fermentatoare/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updatedData = req.body;
    const rezultat = await updateFermentator(id, updatedData);
    if (rezultat) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Fermentatorul nu a fost găsit" });
    }
  } catch (error) {
    console.error('Eroare la actualizarea fermentatorului:', error.message, error.stack);
    res.status(500).json({ error: 'Eroare la actualizare' });
  }
});

app.get('/api/producere', async (req, res) => {
  try {
    const loturi = await obtineLoturi();
    res.json(loturi);
  } catch (error) {
    console.error('Eroare la obținerea loturilor:', error.message, error.stack);
    res.status(500).json({ error: 'Eroare la preluarea datelor' });
  }
});

app.post('/api/producere', async (req, res) => {
  try {
    const lot = req.body;
    const newLot = await adaugaLot(lot);
    res.status(201).json({ success: true, lot: newLot });
  } catch (error) {
    console.error('Eroare la adăugarea lotului:', error.message, error.stack);
    res.status(500).json({ error: 'Eroare la salvare' });
  }
});

app.get('/api/materiale-ambalare', async (req, res) => {
  try {
    const materiale = getMaterialeAmbalare();
    console.log('GET /api/materiale-ambalare response:', materiale); // Debug log
    if (!materiale || materiale.length === 0) {
      console.warn('No packaging materials found in database'); // Debug log
    }
    res.json(materiale);
  } catch (error) {
    console.error('Eroare la preluarea materialelor de ambalare:', error.message, error.stack);
    res.status(500).json({ error: 'Eroare la preluarea datelor' });
  }
});

app.post('/api/materiale-ambalare', async (req, res) => {
  try {
    const material = req.body;
    const errors = validateMaterial(material);
    if (errors.length > 0) {
      return res.status(400).json({ error: "Date invalide", details: errors });
    }
    const rezultat = adaugaSauSuplimenteazaMaterialAmbalare(material);
    if (rezultat) {
      res.status(201).json({ success: true });
    } else {
      res.status(500).json({ error: "Eroare la salvare" });
    }
  } catch (error) {
    console.error('Eroare la adăugarea materialului de ambalare:', error.message, error.stack);
    res.status(500).json({ error: 'Eroare la salvare' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serverul rulează pe http://localhost:${PORT}`);
});