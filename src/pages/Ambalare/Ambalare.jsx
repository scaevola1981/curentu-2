import React, { useState, useEffect, useCallback } from "react";
import NavBar from "../../Componente/NavBar/NavBar";
import styles from "./Ambalare.module.css";
import Modal from "../../Componente/Modal";

const API_URL = "http://localhost:3001/api";
const SERVER_URL = "http://localhost:3001";

const Ambalare = () => {
  const [materiale, setMateriale] = useState([]);
  const [fermentatoare, setFermentatoare] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newMaterial, setNewMaterial] = useState({
    denumire: "",
    cantitate: "",
    unitate: "",
    producator: "",
    codProdus: "",
    lot: "",
    tip: "",
    subcategorie: "",
  });
  const [editId, setEditId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFermentator, setSelectedFermentator] = useState(null);
  const [packagingType, setPackagingType] = useState("");
  const [bottleSize, setBottleSize] = useState("");
  const [boxType, setBoxType] = useState("");
  const [kegSize, setKegSize] = useState("");
  const [ambalareInsuficiente, setAmbalareInsuficiente] = useState([]);
  const [supplementCantitati, setSupplementCantitati] = useState({});
  const [cantitateDeAmbalat, setCantitateDeAmbalat] = useState("");

  // Data loading functions
  const loadMateriale = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/materiale-ambalare`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setMateriale(data);
    } catch (error) {
      setError(`Eroare la încărcarea materialelor: ${error.message}`);
    }
  }, []);

  const loadFermentatoare = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/fermentatoare`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setFermentatoare(data.filter((f) => f.ocupat && f.cantitate > 0));
    } catch (error) {
      setError(`Eroare la încărcarea fermentatoarelor: ${error.message}`);
    }
  }, []);

  // Event handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMaterial((prev) => ({ ...prev, [name]: value }));
  };

  const handleSupplementChange = (id, value) => {
    setSupplementCantitati((prev) => ({
      ...prev,
      [id]: value ? Number(value) : "",
    }));
  };

  const handleSupplementMaterial = async (id) => {
    const cantitateSuplimentara = supplementCantitati[id];
    if (!cantitateSuplimentara || cantitateSuplimentara <= 0) {
      setError("Introduceți o cantitate validă pentru suplimentare!");
      return;
    }

    const material = materiale.find((m) => m.id === parseInt(id));
    if (!material) {
      setError("Materialul nu a fost găsit!");
      return;
    }

    try {
      const newCantitate = material.cantitate + cantitateSuplimentara;
      const res = await fetch(`${API_URL}/materiale-ambalare/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...material, cantitate: newCantitate }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `Eroare la actualizare: ${res.status} - ${errorText || "Resursa nu a fost găsită"
          }`
        );
      }

      const updatedMaterial = await res.json();
      setMateriale((prev) =>
        prev.map((m) =>
          m.id === parseInt(id) ? { ...m, ...updatedMaterial } : m
        )
      );
      setSupplementCantitati((prev) => ({ ...prev, [id]: "" }));
      setError("");
    } catch (error) {
      setError(`Eroare la suplimentarea materialului: ${error.message}`);
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (
      !newMaterial.denumire ||
      !newMaterial.cantitate ||
      !newMaterial.unitate ||
      !newMaterial.tip
    ) {
      setError(
        "Completați toate câmpurile obligatorii: denumire, cantitate, unitate, tip"
      );
      return;
    }

    try {
      const materialToSend = {
        ...newMaterial,
        cantitate: Number(newMaterial.cantitate),
      };

      const res = await fetch(
        `${API_URL}/materiale-ambalare/${isEditing ? editId : ""}`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(materialToSend),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `Eroare la ${isEditing ? "actualizare" : "adăugare"} material: ${res.status
          } - ${errorText || "Resursa nu a fost găsită"}`
        );
      }

      const updatedMaterial = await res.json();
      setMateriale((prev) =>
        isEditing
          ? prev.map((m) =>
            m.id === parseInt(editId) ? { ...m, ...updatedMaterial } : m
          )
          : [...prev, updatedMaterial]
      );

      setIsEditing(false);
      setEditId(null);
      setNewMaterial({
        denumire: "",
        cantitate: "",
        unitate: "",
        producator: "",
        codProdus: "",
        lot: "",
        tip: "",
        subcategorie: "",
      });
      setError("");
    } catch (error) {
      setError(`Eroare la salvarea materialului: ${error.message}`);
    }
  };

  const handleEdit = (material) => {
    setNewMaterial({
      denumire: material.denumire,
      cantitate: material.cantitate,
      unitate: material.unitate,
      producator: material.producator || "",
      codProdus: material.codProdus || "",
      lot: material.lot || "",
      tip: material.tip || "",
      subcategorie: material.subcategorie || "",
    });
    setEditId(material.id);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setNewMaterial({
      denumire: "",
      cantitate: "",
      unitate: "",
      producator: "",
      codProdus: "",
      lot: "",
      tip: "",
      subcategorie: "",
    });
    setIsEditing(false);
    setEditId(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Sigur doriți să ștergeți acest material?")) return;

    try {
      const res = await fetch(`${API_URL}/materiale-ambalare/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Eroare la ștergerea materialului");
      setMateriale((prev) => prev.filter((m) => m.id !== parseInt(id)));
    } catch (error) {
      setError(`Eroare la ștergerea materialului: ${error.message}`);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_URL}/materiale-ambalare/export`);
      if (!res.ok) throw new Error("Eroare la exportarea materialelor");
      const csv = await res.text();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "materiale-ambalare.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError(`Eroare la exportarea materialelor: ${error.message}`);
    }
  };

  const verificaStocAmbalare = (
    cantitateBere,
    packagingType,
    bottleSize,
    boxType,
    kegSize
  ) => {
    let ambalareNecesare = [];

    if (packagingType === "sticle") {
      const bottleCapacity = bottleSize === "0.33l" ? 0.33 : 0.5;
      const bottlesPerBox =
        boxType === "6 sticle" ? 6 : boxType === "12 sticle" ? 12 : 24;
      const numBottles = Math.ceil(cantitateBere / bottleCapacity);
      const numBoxes = Math.ceil(numBottles / bottlesPerBox);

      ambalareNecesare = [
        {
          denumire: `Sticle ${bottleSize}`,
          cantitate: numBottles,
          unitate: "buc",
          tip: "sticle",
        },
        {
          denumire: "Capace",
          cantitate: numBottles,
          unitate: "buc",
          tip: "capace",
        },
        {
          denumire: "Etichete",
          cantitate: numBottles,
          unitate: "buc",
          tip: "etichete",
        },
        {
          denumire: `Cutii ${boxType}`,
          cantitate: numBoxes,
          unitate: "buc",
          tip: "cutii",
        },
      ];
    } else if (packagingType === "keguri") {
      const kegSizes = [
        { denumire: "Keg 10l", capacitate: 10 },
        { denumire: "Keg 20l", capacitate: 20 },
        { denumire: "Keg 30l", capacitate: 30 },
        { denumire: "Keg 40l", capacitate: 40 },
        { denumire: "Keg 50l", capacitate: 50 },
      ];

      const selectedKeg =
        kegSizes.find((k) => k.denumire === kegSize) ||
        kegSizes[kegSizes.length - 1];
      const numKegs = Math.ceil(cantitateBere / selectedKeg.capacitate);

      ambalareNecesare = [
        {
          denumire: selectedKeg.denumire,
          cantitate: numKegs,
          unitate: "buc",
          tip: "keg",
        },
      ];
    }

    const insuficiente = ambalareNecesare
      .map((amb) => {
        const stoc = materiale.find(
          (m) =>
            m.denumire.toLowerCase() === amb.denumire.toLowerCase() &&
            m.unitate.toLowerCase() === amb.unitate.toLowerCase()
        );

        if (!stoc || stoc.cantitate < amb.cantitate) {
          return {
            denumire: amb.denumire,
            cantitateNecesara: amb.cantitate,
            cantitateDisponibila: stoc ? stoc.cantitate : 0,
            unitate: amb.unitate,
          };
        }
        return null;
      })
      .filter(Boolean);

    return { ambalareNecesare, insuficiente };
  };

  const handleVerificaStoc = () => {
    if (
      !selectedFermentator ||
      !packagingType ||
      (packagingType === "sticle" && (!bottleSize || !boxType)) ||
      (packagingType === "keguri" && !kegSize)
    ) {
      setError(
        "Selectați un fermentator, tipul de ambalare și toate detaliile necesare!"
      );
      return;
    }

    const cantitateDeAmbalatNum = parseFloat(cantitateDeAmbalat);
    if (isNaN(cantitateDeAmbalatNum) || cantitateDeAmbalatNum <= 0) {
      setError("Introduceți o cantitate validă de ambalat!");
      return;
    }

    if (cantitateDeAmbalatNum > selectedFermentator.cantitate) {
      setError(
        `Cantitatea de ambalat (${cantitateDeAmbalatNum}L) nu poate depăși cantitatea disponibilă în fermentator (${selectedFermentator.cantitate}L)!`
      );
      return;
    }

    const { insuficiente } = verificaStocAmbalare(
      cantitateDeAmbalatNum,
      packagingType,
      bottleSize,
      boxType,
      kegSize
    );

    setAmbalareInsuficiente(insuficiente);

    if (insuficiente.length > 0) {
      setError(
        `Materiale insuficiente pentru ${cantitateDeAmbalatNum}L:\n` +
        insuficiente
          .map(
            (amb) =>
              `${amb.denumire}: Necesare ${amb.cantitateNecesara} ${amb.unitate}, Disponibile ${amb.cantitateDisponibila} ${amb.unitate}`
          )
          .join("\n")
      );
    } else {
      setError("Toate materialele necesare sunt disponibile în stoc!");
    }
  };

  const handleAmbalare = async (force = false) => {
    if (
      !selectedFermentator ||
      !packagingType ||
      (packagingType === "sticle" && (!bottleSize || !boxType)) ||
      (packagingType === "keguri" && !kegSize)
    ) {
      setError(
        "Selectați un fermentator, tipul de ambalare și toate detaliile necesare!"
      );
      return;
    }

    const cantitateDeAmbalatNum = parseFloat(cantitateDeAmbalat);
    if (isNaN(cantitateDeAmbalatNum) || cantitateDeAmbalatNum <= 0) {
      setError("Introduceți o cantitate validă de ambalat!");
      return;
    }

    if (cantitateDeAmbalatNum > selectedFermentator.cantitate) {
      setError(
        `Cantitatea de ambalat (${cantitateDeAmbalatNum}L) nu poate depăși cantitatea disponibilă în fermentator (${selectedFermentator.cantitate}L)!`
      );
      return;
    }

    const { ambalareNecesare, insuficiente } = verificaStocAmbalare(
      cantitateDeAmbalatNum,
      packagingType,
      bottleSize,
      boxType,
      kegSize
    );

    setAmbalareInsuficiente(insuficiente);

    if (insuficiente.length > 0 && !force) {
      setError(
        `Materiale insuficiente pentru ${cantitateDeAmbalatNum}L:\n` +
        insuficiente
          .map(
            (amb) =>
              `${amb.denumire}: Necesare ${amb.cantitateNecesara} ${amb.unitate}, Disponibile ${amb.cantitateDisponibila} ${amb.unitate}`
          )
          .join("\n")
      );
      return;
    }

    try {
      // Actualizare materiale
      for (const amb of ambalareNecesare) {
        const stoc = materiale.find(
          (m) =>
            m.denumire.toLowerCase() === amb.denumire.toLowerCase() &&
            m.unitate.toLowerCase() === amb.unitate.toLowerCase()
        );

        if (stoc) {
          const newCantitate = stoc.cantitate - amb.cantitate;
          await fetch(`${API_URL}/materiale-ambalare/${stoc.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...stoc,
              cantitate: newCantitate >= 0 ? newCantitate : 0,
            }),
          });
        }
      }

      // Actualizare fermentator
      const remainingQuantity =
        selectedFermentator.cantitate - cantitateDeAmbalatNum;
      const updatedFermentator = {
        ...selectedFermentator,
        ocupat: remainingQuantity > 0,
        cantitate: remainingQuantity,
      };

      await fetch(`${API_URL}/fermentatoare/${selectedFermentator.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFermentator),
      });

      let cantitateSticle = null;
      let cantitateCutii = null;
      let sticleLibere = null;
      let sticlePerCutie = null;
      let descriereAmbalare = null;

      if (packagingType === "sticle") {
        const bottleCapacity = bottleSize === "0.33l" ? 0.33 : 0.5;
        sticlePerCutie =
          boxType === "6 sticle"
            ? 6
            : boxType === "12 sticle"
              ? 12
              : boxType === "20 sticle"
                ? 20
                : boxType === "24 sticle"
                  ? 24
                  : 20;

        cantitateSticle = Math.floor(cantitateDeAmbalatNum / bottleCapacity);
        cantitateCutii = Math.floor(cantitateSticle / sticlePerCutie);
        sticleLibere = cantitateSticle % sticlePerCutie;

        descriereAmbalare = `${cantitateCutii} cutii × ${sticlePerCutie} sticle + ${sticleLibere} libere`;
      }

      // Creare lot ambalat
      const lotData = {
        fermentatorId: selectedFermentator.id,
        reteta: selectedFermentator.reteta,
        cantitate: cantitateDeAmbalatNum,
        unitate: "litri",
        dataInceput: selectedFermentator.dataInceput,
        dataAmbalare: new Date().toISOString(),
        packagingType,

        // --- DOAR PENTRU STICLE ---
        bottleSize: packagingType === "sticle" ? bottleSize : null,
        boxType: packagingType === "sticle" ? boxType : null,
        sticlePerCutie: packagingType === "sticle" ? sticlePerCutie : null,
        cantitateSticle: packagingType === "sticle" ? cantitateSticle : null,
        cantitateCutii: packagingType === "sticle" ? cantitateCutii : null,
        sticleLibere: packagingType === "sticle" ? sticleLibere : null,
        descriereAmbalare:
          packagingType === "sticle" ? descriereAmbalare : null,

        // --- DOAR PENTRU KEGURI ---
        kegSize: packagingType === "keguri" ? kegSize : null,

        // --- MATERIALE FOLOSITE ---
        materialsUsed: ambalareNecesare.map((m) => ({
          denumire: m.denumire,
          cantitate: m.cantitate,
          unitate: m.unitate,
        })),
      };

      const lotResponse = await fetch(`${API_URL}/loturi-ambalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lotData),
      });

      if (!lotResponse.ok) {
        throw new Error("Eroare la salvarea lotului");
      }

      // Reîmprospătare date
      await loadMateriale();
      await loadFermentatoare();

      setSelectedFermentator(remainingQuantity > 0 ? updatedFermentator : null);
      setCantitateDeAmbalat("");
      setPackagingType("");
      setBottleSize("");
      setBoxType("");
      setKegSize("");
      setAmbalareInsuficiente([]);
      setError(
        `Ambalare realizată cu succes! ${cantitateDeAmbalatNum}L au fost ambalate.${remainingQuantity > 0
          ? ` Au rămas ${remainingQuantity}L în fermentator.`
          : ""
        }`
      );
    } catch (error) {
      setError(`Eroare la ambalare: ${error.message}`);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadMateriale(), loadFermentatoare()]);
      setLoading(false);
    };

    loadData();
  }, [loadMateriale, loadFermentatoare]);

  return (
    <>
      <NavBar />
      <div className={styles.container}>
        {error && (
          <Modal
            title="Eroare"
            message={error}
            type="error"
            onClose={() => setError("")}
          />
        )}
        <h1 className={styles.titlu}>Materiale și Ambalare</h1>

        <div className={styles.sectionsContainer}>
          {/* Ambalare Section */}
          <div className={styles.ambalareSection}>
            <h2>Ambalare Bere</h2>

            <div className={styles.fermentatoareGrid}>
              {fermentatoare.length === 0 ? (
                <div className={styles.noFermentatoare}>
                  Nu există fermentatoare ocupate
                </div>
              ) : (
                fermentatoare.map((fermentator) => (
                  <div
                    key={fermentator.id}
                    className={`${styles.fermentatorCard} ${selectedFermentator?.id === fermentator.id
                      ? styles.selected
                      : ""
                      }`}
                    onClick={() => setSelectedFermentator(fermentator)}
                    style={{
                      backgroundImage: fermentator.imagine
                        ? `url(${SERVER_URL}${fermentator.imagine})`
                        : "none",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <div className={styles.fermentatorCardOverlay}>
                      <h3>{fermentator.nume}</h3>
                      <p>Rețetă: {fermentator.reteta}</p>
                      <p>Cantitate: {fermentator.cantitate}L</p>
                      <p>
                        Data:{" "}
                        {new Date(fermentator.dataInceput).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedFermentator && (
              <div className={styles.ambalareForm}>
                <h3>Ambalare pentru {selectedFermentator.nume}</h3>

                <div className={styles.formRow}>
                  <label>Cantitate de ambalat (L):</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={cantitateDeAmbalat}
                    onChange={(e) => setCantitateDeAmbalat(e.target.value)}
                    min="0"
                    max={selectedFermentator.cantitate}
                    step="0.1"
                    placeholder={`Max: ${selectedFermentator.cantitate}L`}
                  />
                </div>

                <div className={styles.formRow}>
                  <label>Tip ambalare:</label>
                  <select
                    className={styles.input}
                    value={packagingType}
                    onChange={(e) => {
                      setPackagingType(e.target.value);
                      setBottleSize("");
                      setBoxType("");
                      setKegSize("");
                      setAmbalareInsuficiente([]);
                    }}
                  >
                    <option value="">Selectați tipul de ambalare</option>
                    <option value="sticle">Sticle</option>
                    <option value="keguri">Keguri</option>
                  </select>
                </div>

                {packagingType === "sticle" && (
                  <>
                    <div className={styles.formRow}>
                      <label>Dimensiune sticlă:</label>
                      <select
                        className={styles.input}
                        value={bottleSize}
                        onChange={(e) => setBottleSize(e.target.value)}
                      >
                        <option value="">Selectați dimensiune sticlă</option>
                        <option value="0.33l">0.33l</option>
                      </select>
                    </div>

                    <div className={styles.formRow}>
                      <label>Tip cutie:</label>
                      <select
                        className={styles.input}
                        value={boxType}
                        onChange={(e) => setBoxType(e.target.value)}
                      >
                        <option value="">Selectați tip cutie</option>
                        <option value="6 sticle">Cutii 6 sticle</option>
                        <option value="12 sticle">Cutii 12 sticle</option>
                        <option value="20 sticle">Cutii 24 sticle</option>
                        <option value="24 sticle">Cutii 24 sticle</option>
                      </select>
                    </div>
                  </>
                )}

                {packagingType === "keguri" && (
                  <div className={styles.formRow}>
                    <label>Dimensiune keg:</label>
                    <select
                      className={styles.input}
                      value={kegSize}
                      onChange={(e) => setKegSize(e.target.value)}
                    >
                      <option value="">Selectați dimensiune keg</option>
                      <option value="Keg 10l">Keg 10l</option>
                      <option value="Keg 20l">Keg 20l</option>
                      <option value="Keg 30l">Keg 30l</option>
                      <option value="Keg 40l">Keg 40l</option>
                      <option value="Keg 50l">Keg l</option>
                    </select>
                  </div>
                )}

                {packagingType &&
                  ((packagingType === "sticle" && bottleSize && boxType) ||
                    (packagingType === "keguri" && kegSize)) && (
                    <div className={styles.formButtons}>
                      <button
                        className={styles.buttonVerifica}
                        onClick={handleVerificaStoc}
                      >
                        Verifică Stocul
                      </button>
                      <button
                        className={styles.buttonAmbalare}
                        onClick={() => handleAmbalare(false)}
                      >
                        Efectuează Ambalarea
                      </button>
                    </div>
                  )}

                {ambalareInsuficiente.length > 0 && (
                  <div className={styles.insuficienteWarning}>
                    <h4>Materiale insuficiente:</h4>
                    <ul>
                      {ambalareInsuficiente.map((amb, index) => (
                        <li key={index}>
                          {amb.denumire}: Necesare {amb.cantitateNecesara}{" "}
                          {amb.unitate}, Disponibile {amb.cantitateDisponibila}{" "}
                          {amb.unitate}
                        </li>
                      ))}
                    </ul>
                    <button
                      className={styles.buttonContinua}
                      onClick={() => handleAmbalare(true)}
                    >
                      Continuă Oricum
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Materiale Section */}
          <div className={styles.materialeSection}>
            <h2>Gestionează Materiale de Ambalare</h2>
            <div className={styles.toolbar}>
              <button
                className={styles.buttonRefresh}
                onClick={() => {
                  loadMateriale();
                  loadFermentatoare();
                }}
              >
                Reîmprospătează
              </button>
              <button className={styles.buttonExport} onClick={handleExport}>
                Exportă CSV
              </button>
            </div>

            <div className={styles.formular}>
              <h3>{isEditing ? "Editează Material" : "Adaugă Material"}</h3>
              <form onSubmit={handleAddMaterial}>
                <div className={styles.formGrid}>
                  <input
                    type="text"
                    name="denumire"
                    className={styles.input}
                    placeholder="Denumire"
                    value={newMaterial.denumire}
                    onChange={handleInputChange}
                    required
                  />
                  <input
                    type="number"
                    name="cantitate"
                    className={styles.input}
                    placeholder="Cantitate"
                    value={newMaterial.cantitate}
                    onChange={handleInputChange}
                    step="0.01"
                    required
                  />
                  <input
                    type="text"
                    name="unitate"
                    className={styles.input}
                    placeholder="Unitate"
                    value={newMaterial.unitate}
                    onChange={handleInputChange}
                    required
                  />
                  <input
                    type="text"
                    name="tip"
                    className={styles.input}
                    placeholder="Tip"
                    value={newMaterial.tip}
                    onChange={handleInputChange}
                    required
                  />
                  <input
                    type="text"
                    name="producator"
                    className={styles.input}
                    placeholder="Producător"
                    value={newMaterial.producator}
                    onChange={handleInputChange}
                  />
                  <input
                    type="text"
                    name="codProdus"
                    className={styles.input}
                    placeholder="Cod Produs"
                    value={newMaterial.codProdus}
                    onChange={handleInputChange}
                  />
                  <input
                    type="text"
                    name="lot"
                    className={styles.input}
                    placeholder="Lot"
                    value={newMaterial.lot}
                    onChange={handleInputChange}
                  />
                  <input
                    type="text"
                    name="subcategorie"
                    className={styles.input}
                    placeholder="Subcategorie"
                    value={newMaterial.subcategorie}
                    onChange={handleInputChange}
                  />
                </div>
                <div className={styles.formButtons}>
                  <button
                    type="submit"
                    className={
                      isEditing ? styles.buttonUpdate : styles.buttonAdd
                    }
                  >
                    {isEditing ? "Actualizează" : "Adaugă"}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      className={styles.buttonCancel}
                      onClick={handleCancelEdit}
                    >
                      Anulează
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className={styles.cardsContainer}>
              {loading ? (
                <div className={styles.loading}>Se încarcă...</div>
              ) : materiale.length === 0 ? (
                <div className={styles.noResults}>Niciun material găsit</div>
              ) : (
                <div className={styles.materialCards}>
                  {materiale.map((material) => (
                    <div key={material.id} className={styles.materialCard}>
                      <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>
                          {material.denumire}
                        </h3>
                        <span className={styles.cardId}>ID: {material.id}</span>
                      </div>

                      <div className={styles.cardContent}>
                        <div className={styles.cardRow}>
                          <span className={styles.cardLabel}>Cantitate:</span>
                          <span className={styles.cardValue}>
                            {material.cantitate} {material.unitate}
                          </span>
                        </div>

                        {material.producator && (
                          <div className={styles.cardRow}>
                            <span className={styles.cardLabel}>
                              Producător:
                            </span>
                            <span className={styles.cardValue}>
                              {material.producator}
                            </span>
                          </div>
                        )}

                        {material.codProdus && (
                          <div className={styles.cardRow}>
                            <span className={styles.cardLabel}>
                              Cod Produs:
                            </span>
                            <span className={styles.cardValue}>
                              {material.codProdus}
                            </span>
                          </div>
                        )}

                        {material.lot && (
                          <div className={styles.cardRow}>
                            <span className={styles.cardLabel}>Lot:</span>
                            <span className={styles.cardValue}>
                              {material.lot}
                            </span>
                          </div>
                        )}

                        {material.tip && (
                          <div className={styles.cardRow}>
                            <span className={styles.cardLabel}>Tip:</span>
                            <span className={styles.cardValue}>
                              {material.tip}
                            </span>
                          </div>
                        )}

                        {material.subcategorie && (
                          <div className={styles.cardRow}>
                            <span className={styles.cardLabel}>
                              Subcategorie:
                            </span>
                            <span className={styles.cardValue}>
                              {material.subcategorie}
                            </span>
                          </div>
                        )}

                        <div className={styles.supplementSection}>
                          <div className={styles.supplementInput}>
                            <input
                              type="number"
                              className={styles.inputSmall}
                              placeholder="Cantitate suplimentara"
                              value={supplementCantitati[material.id] || ""}
                              onChange={(e) =>
                                handleSupplementChange(
                                  material.id,
                                  e.target.value
                                )
                              }
                              step="0.01"
                            />
                            <button
                              className={styles.buttonAdauga}
                              onClick={() =>
                                handleSupplementMaterial(material.id)
                              }
                            >
                              + Adaugă
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className={styles.cardActions}>
                        <button
                          className={styles.buttonEdit}
                          onClick={() => handleEdit(material)}
                        >
                          Editează
                        </button>
                        <button
                          className={styles.buttonDelete}
                          onClick={() => handleDelete(material.id)}
                        >
                          Șterge
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Ambalare;
