import { ContainerState } from "./EquipmentArea";
import ReactionEffect from "./ReactionEffect";
import ChemicalChip from "./ChemicalChip";
import ApparatusTooltip from "./ApparatusTooltip";
import { X, Thermometer, Droplets, Wind, Filter, Flame, Cloud } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";

interface ContainerSlotProps {
  container: ContainerState;
  isOver: boolean;
  hasSelectedItem?: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onClick?: () => void;
  onClear: () => void;
  onRemove: () => void;
  onBurnerTempChange?: (temp: number) => void;
  onCoolingTargetChange?: (temp: number) => void;
}

const CONTAINER_SHAPES: Record<string, string> = {
  beaker: "rounded-b-2xl rounded-t-sm",
  "test-tube": "rounded-b-full rounded-t-sm",
  "conical-flask": "rounded-b-xl rounded-t-none [clip-path:polygon(30%_0%,70%_0%,100%_100%,0%_100%)]",
  "round-flask": "rounded-b-full rounded-t-lg",
};

function getContainerShape(apparatusId: string) {
  return CONTAINER_SHAPES[apparatusId] || "rounded-b-2xl rounded-t-sm";
}

function getContainerSize(apparatusId: string) {
  if (apparatusId === "test-tube") return "w-20 h-52";
  if (apparatusId === "round-flask") return "w-40 h-44";
  if (apparatusId === "conical-flask") return "w-40 h-48";
  return "w-36 h-48";
}

function getMixedColor(chemicals: { color: string }[], solutionColor: string | null): string {
  // If a specific reaction color is set, use that (highest priority)
  if (solutionColor) return solutionColor;
  
  // If no chemicals, transparent
  if (chemicals.length === 0) return "transparent";
  
  // If only one chemical, use its color
  if (chemicals.length === 1) return chemicals[0].color;
  
  // For multiple chemicals: blend colors
  // For reactions like glucose + iodine, show the product color (which is set via indicatorColor in the reaction)
  // If no product color is set, blend the colors by blending hues
  const colors = chemicals.map(c => c.color);
  
  // Parse HSL values and average them
  const hslValues = colors.map(colorStr => {
    const match = colorStr.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      return {
        h: parseInt(match[1]),
        s: parseInt(match[2]),
        l: parseInt(match[3])
      };
    }
    return { h: 0, s: 0, l: 50 };
  });
  
  // Average hue, saturation, and lightness
  const avgH = Math.round(hslValues.reduce((sum, v) => sum + v.h, 0) / hslValues.length);
  const avgS = Math.round(hslValues.reduce((sum, v) => sum + v.s, 0) / hslValues.length);
  const avgL = Math.round(hslValues.reduce((sum, v) => sum + v.l, 0) / hslValues.length);
  
  return `hsl(${avgH}, ${avgS}%, ${avgL}%)`;
}

function getPHColor(pH: number): string {
  if (pH <= 2) return "hsl(0, 80%, 50%)";
  if (pH <= 4) return "hsl(25, 80%, 50%)";
  if (pH <= 6) return "hsl(50, 80%, 50%)";
  if (pH <= 8) return "hsl(120, 60%, 45%)";
  if (pH <= 10) return "hsl(210, 70%, 50%)";
  if (pH <= 12) return "hsl(250, 60%, 50%)";
  return "hsl(280, 60%, 40%)";
}

export default function ContainerSlot({
  container, isOver, hasSelectedItem, onDragOver, onDragLeave, onDrop, onClick, onClear, onRemove, onBurnerTempChange, onCoolingTargetChange,
}: ContainerSlotProps) {
  const shape = getContainerShape(container.apparatus.id);
  const size = getContainerSize(container.apparatus.id);
  const hasBurner = container.attachedApparatuses.some((a) => a.id === "bunsen-burner");
  const hasThermometer = container.attachedApparatuses.some((a) => a.id === "thermometer");
  const hasPHMeter = container.attachedApparatuses.some((a) => a.id === "ph-meter");
  const hasPhaseChanges = container.phaseChanges.length > 0;
  const hasFilter = container.filterSeparation !== null;
  const hasGasJar = container.attachedApparatuses.some((a) => a.id === "gas-jar");
  const hasCollectedGases = container.collectedGases.length > 0;
  const hasCoolingBath = container.attachedApparatuses.some((a) => a.id === "cooling-bath");

  return (
    <div className="flex flex-col items-center gap-2">
      <button onClick={onRemove} className="text-muted-foreground/40 hover:text-destructive transition-colors self-end">
        <X className="w-3 h-3" />
      </button>

      {/* Readings */}
      <div className="flex items-center gap-2 min-h-[20px] flex-wrap justify-center">
        {hasThermometer && (
          <span className="flex items-center gap-0.5 text-[10px] font-mono text-accent">
            <Thermometer className="w-3 h-3" /> {container.temperature}°C
          </span>
        )}
        {hasPHMeter && container.pH !== null && (
          <span className="flex items-center gap-0.5 text-[10px] font-mono" style={{ color: getPHColor(container.pH) }}>
            <Droplets className="w-3 h-3" /> pH {container.pH}
          </span>
        )}
        {hasPhaseChanges && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-0.5 text-[10px] font-mono text-primary cursor-help">
                  <Wind className="w-3 h-3" /> Phase Δ
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-64 space-y-1">
                <p className="font-semibold text-xs">Phase Changes</p>
                {container.phaseChanges.map((pc, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground">
                    {pc.description}
                  </p>
                ))}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {hasFilter && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-0.5 text-[10px] font-mono text-accent cursor-help">
                  <Filter className="w-3 h-3" /> Filtered
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-72 space-y-1">
                <p className="font-semibold text-xs">Filtration Result</p>
                <p className="text-[11px] text-muted-foreground">{container.filterSeparation!.description}</p>
                {container.filterSeparation!.solids.length > 0 && (
                  <p className="text-[11px]">
                    <span className="text-primary font-medium">Residue:</span>{" "}
                    {container.filterSeparation!.solids.join(", ")}
                  </p>
                )}
                {container.filterSeparation!.filtrate.length > 0 && (
                  <p className="text-[11px]">
                    <span className="text-accent font-medium">Filtrate:</span>{" "}
                    {container.filterSeparation!.filtrate.join(", ")}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {hasCollectedGases && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-0.5 text-[10px] font-mono text-primary cursor-help">
                  <Cloud className="w-3 h-3" /> 🫙 {container.collectedGases.length} gas{container.collectedGases.length > 1 ? "es" : ""}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-64 space-y-1">
                <p className="font-semibold text-xs">Collected Gases</p>
                {container.collectedGases.map((g, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground">
                    {g.name} ({g.formula}) — captured as gas
                  </p>
                ))}
                <p className="text-[10px] text-primary/70 mt-1">Use a connecting tube to transfer to another container</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Gas collection animation */}
      {hasGasJar && hasPhaseChanges && container.phaseChanges.some((pc) => pc.to === "gas") && (
        <div className="flex gap-1 -mb-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1.5 h-2 rounded-full bg-primary/30 animate-gas-collect"
              style={{ animationDelay: `${i * 0.35}s` }}
            />
          ))}
          <span className="text-[9px] text-primary/60 ml-1">🫙 collecting</span>
        </div>
      )}

      {/* Steam / evaporation effect (when no gas jar) */}
      {!hasGasJar && hasPhaseChanges && container.phaseChanges.some((pc) => pc.to === "gas") && (
        <div className="flex gap-1 -mb-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-2 h-3 rounded-full bg-muted-foreground/20 animate-bubble"
              style={{ animationDelay: `${i * 0.3}s`, animationDuration: "1.5s" }}
            />
          ))}
          <span className="text-[9px] text-muted-foreground/60 ml-1">💨</span>
        </div>
      )}

      {/* Container */}
      <div
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); onDragOver(); }}
        onDragLeave={(e) => { e.stopPropagation(); onDragLeave(); }}
        onDrop={onDrop}
        className={`relative ${size} border-2 transition-all duration-300 flex flex-col items-center justify-end overflow-hidden ${shape} ${
          isOver ? "border-primary glow-primary scale-105" : hasSelectedItem ? "border-primary/40 hover:border-primary hover:scale-[1.02] cursor-pointer" : "border-border hover:border-muted-foreground/30"
        }`}
        style={{ background: "hsl(220, 18%, 10%)" }}
      >
        {/* Liquid fill */}
        {container.chemicals.length > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
            style={{
              height: `${Math.min(container.chemicals.length * 25, 80)}%`,
              backgroundColor: getMixedColor(container.chemicals, container.solutionColor),
              opacity: hasPhaseChanges && container.phaseChanges.some((pc) => pc.to === "gas") ? 0.3 : 0.6,
            }}
          />
        )}

        {/* Reaction effect - only show while reaction is active (not complete) */}
        {container.showEffect && container.reaction && !container.reactionComplete && (
          <ReactionEffect
            effect={container.reaction.effect}
            intensity={container.reaction.intensity}
            indicatorColor={container.reaction.indicatorColor}
          />
        )}

        {/* Products display after reaction completes */}
        {container.reactionComplete && container.reaction && (
          <div className="absolute bottom-2 left-1 right-1 z-30 flex flex-col items-center gap-1 bg-card/90 backdrop-blur-sm rounded-lg border border-primary/40 p-2 shadow-lg">
            <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Products</span>
            <span className="text-xs font-mono font-semibold text-foreground text-center leading-snug">{container.reaction.products}</span>
          </div>
        )}

        {/* During active reaction - show reactants */}
        {container.showEffect && container.reaction && !container.reactionComplete && container.chemicals.length > 0 && (
          <div className="relative z-10 p-2 w-full flex flex-col items-center gap-1">
            <div className="flex flex-col items-center gap-0.5 w-full">
              {container.chemicals.map((c, i) => (
                <ChemicalChip key={i} chemical={c} />
              ))}
            </div>
            <div className="text-[8px] text-muted-foreground/60 opacity-75">→ {container.reaction.products}</div>
          </div>
        )}

        {/* Chemical chips - show when no active reaction */}
        {(!container.showEffect || !container.reaction) && (
          <div className="relative z-10 p-2 w-full flex flex-col items-center gap-0.5">
            {container.chemicals.map((c, i) => (
              <ChemicalChip key={i} chemical={c} />
            ))}
          </div>
        )}

        {/* Attached apparatus badges */}
        {container.attachedApparatuses.length > 0 && (
          <div className="absolute top-1 left-1 right-1 flex flex-wrap gap-0.5 z-10">
            {container.attachedApparatuses.map((a) => (
              <ApparatusTooltip key={a.id} apparatus={a} />
            ))}
          </div>
        )}

        {/* Drop hint */}
        {container.chemicals.length === 0 && container.attachedApparatuses.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-muted-foreground/40">Drop here</span>
          </div>
        )}
      </div>

      {/* Bunsen burner flame visual */}
      {hasBurner && (
        <div className="flex flex-col items-center gap-1 -mt-1">
          <div className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 rounded-full bg-chemical-fire animate-flame"
                style={{
                  animationDelay: `${i * 0.15}s`,
                  height: `${Math.max(8, container.burnerTemperature / 40)}px`,
                  opacity: Math.max(0.3, container.burnerTemperature / 600),
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 w-28" onClick={(e) => e.stopPropagation()}>
            <Flame className="w-3 h-3 text-accent shrink-0" />
            <Slider
              value={[container.burnerTemperature]}
              min={50}
              max={600}
              step={10}
              onValueChange={(v) => onBurnerTempChange?.(v[0])}
              className="flex-1"
            />
          </div>
          <span className="text-[9px] font-mono text-accent/80">{container.burnerTemperature}°C</span>
        </div>
      )}

      {/* Cooling bath controls */}
      {hasCoolingBath && (
        <div className="flex flex-col items-center gap-1 -mt-1">
          <div className="flex items-center gap-1.5 w-28" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs">🧊</span>
            <Slider
              value={[container.coolingTarget]}
              min={-10}
              max={30}
              step={1}
              onValueChange={(v) => onCoolingTargetChange?.(v[0])}
              className="flex-1"
            />
          </div>
          <span className="text-[9px] font-mono text-primary/80">Target: {container.coolingTarget}°C</span>
        </div>
      )}

      {/* Label */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className="text-base">{container.apparatus.icon}</span>
        <span className="text-xs font-medium">{container.label}</span>
      </div>

      {/* Radioactive warning */}
      {container.chemicals.some((c) => c.radioactive) && (
        <span className="text-[10px] text-destructive font-medium">☢️ Radioactive</span>
      )}

      {/* Clear */}
      {(container.chemicals.length > 0 || container.attachedApparatuses.length > 0) && (
        <button onClick={onClear} className="text-[10px] text-muted-foreground hover:text-destructive transition-colors">
          Empty
        </button>
      )}
    </div>
  );
}
