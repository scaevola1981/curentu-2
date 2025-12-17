
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';

const __dirname = path.resolve();
const filePath = path.join(__dirname, 'Stocare', 'iesiriBere.json');
const adapter = new JSONFile(filePath);
const db = new Low(adapter, { iesiri: [] });

// Inițializare bază de date
(async () => {
  await db.read();
  if (!db.data || !db.data.iesiri) {
    db.data = { iesiri: [] };
    await db.write();
    console.log('Baza de date pentru ieșiri bere inițializată');
  }
})();

/**
 * Obține toate ieșirile de bere
 * @returns {Array} Lista tuturor ieșirilor
 */
export async function getIesiriBere() {
  try {
    await db.read();
    return db.data.iesiri || [];
  } catch (error) {
    console.error('Eroare la citirea ieșirilor:', error.message);
    return [];
  }
}

/**
 * Adaugă o nouă ieșire de bere
 * @param {Object} iesire - Datele ieșirii
 * @returns {Object} Ieșirea adăugată cu ID
 * @throws {Error} Dacă datele sunt invalide
 */
export async function adaugaIesireBere(iesire) {
  try {
    await db.read();
    
    // Validări
    if (!iesire.lotId) {
      throw new Error('lotId este obligatoriu');
    }
    if (!iesire.reteta || typeof iesire.reteta !== 'string') {
      throw new Error('reteta este obligatorie și trebuie să fie un șir de caractere');
    }
    if (iesire.cantitate === undefined || iesire.cantitate === null || isNaN(parseFloat(iesire.cantitate)) || parseFloat(iesire.cantitate) <= 0) {
      throw new Error('cantitate este obligatorie și trebuie să fie un număr pozitiv');
    }
    if (iesire.numarUnitatiScoase !== undefined && (isNaN(parseInt(iesire.numarUnitatiScoase)) || parseInt(iesire.numarUnitatiScoase) < 0)) {
      throw new Error('numarUnitatiScoase trebuie să fie un număr nenegativ');
    }
    if (iesire.ambalaj && !['sticle', 'keguri'].includes(iesire.ambalaj)) {
      throw new Error('ambalaj trebuie să fie "sticle" sau "keguri"');
    }
    if (iesire.motiv && !['vanzare', 'degustare', 'pierdere', 'donatie', 'consum_intern', 'altul', 'alta_vanzare', 'rebut'].includes(iesire.motiv)) {
      throw new Error('motiv invalid; valorile permise sunt: vanzare, degustare, pierdere, donatie, consum_intern, altul, alta_vanzare, rebut');
    }

    const newId = db.data.iesiri.length > 0 
      ? Math.max(...db.data.iesiri.map(i => i.id)) + 1 
      : 1;
    
    const iesireNoua = {
      id: newId,
      lotId: iesire.lotId.toString(), // Convert to string for consistency
      reteta: iesire.reteta,
      cantitate: parseFloat(iesire.cantitate).toFixed(2),
      numarUnitatiScoase: iesire.numarUnitatiScoase !== undefined ? parseInt(iesire.numarUnitatiScoase) : undefined,
      ambalaj: iesire.ambalaj || '',
      motiv: iesire.motiv || 'vanzare',
      dataIesire: iesire.dataIesire || new Date().toISOString(),
      utilizator: iesire.utilizator || 'Administrator',
      observatii: iesire.observatii || '',
      createdAt: new Date().toISOString()
    };
    
    db.data.iesiri.push(iesireNoua);
    await db.write();
    
    console.log(`Ieșire adăugată: ${iesireNoua.cantitate}L din ${iesireNoua.reteta}, numarUnitatiScoase: ${iesireNoua.numarUnitatiScoase || 'nedefinit'}`);
    return iesireNoua;
  } catch (error) {
    console.error('Eroare la adăugarea ieșirii:', error.message);
    throw error;
  }
}

/**
 * Obține ieșirile pentru un anumit lot
 * @param {number} lotId - ID-ul lotului
 * @returns {Array} Lista ieșirilor pentru lotul specificat
 */
export async function getIesiriPentruLot(lotId) {
  try {
    await db.read();
    return db.data.iesiri.filter(iesire => iesire.lotId === lotId.toString()) || [];
  } catch (error) {
    console.error('Eroare la obținerea ieșirilor pentru lot:', error.message);
    return [];
  }
}

/**
 * Obține sumar ieșiri pe rețete
 * @returns {Object} Obiect cu totalurile pe rețete
 */
export async function getSumarIesiriPeRetete() {
  try {
    await db.read();
    const iesiri = db.data.iesiri || [];
    const sumar = {};
    
    iesiri.forEach(iesire => {
      if (!sumar[iesire.reteta]) {
        sumar[iesire.reteta] = {
          cantitateTotal: 0,
          numarIesiri: 0,
          ultimaIesire: null
        };
      }
      
      sumar[iesire.reteta].cantitateTotal += parseFloat(iesire.cantitate);
      sumar[iesire.reteta].numarIesiri += 1;
      
      if (!sumar[iesire.reteta].ultimaIesire || 
          new Date(iesire.dataIesire) > new Date(sumar[iesire.reteta].ultimaIesire)) {
        sumar[iesire.reteta].ultimaIesire = iesire.dataIesire;
      }
    });
    
    Object.keys(sumar).forEach(reteta => {
      sumar[reteta].cantitateTotal = parseFloat(sumar[reteta].cantitateTotal.toFixed(2));
    });
    
    return sumar;
  } catch (error) {
    console.error('Eroare la calcularea sumarului:', error.message);
    return {};
  }
}

/**
 * Obține ieșirile dintr-o anumită perioadă
 * @param {string} dataInceput - Data de început (ISO string)
 * @param {string} dataSfarsit - Data de sfârșit (ISO string)
 * @returns {Array} Lista ieșirilor din perioada specificată
 */
export async function getIesiriPerioada(dataInceput, dataSfarsit) {
  try {
    await db.read();
    const iesiri = db.data.iesiri || [];
    const inceput = new Date(dataInceput);
    const sfarsit = new Date(dataSfarsit);
    
    return iesiri.filter(iesire => {
      const dataIesire = new Date(iesire.dataIesire);
      return dataIesire >= inceput && dataIesire <= sfarsit;
    });
  } catch (error) {
    console.error('Eroare la obținerea ieșirilor pe perioadă:', error.message);
    return [];
  }
}

/**
 * Obține statistici generale despre ieșiri
 * @returns {Object} Statistici generale
 */
export async function getStatisticiIesiri() {
  try {
    await db.read();
    const iesiri = db.data.iesiri || [];
    
    if (iesiri.length === 0) {
      return {
        totalIesiri: 0,
        cantitateTotal: 0,
        mediePerIesire: 0,
        reteteCeleMaiVandute: [],
        motiveCeleMaiFrecvente: []
      };
    }
    
    const cantitateTotal = iesiri.reduce((total, iesire) => 
      total + parseFloat(iesire.cantitate), 0);
    
    const reteteTotale = {};
    iesiri.forEach(iesire => {
      reteteTotale[iesire.reteta] = (reteteTotale[iesire.reteta] || 0) + parseFloat(iesire.cantitate);
    });
    
    const reteteCeleMaiVandute = Object.entries(reteteTotale)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([reteta, cantitate]) => ({ reteta, cantitate: parseFloat(cantitate.toFixed(2)) }));
    
    const motiveTotale = {};
    iesiri.forEach(iesire => {
      motiveTotale[iesire.motiv] = (motiveTotale[iesire.motiv] || 0) + 1;
    });
    
    const motiveCeleMaiFrecvente = Object.entries(motiveTotale)
      .sort(([,a], [,b]) => b - a)
      .map(([motiv, frecventa]) => ({ motiv, frecventa }));
    
    return {
      totalIesiri: iesiri.length,
      cantitateTotal: parseFloat(cantitateTotal.toFixed(2)),
      mediePerIesire: parseFloat((cantitateTotal / iesiri.length).toFixed(2)),
      reteteCeleMaiVandute,
      motiveCeleMaiFrecvente
    };
  } catch (error) {
    console.error('Eroare la calcularea statisticilor:', error.message);
    return null;
  }
}

/**
 * Șterge o ieșire
 * @param {number} id - ID-ul ieșirii de șters
 * @returns {boolean} True dacă s-a șters cu succes
 */
export async function stergeIesireBere(id) {
  try {
    await db.read();
    const iesiri = db.data.iesiri || [];
    const index = iesiri.findIndex(iesire => iesire.id === parseInt(id));
    
    if (index === -1) {
      return false;
    }
    
    iesiri.splice(index, 1);
    db.data.iesiri = iesiri;
    await db.write();
    
    console.log(`Ieșire ștearsă: ID ${id}`);
    return true;
  } catch (error) {
    console.error('Eroare la ștergerea ieșirii:', error.message);
    return false;
  }
}

/**
 * Exportă ieșirile în format CSV
 * @returns {string} Datele în format CSV
 */
export async function exportaIesiriCSV() {
  try {
    await db.read();
    const iesiri = db.data.iesiri || [];
    
    if (iesiri.length === 0) {
      return 'Nu există ieșiri de exportat';
    }
    
    const headers = [
      'ID',
      'Lot ID',
      'Rețetă',
      'Cantitate (L)',
      'Număr Unități',
      'Ambalaj',
      'Motiv',
      'Data Ieșire',
      'Utilizator',
      'Observații'
    ];
    
    const csvContent = [
      headers.join(','),
      ...iesiri.map(iesire => [
        iesire.id,
        iesire.lotId,
        `"${iesire.reteta}"`,
        iesire.cantitate,
        iesire.numarUnitatiScoase || '',
        `"${iesire.ambalaj}"`,
        `"${iesire.motiv}"`,
        new Date(iesire.dataIesire).toLocaleDateString('ro-RO'),
        `"${iesire.utilizator}"`,
        `"${iesire.observatii || ''}"`
      ].join(','))
    ].join('\n');
    
    return csvContent;
  } catch (error) {
    console.error('Eroare la exportarea CSV:', error.message);
    return 'Eroare la export';
  }
}