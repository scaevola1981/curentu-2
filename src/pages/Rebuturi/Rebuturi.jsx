import React, { useEffect, useState } from "react";
import NavBar from "../../Componente/NavBar/NavBar.jsx";
import styles from "./Rebuturi.module.css";
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

  // Încarcă datele
  const loadRebuturi = async () => {
    try {
      const res = await fetch(`${API_URL}/api/rebuturi`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const rebuturiData = await res.json();
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
  const handleDeleteRebut = async (id) => {
    if (!window.confirm("Sigur doriți să ștergeți acest rebut?")) return;

    try {
      const res = await fetch(`${API_URL}/api/rebuturi/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Eroare la ștergerea rebutului");

      const listaNoua = rebuturi.filter((r) => r.id !== id);
      setRebuturi(listaNoua);

      // recalculăm totalurile
      const rezultate = calculeazaTotaluri(listaNoua);
      setTotaluri(rezultate);
    } catch (err) {
      setError(`Eroare la ștergerea rebutului: ${err.message}`);
    }
  };

  return (
    <>
      <NavBar />

      <div className={styles.container}>
        {/* EROARE */}
        {error && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <p>{error}</p>
              <button className={styles.modalButton} onClick={() => setError("")}>
                Închide
              </button>
            </div>
          </div>
        )}

        <h1 className={styles.title}>Rebuturi și Pierderi</h1>

        {/* Dacă nu există rebuturi */}
        {rebuturi.length === 0 ? (
          <p className={styles.noData}>Nu există rebuturi sau pierderi înregistrate.</p>
        ) : (
          <>
            {/* === CARDURI === */}
            <div className={styles.gridContainer}>
              {rebuturi.map((rebut) => (
                <div key={rebut.id} className={styles.lotCard}>
                  <button
                    className={styles.deleteCardBtn}
                    onClick={() => handleDeleteRebut(rebut.id)}
                  >
                    ✕
                  </button>

                  <div className={styles.cardHeader}>
                    <h2>{rebut.reteta}</h2>
                    <span className={styles.lotDate}>
                      {new Date(rebut.dataIesire).toLocaleDateString("ro-RO")}
                    </span>
                  </div>

                  <div className={styles.cardSummary}>
                    <div className={styles.summaryItem}>
                      <span>Cantitate:</span>
                      <strong>{parseFloat(rebut.cantitate).toFixed(2)} L</strong>
                    </div>

                    <div className={styles.summaryItem}>
                      <span>Ambalaj:</span>
                      <strong>{rebut.ambalaj}</strong>
                    </div>

                    <div className={styles.summaryItem}>
                      <span>Unități:</span>
                      <strong>{rebut.numarUnitatiScoase}</strong>
                    </div>
                  </div>

                  {/* Materiale */}
                  <div className={styles.materialsGrid}>
                    {["capace", "etichete", "cutii", "sticle", "keguri"].map((key) => (
                      <div key={key} className={styles.materialItem}>
                        <span className={styles.materialLabel}>{key}</span>
                        <span className={styles.materialValue}>
                          {rebut.materiale?.[key] || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* === TOTAL GENERAL === */}
            <div className={styles.totalSection}>
              <h3>Total General</h3>

              <div className={styles.totalGrid}>
                {Object.entries(totaluri).map(([key, value]) => (
                  <div key={key} className={styles.totalItem}>
                    <span className={styles.totalLabel}>{key}:</span>
                    <span className={styles.totalValue}>{value}</span>
                  </div>
                ))}

                <div className={styles.totalItem}>
                  <span className={styles.totalLabel}>Total rebuturi:</span>
                  <span className={styles.totalValue}>{rebuturi.length}</span>
                </div>
              </div>
            </div>

            {/* === PIE CHART === */}
            <div className={styles.chartContainer}>
              <h2>Distribuția Rebuturilor</h2>

              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={130}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(1)}%`
                    }
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Rebuturi;
