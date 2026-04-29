import { Reaction } from "@/lib/schemas/reaction";

import { EXOTHERMIC_REACTIONS } from "./exothermic";
import { ENDOTHERMIC_REACTIONS } from "./endothermic";
import {
  INDICATOR_REACTIONS,
  INDICATOR_EXOTHERMIC_REACTIONS,
  INDICATOR_ENDOTHERMIC_REACTIONS,
} from "./indicator";

// ════════════════════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE REACTIONS LIBRARY
// # EXOTHERMIC_REACTIONS
// # ENDOTHERMIC_REACTIONS
// # INDICATOR_REACTIONS
// ════════════════════════════════════════════════════════════════════════════════════════

export const ALL_REACTIONS: Reaction[] = [
  ...EXOTHERMIC_REACTIONS,
  ...ENDOTHERMIC_REACTIONS,
  ...INDICATOR_REACTIONS,
];

export {
  EXOTHERMIC_REACTIONS,
  ENDOTHERMIC_REACTIONS,
  INDICATOR_REACTIONS,
  INDICATOR_EXOTHERMIC_REACTIONS,
  INDICATOR_ENDOTHERMIC_REACTIONS,
};

export const REACTION_STATISTICS = {
  exothermic: EXOTHERMIC_REACTIONS.length,
  endothermic: ENDOTHERMIC_REACTIONS.length,
  indicator: INDICATOR_REACTIONS.length,
  indicatorExothermic: INDICATOR_EXOTHERMIC_REACTIONS.length,
  indicatorEndothermic: INDICATOR_ENDOTHERMIC_REACTIONS.length,
  total: ALL_REACTIONS.length,
};