import { useState, useEffect } from "react";
import {
  CalorimetryEngine,
  METAL_PROPERTIES,
  CalorimetryState,
} from "@/lib/calorimetryEngine";
import Thermometer from "./Thermometer";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const CalorimetryLab = () => {
  // Metal selection and properties
  const [selectedMetal, setSelectedMetal] =
    useState<string>("iron");
  const [metalMass, setMetalMass] = useState<number>(100); // grams
  const [metalInitialTemp, setMetalInitialTemp] = useState<number>(80); // °C

  // Water properties
  const [waterVolume, setWaterVolume] = useState<number>(200); // mL
  const [waterInitialTemp, setWaterInitialTemp] = useState<number>(20); // °C

  // State management - auto-calculate on any change
  const [state, setState] = useState<CalorimetryState | null>(null);
  const [animatingTemp, setAnimatingTemp] = useState<number>(waterInitialTemp);
  const [startTime, setStartTime] = useState<number | null>(null);

  const metalProps = METAL_PROPERTIES[selectedMetal];

  // Auto-calculate whenever any parameter changes
  useEffect(() => {
    try {
      const result = CalorimetryEngine.calculateEquilibriumTemperature(
        selectedMetal,
        metalMass,
        metalInitialTemp,
        waterVolume,
        waterInitialTemp
      );
      setState(result);
      setStartTime(null);
      setAnimatingTemp(waterInitialTemp);
    } catch (error) {
      console.error("Calculation error:", error);
    }
  }, [selectedMetal, metalMass, metalInitialTemp, waterVolume, waterInitialTemp]);

  // Animation effect for temperature reaching equilibrium
  useEffect(() => {
    if (!state) return;

    if (startTime === null) {
      setStartTime(Date.now());
      return;
    }

    const elapsed = Date.now() - startTime;
    const duration = 3000; // 3 seconds animation

    if (elapsed < duration) {
      // Smooth animation towards equilibrium temperature
      const progress = Math.min(elapsed / duration, 1);
      // Use easeInOutQuad for smooth acceleration/deceleration
      const easeProgress =
        progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;

      const newTemp =
        waterInitialTemp +
        (state.equilibriumTemp - waterInitialTemp) * easeProgress;
      setAnimatingTemp(Math.round(newTemp * 10) / 10);
    } else {
      setAnimatingTemp(state.equilibriumTemp);
    }
  }, [state, startTime, waterInitialTemp]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          🧪 Heat & Temperature
        </h1>
        <p className="text-muted-foreground">
          Watch what happens when hot metal meets cool water
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Center: Main Visualization */}
        <div className="lg:col-span-2 space-y-6">
          {/* Instructions */}
          <Alert className="bg-blue-500/10 border-blue-500/30">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-900 dark:text-blue-400">
              Adjust the sliders on the right to see how the final temperature changes. 
              The hotter object cools down, the cooler object heats up, and they meet in the middle!
            </AlertDescription>
          </Alert>

          {/* Main Containers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Metal Container */}
            <Card className="border-2 border-orange-500/30 shadow-lg">
              <CardHeader className="pb-3 bg-orange-500/5">
                <CardTitle className="text-lg">🔥 Hot Metal</CardTitle>
                <CardDescription>{metalProps?.name || "Metal"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {/* Metal visualization */}
                <div
                  className="w-full h-40 rounded-lg border-4 border-dashed flex flex-col items-center justify-center transition-all"
                  style={{
                    backgroundColor: metalProps
                      ? `${metalProps.color}25`
                      : "#00000010",
                    borderColor: metalProps?.color || "#666",
                  }}
                >
                  <div className="text-center">
                    <p className="text-4xl font-bold" style={{ color: metalProps?.color }}>
                      {metalInitialTemp}°C
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {metalMass}g of {metalProps?.name}
                    </p>
                  </div>
                </div>

                {/* Simple info */}
                <div className="bg-orange-500/10 rounded-lg p-3 text-sm">
                  <p className="text-muted-foreground">Heat Ability (c)</p>
                  <p className="font-semibold text-foreground">
                    {metalProps?.specificHeat} J/(g°C)
                  </p>
                </div>

                {state && (
                  <div className="bg-red-500/10 rounded-lg p-3 text-sm">
                    <p className="text-muted-foreground">Heat It Loses</p>
                    <p className="font-semibold text-red-600 dark:text-red-400">
                      {state.heatLostByMetal.toFixed(0)} Joules
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Water Container */}
            <Card className="border-2 border-blue-500/30 shadow-lg">
              <CardHeader className="pb-3 bg-blue-500/5">
                <CardTitle className="text-lg">💧 Cool Water</CardTitle>
                <CardDescription>Always 4.18 J/(g°C)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {/* Water visualization */}
                <div className="w-full h-40 rounded-lg border-4 border-dashed bg-blue-500/15 border-blue-500 flex flex-col items-center justify-center transition-all">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                      {waterInitialTemp}°C
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {waterVolume}mL of Water
                    </p>
                  </div>
                </div>

                {/* Simple info */}
                <div className="bg-blue-500/10 rounded-lg p-3 text-sm">
                  <p className="text-muted-foreground">Heat Ability (c)</p>
                  <p className="font-semibold text-foreground">4.18 J/(g°C)</p>
                </div>

                {state && (
                  <div className="bg-cyan-500/10 rounded-lg p-3 text-sm">
                    <p className="text-muted-foreground">Heat It Gains</p>
                    <p className="font-semibold text-cyan-600 dark:text-cyan-400">
                      {state.heatGainedByWater.toFixed(0)} Joules
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Results Display */}
          {state && (
            <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">✓ Final Temperature (Equilibrium)</CardTitle>
                <CardDescription>Where both will end up</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-6 text-center border border-green-500/30">
                  <p className="text-sm text-muted-foreground font-medium mb-2">BOTH WILL REACH</p>
                  <p className="text-5xl font-bold text-green-600 dark:text-green-400">
                    {state.equilibriumTemp.toFixed(1)}°C
                  </p>
                </div>

                {/* Detailed breakdown */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-background rounded-lg p-3 border border-border">
                    <p className="text-muted-foreground text-xs">Temperature Drop</p>
                    <p className="font-bold text-red-600 dark:text-red-400 text-lg">
                      {(metalInitialTemp - state.equilibriumTemp).toFixed(1)}°C
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Metal cools</p>
                  </div>

                  <div className="bg-background rounded-lg p-3 border border-border">
                    <p className="text-muted-foreground text-xs">Temperature Rise</p>
                    <p className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                      {(state.equilibriumTemp - waterInitialTemp).toFixed(1)}°C
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Water heats</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel: Simple Controls */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 border-2 border-primary/40 shadow-xl bg-gradient-to-br from-primary/5 to-background">
            <CardHeader className="pb-3 border-b border-primary/20">
              <CardTitle className="text-lg">⚙️ Your Setup</CardTitle>
              <CardDescription>Change things to see what happens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Metal Selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  What Metal? 🪨
                </label>
                <Select value={selectedMetal} onValueChange={setSelectedMetal}>
                  <SelectTrigger className="w-full bg-background border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(METAL_PROPERTIES).map(([key, metal]) => (
                      <SelectItem key={key} value={key}>
                        {metal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t border-border pt-4" />

              {/* Metal Mass Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-semibold text-foreground">
                    How Much Metal? ⚖️
                  </label>
                  <span className="text-base font-bold text-orange-600 dark:text-orange-400 bg-orange-500/20 px-3 py-1 rounded-full">
                    {metalMass}g
                  </span>
                </div>
                <Slider
                  value={[metalMass]}
                  onValueChange={(val) => setMetalMass(val[0])}
                  min={10}
                  max={500}
                  step={10}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">More metal = bigger temp change</p>
              </div>

              {/* Metal Temperature Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-semibold text-foreground">
                    How Hot Is It? 🔥
                  </label>
                  <span className="text-base font-bold text-red-600 dark:text-red-400 bg-red-500/20 px-3 py-1 rounded-full">
                    {metalInitialTemp}°C
                  </span>
                </div>
                <Slider
                  value={[metalInitialTemp]}
                  onValueChange={(val) => setMetalInitialTemp(val[0])}
                  min={40}
                  max={metalProps?.maxTemp || 100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Bigger difference = faster heat</p>
              </div>

              <div className="border-t border-border pt-4" />

              {/* Water Volume */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-semibold text-foreground">
                    How Much Water? 💧
                  </label>
                  <span className="text-base font-bold text-blue-600 dark:text-blue-400 bg-blue-500/20 px-3 py-1 rounded-full">
                    {waterVolume}mL
                  </span>
                </div>
                <Slider
                  value={[waterVolume]}
                  onValueChange={(val) => setWaterVolume(val[0])}
                  min={50}
                  max={500}
                  step={10}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">More water = smaller temp change</p>
              </div>

              {/* Water Temperature */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-semibold text-foreground">
                    How Cool Is It? 🌊
                  </label>
                  <span className="text-base font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/20 px-3 py-1 rounded-full">
                    {waterInitialTemp}°C
                  </span>
                </div>
                <Slider
                  value={[waterInitialTemp]}
                  onValueChange={(val) => setWaterInitialTemp(val[0])}
                  min={5}
                  max={35}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Usually room temperature</p>
              </div>

              {/* Info box */}
              <Alert className="bg-primary/10 border-primary/30 mt-4">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-xs">
                  Everything updates automatically! Just move the sliders.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Thermometer Display */}
          {state && (
            <div className="mt-6">
              <Thermometer
                currentTemp={animatingTemp}
                minTemp={
                  Math.min(state.metalInitialTemp, state.waterInitialTemp) -
                  10
                }
                maxTemp={
                  Math.max(state.metalInitialTemp, state.waterInitialTemp) +
                  10
                }
                label="Temperature Right Now"
                showRecordings
                initialMetalTemp={state.metalInitialTemp}
                initialWaterTemp={state.waterInitialTemp}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalorimetryLab;
