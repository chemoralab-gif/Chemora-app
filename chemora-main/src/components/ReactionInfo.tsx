import { Reaction } from "@/lib/reactions";
import { X, Zap, AlertTriangle, Activity } from "lucide-react";
import { useState } from "react";

interface ReactionInfoProps {
  reaction: Reaction;
  onClose: () => void;
}

export default function ReactionInfo({ reaction, onClose }: ReactionInfoProps) {
  // Don't show anything for non-reactive substances (intensity === 0)
  if (reaction.intensity === 0) {
    return null;
  }

  const intensityColor =
    reaction.intensity >= 7 ? "text-destructive" : reaction.intensity >= 4 ? "text-accent" : "text-primary";

  return (
    <div className="border-t border-border bg-card p-5 animate-in slide-in-from-bottom-2 duration-300 max-h-96 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${intensityColor}`} />
            <h3 className="text-sm font-semibold text-foreground">
              {reaction.intensity === 0 ? "No Reaction" : "Reaction Detected!"}
            </h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Equation */}
        <div className="bg-secondary/50 rounded-lg px-4 py-3 mb-4 border border-border">
          <p className="font-mono text-sm text-primary text-center tracking-wide">{reaction.equation}</p>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{reaction.description}</p>

        {/* Meters row */}
        <div className="flex items-center gap-6 flex-wrap mb-4">
          {/* Intensity */}
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Reactivity</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={`w-3 h-2 rounded-sm transition-colors ${
                  i < reaction.intensity
                    ? reaction.intensity >= 7 ? "bg-destructive" : reaction.intensity >= 4 ? "bg-accent" : "bg-primary"
                    : "bg-secondary"
                }`} />
              ))}
            </div>
            <span className={`text-xs font-mono ${intensityColor}`}>{reaction.intensity}/10</span>
          </div>

          {reaction.intensity >= 7 && (
            <span className="flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle className="w-3 h-3" />
              Dangerous!
            </span>
          )}
        </div>

        {/* Effect type badge */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground capitalize">
            {reaction.effect.replace("-", " ")}
          </span>
          {reaction.indicatorColor && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="w-3 h-3 rounded-full border border-border" style={{ background: reaction.indicatorColor }} />
              Result color
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
