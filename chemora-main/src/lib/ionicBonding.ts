/**
 * Ionic Bonding Rule Engine
 * Handles metal + nonmetal reactions via electron transfer
 * Uses oxidation states to determine electron transfer amounts
 */

import {
  getElementData,
  isMetal,
  isNonmetal,
  getAllMetals,
  getOxidationStates,
  determineBondType,
} from "./elementData";

export interface IonicBond {
  metal: string;
  nonmetal: string;
  metalOxidationState: number;
  nonmetalOxidationState: number;
  electronsTransferred: number;
  compound: string; // Formula of ionic compound
  feasible: boolean;
  reason?: string;
}

/**
 * Predict ionic compound formula from metal and nonmetal
 */
export function predictIonicCompound(metal: string, nonmetal: string): string | null {
  const metalData = getElementData(metal);
  const nonmetalData = getElementData(nonmetal);

  if (!metalData || !nonmetalData) return null;

  // Get common oxidation states
  const metalOxStates = metalData.oxidationStates;
  const nonmetalOxStates = nonmetalData.oxidationStates;

  if (!metalOxStates.length || !nonmetalOxStates.length) return null;

  // Use most common positive oxidation state for metal
  const metalOxState = metalOxStates.find((os) => os > 0) || metalOxStates[0];

  // Use most common negative oxidation state for nonmetal
  const nonmetalOxState = nonmetalOxStates.find((os) => os < 0) || nonmetalOxStates[0];

  // Calculate stoichiometry to balance charges
  const metalCharge = Math.abs(metalOxState);
  const nonmetalCharge = Math.abs(nonmetalOxState);

  // Find GCD to simplify ratio
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(metalCharge, nonmetalCharge);

  const metalCount = nonmetalCharge / divisor;
  const nonmetalCount = metalCharge / divisor;

  // Build formula
  let formula = metal;
  if (metalCount > 1) formula += metalCount;

  formula += nonmetal;
  if (nonmetalCount > 1) formula += nonmetalCount;

  return formula;
}

/**
 * Analyze ionic bond formation between metal and nonmetal
 */
export function analyzeIonicBond(metal: string, nonmetal: string): IonicBond | null {
  // Verify metal + nonmetal combination
  if (!isMetal(metal) || !isNonmetal(nonmetal)) {
    return null;
  }

  const metalData = getElementData(metal);
  const nonmetalData = getElementData(nonmetal);

  if (!metalData || !nonmetalData) return null;

  // Check electronegativity difference (ionic bond > 1.7)
  const bondType = determineBondType(metal, nonmetal);
  if (bondType !== "ionic") {
    return {
      metal,
      nonmetal,
      metalOxidationState: 0,
      nonmetalOxidationState: 0,
      electronsTransferred: 0,
      compound: "",
      feasible: false,
      reason: `Bond type is ${bondType}, not ionic. Electronegativity not different enough.`,
    };
  }

  // Get oxidation states
  const metalOxStates = metalData.oxidationStates;
  const nonmetalOxStates = nonmetalData.oxidationStates;

  // Use first positive for metal, first negative for nonmetal
  const metalOxState = metalOxStates.find((os) => os > 0) || metalOxStates[0];
  const nonmetalOxState = nonmetalOxStates.find((os) => os < 0) || nonmetalOxStates[0];

  const electronsTransferred = Math.abs(metalOxState - nonmetalOxState);
  const compound = predictIonicCompound(metal, nonmetal) || "";

  return {
    metal,
    nonmetal,
    metalOxidationState: metalOxState,
    nonmetalOxidationState: nonmetalOxState,
    electronsTransferred,
    compound,
    feasible: true,
  };
}

/**
 * Find all possible ionic reactions with a given metal
 */
export function findIonicReactionsWithMetal(metal: string, nonmetals: string[]): IonicBond[] {
  return nonmetals
    .map((nonmetal) => analyzeIonicBond(metal, nonmetal))
    .filter((bond): bond is IonicBond => bond !== null && bond.feasible);
}

/**
 * Check if noble gases can form ionic bonds (generally cannot)
 */
export function canFormIonicBond(metal: string, nonmetal: string): boolean {
  const metalData = getElementData(metal);
  const nonmetalData = getElementData(nonmetal);

  if (!metalData || !nonmetalData) return false;

  // Noble gases don't typically form ionic bonds
  if (nonmetalData.category === "noble-gas") {
    // Exception: xenon under extreme conditions
    if (nonmetal !== "Xe") return false;
  }

  // Both must have valid oxidation states
  return metalData.oxidationStates.length > 0 && nonmetalData.oxidationStates.length > 0;
}

/**
 * Calculate charge balance for ionic compound
 */
export function calculateChargeBalance(formula: string): number {
  // Simple parser: assumes format like Na2O, CaCl2, etc.
  // This is a simplified version
  const metalMatch = formula.match(/^([A-Z][a-z]?)(\d*)/);
  const nonmetalStart = metalMatch ? metalMatch[0].length : 0;
  const nonmetalMatch = formula.substring(nonmetalStart).match(/^([A-Z][a-z]?)(\d*)/);

  if (!metalMatch || !nonmetalMatch) return 0;

  const metal = metalMatch[1];
  const metalCount = parseInt(metalMatch[2]) || 1;
  const nonmetal = nonmetalMatch[1];
  const nonmetalCount = parseInt(nonmetalMatch[2]) || 1;

  const metalData = getElementData(metal);
  const nonmetalData = getElementData(nonmetal);

  if (!metalData || !nonmetalData) return 0;

  const metalOxState = metalData.oxidationStates.find((os) => os > 0) || metalData.oxidationStates[0];
  const nonmetalOxState = nonmetalData.oxidationStates.find((os) => os < 0) || nonmetalData.oxidationStates[0];

  const totalCharge = metalCount * metalOxState + nonmetalCount * nonmetalOxState;

  return totalCharge;
}

/**
 * Validate ionic compound formula (charge balance)
 */
export function isValidIonicFormula(formula: string): boolean {
  return calculateChargeBalance(formula) === 0;
}
