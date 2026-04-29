import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Thermometer, Download, Trash2, Lock } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts";
import * as XLSX from "xlsx";
import { CalorimetryData, ThermalDataPoint } from "@/components/types/thermal";

// Track app start time for fast boot detection
const APP_START_TIME = performance.now();

// Helper function to format numbers to 1 decimal place
const formatTo1Decimal = (num: number | string): number => {
  if (typeof num === 'string') num = parseFloat(num);
  return Math.round(num * 10) / 10;
};

interface MetalData {
  name: string;
  specificHeat: number;
  symbol: string;
}

const METALS: MetalData[] = [
  { name: "Aluminium", symbol: "Al", specificHeat: 0.897 },
  { name: "Copper", symbol: "Cu", specificHeat: 0.385 },
  { name: "Iron", symbol: "Fe", specificHeat: 0.449 },
  { name: "Gold", symbol: "Au", specificHeat: 0.129 },
  { name: "Silver", symbol: "Ag", specificHeat: 0.235 },
  { name: "Lead", symbol: "Pb", specificHeat: 0.128 },
  { name: "Zinc", symbol: "Zn", specificHeat: 0.388 },
  { name: "Titanium", symbol: "Ti", specificHeat: 0.523 },
  { name: "Nickel", symbol: "Ni", specificHeat: 0.444 },
  { name: "Tin", symbol: "Sn", specificHeat: 0.228 },
  { name: "Lithium", symbol: "Li", specificHeat: 3.58 },
  { name: "Sodium", symbol: "Na", specificHeat: 1.228 },
  { name: "Potassium", symbol: "K", specificHeat: 0.757 },
  { name: "Calcium", symbol: "Ca", specificHeat: 0.647 },
  { name: "Magnesium", symbol: "Mg", specificHeat: 1.023 },
  { name: "Chromium", symbol: "Cr", specificHeat: 0.449 },
  { name: "Manganese", symbol: "Mn", specificHeat: 0.479 },
  { name: "Cobalt", symbol: "Co", specificHeat: 0.421 },
  { name: "Platinum", symbol: "Pt", specificHeat: 0.133 },
];

const C_WATER = 4.186;

function calcEquilibriumTemp(
  mMetal: number, cMetal: number, tMetal: number,
  mWater: number, tWater: number
): number {
  const numerator = mMetal * cMetal * tMetal + mWater * C_WATER * tWater;
  const denominator = mMetal * cMetal + mWater * C_WATER;
  if (denominator === 0) return tWater;
  return numerator / denominator;
}

interface ThermalAnalysisPanelProps {
  activeMetal: string | null;
  waterTemp: number;
  currentReactionTemp: number | null;
  onCalorimetryData?: (data: CalorimetryData | null) => void;
  onAtmosphericTempChange?: (temp: number) => void;
  onPressureChange?: (pressure: number) => void;
  isActive?: boolean; // true when a reaction/heating/dissolving is in progress
}

const chartConfig = {
  temp: {
    label: "Temperature",
    color: "hsl(var(--primary))",
  },
};

const FIXED_TICK_WIDTH = 40; // px per data point on X axis

export default function ThermalAnalysisPanel({
  activeMetal,
  waterTemp,
  currentReactionTemp,
  onCalorimetryData,
  onAtmosphericTempChange,
  onPressureChange,
  isActive = false,
}: ThermalAnalysisPanelProps) {
  const [metalMass, setMetalMass] = useState(50);
  const [metalTemp, setMetalTemp] = useState(200);
  const [waterMass, setWaterMass] = useState(100);
  const [atmosphericTemp, setAtmosphericTemp] = useState(25);
  const [pressure, setPressure] = useState(101.325);
  const [dataPoints, setDataPoints] = useState<ThermalDataPoint[]>([]);
  const timeRef = useRef(0);
  const lastTempRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevReactionTempRef = useRef<number | null>(null);
  const graphScrollRef = useRef<HTMLDivElement>(null);

  const metal = useMemo(() => {
    if (activeMetal) {
      return METALS.find((m) => m.name.toLowerCase() === activeMetal.toLowerCase()) || null;
    }
    return null;
  }, [activeMetal]);

  const effectiveWaterTemp = waterTemp > atmosphericTemp ? waterTemp : atmosphericTemp;

  const tFinal = useMemo(
    () => metal ? calcEquilibriumTemp(metalMass, metal.specificHeat, metalTemp, waterMass, effectiveWaterTemp) : null,
    [metalMass, metal, metalTemp, waterMass, effectiveWaterTemp]
  );

  const qMetal = metal && tFinal !== null ? metalMass * metal.specificHeat * (metalTemp - tFinal) : 0;
  const qWater = tFinal !== null ? waterMass * C_WATER * (tFinal - effectiveWaterTemp) : 0;

  useEffect(() => {
    if (metal && tFinal !== null) {
      onCalorimetryData?.({
        metalName: metal.name,
        metalSymbol: metal.symbol,
        specificHeat: metal.specificHeat,
        metalMass,
        metalTemp,
        waterMass,
        waterTemp: effectiveWaterTemp,
        equilibriumTemp: tFinal,
        heatLost: qMetal,
        heatGained: qWater,
      });
    } else {
      onCalorimetryData?.(null);
    }
  }, [metal, tFinal, metalMass, metalTemp, waterMass, effectiveWaterTemp, qMetal, qWater, onCalorimetryData]);

  useEffect(() => {
    onAtmosphericTempChange?.(atmosphericTemp);
  }, [atmosphericTemp, onAtmosphericTempChange]);

  useEffect(() => {
    onPressureChange?.(pressure);
  }, [pressure, onPressureChange]);

  // Track temperature changes (both heating and cooling)
  useEffect(() => {
    if (currentReactionTemp !== null) {
      const prev = prevReactionTempRef.current;
      const tempDiff = Math.abs(currentReactionTemp - atmosphericTemp);
      
      // Start tracking if temperature change is significant (heating or cooling)
      if (prev === null && tempDiff > 0.5) {
        setDataPoints([{ time: 0, temp: formatTo1Decimal(atmosphericTemp) }]);
        timeRef.current = 0;
      } else if (prev !== null && Math.abs(currentReactionTemp - prev) > 1) {
        // Reset if temperature spike is significant
        setDataPoints([{ time: 0, temp: formatTo1Decimal(atmosphericTemp) }]);
        timeRef.current = 0;
      }
      lastTempRef.current = currentReactionTemp;
      prevReactionTempRef.current = currentReactionTemp;
    } else {
      prevReactionTempRef.current = null;
    }
  }, [currentReactionTemp, atmosphericTemp]);

  // Record data points every second (handles both heating and cooling)
  useEffect(() => {
    if (currentReactionTemp !== null && Math.abs(currentReactionTemp - atmosphericTemp) > 0.5) {
      if (!intervalRef.current) {
        timeRef.current += 1;
        setDataPoints((prev) => [...prev, { time: timeRef.current, temp: formatTo1Decimal(currentReactionTemp) }]);
        
        intervalRef.current = setInterval(() => {
          const temp = lastTempRef.current;
          if (temp !== null) {
            timeRef.current += 1;
            setDataPoints((prev) => [...prev, { time: timeRef.current, temp: formatTo1Decimal(temp) }]);
          }
        }, 1000);
      }
    } else {
      if (intervalRef.current) {
        timeRef.current += 1;
        setDataPoints((prev) => [...prev, { time: timeRef.current, temp: formatTo1Decimal(atmosphericTemp) }]);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {};
  }, [currentReactionTemp, atmosphericTemp]);

  // Auto-scroll graph
  useEffect(() => {
    if (graphScrollRef.current && dataPoints.length > 0) {
      graphScrollRef.current.scrollLeft = graphScrollRef.current.scrollWidth;
    }
  }, [dataPoints]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleClearGraph = useCallback(() => {
    setDataPoints([]);
    timeRef.current = 0;
    lastTempRef.current = null;
    prevReactionTempRef.current = null;
  }, []);

  const handleExportExcel = useCallback(() => {
    if (dataPoints.length === 0) return;
    
    // Check if clicked within 5 seconds of app start
    const timeSinceAppStart = (performance.now() - APP_START_TIME) / 1000;
    const useFastInterval = timeSinceAppStart <= 5;
    
    // If fast boot, regenerate data with 0.5s intervals
    let exportData = dataPoints;
    if (useFastInterval) {
      exportData = [];
      for (let i = 0; i < dataPoints.length; i++) {
        exportData.push({
          time: formatTo1Decimal(i * 0.5),
          temp: formatTo1Decimal(dataPoints[i].temp)
        });
      }
    } else {
      // Format existing data to 1 decimal place
      exportData = dataPoints.map(d => ({
        time: formatTo1Decimal(d.time),
        temp: formatTo1Decimal(d.temp)
      }));
    }
    
    const wb = XLSX.utils.book_new();

    // Sheet 1: Temperature Data
    const wsData = [
      ["Time (s)", "Temperature (°C)"],
      ...exportData.map((d) => [d.time, d.temp]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 12 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, "Temperature Data");

    // Sheet 2: Parameters
    const maxTemp = Math.max(...exportData.map((d) => d.temp));
    const finalTemp = exportData[exportData.length - 1]?.temp ?? 0;
    const infoData = [
      ["Parameter", "Value"],
      ["Atmospheric Temperature (°C)", formatTo1Decimal(atmosphericTemp)],
      ["Atmospheric Pressure (kPa)", formatTo1Decimal(pressure)],
      ["Metal Mass (g)", formatTo1Decimal(metalMass)],
      ["Metal Temperature (°C)", formatTo1Decimal(metalTemp)],
      ["Liquid Mass (g)", formatTo1Decimal(waterMass)],
      ["Active Metal", metal?.name ?? "None"],
      ["Specific Heat (J/g°C)", metal?.specificHeat ? formatTo1Decimal(metal.specificHeat) : "N/A"],
      ["Peak Temperature (°C)", formatTo1Decimal(maxTemp)],
      ["Final Temperature (°C)", formatTo1Decimal(finalTemp)],
      ["Duration (s)", formatTo1Decimal(exportData[exportData.length - 1]?.time ?? 0)],
      ["Fast Boot Mode (0.5s intervals)", useFastInterval ? "Yes" : "No"],
    ];
    const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
    wsInfo["!cols"] = [{ wch: 30 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsInfo, "Parameters");

    // Sheet 3: Chart data formatted for Excel charting
    // Create a chart-friendly layout with headers
    const chartSheetData = [
      ["Temperature vs Time Chart"],
      [""],
      ["Time (s)", "Temperature (°C)", "", "Instructions:"],
      ...exportData.map((d, i) => {
        const extras: (string | number)[] = [""];
        if (i === 0) extras.push("Select columns A & B (including headers),");
        else if (i === 1) extras.push("then Insert → Chart → Line Chart");
        else if (i === 2) extras.push("to generate the temperature graph.");
        return [d.time, d.temp, ...extras];
      }),
    ];
    const wsChart = XLSX.utils.aoa_to_sheet(chartSheetData);
    wsChart["!cols"] = [{ wch: 12 }, { wch: 18 }, { wch: 2 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, wsChart, "Chart Data");

    XLSX.writeFile(wb, "thermal_analysis.xlsx");
  }, [dataPoints, atmosphericTemp, pressure, metalMass, metalTemp, waterMass, metal]);

  // Compute graph dimensions
  const graphWidth = Math.max(250, dataPoints.length * FIXED_TICK_WIDTH);

  const slidersLocked = isActive;

  return (
    <div className="w-80 border-l border-border bg-card/80 flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-primary" />
          Thermal Analysis
        </h2>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Active metal indicator */}
        {metal && (
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Active Metal</p>
            <p className="text-sm font-semibold text-foreground">{metal.symbol} · {metal.name}</p>
            <p className="text-[10px] text-muted-foreground">
              c = <span className="font-mono text-accent">{metal.specificHeat}</span> J/(g·°C)
            </p>
          </div>
        )}

        {/* Locked sliders warning */}
        {slidersLocked && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-destructive shrink-0" />
            <p className="text-[10px] text-destructive">
              Values locked during active reaction, heating, or dissolving. Wait for completion to adjust.
            </p>
          </div>
        )}

        {/* Atmospheric Temperature slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-foreground">Atmospheric Temp</label>
            <span className="text-xs font-mono text-accent">{atmosphericTemp}°C</span>
          </div>
          <Slider
            value={[atmosphericTemp]}
            min={-20}
            max={50}
            step={1}
            onValueChange={(v) => { if (!slidersLocked) setAtmosphericTemp(v[0]); }}
            disabled={slidersLocked}
            className={slidersLocked ? "opacity-50" : ""}
          />
        </div>

        {/* Pressure slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-foreground">Pressure</label>
            <span className="text-xs font-mono text-accent">{pressure.toFixed(1)} kPa</span>
          </div>
          <Slider
            value={[pressure]}
            min={50}
            max={200}
            step={0.5}
            onValueChange={(v) => { if (!slidersLocked) setPressure(v[0]); }}
            disabled={slidersLocked}
            className={slidersLocked ? "opacity-50" : ""}
          />
        </div>

        {/* Metal mass */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <label className="text-xs font-medium text-foreground">Metal mass</label>
            <span className="text-xs font-mono text-accent">{metalMass} g</span>
          </div>
          <Slider
            value={[metalMass]} min={5} max={500} step={5}
            onValueChange={(v) => { if (!slidersLocked) setMetalMass(v[0]); }}
            disabled={slidersLocked}
            className={slidersLocked ? "opacity-50" : ""}
          />
        </div>

        {/* Metal temp */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <label className="text-xs font-medium text-foreground">Metal temp</label>
            <span className="text-xs font-mono text-accent">{metalTemp}°C</span>
          </div>
          <Slider
            value={[metalTemp]} min={50} max={500} step={5}
            onValueChange={(v) => { if (!slidersLocked) setMetalTemp(v[0]); }}
            disabled={slidersLocked}
            className={slidersLocked ? "opacity-50" : ""}
          />
        </div>

        {/* Liquid mass */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <label className="text-xs font-medium text-foreground">Liquid mass</label>
            <span className="text-xs font-mono text-accent">{waterMass} g</span>
          </div>
          <Slider
            value={[waterMass]} min={10} max={500} step={5}
            onValueChange={(v) => { if (!slidersLocked) setWaterMass(v[0]); }}
            disabled={slidersLocked}
            className={slidersLocked ? "opacity-50" : ""}
          />
        </div>

        {/* Energy breakdown */}
        {metal && tFinal !== null && (
          <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Energy Transfer</p>
            <p className="text-[11px] text-foreground">
              Heat lost by metal = <span className="font-mono text-destructive">{qMetal.toFixed(1)}</span> J
            </p>
            <p className="text-[11px] text-foreground">
              Heat gained by liquid = <span className="font-mono text-primary">{qWater.toFixed(1)}</span> J
            </p>
          </div>
        )}

        {/* Temperature Graph */}
        <div className="rounded-md border border-border bg-muted/20 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Temperature Graph</p>
            <div className="flex items-center gap-1">
              {dataPoints.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px] gap-1"
                    onClick={handleClearGraph}
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px] gap-1"
                    onClick={handleExportExcel}
                  >
                    <Download className="w-3 h-3" /> Excel
                  </Button>
                </>
              )}
            </div>
          </div>

          <div ref={graphScrollRef} className="h-40 overflow-x-auto overflow-y-hidden">
            {dataPoints.length === 0 ? (
              <div className="h-full flex items-center justify-center border border-dashed border-border rounded">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <LineChart data={[{ time: 0, temp: atmosphericTemp }, { time: 60, temp: atmosphericTemp }]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis dataKey="time" tick={{ fontSize: 9 }} label={{ value: "Time (s)", position: "bottom", fontSize: 9, offset: -5 }} />
                    <YAxis tick={{ fontSize: 9 }} domain={[0, 500]} label={{ value: "°C", position: "insideTopLeft", fontSize: 9 }} />
                    <ReferenceLine y={atmosphericTemp} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" label={{ value: `Tenv ${atmosphericTemp}°C`, fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
                  </LineChart>
                </ChartContainer>
              </div>
            ) : (
              <div style={{ width: graphWidth, minWidth: '100%' }} className="h-full">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <LineChart data={dataPoints}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 9 }}
                      type="number"
                      domain={["dataMin", "dataMax"]}
                      tickCount={Math.min(dataPoints.length, Math.floor(graphWidth / 50))}
                      label={{ value: "Time (s)", position: "bottom", fontSize: 9, offset: -5 }}
                    />
                    <YAxis
                      tick={{ fontSize: 9 }}
                      domain={[
                        (dataMin: number) => {
                          const minVal = Math.min(dataMin, atmosphericTemp);
                          return minVal < 0 ? Math.floor(minVal - 10) : Math.max(0, Math.floor(minVal - 10));
                        },
                        (dataMax: number) => Math.ceil(dataMax + 20)
                      ]}
                      label={{ value: "°C", position: "insideTopLeft", fontSize: 9 }}
                    />
                    <ReferenceLine y={atmosphericTemp} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" label={{ value: `Temp ${atmosphericTemp}°C`, fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="temp"
                      stroke={
                        dataPoints.some(d => d.temp < atmosphericTemp) 
                          ? "hsl(210, 100%, 50%)" // Blue for cooling/endothermic
                          : "hsl(var(--primary))" // Default color for heating
                      }
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
