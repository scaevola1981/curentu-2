import React from "react";
import styles from "./Modal.module.css";

const Modal = ({ message, onClose, title = "Atenție", type = "info", confirmAction = null }) => {
  if (!message) return null;

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
  };

  return (
    <div className={styles.overlay}>
      <div
        className={`${styles.modalBox} ${type === "error"
            ? styles.error
            : type === "success"
              ? styles.success
              : styles.info
          }`}
      >
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>

        {confirmAction ? (
          <div className={styles.buttonGroup}>
            <button className={`${styles.button} ${styles.buttonCancel}`} onClick={onClose}>
              Anulează
            </button>
            <button className={`${styles.button} ${styles.buttonConfirm}`} onClick={handleConfirm}>
              Confirmă
            </button>
          </div>
        ) : (
          <button className={styles.button} onClick={onClose}>
            \u00cenchide
          </button>
        )}
      </div>
    </div>
  );
};

export default Modal;
