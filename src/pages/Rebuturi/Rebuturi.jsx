import React, { useEffect, useState } from "react";
import NavBar from "../../Componente/NavBar/NavBar.jsx";
import styles from "./Rebuturi.module.css";
import { fetchGetWithRetry } from "../../utils/fetchWithRetry";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const API_URL = "http://127.0.0.1:3001";

const COLORS = [
  "#00C49F",
  "#0088FE",
  "#FFBB28",
  "#FF4444",
  "#AA66FF",
  "#33DD88",
];

// Tooltip custom
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.9)",
        border: "1px solid #334155",
        padding: "10px 14px",
        borderRadius: "8px",
        color: "#fff",
        boxShadow: "0 0 12px rgba(0,255,255,0.3)",
      }}
    >
      <p style={{ margin: 0, fontWeight: 700, color: "#38bdf8" }}>
        {payload[0].name}
      </p>
      <p style={{ margin: 0 }}>{payload[0].value} unități</p>
    </div>
  );
};

// 🔥 Funcție: calculează totalurile din lista de rebuturi
const calculeazaTotaluri = (rebuturi) => {
  const initial = {
    litri: 0,
    capace: 0,
    etichete: 0,
    cutii: 0,
    sticle: 0,
    keguri: 0,
  };

  return rebuturi.reduce((tot, r) => {
    const m = r.materiale || {};

    return {
      litri: tot.litri + parseFloat(r.cantitate || 0),
      capace: tot.capace + (m.capace || 0),
      etichete: tot.etichete + (m.etichete || 0),
      cutii: tot.cutii + (m.cutii || 0),
      sticle: tot.sticle + (m.sticle || 0),
      keguri: tot.keguri + (m.keguri || 0),
    };
  }, initial);
};

import Modal from "../../Componente/Modal";

// ... existing imports ...

const Rebuturi = () => {
  const [rebuturi, setRebuturi] = useState([]);
  const [totaluri, setTotaluri] = useState({
    litri: 0,
    capace: 0,
    etichete: 0,
    cutii: 0,
    sticle: 0,
    keguri: 0,
  });

  // MODAL STATE
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    confirmAction: null,
  });

  const showModal = (type, title, message, confirmAction = null) => {
    setModalState({ isOpen: true, type, title, message, confirmAction });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false, confirmAction: null }));
  };

  const [error, setError] = useState("");

  // Date pentru Pie Chart
  const pieData = [
    { name: "Litri", value: totaluri.litri },
    { name: "Capace", value: totaluri.capace },
    { name: "Etichete", value: totaluri.etichete },
    { name: "Cutii", value: totaluri.cutii },
    { name: "Sticle", value: totaluri.sticle },
    { name: "Keguri", value: totaluri.keguri },
  ];

  // Încarcă datele cu retry logic
  const loadRebuturi = async () => {
    try {
      const rebuturiData = await fetchGetWithRetry(`${API_URL}/api/rebuturi`);
      setRebuturi(rebuturiData);

      // Calcule totale
      const rezultate = calculeazaTotaluri(rebuturiData);
      setTotaluri(rezultate);

      setError("");
    } catch (err) {
      setError(`Eroare la încărcarea rebuturilor: ${err.message}`);
    }
  };

  useEffect(() => {
    loadRebuturi();
  }, []);

  // Șterge rebut individual
  // Delete Rebut
  const handleDeleteRebut = (id) => {
    showModal(
      "error",
      "Confirmare Ștergere Rebut",
      "Sigur doriți să ștergeți acest rebut?",
      async () => {
        try {
          const res = await fetch(`${API_URL}/api/rebuturi/${id}`, {
            method: "DELETE",
          });

          if (!res.ok) throw new Error("Eroare la ștergerea rebutului");

          // Optimist UI update
          const listaNoua = rebuturi.filter((r) => r.id !== id);
          setRebuturi(listaNoua);

          // recalculăm totalurile
          const rezultate = calculeazaTotaluri(listaNoua);
          setTotaluri(rezultate);

          closeModal();
          showModal("success", "Succes", "Rebut șters cu succes!");
        } catch (err) {
          console.error(err);
          closeModal();
          showModal("error", "Eroare", `Eroare la ștergerea rebutului: ${err.message}`);
        }
      }
    );
  };

  return (
    <>
      <NavBar />

      {/* 🔹 MODAL COMPONENT */}
      {modalState.isOpen && (
        <Modal
          message={modalState.message}
          title={modalState.title}
          type={modalState.type}
          onClose={closeModal}
          confirmAction={modalState.confirmAction}
        />
      )}

      {error && (
        <div className={styles.errorContainer}>
          <p>{error}</p>
        </div>
      )}

      <div className={styles.container}>
        <h1 className={styles.title}>Gestionare Rebuturi și Pierderi</h1>

        {/* 🔹 GRID: Grafic Stânga / Totaluri Dreapta */}
        <div className={styles.topSection}>
          {/* Grafic Pie */}
          <div className={styles.chartCard} style={{ minHeight: "350px" }}>
            <h2>Distribuție Rebuturi</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) =>
                    value > 0 ? `${name}: ${value}` : null
                  }
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Totaluri Card */}
          <div className={styles.summaryCard}>
            <h2>TOTAL GENERAL</h2>
            <div className={styles.totalGrid}>
              {Object.entries(totaluri).map(([key, value]) => (
                <div key={key} className={styles.totalItem}>
                  <span className={styles.totalLabel}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}:
                  </span>
                  <span className={styles.totalValue}>
                    {key === "litri" ? value.toFixed(2) : value}
                  </span>
                </div>
              ))}

              <div className={styles.totalItem}>
                <span className={styles.totalLabel}>Total rebuturi:</span>
                <span className={styles.totalValue}>{rebuturi.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 🔹 LISTA DE REBUTURI (Cards) */}
        <h2 className={styles.subtitle}>Istoric Rebuturi ({rebuturi.length})</h2>
        <div className={styles.cardsGrid}>
          {rebuturi.map((rebut) => (
            <div key={rebut.id} className={styles.rebutCard}>
              <div className={styles.cardHeader}>
                <h3>{rebut.reteta || "Necunoscut"}</h3>
                <span className={styles.badge}>{rebut.motiv}</span>
              </div>

              <div className={styles.cardBody}>
                <p>
                  <strong>Cantitate:</strong> {parseFloat(rebut.cantitate).toFixed(2)}L
                </p>
                <p>
                  <strong>Ambalaj:</strong> {rebut.ambalaj}
                </p>
                <p>
                  <strong>Data:</strong>{" "}
                  {new Date(rebut.dataIesire).toLocaleDateString("ro-RO")}
                </p>
                <p className={styles.details}>{rebut.detaliiIesire}</p>

                {rebut.materiale && (
                  <div className={styles.materialsUsed}>
                    <strong>Materiale pierdute:</strong>
                    <ul>
                      {Object.entries(rebut.materiale).map(([key, val]) =>
                        val > 0 ? (
                          <li key={key}>
                            {key}: {val}
                          </li>
                        ) : null
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div className={styles.cardFooter}>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDeleteRebut(rebut.id)}
                >
                  Șterge Rebut
                </button>
              </div>
            </div>
          ))}

          {rebuturi.length === 0 && (
            <p className={styles.emptyMsg}>Nu există rebuturi înregistrate.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Rebuturi;
