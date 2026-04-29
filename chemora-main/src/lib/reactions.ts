// ============================================================================
// BACKWARD COMPATIBILITY FILE
// This file re-exports types from the new schemas directory structure.
// New code should import directly from ./schemas/reaction and ./schemas/chemical
// ============================================================================

// Re-export from new centralized locations
export type { Reaction, ReactionEffect } from "./schemas/reaction";
export type { Chemical, ChemicalState, ChemicalReactivity } from "./schemas/chemical";

// Apparatus interface
export interface Apparatus {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: "container" | "heating" | "measuring" | "safety" | "mixing" | "filtering" | "collection";
}

export interface ExperimentStep {
  timestamp: Date;
  beakerLabel: string;
  chemicals: Chemical[];
  reaction: Reaction | null;
  apparatus: string[];
}

// ──── IMPORT DATA FROM NEW STRUCTURE ────
import { ALL_CHEMICALS } from "./data/chemicals";
import { ALL_REACTIONS } from "./data/reactions";
import type { Reaction } from "./schemas/reaction";
import type { Chemical } from "./schemas/chemical";

// ──── BACKWARD COMPATIBLE EXPORTS ────
// Old names that point to new data structure
export const CHEMICALS: Chemical[] = ALL_CHEMICALS;
export const REACTIONS: Reaction[] = ALL_REACTIONS;

// ──── APPARATUSES ────
export const APPARATUSES: Apparatus[] = [
  { id: "beaker", name: "Beaker", icon: "🧪", description: "A flat-bottomed container for mixing chemicals", category: "container" },
  { id: "test-tube", name: "Test Tube", icon: "🧫", description: "Narrow glass tube for small-scale reactions", category: "container" },
  { id: "conical-flask", name: "Conical Flask", icon: "⚗️", description: "Erlenmeyer flask for titrations and mixing", category: "container" },
  { id: "round-flask", name: "Round-Bottom Flask", icon: "🫧", description: "Used for heating and distillation", category: "container" },
  { id: "bunsen-burner", name: "Bunsen Burner", icon: "🔥", description: "Gas burner for heating substances", category: "heating" },
  { id: "tripod", name: "Tripod & Gauze", icon: "🔺", description: "Support stand for heating apparatus", category: "heating" },
  { id: "thermometer", name: "Thermometer", icon: "🌡️", description: "Measures temperature of reactions", category: "measuring" },
  { id: "ph-meter", name: "pH Meter", icon: "📊", description: "Measures acidity or alkalinity", category: "measuring" },
  { id: "filter-funnel", name: "Filter Funnel", icon: "🔽", description: "Separates solids from liquids", category: "filtering" },
  { id: "filter-paper", name: "Filter Paper", icon: "📄", description: "Porous paper that traps insoluble solids during filtration", category: "filtering" },
  { id: "connecting-tube", name: "Connecting Tube", icon: "🔗", description: "Transfers solution between two containers", category: "mixing" },
  { id: "spatula", name: "Spatula", icon: "🥄", description: "Transfers small amounts of solid chemicals", category: "mixing" },
  { id: "glass-rod", name: "Glass Rod", icon: "🪄", description: "Stirring rod for mixing solutions", category: "mixing" },
  { id: "safety-goggles", name: "Safety Goggles", icon: "🥽", description: "Eye protection during experiments", category: "safety" },
  { id: "tongs", name: "Tongs", icon: "🦾", description: "Holds hot containers safely", category: "safety" },
  { id: "gas-jar", name: "Gas Collection Jar", icon: "🫙", description: "Captures evaporated gases when chemicals boil", category: "collection" },
];

// ──── CATEGORIES ────
export const CHEMICAL_CATEGORIES: Record<string, string> = {
  metal: "Metals",
  nonmetal: "Non-Metals",
  "noble-gas": "Noble Gases",
  acid: "Acids",
  alkali: "Alkalis",
  water: "Liquids",
  salt: "Salts",
  organic: "Indicators & Organic",
};

export const APPARATUS_CATEGORIES: Record<string, string> = {
  container: "Containers",
  heating: "Heating",
  measuring: "Measuring",
  safety: "Safety",
  mixing: "Mixing",
  filtering: "Filtering",
  collection: "Collection",
};

// ──── HELPER FUNCTIONS ────
export function findReaction(formula1: string, formula2: string): Reaction | null {
  return REACTIONS.find(
    (r) =>
      (r.reactants[0] === formula1 && r.reactants[1] === formula2) ||
      (r.reactants[0] === formula2 && r.reactants[1] === formula1)
  ) || null;
}

// Find reactions where heat is a reactant (for thermal decomposition, etc.)
export function findReactionWithHeat(formula: string): Reaction | null {
  return REACTIONS.find(
    (r) =>
      (r.reactants[0] === formula && r.reactants[1] === "Heat") ||
      (r.reactants[0] === "Heat" && r.reactants[1] === formula)
  ) || null;
}

// ──── PH VALUES FOR CHEMICALS ────
export const CHEMICAL_PH: Record<string, number> = {
  "HCl": 1, "H₂SO₄": 0.5, "HNO₃": 1, "CH₃COOH": 3, "H₃PO₄": 2, "C₆H₈O₇": 2.5,
  "H₂CO₃": 4, "H₂O": 7, "NaOH": 14, "KOH": 14, "Ca(OH)₂": 12, "NH₃": 11,
  "NaCl": 7, "NaHCO₃": 8.5, "CuSO₄": 4, "H₂O₂": 6,
};

// ──── APPARATUS EFFECTS ────
export const APPARATUS_EFFECTS: Record<string, { tempChange: number; description: string }> = {
  "bunsen-burner": { tempChange: 300, description: "Heating with Bunsen burner — temperature rises significantly" },
  "evaporating-dish": { tempChange: 100, description: "Evaporating solvent — water boils off leaving residue" },
  "tripod": { tempChange: 0, description: "Tripod provides stable support for heating" },
};
