import React, { useState, useCallback, useEffect } from 'react';
    import styles from './productie.module.css';

    const API_URL = "http://localhost:3000/api";
    

    const Productie = () => {
      const [retete, setRetete] = useState([]);
      const [stocMateriale, setStocMateriale] = useState([]);
      const [selectedReteta, setSelectedReteta] = useState(null);
      const [cantitateProdusa, setCantitateProdusa] = useState("");
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

      const verificaStoc = useCallback(() => {
        if (!selectedReteta || !cantitateProdusa || parseInt(cantitateProdusa) <= 0) {
          setConsumMateriale([]);
          setMaterialeInsuficiente([]);
          setCanProduce(false);
          setError("Selectați o rețetă și introduceți o cantitate validă.");
          return;
        }
        if (selectedReteta.rezultat.cantitate <= 0) {
          setError("Cantitate standard invalidă (0 litri).");
          setCanProduce(false);
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
      }, [selectedReteta, cantitateProdusa, stocMateriale]);

      const confirmaProductia = useCallback(async () => {
        if (!canProduce) {
          setError("Nu se poate produce: ingrediente insuficiente.");
          return;
        }
        try {
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
          setError("Producție confirmată!");
          setStocMateriale(prev =>
            prev.map(m => {
              const consum = consumMateriale.find(c => c.denumire === m.denumire);
              return consum ? { ...m, cantitate: m.cantitate - consum.cantitate } : m;
            })
          );
          setCantitateProdusa("");
          setConsumMateriale([]);
          setMaterialeInsuficiente([]);
          setCanProduce(false);
        } catch (error) {
          setError("Eroare la confirmarea producției: " + error.message);
        }
      }, [canProduce, consumMateriale, stocMateriale]);

      useEffect(() => {
        loadRetete();
        loadMateriale();
      }, [loadRetete, loadMateriale]);

      return (
        <div className={styles.container}>
          {error && (
            <div className={styles.modal}>
              <p>{error}</p>
              <button onClick={() => setError("")}>Închide</button>
            </div>
          )}
          <h1>Planificare Producție</h1>
          <div className={styles.reteteContainer}>
            {retete.map((reteta) => (
              <div
                key={reteta.id}
                className={`${styles.retetaCard} ${selectedReteta?.id === reteta.id ? styles.selected : ""}`}
                onClick={() => {
                  setSelectedReteta(reteta);
                  setCantitateProdusa("");
                  setConsumMateriale([]);
                  setMaterialeInsuficiente([]);
                  setCanProduce(false);
                }}
                style={{ backgroundImage: `url(${reteta.image})`, backgroundSize: 'cover' }}
              >
                <h3>{reteta.denumire}</h3>
                <p>Tip: {reteta.tip}</p>
                <p>Concentrație must: {reteta.concentratieMust}</p>
                <p>Concentrație alcool: {reteta.concentratieAlcool}</p>
                <p>Durată: {reteta.durata} zile</p>
                <p>Producție: {reteta.rezultat.cantitate} {reteta.rezultat.unitate}</p>
              </div>
            ))}
          </div>
          {selectedReteta && (
            <div className={styles.productionForm}>
              <h2>{selectedReteta.denumire}</h2>
              <label>Cantitate (litri):</label>
              <input
                type="number"
                value={cantitateProdusa}
                onChange={(e) => setCantitateProdusa(e.target.value)}
                className={styles.input}
                placeholder="Introduceți cantitatea"
              />
              <button onClick={verificaStoc} className={styles.button}>
                Verifică Stoc
              </button>
              {consumMateriale.length > 0 && (
                <div>
                  <h4>Ingrediente necesare:</h4>
                  <ul>
                    {consumMateriale.map((ing, index) => (
                      <li key={index}>
                        {ing.denumire}: {ing.cantitate} {ing.unitate}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {canProduce && (
                <div>
                  <p className={styles.success}>Toate ingredientele sunt disponibile. Poți produce!</p>
                  <button onClick={confirmaProductia} className={styles.button}>
                    Confirmă Producția
                  </button>
                </div>
              )}
              {materialeInsuficiente.length > 0 && (
                <div>
                  <p className={styles.error}>Ingrediente insuficiente:</p>
                  <ul>
                    {materialeInsuficiente.map((ing, index) => (
                      <li key={index}>
                        {ing.denumire}: Necesari {ing.cantitateNecesara} {ing.unitate}, Disponibili {ing.cantitateDisponibila} {ing.unitate}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      );
    };

    export default Productie;