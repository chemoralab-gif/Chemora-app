import { useState, useCallback, lazy, Suspense, useDeferredValue, useEffect, useMemo, useRef } from "react";
import ChemicalPalette from "@/components/ChemicalPalette";
import type { CalorimetryData } from "@/components/types/thermal";
import type { Chemical, Apparatus, ExperimentStep } from "@/lib/reactions";
import type { Reaction } from "@/lib/schemas/reaction";
import { ALL_CHEMICALS } from "@/lib/data/chemicals";
import { ALL_REACTIONS } from "@/lib/data/reactions";
import { APPARATUSES } from "@/lib/apparatus";
import { ClipboardCheck, FileText, HelpCircle, ListChecks, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUIMode } from "@/hooks/use-ui-mode";

// Lazy load heavy components
const MobileSwipeLayout = lazy(() => import("@/components/MobileSwipeLayout"));
const DesktopEquipmentArea = lazy(() => import("@/components/DesktopEquipmentArea"));
const ThermalAnalysisPanel = lazy(() => import("@/components/ThermalAnalysisPanel"));
const ExperimentReport = lazy(() => import("@/components/ExperimentReport"));
const OnboardingTutorial = lazy(() => import("@/components/OnboardingTutorial"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center w-full h-full bg-background">
    <div className="flex flex-col items-center gap-2">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-muted-foreground">Loading...</p>
    </div>
  </div>
);

export type SelectedItem =
  | { type: "chemical"; data: Chemical }
  | { type: "apparatus"; data: Apparatus }
  | null;

type TestPanelMode = "choose" | "test" | "steps";

interface TestScoreResult {
  score: number;
  checks: { label: string; passed: boolean; points: number }[];
  summary: string;
}

function stepHasChemical(steps: ExperimentStep[], id: string, formula: string): boolean {
  return steps.some((step) =>
    step.chemicals.some((chemical) => chemical.id === id || chemical.formula === formula) ||
    step.material?.id === `chemical:${id}`
  );
}

function stepHasApparatus(steps: ExperimentStep[], id: string, name: string): boolean {
  return steps.some((step) =>
    step.apparatus.includes(name) ||
    step.material?.id === `apparatus:${id}` ||
    step.material?.name === name
  );
}

function hasKohOutput(steps: ExperimentStep[]): boolean {
  return steps.some((step) =>
    step.reaction?.products.includes("KOH") ||
    step.reaction?.equation.includes("KOH") ||
    step.chemicals.some((chemical) => chemical.id === "koh" || chemical.formula === "KOH") ||
    step.material?.id === "chemical:koh"
  );
}

function hasBeakerSetup(steps: ExperimentStep[]): boolean {
  return steps.some((step) =>
    step.beakerLabel.toLowerCase().startsWith("beaker") ||
    step.material?.id === "apparatus:beaker" ||
    step.material?.category === "container"
  );
}

function scoreKohExperiment(steps: ExperimentStep[]): TestScoreResult {
  const checks = [
    { label: "KOH result/output appeared", passed: hasKohOutput(steps), points: 3 },
    { label: "Used a beaker or container", passed: hasBeakerSetup(steps), points: 1 },
    { label: "Added potassium", passed: stepHasChemical(steps, "potassium", "K"), points: 1 },
    { label: "Added water", passed: stepHasChemical(steps, "water", "H2O") || stepHasChemical(steps, "water", "H₂O"), points: 1 },
    { label: "Added safety goggles", passed: stepHasApparatus(steps, "safety-goggles", "Safety Goggles"), points: 2 },
    { label: "Prepared for hydrogen gas release", passed: stepHasApparatus(steps, "gas-jar", "Gas Collection Jar"), points: 1 },
    { label: "Recorded an actual reaction", passed: steps.some((step) => !!step.reaction), points: 1 },
  ];
  const earned = checks.reduce((sum, check) => sum + (check.passed ? check.points : 0), 1);
  const score = Math.min(10, Math.max(1, earned));
  const summary = score >= 8
    ? "Strong result. The product and most safety/setup checks are present."
    : score >= 5
    ? "Partly complete. The experiment is close, but some result or safety evidence is missing."
    : "Needs more work. Complete the KOH output and add the required safety/setup items.";
  return { score, checks, summary };
}

function getKohGuideState(steps: ExperimentStep[]) {
  if (!hasBeakerSetup(steps)) {
    return {
      search: "Beaker",
      tab: "apparatus" as const,
      targetId: "beaker",
      message: "Add a beaker from Apparatus, then place it on the Fusion Desk.",
      done: false,
    };
  }
  if (!stepHasApparatus(steps, "safety-goggles", "Safety Goggles")) {
    return {
      search: "Safety Goggles",
      tab: "apparatus" as const,
      targetId: "safety-goggles",
      message: "Add safety goggles before using potassium with water.",
      done: false,
    };
  }
  if (!stepHasChemical(steps, "potassium", "K")) {
    return {
      search: "Potassium",
      tab: "chemicals" as const,
      targetId: "potassium",
      message: "Add potassium to the beaker.",
      done: false,
    };
  }
  if (!stepHasChemical(steps, "water", "H2O") && !stepHasChemical(steps, "water", "H₂O")) {
    return {
      search: "Water",
      tab: "chemicals" as const,
      targetId: "water",
      message: "Add water to react with potassium and form KOH.",
      done: false,
    };
  }
  if (!hasKohOutput(steps)) {
    return {
      search: "",
      tab: "chemicals" as const,
      targetId: "",
      message: "Wait for the reaction output to show KOH. Add a gas jar if you want a stronger safety score.",
      done: false,
    };
  }
  return {
    search: "",
    tab: "chemicals" as const,
    targetId: "",
    message: "Done: KOH has been achieved.",
    done: true,
  };
}

type GenericTestMode = "idle" | "setup" | "steps";
type TestTargetKind = "chemical" | "reactant" | "product";
type SafetyProcedureId = "safety-goggles" | "safety-shield" | "gas-jar";

interface GuideState {
  key: string;
  search: string;
  tab: "chemicals" | "apparatus";
  targetId: string;
  message: string;
  completeMessage: string;
  done: boolean;
  complete?: boolean;
}

interface TestTarget {
  id: string;
  kind: TestTargetKind;
  label: string;
  formula: string;
  reaction?: Reaction;
}

interface ProductSlot {
  query: string;
  target: TestTarget | null;
}

const SAFETY_PROCEDURES: SafetyProcedureId[] = ["safety-goggles", "safety-shield", "gas-jar"];

function normalizeTestText(value: string): string {
  const subscripts: Record<string, string> = {
    "₀": "0",
    "₁": "1",
    "₂": "2",
    "₃": "3",
    "₄": "4",
    "₅": "5",
    "₆": "6",
    "₇": "7",
    "₈": "8",
    "₉": "9",
  };
  return value.toLowerCase().replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (char) => subscripts[char] ?? char).replace(/[^a-z0-9]+/g, "");
}

function textMatchesNeedle(value: string | undefined, needle: string): boolean {
  if (!value) return false;
  return normalizeTestText(value).includes(normalizeTestText(needle));
}

const CHEMICAL_BY_TEST_TEXT = new Map<string, Chemical>();
for (const chemical of ALL_CHEMICALS) {
  CHEMICAL_BY_TEST_TEXT.set(normalizeTestText(chemical.id), chemical);
  CHEMICAL_BY_TEST_TEXT.set(normalizeTestText(chemical.name), chemical);
  CHEMICAL_BY_TEST_TEXT.set(normalizeTestText(chemical.formula), chemical);
}

function stepHasChemicalGeneric(steps: ExperimentStep[], formulaOrName: string): boolean {
  const target = normalizeTestText(formulaOrName);
  const targetChemical = chemicalForReactant(formulaOrName);
  return steps.some((step) =>
    step.chemicals.some((chemical) =>
      normalizeTestText(chemical.id) === target ||
      normalizeTestText(chemical.formula) === target ||
      normalizeTestText(chemical.name) === target
    ) ||
    (targetChemical && step.material?.id === `chemical:${targetChemical.id}`) ||
    normalizeTestText(step.material?.name ?? "") === target
  );
}

function chemicalForReactant(reactant: string): Chemical | undefined {
  return CHEMICAL_BY_TEST_TEXT.get(normalizeTestText(reactant));
}

function splitReactionProducts(products: string): string[] {
  return products
    .replace(/[↓↑]/g, "")
    .split("+")
    .map((part) => part.trim().replace(/^\d+/, "").trim())
    .filter(Boolean);
}

function splitReactionPart(value: string): string[] {
  return value
    .replace(/[↓↑]/g, "")
    .split("+")
    .map((part) => part.trim().replace(/^\d+/, "").trim())
    .filter(Boolean);
}

function optionMatchScore(option: TestTarget, query: string): number {
  const q = normalizeTestText(query);
  const label = normalizeTestText(option.label);
  const formula = normalizeTestText(option.formula);
  if (label === q || formula === q) return 0;
  if (label.startsWith(q) || formula.startsWith(q)) return 1;
  if (label.includes(q) || formula.includes(q)) return 2;
  return 3;
}

function reactionUsabilityScore(reaction: Reaction | undefined, productFormula: string): number {
  if (!reaction) return 999;
  const productParts = splitReactionProducts(reaction.products);
  const exactProduct = productParts.some((product) => normalizeTestText(product) === normalizeTestText(productFormula)) ? 0 : 20;
  const missingReactants = reaction.reactants.filter((reactant) => reactant !== "Heat" && !chemicalForReactant(reactant)).length;
  const directBuildBonus = reaction.reactants.some((reactant) => normalizeTestText(reactant) === normalizeTestText(productFormula)) ? 25 : 0;
  return exactProduct + missingReactants * 10 + directBuildBonus + reaction.reactants.length;
}

const BEST_REACTION_CACHE = new Map<string, Reaction | null>();

function bestReactionForProduct(formulaOrName: string): Reaction | undefined {
  const key = normalizeTestText(formulaOrName);
  const cached = BEST_REACTION_CACHE.get(key);
  if (cached !== undefined) return cached ?? undefined;

  let best: Reaction | undefined;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const reaction of ALL_REACTIONS) {
    const matches = splitReactionProducts(reaction.products).some((product) => textMatchesNeedle(product, formulaOrName)) ||
      textMatchesNeedle(reaction.products, formulaOrName);
    if (!matches) continue;
    const score = reactionUsabilityScore(reaction, formulaOrName);
    if (score < bestScore) {
      best = reaction;
      bestScore = score;
    }
  }

  BEST_REACTION_CACHE.set(key, best ?? null);
  return best;
}

function buildTargetOptions(query: string): TestTarget[] {
  if (!normalizeTestText(query)) return [];
  const productOptions = ALL_REACTIONS.flatMap((reaction) =>
    splitReactionProducts(reaction.products).map((product) => ({
      id: `product:${reaction.equation}:${product}`,
      kind: "product" as const,
      label: product,
      formula: product,
      reaction,
    }))
  ).filter((option) => textMatchesNeedle(option.label, query) || textMatchesNeedle(option.formula, query) || textMatchesNeedle(option.reaction.equation, query));
  const seen = new Set<string>();
  return productOptions.filter((option) => {
    const key = normalizeTestText(`${option.kind}:${option.formula}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => optionMatchScore(a, query) - optionMatchScore(b, query) || a.label.localeCompare(b.label)).slice(0, 12);
}

interface ProductTargetFieldProps {
  index: number;
  slot: ProductSlot;
  onQueryChange: (index: number, query: string) => void;
  onSelect: (index: number, target: TestTarget) => void;
}

function ProductTargetField({ index, slot, onQueryChange, onSelect }: ProductTargetFieldProps) {
  const deferredQuery = useDeferredValue(slot.query);
  const options = useMemo(
    () => slot.target ? [] : buildTargetOptions(deferredQuery),
    [deferredQuery, slot.target]
  );
  const isBlank = !slot.target && !slot.query.trim();

  return (
    <div className={`relative min-w-24 flex-1 ${isBlank ? "opacity-60" : "opacity-100"}`}>
      <input
        value={slot.query}
        onChange={(event) => onQueryChange(index, event.target.value)}
        placeholder="Product"
        className="h-8 w-full border-0 border-b border-primary/45 bg-transparent px-1 text-center text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
      />
      {options.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-44 overflow-auto rounded-md border border-border bg-card p-1 shadow-xl">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelect(index, option)}
              className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs text-foreground hover:bg-secondary"
            >
              <span className="min-w-0 truncate">{option.label}</span>
              <span className="shrink-0 text-[9px] uppercase text-muted-foreground">{option.kind}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function targetsShareReaction(first: TestTarget | null, second: TestTarget | null): boolean {
  if (!first || !second) return false;
  return ALL_REACTIONS.some((reaction) =>
    (textMatchesNeedle(reaction.products, first.formula) || textMatchesNeedle(reaction.equation, first.formula)) &&
    (textMatchesNeedle(reaction.products, second.formula) || textMatchesNeedle(reaction.equation, second.formula))
  );
}

function targetsUseOneReaction(targets: TestTarget[]): boolean {
  if (targets.length <= 1) return !!targets[0]?.reaction;
  return ALL_REACTIONS.some((reaction) =>
    targets.every((target) => textMatchesNeedle(reaction.products, target.formula) || textMatchesNeedle(reaction.equation, target.formula))
  );
}

function targetNeedsSafety(target: TestTarget | null): boolean {
  const reaction = target?.reaction;
  if (!reaction) return false;
  return reaction.intensity >= 4 || ["explosion", "fire", "gas-release", "bubbles", "fizz"].includes(reaction.effect);
}

function targetNeedsGasJar(target: TestTarget | null): boolean {
  const reaction = target?.reaction;
  if (!reaction) return false;
  return reaction.effect === "gas-release" || reaction.products.includes("H₂") || reaction.products.includes("H2") || reaction.products.includes("CO₂");
}

function hasOutputForTarget(steps: ExperimentStep[], target: TestTarget | null): boolean {
  if (!target) return false;
  return steps.some((step) =>
    textMatchesNeedle(step.reaction?.products, target.formula) ||
    textMatchesNeedle(step.reaction?.equation, target.formula) ||
    textMatchesNeedle(step.material?.label, `${target.label} output`)
  );
}

function scoreTargetExperiment(steps: ExperimentStep[], target: TestTarget | null): TestScoreResult {
  const reactants = target?.reaction?.reactants.filter((reactant) => reactant !== "Heat") ?? [];
  const reactantPoint = reactants.length > 2 ? 1 : 2;
  const needsSafety = targetNeedsSafety(target);
  const needsGasJar = targetNeedsGasJar(target);
  const checks = [
    { label: `${target?.label ?? "Target"} result/output appeared`, passed: hasOutputForTarget(steps, target), points: 3 },
    { label: "Used a beaker or container", passed: hasBeakerSetup(steps), points: 1 },
    ...reactants.map((reactant) => ({ label: `Added ${reactant}`, passed: stepHasChemicalGeneric(steps, reactant), points: reactantPoint })),
    { label: "Added safety goggles", passed: !needsSafety || stepHasApparatus(steps, "safety-goggles", "Safety Goggles"), points: 2 },
    { label: "Handled gas release safely", passed: !needsGasJar || stepHasApparatus(steps, "gas-jar", "Gas Collection Jar"), points: 1 },
    { label: "Recorded an actual reaction", passed: steps.some((step) => !!step.reaction), points: 1 },
  ];
  const earned = checks.reduce((sum, check) => sum + (check.passed ? check.points : 0), 1);
  const score = Math.min(10, Math.max(1, earned));
  const summary = score >= 8
    ? "Strong result. The product and setup checks are present."
    : score >= 5
    ? "Partly complete. Some result, reactant, or safety evidence is missing."
    : "Needs more work. Complete the target output and required setup.";
  return { score, checks, summary };
}

function apparatusForId(id: string) {
  return APPARATUSES.find((apparatus) => apparatus.id === id);
}

function getTargetGuideState(steps: ExperimentStep[], target: TestTarget | null, safetyProcedureIds: SafetyProcedureId[]): GuideState {
  if (!target) {
    return {
      key: "target",
      search: "",
      tab: "chemicals",
      targetId: "",
      message: "Choose a product first.",
      completeMessage: "Product selected.",
      done: false,
    };
  }
  if (!hasBeakerSetup(steps)) {
    return {
      key: "container",
      search: "container",
      tab: "apparatus",
      targetId: "",
      message: "Choose a container, then place it on the Fusion Desk.",
      completeMessage: "Container added.",
      done: false,
    };
  }

  const nextSafetyId = safetyProcedureIds.find((id) => {
    const apparatus = apparatusForId(id);
    return apparatus && !stepHasApparatus(steps, apparatus.id, apparatus.name);
  });
  if (nextSafetyId) {
    const apparatus = apparatusForId(nextSafetyId)!;
    return {
      key: `safety:${apparatus.id}`,
      search: apparatus.name,
      tab: "apparatus",
      targetId: apparatus.id,
      message: `Add ${apparatus.name} before continuing.`,
      completeMessage: `${apparatus.name} added.`,
      done: false,
    };
  }

  const nextReactant = target.reaction?.reactants.find((reactant) => {
    if (reactant === "Heat") return false;
    const chemical = chemicalForReactant(reactant);
    return chemical && !stepHasChemicalGeneric(steps, reactant);
  });
  if (nextReactant) {
    const chemical = chemicalForReactant(nextReactant)!;
    return {
      key: `chemical:${chemical.id}`,
      search: chemical.name,
      tab: "chemicals",
      targetId: chemical.id,
      message: `Add ${chemical.name} to ${target.reaction ? "the same container" : "the desk"}.`,
      completeMessage: `${chemical.name} added.`,
      done: false,
    };
  }
  if (target.reaction?.reactants.includes("Heat") && !stepHasApparatus(steps, "bunsen-burner", "Bunsen Burner")) {
    return {
      key: "apparatus:bunsen-burner",
      search: "Bunsen Burner",
      tab: "apparatus",
      targetId: "bunsen-burner",
      message: "Add the Bunsen burner because this reaction needs heat.",
      completeMessage: "Bunsen burner added.",
      done: false,
    };
  }
  if (!hasOutputForTarget(steps, target)) {
    return {
      key: `output:${target.id}`,
      search: "",
      tab: "chemicals",
      targetId: "",
      message: `Wait for the reaction output to show ${target.label}.`,
      completeMessage: `${target.label} output appeared.`,
      done: false,
    };
  }
  return {
    key: `done:${target.id}`,
    search: "",
    tab: "chemicals",
    targetId: "",
    message: `Done: ${target.label} has been achieved.`,
    completeMessage: `Done: ${target.label} has been achieved.`,
    done: true,
    complete: true,
  };
}

const Index = () => {
  const actualIsMobile = useIsMobile();
  const { isMobileUI } = useUIMode();
  const isMobile = isMobileUI(actualIsMobile);
  const [, setDragging] = useState<Chemical | Apparatus | null>(null);
  const [experimentSteps, setExperimentSteps] = useState<ExperimentStep[]>([]);
  const [hiddenReportMaterialIds, setHiddenReportMaterialIds] = useState<string[]>([]);
  const [deskRemovedMaterialIds, setDeskRemovedMaterialIds] = useState<string[]>([]);
  const [pendingReportMaterialRemoval, setPendingReportMaterialRemoval] = useState<{ id: string; label: string } | null>(null);
  const [unreadReportCount, setUnreadReportCount] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [hasTransferSource, setHasTransferSource] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [activeMetal, setActiveMetal] = useState<string | null>(null);
  const [containerWaterTemp, setContainerWaterTemp] = useState(25);
  const [calorimetryData, setCalorimetryData] = useState<CalorimetryData | null>(null);
  const [atmosphericTemp, setAtmosphericTemp] = useState(25);
  const [pressure, setPressure] = useState(101.325);
  const [currentReactionTemp, setCurrentReactionTemp] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [deskClearSignal, setDeskClearSignal] = useState(0);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [testPanelMode, setTestPanelMode] = useState<GenericTestMode>("idle");
  const [productSlots, setProductSlots] = useState<ProductSlot[]>([{ query: "", target: null }]);
  const [includeSafetyProcedures, setIncludeSafetyProcedures] = useState(false);
  const [selectedSafetyProcedures, setSelectedSafetyProcedures] = useState<SafetyProcedureId[]>(["safety-goggles", "safety-shield"]);
  const [displayGuideState, setDisplayGuideState] = useState<GuideState | null>(null);
  const reportRemovalTimeoutRef = useRef<number | null>(null);
  const guideStepKeyRef = useRef<string | null>(null);
  const guideAdvanceTimeoutRef = useRef<number | null>(null);

  const filledTargets = useMemo(() => productSlots.map((slot) => slot.target).filter((target): target is TestTarget => !!target), [productSlots]);
  const selectedTarget = filledTargets[0] ?? null;
  const activeSafetyProcedures = useMemo(
    () => includeSafetyProcedures ? selectedSafetyProcedures : [],
    [includeSafetyProcedures, selectedSafetyProcedures]
  );
  const rawGuideState = useMemo(
    () => testPanelMode === "steps" ? getTargetGuideState(experimentSteps, selectedTarget, activeSafetyProcedures) : null,
    [activeSafetyProcedures, experimentSteps, selectedTarget, testPanelMode]
  );
  const guideState = displayGuideState;

  const handleExperimentStep = useCallback((step: ExperimentStep) => {
    setExperimentSteps((prev) => [...prev, step]);
    if (!showReport) setUnreadReportCount((current) => current + 1);
  }, [showReport]);

  const handleClearReport = useCallback(() => {
    setExperimentSteps([]);
    setHiddenReportMaterialIds([]);
    setDeskRemovedMaterialIds([]);
    setPendingReportMaterialRemoval(null);
    setUnreadReportCount(0);
  }, []);

  const handleHideReportMaterial = useCallback((materialId: string) => {
    setHiddenReportMaterialIds((current) => [...current, materialId]);
  }, []);

  const commitPendingReportMaterialRemoval = useCallback(() => {
    setPendingReportMaterialRemoval((pending) => {
      if (pending) setHiddenReportMaterialIds((current) => [...current, pending.id]);
      return null;
    });
    if (reportRemovalTimeoutRef.current !== null) {
      window.clearTimeout(reportRemovalTimeoutRef.current);
      reportRemovalTimeoutRef.current = null;
    }
  }, []);

  const undoPendingReportMaterialRemoval = useCallback(() => {
    setPendingReportMaterialRemoval(null);
    if (reportRemovalTimeoutRef.current !== null) {
      window.clearTimeout(reportRemovalTimeoutRef.current);
      reportRemovalTimeoutRef.current = null;
    }
  }, []);

  const handleRequestHideReportMaterial = useCallback((materialId: string, label: string) => {
    setPendingReportMaterialRemoval({ id: materialId, label });
  }, []);

  useEffect(() => {
    if (!pendingReportMaterialRemoval) return;
    if (reportRemovalTimeoutRef.current !== null) window.clearTimeout(reportRemovalTimeoutRef.current);
    reportRemovalTimeoutRef.current = window.setTimeout(() => {
      commitPendingReportMaterialRemoval();
    }, 5000);

    return () => {
      if (reportRemovalTimeoutRef.current !== null) {
        window.clearTimeout(reportRemovalTimeoutRef.current);
        reportRemovalTimeoutRef.current = null;
      }
    };
  }, [commitPendingReportMaterialRemoval, pendingReportMaterialRemoval]);

  useEffect(() => {
    if (guideAdvanceTimeoutRef.current !== null) {
      window.clearTimeout(guideAdvanceTimeoutRef.current);
      guideAdvanceTimeoutRef.current = null;
    }

    if (!rawGuideState) {
      guideStepKeyRef.current = null;
      setDisplayGuideState(null);
      return;
    }

    const previousKey = guideStepKeyRef.current;
    setDisplayGuideState((current) => {
      if (previousKey && previousKey !== rawGuideState.key && current && !current.done) {
        const completedState: GuideState = {
          ...current,
          key: `${current.key}:complete`,
          search: "",
          targetId: "",
          message: current.completeMessage,
          complete: true,
        };
        guideAdvanceTimeoutRef.current = window.setTimeout(() => {
          guideStepKeyRef.current = rawGuideState.key;
          setDisplayGuideState(rawGuideState);
          guideAdvanceTimeoutRef.current = null;
        }, 900);
        return completedState;
      }

      guideStepKeyRef.current = rawGuideState.key;
      return rawGuideState;
    });

    return () => {
      if (guideAdvanceTimeoutRef.current !== null) {
        window.clearTimeout(guideAdvanceTimeoutRef.current);
        guideAdvanceTimeoutRef.current = null;
      }
    };
  }, [rawGuideState]);

  const handleMaterialsRemoved = useCallback((materialIds: string[]) => {
    setDeskRemovedMaterialIds((current) => [...current, ...materialIds]);
  }, []);

  const handleDeskCleared = useCallback(() => {
    setDeskClearSignal((current) => current + 1);
    setExperimentSteps([]);
    setHiddenReportMaterialIds([]);
    setDeskRemovedMaterialIds([]);
    setCalorimetryData(null);
    setUnreadReportCount(0);
  }, []);

  const handleOpenReport = useCallback(() => {
    setShowReport(true);
    setUnreadReportCount(0);
  }, []);

  const handleOpenTestPanel = useCallback(() => {
    setShowTestPanel(true);
    setTestPanelMode("setup");
  }, []);

  const handleCancelTest = useCallback(() => {
    setShowTestPanel(false);
    setTestPanelMode("idle");
    setDisplayGuideState(null);
    guideStepKeyRef.current = null;
    if (guideAdvanceTimeoutRef.current !== null) {
      window.clearTimeout(guideAdvanceTimeoutRef.current);
      guideAdvanceTimeoutRef.current = null;
    }
  }, []);

  const startDemoSteps = useCallback(() => {
    if (!selectedTarget) return;
    setTestPanelMode("steps");
    setShowTestPanel(false);
  }, [selectedTarget]);

  const toggleSafetyProcedure = useCallback((id: SafetyProcedureId) => {
    setSelectedSafetyProcedures((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }, []);

  const updateProductSlotQuery = useCallback((index: number, query: string) => {
    setProductSlots((current) => {
      const next = current.map((slot, slotIndex) => slotIndex === index ? { query, target: null } : slot);
      return next.filter((slot, slotIndex) => slotIndex === next.length - 1 || slot.target || slot.query.trim());
    });
  }, []);

  const selectProductSlotTarget = useCallback((index: number, target: TestTarget) => {
    setProductSlots((current) => {
      const next = current.map((slot, slotIndex) => slotIndex === index ? { query: target.label, target } : slot);
      const last = next[next.length - 1];
      if (last?.target || last?.query.trim()) next.push({ query: "", target: null });
      return next;
    });
  }, []);

  const selectedItemInstruction =
    selectedItem?.type === "apparatus" && selectedItem.data.id === "connecting-tube"
      ? hasTransferSource
        ? "- Select the container to put the chemicals/elements in"
        : "- Place it into the container to be transfered"
      : selectedItem?.type === "apparatus" && selectedItem.data.category === "container"
      ? "Place it on the Fusion Desk"
      : "- Drop it into or place it on the container";

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2.5 sm:py-3 border-b border-border bg-card/80 backdrop-blur-sm">
        <img src="/chemora-logo.png" alt="Chemora" className="w-5 h-5" />
        <h1 className="text-sm sm:text-base font-semibold text-foreground tracking-tight">Chemora</h1>
        <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">Where Atoms come alive</span>
        
        {/* UI Mode Toggle */}
        {/* REMOVED: UI Mode toggle buttons removed per user request */}
        
        {/* Desktop Layout */}
        {!isMobile && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleOpenTestPanel}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-md border border-primary/30 hover:bg-primary/10"
              title="Demo steps"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Demo</span>
            </button>
            <button
              onClick={() => setShowTutorial(true)}
              className="flex items-center justify-center w-7 h-7 text-muted-foreground hover:text-primary transition-colors rounded-md border border-border hover:border-primary/30"
              title="How to use"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
            {selectedItem && (
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setHasTransferSource(false);
                }}
                className="flex items-center gap-1 text-[10px] font-medium text-destructive hover:text-destructive/80 transition-colors px-2 py-1 rounded border border-destructive/30 bg-destructive/5"
              >
                ✕ Deselect
              </button>
            )}
            <button
              onClick={handleOpenReport}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-md border border-primary/30 hover:bg-primary/10"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Experiment Report</span>
              <span className="sm:hidden">Report</span>
              {unreadReportCount > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadReportCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Mobile Layout - Simplified Header */}
        {isMobile && (
          <div className="ml-auto flex min-w-0 items-center gap-1.5">
            <button
              onClick={handleOpenTestPanel}
              className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors px-2 py-1.5 rounded-md border border-primary/30 hover:bg-primary/10"
              title="Demo steps"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Demo</span>
            </button>
            <button
              onClick={handleOpenReport}
              className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors px-2 py-1.5 rounded-md border border-primary/30 hover:bg-primary/10 relative"
              title="Experiment Report"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Report</span>
              {unreadReportCount > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {unreadReportCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowTutorial(true)}
              className="flex items-center justify-center w-7 h-7 text-muted-foreground hover:text-primary transition-colors rounded-md border border-border hover:border-primary/30"
              title="How to use"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </header>

      {/* Selected item banner (desktop only) */}
      {selectedItem && !isMobile && (
        <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-primary/10 border-b border-primary/20 text-xs text-primary font-medium animate-fade-in">
          <span>
            {selectedItem.data.name} selected
          </span>
          <span className="text-muted-foreground">{selectedItemInstruction}</span>
        </div>
      )}

      {/* Main area - Desktop */}
      {!isMobile && (
        <div className="flex flex-1 overflow-hidden">
          <ChemicalPalette
            onDragStart={(c) => setDragging(c)}
            onApparatusDragStart={(a) => setDragging(a)}
            selectedItem={selectedItem}
            onSelect={setSelectedItem}
            guideSearch={guideState?.search}
            guideTab={guideState?.tab}
            guideTargetId={guideState?.targetId}
            guideMessage={guideState?.message}
            guideComplete={guideState?.complete}
          />
          <Suspense fallback={<LoadingFallback />}>
            <DesktopEquipmentArea
              onExperimentStep={handleExperimentStep}
              onMaterialsRemoved={handleMaterialsRemoved}
              onDeskCleared={handleDeskCleared}
              selectedItem={selectedItem}
              onItemPlaced={() => setSelectedItem(null)}
              onTransferSourceChange={setHasTransferSource}
              onMetalChange={setActiveMetal}
              onWaterTempChange={setContainerWaterTemp}
              atmosphericTemp={atmosphericTemp}
              pressure={pressure}
              onReactionTempChange={setCurrentReactionTemp}
              onActiveChange={setIsActive}
            />
          </Suspense>
          <Suspense fallback={<LoadingFallback />}>
            <ThermalAnalysisPanel
              activeMetal={activeMetal}
              waterTemp={containerWaterTemp}
              currentReactionTemp={currentReactionTemp}
              onCalorimetryData={setCalorimetryData}
              onAtmosphericTempChange={setAtmosphericTemp}
              onPressureChange={setPressure}
              isActive={isActive}
              deskClearSignal={deskClearSignal}
            />
          </Suspense>
        </div>
      )}

      {/* Main area - Mobile */}
      {isMobile && (
        <Suspense fallback={<LoadingFallback />}>
          <MobileSwipeLayout
            onDragStart={(c) => setDragging(c)}
            onApparatusDragStart={(a) => setDragging(a)}
            selectedItem={selectedItem}
            onSelect={setSelectedItem}
            onExperimentStep={handleExperimentStep}
            onMaterialsRemoved={handleMaterialsRemoved}
            onDeskCleared={handleDeskCleared}
            onItemPlaced={() => setSelectedItem(null)}
            onMetalChange={setActiveMetal}
            onWaterTempChange={setContainerWaterTemp}
            atmosphericTemp={atmosphericTemp}
            pressure={pressure}
            onReactionTempChange={setCurrentReactionTemp}
            onActiveChange={setIsActive}
            onCalorimetryData={setCalorimetryData}
            onAtmosphericTempChange={setAtmosphericTemp}
            onPressureChange={setPressure}
            activeMetal={activeMetal}
            waterTemp={containerWaterTemp}
            currentReactionTemp={currentReactionTemp}
            isActive={isActive}
            deskClearSignal={deskClearSignal}
            guideSearch={guideState?.search}
            guideTab={guideState?.tab}
            guideTargetId={guideState?.targetId}
            guideMessage={guideState?.message}
            guideComplete={guideState?.complete}
          />
        </Suspense>
      )}

      {showTestPanel && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/75 p-2 sm:p-4 backdrop-blur-sm">
          <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-md flex-col rounded-lg border border-border bg-card shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2.5 sm:px-4 sm:py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Demo</p>
                <p className="text-[10px] text-muted-foreground">Choose any product or reaction output.</p>
              </div>
              <button
                onClick={() => setShowTestPanel(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 space-y-3 overflow-y-auto p-3 sm:p-4">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Products</label>
                <div className="flex flex-wrap items-start gap-2">
                  {productSlots.map((slot, index) => (
                    <ProductTargetField
                      key={index}
                      index={index}
                      slot={slot}
                      onQueryChange={updateProductSlotQuery}
                      onSelect={selectProductSlotTarget}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2 rounded-md border border-border bg-background/45 px-3 py-2">
                <label className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={includeSafetyProcedures}
                    onChange={(event) => setIncludeSafetyProcedures(event.target.checked)}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  Safety Procedures
                </label>
                {includeSafetyProcedures && (
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                    {SAFETY_PROCEDURES.map((id) => {
                      const apparatus = apparatusForId(id);
                      if (!apparatus) return null;
                      return (
                        <label
                          key={id}
                          className="flex items-center gap-2 rounded border border-border bg-card/60 px-2 py-1.5 text-[10px] text-muted-foreground"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSafetyProcedures.includes(id)}
                            onChange={() => toggleSafetyProcedure(id)}
                            className="h-3 w-3 accent-primary"
                          />
                          <span className="text-sm leading-none">{apparatus.icon}</span>
                          <span className="truncate">{apparatus.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={startDemoSteps}
                disabled={!selectedTarget}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/10 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ListChecks className="h-4 w-4" />
                Enter
              </button>

              {false && testPanelMode === "steps" && guideState && (
                <div className="rounded-md border border-primary/25 bg-primary/5 p-3">
                  <p className="text-xs font-semibold text-foreground">{guideState.done ? "Experiment complete" : "Next step"}</p>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{guideState.message}</p>
                  <p className="mt-2 text-[10px] text-primary">
                    The palette search is being filled automatically for this step.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!showTestPanel && testPanelMode === "steps" && guideState && (
        <div
          key={guideState.message}
          className={`fixed bottom-4 left-1/2 z-[70] w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 animate-in slide-in-from-top-3 fade-in duration-300 rounded-lg border bg-card/90 p-3 text-sm text-foreground shadow-2xl backdrop-blur-md ${
            guideState.complete ? "border-emerald-400/30" : "border-primary/25"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`text-xs font-semibold ${guideState.complete ? "text-emerald-400" : "text-primary"}`}>
                {guideState.done ? `${selectedTarget?.label} complete` : guideState.complete ? "Step complete" : "Demo step"}
              </p>
              <p className={`mt-1 text-xs leading-5 ${guideState.complete ? "text-emerald-300/90" : "text-muted-foreground"}`}>
                {guideState.message}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={handleCancelTest}
                className="rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelTest}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                title="Stop guide"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report modal */}
      {showReport && (
        <Suspense fallback={<LoadingFallback />}>
          <ExperimentReport
            steps={experimentSteps}
            calorimetryData={calorimetryData}
            hiddenMaterialIds={hiddenReportMaterialIds}
            deskRemovedMaterialIds={deskRemovedMaterialIds}
            onHideMaterial={handleHideReportMaterial}
            onRequestHideMaterial={handleRequestHideReportMaterial}
            onClose={() => setShowReport(false)}
            onClear={handleClearReport}
          />
        </Suspense>
      )}

      {pendingReportMaterialRemoval && (
        <div className="fixed bottom-4 right-4 z-[70] max-w-sm rounded-lg border border-border bg-card/80 p-4 text-sm text-foreground shadow-2xl backdrop-blur-md">
          <p className="font-medium">{pendingReportMaterialRemoval.label} removed from Materials Used.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            It will stay on the Fusion Desk. This only removes it from the report.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={undoPendingReportMaterialRemoval}
              className="rounded-md border border-primary/30 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10"
            >
              Undo
            </button>
            <button
              onClick={commitPendingReportMaterialRemoval}
              className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-secondary"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Onboarding tutorial */}
      {showTutorial && (
        <Suspense fallback={null}>
          <OnboardingTutorial onClose={() => setShowTutorial(false)} />
        </Suspense>
      )}
    </div>
  );
};

export default Index;
