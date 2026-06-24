import { useState, useCallback, useEffect, useRef } from "react";
import { Chemical, Apparatus, findReaction, findReactionWithHeat, Reaction, ExperimentStep, CHEMICAL_PH, APPARATUS_EFFECTS } from "@/lib/reactions";
import {
  calculateReactionPeakTemp,
  formatThermalTemp,
  K_COOLING_BASE,
  newtonCoolingStep,
  STANDARD_WATER_MASS,
} from "@/lib/thermalCurve";

import ReactionInfo from "./ReactionInfo";
import ContainerSlot from "./ContainerSlot";
import { Beaker, Trash2, FlaskConical } from "lucide-react";
import type { SelectedItem } from "@/pages/Index";

export interface ContainerState {
  id: string;
  label: string;
  apparatus: Apparatus;
  chemicals: Chemical[];
  attachedApparatuses: Apparatus[];
  reaction: Reaction | null;
  showEffect: boolean;
  temperature: number; // °C
  burnerTemperature: number; // 0-600°C slider value for bunsen burner
  coolingTarget: number; // target temp for cooling bath
  pH: number | null;
  solutionColor: string | null;
  phaseChanges: PhaseChange[];
  connectedTo: string | null; // id of connected container
  filterSeparation: FilterSeparation | null;
  transferredChemicalIds: string[]; // IDs of chemicals that were transferred INTO this container
  isTransferTarget: boolean; // true if this container received chemicals via tube
  collectedGases: Chemical[]; // gases captured by gas collection jar
  reactionComplete: boolean; // true when cooling has finished
}

export interface PhaseChange {
  chemical: string;
  from: string;
  to: string;
  description: string;
}

export interface FilterSeparation {
  solids: string[];
  filtrate: string[];
  description: string;
}

export interface EquipmentAreaProps {
  onExperimentStep?: (step: ExperimentStep) => void;
  onMaterialsRemoved?: (materialIds: string[]) => void;
  selectedItem?: SelectedItem;
  onItemPlaced?: () => void;
  onMetalChange?: (metalName: string | null) => void;
  onWaterTempChange?: (temp: number) => void;
  atmosphericTemp?: number;
  pressure?: number;
  onReactionTempChange?: (temp: number | null) => void;
  onActiveChange?: (active: boolean) => void;
}

const LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function calculatePH(chemicals: Chemical[]): number | null {
  const phChemicals = chemicals.filter((c) => CHEMICAL_PH[c.formula] !== undefined);
  if (phChemicals.length === 0) return null;
  const total = phChemicals.reduce((sum, c) => sum + (CHEMICAL_PH[c.formula] ?? 7), 0);
  return Math.round(total / phChemicals.length * 10) / 10;
}

function estimateWaterMass(chemicals: Chemical[]): number {
  const water = chemicals.filter((c) => c.formula === "H₂O" || c.id === "water");
  return water.length > 0 ? water.length * STANDARD_WATER_MASS : STANDARD_WATER_MASS;
}

function calculateTemperature(
  base: number,
  apparatuses: Apparatus[],
  reaction: Reaction | null,
  burnerTemp: number = 300,
  chemicals: Chemical[] = []
): number {
  let temp = base;
  const hasBurner = apparatuses.some((a) => a.id === "bunsen-burner");
  if (hasBurner) {
    temp = burnerTemp;
  } else {
    for (const a of apparatuses) {
      const effect = APPARATUS_EFFECTS[a.id];
      if (effect && a.id !== "bunsen-burner") temp += effect.tempChange;
    }
  }
  if (reaction) {
    temp = calculateReactionPeakTemp(temp, reaction, estimateWaterMass(chemicals));
  }
  return formatThermalTemp(temp);
}

function calculatePhaseChanges(chemicals: Chemical[], apparatuses: Apparatus[], burnerTemp: number = 300): PhaseChange[] {
  const hasBurner = apparatuses.some((a) => a.id === "bunsen-burner");
  const hasEvapDish = apparatuses.some((a) => a.id === "evaporating-dish");
  if (!hasBurner && !hasEvapDish) return [];
  const changes: PhaseChange[] = [];
  for (const c of chemicals) {
    if (c.state === "liquid" && (hasEvapDish || (hasBurner && burnerTemp >= 100))) {
      changes.push({ chemical: c.name, from: "liquid", to: "gas", description: `${c.name} evaporates into ${c.formula === "H₂O" ? "steam (water vapour)" : "vapour"} (${burnerTemp}°C)` });
    }
    // Special handling for ice (H₂O solid) - melts at much lower temperature than other solids
    if (c.state === "solid" && c.formula === "H₂O" && hasBurner) {
      if (burnerTemp >= 50) {
        // Calculate melt speed based on burner temperature
        // 50°C: slow melt, 100°C: moderate, 200°C+: fast melt
        const meltRate = burnerTemp < 100 ? "slowly" : burnerTemp < 200 ? "steadily" : "rapidly";
        changes.push({ chemical: c.name, from: "solid", to: "liquid", description: `Ice melts ${meltRate} into liquid water in the beaker (${burnerTemp}°C)` });
      }
    }
    // Other solids melt at higher temperatures
    if (c.state === "solid" && c.formula !== "H₂O" && hasBurner && burnerTemp >= 200) {
      changes.push({ chemical: c.name, from: "solid", to: "liquid", description: `${c.name} melts under intense heat (${burnerTemp}°C)` });
    }
  }
  return changes;
}

function collectGases(chemicals: Chemical[], phaseChanges: PhaseChange[], apparatuses: Apparatus[]): Chemical[] {
  const hasGasJar = apparatuses.some((a) => a.id === "gas-jar");
  if (!hasGasJar) return [];
  // Collect chemicals that evaporate (liquid → gas phase change)
  const evaporatedNames = new Set(phaseChanges.filter((pc) => pc.to === "gas").map((pc) => pc.chemical));
  return chemicals
    .filter((c) => evaporatedNames.has(c.name))
    .map((c) => ({ ...c, state: "gas" as const, id: `${c.id}-gas-${Date.now()}` }));
}

// Solubility lookup: chemicals that dissolve in water pass through filter paper
// Insoluble substances (precipitates, undissolved metals/nonmetals) are trapped
const SOLUBLE_FORMULAS = new Set([
  // Soluble salts (Group 1 & ammonium salts are always soluble)
  "NaCl", "KCl", "NaNO₃", "KNO₃", "Na₂SO₄", "K₂SO₄", "NaHCO₃", "Na₂CO₃",
  "NH₄Cl", "NH₄NO₃", "(NH₄)₂SO₄", "CaCl₂", "MgCl₂", "FeCl₂", "FeCl₃",
  "CuCl₂", "ZnCl₂", "AlCl₃", "CuSO₄", "ZnSO₄", "FeSO₄", "MgSO₄",
  "AgNO₃", "Pb(NO₃)₂", "Cu(NO₃)₂", "Zn(NO₃)₂",
  // Acids (all common acids are soluble)
  "HCl", "H₂SO₄", "HNO₃", "CH₃COOH", "H₃PO₄", "C₆H₈O₇", "H₂CO₃",
  // Alkalis (soluble bases)
  "NaOH", "KOH", "NH₃",
  // Other soluble substances
  "H₂O₂", "C₂H₅OH", "C₆H₁₂O₆", "C₁₂H₂₂O₁₁",
  // Indicators
  "C₂₀H₁₄O₄", "C₂₇H₃₀ClN₃", "C₁₆H₁₈ClN₃S",
]);

// Insoluble precipitates and solids that don't dissolve
const INSOLUBLE_FORMULAS = new Set([
  "BaSO₄", "PbSO₄", "CaSO₄", "AgCl", "PbCl₂", "BaCO₃", "CaCO₃", "MgCO₃",
  "FeCO₃", "CuCO₃", "ZnCO₃", "PbCO₃", "Fe(OH)₂", "Fe(OH)₃", "Cu(OH)₂",
  "Zn(OH)₂", "Al(OH)₃", "Mg(OH)₂", "Ca(OH)₂", "Pb(OH)₂", "PbI₂", "AgI",
  "AgBr", "PbS", "CuS", "ZnS", "FeS", "Ag₂S",
]);

function isChemicalSoluble(chemical: Chemical): boolean {
  // Liquids and gases always pass through
  if (chemical.state === "liquid" || chemical.state === "gas") return true;
  // Check explicit solubility lists
  if (SOLUBLE_FORMULAS.has(chemical.formula)) return true;
  if (INSOLUBLE_FORMULAS.has(chemical.formula)) return false;
  // Default: metals and most solids are insoluble (filtered out)
  if (chemical.category === "metal") return false;
  if (chemical.state === "solid") return false;
  return true;
}

function calculateFilterSeparation(chemicals: Chemical[], apparatuses: Apparatus[]): FilterSeparation | null {
  const hasFilter = apparatuses.some((a) => a.id === "filter-paper" || a.id === "filter-funnel");
  if (!hasFilter || chemicals.length === 0) return null;
  const solids = chemicals.filter((c) => !isChemicalSoluble(c)).map((c) => c.name);
  const filtrate = chemicals.filter((c) => isChemicalSoluble(c)).map((c) => c.name);
  if (solids.length === 0 && filtrate.length === 0) return null;
  return {
    solids,
    filtrate,
    description: solids.length > 0
      ? `Filter paper traps ${solids.join(", ")} (insoluble${solids.length > 1 ? " substances" : ""}). ${filtrate.length > 0 ? `${filtrate.join(", ")} pass${filtrate.length === 1 ? "es" : ""} through as filtrate (soluble/dissolved).` : "No filtrate collected."}`
      : `All substances are soluble and pass through the filter as filtrate: ${filtrate.join(", ")}`,
  };
}

function getApparatusMaterialCategory(apparatus: Apparatus): NonNullable<ExperimentStep["material"]>["category"] {
  if (apparatus.category === "container") return "container";
  if (apparatus.category === "heating") return "heating";
  if (apparatus.category === "measuring") return "measuring";
  if (apparatus.category === "mixing") return "mixing";
  if (apparatus.category === "safety") return "safety";
  return "other";
}

function getApparatusMaterialId(apparatus: Apparatus): string {
  return `apparatus:${apparatus.id}`;
}

function getChemicalMaterialId(chemical: Chemical): string {
  return `chemical:${chemical.id}`;
}

function createApparatusMaterialStep(beakerLabel: string, apparatus: Apparatus): ExperimentStep {
  return {
    timestamp: new Date(),
    beakerLabel,
    chemicals: [],
    reaction: null,
    apparatus: [apparatus.name],
    materialOnly: true,
    material: {
      id: getApparatusMaterialId(apparatus),
      name: apparatus.name,
      label: apparatus.name,
      category: getApparatusMaterialCategory(apparatus),
    },
  };
}

function createChemicalMaterialStep(beakerLabel: string, chemical: Chemical): ExperimentStep {
  return {
    timestamp: new Date(),
    beakerLabel,
    chemicals: [chemical],
    reaction: null,
    apparatus: [],
    materialOnly: true,
    material: {
      id: getChemicalMaterialId(chemical),
      name: chemical.name,
      label: `${chemical.name} (${chemical.formula})`,
      category: "chemical",
    },
  };
}

function getContainerMaterialIds(container: ContainerState): string[] {
  return [
    getApparatusMaterialId(container.apparatus),
    ...container.attachedApparatuses.map(getApparatusMaterialId),
    ...container.chemicals.map(getChemicalMaterialId),
  ];
}

function getActiveMaterialIds(containers: ContainerState[]): Set<string> {
  return new Set(containers.flatMap(getContainerMaterialIds));
}

export default function EquipmentArea({ onExperimentStep, onMaterialsRemoved, selectedItem, onItemPlaced, onMetalChange, onWaterTempChange, atmosphericTemp = 25, pressure = 101.325, onReactionTempChange, onActiveChange }: EquipmentAreaProps) {
  const [containers, setContainers] = useState<ContainerState[]>([]);
  const [activeReaction, setActiveReaction] = useState<Reaction | null>(null);

  // Detect metals in containers and report to parent
  useEffect(() => {
    if (!onMetalChange) return;
    const allChemicals = containers.flatMap((c) => c.chemicals);
    const metal = allChemicals.find((c) => c.category === "metal");
    onMetalChange(metal ? metal.name : null);
  }, [containers, onMetalChange]);

  // Report water temperature: atmospheric temp by default, burner temp if heated
  useEffect(() => {
    if (!onWaterTempChange) return;
    const burnerContainer = containers.find((c) =>
      c.attachedApparatuses.some((a) => a.id === "bunsen-burner") &&
      c.chemicals.length > 0
    );
    if (burnerContainer) {
      // Water temp = burner temperature (e.g. if burner is at 600, water is at 600)
      onWaterTempChange(burnerContainer.burnerTemperature);
    } else {
      onWaterTempChange(atmosphericTemp);
    }
  }, [containers, onWaterTempChange, atmosphericTemp]);

  const coolingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const tEnv = atmosphericTemp;
    const hasActiveReaction = containers.some((c) => {
      if (!c.reaction || c.reactionComplete) return false;
      const hasCoolingBath = c.attachedApparatuses.some((a) => a.id === "cooling-bath");
      const targetTemp = hasCoolingBath ? Math.max(c.coolingTarget, tEnv) : tEnv;
      return Math.abs(c.temperature - targetTemp) > 0.5;
    });

    if (hasActiveReaction && !coolingRef.current) {
      coolingRef.current = setInterval(() => {
        setContainers((prev) => {
          let anyStillEquilibrating = false;
          const updated = prev.map((c) => {
            if (!c.reaction || c.reactionComplete) return c;
            const hasCoolingBath = c.attachedApparatuses.some((a) => a.id === "cooling-bath");
            const targetTemp = hasCoolingBath ? Math.max(c.coolingTarget, tEnv) : tEnv;
            if (Math.abs(c.temperature - targetTemp) <= 0.5) {
              return { ...c, temperature: formatThermalTemp(targetTemp), showEffect: false, reactionComplete: true };
            }
            anyStillEquilibrating = true;
            const convection = hasCoolingBath ? 3.0 : 1.0;
            const newTemp = newtonCoolingStep(c.temperature, targetTemp, 1, K_COOLING_BASE, pressure, convection);
            return { ...c, temperature: newTemp };
          });
          if (!anyStillEquilibrating && coolingRef.current) {
            clearInterval(coolingRef.current);
            coolingRef.current = null;
          }
          return updated;
        });
      }, 1000);
    }

    return () => {
      if (
        coolingRef.current &&
        !containers.some((c) => {
          if (!c.reaction || c.reactionComplete) return false;
          const hasCoolingBath = c.attachedApparatuses.some((a) => a.id === "cooling-bath");
          const targetTemp = hasCoolingBath ? Math.max(c.coolingTarget, tEnv) : tEnv;
          return Math.abs(c.temperature - targetTemp) > 0.5;
        })
      ) {
        clearInterval(coolingRef.current);
        coolingRef.current = null;
      }
    };
  }, [containers, atmosphericTemp, pressure]);

  // Update all idle container temperatures when atmospheric temp changes
  useEffect(() => {
    setContainers((prev) =>
      prev.map((c) => {
        // Only update containers that are idle (no reaction, no burner heating)
        const hasBurner = c.attachedApparatuses.some((a) => a.id === "bunsen-burner");
        if (c.reaction && !c.reactionComplete) return c; // cooling in progress
        if (hasBurner) return c; // heated by burner
        return { ...c, temperature: atmosphericTemp };
      })
    );
  }, [atmosphericTemp]);

  // Report active reaction temperature to parent for graph
  useEffect(() => {
    if (!onReactionTempChange) return;
    const activeContainer = containers.find((c) => c.reaction && !c.reactionComplete);
    if (activeContainer) {
      onReactionTempChange(activeContainer.temperature);
    } else {
      const burnerContainer = containers.find((c) =>
        c.attachedApparatuses.some((a) => a.id === "bunsen-burner") &&
        c.chemicals.length > 0 && !c.reaction
      );
      if (burnerContainer) {
        onReactionTempChange(burnerContainer.temperature);
      } else {
        onReactionTempChange(null);
      }
    }
  }, [containers, onReactionTempChange]);

  // Report isActive to parent
  useEffect(() => {
    if (!onActiveChange) return;
    const active = containers.some((c) =>
      (c.reaction && !c.reactionComplete) ||
      (c.attachedApparatuses.some((a) => a.id === "bunsen-burner") && c.chemicals.length > 0)
    );
    onActiveChange(active);
  }, [containers, onActiveChange]);

  const [dragOver, setDragOver] = useState<string | null>(null);
  const [benchDragOver, setBenchDragOver] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  const handleBenchDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setBenchDragOver(false);
    const type = e.dataTransfer.getData("type");
    if (type !== "apparatus") return;
    const data = e.dataTransfer.getData("apparatus");
    if (!data) return;
    const apparatus: Apparatus = JSON.parse(data);
    if (apparatus.category !== "container") return;

    setContainers((prev) => {
      const newContainer: ContainerState = {
        id: `container-${Date.now()}-${prev.length}`,
        label: `${apparatus.name} ${LABELS[prev.length] || prev.length + 1}`,
        apparatus,
        chemicals: [],
        attachedApparatuses: [],
        reaction: null,
        showEffect: false,
        temperature: atmosphericTemp,
        burnerTemperature: 300,
        coolingTarget: 5,
        pH: null,
        solutionColor: null,
        phaseChanges: [],
        connectedTo: null,
        filterSeparation: null,
        transferredChemicalIds: [],
        isTransferTarget: false,
        collectedGases: [],
        reactionComplete: false,
      };
      onExperimentStep?.(createApparatusMaterialStep(newContainer.label, apparatus));
      return [...prev, newContainer];
    });
  }, [onExperimentStep, atmosphericTemp]);

  const handleContainerDrop = useCallback((containerId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
    const type = e.dataTransfer.getData("type");

    if (type === "apparatus") {
      const data = e.dataTransfer.getData("apparatus");
      if (!data) return;
      const apparatus: Apparatus = JSON.parse(data);
      if (apparatus.category === "container") return;

      // Connecting tube: start connection mode
      if (apparatus.id === "connecting-tube") {
        if (connectingFrom === null) {
          setConnectingFrom(containerId);
          setContainers((prev) =>
            prev.map((c) =>
              c.id === containerId
                ? { ...c, attachedApparatuses: [...c.attachedApparatuses.filter((a) => a.id !== "connecting-tube"), apparatus] }
                : c
            )
          );
        } else if (connectingFrom !== containerId) {
          // Connect the two containers
          setContainers((prev) => {
            const fromContainer = prev.find((c) => c.id === connectingFrom);
            const toContainer = prev.find((c) => c.id === containerId);
            if (!fromContainer || !toContainer) return prev;

            // Transfer liquids (filtered or not) + collected gases
            const sourceHasFilter = fromContainer.attachedApparatuses.some((a) => a.id === "filter-paper" || a.id === "filter-funnel");
            const transferChemicals = sourceHasFilter
              ? fromContainer.chemicals.filter((c) => isChemicalSoluble(c))
              : [...fromContainer.chemicals];
            // Also transfer collected gases from source
            const gasTransfers = fromContainer.collectedGases.map((g) => ({ ...g, state: "gas" as const }));
            const allTransfers = [...transferChemicals, ...gasTransfers];
            const transferIds = allTransfers.map((c) => c.id);
            const mergedChemicals = [...toContainer.chemicals, ...allTransfers];

            let reaction: Reaction | null = null;
            let showEffect = false;
            let solutionColor = toContainer.solutionColor;

            if (mergedChemicals.length >= 2) {
              for (let i = 0; i < mergedChemicals.length; i++) {
                for (let j = i + 1; j < mergedChemicals.length; j++) {
                  const found = findReaction(mergedChemicals[i].formula, mergedChemicals[j].formula);
                  if (found) { reaction = found; showEffect = true; if (found.indicatorColor) solutionColor = found.indicatorColor; break; }
                }
                if (reaction) break;
              }
            }

            const pH = calculatePH(mergedChemicals);
            const newApparatuses = [...toContainer.attachedApparatuses.filter((a) => a.id !== "connecting-tube"), apparatus];
            const temp = calculateTemperature(atmosphericTemp, newApparatuses, reaction, toContainer.burnerTemperature, mergedChemicals);
            const phaseChanges = calculatePhaseChanges(mergedChemicals, newApparatuses, toContainer.burnerTemperature);
            const filterSeparation = calculateFilterSeparation(mergedChemicals, newApparatuses);

            if (reaction) {
              setActiveReaction(reaction);
              onExperimentStep?.({ timestamp: new Date(), beakerLabel: toContainer.label, chemicals: mergedChemicals, reaction, apparatus: newApparatuses.map((a) => a.name) });
            }

            return prev.map((c) => {
              if (c.id === connectingFrom) return { ...c, connectedTo: containerId };
              if (c.id === containerId) return { ...c, chemicals: mergedChemicals, connectedTo: connectingFrom, attachedApparatuses: newApparatuses, reaction, showEffect, pH, temperature: temp, solutionColor, phaseChanges, filterSeparation, transferredChemicalIds: transferIds, isTransferTarget: true };
              return c;
            });
          });
          setConnectingFrom(null);
        }
        return;
      }

      setContainers((prev) =>
        prev.map((c) => {
          if (c.id !== containerId || c.attachedApparatuses.find((a) => a.id === apparatus.id)) return c;
          const newApparatuses = [...c.attachedApparatuses, apparatus];
          
          // Check for heat-based reactions when Bunsen burner is attached
          let reaction = c.reaction;
          if (apparatus.id === "bunsen-burner" && c.chemicals.length > 0 && !reaction) {
            for (const chemical of c.chemicals) {
              const heatReaction = findReactionWithHeat(chemical.formula);
              if (heatReaction) {
                reaction = heatReaction;
                break;
              }
            }
          }
          
          const temp = calculateTemperature(atmosphericTemp, newApparatuses, reaction, c.burnerTemperature, c.chemicals);
          const phaseChanges = calculatePhaseChanges(c.chemicals, newApparatuses, c.burnerTemperature);
          const filterSeparation = calculateFilterSeparation(c.chemicals, newApparatuses);
          const gases = collectGases(c.chemicals, phaseChanges, newApparatuses);
          
          if (reaction && !c.reaction) {
            setActiveReaction(reaction);
            onExperimentStep?.({ timestamp: new Date(), beakerLabel: c.label, chemicals: c.chemicals, reaction, apparatus: newApparatuses.map((a) => a.name) });
          }
          onExperimentStep?.(createApparatusMaterialStep(c.label, apparatus));
          
          return { ...c, attachedApparatuses: newApparatuses, temperature: temp, phaseChanges, filterSeparation, collectedGases: gases, reaction };
        })
      );
      return;
    }

    const data = e.dataTransfer.getData("chemical");
    if (!data) return;
    const chemical: Chemical = JSON.parse(data);

    setContainers((prev) =>
      prev.map((c) => {
        if (c.id !== containerId) return c;
        const newChemicals = [...c.chemicals, chemical];

        let reaction: Reaction | null = null;
        let showEffect = false;
        let solutionColor = c.solutionColor;

        if (newChemicals.length >= 2) {
          const last = newChemicals[newChemicals.length - 1];
          for (let i = 0; i < newChemicals.length - 1; i++) {
            const found = findReaction(newChemicals[i].formula, last.formula);
            if (found) { reaction = found; showEffect = true; if (found.indicatorColor) solutionColor = found.indicatorColor; break; }
          }
        }
        
        // Check for heat-based reactions if no reaction found and burner is attached
        if (!reaction && c.attachedApparatuses.some((a) => a.id === "bunsen-burner")) {
          const heatReaction = findReactionWithHeat(chemical.formula);
          if (heatReaction) {
            reaction = heatReaction;
            showEffect = true;
          }
        }

        const pH = calculatePH(newChemicals);
        const temp = calculateTemperature(atmosphericTemp, c.attachedApparatuses, reaction, c.burnerTemperature, newChemicals);
        const phaseChanges = calculatePhaseChanges(newChemicals, c.attachedApparatuses, c.burnerTemperature);
        const filterSeparation = calculateFilterSeparation(newChemicals, c.attachedApparatuses);
        const gases = collectGases(newChemicals, phaseChanges, c.attachedApparatuses);

        if (reaction) {
          setActiveReaction(reaction);
          onExperimentStep?.({ timestamp: new Date(), beakerLabel: c.label, chemicals: newChemicals, reaction, apparatus: c.attachedApparatuses.map((a) => a.name) });
        }
        onExperimentStep?.(createChemicalMaterialStep(c.label, chemical));

        return { ...c, chemicals: newChemicals, reaction, showEffect, pH, temperature: temp, solutionColor, phaseChanges, filterSeparation, collectedGases: gases };
      })
    );
  }, [onExperimentStep, connectingFrom]);

  const clearContainer = (containerId: string) => {
    setContainers((prev) => {
      const target = prev.find((c) => c.id === containerId);
      const updated = prev.map((c) => {
        if (c.id === containerId) return { ...c, chemicals: [], attachedApparatuses: [], reaction: null, showEffect: false, temperature: atmosphericTemp, burnerTemperature: 300, coolingTarget: 5, pH: null, solutionColor: null, phaseChanges: [], connectedTo: null, filterSeparation: null, transferredChemicalIds: [], isTransferTarget: false, collectedGases: [], reactionComplete: false };
        // Also disconnect the other end
        if (c.connectedTo === containerId) return { ...c, connectedTo: null };
        return c;
      });
      if (target) {
        const removedIds = [
          ...target.attachedApparatuses.map(getApparatusMaterialId),
          ...target.chemicals.map(getChemicalMaterialId),
        ];
        if (removedIds.length > 0) onMaterialsRemoved?.(removedIds);
      }
      return updated;
    });
    setActiveReaction(null);
  };

  const removeContainer = (containerId: string) => {
    setContainers((prev) => {
      const target = prev.find((c) => c.id === containerId);
      const filtered = prev.filter((c) => c.id !== containerId).map((c) => c.connectedTo === containerId ? { ...c, connectedTo: null } : c);
      const updated = filtered.map((c, i) => ({ ...c, label: `${c.apparatus.name} ${LABELS[i] || i + 1}` }));
      if (target) {
        const removedIds = getContainerMaterialIds(target);
        if (removedIds.length > 0) onMaterialsRemoved?.(removedIds);
      }
      return updated;
    });
  };

  const clearAll = () => {
    const removedIds = containers.flatMap(getContainerMaterialIds);
    if (removedIds.length > 0) onMaterialsRemoved?.(removedIds);
    setContainers([]);
    setActiveReaction(null);
    setConnectingFrom(null);
  };

  const handleBurnerTempChange = useCallback((containerId: string, newBurnerTemp: number) => {
    setContainers((prev) =>
      prev.map((c) => {
        if (c.id !== containerId) return c;
        
        // Check for heat-based reactions when burner is heating
        let reaction: Reaction | null = c.reaction;
        if (!reaction && c.chemicals.length > 0 && newBurnerTemp > 100) {
          // Look for heat-based reactions (decomposition, etc.)
          for (const chemical of c.chemicals) {
            const heatReaction = findReactionWithHeat(chemical.formula);
            if (heatReaction) {
              reaction = heatReaction;
              break;
            }
          }
        }
        
        const temp = calculateTemperature(atmosphericTemp, c.attachedApparatuses, reaction, newBurnerTemp, c.chemicals);
        const phaseChanges = calculatePhaseChanges(c.chemicals, c.attachedApparatuses, newBurnerTemp);
        const scaledReaction = reaction ? { ...reaction, intensity: Math.round(reaction.intensity * (newBurnerTemp / 300) * 10) / 10 } : null;
        const gases = collectGases(c.chemicals, phaseChanges, c.attachedApparatuses);
        
        if (reaction && !c.reaction) {
          setActiveReaction(reaction);
          onExperimentStep?.({ timestamp: new Date(), beakerLabel: c.label, chemicals: c.chemicals, reaction, apparatus: c.attachedApparatuses.map((a) => a.name) });
        }
        
        return { ...c, burnerTemperature: newBurnerTemp, temperature: temp, phaseChanges, reaction: scaledReaction, collectedGases: gases };
      })
    );
  }, [atmosphericTemp, onExperimentStep]);

  const handleCoolingTargetChange = useCallback((containerId: string, newTarget: number) => {
    setContainers((prev) =>
      prev.map((c) => c.id === containerId ? { ...c, coolingTarget: newTarget } : c)
    );
  }, []);

  const disconnectContainers = useCallback((containerId1: string, containerId2: string) => {
    setContainers((prev) => {
      const c1 = prev.find((c) => c.id === containerId1);
      const c2 = prev.find((c) => c.id === containerId2);
      if (!c1 || !c2) return prev;

      // Determine which is the target (received chemicals)
      const target = c1.isTransferTarget ? c1 : c2;
      const source = c1.isTransferTarget ? c2 : c1;

      // Remove only the transferred chemicals from target using their IDs
      const transferredIds = new Set(target.transferredChemicalIds);
      const restoredTargetChemicals = target.chemicals.filter((c) => !transferredIds.has(c.id));

      const targetApparatuses = target.attachedApparatuses.filter((a) => a.id !== "connecting-tube");
      const targetPH = calculatePH(restoredTargetChemicals);
      const targetTemp = calculateTemperature(atmosphericTemp, targetApparatuses, null, target.burnerTemperature, restoredTargetChemicals);
      const targetPhaseChanges = calculatePhaseChanges(restoredTargetChemicals, targetApparatuses, target.burnerTemperature);
      const targetFilterSeparation = calculateFilterSeparation(restoredTargetChemicals, targetApparatuses);

      const sourceApparatuses = source.attachedApparatuses.filter((a) => a.id !== "connecting-tube");
      const sourceTemp = calculateTemperature(atmosphericTemp, sourceApparatuses, source.reaction, source.burnerTemperature, source.chemicals);

      return prev.map((c) => {
        if (c.id === source.id) return { ...c, connectedTo: null, attachedApparatuses: sourceApparatuses, temperature: sourceTemp };
        if (c.id === target.id) return { ...c, connectedTo: null, chemicals: restoredTargetChemicals, attachedApparatuses: targetApparatuses, reaction: null, showEffect: false, pH: targetPH, temperature: targetTemp, solutionColor: null, phaseChanges: targetPhaseChanges, filterSeparation: targetFilterSeparation, transferredChemicalIds: [], isTransferTarget: false };
        return c;
      });
    });
    setActiveReaction(null);
  }, []);

  // Click-to-place: bench click adds container
  const handleBenchClick = useCallback(() => {
    if (!selectedItem || selectedItem.type !== "apparatus" || selectedItem.data.category !== "container") return;
    const apparatus = selectedItem.data;
    setContainers((prev) => {
      const newContainer: ContainerState = {
        id: `container-${Date.now()}-${prev.length}`,
        label: `${apparatus.name} ${LABELS[prev.length] || prev.length + 1}`,
        apparatus,
        chemicals: [],
        attachedApparatuses: [],
        reaction: null,
        showEffect: false,
        temperature: atmosphericTemp,
        burnerTemperature: 300,
        coolingTarget: 5,
        pH: null,
        solutionColor: null,
        phaseChanges: [],
        connectedTo: null,
        filterSeparation: null,
        transferredChemicalIds: [],
        isTransferTarget: false,
        collectedGases: [],
        reactionComplete: false,
      };
      onExperimentStep?.(createApparatusMaterialStep(newContainer.label, apparatus));
      return [...prev, newContainer];
    });
    onItemPlaced?.();
  }, [selectedItem, onItemPlaced, onExperimentStep, atmosphericTemp]);

  // Click-to-place: container click adds chemical or apparatus
  const handleContainerClick = useCallback((containerId: string) => {
    if (!selectedItem) return;

    if (selectedItem.type === "apparatus") {
      const apparatus = selectedItem.data;
      if (apparatus.category === "container") return;

      // Reuse connecting tube logic
      if (apparatus.id === "connecting-tube") {
        if (connectingFrom === null) {
          setConnectingFrom(containerId);
          setContainers((prev) =>
            prev.map((c) =>
              c.id === containerId
                ? { ...c, attachedApparatuses: [...c.attachedApparatuses.filter((a) => a.id !== "connecting-tube"), apparatus] }
                : c
            )
          );
          onItemPlaced?.();
        } else if (connectingFrom !== containerId) {
          // Create a fake drag event isn't needed—just replicate the logic
          setContainers((prev) => {
            const fromContainer = prev.find((c) => c.id === connectingFrom);
            const toContainer = prev.find((c) => c.id === containerId);
            if (!fromContainer || !toContainer) return prev;
            const sourceHasFilter = fromContainer.attachedApparatuses.some((a) => a.id === "filter-paper" || a.id === "filter-funnel");
            const transferChemicals = sourceHasFilter
              ? fromContainer.chemicals.filter((c) => isChemicalSoluble(c))
              : [...fromContainer.chemicals];
            const gasTransfers = fromContainer.collectedGases.map((g) => ({ ...g, state: "gas" as const }));
            const allTransfers = [...transferChemicals, ...gasTransfers];
            const transferIds = allTransfers.map((c) => c.id);
            const mergedChemicals = [...toContainer.chemicals, ...allTransfers];
            let reaction: Reaction | null = null;
            let showEffect = false;
            let solutionColor = toContainer.solutionColor;
            if (mergedChemicals.length >= 2) {
              for (let i = 0; i < mergedChemicals.length; i++) {
                for (let j = i + 1; j < mergedChemicals.length; j++) {
                  const found = findReaction(mergedChemicals[i].formula, mergedChemicals[j].formula);
                  if (found) { reaction = found; showEffect = true; if (found.indicatorColor) solutionColor = found.indicatorColor; break; }
                }
                if (reaction) break;
              }
            }
            const pH = calculatePH(mergedChemicals);
            const newApparatuses = [...toContainer.attachedApparatuses.filter((a) => a.id !== "connecting-tube"), apparatus];
            const temp = calculateTemperature(atmosphericTemp, newApparatuses, reaction, toContainer.burnerTemperature, mergedChemicals);
            const phaseChanges = calculatePhaseChanges(mergedChemicals, newApparatuses, toContainer.burnerTemperature);
            const filterSeparation = calculateFilterSeparation(mergedChemicals, newApparatuses);
            if (reaction) {
              setActiveReaction(reaction);
              onExperimentStep?.({ timestamp: new Date(), beakerLabel: toContainer.label, chemicals: mergedChemicals, reaction, apparatus: newApparatuses.map((a) => a.name) });
            }
            return prev.map((c) => {
              if (c.id === connectingFrom) return { ...c, connectedTo: containerId };
              if (c.id === containerId) return { ...c, chemicals: mergedChemicals, connectedTo: connectingFrom, attachedApparatuses: newApparatuses, reaction, showEffect, pH, temperature: temp, solutionColor, phaseChanges, filterSeparation, transferredChemicalIds: transferIds, isTransferTarget: true };
              return c;
            });
          });
          setConnectingFrom(null);
        }
        return;
      }

      setContainers((prev) =>
        prev.map((c) => {
          if (c.id !== containerId || c.attachedApparatuses.find((a) => a.id === apparatus.id)) return c;
          const newApparatuses = [...c.attachedApparatuses, apparatus];
          const temp = calculateTemperature(atmosphericTemp, newApparatuses, c.reaction, c.burnerTemperature, c.chemicals);
          const phaseChanges = calculatePhaseChanges(c.chemicals, newApparatuses, c.burnerTemperature);
          const filterSeparation = calculateFilterSeparation(c.chemicals, newApparatuses);
          const gases = collectGases(c.chemicals, phaseChanges, newApparatuses);
          onExperimentStep?.(createApparatusMaterialStep(c.label, apparatus));
          return { ...c, attachedApparatuses: newApparatuses, temperature: temp, phaseChanges, filterSeparation, collectedGases: gases };
        })
      );
      onItemPlaced?.();
      return;
    }

    // Chemical
    const chemical = selectedItem.data;
    setContainers((prev) =>
      prev.map((c) => {
        if (c.id !== containerId) return c;
        const newChemicals = [...c.chemicals, chemical];
        let reaction: Reaction | null = null;
        let showEffect = false;
        let solutionColor = c.solutionColor;
        if (newChemicals.length >= 2) {
          const last = newChemicals[newChemicals.length - 1];
          for (let i = 0; i < newChemicals.length - 1; i++) {
            const found = findReaction(newChemicals[i].formula, last.formula);
            if (found) { reaction = found; showEffect = true; if (found.indicatorColor) solutionColor = found.indicatorColor; break; }
          }
        }
        const pH = calculatePH(newChemicals);
        const temp = calculateTemperature(atmosphericTemp, c.attachedApparatuses, reaction, c.burnerTemperature, newChemicals);
        const phaseChanges = calculatePhaseChanges(newChemicals, c.attachedApparatuses, c.burnerTemperature);
        const filterSeparation = calculateFilterSeparation(newChemicals, c.attachedApparatuses);
        const gases = collectGases(newChemicals, phaseChanges, c.attachedApparatuses);
        if (reaction) {
          setActiveReaction(reaction);
          onExperimentStep?.({ timestamp: new Date(), beakerLabel: c.label, chemicals: newChemicals, reaction, apparatus: c.attachedApparatuses.map((a) => a.name) });
        }
        onExperimentStep?.(createChemicalMaterialStep(c.label, chemical));
        return { ...c, chemicals: newChemicals, reaction, showEffect, pH, temperature: temp, solutionColor, phaseChanges, filterSeparation, collectedGases: gases };
      })
    );
    onItemPlaced?.();
  }, [selectedItem, connectingFrom, onExperimentStep, onItemPlaced]);

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/50">
        <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase flex items-center gap-2">
          <Beaker className="w-4 h-4 text-primary" />
          Fusion Desk
        </h2>
        <div className="flex items-center gap-3">
          {connectingFrom && (
            <span className="text-[10px] text-primary animate-pulse font-medium">
              🔗 Drop tube on second container to connect…
            </span>
          )}
          {containers.length > 0 && (
            <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Clear All
            </button>
          )}
        </div>
      </div>

      <div
        onClick={handleBenchClick}
        onDragOver={(e) => { e.preventDefault(); setBenchDragOver(true); }}
        onDragLeave={() => setBenchDragOver(false)}
        onDrop={handleBenchDrop}
        className={`flex-1 flex items-center justify-center gap-8 p-6 flex-wrap overflow-y-auto transition-colors duration-200 cursor-pointer ${
          benchDragOver || (selectedItem?.type === "apparatus" && selectedItem.data.category === "container")
            ? "bg-primary/5 ring-2 ring-inset ring-primary/20 rounded-lg"
            : ""
        }`}
      >
        {containers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground/50">
            <FlaskConical className="w-16 h-16 opacity-100 shadow-none" />
            <p className="text-sm font-medium">Empty Fusion Desk</p>
            <p className="text-xs text-center max-w-xs">
              Drag or <span className="text-primary/70 font-medium">tap</span> a container (Beaker, Test Tube, Flask) from the Apparatus tab, then tap here to place it
            </p>
          </div>
        ) : (
          (() => {
            // Group connected containers as pairs, render unconnected ones standalone
            const rendered = new Set<string>();
            const elements: React.ReactNode[] = [];

            containers.forEach((container) => {
              if (rendered.has(container.id)) return;

              const partner = container.connectedTo
                ? containers.find((c) => c.id === container.connectedTo)
                : null;

              if (partner && !rendered.has(partner.id)) {
                rendered.add(container.id);
                rendered.add(partner.id);

                // Determine which has filter
                const sourceHasFilter = container.attachedApparatuses.some((a) => a.id === "filter-paper" || a.id === "filter-funnel");
                const partnerHasFilter = partner.attachedApparatuses.some((a) => a.id === "filter-paper" || a.id === "filter-funnel");
                const hasAnyFilter = sourceHasFilter || partnerHasFilter;

                elements.push(
                  <div key={`pair-${container.id}`} className="flex items-center gap-0">
                    <ContainerSlot
                      container={container}
                      isOver={dragOver === container.id || connectingFrom === container.id}
                      hasSelectedItem={!!selectedItem}
                      onDragOver={() => setDragOver(container.id)}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={(e) => handleContainerDrop(container.id, e)}
                      onClick={() => handleContainerClick(container.id)}
                      onClear={() => clearContainer(container.id)}
                      onRemove={() => removeContainer(container.id)}
                      onBurnerTempChange={(temp) => handleBurnerTempChange(container.id, temp)}
                      onCoolingTargetChange={(temp) => handleCoolingTargetChange(container.id, temp)}
                    />

                    {/* Visual connecting tube */}
                    <div className="flex flex-col items-center gap-1 mx-1">
                      <div className="relative flex items-center">
                        {/* Tube body */}
                        <div className="w-16 sm:w-24 h-3 rounded-full bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30 border border-primary/40 relative overflow-hidden">
                          {/* Flow animation */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-tube-flow" />
                          {/* Liquid dots flowing */}
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary/70 animate-tube-dot"
                              style={{ animationDelay: `${i * 0.6}s` }}
                            />
                          ))}
                        </div>
                        {/* Connectors on ends */}
                        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-5 rounded-l-sm bg-muted-foreground/30 border border-muted-foreground/40" />
                        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-5 rounded-r-sm bg-muted-foreground/30 border border-muted-foreground/40" />
                      </div>
                      <span className="text-[8px] text-primary/70 font-mono tracking-wider uppercase">
                        {hasAnyFilter ? "🔽 filtered" : "⟶ flow"}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); disconnectContainers(container.id, partner.id); }}
                        className="text-[9px] font-medium text-destructive hover:text-destructive/80 transition-colors px-2 py-0.5 rounded border border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
                      >
                        ⏹ Stop
                      </button>
                    </div>

                    <ContainerSlot
                      container={partner}
                      isOver={dragOver === partner.id || connectingFrom === partner.id}
                      hasSelectedItem={!!selectedItem}
                      onDragOver={() => setDragOver(partner.id)}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={(e) => handleContainerDrop(partner.id, e)}
                      onClick={() => handleContainerClick(partner.id)}
                      onClear={() => clearContainer(partner.id)}
                      onRemove={() => removeContainer(partner.id)}
                      onBurnerTempChange={(temp) => handleBurnerTempChange(partner.id, temp)}
                      onCoolingTargetChange={(temp) => handleCoolingTargetChange(partner.id, temp)}
                    />
                  </div>
                );
              } else {
                rendered.add(container.id);
                elements.push(
                  <div key={container.id} className="relative">
                    {connectingFrom === container.id && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] text-primary font-mono bg-primary/10 rounded px-1.5 py-0.5 z-20 animate-pulse">
                        🔗 Select second container…
                      </div>
                    )}
                    <ContainerSlot
                      container={container}
                      isOver={dragOver === container.id || connectingFrom === container.id}
                      hasSelectedItem={!!selectedItem}
                      onDragOver={() => setDragOver(container.id)}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={(e) => handleContainerDrop(container.id, e)}
                      onClick={() => handleContainerClick(container.id)}
                      onClear={() => clearContainer(container.id)}
                      onRemove={() => removeContainer(container.id)}
                      onBurnerTempChange={(temp) => handleBurnerTempChange(container.id, temp)}
                      onCoolingTargetChange={(temp) => handleCoolingTargetChange(container.id, temp)}
                    />
                  </div>
                );
              }
            });

            return elements;
          })()
        )}
      </div>

      {/* Only show reaction info for actual reactions (not non-reactive substances) */}
      {activeReaction && activeReaction.intensity > 0 && <ReactionInfo reaction={activeReaction} onClose={() => setActiveReaction(null)} />}
    </div>
  );
}
