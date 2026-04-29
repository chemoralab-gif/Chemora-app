/**
 * Comprehensive periodic table with chemical properties for rule-based engine
 * Supports ionic/covalent bonding, oxidation states, electronegativity, etc.
 */

export interface ElementData {
  symbol: string;
  atomicNumber: number;
  name: string;
  group: number; // 1-18
  period: number; // 1-7
  block: "s" | "p" | "d" | "f";
  valence: number; // electrons in valence shell
  oxidationStates: number[]; // possible oxidation states
  electronegativity: number; // Pauling scale (0-4)
  ionizationEnergy: number; // kJ/mol (first ionization)
  phaseAtSTP: "solid" | "liquid" | "gas";
  molarMass: number;
  category: "metal" | "nonmetal" | "metalloid" | "noble-gas";
  subcategory?: string;
}

// Comprehensive periodic table data
export const ELEMENT_DATA: Record<string, ElementData> = {
  H: {
    symbol: "H",
    atomicNumber: 1,
    name: "Hydrogen",
    group: 1,
    period: 1,
    block: "s",
    valence: 1,
    oxidationStates: [1, -1],
    electronegativity: 2.1,
    ionizationEnergy: 1312,
    phaseAtSTP: "gas",
    molarMass: 1.008,
    category: "nonmetal",
  },
  He: {
    symbol: "He",
    atomicNumber: 2,
    name: "Helium",
    group: 18,
    period: 1,
    block: "s",
    valence: 2,
    oxidationStates: [0],
    electronegativity: 0,
    ionizationEnergy: 2372,
    phaseAtSTP: "gas",
    molarMass: 4.003,
    category: "noble-gas",
  },
  Li: {
    symbol: "Li",
    atomicNumber: 3,
    name: "Lithium",
    group: 1,
    period: 2,
    block: "s",
    valence: 1,
    oxidationStates: [1],
    electronegativity: 0.98,
    ionizationEnergy: 520,
    phaseAtSTP: "solid",
    molarMass: 6.941,
    category: "metal",
    subcategory: "alkali-metal",
  },
  Be: {
    symbol: "Be",
    atomicNumber: 4,
    name: "Beryllium",
    group: 2,
    period: 2,
    block: "s",
    valence: 2,
    oxidationStates: [2],
    electronegativity: 1.57,
    ionizationEnergy: 900,
    phaseAtSTP: "solid",
    molarMass: 9.012,
    category: "metal",
    subcategory: "alkaline-earth",
  },
  B: {
    symbol: "B",
    atomicNumber: 5,
    name: "Boron",
    group: 13,
    period: 2,
    block: "p",
    valence: 3,
    oxidationStates: [3, -1, -5],
    electronegativity: 2.04,
    ionizationEnergy: 801,
    phaseAtSTP: "solid",
    molarMass: 10.81,
    category: "metalloid",
  },
  C: {
    symbol: "C",
    atomicNumber: 6,
    name: "Carbon",
    group: 14,
    period: 2,
    block: "p",
    valence: 4,
    oxidationStates: [4, 2, -2, -4],
    electronegativity: 2.55,
    ionizationEnergy: 1086,
    phaseAtSTP: "solid",
    molarMass: 12.01,
    category: "nonmetal",
  },
  N: {
    symbol: "N",
    atomicNumber: 7,
    name: "Nitrogen",
    group: 15,
    period: 2,
    block: "p",
    valence: 5,
    oxidationStates: [5, 3, -3, -2, -1],
    electronegativity: 3.04,
    ionizationEnergy: 1402,
    phaseAtSTP: "gas",
    molarMass: 14.01,
    category: "nonmetal",
  },
  O: {
    symbol: "O",
    atomicNumber: 8,
    name: "Oxygen",
    group: 16,
    period: 2,
    block: "p",
    valence: 6,
    oxidationStates: [-2, -1, 1, 2],
    electronegativity: 3.44,
    ionizationEnergy: 1314,
    phaseAtSTP: "gas",
    molarMass: 16.0,
    category: "nonmetal",
  },
  F: {
    symbol: "F",
    atomicNumber: 9,
    name: "Fluorine",
    group: 17,
    period: 2,
    block: "p",
    valence: 7,
    oxidationStates: [-1],
    electronegativity: 3.98,
    ionizationEnergy: 1681,
    phaseAtSTP: "gas",
    molarMass: 19.0,
    category: "nonmetal",
    subcategory: "halogen",
  },
  Ne: {
    symbol: "Ne",
    atomicNumber: 10,
    name: "Neon",
    group: 18,
    period: 2,
    block: "p",
    valence: 8,
    oxidationStates: [0],
    electronegativity: 0,
    ionizationEnergy: 2081,
    phaseAtSTP: "gas",
    molarMass: 20.18,
    category: "noble-gas",
  },
  Na: {
    symbol: "Na",
    atomicNumber: 11,
    name: "Sodium",
    group: 1,
    period: 3,
    block: "s",
    valence: 1,
    oxidationStates: [1],
    electronegativity: 0.93,
    ionizationEnergy: 496,
    phaseAtSTP: "solid",
    molarMass: 22.99,
    category: "metal",
    subcategory: "alkali-metal",
  },
  Mg: {
    symbol: "Mg",
    atomicNumber: 12,
    name: "Magnesium",
    group: 2,
    period: 3,
    block: "s",
    valence: 2,
    oxidationStates: [2],
    electronegativity: 1.31,
    ionizationEnergy: 738,
    phaseAtSTP: "solid",
    molarMass: 24.31,
    category: "metal",
    subcategory: "alkaline-earth",
  },
  Al: {
    symbol: "Al",
    atomicNumber: 13,
    name: "Aluminium",
    group: 13,
    period: 3,
    block: "p",
    valence: 3,
    oxidationStates: [3, -1],
    electronegativity: 1.61,
    ionizationEnergy: 578,
    phaseAtSTP: "solid",
    molarMass: 26.98,
    category: "metal",
    subcategory: "post-transition",
  },
  Si: {
    symbol: "Si",
    atomicNumber: 14,
    name: "Silicon",
    group: 14,
    period: 3,
    block: "p",
    valence: 4,
    oxidationStates: [4, -4],
    electronegativity: 1.9,
    ionizationEnergy: 787,
    phaseAtSTP: "solid",
    molarMass: 28.09,
    category: "metalloid",
  },
  P: {
    symbol: "P",
    atomicNumber: 15,
    name: "Phosphorus",
    group: 15,
    period: 3,
    block: "p",
    valence: 5,
    oxidationStates: [5, 3, -3],
    electronegativity: 2.19,
    ionizationEnergy: 1012,
    phaseAtSTP: "solid",
    molarMass: 30.97,
    category: "nonmetal",
  },
  S: {
    symbol: "S",
    atomicNumber: 16,
    name: "Sulfur",
    group: 16,
    period: 3,
    block: "p",
    valence: 6,
    oxidationStates: [6, 4, -2],
    electronegativity: 2.58,
    ionizationEnergy: 1000,
    phaseAtSTP: "solid",
    molarMass: 32.07,
    category: "nonmetal",
  },
  Cl: {
    symbol: "Cl",
    atomicNumber: 17,
    name: "Chlorine",
    group: 17,
    period: 3,
    block: "p",
    valence: 7,
    oxidationStates: [7, 5, 1, -1],
    electronegativity: 3.16,
    ionizationEnergy: 1251,
    phaseAtSTP: "gas",
    molarMass: 35.45,
    category: "nonmetal",
    subcategory: "halogen",
  },
  Ar: {
    symbol: "Ar",
    atomicNumber: 18,
    name: "Argon",
    group: 18,
    period: 3,
    block: "p",
    valence: 8,
    oxidationStates: [0],
    electronegativity: 0,
    ionizationEnergy: 1521,
    phaseAtSTP: "gas",
    molarMass: 39.95,
    category: "noble-gas",
  },
  K: {
    symbol: "K",
    atomicNumber: 19,
    name: "Potassium",
    group: 1,
    period: 4,
    block: "s",
    valence: 1,
    oxidationStates: [1],
    electronegativity: 0.82,
    ionizationEnergy: 419,
    phaseAtSTP: "solid",
    molarMass: 39.1,
    category: "metal",
    subcategory: "alkali-metal",
  },
  Ca: {
    symbol: "Ca",
    atomicNumber: 20,
    name: "Calcium",
    group: 2,
    period: 4,
    block: "s",
    valence: 2,
    oxidationStates: [2],
    electronegativity: 1.0,
    ionizationEnergy: 590,
    phaseAtSTP: "solid",
    molarMass: 40.08,
    category: "metal",
    subcategory: "alkaline-earth",
  },
  Fe: {
    symbol: "Fe",
    atomicNumber: 26,
    name: "Iron",
    group: 8,
    period: 4,
    block: "d",
    valence: 8,
    oxidationStates: [2, 3, 4, 6],
    electronegativity: 1.83,
    ionizationEnergy: 762,
    phaseAtSTP: "solid",
    molarMass: 55.85,
    category: "metal",
    subcategory: "transition",
  },
  Cu: {
    symbol: "Cu",
    atomicNumber: 29,
    name: "Copper",
    group: 11,
    period: 4,
    block: "d",
    valence: 1,
    oxidationStates: [1, 2],
    electronegativity: 1.9,
    ionizationEnergy: 745,
    phaseAtSTP: "solid",
    molarMass: 63.55,
    category: "metal",
    subcategory: "transition",
  },
  Zn: {
    symbol: "Zn",
    atomicNumber: 30,
    name: "Zinc",
    group: 12,
    period: 4,
    block: "d",
    valence: 2,
    oxidationStates: [2],
    electronegativity: 1.65,
    ionizationEnergy: 907,
    phaseAtSTP: "solid",
    molarMass: 65.39,
    category: "metal",
    subcategory: "transition",
  },
  Br: {
    symbol: "Br",
    atomicNumber: 35,
    name: "Bromine",
    group: 17,
    period: 4,
    block: "p",
    valence: 7,
    oxidationStates: [7, 5, 1, -1],
    electronegativity: 2.96,
    ionizationEnergy: 1140,
    phaseAtSTP: "liquid",
    molarMass: 79.9,
    category: "nonmetal",
    subcategory: "halogen",
  },
};

/**
 * Get element data by symbol
 */
export function getElementData(symbol: string): ElementData | null {
  return ELEMENT_DATA[symbol] || null;
}

/**
 * Get all transitional metals
 */
export function getTransitionMetals(): ElementData[] {
  return Object.values(ELEMENT_DATA).filter((el) => el.subcategory === "transition");
}

/**
 * Get all noble gases
 */
export function getNobleGases(): ElementData[] {
  return Object.values(ELEMENT_DATA).filter((el) => el.category === "noble-gas");
}

/**
 * Get all metals
 */
export function getAllMetals(): ElementData[] {
  return Object.values(ELEMENT_DATA).filter((el) => el.category === "metal");
}

/**
 * Get all nonmetals
 */
export function getAllNonmetals(): ElementData[] {
  return Object.values(ELEMENT_DATA).filter((el) => el.category === "nonmetal");
}

/**
 * Check if element is a metal
 */
export function isMetal(symbol: string): boolean {
  const el = getElementData(symbol);
  return el ? el.category === "metal" : false;
}

/**
 * Check if element is a nonmetal
 */
export function isNonmetal(symbol: string): boolean {
  const el = getElementData(symbol);
  return el ? el.category === "nonmetal" : false;
}

/**
 * Check if element is a noble gas
 */
export function isNobleGas(symbol: string): boolean {
  const el = getElementData(symbol);
  return el ? el.category === "noble-gas" : false;
}

/**
 * Get valence electrons
 */
export function getValenceElectrons(symbol: string): number | null {
  const el = getElementData(symbol);
  return el ? el.valence : null;
}

/**
 * Get electronegativity
 */
export function getElectronegativity(symbol: string): number | null {
  const el = getElementData(symbol);
  return el ? el.electronegativity : null;
}

/**
 * Get oxidation states
 */
export function getOxidationStates(symbol: string): number[] | null {
  const el = getElementData(symbol);
  return el ? el.oxidationStates : null;
}

/**
 * Calculate electronegativity difference
 * Used to determine bond type
 */
export function getElectronegativityDifference(
  symbol1: string,
  symbol2: string
): number | null {
  const en1 = getElectronegativity(symbol1);
  const en2 = getElectronegativity(symbol2);

  if (en1 === null || en2 === null) return null;

  return Math.abs(en1 - en2);
}

/**
 * Determine bond type based on electronegativity difference
 * < 0.5: Pure covalent
 * 0.5 - 1.7: Polar covalent
 * > 1.7: Ionic
 */
export function determineBondType(
  symbol1: string,
  symbol2: string
): "ionic" | "polar-covalent" | "covalent" | null {
  const diff = getElectronegativityDifference(symbol1, symbol2);

  if (diff === null) return null;

  if (diff < 0.5) return "covalent";
  if (diff < 1.7) return "polar-covalent";
  return "ionic";
}
