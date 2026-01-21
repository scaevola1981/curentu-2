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
    </div >
              ))}
            </div >

  {/* === TOTAL GENERAL === */ }
  < div className = { styles.totalSection } >
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
            </div >

  {/* === PIE CHART === */ }
  < div className = { styles.chartContainer } >
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
            </div >
          </>
        )}
      </div >
    </>
  );
};

export default Rebuturi;
