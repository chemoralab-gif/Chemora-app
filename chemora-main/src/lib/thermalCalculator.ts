/**
 * Thermal Calculator
 * Calculates output temperature and heat released for reactions
 */

import { Reaction } from "./reactions";
import { METAL_PROPERTIES } from "./calorimetryEngine";

export interface ThermalOutput {
  outputTemperature: number; // °C
  heatReleased: number; // kJ
  enthalpyChange: number; // kJ/mol
  isExothermic: boolean;
  temperatureChange: number; // °C
  energyLevel: "high" | "medium" | "low" | "none";
}

/**
 * Calculate output temperature from a reaction
 * Uses standard conditions: 25°C initial water temperature, 100mL water (100g)
 */
export function calculateReactionTemperature(
  reaction: Reaction | null,
  initialTemp: number = 25,
  waterMass: number = 100 // grams
): ThermalOutput {
  const defaultOutput: ThermalOutput = {
    outputTemperature: initialTemp,
    heatReleased: 0,
    enthalpyChange: 0,
    isExothermic: false,
    temperatureChange: 0,
    energyLevel: "none",
  };

  if (!reaction) return defaultOutput;

  const enthalpyChange = reaction.enthalpyChange ?? 0;
  const isExothermic = reaction.isExothermic ?? false;
  const temperatureChange = reaction.temperatureChange ?? 0;
  const heatReleased = reaction.heatReleased ?? 0;

  // Calculate output temperature
  // For exothermic: T_final = T_initial + ΔT
  // For endothermic: T_final = T_initial - |ΔT|
  const outputTemperature = isExothermic
    ? initialTemp + temperatureChange
    : Math.max(0, initialTemp - Math.abs(temperatureChange));

  // Determine energy level based on reaction intensity
  let energyLevel: "high" | "medium" | "low" | "none";
  if (reaction.intensity >= 8) {
    energyLevel = "high";
  } else if (reaction.intensity >= 4) {
    energyLevel = "medium";
  } else if (reaction.intensity > 0) {
    energyLevel = "low";
  } else {
    energyLevel = "none";
  }

  return {
    outputTemperature: Math.round(outputTemperature * 10) / 10,
    heatReleased,
    enthalpyChange,
    isExothermic,
    temperatureChange,
    energyLevel,
  };
}

/**
 * Calculate equilibrium temperature when hot metal cools in water
 * Uses calorimetry formula: Q_metal = Q_water
 */
export function calculateEquilibriumTemperature(
  metalType: string,
  metalMass: number, // grams
  metalInitialTemp: number, // °C
  waterMass: number, // grams
  waterInitialTemp: number = 25 // °C
): number {
  const metalProps = METAL_PROPERTIES[metalType];
  if (!metalProps) return waterInitialTemp;

  const c_metal = metalProps.specificHeat;
  const c_water = 4.18; // J/(g°C) for water

  // Equilibrium formula: T_eq = (m_metal * c_metal * T_metal + m_water * c_water * T_water) / (m_metal * c_metal + m_water * c_water)
  const numerator =
    metalMass * c_metal * metalInitialTemp +
    waterMass * c_water * waterInitialTemp;
  const denominator = metalMass * c_metal + waterMass * c_water;

  if (denominator === 0) return waterInitialTemp;

  const equilibriumTemp = numerator / denominator;
  return Math.round(equilibriumTemp * 10) / 10;
}

/**
 * Calculate heat capacity of a metal
 */
export function getMetalHeatCapacity(metalType: string, mass: number): number {
  const metalProps = METAL_PROPERTIES[metalType];
  if (!metalProps) return 0;
  return metalProps.specificHeat * mass; // J/°C
}

/**
 * Format temperature output for display
 */
export function formatTemperature(temp: number, unit: "C" | "F" = "C"): string {
  if (unit === "F") {
    const fahrenheit = (temp * 9) / 5 + 32;
    return `${Math.round(fahrenheit)}°F`;
  }
  return `${Math.round(temp)}°C`;
}

/**
 * Calculate energy released in joules
 */
export function calculateEnergyJoules(enthalpyKJ: number, molarity: number = 1): number {
  return Math.abs(enthalpyKJ * molarity * 1000); // Convert kJ to J
}

/**
 * Get reaction classification based on temperature change
 */
export function classifyReactionByTemperature(
  temperatureChange: number
): "highly-exothermic" | "moderately-exothermic" | "mildly-exothermic" | "endothermic" | "neutral" {
  if (temperatureChange > 100) return "highly-exothermic";
  if (temperatureChange > 40) return "moderately-exothermic";
  if (temperatureChange > 0) return "mildly-exothermic";
  if (temperatureChange < 0) return "endothermic";
  return "neutral";
}
