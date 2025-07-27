import React, { useState, useCallback, useEffect } from 'react';
import NavBar from '../../Componente/NavBar/NavBar';
import styles from './productie.module.css';

const API_URL = "http://localhost:3001/api";

// Date pentru fermentatoare - cu aceeași imagine pentru toate
const FERMENTATOARE = [
  { id: 1, nume: "Fermentator 1", capacitate: 1000, ocupat: false, reteta: null, cantitate: 0, dataInceput: null, imagine: "/Imagini/fermentator.png" },
  { id: 2, nume: "Fermentator 2", capacitate: 1000, ocupat: false, reteta: null, cantitate: 0, dataInceput: null, imagine: "/Imagini/fermentator.png" },
  { id: 3, nume: "Fermentator 3", capacitate: 1000, ocupat: false, reteta: null, cantitate: 0, dataInceput: null, imagine: "/Imagini/fermentator.png" },
  { id: 4, nume: "Fermentator 4", capacitate: 1000, ocupat: false, reteta: null, cantitate: 0, dataInceput: null, imagine: "/Imagini/fermentator.png" },
  { id: 5, nume: "Fermentator 5", capacitate: 2000, ocupat: false, reteta: null, cantitate: 0, dataInceput: null, imagine: "/Imagini/fermentator.png" },
  { id: 6, nume: "Fermentator 6", capacitate: 2000, ocupat: false, reteta: null, cantitate: 0, dataInceput: null, imagine: "/Imagini/fermentator.png" }
];

const Productie = () => {
  const [retete, setRetete] = useState([]);
  const [stocMateriale, setStocMateriale] = useState([]);
  const [fermentatoare, setFermentatoare] = useState(FERMENTATOARE);
  
  // Starea pasilor
  const [selectedReteta, setSelectedReteta] = useState(null);
  const [selectedFermentator, setSelectedFermentator] = useState(null);
  const [cantitateProdusa, setCantitateProdusa] = useState("");
  const [stocVerificat, setStocVerificat] = useState(false);
  
  // Rezultatele verificarii
  const [consumMateriale, setConsumMateriale] = useState([]);
  const [materialeInsuficiente, setMaterialeInsuficiente] = useState([]);
  const [canProduce, setCanProduce] = useState(false);
  const [error, setError] = useState("");

  const loadRetete = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/reteteBere`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setRetete(data);
    } catch (error) {
      setError("Eroare la încărcarea rețetelor: " + error.message);
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

  // Pas 1: Selectarea retetei
  const selectReteta = (reteta) => {
    setSelectedReteta(reteta);
    // Reset pas urmatori
    setSelectedFermentator(null);
    setCantitateProdusa("");
    setStocVerificat(false);
    resetVerificare();
  };

  // Pas 2: Selectarea fermentatorului
  const selectFermentator = (fermentator) => {
    if (fermentator.ocupat) {
      setError("Fermentatorul este deja ocupat!");
      return;
    }
    setSelectedFermentator(fermentator);
    // Reset pas urmatori
    setCantitateProdusa("");
    setStocVerificat(false);
    resetVerificare();
  };

  // Pas 3: Setarea cantitatii (se face prin input)
  const handleCantitateChange = (e) => {
    setCantitateProdusa(e.target.value);
    setStocVerificat(false);
    resetVerificare();
  };

  // Pas 4: Verificarea stocului
  const verificaStoc = useCallback(() => {
    if (!selectedReteta || !selectedFermentator || !cantitateProdusa || parseInt(cantitateProdusa) <= 0) {
      setError("Completați toți pașii: rețeta, fermentatorul și cantitatea.");
      return;
    }

    // Verifică capacitatea fermentatorului
    if (parseInt(cantitateProdusa) > selectedFermentator.capacitate) {
      setError(`Cantitatea depășește capacitatea fermentatorului (${selectedFermentator.capacitate}L)!`);
      return;
    }

    const factorScalare = parseInt(cantitateProdusa) / selectedReteta.rezultat.cantitate;
    const materialeConsumate = selectedReteta.ingrediente.map(ing => ({
      denumire: ing.denumire,
      cantitate: Number((ing.cantitate * factorScalare).toFixed(2)),
      unitate: ing.unitate,
      tip: ing.tip,
    }));

    const insuficiente = materialeConsumate
      .map(ing => {
        const stoc = stocMateriale.find(m => m.denumire === ing.denumire);
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

  // Pas 5: Confirmarea productiei
  const confirmaProductia = useCallback(async () => {
    if (!canProduce) {
      setError("Nu se poate produce: ingrediente insuficiente.");
      return;
    }

    try {
      // Actualizează stocul de materiale
      for (const ing of consumMateriale) {
        const stoc = stocMateriale.find(m => m.denumire === ing.denumire);
        if (stoc) {
          await fetch(`${API_URL}/materii-prime/${stoc.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...stoc, cantitate: stoc.cantitate - ing.cantitate }),
          });
        }
      }

      // Actualizează fermentatorul
      setFermentatoare(prev => 
        prev.map(f => 
          f.id === selectedFermentator.id 
            ? {
                ...f,
                ocupat: true,
                reteta: selectedReteta.denumire,
                cantitate: parseInt(cantitateProdusa),
                dataInceput: new Date().toLocaleDateString('ro-RO')
              }
            : f
        )
      );

      // Actualizează stocul local
      setStocMateriale(prev =>
        prev.map(m => {
          const consum = consumMateriale.find(c => c.denumire === m.denumire);
          return consum ? { ...m, cantitate: m.cantitate - consum.cantitate } : m;
        })
      );

      setError("Producție confirmată și transferată în fermentator!");
      
      // Reset complet
      resetTot();
      
    } catch (error) {
      setError("Eroare la confirmarea producției: " + error.message);
    }
  }, [canProduce, consumMateriale, stocMateriale, selectedFermentator, selectedReteta, cantitateProdusa]);

  const elibereazaFermentator = (fermentatorId) => {
    setFermentatoare(prev =>
      prev.map(f =>
        f.id === fermentatorId
          ? { ...f, ocupat: false, reteta: null, cantitate: 0, dataInceput: null }
          : f
      )
    );
  };

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

  useEffect(() => {
    loadRetete();
    loadMateriale();
  }, [loadRetete, loadMateriale]);

  return (
    <>
   <NavBar/>
    <div className={styles.container}>
      {error && (
        <div className={styles.modal}>
          <p>{error}</p>
          <button onClick={() => setError("")}>Închide</button>
        </div>
      )}
      
      <h1>Planificare Producție</h1>
      
      {/* Starea fermentatoarelor */}
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
                    <p><strong>Data început:</strong> {fermentator.dataInceput}</p>
                    <button
                      onClick={() => elibereazaFermentator(fermentator.id)}
                      className={styles.buttonElibereaza}
                    >
                      Eliberează
                    </button>
                  </>
                ) : (
                  <p className={styles.statusLiber}>Disponibil</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PAS 1: Selecția retetei */}
      <div className={styles.stepSection}>
        <h2>Pas 1: Selectați Rețeta</h2>
        <div className={styles.reteteContainer}>
          {retete.map((reteta) => (
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
          ))}
        </div>
      </div>

      {/* PAS 2: Selecția fermentatorului */}
      {selectedReteta && (
        <div className={styles.stepSection}>
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

      {/* PAS 3: Cantitatea */}
      {selectedReteta && selectedFermentator && (
        <div className={styles.stepSection}>
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

      {/* PAS 4: Verificarea stocului */}
      {selectedReteta && selectedFermentator && cantitateProdusa && (
        <div className={styles.stepSection}>
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

      {/* PAS 5: Confirmarea */}
      {stocVerificat && canProduce && (
        <div className={styles.stepSection}>
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