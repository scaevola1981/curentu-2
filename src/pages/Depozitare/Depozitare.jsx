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
        // Apelăm ruta API pentru a obține loturile
        const res = await fetch(`${API_URL}/api/loturi-ambalate`);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const loturiAmbalate = await res.json();

        // Transformăm loturile pentru a include detalii despre ambalaj
        const loturiTransformate = loturiAmbalate.map(lot => {
          let detalii = '';
          let numarUnitati = 0;
          if (lot.unitate === 'litri') {
            // Presupunem că toate loturile sunt în litri și calculăm sticlele (0.33L/sticlă)
            numarUnitati = Math.ceil(lot.cantitate / 0.33); // Număr de sticle
            detalii = `${numarUnitati} sticle (0.33L)`;
          } else {
            // Dacă unitatea nu este litri, afișăm cantitatea direct
            numarUnitati = lot.cantitate;
            detalii = `${lot.cantitate} ${lot.unitate}`;
          }

          return {
            id: lot.id,
            reteta: lot.reteta,
            cantitate: parseFloat(lot.cantitate).toFixed(2),
            ambalaj: 'sticle', // Presupunem sticle implicit; ajustează dacă ai tipul de ambalaj
            numarUnitati,
            data: lot.dataAmbalare || lot.dataCreare, // Folosim data ambalării sau creării
            detalii,
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
    const cantitateScoasaNum = parseFloat(cantitateScoasa).toFixed(2);
    const lot = loturi.find((l) => l.id === lotId);
    if (!lot || parseFloat(cantitateScoasaNum) > parseFloat(lot.cantitate)) {
      showErrorModal('Cantitatea de scos depășește stocul sau lotul nu există!');
      return;
    }

    // Apelăm ruta API pentru a actualiza lotul
    try {
      const res = await fetch(`${API_URL}/api/producere/${lotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cantitate: (parseFloat(lot.cantitate) - parseFloat(cantitateScoasaNum)).toFixed(2),
          numarUnitati: Math.floor(
            (parseFloat(lot.cantitate) - parseFloat(cantitateScoasaNum)) / 0.33 // Ajustăm pentru sticle
          ),
        }),
      });
      if (!res.ok) throw new Error('Eroare la actualizarea lotului');
      const updatedLoturi = await fetch(`${API_URL}/api/producere`);
      const loturiAmbalate = await updatedLoturi.json();
      const loturiTransformate = loturiAmbalate.map(lot => {
        let detalii = '';
        let numarUnitati = 0;
        if (lot.unitate === 'litri') {
          numarUnitati = Math.ceil(lot.cantitate / 0.33);
          detalii = `${numarUnitati} sticle (0.33L)`;
        } else {
          numarUnitati = lot.cantitate;
          detalii = `${lot.cantitate} ${lot.unitate}`;
        }
        return {
          id: lot.id,
          reteta: lot.reteta,
          cantitate: parseFloat(lot.cantitate).toFixed(2),
          ambalaj: 'sticle',
          numarUnitati,
          data: lot.dataAmbalare || lot.dataCreare,
          detalii,
        };
      });
      setLoturi(loturiTransformate);

      showSuccessModal(`Cantitate scoasă: ${cantitateScoasaNum}L`);
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

\\begin{longtable}{p{3cm} p{2.5cm} p{2.5cm} p{3cm} p{3cm}}
\\toprule
\\textbf{Rețetă} & \\textbf{Cantitate (L)} & \\textbf{Număr Unități} & \\textbf{Detalii} & \\textbf{Data} \\\\
\\midrule
\\endhead
${loturi.map(lot => `
  ${lot.reteta} & ${lot.cantitate} & ${lot.numarUnitati} & ${lot.detalii} & ${new Date(lot.data).toLocaleDateString('ro-RO')} \\\\
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
                  <th>Unități</th>
                  <th>Detalii</th>
                  <th>Data ambalarii</th>
                  <th>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {loturi.map((lot) => (
                  <tr key={lot.id}>
                    <td>{lot.reteta}</td>
                    <td>{lot.cantitate}</td>
                    <td>{lot.numarUnitati}</td>
                    <td>{lot.detalii}</td>
                    <td>{new Date(lot.data).toLocaleDateString()}</td>
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