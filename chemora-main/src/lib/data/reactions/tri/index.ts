import { Reaction, ReactionEffect } from "@/lib/schemas/reaction";
import { ENDOTHERMIC_THREE_REACTANT_REACTIONS } from "./exothermic_tri";

type ThreeReactantReaction = {
  id: string;
  reactants: string[];
  products: string[];
  reactionType: string;
  effect: string;
  description: string;
  intensity: number;
  isEndothermic: boolean;
  temperatureChange: number;
  heatAbsorbed: number;
};

const EFFECT_MAP: Record<string, ReactionEffect> = {
  cooling: "frosting",
  "strong-cooling": "frosting",
  "bubbles-cooling": "effervescent-cold",
  "freezing-cooling": "ice-formation",
  "fog-cooling": "vapor-fog",
  "energy-absorbed": "bright-light",
  "heat-absorbed": "frosting",
  steam: "gas-release",
  "oxygen-release": "gas-release",
  "gas-release": "gas-release",
};

function toReaction(reaction: ThreeReactantReaction): Reaction {
  const products = reaction.products.join(" + ");

  return {
    reactants: reaction.reactants,
    products,
    equation: `${reaction.reactants.join(" + ")} -> ${products}`,
    effect: EFFECT_MAP[reaction.effect] ?? "frosting",
    description: reaction.description,
    intensity: reaction.intensity,
    isExothermic: !reaction.isEndothermic,
    temperatureChange: reaction.temperatureChange,
    enthalpyChange: reaction.heatAbsorbed,
    heatReleased: reaction.isEndothermic ? 0 : reaction.heatAbsorbed,
  };
}

export const ENDOTHERMIC_THREE_REACTANT_NORMALIZED_REACTIONS: Reaction[] =
  (ENDOTHERMIC_THREE_REACTANT_REACTIONS as ThreeReactantReaction[]).map(toReaction);

export const TRI_REACTIONS: Reaction[] = [
  ...ENDOTHERMIC_THREE_REACTANT_NORMALIZED_REACTIONS,
];

export {
  ENDOTHERMIC_THREE_REACTANT_REACTIONS,
};
