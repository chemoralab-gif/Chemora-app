import React from "react";

interface BunsenBurnerProps {
  isActive: boolean;
  intensity?: number;
  isEndothermic?: boolean;
}

export default function BunsenBurner({ isActive, intensity = 5, isEndothermic = false }: BunsenBurnerProps) {
  // For endothermic reactions, show a cooling effect (blue/icy) instead of heat
  if (isEndothermic) {
    return (
      <div className="relative w-16 h-20 mx-auto">
        {/* Burner body */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-12 bg-gradient-to-b from-gray-700 to-gray-900 rounded-b-sm border border-gray-600">
          {/* Cooling glow (blue/cyan) */}
          {isActive && (
            <>
              <div className="absolute inset-0 rounded-b-sm bg-blue-400/30 blur-md animate-pulse" />
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-3 bg-gradient-to-t from-cyan-300 to-blue-200 rounded-full opacity-60 blur-sm animate-pulse" />
              {/* Frost/cooling particles */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-cyan-200 rounded-full animate-ping"
                  style={{
                    left: `${20 + i * 30}%`,
                    top: `${30 + i * 15}%`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </>
          )}
        </div>

        {/* Burner nozzle */}
        <div className="absolute bottom-11 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-gray-800 rounded-t-sm border-t border-gray-600" />

        {/* Label */}
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-blue-500 whitespace-nowrap">
          COOLING
        </div>
      </div>
    );
  }

  // Normal exothermic burner with flame
  return (
    <div className="relative w-16 h-20 mx-auto">
      {/* Burner body */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-12 bg-gradient-to-b from-gray-700 to-gray-900 rounded-b-sm border border-gray-600">
        {/* Flame effect */}
        {isActive && (
          <>
            {/* Main flame glow */}
            <div className="absolute inset-0 rounded-b-sm bg-orange-400/40 blur-md animate-pulse" />

            {/* Flame cone */}
            <div
              className="absolute bottom-1 left-1/2 transform -translate-x-1/2 transition-all"
              style={{
                width: "24px",
                height: "40px",
                background: "linear-gradient(to top, rgba(249, 115, 22, 0.8), rgba(251, 146, 60, 0.6), rgba(253, 224, 71, 0.4))",
                clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                animation: "flame 0.6s ease-in-out infinite",
                filter: "blur(1px)",
              }}
            />

            {/* Heat shimmer particles */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-flame"
                style={{
                  left: `${15 + Math.random() * 60}%`,
                  bottom: `${30 + Math.random() * 40}%`,
                  animationDelay: `${i * 0.1}s`,
                  opacity: 0.7,
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* Burner nozzle */}
      <div className="absolute bottom-11 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-gray-800 rounded-t-sm border-t border-gray-600" />

      {/* Temperature indicator */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-orange-500 whitespace-nowrap">
        {isActive ? "HEATING" : "IDLE"}
      </div>

      {/* Add animation keyframe */}
      <style>{`
        @keyframes flame {
          0%, 100% { transform: scaleY(1) scaleX(0.8); }
          50% { transform: scaleY(1.2) scaleX(1); }
        }
      `}</style>
    </div>
  );
}
