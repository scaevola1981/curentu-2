/**
 * Procesează datele de ieșiri pentru a calcula totalurile rebuturilor.
 * @param {Array} iesiri - Lista completă de ieșiri.
 * @returns {Object} totaluriGenerale - Obiectul cu totalurile calculate.
 */
export const processRebuturiData = (iesiri) => {
  const totaluriGenerale = iesiri
    .filter((item) => item.motiv && (item.motiv.toLowerCase() === 'rebut' || item.motiv.toLowerCase() === 'pierdere'))
    .reduce(
      (acc, item) => {
        const { materiale } = item;
        // Litrii se iau din cantitatea principală a înregistrării sau din materiale.litri
        const litriRecord = parseFloat(item.cantitate) || 0;
        const litriMateriale = materiale ? (parseFloat(materiale.litri) || 0) : 0;
        
        // Prioritizăm cantitatea recordului dacă există, altfel fallback la materiale
        // Userul a indicat o sumă de valori precise (122.76 etc), care par a fi cantități de loturi/ieșiri.
        const litriDeAdunat = litriRecord > 0 ? litriRecord : litriMateriale;

        return {
          litri: acc.litri + litriDeAdunat,
          capace: acc.capace + (materiale ? (parseInt(materiale.capace) || 0) : 0),
          etichete: acc.etichete + (materiale ? (parseInt(materiale.etichete) || 0) : 0),
          cutii: acc.cutii + (materiale ? (parseInt(materiale.cutii) || 0) : 0),
          sticle: acc.sticle + (materiale ? (parseInt(materiale.sticle) || 0) : 0),
          keguri: acc.keguri + (materiale ? (parseInt(materiale.keguri) || 0) : 0),
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
