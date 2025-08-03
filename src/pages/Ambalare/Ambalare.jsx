import React, { useState, useEffect, useCallback } from 'react';
import NavBar from '../../Componente/NavBar/NavBar';
import styles from './ambalare.module.css';

const API_URL = "http://localhost:3001/api";

const Ambalare = () => {
  const [fermentatoare, setFermentatoare] = useState([]);
  const [loturi, setLoturi] = useState([]);
  const [materialeAmbalare, setMaterialeAmbalare] = useState([]);
  const [error, setError] = useState("");
  const [selectedFermentator, setSelectedFermentator] = useState(null);
  const [packagingOptions, setPackagingOptions] = useState({
    sticle: { id: 1, denumire: "Sticle 0.33l", cantitate: 0 },
    cutii6: { id: 2, denumire: "Cutii 6 sticle", cantitate: 0 },
    cutii12: { id: 3, denumire: "Cutii 12 sticle", cantitate: 0 },
    cutii24: { id: 4, denumire: "Cutii 24 sticle", cantitate: 0 },
    keg10: { id: 5, denumire: "Keg 10l", cantitate: 0 },
    keg20: { id: 6, denumire: "Keg 20l", cantitate: 0 },
    keg30: { id: 7, denumire: "Keg 30l", cantitate: 0 },
    keg40: { id: 8, denumire: "Keg 40l", cantitate: 0 },
    keg50: { id: 9, denumire: "Keg 50l", cantitate: 0 },
    etichete: { id: 10, denumire: "Etichete", cantitate: 0 },
    capace: { id: 11, denumire: "Capace", cantitate: 0 },
  });

  const loadFermentatoare = useCallback(async () => {
    try {
      console.log('Fetching fermentatoare from:', `${API_URL}/fermentatoare`); // Debug log
      const res = await fetch(`${API_URL}/fermentatoare`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      console.log('Fermentatoare fetched:', data); // Debug log
      setFermentatoare(data);
    } catch (error) {
      console.error('Eroare la încărcarea fermentatoarelor:', error.message, error.stack);
      setError("Eroare la încărcarea fermentatoarelor: " + error.message);
    }
  }, []);

  const loadLoturi = useCallback(async () => {
    try {
      console.log('Fetching loturi from:', `${API_URL}/producere`); // Debug log
      const res = await fetch(`${API_URL}/producere`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      console.log('Loturi fetched:', data); // Debug log
      setLoturi(data);
    } catch (error) {
      console.error('Eroare la încărcarea loturilor:', error.message, error.stack);
      setError("Eroare la încărcarea loturilor: " + error.message);
    }
  }, []);

  const loadMaterialeAmbalare = useCallback(async () => {
    try {
      console.log('Fetching materiale ambalare from:', `${API_URL}/materiale-ambalare`); // Debug log
      const res = await fetch(`${API_URL}/materiale-ambalare`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      console.log('Materiale ambalare fetched:', data); // Debug log
      setMaterialeAmbalare(data);
    } catch (error) {
      console.error('Eroare la încărcarea materialelor de ambalare:', error.message, error.stack);
      setError("Eroare la încărcarea materialelor de ambalare: " + error.message);
    }
  }, []);

  const descarcaFermentator = async (fermentator) => {
    try {
      // Verify packaging material stock
      const requiredMaterials = [];
      Object.values(packagingOptions).forEach(option => {
        if (option.cantitate > 0) {
          const material = materialeAmbalare.find(m => m.id === option.id);
          if (!material || material.cantitate < option.cantitate) {
            throw new Error(`Stoc insuficient pentru ${option.denumire}: ${material ? material.cantitate : 0} disponibile`);
          }
          requiredMaterials.push({
            id: option.id,
            denumire: option.denumire,
            cantitate: -option.cantitate, // Negative to reduce stock
            unitate: material.unitate,
            producator: material.producator,
            codProdus: material.codProdus,
            lot: material.lot,
            tip: material.tip,
            subcategorie: material.subcategorie
          });
        }
      });

      // Update packaging material stock
      for (const material of requiredMaterials) {
        const response = await fetch(`${API_URL}/materiale-ambalare`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(material),
        });
        if (!response.ok) throw new Error(`Failed to update stock for ${material.denumire}`);
      }

      // Create lot
      const lot = {
        reteta: fermentator.reteta,
        cantitate: fermentator.cantitate,
        unitate: "litri",
        dataInceput: fermentator.dataInceput,
        dataAmbalare: new Date().toISOString(),
        ambalare: Object.values(packagingOptions).filter(opt => opt.cantitate > 0)
      };

      const lotResponse = await fetch(`${API_URL}/producere`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lot),
      });

      if (!lotResponse.ok) throw new Error(`Failed to create lot for ${fermentator.reteta}`);

      // Release fermenter
      const updatedFermentator = {
        ...fermentator,
        ocupat: false,
        reteta: null,
        cantitate: 0,
        dataInceput: null
      };

      const fermentatorResponse = await fetch(`${API_URL}/fermentatoare/${fermentator.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFermentator),
      });

      if (!fermentatorResponse.ok) throw new Error(`Failed to release fermentator ${fermentator.nume}`);

      setFermentatoare(prev =>
        prev.map(f =>
          f.id === fermentator.id ? updatedFermentator : f
        )
      );

      setLoturi(prev => [...prev, { id: prev.length + 1, ...lot }]);
      setMaterialeAmbalare(prev =>
        prev.map(m => {
          const usedMaterial = requiredMaterials.find(rm => rm.id === m.id);
          return usedMaterial ? { ...m, cantitate: m.cantitate + usedMaterial.cantitate } : m;
        })
      );
      setPackagingOptions({
        sticle: { id: 1, denumire: "Sticle 0.33l", cantitate: 0 },
        cutii6: { id: 2, denumire: "Cutii 6 sticle", cantitate: 0 },
        cutii12: { id: 3, denumire: "Cutii 12 sticle", cantitate: 0 },
        cutii24: { id: 4, denumire: "Cutii 24 sticle", cantitate: 0 },
        keg10: { id: 5, denumire: "Keg 10l", cantitate: 0 },
        keg20: { id: 6, denumire: "Keg 20l", cantitate: 0 },
        keg30: { id: 7, denumire: "Keg 30l", cantitate: 0 },
        keg40: { id: 8, denumire: "Keg 40l", cantitate: 0 },
        keg50: { id: 9, denumire: "Keg 50l", cantitate: 0 },
        etichete: { id: 10, denumire: "Etichete", cantitate: 0 },
        capace: { id: 11, denumire: "Capace", cantitate: 0 },
      });
      setSelectedFermentator(null);
      setError("Fermentator descărcat și lot creat cu succes!");
    } catch (error) {
      setError("Eroare la descărcarea fermentatorului: " + error.message);
    }
  };

  const selectFermentator = (fermentator) => {
    setSelectedFermentator(fermentator);
    setError("");
  };

  useEffect(() => {
    loadFermentatoare();
    loadLoturi();
    loadMaterialeAmbalare();
  }, [loadFermentatoare, loadLoturi, loadMaterialeAmbalare]);

  return (
    <>
      <NavBar />
      <div className={styles.container}>
        {error && (
          <div className={styles.modal}>
            <p>{error}</p>
            <button onClick={() => setError("")}>Închide</button>
          </div>
        )}
        
        <h1>Ambalare</h1>

        <div className={styles.fermentatorStatus}>
          <h2>Fermentatoare Ocupate</h2>
          <div className={styles.fermentatoreGrid}>
            {fermentatoare.filter(f => f.ocupat).map((fermentator) => (
              <div
                key={fermentator.id}
                className={`${styles.fermentatorCard} ${styles.ocupat} ${selectedFermentator?.id === fermentator.id ? styles.selected : ''}`}
                onClick={() => selectFermentator(fermentator)}
                style={{ 
                  backgroundImage: fermentator.imagine ? `url(${fermentator.imagine})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className={styles.fermentatorCardOverlay}>
                  <h3>{fermentator.nume}</h3>
                  <p>Capacitate: {fermentator.capacitate}L</p>
                  <p><strong>Rețeta:</strong> {fermentator.reteta}</p>
                  <p><strong>Cantitate:</strong> {fermentator.cantitate}L</p>
                  <p><strong>Data început:</strong> {new Date(fermentator.dataInceput).toLocaleDateString('ro-RO')}</p>
                </div>
              </div>
            ))}
            {fermentatoare.filter(f => f.ocupat).length === 0 && (
              <p>Nu există fermentatoare ocupate.</p>
            )}
          </div>
        </div>

        {selectedFermentator && (
          <div className={styles.packagingSection}>
            <h2>Opțiuni de Ambalare pentru {selectedFermentator.nume}</h2>
            <div className={styles.packagingForm}>
              <h3>Cantitate disponibilă: {selectedFermentator.cantitate}L</h3>
              {Object.keys(packagingOptions).map(key => (
                <div key={key} className={styles.packagingOption}>
                  <label>{packagingOptions[key].denumire}</label>
                  <input
                    type="number"
                    min="0"
                    value={packagingOptions[key].cantitate}
                    onChange={(e) => setPackagingOptions(prev => ({
                      ...prev,
                      [key]: { ...prev[key], cantitate: parseInt(e.target.value) || 0 }
                    }))}
                    className={styles.input}
                  />
                  <p className={styles.info}>
                    Stoc disponibil: {materialeAmbalare.find(m => m.id === packagingOptions[key].id)?.cantitate || 0} buc
                  </p>
                </div>
              ))}
              <button
                onClick={() => descarcaFermentator(selectedFermentator)}
                className={styles.buttonConfirm}
                disabled={Object.values(packagingOptions).every(opt => opt.cantitate === 0)}
              >
                Confirmă Ambalarea
              </button>
            </div>
          </div>
        )}

        <div className={styles.loturiSection}>
          <h2>Loturi Ambalate</h2>
          <div className={styles.loturiGrid}>
            {loturi.map((lot) => (
              <div key={lot.id} className={styles.lotCard}>
                <h3>Lot {lot.id}</h3>
                <p><strong>Rețeta:</strong> {lot.reteta}</p>
                <p><strong>Cantitate:</strong> {lot.cantitate} {lot.unitate}</p>
                <p><strong>Data ambalare:</strong> {new Date(lot.dataAmbalare).toLocaleDateString('ro-RO')}</p>
                {lot.ambalare && lot.ambalare.length > 0 && (
                  <>
                    <h4>Ambalare:</h4>
                    <ul>
                      {lot.ambalare.map((item, index) => (
                        <li key={index}>{item.denumire}: {item.cantitate} buc</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ))}
            {loturi.length === 0 && (
              <p>Nu există loturi ambalate.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Ambalare;