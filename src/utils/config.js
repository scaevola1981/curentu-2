// src/utils/config.js

export const API_URL = "http://127.0.0.1:3001";

export const getSticlePerCutie = (boxType) => {
  if (!boxType) return 20; // Default fallback
  if (boxType === "6 sticle") return 6;
  if (boxType === "12 sticle") return 12;
  if (boxType === "20 sticle") return 20;
  if (boxType === "24 sticle") return 24;
  return 20;
};
