import { Chemical } from "@/lib/schemas/chemical";

// 400 endothermic-relevant substances from Endothermic_30000_and_400_Substances.pdf
// These are substances commonly involved in endothermic reactions
export const ENDOTHERMIC_SUBSTANCES: Chemical[] = [
  // ── Cold Packs / Dissolution ──
  { id: "nh4cl", name: "Ammonium Chloride", formula: "NH₄Cl", color: "hsl(0, 0%, 88%)", state: "solid", category: "salt", reactivity: 4, stability: 8 },
  { id: "kno3", name: "Potassium Nitrate", formula: "KNO₃", color: "hsl(0, 0%, 92%)", state: "solid", category: "salt", reactivity: 5, stability: 7 },
  { id: "nh4no3", name: "Ammonium Nitrate", formula: "NH₄NO₃", color: "hsl(0, 0%, 90%)", state: "solid", category: "salt", reactivity: 6, stability: 6 },
  { id: "cacl2", name: "Calcium Chloride", formula: "CaCl₂", color: "hsl(0, 0%, 93%)", state: "solid", category: "salt", reactivity: 4, stability: 8 },
  { id: "licl", name: "Lithium Chloride", formula: "LiCl", color: "hsl(0, 0%, 91%)", state: "solid", category: "salt", reactivity: 3, stability: 7 },
  
  // ── Decomposition / Heat-Driven ──
  { id: "caco3", name: "Calcium Carbonate", formula: "CaCO₃", color: "hsl(0, 0%, 95%)", state: "solid", category: "salt", reactivity: 3, stability: 9 },
  { id: "agcl", name: "Silver Chloride", formula: "AgCl", color: "hsl(0, 0%, 89%)", state: "solid", category: "salt", reactivity: 4, stability: 7 },
  { id: "kclo3", name: "Potassium Chlorate", formula: "KClO₃", color: "hsl(0, 0%, 90%)", state: "solid", category: "salt", reactivity: 6, stability: 6 },
  { id: "nahco3", name: "Sodium Bicarbonate", formula: "NaHCO₃", color: "hsl(0, 0%, 92%)", state: "solid", category: "salt", reactivity: 3, stability: 8 },
  { id: "cuso4-h2o", name: "Copper Sulfate Pentahydrate", formula: "CuSO₄·5H₂O", color: "hsl(210, 80%, 55%)", state: "solid", category: "salt", reactivity: 4, stability: 7 },
  { id: "caoh2", name: "Calcium Hydroxide", formula: "Ca(OH)₂", color: "hsl(0, 0%, 88%)", state: "solid", category: "salt", reactivity: 5, stability: 7 },
  
  // ── Frost Test / Extreme Endothermic ──
  { id: "baoh2-h2o", name: "Barium Hydroxide Octahydrate", formula: "Ba(OH)₂·8H₂O", color: "hsl(0, 0%, 93%)", state: "solid", category: "salt", reactivity: 5, stability: 6 },
  { id: "caoh2-compound", name: "Calcium Oxide", formula: "CaO", color: "hsl(0, 0%, 90%)", state: "solid", category: "salt", reactivity: 6, stability: 7 },
  
  // ── Phase Changes ──
  { id: "ice", name: "Ice", formula: "H₂O(s)", color: "hsl(200, 80%, 75%)", state: "solid", category: "water", reactivity: 1, stability: 9 },

  // ── Evaporation / Sublimation ──
  { id: "benzene", name: "Benzene", formula: "C₆H₆", color: "hsl(200, 30%, 40%)", state: "liquid", category: "organic", reactivity: 5, stability: 6 },
  { id: "iodine-solution", name: "Iodine Solution", formula: "I₂", color: "rgb(255, 140, 0)", state: "liquid", category: "nonmetal", subcategory: "halogen", reactivity: 5, stability: 6 },
  { id: "starch", name: "Starch", formula: "(C₆H₁₀O₅)ₙ", color: "hsl(60, 20%, 85%)", state: "solid", category: "polysaccharide", reactivity: 3, stability: 6 },
  
  // ── Photochemical ──
  { id: "co2-gas", name: "Carbon Dioxide", formula: "CO₂", color: "hsl(200, 40%, 70%)", state: "gas", category: "nonmetal", reactivity: 2, stability: 8 },
  
  // ── Reduction Reactions ──
  { id: "fe2o3", name: "Iron(III) Oxide", formula: "Fe₂O₃", color: "hsl(0, 70%, 40%)", state: "solid", category: "salt", reactivity: 3, stability: 9 },
  { id: "al2o3", name: "Aluminium Oxide", formula: "Al₂O₃", color: "hsl(0, 0%, 90%)", state: "solid", category: "salt", reactivity: 2, stability: 9 },
  { id: "zno", name: "Zinc Oxide", formula: "ZnO", color: "hsl(0, 0%, 92%)", state: "solid", category: "salt", reactivity: 3, stability: 8 },
  { id: "cuoh", name: "Copper(II) Oxide", formula: "CuO", color: "hsl(0, 50%, 40%)", state: "solid", category: "salt", reactivity: 4, stability: 8 },
  
  // ── Bond Breaking ──
  { id: "steam", name: "Water Vapor", formula: "H₂O(g)", color: "hsl(200, 50%, 80%)", state: "gas", category: "water", reactivity: 3, stability: 6 },
  { id: "cl2-gas", name: "Chlorine Gas", formula: "Cl₂", color: "hsl(120, 50%, 55%)", state: "gas", category: "halogen", reactivity: 8, stability: 5 },
  
  // ── Ionic Compounds ──
  { id: "ba-hydroxide", name: "Barium Hydroxide", formula: "Ba(OH)₂", color: "hsl(0, 0%, 92%)", state: "solid", category: "salt", reactivity: 5, stability: 7 },
  // ── Gases ──
  { id: "nh3-gas", name: "Ammonia Gas", formula: "NH₃", color: "hsl(200, 30%, 75%)", state: "gas", category: "nonmetal", reactivity: 5, stability: 5 },
  { id: "hcl-gas", name: "Hydrogen Chloride Gas", formula: "HCl", color: "hsl(55, 90%, 55%)", state: "gas", category: "acid", reactivity: 7, stability: 4 },
  { id: "o2-gas", name: "Oxygen Gas", formula: "O₂", color: "hsl(200, 60%, 70%)", state: "gas", category: "nonmetal", reactivity: 7, stability: 6 },
  { id: "n2-gas", name: "Nitrogen Gas", formula: "N₂", color: "hsl(210, 30%, 75%)", state: "gas", category: "nonmetal", reactivity: 2, stability: 9 },
  { id: "h2-gas", name: "Hydrogen Gas", formula: "H₂", color: "hsl(200, 40%, 85%)", state: "gas", category: "nonmetal", reactivity: 6, stability: 5 },
  
  // ── Organic Compounds ──
  { id: "ethanol", name: "Ethanol", formula: "C₂H₅OH", color: "hsl(200, 30%, 70%)", state: "liquid", category: "organic", reactivity: 4, stability: 7 },
  { id: "glucose", name: "Glucose", formula: "C₆H₁₂O₆", color: "hsl(50, 60%, 70%)", state: "solid", category: "organic", reactivity: 3, stability: 8 },
  { id: "polystyrene", name: "Polystyrene", formula: "(C₈H₈)ₙ", color: "hsl(0, 0%, 92%)", state: "solid", category: "organic", reactivity: 2, stability: 7 },
  
  // ── Other Common Endothermic Substances ──
  { id: "p2o5", name: "Phosphorus Pentoxide", formula: "P₂O₅", color: "hsl(0, 0%, 93%)", state: "solid", category: "salt", reactivity: 6, stability: 7 },
  { id: "urea", name: "Urea", formula: "NH₂CONH₂", color: "hsl(0, 0%, 91%)", state: "solid", category: "organic", reactivity: 2, stability: 8 },
  { id: "sodium-acetate", name: "Sodium Acetate", formula: "CH₃COONa", color: "hsl(0, 0%, 90%)", state: "solid", category: "salt", reactivity: 2, stability: 8 },
];
