import { useEffect, useState } from "react";
import ChemicalPalette from "@/components/ChemicalPalette";
import EquipmentArea from "@/components/EquipmentArea";
import ThermalAnalysisPanel from "@/components/ThermalAnalysisPanel";
import SwipeHint from "@/components/SwipeHint";
import { useSwipe } from "@/hooks/use-swipe";
import type { SelectedItem } from "@/pages/Index";
import type { Chemical, Apparatus, ExperimentStep } from "@/lib/reactions";
import type { CalorimetryData } from "@/components/types/thermal";
import { Atom, Beaker, Thermometer, X } from "lucide-react";

interface MobileSwipeLayoutProps {
  onDragStart: (chemical: Chemical) => void;
  onApparatusDragStart: (apparatus: Apparatus) => void;
  selectedItem: SelectedItem;
  onSelect: (item: SelectedItem) => void;
  onExperimentStep: (step: ExperimentStep) => void;
  onMaterialsRemoved: (materialIds: string[]) => void;
  onDeskCleared: () => void;
  onItemPlaced: () => void;
  onMetalChange: (metal: string | null) => void;
  onWaterTempChange: (temp: number) => void;
  atmosphericTemp: number;
  pressure: number;
  onReactionTempChange: (temp: number | null) => void;
  onActiveChange: (active: boolean) => void;
  onCalorimetryData: (data: CalorimetryData | null) => void;
  onAtmosphericTempChange: (temp: number) => void;
  onPressureChange: (pressure: number) => void;
  activeMetal: string | null;
  waterTemp: number;
  currentReactionTemp: number | null;
  isActive: boolean;
  deskClearSignal: number;
  guideSearch?: string;
  guideTab?: "chemicals" | "apparatus";
  guideTargetId?: string;
  guideMessage?: string;
  guideComplete?: boolean;
}

export default function MobileSwipeLayout({
  onDragStart,
  onApparatusDragStart,
  selectedItem,
  onSelect,
  onExperimentStep,
  onMaterialsRemoved,
  onDeskCleared,
  onItemPlaced,
  onMetalChange,
  onWaterTempChange,
  atmosphericTemp,
  pressure,
  onReactionTempChange,
  onActiveChange,
  onCalorimetryData,
  onAtmosphericTempChange,
  onPressureChange,
  activeMetal,
  waterTemp,
  currentReactionTemp,
  isActive,
  deskClearSignal,
  guideSearch,
  guideTab,
  guideTargetId,
  guideMessage,
  guideComplete,
}: MobileSwipeLayoutProps) {
  useEffect(() => {
    window.requestAnimationFrame(() => window.__chemoraHideLoadingScreen?.());
  }, []);

  const [panelPosition, setPanelPosition] = useState(0); // -1: left, 0: center, 1: right
  const [showHint, setShowHint] = useState(true);
  const [hintStage, setHintStage] = useState(0); // 0: chemicals, 1: desk, 2: thermal, 3: desk
  const [hasTransferSource, setHasTransferSource] = useState(false);

  const finishSwipeHints = () => {
    setShowHint(false);
  };

  useSwipe(
    {
      onSwipeLeft: () => {
        const nextPosition = panelPosition === -1 ? 0 : panelPosition === 0 ? 1 : 1;
        setPanelPosition(nextPosition);

        if (panelPosition === -1 && nextPosition === 0 && hintStage === 1) {
          setHintStage(2);
        } else if (panelPosition === 0 && nextPosition === 1 && hintStage === 2) {
          setHintStage(3);
        }
      },
      onSwipeRight: () => {
        const nextPosition = panelPosition === 1 ? 0 : panelPosition === 0 ? -1 : -1;
        setPanelPosition(nextPosition);

        if (panelPosition === 0 && nextPosition === -1 && hintStage === 0) {
          setHintStage(1);
        } else if (panelPosition === 1 && nextPosition === 0 && hintStage === 3) {
          finishSwipeHints();
        }
      },
    },
    true
  );

  useEffect(() => {
    if (guideSearch && !guideComplete) {
      const timeout = window.setTimeout(() => {
        setPanelPosition(-1);
        finishSwipeHints();
      }, 180);
      return () => window.clearTimeout(timeout);
    }
  }, [guideComplete, guideSearch]);

  const handleDismissHint = () => {
    finishSwipeHints();
  };

  const handlePaletteSelect = (item: SelectedItem) => {
    onSelect(item);
    if (item) {
      setPanelPosition(0);
      finishSwipeHints();
    }
  };

  const selectedItemInstruction =
    selectedItem?.type === "apparatus" && selectedItem.data.id === "connecting-tube"
      ? hasTransferSource
        ? "- Select the container to put the chemicals/elements in"
        : "- Place it into the container to be transfered"
      : selectedItem?.type === "apparatus" && selectedItem.data.category === "container"
      ? "Place it on the Fusion Desk"
      : "- Drop it into or place it on the container";

  return (
    <div className="flex flex-1 overflow-hidden relative bg-background">
      {/* Left Panel - Chemicals */}
      <div
        className={`absolute bottom-14 left-0 top-0 z-30 w-80 max-w-[88vw] transition-all duration-500 ease-out overflow-y-auto shadow-2xl ${
          panelPosition === -1 ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="min-h-full w-80 max-w-full bg-background">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Chemicals & Tools</h2>
          </div>
          <ChemicalPalette
            onDragStart={(c) => {
              onDragStart(c);
            }}
            onApparatusDragStart={(a) => {
              onApparatusDragStart(a);
            }}
            selectedItem={selectedItem}
            onSelect={handlePaletteSelect}
            guideSearch={guideSearch}
            guideTab={guideTab}
            guideTargetId={guideTargetId}
            guideMessage={guideMessage}
            guideComplete={guideComplete}
          />
        </div>
      </div>

      {/* Center Panel - Workspace */}
      <div
        className={`absolute bottom-14 left-0 top-0 w-full z-10 transition-all duration-500 ease-out ${
          panelPosition === 1 ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        <div className="w-full h-full flex flex-col relative">
          {selectedItem && (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border-b border-primary/20 text-primary">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{selectedItem.data.name}</p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {selectedItemInstruction}
                </p>
              </div>
              <button
                onClick={() => {
                  onSelect(null);
                  setHasTransferSource(false);
                }}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-primary/25 text-primary hover:bg-primary/10"
                title="Deselect"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <EquipmentArea
            onExperimentStep={onExperimentStep}
            onMaterialsRemoved={onMaterialsRemoved}
            onDeskCleared={onDeskCleared}
            selectedItem={selectedItem}
            onItemPlaced={onItemPlaced}
            onTransferSourceChange={setHasTransferSource}
            onMetalChange={onMetalChange}
            onWaterTempChange={onWaterTempChange}
            atmosphericTemp={atmosphericTemp}
            pressure={pressure}
            onReactionTempChange={onReactionTempChange}
            onActiveChange={onActiveChange}
          />
        </div>
      </div>

      {/* Right Panel - Thermal Analysis */}
      <div
        className={`absolute bottom-14 left-0 top-0 w-full z-20 transition-all duration-500 ease-out overflow-hidden ${
          panelPosition === 1 ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full w-full bg-background">
          <ThermalAnalysisPanel
            activeMetal={activeMetal}
            waterTemp={waterTemp}
            currentReactionTemp={currentReactionTemp}
            onCalorimetryData={onCalorimetryData}
            onAtmosphericTempChange={onAtmosphericTempChange}
            onPressureChange={onPressureChange}
            isActive={isActive}
            deskClearSignal={deskClearSignal}
          />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-2 py-2 backdrop-blur-md">
        <div className="grid grid-cols-3 gap-1 rounded-md bg-background/60 p-1">
          {[
            { label: "Chemicals", icon: Atom, value: -1 },
            { label: "Desk", icon: Beaker, value: 0 },
            { label: "Thermal", icon: Thermometer, value: 1 },
          ].map(({ label, icon: Icon, value }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setPanelPosition(value);
                finishSwipeHints();
              }}
              className={`flex h-9 items-center justify-center gap-1.5 rounded text-[11px] font-semibold transition-colors ${
                panelPosition === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Swipe Hint Overlay */}
      <SwipeHint show={showHint} onDismiss={handleDismissHint} panelPosition={panelPosition} stage={hintStage} />
    </div>
  );
}
