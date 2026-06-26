import { Apparatus } from "@/lib/reactions";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface ApparatusTooltipProps {
  apparatus: Apparatus;
}

const APPARATUS_DETAILS: Record<string, { temperature?: string; usage?: string; safety?: string }> = {
  "bunsen-burner": { temperature: "300–1500 °C", usage: "Heating substances, flame tests, evaporation", safety: "Keep flammable materials away" },
  tripod: { usage: "Supports beakers & flasks above a burner", safety: "Use with gauze mat" },
  thermometer: { temperature: "−10 to 110 °C (standard)", usage: "Measure reaction temperature" },
  "measuring-cylinder": { usage: "Measure liquid volumes (±0.5 mL)", safety: "Read at meniscus level" },
  "ph-meter": { usage: "Measure pH 0–14", safety: "Calibrate before use" },
  "filter-funnel": { usage: "Separate insoluble solids from liquids", safety: "Use with filter paper for best results" },
  "filter-paper": { usage: "Traps insoluble solids; liquids pass through as filtrate", safety: "Place inside filter funnel" },
  "connecting-tube": { usage: "Transfers liquid/gas between two containers. Drop on first container, then drop on second to connect.", safety: "Ensure secure fit to prevent leaks" },
  "evaporating-dish": { temperature: "Up to 1000 °C", usage: "Evaporate solvents to obtain crystals" },
  spatula: { usage: "Transfer small quantities of solids" },
  "glass-rod": { usage: "Stir solutions, guide filtrate" },
  "safety-goggles": { usage: "Eye protection", safety: "Always wear during experiments" },
  tongs: { usage: "Handle hot containers", safety: "Check grip before lifting" },
};

export default function ApparatusTooltip({ apparatus }: ApparatusTooltipProps) {
  const details = APPARATUS_DETAILS[apparatus.id];

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="max-w-24 truncate text-[9px] font-medium text-primary bg-secondary/80 border border-primary/20 rounded px-1.5 py-0.5 cursor-help hover:bg-secondary transition-colors">
            {apparatus.name}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-56 space-y-1 text-left">
          <p className="font-semibold text-xs">{apparatus.name}</p>
          <p className="text-[11px] text-muted-foreground">{apparatus.description}</p>
          {details?.temperature && (
            <p className="text-[11px]">
              <span className="text-primary font-medium">🌡️ Temp:</span>{" "}
              <span className="text-foreground">{details.temperature}</span>
            </p>
          )}
          {details?.usage && (
            <p className="text-[11px]">
              <span className="text-primary font-medium">📋 Use:</span>{" "}
              <span className="text-foreground">{details.usage}</span>
            </p>
          )}
          {details?.safety && (
            <p className="text-[11px]">
              <span className="text-destructive font-medium">⚠️ Safety:</span>{" "}
              <span className="text-foreground">{details.safety}</span>
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
