import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import NavBar from "./Componente/NavBar/NavBar";

import Dashboard from "./pages/Dashboard/Dashboard";
import MateriiPrime from "./pages/MateriiPrime/MateriiPrime";
import Productie from "./pages/Productie/Productie";
import Ambalare from "./pages/Ambalare/Ambalare";
import Depozitare from "./pages/Depozitare/Depozitare";
import Rebuturi from "./pages/Rebuturi/Rebuturi";

import "./index.css";

const App = () => {
  const [updateStatus, setUpdateStatus] = useState(null); // "available", "ready", "error"
  const [errorMessage, setErrorMessage] = useState("");

  // ================================
  // 🔥 AUTO-UPDATER LISTENERS
  // ================================
  useEffect(() => {
    if (!window.electronAPI) return;

    window.electronAPI.onUpdateAvailable(() => {
      setUpdateStatus("available");
    });

    window.electronAPI.onUpdateReady(() => {
      setUpdateStatus("ready");
    });

    window.electronAPI.onUpdateError((msg) => {
      setUpdateStatus("error");
      setErrorMessage(msg);
    });
  }, []);

  useEffect(() => {
  const handleShortcut = (e) => {
    if (e.shiftKey && e.altKey && e.key.toLowerCase() === "u") {
      const action = prompt(
        "TEST UPDATER:\n1 = available\n2 = ready\n3 = error",
        "1"
      );

      if (action === "1") window.electronAPI.testUpdate("available");
      if (action === "2") window.electronAPI.testUpdate("ready");
      if (action === "3") window.electronAPI.testUpdate("error");
    }
  };

  window.addEventListener("keydown", handleShortcut);
  return () => window.removeEventListener("keydown", handleShortcut);
}, []);


  return (
    <>
      <NavBar />

      {/* ===============================
          🔥 UPDATE BANNER (modern)
      ================================= */}
      {updateStatus === "available" && (
        <div className="update-banner update-available">
          <span>📦 Un update este disponibil...</span>
        </div>
      )}

      {updateStatus === "ready" && (
        <div className="update-banner update-ready">
          <span>⬇️ Update descărcat. Vrei să îl instalezi?</span>

          <button
            onClick={() => window.electronAPI.installUpdate()}
            className="update-btn"
          >
            Instalează și repornește
          </button>
        </div>
      )}

      {updateStatus === "error" && (
        <div className="update-banner update-error">
          <span>❌ Eroare updater: {errorMessage}</span>
        </div>
      )}

      {/* ===============================
               🔥 ROUTING
      ================================= */}
      <div style={{ paddingTop: "4.5rem" }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/materii-prime" element={<MateriiPrime />} />
          <Route path="/productie" element={<Productie />} />
          <Route path="/ambalare" element={<Ambalare />} />
          <Route path="/depozitare" element={<Depozitare />} />
          <Route path="/rebuturi" element={<Rebuturi />} />
        </Routes>
      </div>
    </>
  );
};

export default App;

