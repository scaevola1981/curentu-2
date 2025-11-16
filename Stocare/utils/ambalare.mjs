// 📦 Stocare/utils/ambalare.mjs
// Calculează automat câte sticle, cutii și sticle libere rezultă dintr-o cantitate de bere.

export function calcAmbalare({
  litri = 0,
  tip = "sticle",        // "sticle" | "keguri"
  bottleSizeL = 0.33,    // volumul unei sticle în litri
  sticlePerCutie = 12,   // câte sticle intră într-o cutie
  kegSizeL = 30          // capacitatea unui KEG, în litri
}) {
  litri = parseFloat(litri) || 0;

  if (tip === "sticle") {
    const totalSticle = Math.floor(litri / bottleSizeL);
    const cutii = Math.floor(totalSticle / sticlePerCutie);
    const sticleLibere = totalSticle % sticlePerCutie;

    return {
      tip,
      litri: +litri.toFixed(2),
      bottleSizeL,
      sticlePerCutie,
      cantitateSticle: totalSticle,
      cantitateCutii: cutii,
      sticleLibere,
      capace: totalSticle,
      etichete: totalSticle,
      cutiiAmbalaj: cutii,
      descriere: `${cutii} cutii × ${sticlePerCutie} sticle + ${sticleLibere} libere (${litri.toFixed(2)}L)`
    };
  }

  // --- Caz KEGURI ---
  const numarKeguri = Math.floor(litri / kegSizeL);
  const volumRamas = (litri - numarKeguri * kegSizeL).toFixed(2);

  return {
    tip,
    litri: +litri.toFixed(2),
    kegSizeL,
    numarKeguri,
    volumRamas,
    descriere: `${numarKeguri} keguri × ${kegSizeL}L + ${volumRamas}L rămași`
  };
}
