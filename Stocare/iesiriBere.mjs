import { db } from './db.mjs';

/**
 * Obține toate ieșirile de bere
 */
export async function getIesiriBere() {
  try {
    await db.read();
    return db.data.iesiriBere || [];
  } catch (error) {
    console.error('Eroare la citirea ieșirilor:', error.message);
    return [];
  }
}

export async function adaugaIesireBere(iesire) {
  try {
    await db.read();
    if (!db.data.iesiriBere) db.data.iesiriBere = [];

    // Validări
    if (!iesire.lotId) throw new Error('lotId este obligatoriu');
    if (!iesire.reteta || typeof iesire.reteta !== 'string') throw new Error('reteta este obligatorie');
    if (iesire.cantitate === undefined || isNaN(parseFloat(iesire.cantitate)) || parseFloat(iesire.cantitate) <= 0) {
      throw new Error('cantitate este obligatorie și trebuie să fie pozitivă');
    }

    const newId = db.data.iesiriBere.length > 0
      ? Math.max(...db.data.iesiriBere.map(i => i.id)) + 1
      : 1;

    const iesireNoua = {
      id: newId,
      lotId: iesire.lotId.toString(),
      reteta: iesire.reteta,
      cantitate: parseFloat(iesire.cantitate).toFixed(2),
      numarUnitatiScoase: iesire.numarUnitatiScoase !== undefined ? parseInt(iesire.numarUnitatiScoase) : undefined,
      ambalaj: iesire.ambalaj || '',
      motiv: iesire.motiv || 'vanzare',
      dataIesire: iesire.dataIesire || new Date().toISOString(),
      utilizator: iesire.utilizator || 'Administrator',
      observatii: iesire.observatii || '',
      detaliiIesire: iesire.detaliiIesire || {},
      createdAt: new Date().toISOString()
    };

    db.data.iesiriBere.push(iesireNoua);
    await db.write();

    return iesireNoua;
  } catch (error) {
    console.error('Eroare la adăugarea ieșirii:', error.message);
    throw error;
  }
}

export async function getIesiriPentruLot(lotId) {
  try {
    await db.read();
    return (db.data.iesiriBere || []).filter(iesire => iesire.lotId === lotId.toString()) || [];
  } catch (error) {
    console.error('Eroare la obținerea ieșirilor pentru lot:', error.message);
    return [];
  }
}

export async function getSumarIesiriPeRetete() {
  try {
    await db.read();
    const iesiri = db.data.iesiriBere || [];
    const sumar = {};

    iesiri.forEach(iesire => {
      if (!sumar[iesire.reteta]) {
        sumar[iesire.reteta] = { cantitateTotal: 0, numarIesiri: 0, ultimaIesire: null };
      }
      sumar[iesire.reteta].cantitateTotal += parseFloat(iesire.cantitate);
      sumar[iesire.reteta].numarIesiri += 1;
      if (!sumar[iesire.reteta].ultimaIesire || new Date(iesire.dataIesire) > new Date(sumar[iesire.reteta].ultimaIesire)) {
        sumar[iesire.reteta].ultimaIesire = iesire.dataIesire;
      }
    });

    Object.keys(sumar).forEach(key => {
      sumar[key].cantitateTotal = parseFloat(sumar[key].cantitateTotal.toFixed(2));
    });

    return sumar;
  } catch (error) {
    console.error('Eroare la calcularea sumarului:', error.message);
    return {};
  }
}

export async function getIesiriPerioada(dataInceput, dataSfarsit) {
  try {
    await db.read();
    const iesiri = db.data.iesiriBere || [];
    const inceput = new Date(dataInceput);
    const sfarsit = new Date(dataSfarsit);

    return iesiri.filter(iesire => {
      const data = new Date(iesire.dataIesire);
      return data >= inceput && data <= sfarsit;
    });
  } catch (error) {
    console.error('Eroare la obținerea ieșirilor pe perioadă:', error.message);
    return [];
  }
}

export async function getStatisticiIesiri() {
  try {
    await db.read();
    const iesiri = db.data.iesiriBere || [];
    if (iesiri.length === 0) return { totalIesiri: 0, cantitateTotal: 0, mediePerIesire: 0, reteteCeleMaiVandute: [], motiveCeleMaiFrecvente: [] };

    const cantitateTotal = iesiri.reduce((total, i) => total + parseFloat(i.cantitate), 0);

    const reteteStats = {};
    iesiri.forEach(i => reteteStats[i.reteta] = (reteteStats[i.reteta] || 0) + parseFloat(i.cantitate));
    const reteteTop = Object.entries(reteteStats).sort(([, a], [, b]) => b - a).slice(0, 5).map(([r, c]) => ({ reteta: r, cantitate: parseFloat(c.toFixed(2)) }));

    const motiveStats = {};
    iesiri.forEach(i => motiveStats[i.motiv] = (motiveStats[i.motiv] || 0) + 1);
    const motiveTop = Object.entries(motiveStats).sort(([, a], [, b]) => b - a).map(([m, f]) => ({ motiv: m, frecventa: f }));

    return {
      totalIesiri: iesiri.length,
      cantitateTotal: parseFloat(cantitateTotal.toFixed(2)),
      mediePerIesire: parseFloat((cantitateTotal / iesiri.length).toFixed(2)),
      reteteCeleMaiVandute: reteteTop,
      motiveCeleMaiFrecvente: motiveTop
    };
  } catch (error) {
    console.error('Eroare statistici:', error.message);
    return null;
  }
}

export async function stergeIesireBere(id) {
  try {
    await db.read();
    const iesiri = db.data.iesiriBere || [];
    const index = iesiri.findIndex(i => i.id === parseInt(id));
    if (index === -1) return false;

    iesiri.splice(index, 1);
    db.data.iesiriBere = iesiri;
    await db.write();
    return true;
  } catch (error) {
    console.error('Eroare la ștergerea ieșirii:', error.message);
    return false;
  }
}

export async function exportaIesiriCSV() {
  try {
    await db.read();
    const iesiri = db.data.iesiriBere || [];
    if (!iesiri.length) return 'Nu există date.';

    const headers = ['ID', 'Lot ID', 'Rețetă', 'Cantitate', 'Ambalaj', 'Motiv', 'Data', 'Utilizator', 'Observații'];
    const rows = iesiri.map(i => [
      i.id,
      i.lotId,
      `"${i.reteta}"`,
      i.cantitate,
      `"${i.ambalaj}"`,
      `"${i.motiv}"`,
      new Date(i.dataIesire).toLocaleDateString(),
      `"${i.utilizator}"`,
      `"${i.observatii}"`
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
  } catch (error) {
    return 'Eroare export';
  }
}