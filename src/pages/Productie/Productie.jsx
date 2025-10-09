import React, { useState, useCallback, useEffect, useRef } from 'react';
import NavBar from '../../Componente/NavBar/NavBar';
import styles from './Productie.module.css';

const API_URL = "http://localhost:3001/api";

const Productie = () => {
  const [retete, setRetete] = useState([]);
  const [stocMateriale, setStocMateriale] = useState([]);
  const [fermentatoare, setFermentatoare] = useState([]);
  const [selectedReteta, setSelectedReteta] = useState(null);
  const [selectedFermentator, setSelectedFermentator] = useState(null);
  const [cantitateProdusa, setCantitateProdusa] = useState("");
  const [stocVerificat, setStocVerificat] = useState(false);
  const [consumMateriale, setConsumMateriale] = useState([]);
  const [materialeInsuficiente, setMaterialeInsuficiente] = useState([]);
  const [canProduce, setCanProduce] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Refs pentru fiecare secțiune
  const step1Ref = useRef(null);
  const step2Ref = useRef(null);
  const step3Ref = useRef(null);
  const step4Ref = useRef(null);
  const step5Ref = useRef(null);

  const loadRetete = useCallback(async () => {
    try {
      console.log("Fetching recipes from:", `${API_URL}/retete-bere`);
      const res = await fetch(`${API_URL}/retete-bere`);
      console.log("Response status:", res.status);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      console.log("Fetched recipes data:", data);
      if (Array.isArray(data)) {
        setRetete(data);
      } else {
        console.warn("Unexpected data format, expected array:", data);
        setRetete([]);
        setError("Datele rețetelor nu sunt în formatul așteptat.");
      }
    } catch (error) {
      console.error("Eroare la încărcarea rețetelor:", error.message, error.stack);
      setError("Eroare la încărcarea rețetelor: " + error.message);
      setRetete([]);
    }
  }, []);

  const loadMateriale = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/materii-prime`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setStocMateriale(data.map(m => ({ ...m, cantitate: Number(m.cantitate) })));
    } catch (error) {
      setError("Eroare la încărcarea materialelor: " + error.message);
    }
  }, []);

  const loadFermentatoare = useCallback(async () => {
    try {
      console.log('Fetching fermentatoare from:', `${API_URL}/fermentatoare`);
      const res = await fetch(`${API_URL}/fermentatoare`);
      console.log('Response status:', res.status);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      console.log('Fermentatoare fetched:', data);
      setFermentatoare(data);
    } catch (error) {
      console.error('Eroare la încărcarea fermentatoarelor:', error.message, error.stack);
      setError("Eroare la încărcarea fermentatoarelor: " + error.message);
    }
  }, []);

  const selectReteta = (reteta) => {
    setSelectedReteta(reteta);
    setSelectedFermentator(null);
    setCantitateProdusa("");
    setStocVerificat(false);
    resetVerificare();
    setError("");
    setSuccess("");
  };

  const selectFermentator = (fermentator) => {
    if (fermentator.ocupat) {
      setError("Fermentatorul este deja ocupat!");
      return;
    }
    setSelectedFermentator(fermentator);
    setCantitateProdusa("");
    setStocVerificat(false);
    resetVerificare();
    setError("");
    setSuccess("");
  };

  const handleCantitateChange = (e) => {
    setCantitateProdusa(e.target.value);
    setStocVerificat(false);
    resetVerificare();
    setError("");
    setSuccess("");
  };

  const verificaStoc = useCallback(() => {
    if (!selectedReteta || !selectedFermentator || !cantitateProdusa || parseInt(cantitateProdusa) <= 0) {
      setError("Completați toți pașii: rețeta, fermentatorul și cantitatea.");
      return;
    }

    if (parseInt(cantitateProdusa) > selectedFermentator.capacitate) {
      setError(`Cantitatea depășește capacitatea fermentatorului (${selectedFermentator.capacitate}L)!`);
      return;
    }

    const factorScalare = parseInt(cantitateProdusa) / selectedReteta.rezultat.cantitate;
    const materialeConsumate = selectedReteta.ingrediente.map(ing => {
      let cantitate = Number((ing.cantitate * factorScalare).toFixed(2));
      let unitate = ing.unitate;
      if (ing.tip === "drojdie" && ing.unitate === "kg") {
        cantitate = Number((cantitate * 1000).toFixed(2));
        unitate = "g";
      }
      return { denumire: ing.denumire, cantitate, unitate, tip: ing.tip };
    });

    const insuficiente = materialeConsumate
      .map(ing => {
        const stoc = stocMateriale.find(m => m.denumire === ing.denumire && m.unitate === ing.unitate);
        if (!stoc || stoc.cantitate < ing.cantitate) {
          return {
            denumire: ing.denumire,
            cantitateNecesara: ing.cantitate,
            cantitateDisponibila: stoc ? stoc.cantitate : 0,
            unitate: ing.unitate,
          };
        }
        return null;
      })
      .filter(Boolean);

    setConsumMateriale(materialeConsumate);
    setMaterialeInsuficiente(insuficiente);
    setCanProduce(insuficiente.length === 0);
    setStocVerificat(true);
  }, [selectedReteta, selectedFermentator, cantitateProdusa, stocMateriale]);

  const confirmaProductia = useCallback(async () => {
    if (!canProduce) {
      setError("Nu se poate produce: ingrediente insuficiente.");
      return;
    }

    try {
      for (const ing of consumMateriale) {
        const stoc = stocMateriale.find(m => m.denumire === ing.denumire && m.unitate === ing.unitate);
        if (stoc) {
          const response = await fetch(`${API_URL}/materii-prime/${stoc.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...stoc, cantitate: Number((stoc.cantitate - ing.cantitate).toFixed(2)) }),
          });
          if (!response.ok) throw new Error(`Failed to update material ${stoc.denumire}`);
        }
      }

      const updatedFermentator = {
        ...selectedFermentator,
        ocupat: true,
        reteta: selectedReteta.denumire,
        cantitate: parseInt(cantitateProdusa),
        dataInceput: new Date().toISOString()
      };

      const response = await fetch(`${API_URL}/fermentatoare/${selectedFermentator.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFermentator),
      });

      if (!response.ok) throw new Error(`Failed to update fermentator ${selectedFermentator.nume}`);

      setStocMateriale(prev =>
        prev.map(m => {
          const consum = consumMateriale.find(c => c.denumire === m.denumire && c.unitate === m.unitate);
          return consum ? { ...m, cantitate: Number((m.cantitate - consum.cantitate).toFixed(2)) } : m;
        })
      );

      setFermentatoare(prev =>
        prev.map(f =>
          f.id === selectedFermentator.id ? updatedFermentator : f
        )
      );

      setSuccess("Producție confirmată și transferată în fermentator!");
      setError("");
      resetTot();
    } catch (error) {
      setError("Eroare la confirmarea producției: " + error.message);
      setSuccess("");
    }
  }, [canProduce, consumMateriale, stocMateriale, selectedFermentator, selectedReteta, cantitateProdusa]);

  const resetVerificare = () => {
    setConsumMateriale([]);
    setMaterialeInsuficiente([]);
    setCanProduce(false);
  };

  const resetTot = () => {
    setSelectedReteta(null);
    setSelectedFermentator(null);
    setCantitateProdusa("");
    setStocVerificat(false);
    resetVerificare();
  };

  // Efect pentru a face scroll automat la secțiunea următoare
  useEffect(() => {
    if (selectedReteta && !selectedFermentator) {
      setTimeout(() => {
        step2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else if (selectedReteta && selectedFermentator && !cantitateProdusa) {
      setTimeout(() => {
        step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else if (selectedReteta && selectedFermentator && cantitateProdusa && !stocVerificat) {
      setTimeout(() => {
        step4Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else if (stocVerificat && canProduce) {
      setTimeout(() => {
        step5Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedReteta, selectedFermentator, cantitateProdusa, stocVerificat, canProduce]);

  useEffect(() => {
    console.log("useEffect triggered, calling load functions");
    loadRetete();
    loadMateriale();
    loadFermentatoare();
  }, [loadRetete, loadMateriale, loadFermentatoare]);

  return (
    <>
      <NavBar />
      <div className={styles.container}>
        {error && (
          <div className={styles.alertError}>
            <p>{error}</p>
            <button onClick={() => setError("")} className={styles.alertClose}>✕</button>
          </div>
        )}
        
        {success && (
          <div className={styles.alertSuccess}>
            <p>{success}</p>
            <button onClick={() => setSuccess("")} className={styles.alertClose}>✕</button>
          </div>
        )}
        
        <h1>Planificare Producție</h1>
        
        <div className={styles.fermentatorStatus}>
          <h2>Starea Fermentatoarelor</h2>
          <div className={styles.fermentatoareGrid}>
            {fermentatoare.map((fermentator) => (
              <div
                key={fermentator.id}
                className={`${styles.fermentatorCard} ${fermentator.ocupat ? styles.ocupat : styles.liber}`}
                style={{ 
                  backgroundImage: `url(${fermentator.imagine})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className={styles.fermentatorCardOverlay}>
                  <h3>{fermentator.nume}</h3>
                  <p>Capacitate: {fermentator.capacitate}L</p>
                  {fermentator.ocupat ? (
                    <>
                      <p><strong>Rețeta:</strong> {fermentator.reteta}</p>
                      <p><strong>Cantitate:</strong> {fermentator.cantitate}L</p>
                      <p><strong>Data început:</strong> {new Date(fermentator.dataInceput).toLocaleDateString('ro-RO')}</p>
                    </>
                  ) : (
                    <p className={styles.statusLiber}>Disponibil</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.stepSection} ref={step1Ref}>
          <h2>Pas 1: Selectați Rețeta</h2>
          <div className={styles.reteteContainer}>
            {retete.length > 0 ? (
              retete.map((reteta) => (
                <div
                  key={reteta.id}
                  className={`${styles.retetaCard} ${selectedReteta?.id === reteta.id ? styles.selected : ""}`}
                  onClick={() => selectReteta(reteta)}
                  style={{ 
                    backgroundImage: reteta.image ? `url(${reteta.image})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className={styles.retetaCardOverlay}>
                    <h3>{reteta.denumire}</h3>
                    <p>Tip: {reteta.tip}</p>
                    <p>Concentrație must: {reteta.concentratieMust}</p>
                    <p>Concentrație alcool: {reteta.concentratieAlcool}</p>
                    <p>Durată: {reteta.durata} zile</p>
                    <p>Producție standard: {reteta.rezultat.cantitate} {reteta.rezultat.unitate}</p>
                  </div>
                </div>
              ))
            ) : (
              <p>Nu s-au încărcat rețetele. Verificați consola pentru erori.</p>
            )}
          </div>
        </div>

        {selectedReteta && (
          <div className={styles.stepSection} ref={step2Ref}>
            <h2>Pas 2: Selectați Fermentatorul</h2>
            <div className={styles.fermentatoareGrid}>
              {fermentatoare
                .filter(f => !f.ocupat)
                .map((fermentator) => (
                  <div
                    key={fermentator.id}
                    className={`${styles.fermentatorSelectCard} ${
                      selectedFermentator?.id === fermentator.id ? styles.selectedFermentator : ""
                    }`}
                    onClick={() => selectFermentator(fermentator)}
                    style={{ 
                      backgroundImage: `url(${fermentator.imagine})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className={styles.fermentatorSelectOverlay}>
                      <h5>{fermentator.nume}</h5>
                      <p>Capacitate: {fermentator.capacitate}L</p>
                      <p className={styles.disponibil}>Disponibil</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {selectedReteta && selectedFermentator && (
          <div className={styles.stepSection} ref={step3Ref}>
            <h2>Pas 3: Introduceți Cantitatea</h2>
            <div className={styles.cantitateForm}>
              <label>Cantitate dorită (litri):</label>
              <input
                type="number"
                value={cantitateProdusa}
                onChange={handleCantitateChange}
                className={styles.input}
                placeholder={`Max: ${selectedFermentator.capacitate}L`}
                max={selectedFermentator.capacitate}
              />
              <p className={styles.info}>
                Capacitate fermentator: {selectedFermentator.capacitate}L
              </p>
            </div>
          </div>
        )}

        {selectedReteta && selectedFermentator && cantitateProdusa && (
          <div className={styles.stepSection} ref={step4Ref}>
            <h2>Pas 4: Verificați Stocul</h2>
            <button onClick={verificaStoc} className={styles.button}>
              Verifică Disponibilitatea Ingredientelor
            </button>
            
            {stocVerificat && (
              <div className={styles.rezultatVerificare}>
                <h4>Ingrediente necesare:</h4>
                <ul>
                  {consumMateriale.map((ing, index) => (
                    <li key={index} className={
                      materialeInsuficiente.find(m => m.denumire === ing.denumire) 
                        ? styles.ingredientInsuficient 
                        : styles.ingredientOk
                    }>
                      {ing.denumire}: {ing.cantitate} {ing.unitate}
                      {materialeInsuficiente.find(m => m.denumire === ing.denumire) && 
                        ` (Disponibil: ${materialeInsuficiente.find(m => m.denumire === ing.denumire).cantitateDisponibila} ${ing.unitate})`
                      }
                    </li>
                  ))}
                </ul>

                {materialeInsuficiente.length > 0 ? (
                  <div className={styles.error}>
                    <p>⚠️ Ingrediente insuficiente!</p>
                    <p>Completați stocul pentru a continua producția.</p>
                  </div>
                ) : (
                  <div className={styles.success}>
                    <p>✅ Toate ingredientele sunt disponibile!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {stocVerificat && canProduce && (
          <div className={styles.stepSection} ref={step5Ref}>
            <h2>Pas 5: Confirmați Producția</h2>
            <div className={styles.sumarProduction}>
              <p><strong>Rețeta:</strong> {selectedReteta.denumire}</p>
              <p><strong>Fermentator:</strong> {selectedFermentator.nume}</p>
              <p><strong>Cantitate:</strong> {cantitateProdusa}L</p>
              <button onClick={confirmaProductia} className={styles.buttonConfirm}>
                🚀 Pornește Producția
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Productie;