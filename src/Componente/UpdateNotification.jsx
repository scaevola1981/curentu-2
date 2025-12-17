import { useEffect, useState } from "react";
import "./UpdateNotification.css"; // We will create this next

const UpdateNotification = () => {
  const [updateStatus, setUpdateStatus] = useState(null); // "available", "downloading", "ready", "error"
  const [errorMessage, setErrorMessage] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    if (!window.electronAPI) return;

    const removeAvailableListener = window.electronAPI.onUpdateAvailable((info) => {
      setUpdateStatus("available");
      setUpdateInfo(info);
    });

    const removeProgressListener = window.electronAPI.onDownloadProgress((progress) => {
      setUpdateStatus("downloading");
      setDownloadProgress(progress.percent);
    });

    const removeReadyListener = window.electronAPI.onUpdateReady((info) => {
      setUpdateStatus("ready");
      setUpdateInfo(info);
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
          <span>
            Versiune nouă disponibilă{updateInfo?.version ? ` (v${updateInfo.version})` : ""}. Se descarcă...
          </span>
        </div>
      )}

      {updateStatus === "downloading" && (
        <div className="content">
          <span className="icon">⬇️</span>
          <div className="download-info">
            <span>Se descarcă: {downloadProgress}%</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {updateStatus === "ready" && (
        <div className="content">
          <span className="icon">✅</span>
          <span>
            Update descărcat{updateInfo?.version ? ` (v${updateInfo.version})` : ""}.
          </span>
          <button
            onClick={() => window.electronAPI.installUpdate()}
            className="restart-btn"
          >
            Instalează și Restart
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
