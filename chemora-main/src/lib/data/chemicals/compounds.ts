import { Chemical } from "@/lib/schemas/chemical";

// Common compounds - acids, alkalis, salts, indicators
export const COMMON_COMPOUNDS: Chemical[] = [
  // Acids
  { id: "hcl", name: "Hydrochloric Acid", formula: "HCl", color: "hsl(55, 90%, 55%)", state: "liquid", category: "acid", reactivity: 7, stability: 6 },
  { id: "h2so4", name: "Sulfuric Acid", formula: "H₂SO₄", color: "hsl(45, 80%, 50%)", state: "liquid", category: "acid", reactivity: 8, stability: 6 },
  { id: "hno3", name: "Nitric Acid", formula: "HNO₃", color: "hsl(50, 70%, 55%)", state: "liquid", category: "acid", reactivity: 8, stability: 5 },
  { id: "vinegar", name: "Acetic Acid (Vinegar)", formula: "CH₃COOH", color: "hsl(50, 60%, 70%)", state: "liquid", category: "acid", reactivity: 4, stability: 8 },
  { id: "h3po4", name: "Phosphoric Acid", formula: "H₃PO₄", color: "hsl(40, 50%, 60%)", state: "liquid", category: "acid", reactivity: 5, stability: 7 },
  { id: "citric", name: "Citric Acid", formula: "C₆H₈O₇", color: "hsl(55, 70%, 65%)", state: "solid", category: "acid", reactivity: 4, stability: 8 },
  { id: "carbonic", name: "Carbonic Acid", formula: "H₂CO₃", color: "hsl(200, 40%, 70%)", state: "liquid", category: "acid", reactivity: 3, stability: 4 },

  // Alkalis
  { id: "naoh", name: "Sodium Hydroxide", formula: "NaOH", color: "hsl(180, 30%, 70%)", state: "solid", category: "alkali", reactivity: 7, stability: 7 },
  { id: "koh", name: "Potassium Hydroxide", formula: "KOH", color: "hsl(180, 25%, 72%)", state: "solid", category: "alkali", reactivity: 7, stability: 7 },
  { id: "caoh2", name: "Calcium Hydroxide", formula: "Ca(OH)₂", color: "hsl(0, 0%, 88%)", state: "solid", category: "alkali", reactivity: 5, stability: 7 },
  { id: "nh3", name: "Ammonia Solution", formula: "NH₃", color: "hsl(200, 30%, 75%)", state: "liquid", category: "alkali", reactivity: 5, stability: 6 },

  // Water
  { id: "water", name: "Water", formula: "H₂O", color: "hsl(200, 80%, 60%)", state: "liquid", category: "water", reactivity: 3, stability: 9 },

  // Salts
  { id: "baking-soda", name: "Baking Soda", formula: "NaHCO₃", color: "hsl(0, 0%, 92%)", state: "solid", category: "salt", reactivity: 4, stability: 8 },
  { id: "nacl", name: "Table Salt", formula: "NaCl", color: "hsl(0, 0%, 95%)", state: "solid", category: "salt", reactivity: 1, stability: 10 },
  { id: "cuso4", name: "Copper Sulfate", formula: "CuSO₄", color: "hsl(210, 80%, 55%)", state: "solid", category: "salt", reactivity: 4, stability: 7 },
  { id: "agno3", name: "Silver Nitrate", formula: "AgNO₃", color: "hsl(0, 0%, 85%)", state: "solid", category: "salt", reactivity: 5, stability: 6 },
  { id: "pbno3", name: "Lead Nitrate", formula: "Pb(NO₃)₂", color: "hsl(0, 0%, 90%)", state: "solid", category: "salt", reactivity: 4, stability: 6 },
  { id: "fecl3", name: "Iron(III) Chloride", formula: "FeCl₃", color: "hsl(30, 60%, 40%)", state: "solid", category: "salt", reactivity: 5, stability: 6 },
  { id: "ki", name: "Potassium Iodide", formula: "KI", color: "hsl(0, 0%, 90%)", state: "solid", category: "salt", reactivity: 4, stability: 7 },
  { id: "kmno4", name: "Potassium Permanganate", formula: "KMnO₄", color: "hsl(300, 60%, 30%)", state: "solid", category: "salt", reactivity: 7, stability: 5 },

  // Indicators
  { id: "phenolphthalein", name: "Phenolphthalein", formula: "C₂₀H₁₄O₄", color: "hsl(330, 70%, 60%)", state: "liquid", category: "organic", subcategory: "indicator", reactivity: 1, stability: 8 },
  { id: "methyl-orange", name: "Methyl Orange", formula: "C₁₄H₁₄N₃NaO₃S", color: "hsl(30, 90%, 55%)", state: "liquid", category: "organic", subcategory: "indicator", reactivity: 1, stability: 8 },
  { id: "litmus", name: "Litmus Solution", formula: "Litmus", color: "hsl(270, 60%, 50%)", state: "liquid", category: "organic", subcategory: "indicator", reactivity: 1, stability: 8 },
  { id: "universal-indicator", name: "Universal Indicator", formula: "UI", color: "hsl(120, 60%, 45%)", state: "liquid", category: "organic", subcategory: "indicator", reactivity: 1, stability: 7 },
  { id: "bromothymol", name: "Bromothymol Blue", formula: "C₂₇H₂₈Br₂O₅S", color: "hsl(210, 70%, 50%)", state: "liquid", category: "organic", subcategory: "indicator", reactivity: 1, stability: 8 },

  // Hydrogen Peroxide
  { id: "h2o2", name: "Hydrogen Peroxide", formula: "H₂O₂", color: "hsl(200, 50%, 75%)", state: "liquid", category: "water", reactivity: 6, stability: 4 },

  // ── Additional Endothermic-Related Compounds ──
  { id: "nacho3", name: "Sodium Carbonate", formula: "Na₂CO₃", color: "hsl(0, 0%, 92%)", state: "solid", category: "salt", reactivity: 3, stability: 8 },
  { id: "mgo", name: "Magnesium Oxide", formula: "MgO", color: "hsl(0, 0%, 94%)", state: "solid", category: "salt", reactivity: 4, stability: 9 },
  { id: "sio2", name: "Silicon Dioxide (Sand)", formula: "SiO₂", color: "hsl(40, 30%, 70%)", state: "solid", category: "salt", reactivity: 1, stability: 10 },
  { id: "na2so4", name: "Sodium Sulfate", formula: "Na₂SO₄", color: "hsl(0, 0%, 91%)", state: "solid", category: "salt", reactivity: 2, stability: 9 },
  { id: "k2so4", name: "Potassium Sulfate", formula: "K₂SO₄", color: "hsl(0, 0%, 90%)", state: "solid", category: "salt", reactivity: 2, stability: 9 },
  { id: "nh42so4", name: "Ammonium Sulfate", formula: "(NH₄)₂SO₄", color: "hsl(0, 0%, 91%)", state: "solid", category: "salt", reactivity: 3, stability: 8 },
  { id: "al2so3", name: "Aluminum Sulfate", formula: "Al₂(SO₄)₃", color: "hsl(0, 0%, 89%)", state: "solid", category: "salt", reactivity: 3, stability: 8 },
  { id: "znso4", name: "Zinc Sulfate", formula: "ZnSO₄", color: "hsl(0, 0%, 92%)", state: "solid", category: "salt", reactivity: 3, stability: 8 },
  { id: "feso4", name: "Iron(II) Sulfate", formula: "FeSO₄", color: "hsl(100, 50%, 50%)", state: "solid", category: "salt", reactivity: 4, stability: 7 },
  { id: "fe2so3", name: "Iron(III) Sulfate", formula: "Fe₂(SO₄)₃", color: "hsl(0, 60%, 45%)", state: "solid", category: "salt", reactivity: 4, stability: 7 },
  { id: "caso4", name: "Calcium Sulfate", formula: "CaSO₄", color: "hsl(0, 0%, 93%)", state: "solid", category: "salt", reactivity: 1, stability: 10 },
  { id: "mgso4", name: "Magnesium Sulfate", formula: "MgSO₄", color: "hsl(0, 0%, 91%)", state: "solid", category: "salt", reactivity: 2, stability: 9 },
  { id: "baso4", name: "Barium Sulfate", formula: "BaSO₄", color: "hsl(0, 0%, 95%)", state: "solid", category: "salt", reactivity: 1, stability: 10 },
  { id: "na2co3", name: "Sodium Carbonate (Washing Soda)", formula: "Na₂CO₃", color: "hsl(0, 0%, 92%)", state: "solid", category: "salt", reactivity: 3, stability: 8 },
  { id: "k2co3", name: "Potassium Carbonate", formula: "K₂CO₃", color: "hsl(0, 0%, 90%)", state: "solid", category: "salt", reactivity: 3, stability: 8 },
  { id: "mgsco3", name: "Magnesium Carbonate", formula: "MgCO₃", color: "hsl(0, 0%, 93%)", state: "solid", category: "salt", reactivity: 2, stability: 9 },
  { id: "feso2", name: "Iron(II) Carbonate", formula: "FeCO₃", color: "hsl(0, 50%, 50%)", state: "solid", category: "salt", reactivity: 4, stability: 7 },
  { id: "zncl2", name: "Zinc Chloride", formula: "ZnCl₂", color: "hsl(0, 0%, 90%)", state: "solid", category: "salt", reactivity: 4, stability: 7 },
  { id: "focl", name: "Iron(III) Chloride Hexahydrate", formula: "FeCl₃·6H₂O", color: "hsl(0, 60%, 40%)", state: "solid", category: "salt", reactivity: 5, stability: 6 },
  { id: "ni2so4", name: "Nickel Sulfate", formula: "NiSO₄", color: "hsl(130, 70%, 50%)", state: "solid", category: "salt", reactivity: 4, stability: 7 },
  { id: "cusoa-h2o", name: "Copper Sulfate Pentahydrate", formula: "CuSO₄·5H₂O", color: "hsl(210, 80%, 55%)", state: "solid", category: "salt", reactivity: 4, stability: 7 },
  { id: "agcl2", name: "Silver Chloride", formula: "AgCl", color: "hsl(0, 0%, 89%)", state: "solid", category: "salt", reactivity: 4, stability: 7 },
];
