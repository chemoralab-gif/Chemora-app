interface ReactionEffectProps {
  effect: string;
  intensity: number;
  indicatorColor?: string;
}

export default function ReactionEffect({ effect, intensity, indicatorColor }: ReactionEffectProps) {
  // Don't show any effects for non-reactive substances
  if (intensity === 0) {
    return null;
  }

  const count = Math.min(intensity, 8);

  if (effect === "explosion") {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="w-24 h-24 rounded-full bg-chemical-explosion animate-explode" />
        <div className="absolute w-16 h-16 rounded-full bg-chemical-fire animate-explode" style={{ animationDelay: "0.1s" }} />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="absolute w-2 h-2 rounded-full bg-accent animate-fizz"
            style={{ left: `${20 + Math.random() * 60}%`, bottom: `${20 + Math.random() * 40}%`, animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    );
  }

  if (effect === "fire") {
    return (
      <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-20">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="w-4 h-8 rounded-full bg-chemical-fire animate-flame opacity-80"
            style={{ animationDelay: `${i * 0.1}s`, marginLeft: i > 0 ? "-4px" : "0", filter: "blur(1px)" }} />
        ))}
      </div>
    );
  }

  if (effect === "bubbles") {
    return (
      <div className="absolute inset-0 pointer-events-none z-20">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="absolute w-2 h-2 rounded-full bg-chemical-water/60 animate-bubble"
            style={{ left: `${15 + Math.random() * 70}%`, bottom: "10%", animationDelay: `${i * 0.3}s`, animationDuration: `${1 + Math.random()}s` }} />
        ))}
      </div>
    );
  }

  if (effect === "fizz") {
    return (
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {Array.from({ length: count * 2 }).map((_, i) => (
          <div key={i} className="absolute w-1 h-1 rounded-full bg-foreground/40 animate-fizz"
            style={{ left: `${10 + Math.random() * 80}%`, bottom: `${Math.random() * 50}%`, animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    );
  }

  if (effect === "rust") {
    return (
      <div className="absolute inset-0 pointer-events-none z-20">
        <div className="absolute bottom-0 left-0 right-0 h-1/2 opacity-70 animate-pulse" 
          style={{ background: "linear-gradient(to top, hsl(15, 60%, 35%), hsl(25, 50%, 45%), transparent)" }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="absolute w-3 h-2 rounded-full opacity-60"
            style={{ background: "hsl(15, 55%, 40%)", left: `${15 + i * 20}%`, bottom: `${20 + i * 8}%`, animationDelay: `${i * 0.5}s` }} />
        ))}
      </div>
    );
  }

  if (effect === "precipitate") {
    const color = indicatorColor || "hsl(0, 0%, 85%)";
    return (
      <div className="absolute inset-0 pointer-events-none z-20">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="absolute w-2 h-2 rounded-full animate-precipitate opacity-80"
            style={{ background: color, left: `${10 + Math.random() * 80}%`, top: `${20 + Math.random() * 30}%`, animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    );
  }

  if (effect === "indicator-change") {
    const color = indicatorColor || "hsl(330, 70%, 50%)";
    return (
      <div className="absolute inset-0 pointer-events-none z-20">
        <div className="absolute inset-0 animate-indicator-spread rounded-b-2xl" style={{ background: color, opacity: 0.35 }} />
      </div>
    );
  }

  if (effect === "gas-release") {
    return (
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="absolute w-4 h-4 rounded-full bg-foreground/10 animate-bubble"
            style={{ left: `${20 + Math.random() * 60}%`, bottom: "20%", animationDelay: `${i * 0.4}s`, animationDuration: `${1.5 + Math.random()}s` }} />
        ))}
      </div>
    );
  }

if (effect === "bright-white" || effect === "bright-light") {
  const duration = Math.max(1200, 2200 - intensity * 60); // much slower
  const coreSize = 40 + intensity * 10;
  const ringSize = coreSize * 2.6;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 overflow-hidden">
      
      {/* Screen glow overlay */}
      <div
        className="absolute inset-0 bg-white/20"
        style={{
          animation: `screenFlash ${duration}ms cubic-bezier(0.25, 0.9, 0.2, 1) forwards`,
        }}
      />

      {/* Expanding shockwave ring */}
      <div
        className="absolute rounded-full border border-white/70"
        style={{
          width: `${ringSize}px`,
          height: `${ringSize}px`,
          boxShadow: `0 0 ${intensity * 18}px rgba(255,255,255,0.85)`,
          animation: `lightRing ${duration}ms cubic-bezier(0.25, 0.9, 0.2, 1) forwards`,
        }}
      />

      {/* Main bright flash core */}
      <div
        className="rounded-full bg-white/95"
        style={{
          width: `${coreSize}px`,
          height: `${coreSize}px`,
          filter: "blur(22px)",
          boxShadow: `
            0 0 ${intensity * 22}px rgba(255,255,255,0.95),
            0 0 ${intensity * 45}px rgba(255,240,180,0.85),
            0 0 ${intensity * 80}px rgba(255,200,80,0.55)
          `,
          animation: `flash ${duration}ms cubic-bezier(0.25, 0.9, 0.2, 1) forwards`,
        }}
      />

      <style>{`
        @keyframes flash {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          10% {
            opacity: 1;
            transform: scale(1.1);
          }
          45% {
            opacity: 1;
            transform: scale(1.3); /* longer HOLD */
          }
          100% {
            opacity: 0;
            transform: scale(2.1);
          }
        }

        @keyframes lightRing {
          0% {
            opacity: 0.9;
            transform: scale(0.2);
          }
          50% {
            opacity: 0.65;
          }
          100% {
            opacity: 0;
            transform: scale(3.6);
          }
        }

        @keyframes screenFlash {
          0% { opacity: 0; }
          12% { opacity: 1; }
          50% { opacity: 0.75; } /* longer glow */
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

  return null;
}
