import { useState, useCallback, lazy, Suspense } from "react";
import ChemicalPalette from "@/components/ChemicalPalette";
import type { CalorimetryData } from "@/components/types/thermal";
import type { Chemical, Apparatus, ExperimentStep } from "@/lib/reactions";
import { FileText, HelpCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUIMode } from "@/hooks/use-ui-mode";

// Lazy load heavy components
const MobileSwipeLayout = lazy(() => import("@/components/MobileSwipeLayout"));
const DesktopEquipmentArea = lazy(() => import("@/components/DesktopEquipmentArea"));
const ThermalAnalysisPanel = lazy(() => import("@/components/ThermalAnalysisPanel"));
const ExperimentReport = lazy(() => import("@/components/ExperimentReport"));
const OnboardingTutorial = lazy(() => import("@/components/OnboardingTutorial"));
const ChemistryAIAssistant = lazy(() => import("@/components/ChemistryAIAssistant"));

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

const Index = () => {
  const actualIsMobile = useIsMobile();
  const { isMobileUI } = useUIMode();
  const isMobile = isMobileUI(actualIsMobile);
  const [, setDragging] = useState<Chemical | Apparatus | null>(null);
  const [experimentSteps, setExperimentSteps] = useState<ExperimentStep[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [showChemistryAI, setShowChemistryAI] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [activeMetal, setActiveMetal] = useState<string | null>(null);
  const [containerWaterTemp, setContainerWaterTemp] = useState(25);
  const [calorimetryData, setCalorimetryData] = useState<CalorimetryData | null>(null);
  const [atmosphericTemp, setAtmosphericTemp] = useState(25);
  const [pressure, setPressure] = useState(101.325);
  const [currentReactionTemp, setCurrentReactionTemp] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);

  const handleExperimentStep = useCallback((step: ExperimentStep) => {
    setExperimentSteps((prev) => [...prev, step]);
  }, []);

  const handleClearReport = useCallback(() => {
    setExperimentSteps([]);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
        <img src="/chemora-logo.png" alt="Chemora" className="w-5 h-5" />
        <h1 className="text-base font-semibold text-foreground tracking-tight">Chemora</h1>
        <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">Every Atom is Yours</span>
        
        {/* UI Mode Toggle */}
        {/* REMOVED: UI Mode toggle buttons removed per user request */}
        
        {/* Desktop Layout */}
        {!isMobile && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowTutorial(true)}
              className="flex items-center justify-center w-7 h-7 text-muted-foreground hover:text-primary transition-colors rounded-md border border-border hover:border-primary/30"
              title="How to use"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
            {selectedItem && (
              <button
                onClick={() => setSelectedItem(null)}
                className="flex items-center gap-1 text-[10px] font-medium text-destructive hover:text-destructive/80 transition-colors px-2 py-1 rounded border border-destructive/30 bg-destructive/5"
              >
                ✕ Deselect
              </button>
            )}
            <button
              onClick={() => setShowChemistryAI(true)}
              className="rounded-full border border-primary/20 bg-background/70 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-sm shadow-primary/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              title="Open Chemora AI"
            >
              Chemora AI
            </button>
            <button
              onClick={() => setShowReport(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-md border border-primary/30 hover:bg-primary/10"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Experiment Report</span>
              <span className="sm:hidden">Report</span>
              {experimentSteps.length > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {experimentSteps.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Mobile Layout - Simplified Header */}
        {isMobile && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowChemistryAI(true)}
              className="rounded-full border border-primary/20 bg-background/70 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-sm shadow-primary/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              title="Open Chemora AI"
            >
              AI
            </button>
            <button
              onClick={() => setShowReport(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-md border border-primary/30 hover:bg-primary/10 relative"
              title="Experiment Report"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Report</span>
              {experimentSteps.length > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {experimentSteps.length}
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
            {selectedItem.type === "chemical" ? "🧪" : "🔧"}{" "}
            {selectedItem.type === "chemical" ? selectedItem.data.name : selectedItem.data.name} selected
          </span>
          <span className="text-muted-foreground">— tap a container or the desk to place it</span>
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
          />
          <Suspense fallback={<LoadingFallback />}>
            <DesktopEquipmentArea
              onExperimentStep={handleExperimentStep}
              selectedItem={selectedItem}
              onItemPlaced={() => setSelectedItem(null)}
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
          />
        </Suspense>
      )}

      {/* Report modal */}
      {showReport && (
        <Suspense fallback={<LoadingFallback />}>
          <ExperimentReport
            steps={experimentSteps}
            calorimetryData={calorimetryData}
            onClose={() => setShowReport(false)}
            onClear={handleClearReport}
          />
        </Suspense>
      )}

      {/* Chemistry AI assistant */}
      {showChemistryAI && (
        <Suspense fallback={<LoadingFallback />}>
          <ChemistryAIAssistant onClose={() => setShowChemistryAI(false)} />
        </Suspense>
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
