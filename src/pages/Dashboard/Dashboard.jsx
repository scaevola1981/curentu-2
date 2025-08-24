import React, { useEffect, useState } from 'react';
import styles from './dashboard.module.css';
import NavBar from '../../Componente/NavBar/NavBar';
import ErrorBoundary from '../../Componente/ErrorBoundary';

const API_URL = 'http://localhost:3001';

const Dashboard = () => {
  const [summary, setSummary] = useState({
    materiiPrime: { items: [], totalQuantity: 0 },
    productions: { fullFermentors: [] },
    ambalare: { readyLots: [] },
    depozitare: { lots: [], totalStock: 0 },
    rebuturi: { items: [], totalQuantity: 0, totalCapace: 0, totalEtichete: 0, totalCutii: 0, totalSticle: 0, totalKeguri: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Materii Prime
        const materiiRes = await fetch(`${API_URL}/api/materii-prime`);
        if (!materiiRes.ok) throw new Error(`Eroare HTTP: ${materiiRes.status}`);
        const materiiData = await materiiRes.json();
        const totalQuantity = materiiData.reduce((sum, m) => sum + parseFloat(m.cantitate || 0), 0);

        // Productions (Full Fermentors)
        const fermentatoareRes = await fetch(`${API_URL}/api/fermentatoare`);
        if (!fermentatoareRes.ok) throw new Error(`Eroare HTTP: ${fermentatoareRes.status}`);
        const fermentatoareData = await fermentatoareRes.json();
        const fullFermentors = fermentatoareData.filter(f => f.ocupat);

        // Ambalare (Occupied Fermentors as Ready Lots)
        const ambalareData = fermentatoareData.filter(f => f.ocupat);

        // Depozitare (Stored Stock)
        const depozitareRes = await fetch(`${API_URL}/api/loturi-ambalate`);
        if (!depozitareRes.ok) throw new Error(`Eroare HTTP: ${depozitareRes.status}`);
        const depozitareData = await depozitareRes.json();
        const totalStock = depozitareData.reduce((sum, l) => sum + parseFloat(l.cantitate || 0), 0);

        // Rebuturi - Folosim datele reale
        const rebuturiRes = await fetch(`${API_URL}/api/rebuturi`);
        if (!rebuturiRes.ok) throw new Error(`Eroare HTTP: ${rebuturiRes.status}`);
        const rebuturiData = await rebuturiRes.json();
        
        const totalRebuturi = rebuturiData.reduce((sum, r) => sum + parseFloat(r.cantitate || 0), 0);
        const totalCapace = rebuturiData.reduce((sum, r) => sum + (r.materiale?.capace || 0), 0);
        const totalEtichete = rebuturiData.reduce((sum, r) => sum + (r.materiale?.etichete || 0), 0);
        const totalCutii = rebuturiData.reduce((sum, r) => sum + (r.materiale?.cutii || 0), 0);
        const totalSticle = rebuturiData.reduce((sum, r) => sum + (r.materiale?.sticle || 0), 0);
        const totalKeguri = rebuturiData.reduce((sum, r) => sum + (r.materiale?.keguri || 0), 0);

        setSummary({
          materiiPrime: { items: materiiData, totalQuantity },
          productions: { fullFermentors },
          ambalare: { readyLots: ambalareData },
          depozitare: { lots: depozitareData, totalStock },
          rebuturi: { 
            items: rebuturiData, 
            totalQuantity: totalRebuturi,
            totalCapace,
            totalEtichete,
            totalCutii,
            totalSticle,
            totalKeguri
          },
        });
      } catch (error) {
        console.error('Eroare la încărcarea sumarului:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const currentTime = new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Bucharest' });
  const currentDate = new Date().toLocaleDateString('ro-RO');

  if (isLoading) {
    return (
      <>
        <NavBar />
        <div className={styles.dashboard}>
          <p style={{ textAlign: 'center', padding: '20px' }}>Se încarcă datele...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <NavBar />
        <div className={styles.dashboard}>
          <p style={{ textAlign: 'center', padding: '20px', color: '#d32f2f' }}>
            Eroare: {error}. Verificați serverul sau contactați suportul.
          </p>
          <button onClick={() => window.location.reload()} style={{ display: 'block', margin: '0 auto' }}>
            Reîncarcă
          </button>
        </div>
      </>
    );
  }

  return (
    <ErrorBoundary>
      <NavBar />
      <div className={styles.dashboard}>
        <h1 className={styles.title}>Panou de Control</h1>
        <p className={styles.dateTime}>Data: {currentDate} | Ora: {currentTime} EEST</p>
        <div className={styles.cardContainer}>
          {/* Materii Prime Card */}
          <div className={styles.card}>
            <h2>Materii Prime</h2>
            <p>Total Cantitate: <strong>{summary.materiiPrime.totalQuantity.toFixed(2)}</strong></p>
            <ul className={styles.previewList}>
              {summary.materiiPrime.items.slice(0, 5).map((material) => (
                <li key={material.id}>{material.denumire}: {material.cantitate} {material.unitate}</li>
              ))}
              {summary.materiiPrime.items.length > 5 && <li>...și altele</li>}
            </ul>
            <a href="/materii-prime" className={styles.viewMore}>Vezi Toate</a>
          </div>

          {/* Productions Card */}
          <div className={styles.card}>
            <h2>Producție</h2>
            <p>Fermentatoare Pline: <strong>{summary.productions.fullFermentors.length}</strong></p>
            <ul className={styles.previewList}>
              {summary.productions.fullFermentors.slice(0, 5).map((fermentator) => (
                <li key={fermentator.id}>{fermentator.nume}: {fermentator.cantitate}L ({fermentator.reteta || 'Necunoscut'})</li>
              ))}
              {summary.productions.fullFermentors.length > 5 && <li>...și altele</li>}
            </ul>
            <a href="/productie" className={styles.viewMore}>Vezi Toată Producția</a>
          </div>

          {/* Ambalare Card */}
          <div className={styles.card}>
            <h2>Ambalare</h2>
            <p>Loturi Gata: <strong>{summary.ambalare.readyLots.length}</strong></p>
            <ul className={styles.previewList}>
              {summary.ambalare.readyLots.slice(0, 5).map((fermentator) => (
                <li key={fermentator.id}>{fermentator.nume}: {fermentator.cantitate}L ({fermentator.reteta || 'Necunoscut'})</li>
              ))}
              {summary.ambalare.readyLots.length > 5 && <li>...și altele</li>}
            </ul>
            <a href="/ambalare" className={styles.viewMore}>Vezi Toată Ambalarea</a>
          </div>

          {/* Depozitare Card */}
          <div className={styles.card}>
            <h2>Depozitare</h2>
            <p>Total Stoc: <strong>{summary.depozitare.totalStock.toFixed(2)} L</strong></p>
            <ul className={styles.previewList}>
              {summary.depozitare.lots.slice(0, 5).map((lot) => (
                <li key={lot.id}>{lot.reteta}: {lot.cantitate}L ({lot.packagingType || 'Necunoscut'})</li>
              ))}
              {summary.depozitare.lots.length > 5 && <li>...și altele</li>}
            </ul>
            <a href="/depozitare" className={styles.viewMore}>Vezi Toată Depozitarea</a>
          </div>

          {/* Rebuturi Card - Actualizat cu date reale */}
          <div className={styles.card}>
            <h2>Rebuturi</h2>
            <p>Total Cantitate: <strong>{summary.rebuturi.totalQuantity.toFixed(2)} L</strong></p>
            <p>Total înregistrări: <strong>{summary.rebuturi.items.length}</strong></p>
            <ul className={styles.previewList}>
              {summary.rebuturi.items.slice(0, 5).map((rebut) => (
                <li key={rebut.id}>
                  {rebut.reteta || 'Necunoscut'}: {parseFloat(rebut.cantitate).toFixed(2)}L
                </li>
              ))}
              {summary.rebuturi.items.length > 5 && <li>...și altele</li>}
            </ul>
            <a href="/rebuturi" className={styles.viewMore}>Vezi Toate Rebuturile</a>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;