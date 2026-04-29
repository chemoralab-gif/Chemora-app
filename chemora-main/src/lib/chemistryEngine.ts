/**
 * Deterministic Chemistry Reaction Engine
 * 5-step pipeline: Validate → Noble Gas → Dissolution → Synthesis → Fallback
 */

export interface ReactionResult {
  reactants: string[];
  products: string[];
  balanced_equation: string;
  outcome: "reaction" | "no_reaction" | "dissolution";
  reaction_type: string;
  feasible: boolean;
  reason: string;
}

interface ElementInfo {
  symbol: string;
  name: string;
  type: "metal" | "nonmetal" | "noble_gas";
  charge: number;
  diatomic: boolean;
}

interface CompoundInfo {
  formula: string;
  cation: string;
  anion: string;
  soluble: boolean;
  ions: string[];
}

// ── Element database ──

const ELEMENTS: Record<string, ElementInfo> = {
  Li:  { symbol: "Li",  name: "Lithium",    type: "metal",     charge: 1,  diatomic: false },
  Na:  { symbol: "Na",  name: "Sodium",     type: "metal",     charge: 1,  diatomic: false },
  K:   { symbol: "K",   name: "Potassium",  type: "metal",     charge: 1,  diatomic: false },
  Mg:  { symbol: "Mg",  name: "Magnesium",  type: "metal",     charge: 2,  diatomic: false },
  Ca:  { symbol: "Ca",  name: "Calcium",    type: "metal",     charge: 2,  diatomic: false },
  Ba:  { symbol: "Ba",  name: "Barium",     type: "metal",     charge: 2,  diatomic: false },
  Fe:  { symbol: "Fe",  name: "Iron",       type: "metal",     charge: 2,  diatomic: false },
  Cu:  { symbol: "Cu",  name: "Copper",     type: "metal",     charge: 2,  diatomic: false },
  Zn:  { symbol: "Zn",  name: "Zinc",       type: "metal",     charge: 2,  diatomic: false },
  Ag:  { symbol: "Ag",  name: "Silver",     type: "metal",     charge: 1,  diatomic: false },
  Al:  { symbol: "Al",  name: "Aluminium",  type: "metal",     charge: 3,  diatomic: false },
  H:   { symbol: "H",   name: "Hydrogen",   type: "nonmetal",  charge: 1,  diatomic: true },
  C:   { symbol: "C",   name: "Carbon",     type: "nonmetal",  charge: -4, diatomic: false },
  N:   { symbol: "N",   name: "Nitrogen",   type: "nonmetal",  charge: -3, diatomic: true },
  O:   { symbol: "O",   name: "Oxygen",     type: "nonmetal",  charge: -2, diatomic: true },
  F:   { symbol: "F",   name: "Fluorine",   type: "nonmetal",  charge: -1, diatomic: true },
  S:   { symbol: "S",   name: "Sulfur",     type: "nonmetal",  charge: -2, diatomic: false },
  P:   { symbol: "P",   name: "Phosphorus", type: "nonmetal",  charge: -3, diatomic: false },
  Cl:  { symbol: "Cl",  name: "Chlorine",   type: "nonmetal",  charge: -1, diatomic: true },
  Br:  { symbol: "Br",  name: "Bromine",    type: "nonmetal",  charge: -1, diatomic: true },
  I:   { symbol: "I",   name: "Iodine",     type: "nonmetal",  charge: -1, diatomic: true },
  He:  { symbol: "He",  name: "Helium",     type: "noble_gas", charge: 0,  diatomic: false },
  Ne:  { symbol: "Ne",  name: "Neon",       type: "noble_gas", charge: 0,  diatomic: false },
  Ar:  { symbol: "Ar",  name: "Argon",      type: "noble_gas", charge: 0,  diatomic: false },
  Kr:  { symbol: "Kr",  name: "Krypton",    type: "noble_gas", charge: 0,  diatomic: false },
  Xe:  { symbol: "Xe",  name: "Xenon",      type: "noble_gas", charge: 0,  diatomic: false },
};

// ── Known compounds for dissolution ──

const COMPOUNDS: Record<string, CompoundInfo> = {
  NaCl:  { formula: "NaCl",  cation: "Na", anion: "Cl",  soluble: true,  ions: ["Na⁺", "Cl⁻"] },
  KCl:   { formula: "KCl",   cation: "K",  anion: "Cl",  soluble: true,  ions: ["K⁺", "Cl⁻"] },
  NaBr:  { formula: "NaBr",  cation: "Na", anion: "Br",  soluble: true,  ions: ["Na⁺", "Br⁻"] },
  KBr:   { formula: "KBr",   cation: "K",  anion: "Br",  soluble: true,  ions: ["K⁺", "Br⁻"] },
  NaI:   { formula: "NaI",   cation: "Na", anion: "I",   soluble: true,  ions: ["Na⁺", "I⁻"] },
  NaOH:  { formula: "NaOH",  cation: "Na", anion: "OH",  soluble: true,  ions: ["Na⁺", "OH⁻"] },
  KOH:   { formula: "KOH",   cation: "K",  anion: "OH",  soluble: true,  ions: ["K⁺", "OH⁻"] },
  AgCl:  { formula: "AgCl",  cation: "Ag", anion: "Cl",  soluble: false, ions: [] },
  BaSO4: { formula: "BaSO4", cation: "Ba", anion: "SO4", soluble: false, ions: [] },
  CaCO3: { formula: "CaCO3", cation: "Ca", anion: "CO3", soluble: false, ions: [] },
  MgCl2: { formula: "MgCl₂", cation: "Mg", anion: "Cl",  soluble: true,  ions: ["Mg²⁺", "Cl⁻", "Cl⁻"] },
  CaCl2: { formula: "CaCl₂", cation: "Ca", anion: "Cl",  soluble: true,  ions: ["Ca²⁺", "Cl⁻", "Cl⁻"] },
  FeCl2: { formula: "FeCl₂", cation: "Fe", anion: "Cl",  soluble: true,  ions: ["Fe²⁺", "Cl⁻", "Cl⁻"] },
  CuSO4: { formula: "CuSO₄", cation: "Cu", anion: "SO4", soluble: true,  ions: ["Cu²⁺", "SO₄²⁻"] },
  ZnCl2: { formula: "ZnCl₂", cation: "Zn", anion: "Cl",  soluble: true,  ions: ["Zn²⁺", "Cl⁻", "Cl⁻"] },
};

// ── Helpers ──

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function subscript(n: number): string {
  if (n <= 1) return "";
  const subs = "₀₁₂₃₄₅₆₇₈₉";
  return String(n).split("").map(d => subs[parseInt(d)]).join("");
}

function formatDiatomic(el: ElementInfo): string {
  return el.diatomic ? `${el.symbol}₂` : el.symbol;
}

function coefficient(n: number): string {
  return n > 1 ? String(n) : "";
}

function noReaction(reactants: string[], reason: string): ReactionResult {
  return {
    reactants,
    products: [],
    balanced_equation: "No reaction",
    outcome: "no_reaction",
    reaction_type: "none",
    feasible: false,
    reason,
  };
}

// ── Build ionic product formula ──

function buildIonicFormula(metal: ElementInfo, nonmetal: ElementInfo): { formula: string; metalSub: number; nonmetalSub: number } {
  const mc = Math.abs(metal.charge);
  const nc = Math.abs(nonmetal.charge);
  const g = gcd(mc, nc);
  const metalSub = nc / g;
  const nonmetalSub = mc / g;
  const formula = `${metal.symbol}${subscript(metalSub)}${nonmetal.symbol}${subscript(nonmetalSub)}`;
  return { formula, metalSub, nonmetalSub };
}

// ── Balance synthesis: aA + bB → cC ──

function balanceSynthesis(metal: ElementInfo, nonmetal: ElementInfo, product: string, metalSub: number, nonmetalSub: number): string {
  // How many atoms each reactant molecule provides
  const metalPerMol = 1; // pure metal
  const nonmetalPerMol = nonmetal.diatomic ? 2 : 1;

  // We need metalSub metal atoms and nonmetalSub nonmetal atoms per product unit
  // Find smallest integer coefficients
  // nonmetal atoms needed = nonmetalSub, each molecule gives nonmetalPerMol
  const nonmetalLcm = nonmetal.diatomic ? lcm(nonmetalSub, nonmetalPerMol) : nonmetalSub;
  const prodCoeff = nonmetal.diatomic ? nonmetalLcm / nonmetalSub : 1;
  const nonmetalCoeff = nonmetal.diatomic ? nonmetalLcm / nonmetalPerMol : nonmetalSub;
  const metalCoeff = metalSub * prodCoeff;

  return `${coefficient(metalCoeff)}${metal.symbol} + ${coefficient(nonmetalCoeff)}${formatDiatomic(nonmetal)} → ${coefficient(prodCoeff)}${product}`;
}

function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b);
}

// ── Covalent product ──

function buildCovalentFormula(a: ElementInfo, b: ElementInfo): { formula: string; aSub: number; bSub: number } {
  const ac = Math.abs(a.charge);
  const bc = Math.abs(b.charge);
  if (ac === 0 || bc === 0) return { formula: `${a.symbol}${b.symbol}`, aSub: 1, bSub: 1 };
  const g = gcd(ac, bc);
  const aSub = bc / g;
  const bSub = ac / g;
  return { formula: `${a.symbol}${subscript(aSub)}${b.symbol}${subscript(bSub)}`, aSub, bSub };
}

// ══════════════════════════════════════════
// MAIN ENGINE — 5-step deterministic pipeline
// ══════════════════════════════════════════

export function simulateReaction(reactantSymbols: string[]): ReactionResult {

  // ─── STEP 1: Validate input ───
  console.log("[ChemEngine] STEP 1: Validate input", reactantSymbols);

  if (!reactantSymbols || !Array.isArray(reactantSymbols) || reactantSymbols.length === 0) {
    const result = noReaction(reactantSymbols ?? [], "invalid input");
    console.log("[ChemEngine] Result:", result);
    return result;
  }

  const cleaned = reactantSymbols.map(s => s.trim()).filter(Boolean);
  if (cleaned.length === 0) {
    const result = noReaction(cleaned, "invalid input");
    console.log("[ChemEngine] Result:", result);
    return result;
  }

  if (cleaned.length === 1) {
    const result = noReaction(cleaned, "Need at least two reactants for a reaction.");
    console.log("[ChemEngine] Result:", result);
    return result;
  }

  // ─── STEP 2: Check noble gases ───
  console.log("[ChemEngine] STEP 2: Check noble gases");

  for (const sym of cleaned) {
    const el = ELEMENTS[sym];
    if (el && el.type === "noble_gas") {
      const result: ReactionResult = {
        reactants: cleaned,
        products: [],
        balanced_equation: "No reaction",
        outcome: "no_reaction",
        reaction_type: "none",
        feasible: false,
        reason: `${el.name} is a noble gas — inert element, does not react.`,
      };
      console.log("[ChemEngine] STEP 2 triggered:", result);
      return result;
    }
  }

  // ─── STEP 3: Check dissolution (compound + water) ───
  console.log("[ChemEngine] STEP 3: Check dissolution");

  const hasWater = cleaned.some(s => s === "H2O" || s === "water" || s === "Water");
  if (hasWater) {
    const nonWater = cleaned.filter(s => s !== "H2O" && s !== "water" && s !== "Water");
    for (const sym of nonWater) {
      const compound = COMPOUNDS[sym];
      if (compound) {
        if (compound.soluble) {
          const result: ReactionResult = {
            reactants: cleaned,
            products: compound.ions,
            balanced_equation: `${compound.formula} → ${compound.ions.join(" + ")}`,
            outcome: "dissolution",
            reaction_type: "dissolution",
            feasible: true,
            reason: `${compound.formula} is soluble and dissociates into ${compound.ions.join(" and ")} in water.`,
          };
          console.log("[ChemEngine] STEP 3 triggered (dissolution):", result);
          return result;
        } else {
          const result = noReaction(cleaned, `${compound.formula} is insoluble in water — no dissolution occurs.`);
          console.log("[ChemEngine] STEP 3 triggered (insoluble):", result);
          return result;
        }
      }
    }
  }

  // ─── STEP 4: Check synthesis (metal + nonmetal, or nonmetal + nonmetal) ───
  console.log("[ChemEngine] STEP 4: Check synthesis");

  const [sym1, sym2] = cleaned;
  const el1 = ELEMENTS[sym1];
  const el2 = ELEMENTS[sym2];

  if (!el1) {
    const result = noReaction(cleaned, `Unknown element: ${sym1}`);
    console.log("[ChemEngine] Result:", result);
    return result;
  }
  if (!el2) {
    const result = noReaction(cleaned, `Unknown element: ${sym2}`);
    console.log("[ChemEngine] Result:", result);
    return result;
  }

  if (sym1 === sym2) {
    const result = noReaction(cleaned, "Same element provided twice — no new compound forms.");
    console.log("[ChemEngine] Result:", result);
    return result;
  }

  // Metal + Nonmetal → Ionic synthesis
  if ((el1.type === "metal" && el2.type === "nonmetal") || (el1.type === "nonmetal" && el2.type === "metal")) {
    const metal = el1.type === "metal" ? el1 : el2;
    const nonmetal = el1.type === "nonmetal" ? el1 : el2;
    const { formula, metalSub, nonmetalSub } = buildIonicFormula(metal, nonmetal);
    const equation = balanceSynthesis(metal, nonmetal, formula, metalSub, nonmetalSub);
    const name = `${metal.name} ${nonmetal.name.replace(/ine$|en$/, "ide")}`;

    const result: ReactionResult = {
      reactants: cleaned,
      products: [formula],
      balanced_equation: equation,
      outcome: "reaction",
      reaction_type: "ionic (synthesis)",
      feasible: true,
      reason: `${metal.name} transfers electrons to ${nonmetal.name}, forming ionic compound ${name}.`,
    };
    console.log("[ChemEngine] STEP 4 triggered (ionic):", result);
    return result;
  }

  // Nonmetal + Nonmetal → Covalent synthesis
  if (el1.type === "nonmetal" && el2.type === "nonmetal") {
    const { formula, aSub, bSub } = buildCovalentFormula(el1, el2);

    // Simple balancing for covalent
    const d1 = el1.diatomic ? 2 : 1;
    const d2 = el2.diatomic ? 2 : 1;
    const l1 = lcm(aSub, d1);
    const prodCoeff1 = l1 / aSub;
    const el1Coeff = l1 / d1;
    const neededB = bSub * prodCoeff1;
    const l2 = lcm(neededB, d2);
    const scale = l2 / neededB;
    const finalProd = prodCoeff1 * scale;
    const finalEl1 = el1Coeff * scale;
    const finalEl2 = l2 / d2;

    const equation = `${coefficient(finalEl1)}${formatDiatomic(el1)} + ${coefficient(finalEl2)}${formatDiatomic(el2)} → ${coefficient(finalProd)}${formula}`;
    const name = `${el1.name} ${el2.name.replace(/ine$|en$/, "ide")}`;

    const result: ReactionResult = {
      reactants: cleaned,
      products: [formula],
      balanced_equation: equation,
      outcome: "reaction",
      reaction_type: "covalent (synthesis)",
      feasible: true,
      reason: `${el1.name} and ${el2.name} share electrons, forming covalent compound ${name}.`,
    };
    console.log("[ChemEngine] STEP 4 triggered (covalent):", result);
    return result;
  }

  // Metal + Metal
  if (el1.type === "metal" && el2.type === "metal") {
    const result = noReaction(cleaned, "Two metals do not undergo a simple synthesis reaction — they may form alloys under special conditions.");
    console.log("[ChemEngine] STEP 4: metal+metal, no reaction:", result);
    return result;
  }

  // ─── STEP 5: Fallback ───
  console.log("[ChemEngine] STEP 5: Fallback — no valid reaction rule");

  const fallback = noReaction(cleaned, "no valid reaction rule");
  console.log("[ChemEngine] Result:", fallback);
  return fallback;
}
