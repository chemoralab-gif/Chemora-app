/**
 * Chemistry Engine Test Utilities
 * Helps validate deterministic behavior and correctness
 * 
 * Run these tests to ensure engine integrity
 */

import { createChemistryEngine, ReactionExecutionResult } from "./chemistryEngine";
import {
  parseReactionEquation,
  calculateLimitingReactant,
  calculateProductQuantities,
  massToMoles,
  molesToMass,
} from "./stoichiometry";
import {
  validateSubstanceFormula,
  checkCircularDependency,
  validateReactionSubstances,
} from "./validator";
import { findBestReaction } from "./reactionMatcher";
import { chemistryLogger, loggers } from "./logger";
import { REACTIONS, CHEMICALS } from "./reactions";

export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  message?: string;
  error?: Error;
}

/**
 * Test suite runner
 */
export class ChemistryEngineTestSuite {
  private results: TestResult[] = [];
  private engine = createChemistryEngine(REACTIONS, CHEMICALS);

  /**
   * Run all tests
   */
  async runAll(): Promise<TestResult[]> {
    console.log("🧪 Starting Chemistry Engine Test Suite...\n");

    await this.testStoichiometryParsing();
    await this.testLimitingReactants();
    await this.testReactionMatching();
    await this.testValidation();
    await this.testDeterminism();
    await this.testPhaseTransitions();
    await this.testSolubility();
    await this.testLogging();
    await this.testEdgeCases();

    this.printResults();
    return this.results;
  }

  private async testStoichiometryParsing() {
    const test = async () => {
      const tests: Array<{
        equation: string;
        expectedReactants: Record<string, number>;
        expectedProducts: Record<string, number>;
      }> = [
        {
          equation: "2Na + 2H2O -> 2NaOH + H2",
          expectedReactants: { Na: 2, H2O: 2 },
          expectedProducts: { NaOH: 2, H2: 1 },
        },
        {
          equation: "Ca + 2HCl -> CaCl2 + H2",
          expectedReactants: { Ca: 1, HCl: 2 },
          expectedProducts: { CaCl2: 1, H2: 1 },
        },
        {
          equation: "CaCO3 -> CaO + CO2",
          expectedReactants: { CaCO3: 1 },
          expectedProducts: { CaO: 1, CO2: 1 },
        },
      ];

      for (const t of tests) {
        const result = parseReactionEquation(t.equation);
        
        if (JSON.stringify(result.reactants) !== JSON.stringify(t.expectedReactants)) {
          throw new Error(`Reactant parsing failed for: ${t.equation}`);
        }
        
        if (JSON.stringify(result.products) !== JSON.stringify(t.expectedProducts)) {
          throw new Error(`Product parsing failed for: ${t.equation}`);
        }
      }
    };

    await this.recordTest("Stoichiometry Parsing", test);
  }

  /**
   * Test limiting reactant calculation
   */
  private async testLimitingReactants() {
    const test = async () => {
      const stoich = parseReactionEquation("2Na + 2H2O -> 2NaOH + H2");
      
      // Na is limiting
      const result1 = calculateLimitingReactant(
        { Na: 1, H2O: 5 },
        stoich
      );
      if (result1.limitingReactant !== "Na") {
        throw new Error("Expected Na as limiting reactant");
      }

      // H2O is limiting
      const result2 = calculateLimitingReactant(
        { Na: 5, H2O: 1 },
        stoich
      );
      if (result2.limitingReactant !== "H2O") {
        throw new Error("Expected H2O as limiting reactant");
      }
    };

    await this.recordTest("Limiting Reactants", test);
  }

  /**
   * Test reaction matching
   */
  private async testReactionMatching() {
    const test = async () => {
      const sodium = CHEMICALS.find((c) => c.formula === "Na");
      const water = CHEMICALS.find((c) => c.formula === "H₂O");

      if (!sodium || !water) {
        throw new Error("Na or H2O not found in CHEMICALS");
      }

      const result = findBestReaction([sodium, water], REACTIONS, 25);

      if (!result.reaction) {
        throw new Error("No reaction found for Na + H₂O");
      }

      if (!result.reaction.equation.includes("NaOH")) {
        throw new Error("Expected NaOH in products");
      }
    };

    await this.recordTest("Reaction Matching", test);
  }

  /**
   * Test validation system
   */
  private async testValidation() {
    const test = async () => {
      // Valid substance
      const valid = validateSubstanceFormula("H2O");
      if (!valid.isValid) {
        throw new Error("H2O should be valid");
      }

      // Invalid substance
      const invalid = validateSubstanceFormula("XYZ123");
      if (invalid.isValid) {
        throw new Error("XYZ123 should be invalid");
      }

      // Circular dependency detection
      const circular = checkCircularDependency([
        { reactants: ["A"], products: ["B"] },
        { reactants: ["B"], products: ["C"] },
        { reactants: ["C"], products: ["A"] },
      ]);
      if (!circular.hasCircular) {
        throw new Error("Should detect circular dependency");
      }

      // Reaction substance validation
      const reactionVal = validateReactionSubstances(
        ["Na", "H2O"],
        ["NaOH", "H2"]
      );
      if (!reactionVal.valid) {
        throw new Error("Valid reaction substances marked as invalid");
      }
    };

    await this.recordTest("Validation System", test);
  }

  /**
   * Test deterministic behavior
   */
  private async testDeterminism() {
    const test = async () => {
      const sodium = CHEMICALS.find((c) => c.formula === "Na");
      const water = CHEMICALS.find((c) => c.formula === "H2O");

      if (!sodium || !water) {
        throw new Error("Na or H2O not found");
      }

      // Execute same reaction 5 times
      const results: ReactionExecutionResult[] = [];
      for (let i = 0; i < 5; i++) {
        const result = this.engine.executeReaction([sodium, water], 25);
        results.push(result);
      }

      // Check all results are identical
      const firstEquation = results[0].reaction?.equation;
      for (const result of results.slice(1)) {
        if (result.reaction?.equation !== firstEquation) {
          throw new Error("Non-deterministic reaction results");
        }
      }

      // Check all limiting reactants are same
      const firstLimiting = results[0].limitingReactant;
      for (const result of results.slice(1)) {
        if (result.limitingReactant !== firstLimiting) {
          throw new Error("Non-deterministic limiting reactant selection");
        }
      }
    };

    await this.recordTest("Deterministic Behavior", test);
  }

  /**
   * Test phase transitions
   */
  private async testPhaseTransitions() {
    const test = async () => {
      const water = CHEMICALS.find((c) => c.formula === "H2O");

      if (!water) {
        throw new Error("H2O not found");
      }

      // Water at room temperature
      const transitions1 = this.engine.checkPhaseTransitions([water], 25);
      if (transitions1.length !== 0) {
        throw new Error("Water should not transition at 25C");
      }

      // Water at boiling point
      const transitions2 = this.engine.checkPhaseTransitions([water], 100);
      if (transitions2.length === 0) {
        throw new Error("Water should transition at 100C");
      }

      const boiling = transitions2.find((t) => t.toState === "gas");
      if (!boiling) {
        throw new Error("Water should boil to gas");
      }
    };

    await this.recordTest("Phase Transitions", test);
  }

  /**
   * Test solubility
   */
  private async testSolubility() {
    const test = async () => {
      const nacl = CHEMICALS.find((c) => c.formula === "NaCl");
      const water = CHEMICALS.find((c) => c.formula === "H₂O");

      if (!nacl || !water) {
        throw new Error("NaCl or H₂O not found");
      }

      const solubility = this.engine.checkSolubility(nacl, water);
      if (!solubility.soluble) {
        throw new Error("NaCl should be soluble in water");
      }

      // Test insoluble compound
      const agcl = {
        id: "agcl",
        name: "Silver Chloride",
        formula: "AgCl",
        color: "hsl(0, 0%, 90%)",
        state: "solid" as const,
        category: "salt" as const,
        reactivity: 0,
        stability: 9,
      };

      const insolubility = this.engine.checkSolubility(agcl, water);
      if (insolubility.soluble) {
        throw new Error("AgCl should be insoluble in water");
      }
    };

    await this.recordTest("Solubility", test);
  }

  /**
   * Test logging system
   */
  private async testLogging() {
    const test = async () => {
      chemistryLogger.clear();
      chemistryLogger.enableAll();

      loggers.engine.info("Test message", { test: true });
      loggers.stoichiometry.debug("Debug message");
      loggers.validator.warn("Warning message");
      loggers.matcher.error("Error message", { code: 500 });

      const logs = chemistryLogger.getLogs();
      if (logs.length !== 4) {
        throw new Error(`Expected 4 logs, got ${logs.length}`);
      }

      const stats = chemistryLogger.getStats();
      if (!stats.byCategory["ChemistryEngine"]) {
        throw new Error("Missing engine logs in stats");
      }

      const json = chemistryLogger.exportAsJSON();
      if (!json.includes("Test message")) {
        throw new Error("Export should contain logged message");
      }
    };

    await this.recordTest("Logging System", test);
  }

  /**
   * Test edge cases
   */
  private async testEdgeCases() {
    const test = async () => {
      // Empty chemicals
      const result1 = this.engine.executeReaction([]);
      if (result1.success) {
        throw new Error("Should fail with no chemicals");
      }

      // Single chemical
      const sodium = CHEMICALS.find((c) => c.formula === "Na");
      if (sodium) {
        const result2 = this.engine.executeReaction([sodium]);
        if (result2.success) {
          throw new Error("Should fail with single chemical");
        }
      }

      // Invalid temperature
      const water = CHEMICALS.find((c) => c.formula === "H₂O");
      if (water) {
        const result3 = this.engine.executeReaction([water], -500);
        // Should still execute, just no phase change
        if (!result3) {
          throw new Error("Should handle negative temperature");
        }
      }
    };

    await this.recordTest("Edge Cases", test);
  }

  /**
   * Record test result
   */
  private async recordTest(name: string, test: () => Promise<void>) {
    const start = performance.now();
    const result: TestResult = { name, passed: true, duration: 0 };

    try {
      await test();
    } catch (error) {
      result.passed = false;
      result.error = error as Error;
      result.message = (error as Error).message;
    }

    result.duration = performance.now() - start;
    this.results.push(result);
  }

  /**
   * Print results
   */
  private printResults() {
    console.log("\n" + "=".repeat(60));
    console.log("📊 Test Results");
    console.log("=".repeat(60) + "\n");

    for (const result of this.results) {
      const icon = result.passed ? "✅" : "❌";
      const status = result.passed ? "PASSED" : "FAILED";
      const duration = result.duration.toFixed(2);

      console.log(
        `${icon} ${result.name.padEnd(35)} ${status.padEnd(10)} ${duration}ms`
      );

      if (result.error) {
        console.log(`   Error: ${result.message}`);
      }
    }

    const passed = this.results.filter((r) => r.passed).length;
    const total = this.results.length;
    const percentage = ((passed / total) * 100).toFixed(1);
    const avgTime = (
      this.results.reduce((sum, r) => sum + r.duration, 0) / total
    ).toFixed(2);

    console.log("\n" + "=".repeat(60));
    console.log(`Results: ${passed}/${total} passed (${percentage}%)`);
    console.log(`Average time: ${avgTime}ms per test`);
    console.log("=".repeat(60) + "\n");
  }
}

/**
 * Run tests (call from browser console or test framework)
 */
export async function runChemistryTests() {
  const suite = new ChemistryEngineTestSuite();
  return await suite.runAll();
}

/**
 * Example usage:
 * 
 * In browser console:
 * ```
 * import { runChemistryTests } from "@/lib/chemistryEngineTest";
 * const results = await runChemistryTests();
 * ```
 * 
 * Or in a React component:
 * ```
 * import { useEffect } from "react";
 * import { runChemistryTests } from "@/lib/chemistryEngineTest";
 * 
 * export function TestComponent() {
 *   useEffect(() => {
 *     runChemistryTests().then(results => {
 *       console.log(results);
 *     });
 *   }, []);
 *   
 *   return <div>Check console for test results</div>;
 * }
 * ```
 */
