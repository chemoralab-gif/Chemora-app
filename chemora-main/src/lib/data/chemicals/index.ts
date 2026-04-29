import { Chemical } from "@/lib/schemas/chemical";
import { PERIODIC_ELEMENTS } from "./elements";
import { COMMON_COMPOUNDS } from "./compounds";
import { ENDOTHERMIC_SUBSTANCES } from "./endothermic-substances";

// Combine all chemicals into a single array
// Combine arrays but deduplicate by `id` (keep first occurrence)
const combined = [
  ...PERIODIC_ELEMENTS,
  ...COMMON_COMPOUNDS,
  ...ENDOTHERMIC_SUBSTANCES,
];

const seen = new Set<string>();
export const ALL_CHEMICALS: Chemical[] = combined.filter((c) => {
  if (seen.has(c.id)) return false;
  seen.add(c.id);
  return true;
});

// Export individual chemical arrays for advanced use
export { PERIODIC_ELEMENTS, COMMON_COMPOUNDS, ENDOTHERMIC_SUBSTANCES };

// Export helper maps for easy lookups
export const CHEMICAL_MAP = new Map(ALL_CHEMICALS.map((c) => [c.id, c]));
export const CHEMICAL_BY_FORMULA = new Map(ALL_CHEMICALS.map((c) => [c.formula, c]));
