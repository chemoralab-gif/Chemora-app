/**
 * Chemistry Engine Integration Utilities
 * Bridges the gap between ChemistryEngine and React UI Components
 * Provides deterministic state management for containers
 */

import { Chemical, Reaction } from "./reactions";
import { ChemistryEngine, ReactionExecutionResult } from "./chemistryEngine";
import { CHEMICALS, REACTIONS } from "./reactions";
import { loggers } from "./logger";

export interface UIReactionState {
  // Basic reaction info
  reaction: Reaction | null;
  reactants: Chemical[];
  products: Chemical[];
  
  // Stoichiometry
  limitingReactant: string | null;
  excessReactants: string[];
  molarRatios: Record<string, number>;
  
  // Physical effects
  temperature: number;
  phaseChanges: Array<{
    chemical: string;
    from: "solid" | "liquid" | "gas";
    to: "solid" | "liquid" | "gas";
    description: string;
  }>;
  
  // Solubility & Precipitation
  filtration: {
    solids: string[];
    filtrate: string[];
    description: string;
  } | null;
  
  // Visual feedback
  displayColor: string | null;
  effectType: string;
  intensity: number;
  
  // History & Debugging
  executionTimestamp: number;
  deterministic: boolean;
  warnings: string[];
}

export interface DeterministicContainerState {
  chemicals: Chemical[];
  temperature: number;
  attachedApparatuses: string[]; // Apparatus IDs
  reactionHistory: UIReactionState[];
  volume: number; // mL
  pH: number | null;
  collectedGases: Chemical[];
  transferLog: Array<{
    timestamp: number;
    sourceContainer: string;
    amount: number;
    substance: string;
  }>;
  hash: string; // For deterministic verification
}

/**
 * Global Chemistry Engine Singleton
 * Ensures consistent, deterministic reactions across all containers
 */
let globalEngine: ChemistryEngine | null = null;

export function initializeGlobalChemistryEngine(): ChemistryEngine {
  if (!globalEngine) {
    loggers.ui.info("Initializing global Chemistry Engine");
    globalEngine = new ChemistryEngine(REACTIONS, CHEMICALS);
  }
  return globalEngine;
}

export function getGlobalChemistryEngine(): ChemistryEngine {
  if (!globalEngine) {
    return initializeGlobalChemistryEngine();
  }
  return globalEngine;
}

/**
 * Execute a reaction through the engine and prepare for UI
 * Returns deterministic, repeatable result
 */
export function executeReactionForUI(
  chemicals: Chemical[],
  temperature: number = 25,
  apparatus: string[] = []
): UIReactionState {
  const engine = getGlobalChemistryEngine();

  loggers.ui.debug("Executing reaction for UI", {
    chemicals: chemicals.map((c) => c.formula),
    temperature,
    apparatus,
  });

  // Execute through engine
  const result = engine.executeReaction(chemicals, temperature, {
    apparatus: apparatus.map((id) => ({ id })),
  });

  // Transform to UI state
  const uiState: UIReactionState = {
    reaction: result.reaction,
    reactants: result.reactants,
    products: result.products,
    limitingReactant: result.limitingReactant,
    excessReactants: result.excessReactants,
    molarRatios: {},
    temperature: result.temperature,
    phaseChanges: [],
    filtration: null,
    displayColor:
      result.reaction?.indicatorColor ||
      result.products[0]?.color ||
      null,
    effectType: result.reaction?.effect || "color-change",
    intensity: result.reaction?.intensity || 0,
    executionTimestamp: Date.now(),
    deterministic: result.success,
    warnings: result.warnings,
  };

  loggers.ui.info("Reaction executed for UI", {
    success: result.success,
    reaction: result.reaction?.equation,
  });

  return uiState;
}

/**
 * Validate that the same chemicals produce the same reaction
 * Used for testing determinism
 */
export function validateDeterministicBehavior(
  chemicals: Chemical[],
  temperature: number = 25,
  iterations: number = 3
): boolean {
  const engine = getGlobalChemistryEngine();
  const results: ReactionExecutionResult[] = [];

  loggers.ui.debug("Testing deterministic behavior", {
    chemicals: chemicals.map((c) => c.formula),
    iterations,
  });

  for (let i = 0; i < iterations; i++) {
    const result = engine.executeReaction(chemicals, temperature);
    results.push(result);
  }

  // All results should be identical
  const firstReaction = results[0].reaction?.equation || "NO_REACTION";
  const consistent = results.every(
    (r) => (r.reaction?.equation || "NO_REACTION") === firstReaction
  );

  loggers.ui.info("Determinism check", {
    consistent,
    reaction: firstReaction,
  });

  return consistent;
}

/**
 * Calculate container state hash for deterministic verification
 * Used to detect state drift
 */
export function calculateContainerStateHash(
  state: DeterministicContainerState
): string {
  const data = {
    chemicals: state.chemicals.map((c) => c.formula).sort().join("|"),
    temperature: state.temperature,
    apparatus: state.attachedApparatuses.sort().join("|"),
    volume: state.volume,
    pH: state.pH,
    reactionCount: state.reactionHistory.length,
  };

  // Simple hash (not cryptographic, just for comparison)
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Merge two container states deterministically
 * Respects stoichiometry and limiting reactants
 */
export function mergeContainerStates(
  source: DeterministicContainerState,
  target: DeterministicContainerState
): DeterministicContainerState {
  const engine = getGlobalChemistryEngine();

  loggers.ui.debug("Merging container states", {
    sourceChemicals: source.chemicals.length,
    targetChemicals: target.chemicals.length,
  });

  // Combine chemicals
  const mergedChemicals = [...source.chemicals, ...target.chemicals];
  const mergedTemperature = Math.max(source.temperature, target.temperature);

  // Execute reaction with merged chemicals
  const reactionResult = engine.executeReaction(
    mergedChemicals,
    mergedTemperature
  );

  // Create new state with merged data
  const uiState = executeReactionForUI(
    mergedChemicals,
    mergedTemperature,
    target.attachedApparatuses
  );

  const newState: DeterministicContainerState = {
    chemicals: reactionResult.products,
    temperature: mergedTemperature,
    attachedApparatuses: [
      ...new Set([...source.attachedApparatuses, ...target.attachedApparatuses]),
    ],
    reactionHistory: [...source.reactionHistory, ...target.reactionHistory, uiState],
    volume: source.volume + target.volume,
    pH:
      reactionResult.products.length > 0
        ? calculatePHForChemicals(reactionResult.products)
        : null,
    collectedGases: [...source.collectedGases, ...target.collectedGases],
    transferLog: [
      ...source.transferLog,
      ...target.transferLog,
      {
        timestamp: Date.now(),
        sourceContainer: "merge",
        amount: source.volume,
        substance: "transfer",
      },
    ],
    hash: "",
  };

  newState.hash = calculateContainerStateHash(newState);

  loggers.ui.info("Container states merged", {
    newChemicals: newState.chemicals.length,
    newTemperature: newState.temperature,
  });

  return newState;
}

/**
 * Calculate pH for a set of chemicals
 */
function calculatePHForChemicals(chemicals: Chemical[]): number | null {
  const CHEMICAL_PH: Record<string, number> = {
    HCl: 1,
    H2SO4: 0.5,
    HNO3: 1,
    CH3COOH: 3,
    H3PO4: 2,
    C6H8O7: 2.5,
    H2CO3: 4,
    H2O: 7,
    NaOH: 14,
    KOH: 14,
    "Ca(OH)2": 12,
    NH3: 11,
    NaCl: 7,
    NaHCO3: 8.5,
    CuSO4: 4,
    H2O2: 6,
  };

  const phChemicals = chemicals.filter(
    (c) => CHEMICAL_PH[c.formula] !== undefined
  );

  if (phChemicals.length === 0) {
    return null;
  }

  const total = phChemicals.reduce(
    (sum, c) => sum + (CHEMICAL_PH[c.formula] ?? 7),
    0
  );

  return Math.round((total / phChemicals.length) * 10) / 10;
}

/**
 * Create initial container state
 */
export function createInitialContainerState(
  volume: number = 500
): DeterministicContainerState {
  return {
    chemicals: [],
    temperature: 25,
    attachedApparatuses: [],
    reactionHistory: [],
    volume,
    pH: null,
    collectedGases: [],
    transferLog: [],
    hash: calculateContainerStateHash({
      chemicals: [],
      temperature: 25,
      attachedApparatuses: [],
      reactionHistory: [],
      volume,
      pH: null,
      collectedGases: [],
      transferLog: [],
      hash: "",
    }),
  };
}

/**
 * Export engine diagnostics
 */
export function getEngineDiagnostics() {
  const engine = getGlobalChemistryEngine();
  return {
    registered: engine.getRegisteredSubstances(),
    info: engine.getDebugInfo(),
    timestamp: Date.now(),
  };
}
