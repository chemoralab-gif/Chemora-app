import { useState } from "react";
import { FlaskConical, Beaker, TestTubes, Flame, ArrowRight, ArrowLeft, X, Sparkles, Thermometer, AlertTriangle } from "lucide-react";

interface OnboardingTutorialProps {
  onClose: () => void;
}

const STEPS = [
  {
    icon: <img src="/chemora-logo.png" alt="Chemora" className="w-12 h-12" />,
    emoji: "",
    title: "Welcome to Chemora",
    description: "Your virtual chemistry lab! Mix chemicals, trigger reactions, and explore science through interactive experiments.",
  },
  {
    icon: <TestTubes className="w-12 h-12 text-accent" />,
    emoji: "",
    title: "Chemical Palette",
    description: "Browse elements, acids, alkalis, and more in the left panel. Tap or drag a chemical to select it, then tap a container to add it.",
  },
  {
    icon: <Beaker className="w-12 h-12 text-primary" />,
    emoji: "",
    title: "Apparatus & Tools",
    description: "Switch to the Apparatus tab to find containers (beakers, flasks), heating tools (Bunsen burner), cooling bath, measuring instruments (pH meter, thermometer), and the Gas Collection Jar.",
  },
  {
    icon: <Flame className="w-12 h-12 text-accent" />,
    emoji: "",
    title: "Fusion Desk",
    description: "Place containers on the desk by tapping the empty area. Add chemicals and apparatus to containers. Attach a Bunsen burner and adjust the temperature slider to heat things up!",
  },
  {
    icon: <Sparkles className="w-12 h-12 text-primary" />,
    emoji: "",
    title: "Reactions & Transfer",
    description: "Combine two chemicals to trigger reactions! Use connecting tubes to transfer liquids between containers. Attach a Gas Collection Jar to capture evaporated gases, then transfer them to another container.",
  },
  {
    icon: <Thermometer className="w-12 h-12 text-accent" />,
    emoji: "",
    title: "Thermal Analysis Panel",
    description: "The Thermal Analysis Panel tracks heat energy where the user can Adjust atmospheric temperature and pressure — they influence both the reaction spike and cooling rate. A real-time graph plots temperature and time. The user can export data to Excel!",
  },
  {
    icon: <AlertTriangle className="w-12 h-12 text-destructive" />,
    emoji: "",
    title: "Important Disclaimer",
    description: "All simulation results, temperature readings, reaction behaviours, and thermal calculations displayed in Chemora are approximations intended solely for educational and illustrative purposes. Students or Professionals must not rely on any of the data provided for any official testing or examinations. They do not represent laboratory-grade accuracy and must not be used for professional research, industrial testing, product development, safety assessments, or any real-world decision-making. Actual chemical reactions depend on many factors (purity, concentration, catalysts, equipment) that this simulation cannot replicate. Always consult qualified professionals and verified scientific literature for precise data.",
  },
];

export default function OnboardingTutorial({ onClose }: OnboardingTutorialProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  const handleFinish = () => {
    localStorage.setItem("elementum-onboarding-seen", "true");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-[90vw] max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Skip All */}
        <button
          onClick={handleFinish}
          className="absolute top-3 right-3 z-10 flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-md border border-border hover:border-destructive/30"
        >
          <X className="w-3 h-3" /> Skip All
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center px-8 pt-10 pb-6 gap-4 animate-fade-in" key={step}>
          {step === 0 ? (
            <img src="/chemora-logo-guide.png" alt="Chemora" className="w-40 h-40 object-contain" />
          ) : (
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20">
              {current.icon}
            </div>
          )}
          <span className="text-3xl">{current.emoji}</span>
          <h2 className="text-lg font-bold text-foreground">{current.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
            {current.description}
          </p>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 pb-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === step ? "bg-primary w-6" : i < step ? "bg-primary/40" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 pb-6">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-3 py-2 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-1 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors px-5 py-2 rounded-lg"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-1 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors px-5 py-2 rounded-lg"
            >
              Start Experimenting! <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
