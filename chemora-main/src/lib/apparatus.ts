export interface Apparatus {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: "container" | "heating" | "measuring" | "safety" | "mixing" | "filtering" | "collection";
}

export const APPARATUSES: Apparatus[] = [
  { id: "beaker", name: "Beaker", icon: "\u{1F9EA}", description: "A flat-bottomed container for mixing chemicals", category: "container" },
  { id: "test-tube", name: "Test Tube", icon: "\u{1F9EB}", description: "Narrow glass tube for small-scale reactions", category: "container" },
  { id: "conical-flask", name: "Conical Flask", icon: "\u2697\uFE0F", description: "Erlenmeyer flask for titrations and mixing", category: "container" },
  { id: "round-flask", name: "Round-Bottom Flask", icon: "\u{1FAE7}", description: "Used for heating and distillation", category: "container" },
  { id: "bunsen-burner", name: "Bunsen Burner", icon: "\u{1F525}", description: "Gas burner for heating substances", category: "heating" },
  { id: "tripod", name: "Tripod & Gauze", icon: "\u{1F53A}", description: "Support stand for heating apparatus", category: "heating" },
  { id: "thermometer", name: "Thermometer", icon: "\u{1F321}\uFE0F", description: "Measures temperature of reactions", category: "measuring" },
  { id: "ph-meter", name: "pH Meter", icon: "\u{1F4CA}", description: "Measures acidity or alkalinity", category: "measuring" },
  { id: "filter-funnel", name: "Filter Funnel", icon: "\u{1F53D}", description: "Separates solids from liquids", category: "filtering" },
  { id: "filter-paper", name: "Filter Paper", icon: "\u{1F4C4}", description: "Porous paper that traps insoluble solids during filtration", category: "filtering" },
  { id: "connecting-tube", name: "Connecting Tube", icon: "\u{1F517}", description: "Transfers solution between two containers", category: "mixing" },
  { id: "spatula", name: "Spatula", icon: "\u{1F944}", description: "Transfers small amounts of solid chemicals", category: "mixing" },
  { id: "glass-rod", name: "Glass Rod", icon: "\u{1FA84}", description: "Stirring rod for mixing solutions", category: "mixing" },
  { id: "safety-goggles", name: "Safety Goggles", icon: "\u{1F97D}", description: "Eye protection during experiments", category: "safety" },
  { id: "tongs", name: "Tongs", icon: "\u{1F9BE}", description: "Holds hot containers safely", category: "safety" },
  { id: "gas-jar", name: "Gas Collection Jar", icon: "\u{1FAD9}", description: "Captures evaporated gases when chemicals boil", category: "collection" },
];

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

export const CHEMICAL_PH: Record<string, number> = {
  "HCl": 1, "H\u2082SO\u2084": 0.5, "HNO\u2083": 1, "CH\u2083COOH": 3, "H\u2083PO\u2084": 2, "C\u2086H\u2088O\u2087": 2.5,
  "H\u2082CO\u2083": 4, "H\u2082O": 7, "NaOH": 14, "KOH": 14, "Ca(OH)\u2082": 12, "NH\u2083": 11,
  "NaCl": 7, "NaHCO\u2083": 8.5, "CuSO\u2084": 4, "H\u2082O\u2082": 6,
};

export const APPARATUS_EFFECTS: Record<string, { tempChange: number; description: string }> = {
  "bunsen-burner": { tempChange: 300, description: "Heating with Bunsen burner - temperature rises significantly" },
  "evaporating-dish": { tempChange: 100, description: "Evaporating solvent - water boils off leaving residue" },
  "tripod": { tempChange: 0, description: "Tripod provides stable support for heating" },
};
