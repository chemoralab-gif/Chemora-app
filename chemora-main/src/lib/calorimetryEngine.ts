/**
 * Calorimetry Engine
 * Calculates equilibrium temperature when hot metal is placed in water
 * Formula: Q_metal = Q_water (Heat lost by metal = Heat gained by water)
 * T_final = (m_metal × c_metal × T_initial_metal + m_water × c_water × T_initial_water) / (m_metal × c_metal + m_water × c_water)
 */

// Mapping of element symbols to metal types
export const ELEMENT_TO_METAL_MAP: Record<string, string> = {
  Fe: "iron",
  Cu: "copper",
  Al: "aluminum",
  Zn: "zinc",
  Pb: "lead",
  Na: "iron", // Default
  K: "iron", // Default
  "Steel": "steel",
};

// Density of metals (g/cm³)
export const METAL_DENSITY_MAP: Record<string, number> = {
  iron: 7.87,
  copper: 8.96,
  aluminum: 2.70,
  zinc: 7.14,
  lead: 11.34,
  steel: 7.85,
};

/**
 * Get specific heat for a given element
 */
export function getElementSpecificHeat(elementSymbol: string): number {
  const metalKey = ELEMENT_TO_METAL_MAP[elementSymbol];
  if (!metalKey || !METAL_PROPERTIES[metalKey]) {
    return 0.5; // Default fallback
  }
  return METAL_PROPERTIES[metalKey].specificHeat;
}

export interface MetalProperties {
  name: string;
  symbol: string;
  specificHeat: number; // J/(g°C)
  maxTemp: number; // Maximum safe initial temperature in °C
  density: number; // g/cm³
  color: string; // For visualization
}

export const METAL_PROPERTIES: Record<string, MetalProperties> = {
  iron: {
    name: "Iron (Fe)",
    symbol: "Fe",
    specificHeat: 0.449, // J/(g°C)
    maxTemp: 1000,
    density: 7.87,
    color: "#8B7355",
  },
  copper: {
    name: "Copper (Cu)",
    symbol: "Cu",
    specificHeat: 0.385, // J/(g°C)
    maxTemp: 1084,
    density: 8.96,
    color: "#B87333",
  },
  aluminum: {
    name: "Aluminum (Al)",
    symbol: "Al",
    specificHeat: 0.897, // J/(g°C)
    maxTemp: 660,
    density: 2.70,
    color: "#C0C0C0",
  },
  zinc: {
    name: "Zinc (Zn)",
    symbol: "Zn",
    specificHeat: 0.387, // J/(g°C)
    maxTemp: 420,
    density: 7.14,
    color: "#96A0A0",
  },
  lead: {
    name: "Lead (Pb)",
    symbol: "Pb",
    specificHeat: 0.129, // J/(g°C)
    maxTemp: 327,
    density: 11.34,
    color: "#808080",
  },
  steel: {
    name: "Steel",
    symbol: "Steel",
    specificHeat: 0.490, // J/(g°C) - varies by alloy
    maxTemp: 1400,
    density: 7.85,
    color: "#71797E",
  },
};

// Water properties (constant)
const WATER_SPECIFIC_HEAT = 4.18; // J/(g°C)
const WATER_DENSITY = 1.0; // g/cm³ at room temperature

export interface CalorimetryState {
  selectedMetal: string; // key from METAL_PROPERTIES
  metalMass: number; // grams
  metalInitialTemp: number; // °C
  waterVolume: number; // mL (1 mL ≈ 1 g for water)
  waterInitialTemp: number; // °C (typically 20-25°C)
  equilibriumTemp: number; // Calculated result
  heatLostByMetal: number; // Joules
  heatGainedByWater: number; // Joules
  totalHeatCapacity: number; // J/°C
}

export class CalorimetryEngine {
  /**
   * Calculate equilibrium temperature
   * Uses formula: T_final = (m_metal × c_metal × T_i_metal + m_water × c_water × T_i_water) / (m_metal × c_metal + m_water × c_water)
   */
  static calculateEquilibriumTemperature(
    selectedMetal: string,
    metalMass: number,
    metalInitialTemp: number,
    waterVolume: number,
    waterInitialTemp: number
  ): CalorimetryState {
    const metal = METAL_PROPERTIES[selectedMetal];
    if (!metal) {
      throw new Error(`Unknown metal: ${selectedMetal}`);
    }

    // Water mass in grams (volume in mL ≈ mass in grams at room temp)
    const waterMass = waterVolume * WATER_DENSITY;

    // Heat capacity of each substance: C = m × c
    const metalHeatCapacity = metalMass * metal.specificHeat;
    const waterHeatCapacity = waterMass * WATER_SPECIFIC_HEAT;
    const totalHeatCapacity = metalHeatCapacity + waterHeatCapacity;

    // Equilibrium temperature calculation
    const equilibriumTemp =
      (metalHeatCapacity * metalInitialTemp + waterHeatCapacity * waterInitialTemp) /
      totalHeatCapacity;

    // Heat calculations (positive values represent energy magnitude)
    const heatLostByMetal = metalHeatCapacity * Math.abs(metalInitialTemp - equilibriumTemp);
    const heatGainedByWater = waterHeatCapacity * Math.abs(equilibriumTemp - waterInitialTemp);

    return {
      selectedMetal,
      metalMass,
      metalInitialTemp,
      waterVolume,
      waterInitialTemp,
      equilibriumTemp: Math.round(equilibriumTemp * 10) / 10, // Round to 1 decimal place
      heatLostByMetal: Math.round(heatLostByMetal * 10) / 10,
      heatGainedByWater: Math.round(heatGainedByWater * 10) / 10,
      totalHeatCapacity: Math.round(totalHeatCapacity * 10) / 10,
    };
  }

  /**
   * Validate that the equilibrium temperature is physically reasonable
   */
  static isValidEquilibrium(state: CalorimetryState): boolean {
    const minTemp = Math.min(state.metalInitialTemp, state.waterInitialTemp);
    const maxTemp = Math.max(state.metalInitialTemp, state.waterInitialTemp);

    // Equilibrium should be between initial temperatures
    return (
      state.equilibriumTemp >= minTemp &&
      state.equilibriumTemp <= maxTemp &&
      !isNaN(state.equilibriumTemp)
    );
  }

  /**
   * Get metal properties
   */
  static getMetalProperties(metalKey: string): MetalProperties | null {
    return METAL_PROPERTIES[metalKey] || null;
  }

  /**
   * Get all available metals
   */
  static getAvailableMetals(): MetalProperties[] {
    return Object.values(METAL_PROPERTIES);
  }

  /**
   * Calculate time to reach equilibrium (approximation)
   * Based on thermal conductivity and system size
   */
  static estimateEquilibrationTime(
    metalMass: number,
    waterVolume: number,
    tempDifference: number
  ): number {
    // Simplified model: larger temp difference and smaller system = faster equilibration
    // Time in seconds (very approximate)
    const basetime = (metalMass + waterVolume) * 0.5;
    const timeAdjustment = Math.max(1, tempDifference / 50);
    return Math.round(basetime / timeAdjustment);
  }
}
