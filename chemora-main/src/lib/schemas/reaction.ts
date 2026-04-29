// Single source of truth for Reaction type
export type ReactionEffect = 
  | "explosion" 
  | "fire" 
  | "bubbles" 
  | "fizz" 
  | "color-change" 
  | "precipitate" 
  | "gas-release" 
  | "rust" 
  | "indicator-change"
  // Ice & Thermal Effects (Endothermic)
  | "melting-ice"           // Ice → Water at 0°C
  | "frosting"              // Heavy frost forms, -20°C to -60°C
  | "sublimation-frost"     // Solid → Gas directly (dry ice effect at -78°C)
  | "ice-formation"         // Ice crystals form, -50°C or lower
  | "condensation"          // Water beads from atmospheric moisture
  | "vapor-fog"             // Cold visible gas cloud (I₂ purple, CO₂ white)
  | "glassy-crust"          // Shiny frozen crystalline layer forms
  | "effervescent-cold"
  | "bright-light"
  | "bright-white";

export interface Reaction {
  reactants: [string, string];
  products: string;
  equation: string;
  effect: ReactionEffect;
  description: string;
  intensity: number; // 0-10
  isExothermic: boolean;
  temperatureChange: number;
  enthalpyChange: number;
  heatReleased: number;
  indicatorColor?: string;
}
