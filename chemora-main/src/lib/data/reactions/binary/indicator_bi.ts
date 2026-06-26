import { Reaction } from "@/lib/schemas/reaction";

export type IndicatorReaction = Reaction & {
  indicatorColor?: string;
  indicatorType?: "exothermic" | "endothermic";
};

// Indicator reactions are separated from main exothermic/endothermic reaction files.
// They keep the same base fields, plus indicatorColor for UI color rendering.

export const INDICATOR_EXOTHERMIC_REACTIONS: IndicatorReaction[] = [
  { reactants: ["Pb(NO₃)₂", "KI"], products: "PbI₂↓ + KNO₃", equation: "Pb(NO₃)₂ + 2KI → PbI₂↓ + 2KNO₃", effect: "color-change", description: "Lead nitrate reacts with potassium iodide to form a beautiful bright yellow precipitate of lead iodide — 'golden rain'!", intensity: 5, indicatorColor: "hsl(50, 90%, 55%)", enthalpyChange: -120, isExothermic: true, temperatureChange: 8, heatReleased: 120 , indicatorType: "exothermic" },
  { reactants: ["CuSO₄", "NaOH"], products: "Cu(OH)₂↓ + Na₂SO₄", equation: "CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄", effect: "color-change", description: "Copper sulfate reacts with sodium hydroxide to form a blue precipitate of copper(II) hydroxide.", intensity: 4, indicatorColor: "hsl(210, 70%, 50%)", enthalpyChange: -42, isExothermic: true, temperatureChange: 4, heatReleased: 42 , indicatorType: "exothermic" },
  { reactants: ["FeCl₃", "NaOH"], products: "Fe(OH)₃↓ + NaCl", equation: "FeCl₃ + 3NaOH → Fe(OH)₃↓ + 3NaCl", effect: "color-change", description: "Iron(III) chloride reacts with sodium hydroxide to form a rust-brown precipitate of iron(III) hydroxide.", intensity: 4, indicatorColor: "hsl(20, 70%, 40%)", enthalpyChange: -45, isExothermic: true, temperatureChange: 4, heatReleased: 45 , indicatorType: "exothermic" },
  { reactants: ["Fe", "CuSO₄"], products: "FeSO₄ + Cu", equation: "Fe + CuSO₄ → FeSO₄ + Cu", effect: "color-change", description: "Iron displaces copper from copper sulfate solution. The blue solution turns green as copper is deposited as a brown coating on the iron.", intensity: 4, indicatorColor: "hsl(120, 30%, 50%)", enthalpyChange: -87, isExothermic: true, temperatureChange: 12, heatReleased: 87 , indicatorType: "exothermic" },
  { reactants: ["Zn", "CuSO₄"], products: "ZnSO₄ + Cu", equation: "Zn + CuSO₄ → ZnSO₄ + Cu", effect: "color-change", description: "Zinc displaces copper from copper sulfate. The blue solution turns colourless as copper is deposited.", intensity: 5, indicatorColor: "hsl(0, 0%, 80%)", enthalpyChange: -120, isExothermic: true, temperatureChange: 18, heatReleased: 120 , indicatorType: "exothermic" },
  { reactants: ["Mg", "CuSO₄"], products: "MgSO₄ + Cu", equation: "Mg + CuSO₄ → MgSO₄ + Cu", effect: "color-change", description: "Magnesium vigorously displaces copper from copper sulfate. Solution turns colourless with copper deposited.", intensity: 6, indicatorColor: "hsl(0, 0%, 80%)", enthalpyChange: -148, isExothermic: true, temperatureChange: 22, heatReleased: 148 , indicatorType: "exothermic" },
  { reactants: ["I₂", "C₆H₁₂O₆"], products: "Iodo-glucose purple complex", equation: "C₆H₁₂O₆ + I₂ → [C₆H₁₂O₆·I₂] (purple)", effect: "color-change", description: "Iodine forms a vibrant purple complex with glucose when heated. Both chemicals combine to create a colored indicator. Used in starch and sugar detection.", intensity: 4, enthalpyChange: -32, isExothermic: true, temperatureChange: 10, heatReleased: 32, indicatorColor: "hsl(270, 70%, 45%)" , indicatorType: "exothermic" },
];

export const INDICATOR_ENDOTHERMIC_REACTIONS: IndicatorReaction[] = [
  { reactants: ["NaOH", "C₂₀H₁₄O₄"], products: "Pink Solution", equation: "NaOH + Phenolphthalein → Pink Color", effect: "color-change", description: "Phenolphthalein turns bright pink/magenta in alkaline solution (pH > 8.2). Colourless in acid.", intensity: 2, indicatorColor: "hsl(330, 80%, 60%)", enthalpyChange: 0, isExothermic: false, temperatureChange: 0, heatReleased: 0 , indicatorType: "endothermic" },
  { reactants: ["HCl", "C₂₀H₁₄O₄"], products: "Colourless Solution", equation: "HCl + Phenolphthalein → Colourless", effect: "color-change", description: "Phenolphthalein remains colourless in acidic solution (pH < 8.2).", intensity: 1, indicatorColor: "hsl(0, 0%, 80%)", enthalpyChange: 0, isExothermic: false, temperatureChange: 0, heatReleased: 0 , indicatorType: "endothermic" },
  { reactants: ["NaOH", "C₁₄H₁₄N₃NaO₃S"], products: "Yellow Solution", equation: "NaOH + Methyl Orange → Yellow", effect: "color-change", description: "Methyl orange turns yellow in alkaline conditions (pH > 4.4).", intensity: 2, indicatorColor: "hsl(50, 90%, 55%)", enthalpyChange: 0, isExothermic: false, temperatureChange: 0, heatReleased: 0 , indicatorType: "endothermic" },
  { reactants: ["HCl", "C₁₄H₁₄N₃NaO₃S"], products: "Red Solution", equation: "HCl + Methyl Orange → Red", effect: "color-change", description: "Methyl orange turns red in acidic conditions (pH < 3.1).", intensity: 2, indicatorColor: "hsl(0, 80%, 50%)", enthalpyChange: 0, isExothermic: false, temperatureChange: 0, heatReleased: 0 , indicatorType: "endothermic" },
  { reactants: ["NaOH", "Litmus"], products: "Blue Solution", equation: "NaOH + Litmus → Blue", effect: "color-change", description: "Litmus turns blue in alkaline solution.", intensity: 2, indicatorColor: "hsl(220, 70%, 50%)", enthalpyChange: 0, isExothermic: false, temperatureChange: 0, heatReleased: 0 , indicatorType: "endothermic" },
  { reactants: ["HCl", "Litmus"], products: "Red Solution", equation: "HCl + Litmus → Red", effect: "color-change", description: "Litmus turns red in acidic solution.", intensity: 2, indicatorColor: "hsl(0, 70%, 50%)", enthalpyChange: 0, isExothermic: false, temperatureChange: 0, heatReleased: 0 , indicatorType: "endothermic" },
  { reactants: ["NaOH", "UI"], products: "Purple/Blue Solution", equation: "NaOH + Universal Indicator → Purple/Blue", effect: "color-change", description: "Universal indicator turns blue-purple in strong alkaline solution (pH 10-14).", intensity: 2, indicatorColor: "hsl(260, 70%, 50%)", enthalpyChange: 0, isExothermic: false, temperatureChange: 0, heatReleased: 0 , indicatorType: "endothermic" },
  { reactants: ["HCl", "UI"], products: "Red Solution", equation: "HCl + Universal Indicator → Red", effect: "color-change", description: "Universal indicator turns red in strong acid (pH 1-3).", intensity: 2, indicatorColor: "hsl(0, 80%, 45%)", enthalpyChange: 0, isExothermic: false, temperatureChange: 0, heatReleased: 0 , indicatorType: "endothermic" },
  { reactants: ["H₂O", "UI"], products: "Green Solution", equation: "H₂O + Universal Indicator → Green", effect: "color-change", description: "Universal indicator turns green in neutral solution (pH 7).", intensity: 1, indicatorColor: "hsl(120, 60%, 45%)", enthalpyChange: 0, isExothermic: false, temperatureChange: 0, heatReleased: 0 , indicatorType: "endothermic" },
  { reactants: ["CH₃COOH", "UI"], products: "Orange Solution", equation: "CH₃COOH + Universal Indicator → Orange", effect: "color-change", description: "Universal indicator turns orange in weak acid (pH 3-5).", intensity: 2, indicatorColor: "hsl(30, 80%, 50%)", enthalpyChange: 0, isExothermic: false, temperatureChange: 0, heatReleased: 0 , indicatorType: "endothermic" },
  { reactants: ["NH₃", "UI"], products: "Blue Solution", equation: "NH₃ + Universal Indicator → Blue", effect: "color-change", description: "Universal indicator turns blue in weak alkali (pH 8-10).", intensity: 2, indicatorColor: "hsl(210, 70%, 55%)", enthalpyChange: 0, isExothermic: false, temperatureChange: 0, heatReleased: 0 , indicatorType: "endothermic" },
];

export const INDICATOR_REACTIONS: IndicatorReaction[] = [
  ...INDICATOR_EXOTHERMIC_REACTIONS,
  ...INDICATOR_ENDOTHERMIC_REACTIONS,
];

export const INDICATOR_REACTION_GROUPS = {
  exothermic: INDICATOR_EXOTHERMIC_REACTIONS,
  endothermic: INDICATOR_ENDOTHERMIC_REACTIONS,
  all: INDICATOR_REACTIONS,
};

export default INDICATOR_REACTIONS;
