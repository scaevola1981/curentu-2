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
    } catch (error) {
      console.error('Eroare la încărcarea rebuturilor:', error);
      alert(`Eroare la încărcarea rebuturilor: ${error.message}`);
    }
  };

  return (
    <>
      <NavBar />
      <div className={styles.container}>
        <h1 className={styles.title}>Rebuturi și Pierderi</h1>
        {Object.keys(grupatePeReteta).length === 0 ? (
          <p className={styles.noData}>Nu există rebuturi sau pierderi înregistrate.</p>
        ) : (
          <>
            {Object.entries(grupatePeReteta).map(([reteta, date]) => (
              <div key={reteta} className={styles.retetaSection}>
                <h2>{reteta}</h2>
                <table className={styles.rebutTable}>
                  <thead>
                    <tr>
                      <th>Lot ID</th>
                      <th>Cantitate (L)</th>
                      <th>Unități</th>
                      <th>Ambalaj</th>
                      <th>Tip Ambalaj</th>
                      <th>Capace</th>
                      <th>Etichete</th>
                      <th>Cutii</th>
                      <th>Sticle</th>
                      <th>Keguri</th>
                      <th>Data Ieșire</th>
                      <th>Detalii</th>
                    </tr>
                  </thead>
                  <tbody>
                    {date.loturi.map((rebut) => (
                      <tr key={rebut.id}>
                        <td>{rebut.lotId}</td>
                        <td>{parseFloat(rebut.cantitate).toFixed(2)}</td>
                        <td>{rebut.numarUnitatiScoase || '-'}</td>
                        <td>{rebut.ambalaj}</td>
                        <td>{rebut.boxType || '-'}</td>
                        <td>{rebut.materiale?.capace || 0}</td>
                        <td>{rebut.materiale?.etichete || 0}</td>
                        <td>{rebut.materiale?.cutii || 0}</td>
                        <td>{rebut.materiale?.sticle || 0}</td>
                        <td>{rebut.materiale?.keguri || 0}</td>
                        <td>{new Date(rebut.dataIesire).toLocaleDateString('ro-RO')}</td>
                        <td>{rebut.detaliiIesire || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="1"><strong>Total {reteta}</strong></td>
                      <td><strong>{date.totalLitri.toFixed(2)} L</strong></td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                      <td><strong>{date.totalCapace}</strong></td>
                      <td><strong>{date.totalEtichete}</strong></td>
                      <td><strong>{date.totalCutii}</strong></td>
                      <td><strong>{date.totalSticle}</strong></td>
                      <td><strong>{date.totalKeguri}</strong></td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))}
            <div className={styles.totalSection}>
              <h3>Total General</h3>
              <p>Litri: <strong>{totalLitri.toFixed(2)} L</strong></p>
              <p>Capace: <strong>{totalCapace}</strong></p>
              <p>Etichete: <strong>{totalEtichete}</strong></p>
              <p>Cutii: <strong>{totalCutii}</strong></p>
              <p>Sticle: <strong>{totalSticle}</strong></p>
              <p>Keguri: <strong>{totalKeguri}</strong></p>
              <p>Total înregistrări: {rebuturi.length}</p>

            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Rebuturi;