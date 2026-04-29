/**
 * Condition System
 * Tracks reaction conditions: temperature, pressure, aqueous/solid/gas
 * Determines if reactions are possible under given conditions
 */

export interface ReactionConditions {
  temperature: number; // Kelvin or Celsius (we'll assume Celsius)
  pressure: number; // atm
  medium: "aqueous" | "solid" | "gas" | "molten";
  light?: boolean; // photochemical
}

export interface ConditionConstraint {
  element?: string;
  minTemp?: number; // Celsius
  maxTemp?: number; // Celsius
  minPressure?: number; // atm
  maxPressure?: number; // atm
  requiredMedium?: string;
  requiresLight?: boolean;
  description: string;
}

/**
 * Standard conditions (STP)
 */
export const STANDARD_CONDITIONS: ReactionConditions = {
  temperature: 25, // 25°C
  pressure: 1, // 1 atm
  medium: "aqueous",
};

/**
 * Condition constraints for various reactions/decompositions
 */
const CONDITION_CONSTRAINTS: Record<string, ConditionConstraint> = {
  // Thermal decomposition
  CaCO3_decompose: {
    element: "CaCO3",
    minTemp: 800,
    maxTemp: undefined,
    requiredMedium: "solid",
    description: "Calcium carbonate decomposes above 800C",
  },

  // Combustion (typically high temp)
  combustion_general: {
    minTemp: 400,
    maxTemp: undefined,
    requiredMedium: "gas",
    description: "Combustion reactions typically require high temperature",
  },

  // Melting reactions
  NaCl_molten: {
    element: "NaCl",
    minTemp: 800, // Melting point of NaCl
    maxTemp: undefined,
    requiredMedium: "molten",
    description: "NaCl must be molten for electrolysis",
  },

  // Photochemical reactions
  Cl2_formation: {
    element: "Cl2",
    requiresLight: true,
    description: "Cl2 formation from HCl requires UV light",
  },

  // Cryogenic (low temperature)
  liquid_N2: {
    element: "N2",
    maxTemp: -196,
    requiredMedium: "liquid",
    description: "Nitrogen liquefies at -196C",
  },

  // High pressure
  diamond_formation: {
    minPressure: 1000, // Very high pressure
    description: "Diamond formation requires extreme pressure",
  },

  // Aqueous reactions
  acid_base: {
    requiredMedium: "aqueous",
    description: "Acid-base reactions occur in aqueous solution",
  },

  // Noble gas reactions (extreme conditions)
  xenon_compound: {
    element: "Xe",
    minTemp: 0,
    maxTemp: undefined,
    minPressure: 50, // High pressure
    description: "Xenon compounds form only under extreme conditions",
  },
};

/**
 * Check if reaction can occur under given conditions
 */
export function checkConditionFeasibility(
  elements: string[],
  conditions: ReactionConditions
): { feasible: boolean; violations: ConditionConstraint[] } {
  const violations: ConditionConstraint[] = [];

  // Default: allow all reactions at standard conditions
  // Only reject if specific constraints are violated
  if (!conditions) {
    return { feasible: true, violations: [] };
  }

  for (const element of elements) {
    const constraints = findConstraintsForElement(element);

    for (const constraint of constraints) {
      if (!checkConstraint(constraint, conditions)) {
        violations.push(constraint);
      }
    }
  }

  return {
    feasible: violations.length === 0,
    violations,
  };
}

/**
 * Find all constraints for an element or compound
 */
function findConstraintsForElement(element: string): ConditionConstraint[] {
  return Object.values(CONDITION_CONSTRAINTS).filter(
    (c) => !c.element || c.element === element
  );
}

/**
 * Check if conditions satisfy a constraint
 */
function checkConstraint(
  constraint: ConditionConstraint,
  conditions: ReactionConditions
): boolean {
  // Check temperature
  if (constraint.minTemp !== undefined && conditions.temperature < constraint.minTemp) {
    return false;
  }

  if (constraint.maxTemp !== undefined && conditions.temperature > constraint.maxTemp) {
    return false;
  }

  // Check pressure
  if (constraint.minPressure !== undefined && conditions.pressure < constraint.minPressure) {
    return false;
  }

  if (constraint.maxPressure !== undefined && conditions.pressure > constraint.maxPressure) {
    return false;
  }

  // Check medium
  if (constraint.requiredMedium && conditions.medium !== constraint.requiredMedium) {
    return false;
  }

  // Check light requirement
  if (constraint.requiresLight && !conditions.light) {
    return false;
  }

  return true;
}

/**
 * Determine reaction medium based on physical state
 */
export function determineMedium(
  compounds: string[],
  temperature: number = 25
): "aqueous" | "solid" | "gas" | "molten" {
  // If temperature is very high, could be gas phase
  if (temperature > 800) {
    return "gas";
  }

  // If all compounds are aqueous-soluble
  const hasLiquid = compounds.some((c) => {
    // Check if compound is water-soluble
    return true; // Simplified
  });

  if (hasLiquid) {
    return "aqueous";
  }

  // Default to solid
  return "solid";
}

/**
 * Get reaction conditions from description string
 * Examples: "at 100C", "high temperature", "room temperature"
 */
export function parseConditionString(description: string): Partial<ReactionConditions> {
  const conditions: Partial<ReactionConditions> = {};

  const lowerDesc = description.toLowerCase();

  // Temperature parsing
  if (lowerDesc.includes("room")) {
    conditions.temperature = 25;
  } else if (lowerDesc.includes("high") || lowerDesc.includes("heat")) {
    conditions.temperature = 500;
  } else if (lowerDesc.includes("low") || lowerDesc.includes("cold")) {
    conditions.temperature = -20;
  } else {
    // Try to extract number
    const tempMatch = description.match(/(\d+)C/);
    if (tempMatch) {
      conditions.temperature = parseInt(tempMatch[1]);
    }
  }

  // Pressure parsing
  if (lowerDesc.includes("high pressure")) {
    conditions.pressure = 100;
  } else if (lowerDesc.includes("vacuum")) {
    conditions.pressure = 0.001;
  }

  // Medium parsing
  if (lowerDesc.includes("aqueous") || lowerDesc.includes("water")) {
    conditions.medium = "aqueous";
  } else if (lowerDesc.includes("solid")) {
    conditions.medium = "solid";
  } else if (lowerDesc.includes("gas")) {
    conditions.medium = "gas";
  } else if (lowerDesc.includes("molten")) {
    conditions.medium = "molten";
  }

  // Light
  if (lowerDesc.includes("UV") || lowerDesc.includes("light")) {
    conditions.light = true;
  }

  return conditions;
}

/**
 * Create reaction conditions object
 */
export function createConditions(
  temperature: number = 25,
  pressure: number = 1,
  medium: "aqueous" | "solid" | "gas" | "molten" = "aqueous",
  light: boolean = false
): ReactionConditions {
  return { temperature, pressure, medium, light };
}

/**
 * Add custom condition constraint
 */
export function addConditionConstraint(id: string, constraint: ConditionConstraint): void {
  CONDITION_CONSTRAINTS[id] = constraint;
}

/**
 * Get description of current conditions
 */
export function describeConditions(conditions: ReactionConditions): string {
  const parts: string[] = [];

  parts.push(`Temperature: ${conditions.temperature}°C`);
  parts.push(`Pressure: ${conditions.pressure} atm`);
  parts.push(`Medium: ${conditions.medium}`);

  if (conditions.light) {
    parts.push("UV light");
  }

  return parts.join(", ");
}

/**
 * Check if temperature is safe for a reaction
 * Returns true if temperature is within safe range or no constraints exist
 */
export function isTemperatureSafe(minTemp?: number, maxTemp?: number, currentTemp: number = 25): boolean {
  // If no constraints, temperature is safe
  if (minTemp === undefined && maxTemp === undefined) {
    return true;
  }

  // Check minimum temperature
  if (minTemp !== undefined && currentTemp < minTemp) {
    return false;
  }

  // Check maximum temperature
  if (maxTemp !== undefined && currentTemp > maxTemp) {
    return false;
  }

  return true;
}

/**
 * Get recommended temperature range for a reaction
 * Returns [minTemp, maxTemp] in Celsius
 */
export function getTemperatureRange(minTemp?: number, maxTemp?: number): [number, number] {
  // Default: safe room temperature range
  const defaultMin = 15; // °C
  const defaultMax = 100; // °C

  return [
    minTemp ?? defaultMin,
    maxTemp ?? defaultMax,
  ];
}

/**
 * Format temperature for display
 */
export function formatTemperature(temp: number): string {
  if (temp < 0) {
    return `${Math.abs(temp)}°C (freezing)`;
  } else if (temp < 20) {
    return `${temp}°C (cold)`;
  } else if (temp < 40) {
    return `${temp}°C (room temperature)`;
  } else if (temp < 100) {
    return `${temp}°C (warm)`;
  } else if (temp < 200) {
    return `${temp}°C (hot)`;
  } else {
    return `${temp}°C (very hot)`;
  }
}

/**
 * Get temperature warning message
 */
export function getTemperatureWarning(minTemp?: number, maxTemp?: number, currentTemp: number = 25): string | null {
  if (minTemp !== undefined && currentTemp < minTemp) {
    return `Temperature too low! Reaction requires at least ${minTemp}°C (currently ${currentTemp}°C)`;
  }

  if (maxTemp !== undefined && currentTemp > maxTemp) {
    return `Temperature too high! Reaction breaks down above ${maxTemp}°C (currently ${currentTemp}°C)`;
  }

  return null;
}
