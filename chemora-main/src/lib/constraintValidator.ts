/**
 * Constraint Validator
 * Checks chemical constraints and rules that determine reaction feasibility
 */

import {
  getElementData,
  isNobleGas,
  getElectronegativityDifference,
} from "./elementData";
import {
  getOxidationStates,
  canFormIonicBond,
} from "./ionicBonding";
import {
  canFormCovalentBond,
} from "./covalentBonding";

export interface ConstraintResult {
  valid: boolean;
  constraint: string;
  message: string;
  severity: "error" | "warning" | "info";
}

/**
 * Validate all reactants and products
 */
export function validateReactionConstraints(
  reactants: string[],
  products: string[]
): ConstraintResult[] {
  const results: ConstraintResult[] = [];

  // Check reactants exist
  for (const reactant of reactants) {
    results.push(...validateCompoundExists(reactant));
  }

  // Check products exist
  for (const product of products) {
    results.push(...validateCompoundExists(product));
  }

  // Check noble gases
  for (const reactant of reactants) {
    results.push(...checkNobleGasConstraint(reactant));
  }

  // Check oxidation state compatibility
  results.push(...checkOxidationStateBalance(reactants, products));

  // Check for impossible reactions
  results.push(...checkReactionFeasibility(reactants, products));

  return results;
}

/**
 * Validate that compound formula is valid
 */
export function validateCompoundExists(formula: string): ConstraintResult[] {
  const results: ConstraintResult[] = [];

  // Extract all unique elements
  const regex = /([A-Z][a-z]?)/g;
  const matches = formula.match(regex);

  if (!matches) {
    return [
      {
        valid: false,
        constraint: "formula_parsing",
        message: `Could not parse formula: ${formula}`,
        severity: "error",
      },
    ];
  }

  const uniqueElements = new Set(matches);

  for (const element of uniqueElements) {
    const data = getElementData(element);
    if (!data) {
      results.push({
        valid: false,
        constraint: "unknown_element",
        message: `Unknown element: ${element}`,
        severity: "error",
      });
    }
  }

  return results;
}

/**
 * Check noble gas constraint
 * Noble gases rarely react unless under extreme conditions
 */
export function checkNobleGasConstraint(compound: string): ConstraintResult[] {
  const results: ConstraintResult[] = [];

  // Extract elements from compound
  const regex = /([A-Z][a-z]?)/g;
  const matches = compound.match(regex);

  if (!matches) return results;

  for (const element of matches) {
    if (isNobleGas(element)) {
      // Xenon can form compounds under extreme conditions
      if (element === "Xe") {
        results.push({
          valid: true,
          constraint: "noble_gas_possible",
          message: "Xenon can form compounds under extreme conditions (high pressure/temperature)",
          severity: "warning",
        });
      } else {
        results.push({
          valid: false,
          constraint: "noble_gas_inert",
          message: `${element} is a noble gas and extremely unreactive`,
          severity: "error",
        });
      }
    }
  }

  return results;
}

/**
 * Check oxidation state balance in reaction
 */
export function checkOxidationStateBalance(
  reactants: string[],
  products: string[]
): ConstraintResult[] {
  const results: ConstraintResult[] = [];

  try {
    const reactantOxSum = calculateTotalOxidationState(reactants);
    const productOxSum = calculateTotalOxidationState(products);

    // In redox reactions, oxidation states change
    // In non-redox reactions, they stay the same
    if (Math.abs(reactantOxSum - productOxSum) > 0.01) {
      results.push({
        valid: true,
        constraint: "redox_reaction",
        message: "This appears to be a redox (oxidation-reduction) reaction",
        severity: "info",
      });
    } else {
      results.push({
        valid: true,
        constraint: "non_redox_reaction",
        message: "This is a non-redox reaction",
        severity: "info",
      });
    }
  } catch (e) {
    results.push({
      valid: true,
      constraint: "oxidation_state_unknown",
      message: "Could not determine oxidation states for all species",
      severity: "warning",
    });
  }

  return results;
}

/**
 * Calculate total oxidation state for a compound
 */
function calculateTotalOxidationState(compounds: string[]): number {
  let total = 0;

  for (const compound of compounds) {
    // Simple heuristic: oxygen is -2, H is +1, metals have positive ox states
    const parsed = parseFormulaWithOxStates(compound);
    total += parsed;
  }

  return total;
}

/**
 * Parse formula and estimate oxidation state sum
 * Very simplified version
 */
function parseFormulaWithOxStates(formula: string): number {
  let total = 0;

  // Count elements
  const regex = /([A-Z][a-z]?)(\d*)/g;
  let match;

  while ((match = regex.exec(formula)) !== null) {
    const element = match[1];
    const count = parseInt(match[2]) || 1;

    let oxState = 0;

    if (element === "O") oxState = -2;
    else if (element === "H") oxState = 1;
    else if (element === "Cl") oxState = -1;
    else if (element === "N") oxState = -3; // Rough estimate
    else if (element === "S") oxState = -2; // Rough estimate

    total += oxState * count;
  }

  return total;
}

/**
 * Check basic reaction feasibility
 */
export function checkReactionFeasibility(
  reactants: string[],
  products: string[]
): ConstraintResult[] {
  const results: ConstraintResult[] = [];

  // Check reactants ≠ products
  const reactantSet = new Set(reactants);
  const productSet = new Set(products);

  const onlyReactants = reactants.filter((r) => !productSet.has(r));
  const onlyProducts = products.filter((p) => !reactantSet.has(p));

  if (onlyReactants.length === 0 && onlyProducts.length === 0) {
    results.push({
      valid: false,
      constraint: "no_reaction",
      message: "Reactants and products are identical - no reaction occurs",
      severity: "error",
    });
  } else {
    results.push({
      valid: true,
      constraint: "reaction_feasible",
      message: "Reaction is chemically feasible based on constraints",
      severity: "info",
    });
  }

  return results;
}

/**
 * Check if bonding between elements is possible
 */
export function checkBondingFeasibility(element1: string, element2: string): ConstraintResult[] {
  const results: ConstraintResult[] = [];

  const el1Data = getElementData(element1);
  const el2Data = getElementData(element2);

  if (!el1Data || !el2Data) {
    return [
      {
        valid: false,
        constraint: "unknown_element",
        message: `Unknown element`,
        severity: "error",
      },
    ];
  }

  // Check ionic possibility
  if (el1Data.category === "metal" && el2Data.category === "nonmetal") {
    if (canFormIonicBond(element1, element2)) {
      results.push({
        valid: true,
        constraint: "ionic_bonding_possible",
        message: `${element1} and ${element2} can form an ionic bond`,
        severity: "info",
      });
    }
  }

  // Check covalent possibility
  if (el1Data.category === "nonmetal" && el2Data.category === "nonmetal") {
    if (canFormCovalentBond(element1, element2)) {
      results.push({
        valid: true,
        constraint: "covalent_bonding_possible",
        message: `${element1} and ${element2} can form a covalent bond`,
        severity: "info",
      });
    } else {
      results.push({
        valid: false,
        constraint: "bonding_not_possible",
        message: `${element1} and ${element2} cannot form stable bonds`,
        severity: "error",
      });
    }
  }

  return results;
}

/**
 * Get all error constraints
 */
export function getErrorConstraints(results: ConstraintResult[]): ConstraintResult[] {
  return results.filter((r) => r.severity === "error");
}

/**
 * Get all warning constraints
 */
export function getWarningConstraints(results: ConstraintResult[]): ConstraintResult[] {
  return results.filter((r) => r.severity === "warning");
}

/**
 * Check if all critical constraints pass
 */
export function passesAllConstraints(results: ConstraintResult[]): boolean {
  return getErrorConstraints(results).length === 0;
}
