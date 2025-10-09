import React, { useEffect, useState } from 'react';
import styles from './Dashboard.module.css';
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
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Se încarcă datele...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <NavBar />
        <div className={styles.dashboard}>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <h3>Eroare la încărcarea datelor</h3>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className={styles.reloadButton}
            >
              Reîncarcă
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <ErrorBoundary>
      <NavBar />
      <div className={styles.dashboard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Panou de Control</h1>
          <div className={styles.dateTime}>
            <span className={styles.date}>{currentDate}</span>
            <span className={styles.time}>{currentTime} EEST</span>
          </div>
        </div>
        
        <div className={styles.cardContainer}>
          {/* Materii Prime Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Materii Prime</h2>
              <div className={styles.cardIcon}>🌾</div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.statValue}>
                {summary.materiiPrime.totalQuantity.toFixed(2)}
                <span className={styles.statLabel}>Total Cantitate</span>
              </div>
              <div className={styles.statValue}>
                {summary.materiiPrime.items.length}
                <span className={styles.statLabel}>Tipuri Materiale</span>
              </div>
            </div>
            <ul className={styles.previewList}>
              {summary.materiiPrime.items.slice(0, 3).map((material) => (
                <li key={material.id}>
                  <span className={styles.itemName}>{material.denumire}</span>
                  <span className={styles.itemValue}>{material.cantitate} {material.unitate}</span>
                </li>
              ))}
            </ul>
            <a href="/materii-prime" className={styles.viewMore}>
              Vezi Toate Materialele
              <span className={styles.arrow}>→</span>
            </a>
          </div>

          {/* Productions Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Producție</h2>
              <div className={styles.cardIcon}>🏭</div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.statValue}>
                {summary.productions.fullFermentors.length}
                <span className={styles.statLabel}>Fermentatoare Active</span>
              </div>
            </div>
            <ul className={styles.previewList}>
              {summary.productions.fullFermentors.slice(0, 3).map((fermentator) => (
                <li key={fermentator.id}>
                  <span className={styles.itemName}>{fermentator.nume}</span>
                  <span className={styles.itemValue}>{fermentator.cantitate}L</span>
                </li>
              ))}
            </ul>
            <a href="/productie" className={styles.viewMore}>
              Vezi Toată Producția
              <span className={styles.arrow}>→</span>
            </a>
          </div>

          {/* Ambalare Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Ambalare</h2>
              <div className={styles.cardIcon}>📦</div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.statValue}>
                {summary.ambalare.readyLots.length}
                <span className={styles.statLabel}>Loturi Gata</span>
              </div>
            </div>
            <ul className={styles.previewList}>
              {summary.ambalare.readyLots.slice(0, 3).map((fermentator) => (
                <li key={fermentator.id}>
                  <span className={styles.itemName}>{fermentator.nume}</span>
                  <span className={styles.itemValue}>{fermentator.cantitate}L</span>
                </li>
              ))}
            </ul>
            <a href="/ambalare" className={styles.viewMore}>
              Vezi Toată Ambalarea
              <span className={styles.arrow}>→</span>
            </a>
          </div>

          {/* Depozitare Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Depozitare</h2>
              <div className={styles.cardIcon}>🗄️</div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.statValue}>
                {summary.depozitare.totalStock.toFixed(2)}
                <span className={styles.statLabel}>Total Stoc (L)</span>
              </div>
              <div className={styles.statValue}>
                {summary.depozitare.lots.length}
                <span className={styles.statLabel}>Loturi în Stoc</span>
              </div>
            </div>
            <ul className={styles.previewList}>
              {summary.depozitare.lots.slice(0, 3).map((lot) => (
                <li key={lot.id}>
                  <span className={styles.itemName}>{lot.reteta}</span>
                  <span className={styles.itemValue}>{lot.cantitate}L</span>
                </li>
              ))}
            </ul>
            <a href="/depozitare" className={styles.viewMore}>
              Vezi Toată Depozitarea
              <span className={styles.arrow}>→</span>
            </a>
          </div>

          {/* Rebuturi Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Rebuturi</h2>
              <div className={styles.cardIcon}>🗑️</div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.statValue}>
                {summary.rebuturi.totalQuantity.toFixed(2)}
                <span className={styles.statLabel}>Total Cantitate (L)</span>
              </div>
              <div className={styles.statValue}>
                {summary.rebuturi.items.length}
                <span className={styles.statLabel}>Înregistrări</span>
              </div>
            </div>
            <ul className={styles.previewList}>
              {summary.rebuturi.items.slice(0, 3).map((rebut) => (
                <li key={rebut.id}>
                  <span className={styles.itemName}>{rebut.reteta || 'Necunoscut'}</span>
                  <span className={styles.itemValue}>{parseFloat(rebut.cantitate).toFixed(2)}L</span>
                </li>
              ))}
            </ul>
            <a href="/rebuturi" className={styles.viewMore}>
              Vezi Toate Rebuturile
              <span className={styles.arrow}>→</span>
            </a>
          </div>

          {/* Statistici Generale Card */}
          <div className={`${styles.card} ${styles.statsCard}`}>
            <div className={styles.cardHeader}>
              <h2>Statistici Generale</h2>
              <div className={styles.cardIcon}>📊</div>
            </div>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>{summary.materiiPrime.items.length}</div>
                <div className={styles.statLabel}>Materiale</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>{summary.productions.fullFermentors.length}</div>
                <div className={styles.statLabel}>Producție</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>{summary.depozitare.lots.length}</div>
                <div className={styles.statLabel}>Stocuri</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>{summary.rebuturi.items.length}</div>
                <div className={styles.statLabel}>Rebuturi</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;