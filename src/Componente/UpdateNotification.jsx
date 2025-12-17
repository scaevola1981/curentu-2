import { useEffect, useState } from "react";
import "./UpdateNotification.css"; // We will create this next

const UpdateNotification = () => {
  const [updateStatus, setUpdateStatus] = useState(null); // "available", "ready", "error"
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!window.electronAPI) return;

    const removeAvailableListener = window.electronAPI.onUpdateAvailable(() => {
      setUpdateStatus("available");
    });

    const removeReadyListener = window.electronAPI.onUpdateReady(() => {
      setUpdateStatus("ready");
    });

    const removeErrorListener = window.electronAPI.onUpdateError((msg) => {
      setUpdateStatus("error");
      setErrorMessage(msg);
      // Auto-hide error after 10 seconds
      setTimeout(() => setUpdateStatus(null), 10000);
    });

    return () => {
      // Clean up listeners if necessary, though these are likely permanent for the app life
    };
  }, []);

  if (!updateStatus) return null;

  return (
    <div className={`update-notification ${updateStatus}`}>
      {updateStatus === "available" && (
        <div className="content">
          <span className="icon">📦</span>
          <span>Versiune nouă disponibilă. Se descarcă...</span>
        </div>
      )}

      {updateStatus === "ready" && (
        <div className="content">
          <span className="icon">✅</span>
          <span>Update descărcat.</span>
          <button
            onClick={() => window.electronAPI.installUpdate()}
            className="restart-btn"
          >
            Repornește acum
          </button>
        </div>
      )}

      {updateStatus === "error" && (
        <div className="content">
          <span className="icon">⚠️</span>
          <span>Eroare update: {errorMessage}</span>
          <button onClick={() => setUpdateStatus(null)} className="close-btn">✕</button>
        </div>
      )}
    </div>
  );
};

export default UpdateNotification;
