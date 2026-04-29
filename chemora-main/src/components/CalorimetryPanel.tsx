import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalorimetryEngine, METAL_PROPERTIES, type CalorimetryState } from "@/lib/calorimetryEngine";
import type { ContainerState } from "./EquipmentArea";

interface CalorimetryPanelProps {
  containers: ContainerState[];
  onCalorimetryUpdate?: (equilibriumTemp: number, containerId?: string) => void;
}

export const CalorimetryPanel = ({ containers, onCalorimetryUpdate }: CalorimetryPanelProps) => {
  const [selectedMetal, setSelectedMetal] = useState<string | null>(null);
  const [metalMass, setMetalMass] = useState<number>(50);
  const [metalTemp, setMetalTemp] = useState<number>(200);
  const [waterMass, setWaterMass] = useState<number>(100);
  const [waterTemp, setWaterTemp] = useState<number>(25);
  const [state, setState] = useState<CalorimetryState | null>(null);
  const [activeMetal, setActiveMetal] = useState<string | null>(null);
  const [metalElement, setMetalElement] = useState<string | null>(null);

  // Detect metal and water in containers
  useEffect(() => {
    console.log("Containers:", containers);
    
    for (const container of containers) {
      console.log("Container chemicals:", container.chemicals);
      
      // Find metal
      const metalChemical = container.chemicals.find((c) => c.category === "metal");
      // Find water
      const waterChemical = container.chemicals.find((c) => c.formula === "H₂O" || c.id === "water");

      console.log("Metal:", metalChemical, "Water:", waterChemical);

      if (metalChemical && waterChemical) {
        setActiveMetal(metalChemical.name);
        setMetalElement(metalChemical.formula);
        
        // Map element symbol to our metal database
        const elementSymbol = metalChemical.formula;
        const metalMap: Record<string, string> = {
          Na: "iron", // Use approximate specific heat
          K: "iron",
          Li: "iron",
          Fe: "iron",
          Cu: "copper",
          Al: "aluminum",
          Zn: "zinc",
          Pb: "lead",
          Mg: "iron",
          Ca: "iron",
          Be: "iron",
          Rb: "iron",
        };

        const metalKey = metalMap[elementSymbol] || "iron";
        setSelectedMetal(metalKey);
        return;
      }
    }

    setActiveMetal(null);
    setSelectedMetal(null);
    setMetalElement(null);
  }, [containers]);

  // Auto-calculate equilibrium whenever parameters change
  useEffect(() => {
    if (!selectedMetal) {
      setState(null);
      return;
    }

    try {
      const result = CalorimetryEngine.calculateEquilibriumTemperature(
        selectedMetal,
        metalMass,
        metalTemp,
        waterMass,
        waterTemp
      );
      setState(result);
      onCalorimetryUpdate?.(result.equilibriumTemp);
    } catch (error) {
      console.error("Calorimetry calculation error:", error);
      setState(null);
    }
  }, [selectedMetal, metalMass, metalTemp, waterMass, waterTemp, onCalorimetryUpdate]);

  const metalProps = selectedMetal ? METAL_PROPERTIES[selectedMetal] : null;

  if (!activeMetal || !selectedMetal) {
    return (
      <Card className="border-primary/30 bg-background/50">
        <CardHeader>
          <CardTitle className="text-base">CALORIMETRY</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">NO METAL SELECTED</p>
          <p className="text-xs text-muted-foreground mt-2">
            Add a metal to a container on the Fusion Desk
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-cyan-500/40 bg-gradient-to-br from-cyan-500/5 to-background">
      <CardHeader className="pb-3 border-b border-cyan-500/20">
        <CardTitle className="text-base">CALORIMETRY</CardTitle>
        {activeMetal && metalProps && (
          <CardDescription className="text-xs mt-2 text-cyan-600 dark:text-cyan-400">
            ACTIVE METAL: {activeMetal}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-5 pt-4">
        {/* Metal Info Box */}
        {metalProps && (
          <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-lg p-3 border border-orange-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-orange-900 dark:text-orange-200">
                {activeMetal}
              </span>
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                c = {metalProps.specificHeat} J/(g°C)
              </span>
            </div>
          </div>
        )}

        {/* Metal Mass Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <label className="text-sm font-semibold text-foreground">Metal mass</label>
            <span className="text-sm font-bold text-primary">{metalMass} g</span>
          </div>
          <Slider
            value={[metalMass]}
            onValueChange={(val) => setMetalMass(val[0])}
            min={10}
            max={500}
            step={10}
            className="w-full"
          />
        </div>

        {/* Metal Temp Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <label className="text-sm font-semibold text-foreground">Metal temp</label>
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
              {metalTemp}°C
            </span>
          </div>
          <Slider
            value={[metalTemp]}
            onValueChange={(val) => setMetalTemp(val[0])}
            min={40}
            max={metalProps?.maxTemp || 1000}
            step={5}
            className="w-full"
          />
        </div>

        <div className="border-t border-border" />

        {/* Water Mass Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <label className="text-sm font-semibold text-foreground">Water mass</label>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {waterMass} g
            </span>
          </div>
          <Slider
            value={[waterMass]}
            onValueChange={(val) => setWaterMass(val[0])}
            min={10}
            max={500}
            step={10}
            className="w-full"
          />
        </div>

        {/* Water Temp Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <label className="text-sm font-semibold text-foreground">Water temp</label>
            <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">
              {waterTemp}°C
            </span>
          </div>
          <Slider
            value={[waterTemp]}
            onValueChange={(val) => setWaterTemp(val[0])}
            min={5}
            max={50}
            step={1}
            className="w-full"
          />
        </div>

        <div className="border-t border-border pt-2" />

        {/* Constants Section */}
        <div className="space-y-1 text-xs">
          <p className="font-semibold text-foreground">CONSTANTS</p>
          <div className="text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Water</span>
              <span className="font-mono">= 4.186 J/(g°C)</span>
            </div>
            {metalProps && (
              <div className="flex justify-between">
                <span>{activeMetal}</span>
                <span className="font-mono">= {metalProps.specificHeat} J/(g°C)</span>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {state && (
          <>
            <Alert className="bg-green-500/10 border-green-500/30 py-2">
              <Info className="h-3 w-3 text-green-600" />
              <AlertDescription className="text-xs text-green-700 dark:text-green-400">
                Final temperature: <span className="font-bold">{state.equilibriumTemp.toFixed(1)}°C</span>
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CalorimetryPanel;
