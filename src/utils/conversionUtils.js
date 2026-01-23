/**
 * Utility functions for unit conversion.
 */

// Supported units and their base factors relative to the standard unit
// Mass standard: kg
// Volume standard: l
const UNIT_FACTORS = {
  // Mass
  kg: 1,
  g: 0.001,
  tone: 1000,
  
  // Volume
  l: 1,
  ml: 0.001,
  hl: 100, // hectoliter if needed

  // Length (less likely for stock but supported)
  m: 1,
  cm: 0.01,
  mm: 0.001,

  // Area
  "m²": 1,
  
  // Volume (cubic)
  "m³": 1,

  // Count
  buc: 1,
  pachete: 1, // Special case: cannot convert generically without package size
};

const MASS_UNITS = ["kg", "g", "tone"];
const VOLUME_UNITS = ["l", "ml", "hl"];
const LENGTH_UNITS = ["m", "cm", "mm"];

/**
 * Checks if two units are compatible for conversion.
 * @param {string} unit1 
 * @param {string} unit2 
 * @returns {boolean}
 */
export const areUnitsCompatible = (unit1, unit2) => {
  if (!unit1 || !unit2) return false;
  const u1 = unit1.toLowerCase();
  const u2 = unit2.toLowerCase();
  
  if (u1 === u2) return true;

  if (MASS_UNITS.includes(u1) && MASS_UNITS.includes(u2)) return true;
  if (VOLUME_UNITS.includes(u1) && VOLUME_UNITS.includes(u2)) return true;
  if (LENGTH_UNITS.includes(u1) && LENGTH_UNITS.includes(u2)) return true;

  return false;
};

/**
 * Converts a value from one unit to another.
 * @param {number} value The numerical value to convert.
 * @param {string} fromUnit The unit of the value.
 * @param {string} toUnit The target unit.
 * @returns {number} The converted value. Throws error if incompatible.
 */
export const convertQuantity = (value, fromUnit, toUnit) => {
  const val = parseFloat(value);
  if (isNaN(val)) return 0;
  
  if (!fromUnit || !toUnit || fromUnit === toUnit) return val;

  const uFrom = fromUnit.toLowerCase();
  const uTo = toUnit.toLowerCase();

  if (!areUnitsCompatible(uFrom, uTo)) {
    throw new Error(`Nu se poate converti din ${fromUnit} în ${toUnit}. Unități incompatibile.`);
  }

  // Conversion logic: Base = Value * Factor(From)
  // Target = Base / Factor(To)
  
  const factorFrom = UNIT_FACTORS[uFrom];
  const factorTo = UNIT_FACTORS[uTo];

  if (factorFrom === undefined || factorTo === undefined) {
     // Should be caught by areUnitsCompatible but safety check
     throw new Error(`Unitate nerecunoscută: ${!factorFrom ? fromUnit : toUnit}`);
  }

  const baseValue = val * factorFrom;
  const result = baseValue / factorTo;

  // Float precision handling (optional, but good for JS)
  return parseFloat(result.toFixed(4));
};
