import React, { useEffect, useState } from "react";
import styles from "./MateriiPrime.module.css";
import NavBar from "../../Componente/NavBar/NavBar";

const UNITATI = ["kg", "g", "l", "ml", "buc", "pachete", "tone", "m", "m²", "m³"];
const API_URL = "http://127.0.0.1:3001/api/materii-prime";

const MateriiPrime = () => {
  const [materii, setMaterii] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // formular adăugare / scădere
  const [nouMaterial, setNouMaterial] = useState({
    id: null,
    denumire: "",
    cantitate: "",
    unitate: "",
    producator: "",
    codProdus: "",
    lot: "",
    tip: "",
    subcategorie: "",
  });

  const [editMode, setEditMode] = useState(false);

  // input-uri de suplimentare permanent vizibile în card
  const [supplementCantitati, setSupplementCantitati] = useState({});

  // ============================
  // LOAD MATERIALS
  // ============================
  const loadMaterials = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setMaterii(data);
    } catch (err) {
      console.error("Eroare la încărcare:", err);
      setMaterii([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  // ============================
  // INPUT CHANGES
  // ============================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNouMaterial((prev) => ({ ...prev, [name]: value }));
  };

  // input suplimentare per card
  const handleSupplementChange = (id, value) => {
    setSupplementCantitati((prev) => ({
      ...prev,
      [id]: value ? Number(value) : "",
    }));
  };

  // ============================
  // SUPLIMENTARE MATERIAL (CARD)
  // ============================
  const handleSupplementMaterial = async (id) => {
    const cant = supplementCantitati[id];

    if (!cant || cant <= 0) {
      alert("Introduceți o cantitate validă!");
      return;
    }

    const mat = materii.find((m) => m.id === id);
    if (!mat) return alert("Materialul nu există!");

    const newCant = mat.cantitate + cant;

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...mat, cantitate: newCant }),
      });

      if (!res.ok) throw new Error("Eroare la actualizare");

      setMaterii((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, cantitate: newCant } : m
        )
      );

      setSupplementCantitati((prev) => ({ ...prev, [id]: "" }));
    } catch (err) {
      alert("Eroare la suplimentare: " + err.message);
    }
  };

  // ============================
  // SUBMIT FORM — Add / Remove
  // ============================
  const handleMaterialSubmit = async (e) => {
    e.preventDefault();

    if (!nouMaterial.denumire.trim()) {
      alert("Denumirea este obligatorie!");
      return;
    }

    const cant = parseFloat(nouMaterial.cantitate);
    if (isNaN(cant) || cant <= 0) {
      alert("Cantitatea trebuie să fie pozitivă!");
      return;
    }

    const payload = {
      denumire: nouMaterial.denumire.trim(),
      unitate: nouMaterial.unitate || "kg",
      producator: nouMaterial.producator.trim(),
      codProdus: nouMaterial.codProdus.trim(),
      lot: nouMaterial.lot.trim(),
      tip: nouMaterial.tip.trim(),
      subcategorie: nouMaterial.subcategorie.trim(),
    };

    try {
      // UPDATE EXISTENT
      if (editMode && nouMaterial.id) {
        const existing = materii.find((m) => m.id === nouMaterial.id);

        if (editMode === "add") {
          payload.cantitate = existing.cantitate + cant;
        } else if (editMode === "remove") {
          if (cant > existing.cantitate) {
            alert("Nu poți folosi mai mult decât ai pe stoc!");
            return;
          }
          payload.cantitate = existing.cantitate - cant;
        }

        await fetch(`${API_URL}/${nouMaterial.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // CREATE
        payload.cantitate = cant;

        await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      resetForm();
      loadMaterials();
    } catch (err) {
      alert("Eroare la salvare: " + err.message);
    }
  };

  // ============================
  // Editare card - Add
  // ============================
  const startAdding = (m) => {
    setEditMode("add");
    setNouMaterial({
      id: m.id,
      denumire: m.denumire,
      cantitate: "",
      unitate: m.unitate,
      producator: m.producator || "",
      codProdus: m.codProdus || "",
      lot: m.lot || "",
      tip: m.tip || "",
      subcategorie: m.subcategorie || "",
    });
  };

  // ============================
  // Editare card - Remove
  // ============================
  const startRemoving = (m) => {
    setEditMode("remove");
    setNouMaterial({
      id: m.id,
      denumire: m.denumire,
      cantitate: "",
      unitate: m.unitate,
      producator: m.producator || "",
      codProdus: m.codProdus || "",
      lot: m.lot || "",
      tip: m.tip || "",
      subcategorie: m.subcategorie || "",
    });
  };

  // ============================
  // RESET FORM
  // ============================
  const resetForm = () => {
    setNouMaterial({
      id: null,
      denumire: "",
      cantitate: "",
      unitate: "",
      producator: "",
      codProdus: "",
      lot: "",
      tip: "",
      subcategorie: "",
    });
    setEditMode(false);
  };

  // ============================
  // RENDER
  // ============================
  if (isLoading) {
    return (
      <>
        <NavBar />
        <div className={styles.container}>Se încarcă...</div>
      </>
    );
  }

  return (
    <>
      <NavBar />

      <div className={styles.container}>
        <h1 className={styles.titlu}>Materii Prime Disponibile</h1>

        {/* ================= FORM ADD/REMOVE ================= */}
        <form onSubmit={handleMaterialSubmit} className={styles.formular}>
          <div className={styles.formGrid}>

            <input
              type="text"
              name="denumire"
              placeholder="Denumire material *"
              value={nouMaterial.denumire}
              onChange={handleInputChange}
              className={styles.input}
              required
            />

            <input
              type="number"
              name="cantitate"
              placeholder={
                editMode === "add"
                  ? "Cantitate de adăugat *"
                  : editMode === "remove"
                  ? "Cantitate de folosit *"
                  : "Cantitate *"
              }
              value={nouMaterial.cantitate}
              onChange={handleInputChange}
              className={styles.input}
              step="0.01"
              required
            />

            <select
              name="unitate"
              value={nouMaterial.unitate}
              onChange={handleInputChange}
              className={styles.input}
              required
            >
              <option value="">Unitate</option>
              {UNITATI.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>

            <input name="producator" placeholder="Producător" className={styles.input} value={nouMaterial.producator} onChange={handleInputChange} />
            <input name="codProdus" placeholder="Cod produs" className={styles.input} value={nouMaterial.codProdus} onChange={handleInputChange} />
            <input name="lot" placeholder="Lot" className={styles.input} value={nouMaterial.lot} onChange={handleInputChange} />
            <input name="tip" placeholder="Tip" className={styles.input} value={nouMaterial.tip} onChange={handleInputChange} />
            <input name="subcategorie" placeholder="Subcategorie" className={styles.input} value={nouMaterial.subcategorie} onChange={handleInputChange} />

          </div>

          <div className={styles.formButtons}>
            <button type="submit" className={styles.button}>
              {editMode === "add"
                ? "Adaugă la stoc"
                : editMode === "remove"
                ? "Scade din stoc"
                : "Adaugă Material"}
            </button>

            {editMode && (
              <button type="button" className={styles.buttonCancel} onClick={resetForm}>
                Anulează
              </button>
            )}
          </div>
        </form>

        {/* ===================== CARDURI ===================== */}
        <div className={styles.cardsContainer}>
          {materii.map((m) => (
            <div key={m.id} className={styles.materialCard}>

              <div className={styles.cardHeader}>
                <h3>{m.denumire}</h3>
                <span>ID: {m.id}</span>
              </div>

              <div className={styles.cardContent}>
                <div className={styles.cardRow}>
                  <span>Cantitate:</span>
                  <span>{m.cantitate} {m.unitate}</span>
                </div>

                {m.producator && <div className={styles.cardRow}><span>Producător:</span><span>{m.producator}</span></div>}
                {m.codProdus && <div className={styles.cardRow}><span>Cod:</span><span>{m.codProdus}</span></div>}
                {m.lot && <div className={styles.cardRow}><span>Lot:</span><span>{m.lot}</span></div>}
                {m.tip && <div className={styles.cardRow}><span>Tip:</span><span>{m.tip}</span></div>}
                {m.subcategorie && <div className={styles.cardRow}><span>Subcategorie:</span><span>{m.subcategorie}</span></div>}
              </div>

              {/* INPUT SUPLIMENTARE PERMANENT */}
              <div className={styles.supplementSection}>
                <input
                  type="number"
                  className={styles.inputSmall}
                  placeholder="Suplimenteaza"
                  value={supplementCantitati[m.id] || ""}
                  onChange={(e) => handleSupplementChange(m.id, e.target.value)}
                  step="0.01"
                />
                <button
                  className={styles.buttonAddSmall}
                  onClick={() => handleSupplementMaterial(m.id)}
                >
                  + Adaugă
                </button>
                 <div className={styles.cardActions}>
                {/* <button className={styles.buttonAdd} onClick={() => startAdding(m)}>+ Adaugă</button> */}
                {/* <button className={styles.buttonRemove} onClick={() => startRemoving(m)}>Folosește</button> */}
              </div>

              </div>

             
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default MateriiPrime;
