import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import NavBar from "./Componente/NavBar/NavBar";
import UpdateNotification from "./Componente/UpdateNotification";

import Dashboard from "./pages/Dashboard/Dashboard";
import MateriiPrime from "./pages/MateriiPrime/MateriiPrime";
import Productie from "./pages/Productie/Productie";
import Ambalare from "./pages/Ambalare/Ambalare";
import Depozitare from "./pages/Depozitare/Depozitare";
import Rebuturi from "./pages/Rebuturi/Rebuturi";

import Setari from "./pages/Setari/Setari";
import "./index.css";

const App = () => {
  // Shortcut for testing updates (Keep for dev testing if needed, or remove)
  useEffect(() => {
    const handleShortcut = (e) => {
      // Shift + Alt + U
      if (e.shiftKey && e.altKey && e.key.toLowerCase() === "u") {
        const action = prompt(
          "TEST UPDATER (Debug):\n1 = available\n2 = ready\n3 = error",
          "1"
        );

        if (window.electronAPI) {
          if (action === "1") window.electronAPI.testUpdate("available");
          if (action === "2") window.electronAPI.testUpdate("ready");
          if (action === "3") window.electronAPI.testUpdate("error");
        }
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <>
      <NavBar />
      <UpdateNotification />

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
          <Route path="/rebuturi" element={<Rebuturi />} />
          <Route path="/setari" element={<Setari />} />
        </Routes>
      </div>
    </>
  );
};

export default App;

