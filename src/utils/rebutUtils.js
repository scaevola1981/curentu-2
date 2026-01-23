/**
 * Procesează datele de ieșiri pentru a calcula totalurile rebuturilor.
 * @param {Array} iesiri - Lista completă de ieșiri.
 * @returns {Object} totaluriGenerale - Obiectul cu totalurile calculate.
 */
export const processRebuturiData = (iesiri) => {
  const totaluriGenerale = iesiri
    .filter((item) => item.motiv && (item.motiv.toLowerCase() === 'rebut' || item.motiv.toLowerCase() === 'pierdere') && item.materiale)
    .reduce(
      (acc, item) => {
        const { materiale } = item;
        return {
          litri: acc.litri + (parseFloat(materiale.litri) || 0),
          capace: acc.capace + (parseInt(materiale.capace) || 0),
          etichete: acc.etichete + (parseInt(materiale.etichete) || 0),
          cutii: acc.cutii + (parseInt(materiale.cutii) || 0),
          sticle: acc.sticle + (parseInt(materiale.sticle) || 0),
          keguri: acc.keguri + (parseInt(materiale.keguri) || 0),
        };
      },
      {
        litri: 0,
        capace: 0,
        etichete: 0,
        cutii: 0,
        sticle: 0,
        keguri: 0,
      }
    );

  // Formatare litri la 2 zecimale
  totaluriGenerale.litri = parseFloat(totaluriGenerale.litri.toFixed(2));

  return totaluriGenerale;
};
