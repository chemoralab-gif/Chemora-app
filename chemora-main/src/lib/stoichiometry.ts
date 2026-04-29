/**
 * Stoichiometry Module
 * Handles molar ratios, coefficients parsing, and limiting reactant calculations
 */

export interface StoichiometricCoefficient {
  [substanceFormula: string]: number;
}

export interface ReactionStoichiometry {
  reactants: StoichiometricCoefficient;
  products: StoichiometricCoefficient;
  reactantCount: number;
  productCount: number;
}

export interface LimitingReactantResult {
  limitingReactant: string;
  excessReactants: string[];
  molRatios: {
    [formula: string]: number;
  };
  canProceed: boolean;
  description: string;
}

/**
 * Parse chemical formula to extract element symbols and their counts
 * Handles nested parentheses: Ca(OH)₂, Mg₃(PO₄)₂, etc.
 * Returns map of element -> count
 */
export function parseChemicalFormula(formula: string): Map<string, number> {
  const elements = new Map<string, number>();

  // Remove subscript numbers and replace with normal digits
  const normalized = formula
    .replace(/₀/g, "0").replace(/₁/g, "1").replace(/₂/g, "2")
    .replace(/₃/g, "3").replace(/₄/g, "4").replace(/₅/g, "5")
    .replace(/₆/g, "6").replace(/₇/g, "7").replace(/₈/g, "8")
    .replace(/₉/g, "9");

  // Stack-based parser for handling parentheses
  const stack: Map<string, number>[] = [new Map()];
  let i = 0;

  while (i < normalized.length) {
    if (normalized[i] === "(") {
      stack.push(new Map());
      i++;
    } else if (normalized[i] === ")") {
      i++;
      // Parse multiplier after closing parenthesis
      let numStr = "";
      while (i < normalized.length && /\d/.test(normalized[i])) {
        numStr += normalized[i];
        i++;
      }
      const multiplier = numStr ? parseInt(numStr) : 1;

      // Pop and apply multiplier
      const top = stack.pop()!;
      const parent = stack[stack.length - 1];
      for (const [elem, count] of top) {
        parent.set(elem, (parent.get(elem) || 0) + count * multiplier);
      }
    } else if (/[A-Z]/.test(normalized[i])) {
      // Parse element symbol
      let symbol = normalized[i];
      i++;
      while (i < normalized.length && /[a-z]/.test(normalized[i])) {
        symbol += normalized[i];
        i++;
      }

      // Parse count after element
      let numStr = "";
      while (i < normalized.length && /\d/.test(normalized[i])) {
        numStr += normalized[i];
        i++;
      }
      const count = numStr ? parseInt(numStr) : 1;

      const current = stack[stack.length - 1];
      current.set(symbol, (current.get(symbol) || 0) + count);
    } else {
      i++;
    }
  }

  return stack[0];
}

/**
 * Parse reaction coefficients from equation string
 * Format: "2Na + 2H₂O → 2NaOH + H₂"
 */
export function parseReactionEquation(equation: string): ReactionStoichiometry {
  const [reactantSide, productSide] = equation.split("→").map((s) => s.trim());

  const reactants: StoichiometricCoefficient = {};
  const products: StoichiometricCoefficient = {};

  // Parse reactants
  const reactantTerms = reactantSide.split("+").map((s) => s.trim());
  for (const term of reactantTerms) {
    const { coefficient, formula } = parseChemicalTerm(term);
    reactants[formula] = coefficient;
  }

  // Parse products
  const productTerms = productSide.split("+").map((s) => s.trim());
  for (const term of productTerms) {
    // Handle phase labels (↑ for gas, ↓ for precipitate, etc.)
    const cleanTerm = term.replace(/[↑↓•]/g, "").trim();
    const { coefficient, formula } = parseChemicalTerm(cleanTerm);
    products[formula] = coefficient;
  }

  return {
    reactants,
    products,
    reactantCount: Object.keys(reactants).length,
    productCount: Object.keys(products).length,
  };
}

/**
 * Parse a single chemical term: "2H₂O" or "Na" or "Ca(OH)₂"
 */
function parseChemicalTerm(term: string): { coefficient: number; formula: string } {
  // Extract leading coefficient
  const match = term.match(/^(\d+)?(.+)$/);
  if (!match) return { coefficient: 1, formula: term };

  const coefficient = match[1] ? parseInt(match[1]) : 1;
  const formula = match[2] || term;

  return { coefficient, formula };
}

/**
 * Calculate limiting reactant based on available molar quantities
 * Determines which reactant gets consumed first
 */
export function calculateLimitingReactant(
  availableMoles: { [formula: string]: number },
  stoichiometry: ReactionStoichiometry
): LimitingReactantResult {
  const reactantFormulas = Object.keys(stoichiometry.reactants);

  if (reactantFormulas.length === 0) {
    return {
      limitingReactant: "",
      excessReactants: [],
      molRatios: {},
      canProceed: false,
      description: "No reactants specified in reaction",
    };
  }

  // Check that all reactants are available
  const missingReactants = reactantFormulas.filter((f) => !availableMoles[f] || availableMoles[f] <= 0);
  if (missingReactants.length > 0) {
    return {
      limitingReactant: "",
      excessReactants: [],
      molRatios: availableMoles,
      canProceed: false,
      description: `Missing reactants: ${missingReactants.join(", ")}`,
    };
  }

  // Calculate molar ratios: available moles / required coefficient
  const ratios: { [formula: string]: number } = {};
  for (const formula of reactantFormulas) {
    const coefficient = stoichiometry.reactants[formula];
    ratios[formula] = availableMoles[formula] / coefficient;
  }

  // Find limiting reactant (minimum ratio)
  let limitingFormula = reactantFormulas[0];
  let minRatio = ratios[limitingFormula];

  for (const formula of reactantFormulas.slice(1)) {
    if (ratios[formula] < minRatio) {
      minRatio = ratios[formula];
      limitingFormula = formula;
    }
  }

  const excessReactants = reactantFormulas.filter((f) => f !== limitingFormula);

  return {
    limitingReactant: limitingFormula,
    excessReactants,
    molRatios: ratios,
    canProceed: minRatio > 0,
    description: `Limiting reactant: ${limitingFormula} (${minRatio.toFixed(3)} mol equivalent)`,
  };
}

/**
 * Calculate expected product amounts based on limiting reactant
 */
export function calculateProductQuantities(
  limitingReactantFormula: string,
  availableMoles: { [formula: string]: number },
  stoichiometry: ReactionStoichiometry
): { [formula: string]: number } {
  const limitingCoefficient = stoichiometry.reactants[limitingReactantFormula];
  const limitingMoles = availableMoles[limitingReactantFormula] || 0;

  const moleRatio = limitingMoles / limitingCoefficient;

  const products: { [formula: string]: number } = {};
  for (const [formula, coefficient] of Object.entries(stoichiometry.products)) {
    products[formula] = moleRatio * coefficient;
  }

  return products;
}

/**
 * Estimate molar mass from formula (simplified)
 * Returns approximate molecular weight in g/mol
 */
export function estimateMolarMass(formula: string): number {
  // Atomic masses (simplified)
  const atomicMasses: { [symbol: string]: number } = {
    H: 1, C: 12, N: 14, O: 16, Na: 23, Mg: 24, Al: 27, Si: 28,
    P: 31, S: 32, Cl: 35.5, K: 39, Ca: 40, Fe: 56, Cu: 64, Zn: 65,
    Ag: 108, Br: 80, I: 127, Ba: 137, Pb: 207, U: 238, Ra: 226,
    Li: 7, Be: 9, B: 11, F: 19, Ne: 20, Ar: 40, Cr: 52, Mn: 55,
    Co: 59, Ni: 59, Sn: 119, Pt: 195, Au: 197, Cs: 133, Fr: 223,
  };

  const elements = parseChemicalFormula(formula);
  let totalMass = 0;

  for (const [symbol, count] of elements) {
    const mass = atomicMasses[symbol] || 0;
    totalMass += mass * count;
  }

  return totalMass;
}

/**
 * Convert mass to moles using formula
 */
export function massToMoles(massGrams: number, formula: string): number {
  const molarMass = estimateMolarMass(formula);
  if (molarMass === 0) return 0;
  return massGrams / molarMass;
}

/**
 * Convert moles to mass
 */
export function molesToMass(moles: number, formula: string): number {
  const molarMass = estimateMolarMass(formula);
  return moles * molarMass;
}
