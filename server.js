import express from 'express';
import cors from 'cors';
import {
  getMateriiPrime,
  adaugaSauSuplimenteazaMaterial,
  actualizeazaMaterial,
  stergeMaterial,
  stergeToateMaterialele,
} from './Stocare/ingrediente.js';
import { getFermentatoare, updateFermentator } from './Stocare/fermentatoare.js';
import {
  adaugaLot,
  obtineLoturi,
  actualizeazaLot,
  stergeLot,
  obtineLotDupaId,
} from './Stocare/loturiAmbalate.js';
import {
  getMaterialeAmbalare,
  adaugaMaterialAmbalare,
  actualizeazaMaterialAmbalare,
  stergeMaterialAmbalare,
  stergeToateMaterialeleAmbalare,
  exportaMaterialeAmbalare,
} from './Stocare/materialeAmbalare.js';
import { getReteteBere } from './Stocare/reteteBere.js';
import {
  getIesiriBere,
  adaugaIesireBere,
  getIesiriPentruLot,
  getSumarIesiriPeRetete,
  getIesiriPerioadă, // Changed from getIesiriPerioada
  getStatisticiIesiri,
  stergeIesireBere,
  exportaIesiriCSV,
} from './Stocare/iesiriBere.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use('/static', express.static('Stocare'));
app.use(express.json());

function valideazaMaterial(material) {
  const erori = [];
  if (!material.denumire || typeof material.denumire !== 'string' || material.denumire.trim() === '') {
    erori.push('Denumirea este obligatorie');
  }
  if (material.cantitate === undefined || material.cantitate === null) {
    erori.push('Cantitatea este obligatorie');
  } else {
    const cantitate = parseFloat(material.cantitate);
    if (isNaN(cantitate) || cantitate <= 0) {
      erori.push('Cantitatea trebuie să fie un număr pozitiv');
    }
  }
  if (!material.unitate || typeof material.unitate !== 'string' || material.unitate.trim() === '') {
    erori.push('Unitatea este obligatorie');
  }
  return erori;
}

app.get('/api/materii-prime', (req, res) => {
  try {
    const materii = getMateriiPrime();
    res.json(materii);
  } catch (error) {
    console.error('Eroare la preluarea materiilor prime:', error.message, error.stack);
    res.status(500).json({ error: 'Eroare la preluarea datelor' });
  }
});

app.post('/api/materii-prime', (req, res) => {
  const erori = valideazaMaterial(req.body);
  if (erori.length > 0) {
    return res.status(400).json({ error: 'Date invalide', detalii: erori });
  }
  try {
    const rezultat = adaugaSauSuplimenteazaMaterial(req.body);
    if (rezultat) {
      res.status(201).json({ succes: true });
    } else {
      res.status(500).json({ error: 'Eroare la salvare' });
    }
  } catch (error) {
    console.error('Eroare la adăugarea materialului:', error.message, error.stack);
    res.status(500).json({ error: 'Eroare la salvare' });
  }
});

app.put('/api/materii-prime/:id', (req, res) => {
  const erori = valideazaMaterial(req.body);
  if (erori.length > 0) {
    return res.status(400).json({ error: 'Date invalide', detalii: erori });
  }
  try {
    const rezultat = actualizeazaMaterial(req.params.id, req.body);
    if (rezultat) {
      res.json({ succes: true });
    } else {
      res.status(404).json({ error: 'Materialul nu a fost găsit' });
    }
  } catch (error) {
    console.error('Eroare la actualizarea materialului:', error.message, error.stack);
    res.status(500).json({ error: 'Eroare la actualizare' });
  }
});

app.delete('/api/materii-prime/:id', (req, res) => {
  try {
    const rezultat = stergeMaterial(req.params.id);
    if (rezultat) {
      res.json({ succes: true });
    } else {
      res.status(404).json({ error: 'Materialul nu a fost găsit' });
    }
  } catch (error) {
    console.error('Eroare la ștergerea materialului:', error.message, error.stack);
    res.status(500).json({ error: 'Eroare la ștergere' });
  }
});

app.delete('/api/materii-prime', (req, res) => {
  try {
    const rezultat = stergeToateMaterialele();
    if (rezultat) {
      res.json({ succes: true });
    } else {
      res.status(500).json({ error: 'Eroare la ștergerea materialelor' });
    }
  } catch (error) {
    console.error('Eroare la ștergerea tuturor materialelor:', error.message, error.stack);
    res.status(500).json({ error: 'Eroare la ștergerea materialelor' });
  }
});

app.get('/api/retete-bere', async (req, res) => {
  try {
    const retete = await getReteteBere();
    console.log('Rețete returnate:', retete);
    res.json(retete);
  } catch (error) {
    console.error('Eroare la obținerea rețetelor:', error);
    res.status(500).json({ error: 'Nu s-au putut încărca rețetele' });
  }
});

app.get('/api/fermentatoare', async (req, res) => {
  try {
    const fermentatoare = await getFermentatoare();
    console.log('Răspuns GET /api/fermentatoare:', fermentatoare);
    if (!fermentatoare || fermentatoare.length === 0) {
      console.warn('Nu s-au găsit fermentatoare în baza de date');
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
    const dateActualizate = req.body;
    const rezultat = await updateFermentator(id, dateActualizate);
    if (rezultat) {
      res.json({ succes: true });
    } else {
      res.status(404).json({ error: 'Fermentatorul nu a fost găsit' });
    }
  } catch (error) {
    console.error('Eroare la actualizarea fermentatorului:', error.message, error.stack);
    res.status(500).json({ error: 'Eroare la actualizare' });
  }
});

app.get('/api/loturi-ambalate', async (req, res) => {
  try {
    const loturi = await obtineLoturi();
    res.json(loturi || []);
  } catch (error) {
    console.error('Eroare la obținerea loturilor ambalate:', error);
    res.status(500).json({ error: 'Eroare la preluarea datelor' });
  }
});

app.post('/api/loturi-ambalate', async (req, res) => {
  try {
    const lot = req.body;
    const lotNou = await adaugaLot(lot);
    res.status(201).json(lotNou);
  } catch (error) {
    console.error('Eroare la adăugarea lotului ambalat:', error);
    res.status(500).json({ error: 'Eroare la salvare' });
  }
});

app.get('/api/ambalare/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID invalid' });
    }
    const lot = await obtineLotDupaId(id);
    if (!lot) {
      return res.status(404).json({ error: 'Lotul nu a fost găsit' });
    }
    res.json(lot);
  } catch (error) {
    console.error('Eroare la obținerea lotului:', error.message, error.stack);
    res.status(500).json({ error: 'Eroare la obținerea lotului' });
  }
});

app.put('/api/ambalare/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID invalid' });
    }
    const updatedLot = req.body;
    const lot = await actualizeazaLot(id, updatedLot);
    if (!lot) {
      return res.status(404).json({ error: 'Lotul nu a fost găsit' });
    }
    res.json(lot);
  } catch (error) {
    console.error('Eroare la actualizarea lotului:', error.message, error.stack);
    res.status(500).json({ error: 'Eroare la actualizare' });
  }
});

app.delete('/api/ambalare/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID invalid' });
    }
    console.log(`Caut lotul cu ID: ${id}`); // Debug log
    const result = await stergeLot(id);
    console.log(`Lotul cu ID ${id} a fost șters`); // Debug log
    res.json({ message: 'Lot șters cu succes' });
  } catch (error) {
    console.error('Eroare la ștergerea lotului:', error.message, error.stack);
    if (error.message === 'Lotul nu a fost găsit') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Eroare la ștergere' });
    }
  }
});

app.get('/api/materiale-ambalare', async (req, res) => {
  try {
    const materiale = await getMaterialeAmbalare();
    console.log('Materiale ambalare returnate:', materiale);
    res.json(materiale);
  } catch (error) {
    console.error('Eroare la preluarea materialelor de ambalare:', error.message, error.stack);
    res.status(500).json({ error: 'Eroare internă a serverului' });
  }
});

app.post('/api/materiale-ambalare', async (req, res) => {
  const erori = valideazaMaterial(req.body);
  if (erori.length > 0) {
    return res.status(400).json({ error: 'Date invalide', detalii: erori });
  }
  try {
    const materialNou = await adaugaMaterialAmbalare(req.body);
    res.status(201).json(materialNou);
  } catch (error) {
    console.error('Eroare la adăugarea materialului de ambalare:', error.message, error.stack);
    res.status(500).json({ error: 'Eroare la salvare' });
  }
});

app.put('/api/materiale-ambalare/:id', async (req, res) => {
  const erori = valideazaMaterial(req.body);
  if (erori.length > 0) {
    return res.status(400).json({ error: 'Date invalide', detalii: erori });
  }
  try {
    const materialActualizat = await actualizeazaMaterialAmbalare(req.params.id, req.body);
    if (materialActualizat) {
      res.json(materialActualizat);
    } else {
      res.status(404).json({ error: 'Materialul de ambalare nu a fost găsit' });
    }
  } catch (error) {
    console.error('Eroare la actualizarea materialului de ambalare:', error.message, error.stack);
    res.status(500).json({ error: 'Eroare la actualizare' });
  }
});

app.delete('/api/materiale-ambalare/:id', async (req, res) => {
  try {
    const materialeActualizate = await stergeMaterialAmbalare(req.params.id);
    if (materialeActualizate) {
      res.json(materialeActualizate);
    } else {
      res.status(404).json({ error: 'Materialul de ambalare nu a fost găsit' });
    }
  } catch (error) {
    console.error('Eroare la ștergerea materialului de ambalare:', error.message, error.stack);
    res.status(500).json({ error: 'Eroare la ștergere' });
  }
});

app.delete('/api/materiale-ambalare', async (req, res) => {
  try {
    const rezultat = await stergeToateMaterialeleAmbalare();
    if (rezultat) {
      res.json({ succes: true });
    } else {
      res.status(500).json({ error: 'Eroare la ștergerea materialelor de ambalare' });
    }
  } catch (error) {
    console.error('Eroare la ștergerea tuturor materialelor de ambalare:', error.message, error.stack);
    res.status(500).json({ error: 'Eroare la ștergerea materialelor de ambalare' });
  }
});

app.get('/api/materiale-ambalare/export', async (req, res) => {
  try {
    const csvData = await exportaMaterialeAmbalare();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=materiale-ambalare.csv');
    res.send(csvData);
  } catch (error) {
    console.error('Eroare la exportarea materialelor de ambalare:', error.message, error.stack);
    res.status(500).json({ error: 'Eroare la export' });
  }
});

app.get('/api/iesiri-bere', (req, res) => {
  try {
    const iesiri = getIesiriBere();
    res.json(iesiri);
  } catch (error) {
    console.error('Eroare la obținerea ieșirilor:', error);
    res.status(500).json({ error: 'Eroare la preluarea datelor' });
  }
});

app.post('/api/iesiri-bere', (req, res) => {
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

    console.log('Received payload for /api/iesiri-bere:', req.body);

    if (!lotId || !reteta || cantitate === undefined || cantitate === null) {
      return res.status(400).json({
        error: 'Date invalide. LotId, reteta și cantitatea sunt obligatorii.',
      });
    }

    const parsedCantitate = parseFloat(cantitate);
    if (isNaN(parsedCantitate) || parsedCantitate <= 0) {
      return res.status(400).json({
        error: 'Cantitatea trebuie să fie un număr pozitiv.',
      });
    }

    if (numarUnitatiScoase !== undefined && (isNaN(parseInt(numarUnitatiScoase)) || parseInt(numarUnitatiScoase) < 0)) {
      return res.status(400).json({
        error: 'NumarUnitatiScoase trebuie să fie un număr nenegativ.',
      });
    }

    const iesireNoua = adaugaIesireBere({
      lotId: lotId.toString(), // Convert to string to match iesiriBere.js validation
      reteta,
      cantitate: parsedCantitate,
      numarUnitatiScoase: numarUnitatiScoase !== undefined ? parseInt(numarUnitatiScoase) : undefined,
      ambalaj,
      motiv,
      dataIesire,
      utilizator,
      observatii,
      detaliiIesire,
    });

    res.status(201).json({
      id: iesireNoua.id,
      message: 'Ieșire înregistrată cu succes',
      data: iesireNoua,
    });
  } catch (error) {
    console.error('Eroare la înregistrarea ieșirii:', error.message);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/iesiri-bere/lot/:lotId', (req, res) => {
  try {
    const { lotId } = req.params;
    const iesiri = getIesiriPentruLot(lotId);
    res.json(iesiri);
  } catch (error) {
    console.error('Eroare la obținerea ieșirilor pentru lot:', error);
    res.status(500).json({ error: 'Eroare la preluarea datelor' });
  }
});

app.get('/api/iesiri-bere/sumar', (req, res) => {
  try {
    const sumar = getSumarIesiriPeRetete();
    res.json(sumar);
  } catch (error) {
    console.error('Eroare la obținerea sumarului:', error);
    res.status(500).json({ error: 'Eroare la calcularea sumarului' });
  }
});

app.get('/api/iesiri-bere/statistici', (req, res) => {
  try {
    const statistici = getStatisticiIesiri();
    res.json(statistici);
  } catch (error) {
    console.error('Eroare la obținerea statisticilor:', error);
    res.status(500).json({ error: 'Eroare la calcularea statisticilor' });
  }
});

app.get('/api/iesiri-bere/perioada', (req, res) => {
  try {
    const { dataInceput, dataSfarsit } = req.query;
    if (!dataInceput || !dataSfarsit) {
      return res.status(400).json({
        error: 'Parametrii dataInceput și dataSfarsit sunt obligatorii',
      });
    }
    const iesiri = getIesiriPerioadă(dataInceput, dataSfarsit);
    res.json(iesiri);
  } catch (error) {
    console.error('Eroare la obținerea ieșirilor pe perioadă:', error);
    res.status(500).json({ error: 'Eroare la preluarea datelor' });
  }
});

app.delete('/api/iesiri-bere/:id', (req, res) => {
  try {
    const { id } = req.params;
    const rezultat = stergeIesireBere(parseInt(id));
    if (rezultat) {
      res.json({ succes: true, message: 'Ieșire ștearsă cu succes' });
    } else {
      res.status(404).json({ error: 'Ieșirea nu a fost găsită' });
    }
  } catch (error) {
    console.error('Eroare la ștergerea ieșirii:', error);
    res.status(500).json({ error: 'Eroare la ștergere' });
  }
});

app.get('/api/iesiri-bere/export/csv', (req, res) => {
  try {
    const csvData = exportaIesiriCSV();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=iesiri-bere-${new Date().toISOString().split('T')[0]}.csv`);
    res.send('\uFEFF' + csvData);
  } catch (error) {
    console.error('Eroare la exportarea ieșirilor:', error);
    res.status(500).json({ error: 'Eroare la export' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serverul rulează pe http://localhost:${PORT}`);
});