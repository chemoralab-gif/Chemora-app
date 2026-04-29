/**
 * Reaction Matcher with Priority System
 * Intelligently matches reactions based on multiple factors
 */

import { Chemical, Reaction } from "./reactions";
import { loggers } from "./logger";

export interface ReactionMatchResult {
  reaction: Reaction | null;
  candidates: Array<{
    reaction: Reaction;
    score: number;
    factors: MatchingFactors;
  }>;
  selectedReason: string;
  description: string;
}

export interface MatchingFactors {
  basicMatch: boolean;
  stateCompatibility: number; // 0-10
  reactivityScore: number; // 0-10
  temperatureSuitability: number; // 0-10
  intensityScore: number; // 0-10
  phaseAlignmentScore: number; // 0-10
  totalScore: number; // Weighted sum
}

/**
 * Priority levels for reaction types
 */
const REACTION_PRIORITIES: Record<string, number> = {
  "explosion": 9,
  "fire": 8,
  "fizz": 7,
  "bubbles": 6,
  "gas-release": 6,
  "precipitate": 5,
  "rust": 4,
  "color-change": 3,
  "indicator-change": 2,
};

/**
 * Phase state values for reactions (higher = more likely to react)
 */
const PHASE_COMPATIBILITY: Record<string, Record<string, number>> = {
  "solid-liquid": 9,   // solid + liquid = good reaction
  "solid-solid": 5,    // solid + solid = difficult
  "liquid-liquid": 10, // liquid + liquid = ideal
  "gas-liquid": 8,     // gas + liquid = good
  "gas-gas": 6,        // gas + gas = possible
  "gas-solid": 4,      // gas + solid = less likely
  "liquid-solid": 9,   // liquid + solid = good
};

/**
 * Find best reaction(s) from available chemicals using priority system
 */
export function findBestReaction(
  chemicals: Chemical[],
  availableReactions: Reaction[],
  temperature: number = 25,
  containerState?: Record<string, unknown>
): ReactionMatchResult {
  loggers.matcher.debug("Finding best reaction", {
    chemicalCount: chemicals.length,
    reactionCount: availableReactions.length,
    temperature,
  });

  if (chemicals.length < 2) {
    return {
      reaction: null,
      candidates: [],
      selectedReason: "Insufficient chemicals",
      description: "Need at least 2 chemicals for a reaction",
    };
  }

  const candidates: Array<{
    reaction: Reaction;
    score: number;
    factors: MatchingFactors;
  }> = [];

  // Find all matching pairs
  for (let i = 0; i < chemicals.length; i++) {
    for (let j = i + 1; j < chemicals.length; j++) {
      const chemical1 = chemicals[i];
      const chemical2 = chemicals[j];

      // Find matching reactions
      // Match reactions by reactant formula, name, or id to be robust to data variations
      const matchingReactions = availableReactions.filter((r) => {
        const a0 = r.reactants[0];
        const a1 = r.reactants[1];
        const chems = [
          { id: chemical1.id, name: chemical1.name, formula: chemical1.formula },
          { id: chemical2.id, name: chemical2.name, formula: chemical2.formula },
        ];

        const matches = (a: string, c: any) => a === c.formula || a === c.name || a === c.id;

        return (
          (matches(a0, chems[0]) && matches(a1, chems[1])) ||
          (matches(a0, chems[1]) && matches(a1, chems[0]))
        );
      });

      for (const reaction of matchingReactions) {
        const factors = calculateMatchingFactors(
          chemical1,
          chemical2,
          reaction,
          temperature,
          containerState
        );

        candidates.push({
          reaction,
          score: factors.totalScore,
          factors,
        });
      }
    }
  }

  if (candidates.length === 0) {
    loggers.matcher.info("No reactions found for chemical pair");
    return {
      reaction: null,
      candidates: [],
      selectedReason: "No matching reactions",
      description: "The chemical combination does not have a match in the reaction database",
    };
  }

  // Sort by score (highest first)
  candidates.sort((a, b) => b.score - a.score);

  // Get best reaction
  const best = candidates[0];

  loggers.matcher.info("Best reaction selected", {
    reaction: best.reaction.equation,
    score: best.score,
    reason: best.factors,
  });

  return {
    reaction: best.reaction,
    candidates,
    selectedReason: `Score: ${best.score.toFixed(1)}/100`,
    description: best.reaction.description,
  };
}

/**
 * Calculate matching factors for a potential reaction
 */
export function calculateMatchingFactors(
  chemical1: Chemical,
  chemical2: Chemical,
  reaction: Reaction,
  temperature: number,
  containerState?: Record<string, unknown>
): MatchingFactors {
  const factors: MatchingFactors = {
    basicMatch: true,
    stateCompatibility: 0,
    reactivityScore: 0,
    temperatureSuitability: 0,
    intensityScore: 0,
    phaseAlignmentScore: 0,
    totalScore: 0,
  };

  // State compatibility (solid-liquid > liquid-liquid > gas-solid)
  const stateKey = combinedStateKey(chemical1.state, chemical2.state);
  factors.stateCompatibility = PHASE_COMPATIBILITY[stateKey] || 0;

  // Reactivity: higher reactivity chemicals should react more easily
  const avgReactivity = (chemical1.reactivity + chemical2.reactivity) / 2;
  factors.reactivityScore = Math.min(avgReactivity * 1.5, 10);

  // Temperature suitability
  if (reaction.effect === "explosion" || reaction.effect === "fire") {
    // Exothermic reactions may need heat to initiate
    factors.temperatureSuitability = temperature >= 20 ? 10 : 8;
  } else if (reaction.effect === "fizz" || reaction.effect === "bubbles") {
    // These can occur at room temperature
    factors.temperatureSuitability = 10;
  } else {
    // Neutral reactions
    factors.temperatureSuitability = 8;
  }

  // Intensity score (priority of reaction type)
  const priority = REACTION_PRIORITIES[reaction.effect] || 1;
  factors.intensityScore = (priority / 9) * 10; // Normalize to 0-10

  // Phase alignment (products should be reasonable for container type)
  factors.phaseAlignmentScore = calculatePhaseAlignment(reaction, containerState);

  // Calculate weighted total score
  const weights = {
    stateCompatibility: 0.2,
    reactivityScore: 0.25,
    temperatureSuitability: 0.15,
    intensityScore: 0.25,
    phaseAlignmentScore: 0.15,
  };

  factors.totalScore =
    factors.stateCompatibility * weights.stateCompatibility +
    factors.reactivityScore * weights.reactivityScore +
    factors.temperatureSuitability * weights.temperatureSuitability +
    factors.intensityScore * weights.intensityScore +
    factors.phaseAlignmentScore * weights.phaseAlignmentScore;

  return factors;
}

/**
 * Combine two states into a key for compatibility lookup
 */
function combinedStateKey(
  state1: string,
  state2: string
): string {
  const states = [state1, state2].sort();
  return `${states[0]}-${states[1]}`;
}

/**
 * Calculate how well reaction products fit the container context
 */
function calculatePhaseAlignment(
  reaction: Reaction,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  containerState?: any
): number {
  // Base alignment
  let alignment = 8;

  // Reactions with gas products prefer gas collection jars
  if (
    (reaction.effect === "fizz" || reaction.effect === "gas-release") &&
    containerState?.apparatus
  ) {
    const hasGasJar = containerState.apparatus.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any) => a.id === "gas-jar"
    );
    alignment = hasGasJar ? 10 : 7;
  }

  // Precipitation reactions prefer filtering apparatus
  if (reaction.effect === "precipitate" && containerState?.apparatus) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasFilter = containerState.apparatus.some((a: any) => {
      return a.id === "filter-paper" || a.id === "filter-funnel";
    });
    alignment = hasFilter ? 10 : 6;
  }

  // Combustion/fire reactions prefer open containers
  if ((reaction.effect === "fire" || reaction.effect === "explosion") && containerState?.apparatus) {
    const hasLid = containerState.apparatus.some(
      (a: Record<string, unknown>) => (a as { id: string }).id === "container-lid"
    );
    alignment = hasLid ? 5 : 9;
  }

  return Math.min(alignment, 10);
}

/**
 * Find decomposition reactions (single reactant)
 * More advanced matching for cases where one chemical breaks apart
 */
export function findDecompositionReaction(
  chemical: Chemical,
  availableReactions: Reaction[],
  temperature: number = 25
): ReactionMatchResult {
  loggers.matcher.debug("Finding decomposition reaction", {
    chemical: chemical.formula,
    temperature,
  });

  // Look for reactions where this chemical is a product that decomposes
  const candidates: Array<{
    reaction: Reaction;
    score: number;
    factors: MatchingFactors;
  }> = [];

  // Find reactions where heating this substance causes decomposition
  for (const reaction of availableReactions) {
    // Check if reaction is decomposition-like
    if (
      reaction.effect === "color-change" ||
      reaction.effect === "rust" ||
      reaction.products === "No Reaction"
    ) {
      continue;
    }

    // Simple heuristic: unstable substances decompose more easily
    if (chemical.stability < 5 && temperature > 50) {
      const score = (chemical.reactivity / 10) * 100; // Score based on reactivity
      const factors: MatchingFactors = {
        basicMatch: true,
        stateCompatibility: 7,
        reactivityScore: chemical.reactivity,
        temperatureSuitability: temperature > 100 ? 10 : 5,
        intensityScore: 5,
        phaseAlignmentScore: 6,
        totalScore: score,
      };

      if (score > 0) {
        candidates.push({
          reaction,
          score,
          factors,
        });
      }
    }
  }

  if (candidates.length === 0) {
    return {
      reaction: null,
      candidates: [],
      selectedReason: "No decomposition possible",
      description: `${chemical.name} is too stable to decompose under current conditions`,
    };
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  return {
    reaction: best.reaction,
    candidates,
    selectedReason: `Thermal decomposition (${best.score.toFixed(1)}/100)`,
    description: best.reaction.description,
  };
}

/**
 * Check if multiple simultaneous reactions should occur
 * Returns filtered list of reactions that can occur together
 */
export function checkMultipleReactions(
  chemicals: Chemical[],
  availableReactions: Reaction[],
  temperature: number = 25
): Reaction[] {
  const simultaneousReactions: Reaction[] = [];

  // Find all possible reactions
  for (let i = 0; i < chemicals.length; i++) {
    for (let j = i + 1; j < chemicals.length; j++) {
      const result = findBestReaction(
        [chemicals[i], chemicals[j]],
        availableReactions,
        temperature
      );

      if (result.reaction && !simultaneousReactions.includes(result.reaction)) {
        simultaneousReactions.push(result.reaction);
      }
    }
  }

  loggers.matcher.info("Multiple reactions check", {
    count: simultaneousReactions.length,
    reactions: simultaneousReactions.map((r) => r.equation),
  });

  return simultaneousReactions;
}
