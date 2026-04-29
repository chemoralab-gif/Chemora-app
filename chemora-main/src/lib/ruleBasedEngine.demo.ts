/**
 * Rule-Based Chemistry Engine - Test Suite & Demonstrations
 * Shows usage of all new features
 */

import {
  RuleBasedReactionEngine,
  predictReaction,
  predictReactionFromString,
} from "@/lib/ruleBasedEngine";
import { createConditions } from "@/lib/conditionSystem";
import { getElementData } from "@/lib/elementData";
import { precacheCommonElements, getCacheStats } from "@/lib/elementCache";

/**
 * Demo 1: Basic Ionic Reaction
 * Sodium + Chlorine → Sodium Chloride (table salt)
 */
export function demo1_basicIonic() {
  console.log("\n=== DEMO 1: Ionic Reaction ===");
  console.log("Na + Cl2 → NaCl");

  const result = predictReaction(["Na", "Cl2"], ["NaCl"]);

  console.log("Outcome:", result.outcome);
  console.log("Reaction Type:", result.reaction_type);
  console.log("Balanced:", result.balanced_equation);
  console.log("Feasible:", result.feasible);
  console.log("Energy:", result.energy_change);
}

/**
 * Demo 2: Ionic Precipitation Reaction
 * Silver Nitrate + Sodium Chloride → Silver Chloride (white precipitate)
 */
export function demo2_precipitation() {
  console.log("\n=== DEMO 2: Precipitation Reaction ===");
  console.log("AgNO3 + NaCl → AgCl (white solid) + NaNO3");

  const result = predictReaction(["AgNO3", "NaCl"], ["AgCl", "NaNO3"]);

  console.log("Outcome:", result.outcome);
  console.log("Balanced:", result.balanced_equation);
  console.log("Is Precipitation:", result.is_precipitation);
  console.log("Feasible:", result.feasible);
}

/**
 * Demo 3: Covalent Reaction
 * Hydrogen + Oxygen → Water
 */
export function demo3_covalent() {
  console.log("\n=== DEMO 3: Covalent Reaction ===");
  console.log("H2 + O2 → H2O");

  const result = predictReaction(["H2", "O2"], ["H2O"]);

  console.log("Reaction Type:", result.reaction_type);
  console.log("Balanced:", result.balanced_equation);
  console.log("Coefficients:", result.balanced_coefficients);
}

/**
 * Demo 4: Decomposition Reaction (endothermic)
 * Calcium Carbonate → Calcium Oxide + Carbon Dioxide
 * Occurs at high temperature (limestone in furnace)
 */
export function demo4_decomposition() {
  console.log("\n=== DEMO 4: Thermal Decomposition ===");
  console.log("CaCO3 → CaO + CO2 (at 800°C)");

  // High temperature condition
  const highTemp = createConditions(800, 1, "solid");
  const result = predictReaction(["CaCO3"], ["CaO", "CO2"], highTemp);

  console.log("Outcome:", result.outcome);
  console.log("Balanced:", result.balanced_equation);
  console.log("Energy Type:", result.energy_change);
  console.log("Feasible at 800°C:", result.feasible);
  console.log("Gas Forming:", result.is_gas_forming);
}

/**
 * Demo 5: Element Data Lookup
 * Show expanded periodic table information
 */
export function demo5_elementData() {
  console.log("\n=== DEMO 5: Element Data ===");

  const sodium = getElementData("Na");
  const chlorine = getElementData("Cl");

  if (sodium) {
    console.log("Sodium (Na):");
    console.log("  - Atomic Number:", sodium.atomicNumber);
    console.log("  - Valence Electrons:", sodium.valence);
    console.log("  - Oxidation States:", sodium.oxidationStates);
    console.log("  - Electronegativity:", sodium.electronegativity);
    console.log("  - Ionization Energy:", sodium.ionizationEnergy, "kJ/mol");
    console.log("  - Group:", sodium.group, "| Period:", sodium.period);
  }

  if (chlorine) {
    console.log("\nChlorine (Cl):");
    console.log("  - Atomic Number:", chlorine.atomicNumber);
    console.log("  - Valence Electrons:", chlorine.valence);
    console.log("  - Oxidation States:", chlorine.oxidationStates);
    console.log("  - Electronegativity:", chlorine.electronegativity);
  }
}

/**
 * Demo 6: Constraint & Condition Checking
 * Noble gas constraints - why Helium doesn't react
 */
export function demo6_constraints() {
  console.log("\n=== DEMO 6: Noble Gas Constraints ===");
  console.log("Trying: He + Cl2 → HeCl2 (should fail)");

  const result = predictReaction(["He", "Cl2"], ["HeCl2"]);

  console.log("Outcome:", result.outcome);
  console.log("Feasible:", result.feasible);
  console.log("Reason:", result.reason);
  console.log("Constraints Passed:", result.constraints_passed);
}

/**
 * Demo 7: String Format Input
 * Parse reaction from string notation
 */
export function demo7_stringFormat() {
  console.log("\n=== DEMO 7: String Format Parsing ===");
  console.log('Input: "2Na + 2H2O → 2NaOH + H2"');

  const result = predictReactionFromString("2Na + 2H2O → 2NaOH + H2");

  console.log("Parsed OK");
  console.log("Balanced:", result.balanced_equation);
  console.log("Coefficients R:", result.balanced_coefficients.reactants);
  console.log("Coefficients P:", result.balanced_coefficients.products);
}

/**
 * Demo 8: Equation Balancing
 * Complex reaction balancing
 */
export function demo8_balancing() {
  console.log("\n=== DEMO 8: Automatic Equation Balancing ===");
  console.log("Fe + O2 → Fe2O3 (combustion of iron)");

  const result = predictReaction(["Fe", "O2"], ["Fe2O3"]);

  console.log("Outcome:", result.outcome);
  console.log("Balanced:", result.balanced_equation);
  console.log("Coefficients: reactants →", result.balanced_coefficients.reactants, "| products →", result.balanced_coefficients.products);
}

/**
 * Demo 9: Performance - Caching
 * Show cache effectiveness
 */
export function demo9_caching() {
  console.log("\n=== DEMO 9: Element Cache Performance ===");

  precacheCommonElements();

  // Make multiple predictions to stress cache
  predictReaction(["Na", "Cl2"], ["NaCl"]);
  predictReaction(["Na", "O2"], ["Na2O"]);
  predictReaction(["Cl2", "Cl2"], ["Cl4"]); // Invalid but tests lookup
  predictReaction(["H2", "O2"], ["H2O"]);

  const stats = getCacheStats();

  console.log("Cache Statistics:");
  console.log("  - Total Requests:", stats.totalRequests);
  console.log("  - Cache Hits:", stats.hits);
  console.log("  - Cache Misses:", stats.misses);
  console.log("  - Hit Rate:", (stats.hitRate * 100).toFixed(1) + "%");
}

/**
 * Demo 10: Custom Conditions
 * Reaction feasibility varies with conditions
 */
export function demo10_customConditions() {
  console.log("\n=== DEMO 10: Condition-Dependent Reactions ===");

  // Normal conditions
  const normal = createConditions(25, 1, "aqueous");
  const result1 = predictReaction(["NaCl"], ["Na", "Cl2"], normal);

  console.log("At 25°C, 1 atm (aqueous):");
  console.log("  NaCl → Na + Cl2");
  console.log("  Outcome:", result1.outcome);
  console.log("  Feasible:", result1.feasible);

  // High temperature (melting)
  const molten = createConditions(850, 1, "molten");
  const result2 = predictReaction(["NaCl"], ["Na", "Cl2"], molten);

  console.log("\nAt 850°C, 1 atm (molten) - electrolysis:");
  console.log("  NaCl → Na + Cl2");
  console.log("  Outcome:", result2.outcome);
  console.log("  Feasible:", result2.feasible);
}

/**
 * Run all demos
 */
export function runAllDemos() {
  console.log("╔════════════════════════════════════════╗");
  console.log("║ Rule-Based Chemistry Engine Demos      ║");
  console.log("║                                        ║");
  console.log("║ Shows all new engine features          ║");
  console.log("╚════════════════════════════════════════╝");

  try {
    demo1_basicIonic();
    demo2_precipitation();
    demo3_covalent();
    demo4_decomposition();
    demo5_elementData();
    demo6_constraints();
    demo7_stringFormat();
    demo8_balancing();
    demo9_caching();
    demo10_customConditions();

    console.log("\n✅ All demos completed successfully!");
  } catch (error) {
    console.error("❌ Demo error:", error);
  }
}

// Run on import (for testing)
if (typeof window !== "undefined") {
  // Browser environment
  interface WindowWithDemos extends Window {
    runChemistryDemos?: typeof runAllDemos;
  }
  (window as WindowWithDemos).runChemistryDemos = runAllDemos;
}

export default runAllDemos;
