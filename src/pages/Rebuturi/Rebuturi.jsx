import React, { useEffect, useState } from 'react';
import NavBar from '../../Componente/NavBar/NavBar.jsx';
import styles from './rebuturi.module.css';

const API_URL = 'http://localhost:3001';

const Rebuturi = () => {
  const [rebuturi, setRebuturi] = useState([]);
  const [grupatePeReteta, setGrupatePeReteta] = useState({});
  const [totalLitri, setTotalLitri] = useState(0);
  const [totalCapace, setTotalCapace] = useState(0);
  const [totalEtichete, setTotalEtichete] = useState(0);
  const [totalCutii, setTotalCutii] = useState(0);
  const [totalSticle, setTotalSticle] = useState(0);
  const [totalKeguri, setTotalKeguri] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRebuturi();
  }, []);

  const loadRebuturi = async () => {
    try {
      const res = await fetch(`${API_URL}/api/rebuturi`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const rebuturiData = await res.json();
      setRebuturi(rebuturiData);

      // Group by reteta
      const grupate = rebuturiData.reduce((acc, rebut) => {
        const reteta = rebut.reteta || 'Necunoscut';
        if (!acc[reteta]) {
          acc[reteta] = {
            loturi: [],
            totalLitri: 0,
            totalCapace: 0,
            totalEtichete: 0,
            totalCutii: 0,
            totalSticle: 0,
            totalKeguri: 0,
          };
        }
        acc[reteta].loturi.push(rebut);
        acc[reteta].totalLitri += parseFloat(rebut.cantitate);
        acc[reteta].totalCapace += rebut.materiale?.capace || 0;
        acc[reteta].totalEtichete += rebut.materiale?.etichete || 0;
        acc[reteta].totalCutii += rebut.materiale?.cutii || 0;
        acc[reteta].totalSticle += rebut.materiale?.sticle || 0;
        acc[reteta].totalKeguri += rebut.materiale?.keguri || 0;
        return acc;
      }, {});

      // Calculate overall totals
      const litri = rebuturiData.reduce((sum, rebut) => sum + parseFloat(rebut.cantitate), 0);
      const capace = rebuturiData.reduce((sum, rebut) => sum + (rebut.materiale?.capace || 0), 0);
      const etichete = rebuturiData.reduce((sum, rebut) => sum + (rebut.materiale?.etichete || 0), 0);
      const cutii = rebuturiData.reduce((sum, rebut) => sum + (rebut.materiale?.cutii || 0), 0);
      const sticle = rebuturiData.reduce((sum, rebut) => sum + (rebut.materiale?.sticle || 0), 0);
      const keguri = rebuturiData.reduce((sum, rebut) => sum + (rebut.materiale?.keguri || 0), 0);

      setGrupatePeReteta(grupate);
      setTotalLitri(litri);
      setTotalCapace(capace);
      setTotalEtichete(etichete);
      setTotalCutii(cutii);
      setTotalSticle(sticle);
      setTotalKeguri(keguri);
      setError('');
    } catch (error) {
      setError(`Eroare la încărcarea rebuturilor: ${error.message}`);
    }
  };

  const handleDeleteAllRebuturi = async () => {
    if (!window.confirm('Sigur doriți să ștergeți toate rebuturile? Această acțiune nu poate fi anulată!')) return;

    try {
      const res = await fetch(`${API_URL}/api/iesiri-bere`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      
      // Reset all state
      setRebuturi([]);
      setGrupatePeReteta({});
      setTotalLitri(0);
      setTotalCapace(0);
      setTotalEtichete(0);
      setTotalCutii(0);
      setTotalSticle(0);
      setTotalKeguri(0);
      setError('Toate rebuturile au fost șterse cu succes!');
    } catch (error) {
      setError(`Eroare la ștergerea rebuturilor: ${error.message}`);
    }
  };

  return (
    <>
      <NavBar />
      <div className={styles.container}>
        {error && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <p>{error}</p>
              <button className={styles.modalButton} onClick={() => setError('')}>
                Închide
              </button>
            </div>
          </div>
        )}
        <h1 className={styles.title}>Rebuturi și Pierderi</h1>
        
        <div className={styles.toolbar}>
          {import.meta.env.MODE === 'production' && (
            <button className={styles.buttonDeleteAll} onClick={handleDeleteAllRebuturi}>
              Șterge Toate Rebuturile
            </button>
          )}
        </div>

        {Object.keys(grupatePeReteta).length === 0 ? (
          <p className={styles.noData}>Nu există rebuturi sau pierderi înregistrate.</p>
        ) : (
          <>
            <div className={styles.gridContainer}>
              {Object.entries(grupatePeReteta).map(([reteta, date]) => (
                <div key={reteta} className={styles.recipeCard}>
                  <div className={styles.cardHeader}>
                    <h2>{reteta}</h2>
                  </div>
                  
                  <div className={styles.cardSummary}>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Total Litri:</span>
                      <span className={styles.summaryValue}>{date.totalLitri.toFixed(2)} L</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Capace:</span>
                      <span className={styles.summaryValue}>{date.totalCapace}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Etichete:</span>
                      <span className={styles.summaryValue}>{date.totalEtichete}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Sticle:</span>
                      <span className={styles.summaryValue}>{date.totalSticle}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Keguri:</span>
                      <span className={styles.summaryValue}>{date.totalKeguri}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Loturi:</span>
                      <span className={styles.summaryValue}>{date.loturi.length}</span>
                    </div>
                  </div>
                  
                  <div className={styles.loturiSection}>
                    <h3>Loturi</h3>
                    <div className={styles.loturiGrid}>
                      {date.loturi.map((rebut) => (
                        <div key={rebut.id} className={styles.lotCard}>
                          <div className={styles.lotHeader}>
                            <span className={styles.lotId}>Lot ID: {rebut.lotId}</span>
                            <span className={styles.lotDate}>
                              {new Date(rebut.dataIesire).toLocaleDateString('ro-RO')}
                            </span>
                          </div>
                          
                          <div className={styles.lotDetails}>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Cantitate:</span>
                              <span className={styles.detailValue}>{parseFloat(rebut.cantitate).toFixed(2)} L</span>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Ambalaj:</span>
                              <span className={styles.detailValue}>{rebut.ambalaj}</span>
                            </div>
                            {rebut.boxType && (
                              <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Tip ambalaj:</span>
                                <span className={styles.detailValue}>{rebut.boxType}</span>
                              </div>
                            )}
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Unități:</span>
                              <span className={styles.detailValue}>{rebut.numarUnitatiScoase || '-'}</span>
                            </div>
                            {rebut.detaliiIesire && (
                              <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Detalii:</span>
                                <span className={styles.detailValue}>{rebut.detaliiIesire}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className={styles.materialsGrid}>
                            <div className={styles.materialItem}>
                              <span className={styles.materialLabel}>Capace</span>
                              <span className={styles.materialValue}>{rebut.materiale?.capace || 0}</span>
                            </div>
                            <div className={styles.materialItem}>
                              <span className={styles.materialLabel}>Etichete</span>
                              <span className={styles.materialValue}>{rebut.materiale?.etichete || 0}</span>
                            </div>
                            <div className={styles.materialItem}>
                              <span className={styles.materialLabel}>Cutii</span>
                              <span className={styles.materialValue}>{rebut.materiale?.cutii || 0}</span>
                            </div>
                            <div className={styles.materialItem}>
                              <span className={styles.materialLabel}>Sticle</span>
                              <span className={styles.materialValue}>{rebut.materiale?.sticle || 0}</span>
                            </div>
                            <div className={styles.materialItem}>
                              <span className={styles.materialLabel}>Keguri</span>
                              <span className={styles.materialValue}>{rebut.materiale?.keguri || 0}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className={styles.totalSection}>
              <h3>Total General</h3>
              <div className={styles.totalGrid}>
                <div className={styles.totalItem}>
                  <span className={styles.totalLabel}>Litri:</span>
                  <span className={styles.totalValue}>{totalLitri.toFixed(2)} L</span>
                </div>
                <div className={styles.totalItem}>
                  <span className={styles.totalLabel}>Capace:</span>
                  <span className={styles.totalValue}>{totalCapace}</span>
                </div>
                <div className={styles.totalItem}>
                  <span className={styles.totalLabel}>Etichete:</span>
                  <span className={styles.totalValue}>{totalEtichete}</span>
                </div>
                <div className={styles.totalItem}>
                  <span className={styles.totalLabel}>Cutii:</span>
                  <span className={styles.totalValue}>{totalCutii}</span>
                </div>
                <div className={styles.totalItem}>
                  <span className={styles.totalLabel}>Sticle:</span>
                  <span className={styles.totalValue}>{totalSticle}</span>
                </div>
                <div className={styles.totalItem}>
                  <span className={styles.totalLabel}>Keguri:</span>
                  <span className={styles.totalValue}>{totalKeguri}</span>
                </div>
                <div className={styles.totalItem}>
                  <span className={styles.totalLabel}>Total înregistrări:</span>
                  <span className={styles.totalValue}>{rebuturi.length}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Rebuturi;