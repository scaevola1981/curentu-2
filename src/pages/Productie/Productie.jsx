import React, { useState, useCallback, useEffect, useRef } from "react";
import NavBar from "../../Componente/NavBar/NavBar";
import Modal from "../../Componente/Modal";
import styles from "./Productie.module.css";

const retetaImages = {
  "Adaptor la situatie - CB 01": "/Imagini/adaptor.png",
  "Adaptor la situatie": "/Imagini/adaptor.png",

  "Intrerupator de munca - CB 02": "/Imagini/intrerupator.png",
  "Intrerupator de munca": "/Imagini/intrerupator.png",

  "USB Amper Ale - CB 03": "/Imagini/usb-amper-ale.png",
  "USB Amper Ale": "/Imagini/usb-amper-ale.png",
};

const API_URL = "http://127.0.0.1:3001/api";

const SERVER_URL = "http://127.0.0.1:3001";

const Productie = () => {
  const [retete, setRetete] = useState([]);
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

  const step1Ref = useRef(null);
  const step2Ref = useRef(null);
  const step3Ref = useRef(null);
  const step4Ref = useRef(null);
  const step5Ref = useRef(null);

  // --- Load Data ---
  const loadRetete = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/retete-bere`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRetete(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Eroare la încărcarea rețetelor: " + err.message);
    }
  }, []);

  const loadFermentatoare = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/fermentatoare`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFermentatoare(data);
    } catch (err) {
      setError("Eroare la încărcarea fermentatoarelor: " + err.message);
    }
  }, []);

  // --- Handlers ---
  const selectReteta = (r) => {
    setSelectedReteta(r);
    setSelectedFermentator(null);
    setCantitateProdusa("");
    setStocVerificat(false);
    resetVerificare();
    setError("");
    setSuccess("");
  };

  const selectFermentator = (f) => {
    if (f.ocupat) return setError("Fermentatorul este deja ocupat!");
    setSelectedFermentator(f);
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

  // --- Backend Logic ---
  const verificaStoc = useCallback(async () => {
    if (!selectedReteta || !selectedFermentator || !cantitateProdusa) {
      setError("Completați toți pașii înainte de verificare!");
      return;
    }

    const cant = parseInt(cantitateProdusa);
    if (cant <= 0) return setError("Cantitate invalidă!");
    if (cant > selectedFermentator.capacitate)
      return setError(
        `Cantitatea depășește capacitatea fermentatorului (${selectedFermentator.capacitate}L)!`
      );

    try {
      const res = await fetch(`${API_URL}/productie/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          retetaId: selectedReteta.id,
          cantitate: cant,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Eroare server");
      }

      const { canProduce, missing, details } = await res.json();

      const consum = details.map((d) => ({
        denumire: d.nume,
        cantitate: d.necesarOriginal,
        unitate: d.unitateNecesar,
        disponibil: d.disponibilOriginal,
        unitateStoc: d.unitateStoc
      }));

      const insuf = missing.map((m) => ({
        denumire: m.nume,
        cantitateNecesara: m.necesar,
        cantitateDisponibila: m.disponibil,
        unitate: m.unitate,
      }));

      setConsumMateriale(consum);
      setMaterialeInsuficiente(insuf);
      setCanProduce(canProduce);
      setStocVerificat(true);

      if (!canProduce) {
        setError(`Materiale insuficiente: ${missing.length} ingrediente`);
      } else {
        setError("");
      }
    } catch (err) {
      setError("Eroare la verificarea stocului: " + err.message);
    }
  }, [selectedReteta, selectedFermentator, cantitateProdusa]);

  const confirmaProductia = useCallback(async () => {
    if (!canProduce)
      return setError("Nu se poate produce: ingrediente insuficiente.");

    try {
      const res = await fetch(`${API_URL}/productie/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          retetaId: selectedReteta.id,
          fermentatorId: selectedFermentator.id,
          cantitate: parseInt(cantitateProdusa),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Eroare la confirmare");
      }

      setSuccess("Producție confirmată și transferată în fermentator!");
      setError("");
      resetTot();
      await loadFermentatoare();
    } catch (err) {
      setError("Eroare la confirmarea producției: " + err.message);
    }
  }, [
    canProduce,
    selectedFermentator,
    selectedReteta,
    cantitateProdusa,
    loadFermentatoare,
  ]);

  // --- Effects ---
  useEffect(() => {
    const scrollTo = (ref) =>
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (selectedReteta && !selectedFermentator) scrollTo(step2Ref);
    else if (selectedFermentator && !cantitateProdusa) scrollTo(step3Ref);
    else if (cantitateProdusa && !stocVerificat) scrollTo(step4Ref);
    else if (stocVerificat && canProduce) scrollTo(step5Ref);
  }, [
    selectedReteta,
    selectedFermentator,
    cantitateProdusa,
    stocVerificat,
    canProduce,
  ]);

  useEffect(() => {
    loadRetete();
    loadFermentatoare();
  }, [loadRetete, loadFermentatoare]);

  // FIX: Helper for images
  const getImgUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${SERVER_URL}${path}`;
  };

  return (
    <>
      <NavBar />
      <div className={styles.container}>
        {/* ... (Error/Success modals) */}

        {error && (
          <Modal title="Eroare" message={error} type="error" onClose={() => setError("")} />
        )}
        {success && (
          <Modal title="Succes" message={success} type="success" onClose={() => setSuccess("")} />
        )}

        <h1>Planificare Producție</h1>

        {/* Starea fermentatoarelor */}
        <div className={styles.fermentatorStatus}>
          <h2>Starea Fermentatoarelor</h2>
          <div className={styles.fermentatoareGrid}>
            {fermentatoare.map((f) => (
              <div
                key={f.id}
                className={`${f.ocupat ? styles.ocupat : styles.liber} ${styles.fermentatorCard}`}
                style={{
                  // FIX: Use Server URL
                  backgroundImage: `url(${getImgUrl(f.imagine)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* ... content ... */}
                <div className={styles.fermentatorCardOverlay}>
                  <h3>{f.nume}</h3>
                  <p>Capacitate: {f.capacitate}L</p>
                  {f.ocupat ? (
                    <>
                      <p><strong>Rețetă:</strong> {f.reteta}</p>
                      <p><strong>Cantitate:</strong> {f.cantitate}L</p>
                      <p><strong>Data:</strong> {new Date(f.dataInceput).toLocaleDateString()}</p>
                    </>
                  ) : (
                    <p className={styles.statusLiber}>Disponibil</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pas 1: Select rețetă */}
        <div className={styles.stepSection} ref={step1Ref}>
          <h2>Pas 1: Selectați Rețeta</h2>
          <div className={styles.reteteContainer}>
            {retete.length === 0 ? (
              <p>Nu s-au încărcat rețetele.</p>
            ) : (
              retete.map((r) => (
                <div
                  key={r.id}
                  className={`${selectedReteta?.id === r.id ? styles.selected : ""} ${styles.retetaCard}`}
                  onClick={() => selectReteta(r)}
                  style={{
                    // FIX: Use Server URL for recipes too
                    backgroundImage: `url(${getImgUrl(retetaImages[r.denumire] || "/Imagini/adaptor.png")})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className={styles.retetaCardOverlay}>
                    <h3>{r.denumire}</h3>
                    <p>Tip: {r.tip}</p>
                    <p>Durată: {r.durata} zile</p>
                    <p>Rezultat: {r.rezultat.cantitate} {r.rezultat.unitate}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pas 2 */}
        {selectedReteta && (
          <div className={styles.stepSection} ref={step2Ref}>
            <h2>Pas 2: Selectați Fermentatorul</h2>
            <div className={styles.fermentatoareGrid}>
              {fermentatoare
                .filter((f) => !f.ocupat)
                .map((f) => (
                  <div
                    key={f.id}
                    className={`${selectedFermentator?.id === f.id ? styles.selectedFermentator : ""} ${styles.fermentatorSelectCard}`}
                    onClick={() => selectFermentator(f)}
                    style={{
                      // FIX: Use Server URL
                      backgroundImage: `url(${getImgUrl(f.imagine)})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <div className={styles.fermentatorSelectOverlay}>
                      <h5>{f.nume}</h5>
                      <p>Capacitate: {f.capacitate}L</p>
                      <p className={styles.disponibil}>Disponibil</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Pas 3 */}
        {selectedFermentator && (
          <div className={styles.stepSection} ref={step3Ref}>
            <h2>Pas 3: Introduceți Cantitatea</h2>
            <input
              type="number"
              value={cantitateProdusa}
              onChange={handleCantitateChange}
              placeholder={`Max: ${selectedFermentator.capacitate}L`}
              className={styles.input}
            />
          </div>
        )}

        {/* Pas 4 */}
        {cantitateProdusa && (
          <div className={styles.stepSection} ref={step4Ref}>
            <h2>Pas 4: Verificați Stocul</h2>
            <button
              type="button"
              onClick={verificaStoc}
              className={styles.button}
            >
              Verifică Stocul
            </button>

            {stocVerificat && (
              <div className={styles.verificareResultat}>
                <h3>Materiale Necesare:</h3>
                <ul className={styles.materialeList}>
                  {consumMateriale.map((i, idx) => {
                    // Verificăm dacă e în lista de insuficiente
                    const esteInsuficient = materialeInsuficiente.find(
                      (m) => m.denumire === i.denumire
                    );

                    return (
                      <li
                        key={idx}
                        className={
                          esteInsuficient
                            ? styles.ingredientInsuficient
                            : styles.ingredientOk
                        }
                      >
                        <div className={styles.ingredientInfo}>
                          <span className={styles.ingredientNume}>
                            {esteInsuficient ? "❌" : "✅"} {i.denumire}
                          </span>
                          <div className={styles.ingredientDetalii}>
                            <span className={styles.necesar}>
                              Necesar:{" "}
                              <strong>
                                {i.cantitate} {i.unitate}
                              </strong>
                            </span>
                            <span className={styles.disponibil}>
                              Disponibil:{" "}
                              <strong>
                                {i.disponibil} {i.unitateStoc || i.unitate}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {materialeInsuficiente.length > 0 && (
                  <div className={styles.warningBox}>
                    <h4>⚠️ Materiale Insuficiente:</h4>
                    <ul>
                      {materialeInsuficiente.map((m, idx) => (
                        <li key={idx}>
                          <strong>{m.denumire}:</strong> Lipsesc{" "}
                          {(
                            m.cantitateNecesara - m.cantitateDisponibila
                          ).toFixed(2)}{" "}
                          {m.unitate}
                        </li>
                      ))}
                    </ul>
                    <p className={styles.warningMessage}>
                      Nu puteți continua cu producția până când nu aveți toate
                      materialele necesare.
                    </p>
                  </div>
                )}

                {canProduce && (
                  <div className={styles.successBox}>
                    <p>
                      ✅ Toate materialele sunt disponibile! Puteți continua cu
                      producția.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Pas 5 - Confirmare Producție */}
        {stocVerificat && canProduce && (
          <div className={styles.stepSection} ref={step5Ref}>
            <h2>Pas 5: Confirmare Producție</h2>
            <div className={styles.confirmareSection}>
              <div className={styles.sumarProductie}>
                <h3>Sumar Producție:</h3>
                <div className={styles.sumarDetalii}>
                  <p>
                    <strong>Rețetă:</strong> {selectedReteta.denumire}
                  </p>
                  <p>
                    <strong>Fermentator:</strong> {selectedFermentator.nume}
                  </p>
                  <p>
                    <strong>Cantitate:</strong> {cantitateProdusa}L
                  </p>
                  <p>
                    <strong>Durată estimată:</strong> {selectedReteta.durata}{" "}
                    zile
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  confirmaProductia().then(() => {
                    window.location.href = "/ambalare"; // 🔥 trecere la pasul următor
                  });
                }}
                className={styles.buttonConfirm}
              >
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
