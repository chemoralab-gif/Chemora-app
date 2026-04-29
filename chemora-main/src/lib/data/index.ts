// Main data export file - combines all reactions and chemicals
export * from "./reactions";
export * from "./chemicals";

// Re-export all categories for convenient access
export { 
  ALL_REACTIONS, 
  HANDCRAFTED_REACTIONS, 
  EXOTHERMIC_REACTIONS, 
  ENDOTHERMIC_REACTIONS,
  SPECIALIZED_REACTIONS,
  REACTION_STATISTICS,
} from "./reactions";
export { 
  ALL_CHEMICALS, 
  PERIODIC_ELEMENTS, 
  COMMON_COMPOUNDS, 
  ENDOTHERMIC_SUBSTANCES,
  CHEMICAL_MAP,
  CHEMICAL_BY_FORMULA,
} from "./chemicals";
