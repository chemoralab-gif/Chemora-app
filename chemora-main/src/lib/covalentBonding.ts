/**
 * Covalent Bonding Rule Engine
 * Handles nonmetal + nonmetal reactions via electron sharing
 * Uses valence electrons to determine bonding capacity
 */

import {
  getElementData,
  isNonmetal,
  getValenceElectrons,
  determineBondType,
  getElectronegativityDifference,
} from "./elementData";

export interface CovalentBond {
  element1: string;
  element2: string;
  element1Valence: number;
  element2Valence: number;
  bondType: "covalent" | "polar-covalent";
  compound: string;
  bondOrder?: number; // 1 = single, 2 = double, 3 = triple
  feasible: boolean;
  reason?: string;
}

/**
 * Predict covalent compound formula from two nonmetals
 * Uses valence electrons to determine bonding
 */
export function predictCovalentCompound(element1: string, element2: string): string | null {
  if (!isNonmetal(element1) || !isNonmetal(element2)) {
    return null;
  }

  const el1Data = getElementData(element1);
  const el2Data = getElementData(element2);

  if (!el1Data || !el2Data) return null;

  const valence1 = el1Data.valence;
  const valence2 = el2Data.valence;

  // Calculate how many electrons each needs to complete octet
  const needed1 = 8 - valence1; // electrons needed for element1
  const needed2 = 8 - valence2; // electrons needed for element2

  // Find simple whole number ratio
  // Try common ratios first
  const ratios = [
    { el1: 1, el2: 1 },
    { el1: 1, el2: 2 },
    { el1: 2, el2: 1 },
    { el1: 1, el2: 3 },
    { el1: 1, el2: 4 },
    { el1: 1, el2: 5 },
  ];

  for (const ratio of ratios) {
    const electrons1 = ratio.el1 * valence1;
    const electrons2 = ratio.el2 * valence2;

    // Check if they can share electrons to complete octets
    if ((electrons1 + electrons2) % 2 === 0) {
      const formula = buildCovalentFormula(element1, element2, ratio.el1, ratio.el2);
      return formula;
    }
  }

  // Default: 1:1
  return element1 + element2;
}

/**
 * Build covalent formula with subscripts
 */
function buildCovalentFormula(el1: string, el2: string, count1: number, count2: number): string {
  let formula = el1;
  if (count1 > 1) formula += count1;

  formula += el2;
  if (count2 > 1) formula += count2;

  return formula;
}

/**
 * Analyze covalent bond formation between two nonmetals
 */
export function analyzeCovalentBond(element1: string, element2: string): CovalentBond | null {
  // Verify both are nonmetals
  if (!isNonmetal(element1) || !isNonmetal(element2)) {
    return null;
  }

  const el1Data = getElementData(element1);
  const el2Data = getElementData(element2);

  if (!el1Data || !el2Data) return null;

  // Check bond type
  const bondType = determineBondType(element1, element2) as "covalent" | "polar-covalent" | null;

  if (!bondType || bondType === "ionic") {
    return {
      element1,
      element2,
      element1Valence: el1Data.valence,
      element2Valence: el2Data.valence,
      bondType: "covalent",
      compound: "",
      feasible: false,
      reason: "Elements cannot form covalent bonds",
    };
  }

  const compound = predictCovalentCompound(element1, element2) || "";
  const bondOrder = estimateBondOrder(element1, element2);

  return {
    element1,
    element2,
    element1Valence: el1Data.valence,
    element2Valence: el2Data.valence,
    bondType,
    compound,
    bondOrder,
    feasible: true,
  };
}

/**
 * Estimate bond order (1 = single, 2 = double, 3 = triple)
 * Based on shared electron pairs
 */
function estimateBondOrder(el1: string, el2: string): number {
  // Simple heuristic: elements closer to octet need fewer bonds
  // More electronegative elements prefer multiple bonds

  const El1 = getElementData(el1);
  const El2 = getElementData(el2);

  if (!El1 || !El2) return 1;

  const en1 = El1.electronegativity;
  const en2 = El2.electronegativity;

  // High electronegativity difference → more likely double/triple bonds
  const enDiff = Math.abs(en1 - en2);

  if (enDiff < 0.5) {
    return 3; // Similar elements, can have triple bonds (like N2, O2)
  } else if (enDiff < 1.0) {
    return 2; // Moderate difference, double bonds
  }

  return 1; // Larger difference, single bonds
}

/**
 * Determine if two nonmetals can form a stable covalent bond
 */
export function canFormCovalentBond(element1: string, element2: string): boolean {
  const bond = analyzeCovalentBond(element1, element2);
  return bond !== null && bond.feasible;
}

/**
 * Calculate valence electron balance for covalent molecule
 */
export function calculateValenceBalance(formula: string): number {
  // Simple parser for diatomic/simple molecules
  // Examples: N2, CO2, H2O
  // Format: ElementSymbol followed by optional digit

  const elements: { symbol: string; count: number }[] = [];
  const regex = /([A-Z][a-z]?)(\d*)/g;
  let match;

  while ((match = regex.exec(formula)) !== null) {
    const symbol = match[1];
    const count = parseInt(match[2]) || 1;
    elements.push({ symbol, count });
  }

  let totalValence = 0;

  for (const el of elements) {
    const data = getElementData(el.symbol);
    if (data) {
      totalValence += el.count * data.valence;
    }
  }

  return totalValence;
}

/**
 * Find all covalent pairs that can form from a set of nonmetals
 */
export function findCovalentPairs(nonmetals: string[]): CovalentBond[] {
  const pairs: CovalentBond[] = [];

  for (let i = 0; i < nonmetals.length; i++) {
    for (let j = i + 1; j < nonmetals.length; j++) {
      const bond = analyzeCovalentBond(nonmetals[i], nonmetals[j]);
      if (bond && bond.feasible) {
        pairs.push(bond);
      }
    }
  }

  return pairs;
}
