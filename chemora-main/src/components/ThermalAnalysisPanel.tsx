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
import { CalorimetryData, ThermalDataPoint } from "@/components/types/thermal";
import {
  C_WATER,
  formatThermalTemp,
  prepareExportThermalData,
  RECORD_INTERVAL_SEC,
} from "@/lib/thermalCurve";
import { exportThermalExcel } from "@/lib/excelThermalExport";

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

function calcEquilibriumTemp(
  mMetal: number, cMetal: number, tMetal: number,
  mWater: number, tWater: number
): number {
  const numerator = mMetal * cMetal * tMetal + mWater * C_WATER * tWater;
  const denominator = mMetal * cMetal + mWater * C_WATER;
  if (denominator === 0) return tWater;
  return formatThermalTemp(numerator / denominator);
}

interface ThermalAnalysisPanelProps {
  activeMetal: string | null;
  waterTemp: number;
  currentReactionTemp: number | null;
  onCalorimetryData?: (data: CalorimetryData | null) => void;
  onAtmosphericTempChange?: (temp: number) => void;
  onPressureChange?: (pressure: number) => void;
  isActive?: boolean;
}

const chartConfig = {
  temp: { label: "Temperature", color: "hsl(var(--primary))" },
};

const FIXED_TICK_WIDTH = 70;
const RECORD_INTERVAL_MS = RECORD_INTERVAL_SEC * 1000;

function formatAxisNumber(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function formatSignedTemp(value: number): string {
  const rounded = formatThermalTemp(value);
  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(1)}°C`;
}

function formatJoules(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1000) return `${(value / 1000).toFixed(2)} kJ`;
  return `${value.toFixed(1)} J`;
}

function buildTimeTicks(maxTime: number): number[] {
  const end = Math.max(0, formatThermalTemp(maxTime));
  if (end === 0) return [0];
  const step = end < 5 ? 0.5 : 1;
  const ticks: number[] = [];
  for (let t = 0; t <= end + 1e-9; t += step) {
    ticks.push(formatThermalTemp(t));
  }
  if (ticks[ticks.length - 1] !== end) ticks.push(end);
  return Array.from(new Set(ticks));
}

function buildTemperatureTicks(minTemp: number, maxTemp: number): number[] {
  const start = Math.floor(minTemp / 50) * 50;
  const end = Math.ceil(maxTemp / 50) * 50;
  const ticks: number[] = [];
  for (let temp = start; temp <= end; temp += 50) ticks.push(temp);
  return ticks.length > 0 ? ticks : [0, 50];
}

function makeExportFilename(value: string, fallback: string, extension: "xlsx"): string {
  const trimmed = value.trim();
  const safeBase = (trimmed || fallback)
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "")
    .slice(0, 80);
  const filename = safeBase || fallback;
  return filename.toLowerCase().endsWith(`.${extension}`) ? filename : `${filename}.${extension}`;
}

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
  const [exporting, setExporting] = useState(false);
  const [excelFileName, setExcelFileName] = useState("thermal_analysis");
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

  const displayData = dataPoints;

  const isCoolingCurve = displayData.some((d) => d.temp < atmosphericTemp);

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

  useEffect(() => { onAtmosphericTempChange?.(atmosphericTemp); }, [atmosphericTemp, onAtmosphericTempChange]);
  useEffect(() => { onPressureChange?.(pressure); }, [pressure, onPressureChange]);

  useEffect(() => {
    if (currentReactionTemp !== null) {
      const prev = prevReactionTempRef.current;
      const tempDiff = Math.abs(currentReactionTemp - atmosphericTemp);
      if (prev === null && tempDiff > 0.5) {
        setDataPoints([{ time: 0, temp: formatThermalTemp(atmosphericTemp) }]);
        timeRef.current = 0;
      }
      lastTempRef.current = currentReactionTemp;
      prevReactionTempRef.current = currentReactionTemp;
    } else {
      prevReactionTempRef.current = null;
    }
  }, [currentReactionTemp, atmosphericTemp]);

  useEffect(() => {
    if (currentReactionTemp !== null && Math.abs(currentReactionTemp - atmosphericTemp) > 0.5) {
      if (!intervalRef.current) {
        timeRef.current += RECORD_INTERVAL_SEC;
        setDataPoints((prev) => [...prev, { time: timeRef.current, temp: formatThermalTemp(currentReactionTemp) }]);
        intervalRef.current = setInterval(() => {
          const temp = lastTempRef.current;
          if (temp !== null) {
            timeRef.current += RECORD_INTERVAL_SEC;
            setDataPoints((prev) => [...prev, { time: timeRef.current, temp: formatThermalTemp(temp) }]);
          }
        }, RECORD_INTERVAL_MS);
      }
    } else if (intervalRef.current) {
      timeRef.current += RECORD_INTERVAL_SEC;
      setDataPoints((prev) => [...prev, { time: timeRef.current, temp: formatThermalTemp(atmosphericTemp) }]);
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      lastTempRef.current = null;
    } else if (
      currentReactionTemp === null &&
      lastTempRef.current !== null &&
      Math.abs(lastTempRef.current - atmosphericTemp) > 0.5
    ) {
      timeRef.current += RECORD_INTERVAL_SEC;
      setDataPoints((prev) => [...prev, { time: timeRef.current, temp: formatThermalTemp(atmosphericTemp) }]);
      lastTempRef.current = null;
    }
    return () => {};
  }, [currentReactionTemp, atmosphericTemp]);

  useEffect(() => {
    if (graphScrollRef.current && displayData.length > 0) {
      graphScrollRef.current.scrollLeft = graphScrollRef.current.scrollWidth;
    }
  }, [displayData]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const handleClearGraph = useCallback(() => {
    setDataPoints([]);
    timeRef.current = 0;
    lastTempRef.current = null;
    prevReactionTempRef.current = null;
  }, []);

  const handleExportExcel = useCallback(async () => {
    if (dataPoints.length === 0 || exporting) return;
    setExporting(true);
    try {
      const exportData = prepareExportThermalData(
        dataPoints,
        atmosphericTemp,
        pressure
      );
      await exportThermalExcel(exportData, {
        atmosphericTemp,
        pressure,
        metalMass,
        metalTemp,
        waterMass,
        metalName: metal?.name,
        specificHeat: metal?.specificHeat,
      }, makeExportFilename(excelFileName, "thermal_analysis", "xlsx"));
    } finally {
      setExporting(false);
    }
  }, [dataPoints, atmosphericTemp, pressure, metalMass, metalTemp, waterMass, metal, exporting, excelFileName]);

  const finalTime = displayData[displayData.length - 1]?.time ?? 0;
  const xTicks = buildTimeTicks(finalTime);
  const graphWidth = Math.max(360, xTicks.length * FIXED_TICK_WIDTH);
  const yMin = Math.min(...displayData.map((d) => d.temp), atmosphericTemp);
  const yMax = Math.max(...displayData.map((d) => d.temp), atmosphericTemp);
  const yTicks = buildTemperatureTicks(yMin, yMax);
  const yDomain: [number, number] = [yTicks[0], yTicks[yTicks.length - 1]];
  const slidersLocked = isActive;

  return (
    <div className="w-full md:w-80 border-l border-border bg-card/80 flex h-full min-h-0 flex-col overflow-hidden">
      <div className="sticky top-0 z-20 shrink-0 px-4 py-3 border-b border-border bg-card/95 backdrop-blur-sm">
        <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-primary" />
          Thermal Analysis
        </h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-scroll px-4 py-4 space-y-4 [scrollbar-gutter:stable]">
        {metal && (
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Active Metal</p>
            <p className="text-sm font-semibold text-foreground">{metal.symbol} · {metal.name}</p>
            <p className="text-[10px] text-muted-foreground">
              c = <span className="font-mono text-accent">{metal.specificHeat}</span> J/(g·°C)
            </p>
          </div>
        )}

        {slidersLocked && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-destructive shrink-0" />
            <p className="text-[10px] text-destructive">
              Values locked during active reaction, heating, or dissolving. Wait for completion to adjust.
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-foreground">Atmospheric Temp</label>
            <span className="text-xs font-mono text-accent">{atmosphericTemp}°C</span>
          </div>
          <Slider value={[atmosphericTemp]} min={-20} max={50} step={1}
            onValueChange={(v) => { if (!slidersLocked) setAtmosphericTemp(v[0]); }}
            disabled={slidersLocked} className={slidersLocked ? "opacity-50" : ""} />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-foreground">Pressure</label>
            <span className="text-xs font-mono text-accent">{pressure.toFixed(1)} kPa</span>
          </div>
          <Slider value={[pressure]} min={50} max={200} step={0.5}
            onValueChange={(v) => { if (!slidersLocked) setPressure(v[0]); }}
            disabled={slidersLocked} className={slidersLocked ? "opacity-50" : ""} />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between">
            <label className="text-xs font-medium text-foreground">Metal mass</label>
            <span className="text-xs font-mono text-accent">{metalMass} g</span>
          </div>
          <Slider value={[metalMass]} min={5} max={500} step={5}
            onValueChange={(v) => { if (!slidersLocked) setMetalMass(v[0]); }}
            disabled={slidersLocked} className={slidersLocked ? "opacity-50" : ""} />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between">
            <label className="text-xs font-medium text-foreground">Metal temp</label>
            <span className="text-xs font-mono text-accent">{metalTemp}°C</span>
          </div>
          <Slider value={[metalTemp]} min={50} max={500} step={5}
            onValueChange={(v) => { if (!slidersLocked) setMetalTemp(v[0]); }}
            disabled={slidersLocked} className={slidersLocked ? "opacity-50" : ""} />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between">
            <label className="text-xs font-medium text-foreground">Liquid mass</label>
            <span className="text-xs font-mono text-accent">{waterMass} g</span>
          </div>
          <Slider value={[waterMass]} min={10} max={500} step={5}
            onValueChange={(v) => { if (!slidersLocked) setWaterMass(v[0]); }}
            disabled={slidersLocked} className={slidersLocked ? "opacity-50" : ""} />
        </div>

        {false && metal && tFinal !== null && (
          <div className="rounded-md border border-border bg-muted/25 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Calorimetry Result</p>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                q lost ≈ q gained
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border border-primary/20 bg-background/55 p-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Final temp</p>
                <p className="font-mono text-lg font-semibold text-primary">{tFinal.toFixed(1)}°C</p>
              </div>
              <div className="rounded-md border border-border bg-background/55 p-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Water rise</p>
                <p className="font-mono text-lg font-semibold text-accent">{formatSignedTemp(tFinal - effectiveWaterTemp)}</p>
              </div>
              <div className="rounded-md border border-destructive/20 bg-background/55 p-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Metal loses</p>
                <p className="font-mono text-sm font-semibold text-destructive">{formatJoules(qMetal)}</p>
              </div>
              <div className="rounded-md border border-primary/20 bg-background/55 p-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Liquid gains</p>
                <p className="font-mono text-sm font-semibold text-primary">{formatJoules(qWater)}</p>
              </div>
            </div>

            <div className="rounded-md border border-border/70 bg-background/50 p-2 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Real-world formula</p>
              <p className="font-mono text-[11px] leading-5 text-foreground">q = m c ΔT</p>
              <p className="font-mono text-[11px] leading-5 text-foreground">
                T<sub>eq</sub> = (m<sub>m</sub>c<sub>m</sub>T<sub>m</sub> + m<sub>w</sub>c<sub>w</sub>T<sub>w</sub>) / (m<sub>m</sub>c<sub>m</sub> + m<sub>w</sub>c<sub>w</sub>)
              </p>
              <p className="text-[10px] leading-5 text-muted-foreground">
                Using c<sub>water</sub> = {C_WATER} J/(g·°C), {metal.name} c = {metal.specificHeat} J/(g·°C). Energy balance error: <span className="font-mono text-foreground">{formatJoules(energyBalanceError)}</span>.
              </p>
            </div>
          </div>
        )}

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

        <div className="rounded-md border border-border bg-muted/20 p-3 space-y-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Temperature Graph</p>
              {dataPoints.length > 0 && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1" onClick={handleClearGraph}>
                  <Trash2 className="w-3 h-3" /> Clear
                </Button>
              )}
            </div>
            {dataPoints.length > 0 && (
              <div className="flex items-center gap-1">
                <input
                  value={excelFileName}
                  onChange={(event) => setExcelFileName(event.target.value)}
                  className="h-6 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-[10px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                  placeholder="Excel file name"
                  title="Excel file name"
                />
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] gap-1"
                  onClick={handleExportExcel} disabled={exporting}>
                  <Download className="w-3 h-3" /> {exporting ? "..." : "Excel"}
                </Button>
              </div>
            )}
          </div>

          {false && <div className="grid grid-cols-4 gap-1.5">
            {[
              ["Now", `${latestTemp.toFixed(1)}°C`, "text-primary"],
              ["Peak", `${peakTemp.toFixed(1)}°C`, "text-accent"],
              ["Low", `${lowestTemp.toFixed(1)}°C`, "text-foreground"],
              ["Δ env", formatSignedTemp(deltaFromAmbient), deltaFromAmbient >= 0 ? "text-primary" : "text-blue-400"],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-md border border-border bg-background/55 px-2 py-1.5">
                <p className="text-[8px] uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className={`font-mono text-[11px] font-semibold ${color}`}>{value}</p>
              </div>
            ))}
          </div>}

          <div className="grid h-44 grid-cols-[2.75rem_minmax(0,1fr)] gap-1">
            <div className="h-full overflow-hidden rounded border border-border bg-background/35">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <LineChart data={[{ time: 0, temp: yDomain[0] }, { time: 1, temp: yDomain[1] }]} margin={{ top: 12, right: 0, left: 0, bottom: 2 }}>
                  <XAxis hide dataKey="time" />
                  <YAxis
                    tick={{ fontSize: 9 }}
                    domain={yDomain}
                    ticks={yTicks}
                    tickFormatter={(value) => `${Math.round(Number(value))}`}
                    width={40}
                    label={{ value: "Â°C", position: "insideTopLeft", fontSize: 9 }}
                  />
                </LineChart>
              </ChartContainer>
            </div>
            <div ref={graphScrollRef} className="h-full min-w-0 overflow-x-scroll overflow-y-hidden [scrollbar-gutter:stable]">
            {dataPoints.length === 0 ? (
              <div className="h-full flex items-center justify-center border border-dashed border-border rounded">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <LineChart data={[{ time: 0, temp: atmosphericTemp }, { time: 60, temp: atmosphericTemp }]} margin={{ top: 12, right: 10, left: 0, bottom: 2 }}>
                    <CartesianGrid strokeDasharray="4 4" className="stroke-border/35" />
                    <XAxis dataKey="time" tick={{ fontSize: 9 }} label={{ value: "Time (s)", position: "bottom", fontSize: 9, offset: -5 }} />
                    <YAxis hide domain={yDomain} ticks={yTicks}
                      label={{ value: "°C", position: "insideTopLeft", fontSize: 9 }} />
                    <ReferenceLine y={atmosphericTemp} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5"
                      label={{ value: `Tenv ${atmosphericTemp}°C`, fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
                  </LineChart>
                </ChartContainer>
              </div>
            ) : (
              <div style={{ width: graphWidth, minWidth: "100%" }} className="h-full">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <LineChart data={displayData} margin={{ top: 12, right: 10, left: 0, bottom: 2 }}>
                    <CartesianGrid strokeDasharray="4 4" className="stroke-border/35" />
                    <XAxis dataKey="time" tick={{ fontSize: 9 }} type="number"
                      domain={[0, Math.max(finalTime, 0.5)]}
                      ticks={xTicks}
                      tickFormatter={formatAxisNumber}
                      label={{ value: "Time (s)", position: "bottom", fontSize: 9, offset: -5 }} />
                    <YAxis hide
                      domain={yDomain}
                      ticks={yTicks}
                      tickFormatter={(value) => `${Math.round(Number(value))}`}
                      label={{ value: "°C", position: "insideTopLeft", fontSize: 9 }} />
                    <ReferenceLine y={atmosphericTemp} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5"
                      label={{ value: `${atmosphericTemp}°C`, fontSize: 8, fill: "hsl(var(--muted-foreground))" }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="temp"
                      stroke={isCoolingCurve ? "hsl(210, 100%, 50%)" : "hsl(var(--primary))"}
                      strokeWidth={3} dot={{ r: 2.5, strokeWidth: 0 }}
                      activeDot={{ r: 4 }} isAnimationActive={false} />
                  </LineChart>
                </ChartContainer>
              </div>
            )}
          </div>
            <div className="hidden">
              <div>
                <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">Temp</p>
                <p className="text-[8px] text-muted-foreground">°C</p>
              </div>
              {yTicks.slice().reverse().map((tick) => (
                <div key={tick} className="flex items-center justify-between gap-1">
                  <span className="h-px w-2 bg-border" />
                  <span className="font-mono text-[10px] text-foreground">{formatAxisNumber(tick)}</span>
                </div>
              ))}
              <div className="rounded border border-muted-foreground/20 bg-muted/30 px-1 py-0.5 text-center font-mono text-[9px] text-muted-foreground">
                env {atmosphericTemp}°
              </div>
            </div>
          </div>
          {dataPoints.length > 0 && (
            <p className="text-[9px] text-muted-foreground text-center">
              Newton cooling: T(t) = Tenv + (Tpeak - Tenv)e^(-kt)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
