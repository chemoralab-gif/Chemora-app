import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export default function SplashScreen({
  onComplete,
  duration = 3000,
}: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 500);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Molecular Structure Animation */}
      <div className="relative w-64 h-64 mb-12">
        <svg
          viewBox="0 0 300 300"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <style>{`
              @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
              }
              @keyframes pulse-glow {
                0%, 100% { r: 12; opacity: 0.8; }
                50% { r: 14; opacity: 1; }
              }
              @keyframes rotate-orbit {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              .atom-center {
                animation: pulse-glow 2s ease-in-out infinite;
              }
              .atom-outer {
                animation: pulse-glow 2.5s ease-in-out infinite;
              }
              .molecule {
                animation: float 3s ease-in-out infinite;
              }
              .orbit-group {
                transform-origin: 150px 150px;
                animation: rotate-orbit 8s linear infinite;
              }
            `}</style>
          </defs>

          {/* Main container group with float animation */}
          <g className="molecule">
            {/* Top Atom */}
            <line x1="150" y1="60" x2="150" y2="100" stroke="#ffffff" strokeWidth="2" opacity="0.6" />
            <circle
              cx="150"
              cy="50"
              r="12"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              opacity="0.7"
            />
            <circle
              cx="150"
              cy="50"
              r="8"
              fill="rgba(255, 255, 255, 0.2)"
              className="atom-outer"
            />

            {/* Center Atom (larger) */}
            <circle
              cx="150"
              cy="150"
              r="16"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3"
              opacity="0.9"
            />
            <circle
              cx="150"
              cy="150"
              r="10"
              fill="rgba(255, 255, 255, 0.3)"
              className="atom-center"
            />

            {/* Left Atom */}
            <line x1="100" y1="150" x2="134" y2="150" stroke="#ffffff" strokeWidth="2" opacity="0.6" />
            <circle
              cx="80"
              cy="150"
              r="12"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              opacity="0.7"
            />
            <circle
              cx="80"
              cy="150"
              r="8"
              fill="rgba(255, 255, 255, 0.2)"
              className="atom-outer"
            />

            {/* Right Atom */}
            <line x1="200" y1="150" x2="166" y2="150" stroke="#ffffff" strokeWidth="2" opacity="0.6" />
            <circle
              cx="220"
              cy="150"
              r="12"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              opacity="0.7"
            />
            <circle
              cx="220"
              cy="150"
              r="8"
              fill="rgba(255, 255, 255, 0.2)"
              className="atom-outer"
            />

            {/* Bottom-Left Atom */}
            <line x1="120" y1="180" x2="130" y2="210" stroke="#ffffff" strokeWidth="2" opacity="0.6" />
            <circle
              cx="110"
              cy="230"
              r="12"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              opacity="0.7"
            />
            <circle
              cx="110"
              cy="230"
              r="8"
              fill="rgba(255, 255, 255, 0.2)"
              className="atom-outer"
            />

            {/* Bottom-Right Atom */}
            <line x1="180" y1="180" x2="170" y2="210" stroke="#ffffff" strokeWidth="2" opacity="0.6" />
            <circle
              cx="190"
              cy="230"
              r="12"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              opacity="0.7"
            />
            <circle
              cx="190"
              cy="230"
              r="8"
              fill="rgba(255, 255, 255, 0.2)"
              className="atom-outer"
            />
          </g>
        </svg>
      </div>

      {/* Chemora Logo and Text */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Chemora</h1>
        <p className="text-sm text-white/60 tracking-widest">Every Atom is Yours</p>
      </div>

      {/* Loading indicator */}
      <div className="absolute bottom-12 flex items-center gap-2">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-white/40"
              style={{
                animation: `pulse 1.5s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.4; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
      </div>
    </div>
  );
}
