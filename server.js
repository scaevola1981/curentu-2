// server.js
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
import {
  getMaterialeAmbalare,
  adaugaMaterialAmbalare,
  actualizeazaMaterialAmbalare,
  stergeMaterialAmbalare,
  stergeToateMaterialeleAmbalare,
  exportaMaterialeAmbalare,
} from "./Stocare/materialeAmbalare.js";
import { getReteteBere } from "./Stocare/reteteBere.js"; // New import
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = 3001;

app.use(cors());
app.use("/static", express.static("Stocare"));
app.use(express.json());

function valideazaMaterial(material) {
  const erori = [];
  if (!material.denumire || typeof material.denumire !== "string" || material.denumire.trim() === "") {
    erori.push("Denumirea este obligatorie");
  }
  if (material.cantitate === undefined || material.cantitate === null) {
    erori.push("Cantitatea este obligatorie");
  } else {
    const cantitate = parseFloat(material.cantitate);
    if (isNaN(cantitate) || cantitate <= 0) {
      erori.push("Cantitatea trebuie să fie un număr pozitiv");
    }
  }
  if (!material.unitate || typeof material.unitate !== "string" || material.unitate.trim() === "") {
    erori.push("Unitatea este obligatorie");
  }
  return erori;
}

// Rute pentru Materii Prime
app.get("/api/materii-prime", (req, res) => {
  try {
    const materii = getMateriiPrime();
    res.json(materii);
  } catch (error) {
    console.error("Eroare la preluarea materiilor prime:", error.message, error.stack);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.post("/api/materii-prime", (req, res) => {
  const erori = valideazaMaterial(req.body);
  if (erori.length > 0) {
    return res.status(400).json({ error: "Date invalide", detalii: erori });
  }
  try {
    const rezultat = adaugaSauSuplimenteazaMaterial(req.body);
    if (rezultat) {
      res.status(201).json({ succes: true });
    } else {
      res.status(500).json({ error: "Eroare la salvare" });
    }
  } catch (error) {
    console.error("Eroare la adăugarea materialului:", error.message, error.stack);
    res.status(500).json({ error: "Eroare la salvare" });
  }
});

app.put("/api/materii-prime/:id", (req, res) => {
  const erori = valideazaMaterial(req.body);
  if (erori.length > 0) {
    return res.status(400).json({ error: "Date invalide", detalii: erori });
  }
  try {
    const rezultat = actualizeazaMaterial(req.params.id, req.body);
    if (rezultat) {
      res.json({ succes: true });
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
      res.json({ succes: true });
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
      res.json({ succes: true });
    } else {
      res.status(500).json({ error: "Eroare la ștergerea materialelor" });
    }
  } catch (error) {
    console.error("Eroare la ștergerea tuturor materialelor:", error.message, error.stack);
    res.status(500).json({ error: "Eroare la ștergerea materialelor" });
  }
});

// Rute pentru Rețete de Bere
app.get("/api/retete-bere", (req, res) => {
  try {
    const retete = getReteteBere();
    res.json(retete);
  } catch (error) {
    console.error("Eroare la obținerea rețetelor de bere:", error.message, error.stack);
    res.status(500).json({ error: "Nu s-au putut încărca rețetele" });
  }
});

// Rute pentru Fermentatoare
app.get("/api/fermentatoare", async (req, res) => {
  try {
    const fermentatoare = await getFermentatoare();
    console.log("Răspuns GET /api/fermentatoare:", fermentatoare);
    if (!fermentatoare || fermentatoare.length === 0) {
      console.warn("Nu s-au găsit fermentatoare în baza de date");
    }
    res.json(fermentatoare);
  } catch (error) {
    console.error("Eroare la preluarea fermentatoarelor:", error.message, error.stack);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.put("/api/fermentatoare/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const dateActualizate = req.body;
    const rezultat = await updateFermentator(id, dateActualizate);
    if (rezultat) {
      res.json({ succes: true });
    } else {
      res.status(404).json({ error: "Fermentatorul nu a fost găsit" });
    }
  } catch (error) {
    console.error("Eroare la actualizarea fermentatorului:", error.message, error.stack);
    res.status(500).json({ error: "Eroare la actualizare" });
  }
});

// Rute pentru Producere
app.get("/api/producere", async (req, res) => {
  try {
    const loturi = await obtineLoturi();
    res.json(loturi);
  } catch (error) {
    console.error("Eroare la obținerea loturilor:", error.message, error.stack);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.post("/api/producere", async (req, res) => {
  try {
    const lot = req.body;
    const lotNou = await adaugaLot(lot);
    res.status(201).json({ succes: true, lot: lotNou });
  } catch (error) {
    console.error("Eroare la adăugarea lotului:", error.message, error.stack);
    res.status(500).json({ error: "Eroare la salvare" });
  }
});

// Rute pentru Materiale de Ambalare
app.get("/api/materiale-ambalare", async (req, res) => {
  try {
    const materiale = await getMaterialeAmbalare();
    console.log("Materiale ambalare returnate:", materiale);
    res.json(materiale);
  } catch (error) {
    console.error("Eroare la preluarea materialelor de ambalare:", error.message, error.stack);
    res.status(500).json({ error: "Eroare internă a serverului" });
  }
});

app.post("/api/materiale-ambalare", async (req, res) => {
  const erori = valideazaMaterial(req.body);
  if (erori.length > 0) {
    return res.status(400).json({ error: "Date invalide", detalii: erori });
  }
  try {
    const materialNou = await adaugaMaterialAmbalare(req.body);
    res.status(201).json(materialNou);
  } catch (error) {
    console.error("Eroare la adăugarea materialului de ambalare:", error.message, error.stack);
    res.status(500).json({ error: "Eroare la salvare" });
  }
});

app.put("/api/materiale-ambalare/:id", async (req, res) => {
  const erori = valideazaMaterial(req.body);
  if (erori.length > 0) {
    return res.status(400).json({ error: "Date invalide", detalii: erori });
  }
  try {
    const materialActualizat = await actualizeazaMaterialAmbalare(req.params.id, req.body);
    if (materialActualizat) {
      res.json(materialActualizat);
    } else {
      res.status(404).json({ error: "Materialul de ambalare nu a fost găsit" });
    }
  } catch (error) {
    console.error("Eroare la actualizarea materialului de ambalare:", error.message, error.stack);
    res.status(500).json({ error: "Eroare la actualizare" });
  }
});

app.delete("/api/materiale-ambalare/:id", async (req, res) => {
  try {
    const materialeActualizate = await stergeMaterialAmbalare(req.params.id);
    if (materialeActualizate) {
      res.json(materialeActualizate);
    } else {
      res.status(404).json({ error: "Materialul de ambalare nu a fost găsit" });
    }
  } catch (error) {
    console.error("Eroare la ștergerea materialului de ambalare:", error.message, error.stack);
    res.status(500).json({ error: "Eroare la ștergere" });
  }
});

app.delete("/api/materiale-ambalare", async (req, res) => {
  try {
    const rezultat = await stergeToateMaterialeleAmbalare();
    if (rezultat) {
      res.json({ succes: true });
    } else {
      res.status(500).json({ error: "Eroare la ștergerea materialelor de ambalare" });
    }
  } catch (error) {
    console.error("Eroare la ștergerea tuturor materialelor de ambalare:", error.message, error.stack);
    res.status(500).json({ error: "Eroare la ștergerea materialelor de ambalare" });
  }
});

app.get("/api/materiale-ambalare/export", async (req, res) => {
  try {
    const csvData = await exportaMaterialeAmbalare();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=materiale-ambalare.csv");
    res.send(csvData);
  } catch (error) {
    console.error("Eroare la exportarea materialelor de ambalare:", error.message, error.stack);
    res.status(500).json({ error: "Eroare la export" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serverul rulează pe http://localhost:${PORT}`);
});