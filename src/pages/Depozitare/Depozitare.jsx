import React, { useEffect, useState } from 'react';
import NavBar from '../../Componente/NavBar/NavBar.jsx';
import styles from './depozitare.module.css';

const API_URL = 'http://localhost:3001';

const Depozitare = () => {
  const [loturi, setLoturi] = useState([]);
  const [iesiri, setIesiri] = useState([]);
  const [activeTab, setActiveTab] = useState('stoc');
  const [inputValues, setInputValues] = useState({});
  const [motivValues, setMotivValues] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
    loadIesiri();
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/loturi-ambalate`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const loturiAmbalate = await res.json();

      const loturiTransformate = loturiAmbalate.map(lot => {
        let numarUnitati = 0;
        let detalii = '';
        let ambalaj = lot.packagingType;
        let maxUnits = 0;

        if (lot.packagingType === 'sticle') {
          const litriPerSticla = parseFloat(lot.bottleSize.replace('l', ''));
          const sticlePerCutie = parseInt(lot.boxType.split(' ')[0]);
          const numarSticle = Math.floor(lot.cantitate / litriPerSticla);
          const numarCutii = Math.floor(numarSticle / sticlePerCutie);
          const sticleLibere = numarSticle % sticlePerCutie;
          numarUnitati = numarSticle;
          detalii = `${numarCutii} cutii (${sticlePerCutie} sticle/cutie) + ${sticleLibere} sticle libere`;
          maxUnits = numarCutii;
        } else if (lot.packagingType === 'keguri') {
          const litriPerKeg = parseFloat(lot.kegSize.replace('Keg ', '').replace('l', ''));
          const numarKeguri = Math.floor(lot.cantitate / litriPerKeg);
          numarUnitati = numarKeguri;
          detalii = `${litriPerKeg}L / keg`;
          maxUnits = numarKeguri;
        }

        return {
          id: lot.id.toString(),
          reteta: lot.reteta || 'Necunoscut',
          cantitate: parseFloat(lot.cantitate || 0).toFixed(2),
          ambalaj,
          numarUnitati,
          detalii,
          dataAmbalare: lot.dataAmbalare || new Date().toISOString(),
          bottleSize: lot.bottleSize,
          kegSize: lot.kegSize,
          boxType: lot.boxType,
          maxUnits,
          packagingType: lot.packagingType, // Asigură-te că această proprietate este păstrată
        };
      });

      setLoturi(loturiTransformate);
      const newInputValues = {};
      const newMotivValues = {};
      loturiTransformate.forEach(lot => {
        newInputValues[lot.id] = '';
        newMotivValues[lot.id] = 'vanzare';
      });
      setInputValues(newInputValues);
      setMotivValues(newMotivValues);
      setErrors({});
    } catch (error) {
      setErrors({ global: `Eroare la încărcarea loturilor: ${error.message}` });
    }
  };

  const loadIesiri = async () => {
    try {
      const res = await fetch(`${API_URL}/api/iesiri-bere`);
      if (res.ok) {
        const iesiriData = await res.json();
        setIesiri(iesiriData);
      } else {
        setIesiri([]);
      }
    } catch (error) {
      console.error('Eroare la încărcarea ieșirilor:', error);
      setIesiri([]);
    }
  };

  const scoateDinStoc = async (lotId, numarUnitati, motivIesire) => {
    const lot = loturi.find((l) => l.id === lotId);
    if (!lot || !lot.reteta || !lot.packagingType) {
      setErrors(prev => ({ ...prev, [lotId]: 'Lotul nu a fost găsit sau datele sunt incomplete!' }));
      return;
    }

    const parsedUnits = parseInt(numarUnitati);
    if (isNaN(parsedUnits) || parsedUnits <= 0) {
      setErrors(prev => ({ ...prev, [lotId]: 'Introdu un număr valid de unități!' }));
      return;
    }
    if (parsedUnits > lot.maxUnits) {
      setErrors(prev => ({ ...prev, [lotId]: `Numărul de unități nu poate depăși ${lot.maxUnits}!` }));
      return;
    }

    let cantitateScoasaNum = 0;
    let unitatiMesaj = '';
    if (lot.packagingType === 'sticle') {
      const litriPerSticla = parseFloat(lot.bottleSize.replace('l', ''));
      const sticlePerCutie = parseInt(lot.boxType.split(' ')[0]);
      if (isNaN(litriPerSticla) || isNaN(sticlePerCutie)) {
        setErrors(prev => ({ ...prev, [lotId]: 'Date invalide pentru sticle!' }));
        return;
      }
      cantitateScoasaNum = parsedUnits * sticlePerCutie * litriPerSticla;
      unitatiMesaj = `${parsedUnits} cutii (${parsedUnits * sticlePerCutie} sticle, ${cantitateScoasaNum.toFixed(2)}L)`;
    } else if (lot.packagingType === 'keguri') {
      const litriPerKeg = parseFloat(lot.kegSize.replace('Keg ', '').replace('l', ''));
      if (isNaN(litriPerKeg)) {
        setErrors(prev => ({ ...prev, [lotId]: 'Date invalide pentru keguri!' }));
        return;
      }
      cantitateScoasaNum = parsedUnits * litriPerKeg;
      unitatiMesaj = `${parsedUnits} keg${parsedUnits === 1 ? '' : 'uri'} (${cantitateScoasaNum.toFixed(2)}L)`;
    }

    if (isNaN(cantitateScoasaNum) || cantitateScoasaNum <= 0) {
      setErrors(prev => ({ ...prev, [lotId]: 'Cantitatea calculată este invalidă!' }));
      return;
    }
    if (cantitateScoasaNum > parseFloat(lot.cantitate)) {
      setErrors(prev => ({ ...prev, [lotId]: 'Cantitatea de scos depășește stocul disponibil!' }));
      return;
    }

    const cantitateNoua = (parseFloat(lot.cantitate) - cantitateScoasaNum).toFixed(2);
    const payload = {
      lotId: lotId,
      reteta: lot.reteta,
      cantitate: parseFloat(cantitateScoasaNum.toFixed(2)),
      numarUnitatiScoase: parsedUnits,
      ambalaj: lot.packagingType,
      motiv: motivIesire,
      dataIesire: new Date().toISOString(),
      utilizator: 'Administrator',
    };

    console.log('Sending payload to /api/iesiri-bere:', payload);

    try {
      const iesireRes = await fetch(`${API_URL}/api/iesiri-bere`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!iesireRes.ok) {
        const errorData = await iesireRes.json();
        throw new Error(errorData.error || 'Eroare la înregistrarea ieșirii');
      }

      const res = await fetch(`${API_URL}/api/ambalare/${lotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cantitate: cantitateNoua,
        }),
      });
      if (!res.ok) throw new Error('Eroare la actualizarea lotului');

      await loadData();
      await loadIesiri();
      setErrors(prev => ({ ...prev, [lotId]: '' }));
      alert(`Ieșire înregistrată: ${unitatiMesaj} - ${motivIesire}`);
      setInputValues(prev => ({ ...prev, [lotId]: '' }));
      setMotivValues(prev => ({ ...prev, [lotId]: 'vanzare' }));
    } catch (error) {
      console.error('Eroare în scoateDinStoc:', error.message);
      setErrors(prev => ({ ...prev, [lotId]: `Eroare: ${error.message}` }));
    }
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const downloadStocPDF = () => {
    const latexContent = `
\\documentclass[a4paper,12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}
\\usepackage{array}
\\usepackage{booktabs}
\\usepackage{longtable}
\\usepackage{fontspec}
\\setmainfont{DejaVu Sans}
\\begin{document}
\\title{Stocul de Bere - ${new Date().toLocaleDateString('ro-RO')}}
\\author{Gestionare Depozitare}
\\date{}
\\maketitle
\\section*{Stocul Curent}
\\begin{longtable}{p{3cm} p{2.5cm} p{2.5cm} p{3cm} p{3cm} p{3cm}}
\\toprule
\\textbf{Rețetă} & \\textbf{Cantitate (L)} & \\textbf{Ambalaj} & \\textbf{Număr Unități} & \\textbf{Detalii} & \\textbf{Data Ambalării} \\\\
\\midrule
\\endhead
${loturi.map(lot => `
  ${lot.reteta} & ${lot.cantitate} & ${lot.ambalaj} & ${lot.numarUnitati} & ${lot.detalii} & ${new Date(lot.dataAmbalare).toLocaleDateString('ro-RO')} \\\\
`).join('')}
\\bottomrule
\\end{longtable}
\\end{document}
    `;
    downloadFile(latexContent, `stoc_bere_${new Date().toISOString().split('T')[0]}.tex`, 'text/x-tex');
    alert('Fișierul .tex pentru stoc a fost descărcat.');
  };

  const downloadIesiriPDF = () => {
    const latexContent = `
\\documentclass[a4paper,12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}
\\usepackage{array}
\\usepackage{booktabs}
\\usepackage{longtable}
\\usepackage{fontspec}
\\setmainfont{DejaVu Sans}
\\begin{document}
\\title{Istoric Ieșiri Bere - ${new Date().toLocaleDateString('ro-RO')}}
\\author{Gestionare Depozitare}
\\date{}
\\maketitle
\\section*{Ieșiri din Depozit}
\\begin{longtable}{p{2.5cm} p{2cm} p{2cm} p{2cm} p{2.5cm} p{2.5cm} p{2cm}}
\\toprule
\\textbf{Rețetă} & \\textbf{Cantitate (L)} & \\textbf{Număr Unități} & \\textbf{Ambalaj} & \\textbf{Motiv} & \\textbf{Data Ieșire} & \\textbf{Lot ID} \\\\
\\midrule
\\endhead
${iesiri.map(iesire => `
  ${iesire.reteta} & ${iesire.cantitate} & ${iesire.numarUnitatiScoase || ''} & ${iesire.ambalaj} & ${iesire.motiv} & ${new Date(iesire.dataIesire).toLocaleDateString('ro-RO')} & ${iesire.lotId} \\\\
`).join('')}
\\bottomrule
\\end{longtable}
\\section*{Sumar Total}
Total litri ieșiți: ${iesiri.reduce((total, iesire) => total + parseFloat(iesire.cantitate), 0).toFixed(2)}L
\\end{document}
    `;
    downloadFile(latexContent, `iesiri_bere_${new Date().toISOString().split('T')[0]}.tex`, 'text/x-tex');
    alert('Fișierul .tex pentru ieșiri a fost descărcat.');
  };

  const getTotalIesiriByReteta = () => {
    const totaluri = {};
    iesiri.forEach(iesire => {
      if (!totaluri[iesire.reteta]) {
        totaluri[iesire.reteta] = 0;
      }
      totaluri[iesire.reteta] += parseFloat(iesire.cantitate);
    });
    return totaluri;
  };

  const totalIesiri = iesiri.reduce((total, iesire) => total + parseFloat(iesire.cantitate), 0);

  return (
    <>
      <NavBar />
      <div className={styles.container}>
        <h1 className={styles.title}>Gestionare Depozitare</h1>
        {errors.global && <div className={styles.error}>{errors.global}</div>}
        <div className={styles.tabNavigation}>
          <button
            className={`${styles.tabButton} ${activeTab === 'stoc' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('stoc')}
          >
            Stoc Curent
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'iesiri' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('iesiri')}
          >
            Istoric Ieșiri ({iesiri.length})
          </button>
        </div>

        <div className={styles.sectionsContainer}>
          {activeTab === 'stoc' && (
            <div className={styles.section}>
              <h2>Stoc Curent</h2>
              <button onClick={downloadStocPDF} className={styles.button}>
                Descarcă Stoc ca PDF
              </button>
              <table className={styles.consumTable}>
                <thead>
                  <tr>
                    <th>Rețetă</th>
                    <th>Cantitate (L)</th>
                    <th>Ambalaj</th>
                    <th>Număr Unități</th>
                    <th>Detalii</th>
                    <th>Data Ambalării</th>
                    <th>Acțiuni</th>
                    <th>Eroare</th>
                  </tr>
                </thead>
                <tbody>
                  {loturi.map((lot) => (
                    <tr key={lot.id}>
                      <td>{lot.reteta}</td>
                      <td>{lot.cantitate}</td>
                      <td>{lot.ambalaj}</td>
                      <td>{lot.numarUnitati}</td>
                      <td>{lot.detalii}</td>
                      <td>{new Date(lot.dataAmbalare).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {lot.packagingType === 'sticle' ? (
                            <input
                              type="number"
                              min="0"
                              max={lot.maxUnits}
                              value={inputValues[lot.id] || ''}
                              onChange={(e) =>
                                setInputValues({ ...inputValues, [lot.id]: e.target.value })
                              }
                              className={styles.input}
                              placeholder={`Max ${lot.maxUnits} cutii`}
                              style={{ width: '120px' }}
                            />
                          ) : lot.packagingType === 'keguri' ? (
                            <select
                              value={inputValues[lot.id] || ''}
                              onChange={(e) =>
                                setInputValues({ ...inputValues, [lot.id]: e.target.value })
                              }
                              className={styles.select}
                              style={{ width: '120px' }}
                            >
                              <option value="">Alege nr. keguri</option>
                              {[...Array(lot.maxUnits + 1).keys()].slice(1).map((num) => (
                                <option key={num} value={num}>
                                  {num} keg{num === 1 ? '' : 'uri'}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              max={lot.maxUnits}
                              value={inputValues[lot.id] || ''}
                              onChange={(e) =>
                                setInputValues({ ...inputValues, [lot.id]: e.target.value })
                              }
                              className={styles.input}
                              placeholder={`Max ${lot.maxUnits} unități`}
                              style={{ width: '120px' }}
                            />
                          )}
                          <select
                            value={motivValues[lot.id] || 'vanzare'}
                            onChange={(e) =>
                              setMotivValues({ ...motivValues, [lot.id]: e.target.value })
                            }
                            className={styles.select}
                            style={{ width: '120px' }}
                          >
                            <option value="vanzare">Vânzare</option>
                            <option value="degustare">Degustare</option>
                            <option value="pierdere">Pierdere/Defect</option>
                            <option value="donatie">Donație</option>
                            <option value="consum_intern">Consum intern</option>
                            <option value="altul">Altul</option>
                          </select>
                          <button
                            onClick={() =>
                              scoateDinStoc(lot.id, inputValues[lot.id], motivValues[lot.id])
                            }
                            className={styles.buttonSmall}
                            disabled={!inputValues[lot.id] || inputValues[lot.id] === '0'}
                          >
                            Confirmă
                          </button>
                        </div>
                      </td>
                      <td className={styles.error}>{errors[lot.id] || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'iesiri' && (
            <div className={styles.section}>
              <h2>Istoric Ieșiri</h2>
              <div className={styles.iesiriControls}>
                <button onClick={downloadIesiriPDF} className={styles.button}>
                  Descarcă Ieșiri ca PDF
                </button>
                <div className={styles.totalIesiri}>
                  <strong>Total ieșit: {totalIesiri.toFixed(2)}L</strong>
                </div>
              </div>
              <div className={styles.sumarSection}>
                <h3>Sumar pe rețete:</h3>
                <div className={styles.sumarGrid}>
                  {Object.entries(getTotalIesiriByReteta()).map(([reteta, cantitate]) => (
                    <div key={reteta} className={styles.sumarItem}>
                      <strong>{reteta}:</strong> {cantitate.toFixed(2)}L
                    </div>
                  ))}
                </div>
              </div>
              <table className={styles.consumTable}>
                <thead>
                  <tr>
                    <th>Data Ieșire</th>
                    <th>Rețetă</th>
                    <th>Cantitate (L)</th>
                    <th>Număr Unități</th>
                    <th>Ambalaj</th>
                    <th>Motiv</th>
                    <th>Lot ID</th>
                  </tr>
                </thead>
                <tbody>
                  {iesiri.map((iesire, index) => (
                    <tr key={index}>
                      <td>{new Date(iesire.dataIesire).toLocaleDateString()}</td>
                      <td>{iesire.reteta}</td>
                      <td>{iesire.cantitate}</td>
                      <td>
                        {iesire.numarUnitatiScoase || ''} {iesire.ambalaj === 'sticle' ? 'cutii' : iesire.ambalaj === 'keguri' ? 'keguri' : ''}
                      </td>
                      <td>{iesire.ambalaj}</td>
                      <td>{iesire.motiv}</td>
                      <td>{iesire.lotId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Depozitare;