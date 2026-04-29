/**
 * Solubility Rules & State Detection
 * Determines product phases (aq), (s), (g), and precipitation reactions
 */

export interface SolubilityData {
  compound: string;
  solubility: "soluble" | "insoluble" | "slightly-soluble";
  state: "aq" | "s" | "g" | "l"; // aqueous, solid, gas, liquid
  rules?: string[];
}

/**
 * Common solubility rules for ionic compounds
 * Based on standard chemistry solubility guidelines
 */
const SOLUBILITY_RULES: Record<string, SolubilityData> = {
  // Sodium compounds - generally soluble
  NaCl: { compound: "NaCl", solubility: "soluble", state: "aq" },
  Na2O: { compound: "Na2O", solubility: "soluble", state: "aq" },
  Na2SO4: { compound: "Na2SO4", solubility: "soluble", state: "aq" },
  NaOH: { compound: "NaOH", solubility: "soluble", state: "aq" },
  NaNO3: { compound: "NaNO3", solubility: "soluble", state: "aq" },

  // Potassium compounds - generally soluble
  KCl: { compound: "KCl", solubility: "soluble", state: "aq" },
  KOH: { compound: "KOH", solubility: "soluble", state: "aq" },

  // Calcium compounds
  CaCl2: { compound: "CaCl2", solubility: "soluble", state: "aq" },
  CaO: { compound: "CaO", solubility: "soluble", state: "s", rules: ["Calcium oxide forms Ca(OH)2 in water"] },
  "Ca(OH)2": { compound: "Ca(OH)2", solubility: "slightly-soluble", state: "s" },
  CaCO3: { compound: "CaCO3", solubility: "insoluble", state: "s" },
  CaSO4: { compound: "CaSO4", solubility: "slightly-soluble", state: "s" },

  // Magnesium compounds
  MgO: { compound: "MgO", solubility: "soluble", state: "s" },
  "Mg(OH)2": { compound: "Mg(OH)2", solubility: "insoluble", state: "s" },
  MgCl2: { compound: "MgCl2", solubility: "soluble", state: "aq" },
  MgSO4: { compound: "MgSO4", solubility: "soluble", state: "aq" },

  // Silver compounds - mostly insoluble (precipitate)
  AgCl: { compound: "AgCl", solubility: "insoluble", state: "s", rules: ["White precipitate"] },
  AgBr: { compound: "AgBr", solubility: "insoluble", state: "s", rules: ["Cream precipitate"] },
  AgI: { compound: "AgI", solubility: "insoluble", state: "s", rules: ["Yellow precipitate"] },
  Ag2SO4: { compound: "Ag2SO4", solubility: "slightly-soluble", state: "s" },
  AgNO3: { compound: "AgNO3", solubility: "soluble", state: "aq" },

  // Barium compounds
  BaCl2: { compound: "BaCl2", solubility: "soluble", state: "aq" },
  BaSO4: { compound: "BaSO4", solubility: "insoluble", state: "s", rules: ["White precipitate"] },
  BaCO3: { compound: "BaCO3", solubility: "insoluble", state: "s" },

  // Hydroxides - most insoluble except alkali metals
  "Fe(OH)2": { compound: "Fe(OH)2", solubility: "insoluble", state: "s", rules: ["Forms green/white precipitate, oxidizes"] },
  "Fe(OH)3": { compound: "Fe(OH)3", solubility: "insoluble", state: "s", rules: ["Forms reddish-brown precipitate"] },
  "Cu(OH)2": { compound: "Cu(OH)2", solubility: "insoluble", state: "s", rules: ["Forms blue precipitate"] },
  "Al(OH)3": { compound: "Al(OH)3", solubility: "insoluble", state: "s" },

  // Carbonates - mostly insoluble except alkali metals
  PbCO3: { compound: "PbCO3", solubility: "insoluble", state: "s" },

  // Sulfates
  K2SO4: { compound: "K2SO4", solubility: "soluble", state: "aq" },
  CuSO4: { compound: "CuSO4", solubility: "soluble", state: "aq" },
  ZnSO4: { compound: "ZnSO4", solubility: "soluble", state: "aq" },

  // Ammonia (dissolves in water)
  NH3: { compound: "NH3", solubility: "soluble", state: "aq" },

  // Gases
  H2: { compound: "H2", solubility: "insoluble", state: "g" },
  O2: { compound: "O2", solubility: "insoluble", state: "g" },
  CO2: { compound: "CO2", solubility: "slightly-soluble", state: "g" },
  Cl2: { compound: "Cl2", solubility: "slightly-soluble", state: "g" },
  SO2: { compound: "SO2", solubility: "soluble", state: "g" },
  NO2: { compound: "NO2", solubility: "slightly-soluble", state: "g" },
  H2O: { compound: "H2O", solubility: "soluble", state: "l" },
};

/**
 * Get solubility information for a compound
 */
export function getSolubility(compound: string): SolubilityData | null {
  return SOLUBILITY_RULES[compound] || null;
}

/**
 * Determine the state symbol for a compound
 * (aq) = aqueous, (s) = solid, (g) = gas, (l) = liquid
 */
export function getStateSymbol(compound: string): string {
  const data = getSolubility(compound);

  if (!data) {
    // Guess based on heuristics if not in database
    if (compound.includes("O2") || compound.includes("H2") || compound.includes("Cl2")) {
      return "(g)"; // Likely a gas
    }
    if (compound === "H2O") return "(l)";
    return "(aq)"; // Default to aqueous
  }

  switch (data.state) {
    case "aq":
      return "(aq)";
    case "s":
      return "(s)";
    case "g":
      return "(g)";
    case "l":
      return "(l)";
    default:
      return "(aq)";
  }
}

/**
 * Check if this is a precipitation reaction
 * Occurs when insoluble products form from soluble reactants
 */
export function isPrecipitationReaction(
  reactants: string[],
  products: string[]
): boolean {
  // Check if any product is insoluble
  let hasInsoluble = false;

  for (const product of products) {
    const data = getSolubility(product);
    if (data && data.solubility === "insoluble") {
      hasInsoluble = true;
      break;
    }
  }

  // Check if reactants are soluble
  let reactantsSoluble = true;
  for (const reactant of reactants) {
    const data = getSolubility(reactant);
    if (data && data.solubility === "insoluble") {
      reactantsSoluble = false;
      break;
    }
  }

  return hasInsoluble && reactantsSoluble;
}

/**
 * Check if this is a gas-forming reaction
 */
export function isGasFormingReaction(products: string[]): boolean {
  for (const product of products) {
    const data = getSolubility(product);
    if (data && data.state === "g") {
      return true;
    }
  }

  return false;
}

/**
 * Get all insoluble products (precipitates)
 */
export function getPrecipitates(products: string[]): string[] {
  return products.filter((product) => {
    const data = getSolubility(product);
    return data && data.solubility === "insoluble";
  });
}

/**
 * Get reaction type description
 */
export function getReactionTypeDescription(
  reactants: string[],
  products: string[]
): string {
  if (isPrecipitationReaction(reactants, products)) {
    const precipitates = getPrecipitates(products);
    return `Precipitation: ${precipitates.join(", ")} forms`;
  }

  if (isGasFormingReaction(products)) {
    return "Gas-forming reaction";
  }

  return "Dissolution or combination reaction";
}

/**
 * Format balanced equation with state symbols
 */
export function formatEquationWithStates(
  reactants: string[],
  products: string[],
  reactantCoeff: number[],
  productCoeff: number[]
): string {
  const reactantStr = reactants
    .map((r, i) => {
      const coef = reactantCoeff[i];
      const state = getStateSymbol(r);
      return coef > 1 ? `${coef}${r}${state}` : `${r}${state}`;
    })
    .join(" + ");

  const productStr = products
    .map((p, i) => {
      const coef = productCoeff[i];
      const state = getStateSymbol(p);
      return coef > 1 ? `${coef}${p}${state}` : `${p}${state}`;
    })
    .join(" + ");

  return `${reactantStr} → ${productStr}`;
}

/**
 * Add a custom solubility rule
 */
export function addSolubilityRule(compound: string, data: SolubilityData): void {
  SOLUBILITY_RULES[compound] = data;
}

/**
 * Check if compound dissolves in water
 */
export function dissolvesInWater(compound: string): boolean {
  const data = getSolubility(compound);
  if (!data) return false;

  return data.state === "aq" || data.solubility === "soluble";
}

/**
 * Dissociate ionic compound into ions
 * Example: NaCl(s) → Na+(aq) + Cl-(aq)
 */
export function dissociateCompound(compound: string): { ions: string[]; feasible: boolean } {
  // Map of common ionic compounds to their dissociation products
  const dissociationMap: Record<string, string[]> = {
    // Sodium compounds
    NaCl: ["Na+", "Cl-"],
    Na2O: ["Na+", "O2-"],
    Na2SO4: ["Na+", "SO4(2-)"],
    NaOH: ["Na+", "OH-"],
    NaNO3: ["Na+", "NO3-"],
    Na2CO3: ["Na+", "CO3(2-)"],
    Na2SO3: ["Na+", "SO3(2-)"],

    // Potassium compounds
    KCl: ["K+", "Cl-"],
    KOH: ["K+", "OH-"],
    KNO3: ["K+", "NO3-"],
    K2SO4: ["K+", "SO4(2-)"],
    K2CO3: ["K+", "CO3(2-)"],
    KBr: ["K+", "Br-"],

    // Calcium compounds (soluble ones)
    CaCl2: ["Ca2+", "Cl-"],
    CaSO4: ["Ca2+", "SO4(2-)"],
    "Ca(NO3)2": ["Ca2+", "NO3-"],

    // Magnesium compounds
    MgCl2: ["Mg2+", "Cl-"],
    MgSO4: ["Mg2+", "SO4(2-)"],
    "Mg(NO3)2": ["Mg2+", "NO3-"],

    // Silver compounds (soluble ones)
    AgNO3: ["Ag+", "NO3-"],

    // Barium compounds
    BaCl2: ["Ba2+", "Cl-"],
    "Ba(NO3)2": ["Ba2+", "NO3-"],

    // Copper compounds
    CuSO4: ["Cu2+", "SO4(2-)"],
    "Cu(NO3)2": ["Cu2+", "NO3-"],

    // Zinc compounds
    ZnSO4: ["Zn2+", "SO4(2-)"],
    "Zn(NO3)2": ["Zn2+", "NO3-"],
    ZnCl2: ["Zn2+", "Cl-"],

    // Ammonium compounds
    NH4Cl: ["NH4+", "Cl-"],
    "(NH4)2SO4": ["NH4+", "SO4(2-)"],
    NH4NO3: ["NH4+", "NO3-"],

    // Nitrate salts
    HNO3: ["H+", "NO3-"],
    LiNO3: ["Li+", "NO3-"],
    "Mn(NO3)2": ["Mn2+", "NO3-"],
    "Fe(NO3)2": ["Fe2+", "NO3-"],
    "Fe(NO3)3": ["Fe3+", "NO3-"],

    // Chloride salts
    HCl: ["H+", "Cl-"],
    LiCl: ["Li+", "Cl-"],
    RbCl: ["Rb+", "Cl-"],

    // Hydroxides (soluble ones)
    LiOH: ["Li+", "OH-"],
    RbOH: ["Rb+", "OH-"],

    // Sulfate salts
    H2SO4: ["H+", "SO4(2-)"],
    Li2SO4: ["Li+", "SO4(2-)"],
  };

  const ions = dissociationMap[compound];
  if (ions) {
    return { ions, feasible: true };
  }

  // Fallback: compound does not have a known dissociation
  return { ions: [], feasible: false };
}

/**
 * Check if a compound is soluble (can dissolve in water)
 * Returns true only for compounds marked as "soluble"
 */
export function isSoluble(compound: string): boolean {
  const data = getSolubility(compound);
  if (!data) return false;

  return data.solubility === "soluble";
}

/**
 * Check if a compound is insoluble (cannot dissolve in water)
 */
export function isInsoluble(compound: string): boolean {
  const data = getSolubility(compound);
  if (!data) return false;

  return data.solubility === "insoluble";
}

/**
 * Apply solubility rules to determine if compound dissolves
 * Rules:
 * - All Na+, K+, NH4+ salts are soluble
 * - All NO3- salts are soluble
 * - AgCl, CaCO3, etc. are insoluble (see database)
 */
export function checkSolubilityRules(compound: string): "soluble" | "insoluble" {
  const data = getSolubility(compound);
  if (data) {
    return data.solubility === "soluble" ? "soluble" : "insoluble";
  }

  // Apply general solubility rules
  // Rule 1: All Na+ salts are soluble
  if (compound.includes("Na")) return "soluble";

  // Rule 2: All K+ salts are soluble
  if (compound.includes("K")) return "soluble";

  // Rule 3: All NH4+ salts are soluble
  if (compound.includes("NH4")) return "soluble";

  // Rule 4: All NO3- salts are soluble
  if (compound.includes("NO3")) return "soluble";

  // Rule 5: Known insoluble compounds
  const insolblableCompounds = [
    "AgCl",
    "AgBr",
    "AgI",
    "BaSO4",
    "CaSO4",
    "CaCO3",
    "BaCO3",
    "PbCO3",
    "CuS",
    "FeS",
    "ZnS",
    "MgCO3",
    "MnCO3",
  ];
  if (insolblableCompounds.includes(compound)) return "insoluble";

  // Default: assume soluble
  return "soluble";
}
