/**
 * Rule-Based Chemistry Engine
 * Orchestrates all rule systems to predict reactions
 * Integrates: bonding, balancing, constraints, conditions, solubility
 */

import { balanceEquation, BalancedEquation } from "./equationBalancer";
import { analyzeIonicBond } from "./ionicBonding";
import { analyzeCovalentBond } from "./covalentBonding";
import { validateReactionConstraints, passesAllConstraints } from "./constraintValidator";
import { checkConditionFeasibility, ReactionConditions, STANDARD_CONDITIONS } from "./conditionSystem";
import { formatEquationWithStates, isPrecipitationReaction, isGasFormingReaction, dissociateCompound, checkSolubilityRules } from "./solubilityRules";
import { getCachedElementData, precacheCommonElements } from "./elementCache";
import { getElementData } from "./elementData";

export interface RuleBasedReactionResult {
  reactants: string[];
  products: string[];
  balanced_equation: string;
  reaction_type: "ionic" | "covalent" | "combination" | "decomposition" | "unknown";
  outcome: "reaction" | "no_reaction" | "dissolution";
  feasible: boolean;
  reason: string;
  balanced_coefficients: {
    reactants: number[];
    products: number[];
  };
  energy_change?: "exothermic" | "endothermic" | "unknown";
  is_precipitation?: boolean;
  is_gas_forming?: boolean;
  constraints_passed: boolean;
  condition_violations: string[];
}

/**
 * Main rule-based reaction predictor
 */
export class RuleBasedReactionEngine {
  private conditions: ReactionConditions;

  constructor(conditions: ReactionConditions = STANDARD_CONDITIONS) {
    this.conditions = conditions;
    precacheCommonElements();
  }

  /**
   * Predict reaction between two or more substances
   * Returns unified result with outcome: "reaction" | "no_reaction" | "dissolution"
   */
  predictReaction(
    reactants: string[],
    products: string[],
    customConditions?: ReactionConditions
  ): RuleBasedReactionResult {
    const conditions = customConditions || this.conditions;

    // Validate inputs
    if (!reactants.length) {
      return this.createNoReactionResult(
        reactants,
        products,
        "Invalid input: no reactants provided"
      );
    }

    // Check for DISSOLUTION case (ionic compound + water)
    if (products.length === 0 || (reactants.length === 1 && reactants[0] === "water")) {
      const dissolutionResult = this.checkDissolution(reactants, conditions);
      if (dissolutionResult) {
        return dissolutionResult;
      }
    }

    // Single reactant with water in products suggests dissolution
    if (reactants.length === 1 && reactants[0] !== "H2O" && products.includes("H2O")) {
      const dissolutionResult = this.checkDissolution(reactants, conditions);
      if (dissolutionResult) {
        return dissolutionResult;
      }
    }

    // Check for NO REACTION cases
    const noReactionReason = this.checkNoReaction(reactants, products);
    if (noReactionReason) {
      return this.createNoReactionResult(reactants, products, noReactionReason);
    }

    // Fallback: ensure products are provided
    if (!products.length) {
      return this.createNoReactionResult(
        reactants,
        products,
        "No products specified or reaction is not feasible"
      );
    }

    // REACTION case: perform full analysis
    return this.analyzeChemicalReaction(reactants, products, conditions);
  }

  /**
   * Check if reaction should result in "no_reaction" outcome
   */
  private checkNoReaction(reactants: string[], products: string[]): string | null {
    // Check for noble gas in reactants
    for (const reactant of reactants) {
      const element = this.extractSingleElement(reactant);
      if (element) {
        const elementData = getElementData(element);
        if (elementData && elementData.category === "noble-gas" && element !== "Xe") {
          return `${element} is a noble gas and extremely unreactive`;
        }
      }
    }

    // Both reactants are noble gases
    if (reactants.length === 2) {
      const el1 = this.extractSingleElement(reactants[0]);
      const el2 = this.extractSingleElement(reactants[1]);

      if (el1 && el2) {
        const data1 = getElementData(el1);
        const data2 = getElementData(el2);

        if (
          data1?.category === "noble-gas" &&
          data2?.category === "noble-gas"
        ) {
          return "Both reactants are noble gases - no reaction possible";
        }
      }
    }

    return null;
  }

  /**
   * Check if this is a dissolution case (ionic compound + water)
   */
  private checkDissolution(reactants: string[], conditions: ReactionConditions): RuleBasedReactionResult | null {
    // Only one reactant for dissolution
    if (reactants.length !== 1) return null;

    const compound = reactants[0];

    // Check if it's soluble
    const solubility = checkSolubilityRules(compound);

    if (solubility === "soluble") {
      const dissociation = dissociateCompound(compound);

      if (dissociation.feasible && dissociation.ions.length > 0) {
        const balanceCoeffs = Array(1).fill(1); // Reactant coefficient
        const productCoeffs = Array(dissociation.ions.length).fill(1);

        const balancedEquation = `${compound}(s) → ${dissociation.ions.map((ion) => `${ion}(aq)`).join(" + ")}`;

        return {
          reactants,
          products: dissociation.ions,
          balanced_equation: balancedEquation,
          reaction_type: "ionic",
          outcome: "dissolution",
          feasible: true,
          reason: "Ionic compound dissolves in water, dissociating into ions",
          balanced_coefficients: {
            reactants: balanceCoeffs,
            products: productCoeffs,
          },
          energy_change: "unknown",
          is_precipitation: false,
          is_gas_forming: false,
          constraints_passed: true,
          condition_violations: [],
        };
      }
    }

    return null;
  }

  /**
   * Analyze a standard chemical reaction
   */
  private analyzeChemicalReaction(
    reactants: string[],
    products: string[],
    conditions: ReactionConditions
  ): RuleBasedReactionResult {
    // Check constraints
    const constraintResults = validateReactionConstraints(reactants, products);
    const constraintsPassed = passesAllConstraints(constraintResults);

    if (!constraintsPassed) {
      const errors = constraintResults
        .filter((c) => c.severity === "error")
        .map((c) => c.message);

      return this.createNoReactionResult(
        reactants,
        products,
        `Constraint violations: ${errors.join(", ")}`
      );
    }

    // Check conditions
    const allCompounds = [...reactants, ...products];
    const { feasible: conditionsFeasible, violations } = checkConditionFeasibility(
      allCompounds,
      conditions
    );

    const conditionViolations = violations.map((v) => v.description);

    // Determine reaction type
    const reactionType = this.determineReactionType(reactants, products);

    // Balance equation
    const balanced = balanceEquation(reactants, products);

    if (!balanced.isBalanced) {
      return this.createNoReactionResult(
        reactants,
        products,
        "Could not balance equation"
      );
    }

    // Determine if precipitation/gas forming
    const isPrecipitation = isPrecipitationReaction(reactants, products);
    const isGasForming = isGasFormingReaction(products);

    // Format with state symbols
    const balancedWithStates = formatEquationWithStates(
      reactants,
      products,
      balanced.reactantCoefficients,
      balanced.productCoefficients
    );

    // Estimate energy change
    const energyChange = this.estimateEnergyChange(reactionType);

    // Overall feasibility
    const overallFeasible = constraintsPassed && conditionsFeasible;

    return {
      reactants,
      products,
      balanced_equation: balancedWithStates,
      reaction_type: reactionType,
      outcome: overallFeasible ? "reaction" : "no_reaction",
      feasible: overallFeasible,
      reason: overallFeasible
        ? "Reaction is feasible under given conditions"
        : `Reaction not feasible. Condition violations: ${conditionViolations.join(", ")}`,
      balanced_coefficients: {
        reactants: balanced.reactantCoefficients,
        products: balanced.productCoefficients,
      },
      energy_change: energyChange,
      is_precipitation: isPrecipitation,
      is_gas_forming: isGasForming,
      constraints_passed: constraintsPassed,
      condition_violations: conditionViolations,
    };
  }

  /**
   * Extract single element from compound formula
   * Example: "Na" → "Na", "NaCl" → "Na" (returns first element)
   */
  private extractSingleElement(formula: string): string | null {
    const regex = /([A-Z][a-z]?)/;
    const match = formula.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Determine reaction type
   */
  private determineReactionType(
    reactants: string[],
    products: string[]
  ): "ionic" | "covalent" | "combination" | "decomposition" | "unknown" {
    // Decomposition: 1 reactant → multiple products
    if (reactants.length === 1 && products.length > 1) {
      return "decomposition";
    }

    // Combination: multiple reactants → 1 product
    if (reactants.length > 1 && products.length === 1) {
      return "combination";
    }

    // Extract elements from first pair
    if (reactants.length >= 1 && products.length >= 1) {
      const firstReactant = reactants[0];
      const firstProduct = products[0];

      // Get elements
      const extractElements = (formula: string): string[] => {
        const regex = /([A-Z][a-z]?)/g;
        const matches = formula.match(regex);
        return matches ? Array.from(new Set(matches)) : [];
      };

      const reactantElements = extractElements(firstReactant);
      const productElements = extractElements(firstProduct);

      // Check for ionic/covalent patterns
      if (reactantElements.length === 2) {
        const [el1, el2] = reactantElements;

        const el1Data = getCachedElementData(el1);
        const el2Data = getCachedElementData(el2);

        if (el1Data && el2Data) {
          const el1IsMetal = el1Data.category === "metal";
          const el2IsMetal = el2Data.category === "metal";

          if (el1IsMetal !== el2IsMetal) {
            return "ionic";
          } else if (!el1IsMetal && !el2IsMetal) {
            return "covalent";
          }
        }
      }
    }

    return "unknown";
  }

  /**
   * Estimate energy change
   */
  private estimateEnergyChange(
    reactionType: string
  ): "exothermic" | "endothermic" | "unknown" {
    // Simplistic: combustion and ionic formation are exothermic
    // Decomposition is endothermic
    if (reactionType === "combination" || reactionType === "ionic") {
      return "exothermic";
    }

    if (reactionType === "decomposition") {
      return "endothermic";
    }

    return "unknown";
  }

  /**
   * Create a "no_reaction" result
   */
  private createNoReactionResult(
    reactants: string[],
    products: string[],
    reason: string
  ): RuleBasedReactionResult {
    return {
      reactants,
      products,
      balanced_equation: "No reaction",
      reaction_type: "unknown",
      outcome: "no_reaction",
      feasible: false,
      reason,
      balanced_coefficients: {
        reactants: Array(reactants.length).fill(1),
        products: Array(products.length).fill(1),
      },
      energy_change: "unknown",
      constraints_passed: false,
      condition_violations: [reason],
    };
  }

  /**
   * Create failure result (deprecated - use createNoReactionResult)
   */
  private createFailureResult(
    reactants: string[],
    products: string[],
    reason: string
  ): RuleBasedReactionResult {
    return this.createNoReactionResult(reactants, products, reason);
  }

  /**
   * Set reaction conditions
   */
  setConditions(conditions: ReactionConditions): void {
    this.conditions = conditions;
  }

  /**
   * Get current conditions
   */
  getConditions(): ReactionConditions {
    return { ...this.conditions };
  }
}

/**
 * Convenience function to create and use engine
 */
export function predictReaction(
  reactants: string[],
  products: string[],
  conditions?: ReactionConditions
): RuleBasedReactionResult {
  const engine = new RuleBasedReactionEngine(conditions);
  return engine.predictReaction(reactants, products, conditions);
}

/**
 * Batch predict multiple reactions
 */
export function predictMultipleReactions(
  reactionPairs: Array<{ reactants: string[]; products: string[] }>,
  conditions?: ReactionConditions
): RuleBasedReactionResult[] {
  const engine = new RuleBasedReactionEngine(conditions);
  return reactionPairs.map((pair) => engine.predictReaction(pair.reactants, pair.products, conditions));
}

/**
 * Predict reaction from string format
 * Example: "Na + Cl2 → NaCl"
 */
export function predictReactionFromString(
  reactionString: string,
  conditions?: ReactionConditions
): RuleBasedReactionResult {
  const [reactantStr, productStr] = reactionString.split("→");

  if (!reactantStr || !productStr) {
    return {
      reactants: [],
      products: [],
      balanced_equation: "",
      reaction_type: "unknown",
      outcome: "no_reaction",
      feasible: false,
      reason: "Invalid reaction string format",
      balanced_coefficients: { reactants: [], products: [] },
      constraints_passed: false,
      condition_violations: [],
    };
  }

  const reactants = reactantStr.split("+").map((s) => s.trim()).filter((s) => s.length > 0);
  const products = productStr.split("+").map((s) => s.trim()).filter((s) => s.length > 0);

  return predictReaction(reactants, products, conditions);
}
