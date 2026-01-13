
import { db } from './db.mjs';

/**
 * Verifică dacă există suficient stoc pentru a produce o rețetă.
 * @param {number} retetaId - ID-ul rețetei.
 * @param {number} cantitateDorita - Cantitatea de bere dorită (Litri).
 * @returns {Object} { canProduce: boolean, missing: Array<{nume, necesar, disponibil, unitate}>, details: Array }
 */
export async function checkStock(retetaId, cantitateDorita) {
    await db.read();

    const reteta = db.data.reteteBere.find(r => r.id === parseInt(retetaId));
    if (!reteta) {
        throw new Error(`Rețeta cu ID ${retetaId} nu există.`);
    }

    // Factor de multiplicare (ex: Rețeta e pt 1000L, noi vrem 500L => factor 0.5)
    const factor = cantitateDorita / reteta.rezultat.cantitate;

    const missing = [];
    const details = [];

    for (const ing of reteta.ingrediente) {
        if (!ing.id) {
            // Skip ingredients that failed migration (should be rare)
            console.warn(`[⚠️] Ingredient '${ing.denumire}' din rețeta '${reteta.denumire}' nu are ID stoc legat. Se ignoră la verificare (RISC!).`);
            continue;
        }

        const stocItem = db.data.materiiPrime.find(mp => mp.id === ing.id);

        // Calculăm necesarul
        let necesar = ing.cantitate * factor;
        let unitateNecesar = ing.unitate;

        // Conversii simple pentru drojdie (kg vs g vs pachete) - logică Simplificată
        // Ideal ar fi ca totul să fie în aceleași unități în DB.
        // Aici presupunem că dacă unitățile diferă, e nevoie de conversie manuală sau aruncăm eroare.
        // Pentru MVP, facem conversie doar Kg <-> Grame

        let stocDisponibil = stocItem ? stocItem.cantitate : 0;
        let unitateStoc = stocItem ? stocItem.unitate : 'N/A';

        // Normalizare unități pentru comparație
        let stocMetri = stocDisponibil;
        let necesarMetric = necesar;

        // Convertim tot la KG (pentru masă)
        if (unitateNecesar === 'g') necesarMetric = necesar / 1000;
        if (unitateStoc === 'g') stocMetri = stocDisponibil / 1000;

        // Drojdie: Pachete -> Pachete (nu convertim)
        if (ing.tip === 'drojdie' && (unitateNecesar === 'pachete' || unitateStoc === 'pachete')) {
            // Check direct
            stocMetri = stocDisponibil;
            necesarMetric = necesar;
        }

        const isEnough = stocMetri >= necesarMetric;

        const detail = {
            nume: ing.denumire,
            necesarOriginal: Number(necesar.toFixed(2)),
            unitateNecesar: unitateNecesar,
            disponibilOriginal: stocDisponibil,
            unitateStoc: unitateStoc,
            status: isEnough ? 'OK' : 'MISSING'
        };
        details.push(detail);

        if (!isEnough) {
            missing.push({
                nume: ing.denumire,
                necesar: Number(necesar.toFixed(2)),
                unitate: unitateNecesar,
                disponibil: stocDisponibil,
                unitateStoc: unitateStoc,
                diferenta: Number((necesarMetric - stocMetri).toFixed(3)) // Diferenta estimată în unitatea de bază (kg/buc)
            });
        }
    }

    return {
        canProduce: missing.length === 0,
        missing,
        details
    };
}

/**
 * Confirmă producția: Scade stocul și ocupă fermentatorul.
 */
export async function confirmProduction(retetaId, fermentatorId, cantitateDorita) {
    // 1. Re-verifică stocul (Double Check Lock)
    const check = await checkStock(retetaId, cantitateDorita);
    if (!check.canProduce) {
        throw new Error(`Stoc insuficient! Lipsesc: ${check.missing.map(m => m.nume).join(", ")}`);
    }

    await db.read();

    // 2. Găsește resursele
    const reteta = db.data.reteteBere.find(r => r.id === parseInt(retetaId));
    const fermentatorIndex = db.data.fermentatoare.findIndex(f => f.id === parseInt(fermentatorId));

    if (fermentatorIndex === -1) throw new Error("Fermentatorul nu există.");
    if (db.data.fermentatoare[fermentatorIndex].ocupat) throw new Error("Fermentatorul este deja ocupat!");

    const factor = cantitateDorita / reteta.rezultat.cantitate;

    // 3. Scade Stocurile (Atomic Transaction Logica)
    reteta.ingrediente.forEach(ing => {
        if (!ing.id) return; // Skip if no link

        const stocIndex = db.data.materiiPrime.findIndex(mp => mp.id === ing.id);
        if (stocIndex !== -1) {
            let necesar = ing.cantitate * factor;
            let unitateNecesar = ing.unitate;
            let currentStoc = db.data.materiiPrime[stocIndex];

            // Conversie scurtă la scădere
            if (unitateNecesar === 'g' && currentStoc.unitate === 'kg') {
                necesar = necesar / 1000;
            } else if (unitateNecesar === 'kg' && currentStoc.unitate === 'g') {
                necesar = necesar * 1000;
            }

            // Aplicăm scăderea
            db.data.materiiPrime[stocIndex].cantitate = Number((currentStoc.cantitate - necesar).toFixed(3));
            console.log(`[Production] Consumat ${necesar} ${currentStoc.unitate} din ${currentStoc.denumire}`);
        }
    });

    // 4. Actualizează Fermentatorul
    const fermentator = db.data.fermentatoare[fermentatorIndex];
    fermentator.ocupat = true;
    fermentator.reteta = reteta.denumire;
    fermentator.cantitate = Number(cantitateDorita);
    // Round to nearest 30 minutes
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.round(minutes / 30) * 30;
    now.setMinutes(roundedMinutes);
    now.setSeconds(0);
    now.setMilliseconds(0);
    fermentator.dataInceput = now.toISOString();

    // 5. Salvează tot odată
    await db.write();

    return { success: true, fermentatorId: fermentator.id };
}
