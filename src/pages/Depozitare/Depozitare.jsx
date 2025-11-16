import React, { useEffect, useState } from "react";
import NavBar from "../../Componente/NavBar/NavBar.jsx";
import styles from "./Depozitare.module.css";

const API_URL = "http://localhost:3001";
const LOT_UPDATE_ENDPOINT = "/api/ambalare";

// helper pentru a determina câte sticle are o cutie
const getSticlePerCutie = (boxType = "") => {
  const text = boxType.toLowerCase();
  if (text.includes("12")) return 12;
  if (text.includes("6")) return 6;
  // fallback – dacă stringul e ciudat, presupunem 6
  return 6;
};

const Depozitare = () => {
  const [loturi, setLoturi] = useState([]);
  const [iesiri, setIesiri] = useState([]);
  const [activeTab, setActiveTab] = useState("stoc");
  const [inputValues, setInputValues] = useState({});
  const [sticleLibereValues, setSticleLibereValues] = useState({});
  const [motivValues, setMotivValues] = useState({});

  useEffect(() => {
    loadData();
    loadIesiri();
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/loturi-ambalate`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const loturiAmbalate = await res.json();

      const loturiTransformate = loturiAmbalate.map((lot) => {
        let numarUnitati = 0;
        let detalii = "";
        let ambalaj = lot.packagingType || "necunoscut";
        let maxUnits = 0;
        let maxSticleLibere = 0;

        if (lot.packagingType === "sticle" && lot.bottleSize && lot.boxType) {
          const litriPerSticla = parseFloat(
            String(lot.bottleSize).replace("l", "")
          );
          const sticlePerCutie = getSticlePerCutie(lot.boxType);

          if (!isNaN(litriPerSticla)) {
            const cantitateLot = parseFloat(lot.cantitate || 0);
            const numarSticle = Math.floor(cantitateLot / litriPerSticla);
            const numarCutii = Math.floor(numarSticle / sticlePerCutie);
            const sticleLibere = numarSticle % sticlePerCutie;

            numarUnitati = numarCutii;
            maxUnits = numarCutii;
            maxSticleLibere = sticleLibere;

            detalii = `${numarCutii} cutii a ${sticlePerCutie} sticle + ${sticleLibere} sticle libere`;
          }
        } else if (lot.packagingType === "keguri" && lot.kegSize) {
          const litriPerKeg = parseFloat(
            String(lot.kegSize).replace("Keg ", "").replace("l", "")
          );
          if (!isNaN(litriPerKeg)) {
            const cantitateLot = parseFloat(lot.cantitate || 0);
            const numarKeguri = Math.floor(cantitateLot / litriPerKeg);
            numarUnitati = numarKeguri;
            maxUnits = numarKeguri;
            detalii = `${numarKeguri} keguri × ${litriPerKeg}L`;
          }
        } else {
          const cantitateLot = parseFloat(lot.cantitate || 0);
          numarUnitati = cantitateLot;
          maxUnits = cantitateLot;
          detalii = "Fără detalii ambalaj";
        }

        return {
          id: lot.id.toString(),
          reteta: lot.reteta || "Necunoscut",
          cantitate: parseFloat(lot.cantitate || 0).toFixed(2),
          ambalaj,
          numarUnitati,
          detalii,
          dataAmbalare: lot.dataAmbalare || new Date().toISOString(),
          bottleSize: lot.bottleSize || null,
          kegSize: lot.kegSize || null,
          boxType: lot.boxType || null,
          maxUnits,
          maxSticleLibere,
          packagingType: lot.packagingType || null,
        };
      });

      setLoturi(loturiTransformate);

      const newInputValues = {};
      const newSticleLibereValues = {};
      const newMotivValues = {};
      loturiTransformate.forEach((lot) => {
        newInputValues[lot.id] = "";
        newSticleLibereValues[lot.id] = "";
        newMotivValues[lot.id] = "vanzare";
      });
      setInputValues(newInputValues);
      setSticleLibereValues(newSticleLibereValues);
      setMotivValues(newMotivValues);
    } catch (error) {
      console.error("Eroare la încărcarea loturilor:", error);
      alert(`Eroare la încărcarea loturilor: ${error.message}`);
    }
  };

  const loadIesiri = async () => {
    try {
      const res = await fetch(`${API_URL}/api/iesiri-bere`);
      if (res.ok) {
        const iesiriData = await res.json();
        setIesiri(iesiriData);
      } else {
        setIesiri([]);
      }
    } catch (error) {
      console.error("Eroare la încărcarea ieșirilor:", error);
      setIesiri([]);
    }
  };

  const deleteLot = async (lotId) => {
    if (!window.confirm(`Sigur doriți să ștergeți lotul ${lotId}?`)) return;

    try {
      const parsedLotId = parseInt(lotId);
      const res = await fetch(
        `${API_URL}${LOT_UPDATE_ENDPOINT}/${parsedLotId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        let errorMessage = "Eroare la ștergerea lotului";
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          errorMessage = errorData.error || `HTTP error ${res.status}`;
        } else {
          errorMessage = `Server returned non-JSON response (status ${res.status})`;
        }
        throw new Error(errorMessage);
      }

      await loadData();
      alert(`Lotul ${parsedLotId} a fost șters cu succes!`);
    } catch (error) {
      console.error("Eroare la ștergerea lotului:", error.message);
      alert(`Eroare la ștergerea lotului: ${error.message}`);
    }
  };

  const scoateDinStoc = async (
    lotId,
    numarUnitati,
    numarSticleLibere,
    motivIesire
  ) => {
    const lot = loturi.find((l) => l.id === lotId);
    if (!lot || !lot.reteta) {
      alert("Lotul nu a fost găsit sau datele sunt incomplete!");
      return;
    }

    const parsedUnits = parseInt(numarUnitati) || 0;
    const parsedSticleLibere = parseInt(numarSticleLibere) || 0;

    if (parsedUnits < 0 || parsedUnits > lot.maxUnits) {
      alert(`Numărul de cutii trebuie să fie între 0 și ${lot.maxUnits}!`);
      return;
    }
    if (
      lot.packagingType === "sticle" &&
      lot.maxSticleLibere > 0 &&
      (parsedSticleLibere < 0 || parsedSticleLibere > lot.maxSticleLibere)
    ) {
      alert(
        `Numărul de sticle libere trebuie să fie între 0 și ${lot.maxSticleLibere}!`
      );
      return;
    }
    if (
      lot.packagingType === "sticle" &&
      parsedUnits === 0 &&
      parsedSticleLibere === 0
    ) {
      alert("Trebuie să introduci cel puțin o cutie sau o sticlă liberă!");
      return;
    }
    if (lot.packagingType === "keguri" && parsedUnits === 0) {
      alert("Introdu un număr valid de keguri!");
      return;
    }
    if (!lot.packagingType && parsedUnits === 0) {
      alert("Introdu o cantitate validă!");
      return;
    }

    let cantitateScoasaNum = 0;
    let unitatiMesaj = "";
    let totalUnitatiScoase = 0;

    if (lot.packagingType === "sticle" && lot.bottleSize && lot.boxType) {
      const litriPerSticla = parseFloat(
        String(lot.bottleSize).replace("l", "")
      );
      const sticlePerCutie = getSticlePerCutie(lot.boxType);

      if (isNaN(litriPerSticla)) {
        alert("Date invalide pentru sticle!");
        return;
      }

      const totalSticle = parsedUnits * sticlePerCutie + parsedSticleLibere;
      cantitateScoasaNum = totalSticle * litriPerSticla;
      unitatiMesaj = `${parsedUnits} cutii a ${sticlePerCutie} sticle + ${parsedSticleLibere} sticle libere = ${totalSticle} sticle (${cantitateScoasaNum.toFixed(
        2
      )}L)`;
      totalUnitatiScoase = totalSticle;
    } else if (lot.packagingType === "keguri" && lot.kegSize) {
      const litriPerKeg = parseFloat(
        String(lot.kegSize).replace("Keg ", "").replace("l", "")
      );
      if (isNaN(litriPerKeg)) {
        alert("Date invalide pentru keguri!");
        return;
      }
      cantitateScoasaNum = parsedUnits * litriPerKeg;
      unitatiMesaj = `${parsedUnits} keg${
        parsedUnits === 1 ? "" : "uri"
      } (${cantitateScoasaNum.toFixed(2)}L)`;
      totalUnitatiScoase = parsedUnits;
    } else {
      cantitateScoasaNum = parsedUnits;
      unitatiMesaj = `${parsedUnits} litri`;
      totalUnitatiScoase = parsedUnits;
    }

    if (isNaN(cantitateScoasaNum) || cantitateScoasaNum <= 0) {
      alert("Cantitatea calculată este invalidă!");
      return;
    }
    if (cantitateScoasaNum > parseFloat(lot.cantitate)) {
      alert("Cantitatea de scos depășește stocul disponibil!");
      return;
    }

    let cantitateNoua =
      parseFloat(lot.cantitate) - parseFloat(cantitateScoasaNum.toFixed(2));

    // dacă mai rămâne sub 0.10L, îl considerăm zero
    if (cantitateNoua < 0.1) {
      cantitateNoua = 0;
    } else {
      cantitateNoua = parseFloat(cantitateNoua.toFixed(2));
    }

    const parsedLotId = parseInt(lotId);
    const payload = {
      lotId: parsedLotId.toString(),
      reteta: lot.reteta,
      cantitate: parseFloat(cantitateScoasaNum.toFixed(2)),
      numarUnitatiScoase: totalUnitatiScoase,
      ambalaj: lot.packagingType || "necunoscut",
      motiv: motivIesire,
      dataIesire: new Date().toISOString(),
      utilizator: "Administrator",
      detaliiIesire: unitatiMesaj,
    };

    try {
      const iesireRes = await fetch(`${API_URL}/api/iesiri-bere`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!iesireRes.ok) {
        const contentType = iesireRes.headers.get("content-type");
        let errorMessage = "Eroare la înregistrarea ieșirii";
        if (contentType && contentType.includes("application/json")) {
          const errorData = await iesireRes.json();
          errorMessage = errorData.error || `HTTP error ${iesireRes.status}`;
        } else {
          errorMessage = `Server returned non-JSON response (status ${iesireRes.status})`;
        }
        throw new Error(errorMessage);
      }

      const res = await fetch(
        `${API_URL}${LOT_UPDATE_ENDPOINT}/${parsedLotId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cantitate: cantitateNoua }),
        }
      );

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        let errorMessage = "Eroare la actualizarea lotului";
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          errorMessage = errorData.error || `HTTP error ${res.status}`;
        } else {
          errorMessage = `Server returned non-JSON response (status ${res.status})`;
        }
        throw new Error(errorMessage);
      }

      if (parseFloat(cantitateNoua) <= 0) {
        await deleteLot(parsedLotId);
        alert(
          `Ieșire înregistrată: ${unitatiMesaj} - ${motivIesire}. Lotul a fost șters deoarece cantitatea a ajuns la 0.`
        );
      } else {
        await loadData();
        alert(`Ieșire înregistrată: ${unitatiMesaj} - ${motivIesire}`);
      }

      await loadIesiri();
      setInputValues((prev) => ({ ...prev, [lotId]: "" }));
      setSticleLibereValues((prev) => ({ ...prev, [lotId]: "" }));
      setMotivValues((prev) => ({ ...prev, [lotId]: "vanzare" }));
    } catch (error) {
      console.error("Eroare în scoateDinStoc:", error.message);
      alert(`Eroare: ${error.message}`);
    }
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const downloadStocPDF = () => {
    const latexContent = `
${loturi
  .map(
    (lot) => `
${lot.reteta} & ${lot.cantitate} & ${lot.ambalaj} & ${lot.numarUnitati} & ${
      lot.detalii
    } & ${new Date(lot.dataAmbalare).toLocaleDateString("ro-RO")} \\\\
`
  )
  .join("")}
    `;
    downloadFile(
      latexContent,
      `stoc_bere_${new Date().toISOString().split("T")[0]}.tex`,
      "text/x-tex"
    );
    alert("Fișierul .tex pentru stoc a fost descărcat.");
  };

  const downloadIesiriPDF = () => {
    const latexContent = `
\\documentclass[a4paper,12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}
\\usepackage{array}
\\usepackage{booktabs}
\\usepackage{longtable}
\\usepackage{fontspec}
\\setmainfont{DejaVu Sans}
\\begin{document}
\\title{Istoric Ieșiri Bere - ${new Date().toLocaleDateString("ro-RO")}}
\\author{Gestionare Depozitare}
\\date{}
\\maketitle
\\section*{Ieșiri din Depozit}
\\begin{longtable}{p{2.5cm} p{2cm} p{2cm} p{2.5cm} p{2.5cm} p{3cm} p{2cm}}
\\toprule
\\textbf{Rețetă} & \\textbf{Cantitate (L)} & \\textbf{Număr Unități} & \\textbf{Ambalaj} & \\textbf{Motiv} & \\textbf{Detalii Ieșire} & \\textbf{Data Ieșire} & \\textbf{Lot ID} \\\\
\\midrule
\\endhead
${iesiri
  .map(
    (iesire) => `
  ${iesire.reteta} & ${iesire.cantitate} & ${
      iesire.numarUnitatiScoase || ""
    } & ${iesire.ambalaj} & ${iesire.motiv} & ${
      iesire.detaliiIesire || ""
    } & ${new Date(iesire.dataIesire).toLocaleDateString("ro-RO")} & ${
      iesire.lotId
    } \\\\
`
  )
  .join("")}
\\bottomrule
\\end{longtable}
\\section*{Sumar Total}
Total litri ieșiți: ${iesiri
      .reduce((total, iesire) => total + parseFloat(iesire.cantitate), 0)
      .toFixed(2)}L
\\end{document}
    `;
    downloadFile(
      latexContent,
      `iesiri_bere_${new Date().toISOString().split("T")[0]}.tex`,
      "text/x-tex"
    );
    alert("Fișierul .tex pentru ieșiri a fost descărcat.");
  };

  const getTotalIesiriByReteta = () => {
    const totaluri = {};
    iesiri.forEach((iesire) => {
      if (!totaluri[iesire.reteta]) {
        totaluri[iesire.reteta] = 0;
      }
      totaluri[iesire.reteta] += parseFloat(iesire.cantitate);
    });
    return totaluri;
  };

  const totalIesiri = iesiri.reduce(
    (total, iesire) => total + parseFloat(iesire.cantitate),
    0
  );

  const deleteIesire = async (iesireId) => {
    if (
      !window.confirm(`Sigur doriți să ștergeți ieșirea cu ID ${iesireId}?`)
    ) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/iesiri-bere/${iesireId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        let errorMessage = "Eroare la ștergerea ieșirii";
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          errorMessage = errorData.error || `HTTP error ${res.status}`;
        } else {
          errorMessage = `Server returned non-JSON response (status ${res.status})`;
        }
        throw new Error(errorMessage);
      }

      await loadIesiri();
      alert(`Ieșirea cu ID ${iesireId} a fost ștearsă cu succes!`);
    } catch (error) {
      console.error("Eroare la ștergerea ieșirii:", error.message);
      alert(`Eroare la ștergerea ieșirii: ${error.message}`);
    }
  };

  return (
    <>
      <NavBar />
      <div className={styles.container}>
        <h1 className={styles.title}>Gestionare Depozitare</h1>
        <div className={styles.tabNavigation}>
          <button
            className={`${styles.tabButton} ${
              activeTab === "stoc" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("stoc")}
          >
            Stoc Curent
          </button>
          <button
            className={`${styles.tabButton} ${
              activeTab === "iesiri" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("iesiri")}
          >
            Istoric Ieșiri ({iesiri.length})
          </button>
        </div>

        <div className={styles.sectionsContainer}>
          {activeTab === "stoc" && (
            <div className={styles.section}>
              <h2>Stoc Curent</h2>
              <div className={styles.buttonContainer}>
                <button onClick={downloadStocPDF} className={styles.button}>
                  Descarcă Stoc ca PDF
                </button>
              </div>
              <div className={styles.cardsContainer}>
                {loturi.map((lot) => (
                  <div key={lot.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>{lot.reteta}</h3>
                    </div>
                    <div className={styles.cardContent}>
                      <div className={styles.cardRow}>
                        <span className={styles.cardLabel}>Cantitate:</span>
                        <span className={styles.cardValue}>
                          {lot.cantitate}L
                        </span>
                      </div>
                      <div className={styles.cardRow}>
                        <span className={styles.cardLabel}>Ambalaj:</span>
                        <span className={styles.cardValue}>{lot.ambalaj}</span>
                      </div>
                      <div className={styles.cardRow}>
                        <span className={styles.cardLabel}>Unități:</span>
                        <span className={styles.cardValue}>
                          {lot.packagingType === "sticle"
                            ? `${lot.numarUnitati} cutii`
                            : lot.numarUnitati}
                        </span>
                      </div>
                      <div className={styles.cardRow}>
                        <span className={styles.cardLabel}>Detalii:</span>
                        <span className={styles.cardValue}>{lot.detalii}</span>
                      </div>
                      <div className={styles.cardRow}>
                        <span className={styles.cardLabel}>
                          Data ambalării:
                        </span>
                        <span className={styles.cardValue}>
                          {new Date(lot.dataAmbalare).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className={styles.cardActions}>
                      <div className={styles.inputsGroup}>
                        {lot.packagingType === "sticle" &&
                        lot.bottleSize &&
                        lot.boxType ? (
                          <>
                            <input
                              type="number"
                              min="0"
                              max={lot.maxUnits}
                              value={inputValues[lot.id] || ""}
                              onChange={(e) =>
                                setInputValues({
                                  ...inputValues,
                                  [lot.id]: e.target.value,
                                })
                              }
                              className={styles.input}
                              placeholder={`Max ${lot.maxUnits} cutii`}
                            />
                            {lot.maxSticleLibere > 0 && (
                              <input
                                type="number"
                                min="0"
                                max={lot.maxSticleLibere}
                                value={sticleLibereValues[lot.id] || ""}
                                onChange={(e) =>
                                  setSticleLibereValues({
                                    ...sticleLibereValues,
                                    [lot.id]: e.target.value,
                                  })
                                }
                                className={styles.input}
                                placeholder={`Max ${lot.maxSticleLibere} sticle`}
                              />
                            )}
                          </>
                        ) : lot.packagingType === "keguri" && lot.kegSize ? (
                          <select
                            value={inputValues[lot.id] || ""}
                            onChange={(e) =>
                              setInputValues({
                                ...inputValues,
                                [lot.id]: e.target.value,
                              })
                            }
                            className={styles.select}
                          >
                            <option value="">Alege keguri</option>
                            {[...Array(lot.maxUnits + 1).keys()]
                              .slice(1)
                              .map((num) => (
                                <option key={num} value={num}>
                                  {num} keg{num === 1 ? "" : "uri"}
                                </option>
                              ))}
                          </select>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            max={lot.maxUnits}
                            value={inputValues[lot.id] || ""}
                            onChange={(e) =>
                              setInputValues({
                                ...inputValues,
                                [lot.id]: e.target.value,
                              })
                            }
                            className={styles.input}
                            placeholder={`Max ${lot.maxUnits}`}
                          />
                        )}
                        <select
                          value={motivValues[lot.id] || "vanzare"}
                          onChange={(e) =>
                            setMotivValues({
                              ...motivValues,
                              [lot.id]: e.target.value,
                            })
                          }
                          className={styles.select}
                        >
                          <option value="vanzare">Vânzare</option>
                          <option value="rebut">Rebut</option>
                          <option value="consum_intern">Consum intern</option>
                        </select>
                      </div>
                      <div className={styles.buttonsGroup}>
                        <button
                          onClick={() =>
                            scoateDinStoc(
                              lot.id,
                              inputValues[lot.id],
                              sticleLibereValues[lot.id],
                              motivValues[lot.id]
                            )
                          }
                          className={styles.buttonSmall}
                          disabled={
                            (!inputValues[lot.id] ||
                              inputValues[lot.id] === "0") &&
                            (!sticleLibereValues[lot.id] ||
                              sticleLibereValues[lot.id] === "0")
                          }
                        >
                          Confirmă
                        </button>
                        <button
                          onClick={() => deleteLot(lot.id)}
                          className={`${styles.buttonSmall} ${styles.deleteButton}`}
                        >
                          Șterge
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "iesiri" && (
            <div className={styles.section}>
              <h2>Istoric Ieșiri</h2>
              <div className={styles.iesiriControls}>
                <button onClick={downloadIesiriPDF} className={styles.button}>
                  Descarcă Ieșiri ca PDF
                </button>
                <div className={styles.totalIesiri}>
                  <strong>Total ieșit: {totalIesiri.toFixed(2)}L</strong>
                </div>
              </div>
              <div className={styles.sumarSection}>
                <h3>Sumar pe rețete:</h3>
                <div className={styles.sumarGrid}>
                  {Object.entries(getTotalIesiriByReteta()).map(
                    ([reteta, cantitate]) => (
                      <div key={reteta} className={styles.sumarItem}>
                        <strong>{reteta}:</strong> {cantitate.toFixed(2)}L
                      </div>
                    )
                  )}
                </div>
              </div>
              <div className={styles.cardsContainer}>
                {iesiri.map((iesire, index) => (
                  <div key={index} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>{iesire.reteta}</h3>
                    </div>
                    <div className={styles.cardContent}>
                      <div className={styles.cardRow}>
                        <span className={styles.cardLabel}>Data ieșirii:</span>
                        <span className={styles.cardValue}>
                          {new Date(iesire.dataIesire).toLocaleDateString()}
                        </span>
                      </div>
                      <div className={styles.cardRow}>
                        <span className={styles.cardLabel}>Cantitate:</span>
                        <span className={styles.cardValue}>
                          {iesire.cantitate}L
                        </span>
                      </div>
                      <div className={styles.cardRow}>
                        <span className={styles.cardLabel}>Unități:</span>
                        <span className={styles.cardValue}>
                          {iesire.numarUnitatiScoase || ""}{" "}
                          {iesire.ambalaj === "sticle"
                            ? "sticle"
                            : iesire.ambalaj === "keguri"
                            ? "keguri"
                            : "litri"}
                        </span>
                      </div>
                      <div className={styles.cardRow}>
                        <span className={styles.cardLabel}>Ambalaj:</span>
                        <span className={styles.cardValue}>
                          {iesire.ambalaj}
                        </span>
                      </div>
                      <div className={styles.cardRow}>
                        <span className={styles.cardLabel}>Motiv:</span>
                        <span className={styles.cardValue}>{iesire.motiv}</span>
                      </div>
                      <div className={styles.cardRow}>
                        <span className={styles.cardLabel}>Detalii:</span>
                        <span className={styles.cardValue}>
                          {iesire.detaliiIesire || ""}
                        </span>
                      </div>

                      {iesire.motiv === "vanzare" &&
                        iesire.ambalaj === "sticle" &&
                        iesire.detaliiIesire && (
                          <div className={styles.cardRow}>
                            <span className={styles.cardLabel}>
                              Cutiile / Sticle:
                            </span>
                            <span className={styles.cardValue}>
                              {iesire.detaliiIesire}
                            </span>
                          </div>
                        )}

                      <div className={styles.cardRow}>
                        <span className={styles.cardLabel}>Lot ID:</span>
                        <span className={styles.cardValue}>{iesire.lotId}</span>
                      </div>
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        onClick={() => deleteIesire(iesire.id)}
                        className={`${styles.buttonSmall} ${styles.deleteButton}`}
                        title="Șterge ieșirea"
                      >
                        Șterge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Depozitare;
