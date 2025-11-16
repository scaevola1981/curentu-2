import React from "react";
import styles from "./Modal.module.css";

const Modal = ({ message, onClose, title = "Atenție", type = "info" }) => {
  if (!message) return null;

  return (
    <div className={styles.overlay}>
      <div
        className={`${styles.modalBox} ${
          type === "error"
            ? styles.error
            : type === "success"
            ? styles.success
            : styles.info
        }`}
      >
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>
        <button className={styles.button} onClick={onClose}>
          Închide
        </button>
      </div>
    </div>
  );
};

export default Modal;
