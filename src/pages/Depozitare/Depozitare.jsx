import React, { useEffect, useState } from 'react';
import NavBar from '../../Componente/NavBar/NavBar.jsx';
import styles from './depozitare.module.css';

const API_URL = 'http://localhost:3001'; // Adaugă URL-ul serverului

const Modal = ({ isOpen, onClose, title, children, onConfirm, confirmText, cancelText }) => {
  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>{title}</h2>
        {children}
        <div className={styles.modalButtons}>
          <button onClick={onConfirm} className={styles.button}>
            {confirmText || 'Confirmă'}
          </button>
          <button onClick={onClose} className={`${styles.button} ${styles.buttonDanger}`}>
            {cancelText || 'Anulează'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Depozitare = () => {
  const [loturi, setLoturi] = useState([]);
  const [modal, setModal] = useState({
    isOpen: false,
    type: '', // 'error', 'success', 'input'
    title: '',
    message: '',
    inputValue: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/loturi-ambalate`);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const loturiAmbalate = await res.json();

        // Transformăm loturile pentru a include detalii despre ambalaj în funcție de tip
        const loturiTransformate = loturiAmbalate.map(lot => {
          let numarUnitati = 0;
          let detalii = '';
          let ambalaj = lot.packagingType;

          if (lot.packagingType === 'sticle') {
            const litriPerSticla = parseFloat(lot.bottleSize.replace('l', ''));
            const sticlePerCutie = parseInt(lot.boxType.split(' ')[0]);
            const numarSticle = Math.ceil(lot.cantitate / litriPerSticla);
            const numarCutii = Math.floor(numarSticle / sticlePerCutie);
            const sticleLibere = numarSticle % sticlePerCutie;
            numarUnitati = numarSticle;
            detalii = `${numarCutii} cutii (${sticlePerCutie} sticle/cutie) + ${sticleLibere} sticle libere`;
          } else if (lot.packagingType === 'keguri') {
            const litriPerKeg = parseFloat(lot.kegSize.replace('Keg ', '').replace('l', ''));
            const numarKeguri = Math.ceil(lot.cantitate / litriPerKeg);
            numarUnitati = numarKeguri;
            detalii = `${litriPerKeg}L / keg`;
          }

          return {
            id: lot.id,
            reteta: lot.reteta,
            cantitate: parseFloat(lot.cantitate).toFixed(2),
            ambalaj,
            numarUnitati,
            detalii,
            dataAmbalare: lot.dataAmbalare || new Date().toISOString(),
          };
        });

        setLoturi(loturiTransformate);
      } catch (error) {
        showErrorModal(`Eroare la încărcarea loturilor: ${error.message}`);
      }
    };
    loadData();
  }, []);

  const showErrorModal = (message) => {
    setModal({
      isOpen: true,
      type: 'error',
      title: 'Eroare',
      message,
      inputValue: '',
      onConfirm: () => setModal({ ...modal, isOpen: false }),
    });
  };

  const showSuccessModal = (message) => {
    setModal({
      isOpen: true,
      type: 'success',
      title: 'Succes',
      message,
      inputValue: '',
      onConfirm: () => setModal({ ...modal, isOpen: false }),
    });
  };

  const showInputModal = (title, onConfirm) => {
    setModal({
      isOpen: true,
      type: 'input',
      title,
      message: '',
      inputValue: '',
      onConfirm: (value) => {
        if (value && !isNaN(value) && parseFloat(value) > 0) {
          onConfirm(parseFloat(value).toFixed(2));
          setModal({ ...modal, isOpen: false, inputValue: '' });
        } else {
          showErrorModal('Introdu o cantitate validă!');
        }
      },
    });
  };

  const scoateDinStoc = async (lotId, cantitateScoasa) => {
    const cantitateScoasaNum = parseFloat(cantitateScoasa);
    const lot = loturi.find((l) => l.id === lotId);
    if (!lot || cantitateScoasaNum > parseFloat(lot.cantitate)) {
      showErrorModal('Cantitatea de scos depășește stocul sau lotul nu există!');
      return;
    }

    const cantitateNoua = (parseFloat(lot.cantitate) - cantitateScoasaNum).toFixed(2);

    try {
      const res = await fetch(`${API_URL}/api/ambalare/${lotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cantitate: cantitateNoua,
        }),
      });
      if (!res.ok) throw new Error('Eroare la actualizarea lotului');

      // Reîncărcăm loturile actualizate
      const updatedRes = await fetch(`${API_URL}/api/loturi-ambalate`);
      const loturiAmbalate = await updatedRes.json();
      const loturiTransformate = loturiAmbalate.map(lot => {
        let numarUnitati = 0;
        let detalii = '';
        let ambalaj = lot.packagingType;

        if (lot.packagingType === 'sticle') {
          const litriPerSticla = parseFloat(lot.bottleSize.replace('l', ''));
          const sticlePerCutie = parseInt(lot.boxType.split(' ')[0]);
          const numarSticle = Math.ceil(lot.cantitate / litriPerSticla);
          const numarCutii = Math.floor(numarSticle / sticlePerCutie);
          const sticleLibere = numarSticle % sticlePerCutie;
          numarUnitati = numarSticle;
          detalii = `${numarCutii} cutii (${sticlePerCutie} sticle/cutie) + ${sticleLibere} sticle libere`;
        } else if (lot.packagingType === 'keguri') {
          const litriPerKeg = parseFloat(lot.kegSize.replace('Keg ', '').replace('l', ''));
          const numarKeguri = Math.ceil(lot.cantitate / litriPerKeg);
          numarUnitati = numarKeguri;
          detalii = `${litriPerKeg}L / keg`;
        }

        return {
          id: lot.id,
          reteta: lot.reteta,
          cantitate: parseFloat(lot.cantitate).toFixed(2),
          ambalaj,
          numarUnitati,
          detalii,
          dataAmbalare: lot.dataAmbalare || new Date().toISOString(),
        };
      });
      setLoturi(loturiTransformate);

      showSuccessModal(`Cantitate scoasă: ${cantitateScoasaNum.toFixed(2)}L`);
    } catch (error) {
      showErrorModal(`Eroare la scoaterea din stoc: ${error.message}`);
    }
  };

  const downloadPDF = () => {
    const latexContent = `
\\documentclass[a4paper,12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}
\\usepackage{array}
\\usepackage{booktabs}
\\usepackage{longtable}

% Defining fonts
\\usepackage{fontspec}
\\setmainfont{DejaVu Sans}

% Starting document
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

    const blob = new Blob([latexContent], { type: 'text/x-tex' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stoc_bere_${new Date().toISOString().split('T')[0]}.tex`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    showSuccessModal('Fișierul .tex a fost descărcat. Folosește un compilator LaTeX (e.g., Overleaf) pentru a genera PDF.');
  };

  return (
    <>
      <NavBar />
      <div className={styles.container}>
        <h1 className={styles.title}>Gestionare Depozitare</h1>
        <div className={styles.sectionsContainer}>
          <div className={styles.section}>
            <h2>Stoc Curent</h2>
            <button onClick={downloadPDF} className={styles.button}>
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
                      <button
                        onClick={() =>
                          showInputModal('Cantitate de scos (L):', (value) => {
                            if (value) scoateDinStoc(lot.id, value);
                          })
                        }
                        className={styles.buttonSmall}
                      >
                        Scoate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false, inputValue: '' })}
        title={modal.title}
        onConfirm={() => modal.onConfirm(modal.inputValue)}
        confirmText={modal.type === 'confirm' ? 'Confirmă' : 'OK'}
      >
        {modal.type === 'input' ? (
          <input
            type="number"
            value={modal.inputValue}
            onChange={(e) => setModal({ ...modal, inputValue: e.target.value })}
            className={styles.input}
            placeholder="Introdu cantitatea"
            step="0.01"
          />
        ) : (
          <p>{modal.message}</p>
        )}
      </Modal>
    </>
  );
};

export default Depozitare;