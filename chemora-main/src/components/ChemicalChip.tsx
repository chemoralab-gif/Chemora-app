import { Chemical } from "@/lib/reactions";

interface ChemicalChipProps {
  chemical: Chemical;
}

function StateIcon({ state, color }: { state: string; color: string }) {
  if (state === "solid") {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" className="flex-shrink-0">
        <rect x="1" y="1" width="8" height="8" rx="1" fill={color} stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
      </svg>
    );
  }
  if (state === "liquid") {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" className="flex-shrink-0">
        <path d="M5 1 C5 1 2 5 2 7 C2 8.7 3.3 10 5 10 C6.7 10 8 8.7 8 7 C8 5 5 1 5 1Z" fill={color} stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
      </svg>
    );
  }
  // gas
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" className="flex-shrink-0">
      <circle cx="4" cy="5" r="2.5" fill={color} opacity="0.6" />
      <circle cx="7" cy="4" r="2" fill={color} opacity="0.4" />
      <circle cx="8" cy="7" r="1.5" fill={color} opacity="0.3" />
    </svg>
  );
}

export default function ChemicalChip({ chemical }: ChemicalChipProps) {
  return (
    <div className="flex items-center gap-1 text-[10px] font-mono text-foreground/80">
      <StateIcon state={chemical.state} color={chemical.color} />
      <span>{chemical.formula}</span>
    </div>
  );
}
