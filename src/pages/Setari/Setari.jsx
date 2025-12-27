import React, { useState, useEffect } from "react";
import NavBar from "../../Componente/NavBar/NavBar";
import styles from "./Setari.module.css";

const Setari = () => {
    const [appVersion, setAppVersion] = useState("Loading...");
    const [updateStatus, setUpdateStatus] = useState("Apasă pentru verificare");
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        // Obține versiunea reală
        if (window.electronAPI) {
            window.electronAPI.getVersion()
                .then(ver => setAppVersion(ver))
                .catch(() => setAppVersion("Eroare versiune"));

            // Ascultă evenimente update
            window.electronAPI.onUpdateAvailable((info) => {
                setUpdateStatus(`Update disponibil: ${info.version}`);
                setIsChecking(false);
            });

            window.electronAPI.onUpdateError((err) => {
                setUpdateStatus("Eroare la verificare");
                console.error(err);
                setIsChecking(false);
            });

            window.electronAPI.onUpdateReady(() => {
                setUpdateStatus("Update pregătit de instalare!");
                setIsChecking(false);
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
