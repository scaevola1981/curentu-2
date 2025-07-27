import express from "express";
import cors from "cors";
import {
  getMateriiPrime,
  adaugaSauSuplimenteazaMaterial,
  actualizeazaMaterial,
  stergeMaterial,
  stergeToateMaterialele,
} from "./Stocare/ingrediente.js";
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



// Funcție pentru validare
function validateMaterial(material) {
  const errors = [];
  
  // Validează denumirea
  if (!material.denumire || typeof material.denumire !== 'string' || material.denumire.trim() === '') {
    errors.push('Denumirea este obligatorie');
  }
  
  // Validează cantitatea
  if (material.cantitate === undefined || material.cantitate === null) {
    errors.push('Cantitatea este obligatorie');
  } else {
    const cantitate = parseFloat(material.cantitate);
    if (isNaN(cantitate) || cantitate <= 0) {
      errors.push('Cantitatea trebuie să fie un număr pozitiv');
    }
  }
  
  // Validează unitatea
  if (!material.unitate || typeof material.unitate !== 'string' || material.unitate.trim() === '') {
    errors.push('Unitatea este obligatorie');
  }
  
  return errors;
}

// GET toate materiile
app.get("/api/materii-prime", (req, res) => {
  try {
    const materii = getMateriiPrime();
    res.json(materii);
  } catch (error) {
    console.error("Eroare la preluarea materiilor:", error);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

// POST adaugă sau suplimentează material
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
    console.error("Eroare la adăugarea materialului:", error);
    res.status(500).json({ error: "Eroare la salvare" });
  }
});

// PUT actualizează un material
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
    console.error("Eroare la actualizarea materialului:", error);
    res.status(500).json({ error: "Eroare la actualizare" });
  }
});

// DELETE un material
app.delete("/api/materii-prime/:id", (req, res) => {
  try {
    const rezultat = stergeMaterial(req.params.id);
    if (rezultat) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Materialul nu a fost găsit" });
    }
  } catch (error) {
    console.error("Eroare la ștergerea materialului:", error);
    res.status(500).json({ error: "Eroare la ștergere" });
  }
});

// DELETE toate materialele
app.delete("/api/materii-prime", (req, res) => {
  try {
    const rezultat = stergeToateMaterialele();
    if (rezultat) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: "Eroare la ștergerea materialelor" });
    }
  } catch (error) {
    console.error("Eroare la ștergerea tuturor materialelor:", error);
    res.status(500).json({ error: "Eroare la ștergerea materialelor" });
  }
});


app.get('/api/reteteBere', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'Stocare', 'reteteBere.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const retete = JSON.parse(rawData);
    res.json(retete);
  } catch (error) {
    console.error('Eroare la citirea fisierului', error);
    res.status(500).json({ error: 'Nu s-au putut incarca retetele' });
  }
});




app.listen(PORT, () => {
  console.log(`✅ Serverul rulează pe http://localhost:${PORT}`);
});




