/**
 * Reaction API service layer.
 * Wraps the chemistry engine behind a clean interface
 * that mirrors a /react endpoint contract.
 */

import { simulateReaction, type ReactionResult } from "./chemistryEngine";

export interface ReactRequest {
  reactants: string[];
}

export interface ReactResponse {
  success: boolean;
  data: ReactionResult;
}

/**
 * Simulates a POST /react call.
 * Accepts reactants, delegates to the chemistry engine,
 * and always returns a structured response.
 */
export function react(request: ReactRequest): ReactResponse {
  try {
    const result = simulateReaction(request.reactants);
    return { success: true, data: result };
  } catch {
    return {
      success: false,
      data: {
        reactants: request.reactants,
        products: [],
        balanced_equation: "",
        outcome: "no_reaction",
        reaction_type: "none",
        feasible: false,
        reason: "An unexpected error occurred in the chemistry engine.",
      },
    };
  }
}
