/**
 * Substance Validator Module
 * Validates substance IDs, formulas, and properties
 */

import { Chemical } from "./reactions";
import { loggers } from "./logger";

export interface SubstanceValidation {
  isValid: boolean;
  formula: string;
  reason?: string;
  suggestions?: string[];
}

export interface CircularDependencyCheck {
  hasCircular: boolean;
  cycle?: string[];
  description: string;
}

/**
 * Cache of registered substances (formulas)
 */
class SubstanceRegistry {
  private validFormulas = new Set<string>();
  private formulaToId = new Map<string, string>();
  private idToFormula = new Map<string, string>();

  constructor() {
    this.registerDefaults();
  }

  /**
   * Register initial set of valid substances
   */
  private registerDefaults() {
    // Common elements and compounds
    const common = [
      // Elements
      "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al",
      "Si", "P", "S", "Cl", "Ar", "K", "Ca", "Sc", "Ti", "V", "Cr", "Mn",
      "Fe", "Co", "Ni", "Cu", "Zn", "Ga", "Ge", "As", "Se", "Br", "Kr",
      "Rb", "Sr", "Y", "Zr", "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag",
      "Cd", "In", "Sn", "Sb", "Te", "I", "Xe", "Cs", "Ba", "La", "Ce",
      "Pr", "Nd", "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm",
      "Yb", "Lu", "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg",
      "Tl", "Pb", "Bi", "Po", "At", "Rn", "Fr", "Ra", "Ac", "Th", "Pa", "U",
      // Common molecules
      "H₂", "O₂", "N₂", "Cl₂", "F₂", "Br₂", "I₂",
      "H₂O", "CO₂", "NH₃", "CH₄", "C₂H₅OH",
      // Acids
      "HCl", "H₂SO₄", "HNO₃", "CH₃COOH", "H₃PO₄",
      // Bases
      "NaOH", "KOH", "Ca(OH)₂", "NH₃",
      // Salts
      "NaCl", "KCl", "CaCl₂", "MgCl₂", "FeCl₂", "FeCl₃",
      "Na₂SO₄", "CuSO₄", "ZnSO₄", "FeSO₄", "MgSO₄",
      "NaNO₃", "KNO₃", "AgNO₃", "Pb(NO₃)₂",
      "CaCO₃", "BaCO₃", "Na₂CO₃",
      // Hydroxides
      "Cu(OH)₂", "Fe(OH)₂", "Fe(OH)₃", "Al(OH)₃",
      // Other common
      "NaHCO₃", "KMnO₄", "H₂O₂", "CuO", "MgO", "Na₂O₂", "KOH",
      "AgCl", "PbI₂", "BaSO₄", "PbSO₄",
      // Indicators
      "C₂₀H₁₄O₄", "C₁₆H₁₈ClN₃S", "Litmus", "UI",
    ];

    for (const formula of common) {
      this.register(formula);
    }
  }

  /**
   * Register a substance formula
   */
  register(formula: string, id?: string) {
    this.validFormulas.add(formula);
    if (id) {
      this.formulaToId.set(formula, id);
      this.idToFormula.set(id, formula);
    }
  }

  /**
   * Register multiple substances from Chemical array
   */
  registerChemicals(chemicals: Chemical[]) {
    for (const chemical of chemicals) {
      this.register(chemical.formula, chemical.id);
    }
  }

  /**
   * Check if formula is registered
   */
  isRegistered(formula: string): boolean {
    return this.validFormulas.has(formula);
  }

  /**
   * Get ID for formula
   */
  getIdForFormula(formula: string): string | null {
    return this.formulaToId.get(formula) || null;
  }

  /**
   * Get formula for ID
   */
  getFormulaForId(id: string): string | null {
    return this.idToFormula.get(id) || null;
  }

  /**
   * Get all registered formulas
   */
  getAllFormulas(): string[] {
    return Array.from(this.validFormulas);
  }
}

// Singleton registry
export const substanceRegistry = new SubstanceRegistry();

/**
 * Validate a substance ID exists and has valid formula
 */
export function validateSubstanceId(id: string): SubstanceValidation {
  const formula = substanceRegistry.getFormulaForId(id);

  if (!formula) {
    loggers.validator.warn("Unknown substance ID", { id });
    return {
      isValid: false,
      formula: "",
      reason: `Substance ID '${id}' not registered`,
      suggestions: ["Register the substance in the database", "Check the ID spelling"],
    };
  }

  return {
    isValid: true,
    formula,
  };
}

/**
 * Validate a substance formula is registered
 */
export function validateSubstanceFormula(formula: string): SubstanceValidation {
  if (!substanceRegistry.isRegistered(formula)) {
    loggers.validator.warn("Unknown substance formula", { formula });
    return {
      isValid: false,
      formula,
      reason: `Formula '${formula}' not registered in substance database`,
      suggestions: ["Add the formula to the registry", "Check the formula spelling"],
    };
  }

  return {
    isValid: true,
    formula,
  };
}

/**
 * Validate all substances in a reaction
 */
export function validateReactionSubstances(
  reactants: string[],
  products: string[]
): {
  valid: boolean;
  invalidReactants: string[];
  invalidProducts: string[];
  details: Record<string, SubstanceValidation>;
} {
  const invalidReactants: string[] = [];
  const invalidProducts: string[] = [];
  const details: Record<string, SubstanceValidation> = {};

  for (const reactant of reactants) {
    const validation = validateSubstanceFormula(reactant);
    details[reactant] = validation;
    if (!validation.isValid) {
      invalidReactants.push(reactant);
    }
  }

  for (const product of products) {
    const validation = validateSubstanceFormula(product);
    details[product] = validation;
    if (!validation.isValid) {
      invalidProducts.push(product);
    }
  }

  const valid = invalidReactants.length === 0 && invalidProducts.length === 0;

  if (!valid) {
    loggers.validator.warn("Invalid substances in reaction", {
      invalidReactants,
      invalidProducts,
    });
  }

  return {
    valid,
    invalidReactants,
    invalidProducts,
    details,
  };
}

/**
 * Check for circular dependencies in reaction chains
 * Prevents infinite loops where products of one reaction are reactants of another
 */
export function checkCircularDependency(
  reactionChain: Array<{ reactants: string[]; products: string[] }>
): CircularDependencyCheck {
  if (reactionChain.length === 0) {
    return {
      hasCircular: false,
      description: "No reaction chain to analyze",
    };
  }

  // Build dependency graph
  const graph = new Map<string, Set<string>>();

  for (const reaction of reactionChain) {
    for (const reactant of reaction.reactants) {
      if (!graph.has(reactant)) {
        graph.set(reactant, new Set());
      }
      for (const product of reaction.products) {
        graph.get(reactant)!.add(product);
      }
    }
  }

  // DFS to detect cycles
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  for (const node of graph.keys()) {
    const cycle = detectCycleDFS(node, graph, visited, recursionStack);
    if (cycle) {
      loggers.validator.error("Circular dependency detected", { cycle });
      return {
        hasCircular: true,
        cycle,
        description: `Circular dependency found: ${cycle.join(" → ")}`,
      };
    }
  }

  return {
    hasCircular: false,
    description: "No circular dependencies detected",
  };
}

/**
 * DFS helper for cycle detection
 */
function detectCycleDFS(
  node: string,
  graph: Map<string, Set<string>>,
  visited: Set<string>,
  recursionStack: Set<string>
): string[] | null {
  visited.add(node);
  recursionStack.add(node);

  const neighbors = graph.get(node) || new Set();

  for (const neighbor of neighbors) {
    if (!visited.has(neighbor)) {
      const cycle = detectCycleDFS(neighbor, graph, visited, recursionStack);
      if (cycle) {
        return cycle;
      }
    } else if (recursionStack.has(neighbor)) {
      // Found a cycle
      return [node, neighbor];
    }
  }

  recursionStack.delete(node);
  return null;
}

/**
 * Validate phase compatibility
 */
export function validatePhaseCompatibility(
  chemicals: Chemical[]
): {
  compatible: boolean;
  warning?: string;
} {
  const phases = chemicals.map((c) => c.state);
  const hasLiquid = phases.includes("liquid");
  const hasSolid = phases.includes("solid");
  const hasGas = phases.includes("gas");

  // Gases don't mix well with solids in containers without special equipment
  if (hasGas && (hasSolid || hasLiquid)) {
    return {
      compatible: false,
      warning: "Gases require special collection apparatus (gas jar) when mixed with solids/liquids",
    };
  }

  return {
    compatible: true,
  };
}

/**
 * Validate temperature conditions for reaction
 */
export function validateTemperatureCondition(
  currentTemp: number,
  requiredMinTemp?: number,
  requiredMaxTemp?: number
): {
  suitable: boolean;
  reason?: string;
} {
  if (requiredMinTemp !== undefined && currentTemp < requiredMinTemp) {
    return {
      suitable: false,
      reason: `Temperature too low (${currentTemp}°C < ${requiredMinTemp}°C required)`,
    };
  }

  if (requiredMaxTemp !== undefined && currentTemp > requiredMaxTemp) {
    return {
      suitable: false,
      reason: `Temperature too high (${currentTemp}°C > ${requiredMaxTemp}°C maximum)`,
    };
  }

  return {
    suitable: true,
  };
}
