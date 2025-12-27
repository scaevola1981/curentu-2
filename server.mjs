import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { existsSync } from "fs";

import {
  getMateriiPrime,
  adaugaSauSuplimenteazaMaterial,
  actualizeazaMaterial,
  stergeMaterial,
  stergeToateMaterialele,
} from "./Stocare/ingrediente.mjs";
import {
  getFermentatoare,
  updateFermentator,
} from "./Stocare/fermentatoare.mjs";
import {
  adaugaLot,
  obtineLoturi,
  actualizeazaLot,
  stergeLot,
  obtineLotDupaId,
} from "./Stocare/loturiAmbalate.mjs";
import {
  getMaterialeAmbalare,
  adaugaMaterialAmbalare,
  actualizeazaMaterialAmbalare,
  stergeMaterialAmbalare,
  stergeToateMaterialeleAmbalare,
  exportaMaterialeAmbalare,
  getMaterialePentruLot,
} from "./Stocare/materialeAmbalare.mjs";
import { getReteteBere } from "./Stocare/reteteBere.mjs";
import {
  getIesiriBere,
  adaugaIesireBere,
  getIesiriPentruLot,
  getSumarIesiriPeRetete,
  getStatisticiIesiri,
  stergeIesireBere,
  exportaIesiriCSV,
  getIesiriPerioada,
} from "./Stocare/iesiriBere.mjs";
import { checkStock, confirmProduction } from "./Stocare/productie.mjs";


import { initializeDb } from "./Stocare/db.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determinăm calea de stocare (Writable)
let storagePath;
if (process.env.USER_DATA_PATH) {
  storagePath = path.join(process.env.USER_DATA_PATH, "Stocare");
  if (!existsSync(storagePath)) {
    try {
      // Creăm folderul Stocare în AppData
      const fs = await import("fs");
      fs.mkdirSync(storagePath, { recursive: true });

      // COPIEM DB INITIAL SAU MIGRAM DATE VECHI
      const templateDb = path.join(__dirname, "Stocare", "db.json");
      const targetDb = path.join(storagePath, "db.json");

      if (!fs.existsSync(targetDb)) {
        // 1. Încercăm migrare din Documents (Legacy v1.3.1)
        try {
          const os = await import("os");
          const legacyDb = path.join(os.homedir(), "Documents", "CurentuApp", "db.json");

          if (fs.existsSync(legacyDb)) {
            console.log(`[INIT] 🔄 DETECTAT DATE VECHI (Legacy): ${legacyDb}`);
            console.log(`[INIT] 🔄 Migrare automată către: ${targetDb}`);
            fs.copyFileSync(legacyDb, targetDb);
          } else if (fs.existsSync(templateDb)) {
            // 2. Fallback: Template
            console.log(`[INIT] ✨ DB Nou -> Copiere Template.`);
            fs.copyFileSync(templateDb, targetDb);
          }
        } catch (migErr) {
          console.error("[INIT] ⚠️ Eroare migrare:", migErr);
          // Fallback last resort
          if (fs.existsSync(templateDb)) fs.copyFileSync(templateDb, targetDb);
        }
      }
    } catch (e) {
      console.error("[INIT] 💥 Eroare la inițializare stocare:", e);
    }
  }
} else {
  // Fallback (Dev / Local)
  storagePath = path.join(__dirname, "Stocare");
}

// Determine image path (Unpacked logic)
const imagePath = existsSync(path.join(__dirname, "dist", "Imagini"))
  ? path.join(__dirname, "dist", "Imagini")
  : path.join(__dirname, "public", "Imagini");

const app = express();
const PORT = 3001;

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use("/static", express.static(storagePath));
app.use("/Imagini", express.static(imagePath)); // ✅ Serve images
app.use(express.json());

function valideazaMaterial(material) {
  const erori = [];
  if (
    !material.denumire ||
    typeof material.denumire !== "string" ||
    material.denumire.trim() === ""
  ) {
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
  if (
    !material.unitate ||
    typeof material.unitate !== "string" ||
    material.unitate.trim() === ""
  ) {
    erori.push("Unitatea este obligatorie");
  }
  return erori;
}

app.get("/api/materii-prime", async (req, res) => {
  try {
    const materii = await getMateriiPrime();
    res.json(materii);
  } catch (error) {
    console.error(
      "Eroare la preluarea materiilor prime:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.post("/api/materii-prime", async (req, res) => {
  const erori = valideazaMaterial(req.body);
  if (erori.length > 0) {
    return res.status(400).json({ error: "Date invalide", detalii: erori });
  }
  try {
    const rezultat = await adaugaSauSuplimenteazaMaterial(req.body);
    if (rezultat) {
      res.status(201).json({ succes: true });
    } else {
      res.status(500).json({ error: "Eroare la salvare" });
    }
  } catch (error) {
    console.error(
      "Eroare la adăugarea materialului:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Eroare la salvare" });
  }
});

app.put("/api/materii-prime/:id", async (req, res) => {
  const erori = valideazaMaterial(req.body);
  if (erori.length > 0) {
    return res.status(400).json({ error: "Date invalide", detalii: erori });
  }
  try {
    const rezultat = await actualizeazaMaterial(req.params.id, req.body);
    if (rezultat) {
      res.json({ succes: true });
    } else {
      res.status(404).json({ error: "Materialul nu a fost găsit" });
    }
  } catch (error) {
    console.error(
      "Eroare la actualizarea materialului:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Eroare la actualizare" });
  }
});

app.delete("/api/materii-prime/:id", async (req, res) => {
  try {
    const rezultat = await stergeMaterial(req.params.id);
    if (rezultat) {
      res.json({ succes: true });
    } else {
      res.status(404).json({ error: "Materialul nu a fost găsit" });
    }
  } catch (error) {
    console.error(
      "Eroare la ștergerea materialului:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Eroare la ștergere" });
  }
});

app.delete("/api/materii-prime", async (req, res) => {
  try {
    const rezultat = await stergeToateMaterialele();
    if (rezultat) {
      res.json({ succes: true });
    } else {
      res.status(500).json({ error: "Eroare la ștergerea materialelor" });
    }
  } catch (error) {
    console.error(
      "Eroare la ștergerea tuturor materialelor:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Eroare la ștergerea materialelor" });
  }
});

app.get("/api/retete-bere", async (req, res) => {
  try {
    const retete = await getReteteBere();
    console.log("Rețete returnate:", retete);
    res.json(retete);
  } catch (error) {
    console.error("Eroare la obținerea rețetelor:", error);
    res.status(500).json({ error: "Nu s-au putut încărca rețetele" });
  }
});

app.get("/api/fermentatoare", async (req, res) => {
  try {
    const fermentatoare = await getFermentatoare();
    console.log("Răspuns GET /api/fermentatoare:", fermentatoare);
    if (!fermentatoare || fermentatoare.length === 0) {
      console.warn("Nu s-au găsit fermentatoare în baza de date");
    }
    res.json(fermentatoare);
  } catch (error) {
    console.error(
      "Eroare la preluarea fermentatoarelor:",
      error.message,
      error.stack
    );
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
    console.error(
      "Eroare la actualizarea fermentatorului:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Eroare la actualizare" });
  }
});

app.get("/api/loturi-ambalate", async (req, res) => {
  try {
    const loturi = await obtineLoturi();
    res.json(loturi || []);
  } catch (error) {
    console.error("Eroare la obținerea loturilor ambalate:", error);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.post("/api/loturi-ambalate", async (req, res) => {
  try {
    const lot = req.body;
    const lotNou = await adaugaLot(lot);
    res.status(201).json(lotNou);
  } catch (error) {
    console.error("Eroare la adăugarea lotului ambalat:", error);
    res.status(500).json({ error: "Eroare la salvare" });
  }
});

app.get("/api/ambalare/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID invalid" });
    }
    const lot = await obtineLotDupaId(id);
    if (!lot) {
      return res.status(404).json({ error: "Lotul nu a fost găsit" });
    }
    res.json(lot);
  } catch (error) {
    console.error("Eroare la obținerea lotului:", error.message, error.stack);
    res.status(500).json({ error: "Eroare la obținerea lotului" });
  }
});

app.put("/api/ambalare/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID invalid" });
    }
    const updatedLot = req.body;
    const lot = await actualizeazaLot(id, updatedLot);
    if (!lot) {
      return res.status(404).json({ error: "Lotul nu a fost găsit" });
    }
    res.json(lot);
  } catch (error) {
    console.error(
      "Eroare la actualizarea lotului:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Eroare la actualizare" });
  }
});

app.delete("/api/ambalare/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID invalid" });
    }
    console.log(`Caut lotul cu ID: ${id}`);
    const result = await stergeLot(id);
    console.log(`Lotul cu ID ${id} a fost șters`);
    res.json({ message: "Lot șters cu succes" });
  } catch (error) {
    console.error("Eroare la ștergerea lotului:", error.message, error.stack);
    if (error.message === "Lotul nu a fost găsit") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Eroare la ștergere" });
    }
  }
});

app.get("/api/materiale-ambalare", async (req, res) => {
  try {
    const materiale = await getMaterialeAmbalare();
    console.log("Materiale ambalare returnate:", materiale);
    res.json(materiale);
  } catch (error) {
    console.error(
      "Eroare la preluarea materialelor de ambalare:",
      error.message,
      error.stack
    );
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
    console.error(
      "Eroare la adăugarea materialului de ambalare:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Eroare la salvare" });
  }
});

app.put("/api/materiale-ambalare/:id", async (req, res) => {
  const erori = valideazaMaterial(req.body);
  if (erori.length > 0) {
    return res.status(400).json({ error: "Date invalide", detalii: erori });
  }
  try {
    const materialActualizat = await actualizeazaMaterialAmbalare(
      req.params.id,
      req.body
    );
    if (materialActualizat) {
      res.json(materialActualizat);
    } else {
      res.status(404).json({ error: "Materialul de ambalare nu a fost găsit" });
    }
  } catch (error) {
    console.error(
      "Eroare la actualizarea materialului de ambalare:",
      error.message,
      error.stack
    );
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
    console.error(
      "Eroare la ștergerea materialului de ambalare:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Eroare la ștergere" });
  }
});

app.delete("/api/materiale-ambalare", async (req, res) => {
  try {
    const rezultat = await stergeToateMaterialeleAmbalare();
    if (rezultat) {
      res.json({ succes: true });
    } else {
      res
        .status(500)
        .json({ error: "Eroare la ștergerea materialelor de ambalare" });
    }
  } catch (error) {
    console.error(
      "Eroare la ștergerea tuturor materialelor de ambalare:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ error: "Eroare la ștergerea materialelor de ambalare" });
  }
});

app.get("/api/materiale-ambalare/export", async (req, res) => {
  try {
    const csvData = await exportaMaterialeAmbalare();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=materiale-ambalare.csv"
    );
    res.send(csvData);
  } catch (error) {
    console.error(
      "Eroare la exportarea materialelor de ambalare:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Eroare la export" });
  }
});

app.get("/api/iesiri-bere", async (req, res) => {
  try {
    const iesiri = await getIesiriBere();
    res.json(iesiri);
  } catch (error) {
    console.error("Eroare la obținerea ieșirilor:", error);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.post("/api/iesiri-bere", async (req, res) => {
  try {
    const {
      lotId,
      reteta,
      cantitate,
      numarUnitatiScoase,
      ambalaj,
      motiv,
      dataIesire,
      utilizator,
      observatii,
      detaliiIesire,
    } = req.body;

    console.log("Received payload for /api/iesiri-bere:", req.body);

    if (!lotId || !reteta || cantitate === undefined || cantitate === null) {
      return res.status(400).json({
        error: "Date invalide. LotId, reteta și cantitatea sunt obligatorii.",
      });
    }

    const parsedCantitate = parseFloat(cantitate);
    if (isNaN(parsedCantitate) || parsedCantitate <= 0) {
      return res.status(400).json({
        error: "Cantitatea trebuie să fie un număr pozitiv.",
      });
    }

    if (
      numarUnitatiScoase !== undefined &&
      (isNaN(parseInt(numarUnitatiScoase)) || parseInt(numarUnitatiScoase) < 0)
    ) {
      return res.status(400).json({
        error: "NumarUnitatiScoase trebuie să fie un număr nenegativ.",
      });
    }

    const iesireNoua = await adaugaIesireBere({
      lotId: lotId.toString(),
      reteta,
      cantitate: parsedCantitate,
      numarUnitatiScoase:
        numarUnitatiScoase !== undefined
          ? parseInt(numarUnitatiScoase)
          : undefined,
      ambalaj,
      motiv,
      dataIesire,
      utilizator,
      observatii,
      detaliiIesire,
    });

    res.status(201).json({
      id: iesireNoua.id,
      message: "Ieșire înregistrată cu succes",
      data: iesireNoua,
    });
  } catch (error) {
    console.error("Eroare la înregistrarea ieșirii:", error.message);
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/iesiri-bere/lot/:lotId", async (req, res) => {
  try {
    const { lotId } = req.params;
    const iesiri = await getIesiriPentruLot(lotId);
    res.json(iesiri);
  } catch (error) {
    console.error("Eroare la obținerea ieșirilor pentru lot:", error);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.get("/api/iesiri-bere/sumar", async (req, res) => {
  try {
    const sumar = await getSumarIesiriPeRetete();
    res.json(sumar);
  } catch (error) {
    console.error("Eroare la obținerea sumarului:", error);
    res.status(500).json({ error: "Eroare la calcularea sumarului" });
  }
});

app.get("/api/iesiri-bere/statistici", async (req, res) => {
  try {
    const statistici = await getStatisticiIesiri();
    res.json(statistici);
  } catch (error) {
    console.error("Eroare la obținerea statisticilor:", error);
    res.status(500).json({ error: "Eroare la calcularea statisticilor" });
  }
});

app.get("/api/iesiri-bere/perioada", async (req, res) => {
  try {
    const { dataInceput, dataSfarsit } = req.query;
    if (!dataInceput || !dataSfarsit) {
      return res.status(400).json({
        error: "Parametrii dataInceput și dataSfarsit sunt obligatorii",
      });
    }
    const iesiri = await getIesiriPerioada(dataInceput, dataSfarsit);
    res.json(iesiri);
  } catch (error) {
    console.error("Eroare la obținerea ieșirilor pe perioadă:", error);
    res.status(500).json({ error: "Eroare la preluarea datelor" });
  }
});

app.delete("/api/iesiri-bere/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const rezultat = await stergeIesireBere(parseInt(id));
    if (rezultat) {
      res.json({ succes: true, message: "Ieșire ștearsă cu succes" });
    } else {
      res.status(404).json({ error: "Ieșirea nu a fost găsită" });
    }
  } catch (error) {
    console.error("Eroare la ștergerea ieșirii:", error);
    res.status(500).json({ error: "Eroare la ștergere" });
  }
});

app.get("/api/iesiri-bere/export/csv", async (req, res) => {
  try {
    const csvData = await exportaIesiriCSV();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=iesiri-bere-${new Date().toISOString().split("T")[0]
      }.csv`
    );
    res.send("\uFEFF" + csvData);
  } catch (error) {
    console.error("Eroare la exportarea ieșirilor:", error);
    res.status(500).json({ error: "Eroare la export" });
  }
});

app.get("/api/rebuturi", async (req, res) => {
  try {
    const iesiri = await getIesiriBere();
    const rebuturi = iesiri.filter(
      (iesire) => iesire.motiv === "rebut" || iesire.motiv === "pierdere"
    );
    const rebuturiCuMateriale = await Promise.all(
      rebuturi.map(async (iesire) => {
        const lot = await obtineLotDupaId(parseInt(iesire.lotId));

        const unitati = iesire.numarUnitatiScoase || lot?.cantitateSticle || 0;

        // detectare box size
        const boxSize = (() => {
          if (unitati >= 24 && unitati % 24 === 0) return 24;
          if (unitati >= 20 && unitati % 20 === 0) return 20;
          if (unitati >= 12 && unitati % 12 === 0) return 12;
          return 6;
        })();

        const materiale = {
          capace: iesire.ambalaj === "sticle" ? unitati : 0,
          etichete: iesire.ambalaj === "sticle" ? unitati : 0,
          sticle: iesire.ambalaj === "sticle" ? unitati : 0,
          cutii: iesire.ambalaj === "sticle" ? Math.ceil(unitati / boxSize) : 0,
          keguri: iesire.ambalaj === "keguri" ? unitati : 0,
        };

        return {
          ...iesire,
          materiale,
          boxType: boxSize,
        };
      })
    );

    res.json(rebuturiCuMateriale);
  } catch (error) {
    console.error(
      "Eroare la obținerea rebuturilor:",
      error.message,
      error.stack
    );
    res.status(500).json({ error: "Eroare la preluarea rebuturilor" });
  }
});

// Ștergere rebut individual

app.delete("/api/rebuturi/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const iesiri = await getIesiriBere();
    const rebut = iesiri.find((i) => i.id == id);

    if (!rebut) {
      return res.status(404).json({ error: "Rebutul nu a fost găsit" });
    }

    const deleted = await stergeIesireBere(parseInt(id));

    if (!deleted) {
      return res.status(500).json({ error: "Eroare la ștergerea rebutului" });
    }

    res.json({ success: true, message: "Rebut șters cu succes" });
  } catch (err) {
    console.error("Eroare la ștergerea rebutului:", err);
    res.status(500).json({ error: "Eroare internă la ștergere" });
  }
});

initializeDb().then(() => {

  // --- 🍺 ENDPOINTS PRODUCȚIE (LOGICĂ NOUĂ BACKEND) ---

  app.post("/api/productie/check", async (req, res) => {
    try {
      const { retetaId, cantitate } = req.body;
      if (!retetaId || !cantitate) return res.status(400).json({ error: "Lipsesc parametri (retetaId, cantitate)" });

      const result = await checkStock(retetaId, cantitate);
      res.json(result);
    } catch (error) {
      console.error("Eroare verificare stoc:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/productie/confirm", async (req, res) => {
    try {
      const { retetaId, fermentatorId, cantitate } = req.body;
      if (!retetaId || !fermentatorId || !cantitate) return res.status(400).json({ error: "Date incomplete" });

      const result = await confirmProduction(retetaId, fermentatorId, cantitate);
      res.json(result);
    } catch (error) {
      console.error("Eroare confirmare producție:", error);
      res.status(400).json({ error: error.message }); // 400 pt erori de logică (stoc insuficient)
    }
  });

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`✅ Serverul rulează pe http://127.0.0.1:${PORT} (Securizat: Localhost Only)`);
  });
});
