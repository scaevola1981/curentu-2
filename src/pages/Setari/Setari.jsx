import React, { useState, useEffect } from "react";
import NavBar from "../../Componente/NavBar/NavBar";
import Modal from "../../Componente/Modal";
import styles from "./Setari.module.css";

const Setari = () => {
    const [appVersion, setAppVersion] = useState("Loading...");
    const [updateStatus, setUpdateStatus] = useState("Apasă pentru verificare");
    const [isChecking, setIsChecking] = useState(false);

    const [modalState, setModalState] = useState({
        isOpen: false,
        type: "info",
        title: "",
        message: "",
        confirmAction: null,
    });

    const [downloadProgress, setDownloadProgress] = useState(0);

    const showModal = (type, title, message, confirmAction = null) => {
        setModalState({ isOpen: true, type, title, message, confirmAction });
    };

    const closeModal = () => {
        setModalState(prev => ({ ...prev, isOpen: false, confirmAction: null }));
    };

    useEffect(() => {
        // Obține versiunea reală
        if (window.electronAPI) {
            window.electronAPI.getVersion()
                .then(ver => setAppVersion(ver))
                .catch(() => setAppVersion("Eroare versiune"));

            // Ascultă evenimente update
            window.electronAPI.onUpdateAvailable((info) => {
                setUpdateStatus(`Versiune nouă disponibilă: ${info.version}`);
                setIsChecking(false);
                
                // Prompt user for download
                showModal(
                    "info",
                    "Update Disponibil",
                    `Versiunea ${info.version} este disponibilă. Doriți să o descărcați?`,
                    () => handleStartDownload()
                );
            });

            window.electronAPI.onDownloadProgress((progress) => {
                setUpdateStatus(`Se descarcă... ${progress.percent.toFixed(0)}%`);
                setDownloadProgress(progress.percent);
                setIsChecking(true); // Keep button disabled/loading style
            });

            window.electronAPI.onUpdateError((err) => {
                setUpdateStatus("Eroare la actualizare");
                console.error(err);
                setIsChecking(false);
                showModal("error", "Eroare", `A apărut o eroare: ${err}`);
            });

            window.electronAPI.onUpdateReady(() => {
                setUpdateStatus("Update pregătit de instalare!");
                setIsChecking(false);
                setDownloadProgress(100);

                // Prompt user for install
                showModal(
                    "success",
                    "Update Descărcat",
                    "Update-ul a fost descărcat cu succes. Doriți să instalați și să reporniți acum?",
                    () => window.electronAPI.installUpdate()
                );
            });

            // Handle "No Update" case
            if (window.electronAPI.onUpdateNotAvailable) {
                window.electronAPI.onUpdateNotAvailable((info) => {
                    setUpdateStatus("Ești la zi! (Nicio actualizare nouă)");
                    setIsChecking(false);
                });
            }
        }
    }, []);

    const handleStartDownload = async () => {
        if (!window.electronAPI) return;
        closeModal();
        setUpdateStatus("Se inițiază descărcarea...");
        setIsChecking(true);
        await window.electronAPI.startDownload();
    };

    const handleCheckUpdate = async () => {
        if (!window.electronAPI) return;

        setIsChecking(true);
        setUpdateStatus("Se verifică pe GitHub...");

        try {
            // Folosim noua metodă expusă
            await window.electronAPI.checkForUpdates();
        } catch (e) {
            console.error(e);
            setUpdateStatus("Eroare la inițiere verificare");
            setIsChecking(false);
        }
    };

    return (
        <>
            <NavBar />
            {modalState.isOpen && (
                <Modal
                    message={modalState.message}
                    title={modalState.title}
                    type={modalState.type}
                    onClose={closeModal}
                    confirmAction={modalState.confirmAction}
                />
            )}
            <div className={styles.container}>
                <h1 className={styles.title}>Setări Sistem</h1>

                <div className={styles.settingsCard}>
                    <h2>Informații Aplicație</h2>
                    <div className={styles.cardContent}>
                        <div className={styles.infoRow}>
                            <span className={styles.label}>Versiune Instalată</span>
                            <span className={styles.value}>v{appVersion}</span>
                        </div>

                        <div className={styles.updateSection}>
                            <p className={styles.statusText}>{updateStatus}</p>
                            <button
                                onClick={handleCheckUpdate}
                                className={`${styles.checkButton} ${isChecking ? styles.checking : ''}`}
                                disabled={isChecking}
                            >
                                {isChecking ? (
                                    <>
                                        <div className={styles.loader}></div>
                                        Se verifică...
                                    </>
                                ) : (
                                    "🔄 Verifică Actualizări"
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.settingsCard}>
                    <h2>Personalizare</h2>
                    <div className={styles.cardContent}>
                        <div className={styles.infoRow}>
                            <span className={styles.label}>Mod Întunecat (Dark Mode)</span>
                            <div className={styles.themeToggle}>
                                <label className={styles.switch}>
                                    <input type="checkbox" defaultChecked disabled />
                                    <span className={`${styles.slider} ${styles.round}`}></span>
                                </label>
                            </div>
                        </div>
                        <span className={styles.comingSoon}>Opțiune blocată temporar (Beta)</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Setari;
