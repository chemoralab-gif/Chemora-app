// Single source of truth for Chemical type
export type ChemicalState = "solid" | "liquid" | "gas" | "plasma";
export type ChemicalReactivity = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Chemical {
  id: string;
  name: string;
  formula: string;
  color: string;
  state: ChemicalState;
  category: string;
  reactivity: ChemicalReactivity;
  stability: ChemicalReactivity;
  subcategory?: string;
  radioactive?: boolean;
}
