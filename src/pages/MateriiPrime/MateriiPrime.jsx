import React, { useEffect, useState } from "react";
import styles from "./MateriiPrime.module.css";
import NavBar from "../../Componente/NavBar/NavBar";

const UNITATI = [
  "kg",
  "g",
  "l",
  "ml",
  "buc",
  "pachete",
  "tone",
  "m",
  "m²",
  "m³",
];
const API_URL = "http://localhost:3001/api/materii-prime";

const MateriiPrime = () => {
  const [materii, setMaterii] = useState([]);
  const [nouMaterial, setNouMaterial] = useState({
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
  const [isLoading, setIsLoading] = useState(true);

  // Load materials from API
  const loadMaterials = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setMaterii(data);
    } catch (error) {
      console.error("Error loading materials:", error);
      setMaterii([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNouMaterial((prev) => ({ ...prev, [name]: value }));
  };

  // Add or update material
  const handleMaterialSubmit = async (e) => {
    e.preventDefault();
    if (!nouMaterial.denumire.trim()) {
      alert("Denumirea materialului este obligatorie!");
      return;
    }
    const cantitate = parseFloat(nouMaterial.cantitate);
    if (isNaN(cantitate) || cantitate <= 0) {
      alert("Cantitatea trebuie să fie un număr pozitiv!");
      return;
    }

    const materialData = {
      id: editMode ? nouMaterial.id : undefined,
      denumire: nouMaterial.denumire.trim(),
      cantitate: Number(cantitate.toFixed(2)),
      unitate: nouMaterial.unitate.trim() || "kg",
      producator: nouMaterial.producator.trim() || "",
      codProdus: nouMaterial.codProdus.trim() || "",
      lot: nouMaterial.lot.trim() || "",
      tip: nouMaterial.tip.trim() || "",
      subcategorie: nouMaterial.subcategorie.trim() || "",
    };

    try {
      if (editMode && nouMaterial.id) {
        const existingMaterial = materii.find((m) => m.id === nouMaterial.id);
        if (existingMaterial) {
          if (editMode === "add") {
            // Adaugă la stoc
            materialData.cantitate = Number(
              (existingMaterial.cantitate + cantitate).toFixed(2)
            );
          } else if (editMode === "remove") {
            // Scade din stoc
            const newQuantity = existingMaterial.cantitate - cantitate;
            if (newQuantity < 0) {
              alert(
                "Nu poți scădea mai mult decât cantitatea disponibilă pe stoc!"
              );
              return;
            }
            materialData.cantitate = Number(newQuantity.toFixed(2));
          }
        }
        // Update material
        await fetch(`${API_URL}/${nouMaterial.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(materialData),
        });
      } else {
        // Add new material
        await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(materialData),
        });
      }
      resetForm();
      loadMaterials();
    } catch (error) {
      console.error("Error saving material:", error);
      alert(
        "Eroare la salvarea materialului! Verificați consola pentru detalii."
      );
    }
  };

  // Delete material
  const deleteMaterial = async (id) => {
    if (!window.confirm("Sigur doriți să ștergeți acest material?")) return;
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      loadMaterials();
    } catch (error) {
      console.error("Error deleting material:", error);
      alert(
        "Eroare la ștergerea materialului! Verificați consola pentru detalii."
      );
    }
  };

  // Delete all materials
  const deleteAllMaterials = async () => {
    if (!window.confirm("Sigur doriți să ștergeți TOATE materialele?")) return;
    try {
      await fetch(API_URL, { method: "DELETE" });
      loadMaterials();
    } catch (error) {
      console.error("Error deleting all materials:", error);
      alert(
        "Eroare la ștergerea materialelor! Verificați consola pentru detalii."
      );
    }
  };

  // Start editing material
  const startAdding = (material) => {
    setNouMaterial({
      id: material.id,
      denumire: material.denumire,
      cantitate: "", // Reset quantity to allow adding to existing
      unitate: material.unitate,
      producator: material.producator || "",
      codProdus: material.codProdus || "",
      lot: material.lot || "",
      tip: material.tip || "",
      subcategorie: material.subcategorie || "",
    });
    setEditMode("add");
  };

  // Pentru scădere din stoc
  const startRemoving = (material) => {
    setNouMaterial({
      id: material.id,
      denumire: material.denumire,
      cantitate: "",
      unitate: material.unitate,
      producator: material.producator || "",
      codProdus: material.codProdus || "",
      lot: material.lot || "",
      tip: material.tip || "",
      subcategorie: material.subcategorie || "",
    });
    setEditMode("remove");
  };

  // Cancel editing
  const resetForm = () => {
    setNouMaterial({
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

  if (isLoading) {
    return (
      <>
        <NavBar />
        <div className={styles.container}>
          <p>Se încarcă datele...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className={styles.container}>
        <h1 className={styles.titlu}>Materii Prime Disponibile</h1>
        
        <div className={styles.toolbar}>
          <button onClick={loadMaterials} className={styles.buttonRefresh}>
            Reîncarcă
          </button>
          {/* <button onClick={deleteAllMaterials} className={styles.buttonDelete}>
            Șterge Toate
          </button> */}
        </div>
        
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
              min="0.01"
              required
            />

            <select
              name="unitate"
              value={nouMaterial.unitate}
              onChange={handleInputChange}
              className={styles.input}
              required
            >
              <option value="" disabled>
                Unitate
              </option>
              {UNITATI.map((unitate) => (
                <option key={unitate} value={unitate}>
                  {unitate}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="producator"
              placeholder="Producător"
              value={nouMaterial.producator}
              onChange={handleInputChange}
              className={styles.input}
            />
            <input
              type="text"
              name="codProdus"
              placeholder="Cod produs"
              value={nouMaterial.codProdus}
              onChange={handleInputChange}
              className={styles.input}
            />
            <input
              type="text"
              name="lot"
              placeholder="Lot"
              value={nouMaterial.lot}
              onChange={handleInputChange}
              className={styles.input}
            />
            <input
              type="text"
              name="tip"
              placeholder="Tip"
              value={nouMaterial.tip}
              onChange={handleInputChange}
              className={styles.input}
            />
            <input
              type="text"
              name="subcategorie"
              placeholder="Subcategorie"
              value={nouMaterial.subcategorie}
              onChange={handleInputChange}
              className={styles.input}
            />
          </div>
          <div className={styles.formButtons}>
            <button
              type="submit"
              className={editMode ? styles.buttonUpdate : styles.button}
            >
              {editMode === "add"
                ? "Adaugă la Stoc"
                : editMode === "remove"
                ? "Scade din Stoc"
                : "Adaugă Material"}
            </button>

            {editMode && (
              <button
                type="button"
                className={styles.buttonCancel}
                onClick={resetForm}
              >
                Anulează
              </button>
            )}
          </div>
        </form>
        
        <div className={styles.cardsContainer}>
          {materii.length > 0 ? (
            materii.map((material) => (
              <div key={material.id} className={styles.materialCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{material.denumire}</h3>
                  <span className={styles.materialId}>ID: {material.id}</span>
                </div>
                
                <div className={styles.cardContent}>
                  <div className={styles.cardRow}>
                    <span className={styles.cardLabel}>Cantitate:</span>
                    <span className={styles.cardValue}>{material.cantitate} {material.unitate}</span>
                  </div>
                  
                  {material.producator && (
                    <div className={styles.cardRow}>
                      <span className={styles.cardLabel}>Producător:</span>
                      <span className={styles.cardValue}>{material.producator}</span>
                    </div>
                  )}
                  
                  {material.codProdus && (
                    <div className={styles.cardRow}>
                      <span className={styles.cardLabel}>Cod Produs:</span>
                      <span className={styles.cardValue}>{material.codProdus}</span>
                    </div>
                  )}
                  
                  {material.lot && (
                    <div className={styles.cardRow}>
                      <span className={styles.cardLabel}>Lot:</span>
                      <span className={styles.cardValue}>{material.lot}</span>
                    </div>
                  )}
                  
                  {material.tip && (
                    <div className={styles.cardRow}>
                      <span className={styles.cardLabel}>Tip:</span>
                      <span className={styles.cardValue}>{material.tip}</span>
                    </div>
                  )}
                  
                  {material.subcategorie && (
                    <div className={styles.cardRow}>
                      <span className={styles.cardLabel}>Subcategorie:</span>
                      <span className={styles.cardValue}>{material.subcategorie}</span>
                    </div>
                  )}
                </div>
                
                <div className={styles.cardActions}>
                  <button
                    onClick={() => startAdding(material)}
                    className={styles.buttonAdd}
                    title="Adaugă cantitate la stoc"
                  >
                    + Adaugă
                  </button>
                  <button
                    onClick={() => startRemoving(material)}
                    className={styles.buttonRemove}
                    title="Scade cantitate din stoc"
                  >
                    Folosește
                  </button>
                  {/* <button
                    onClick={() => deleteMaterial(material.id)}
                    className={styles.buttonDelete}
                    title="Șterge material"
                  >
                    Șterge
                  </button> */}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noResults}>
              Nu există materiale în stoc. Adăugați un material nou folosind formularul de mai sus.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MateriiPrime;