// ============================================================================
// Main Library Export File
// ============================================================================
// This file provides backward compatibility while pointing to the new structure.
// Old imports continue to work, but the actual data now comes from the organized
// data/ directory structure.

// ── New Organized Exports ──
export * from "./schemas/reaction";
export * from "./schemas/chemical";
export * from "./data";

// ── Backward Compatibility - Old Import Names Still Work ──
// These re-exports ensure existing code that imports from src/lib/ continues
// to work without modification

export {
  ALL_REACTIONS,
  HANDCRAFTED_REACTIONS,
  EXOTHERMIC_REACTIONS,
  ENDOTHERMIC_REACTIONS,
} from "./data/reactions";

export {
  ALL_CHEMICALS,
  PERIODIC_ELEMENTS,
  COMMON_COMPOUNDS,
  ENDOTHERMIC_SUBSTANCES,
  CHEMICAL_MAP,
  CHEMICAL_BY_FORMULA,
} from "./data/chemicals";

// ── Utility Re-exports ──
export * from "./utils";
export * from "./logger";
export * from "./validator";
