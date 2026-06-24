import { ThermalDataPoint } from "@/components/types/thermal";

export const C_WATER = 4.186;
export const STANDARD_WATER_MASS = 100;
export const K_COOLING_BASE = 0.03;
export const MIN_EXPORT_POINTS = 10;
export const RECORD_INTERVAL_SEC = 0.5;

export function formatThermalTemp(num: number): number {
  return Math.round(num * 10) / 10;
}

export function scaleDeltaTForMass(deltaT: number, waterMass: number): number {
  if (waterMass <= 0) return deltaT;
  return deltaT * (STANDARD_WATER_MASS / waterMass);
}

export function calculateReactionPeakTemp(
  baseTemp: number,
  reaction: { isExothermic?: boolean; temperatureChange?: number; intensity?: number },
  waterMass: number = STANDARD_WATER_MASS
): number {
  let deltaT = reaction.temperatureChange ?? 0;
  deltaT = scaleDeltaTForMass(deltaT, waterMass);
  const intensity = reaction.intensity ?? 5;
  deltaT *= 0.5 + intensity / 10;
  return formatThermalTemp(Math.max(-50, baseTemp + deltaT));
}

export function newtonCoolingTemp(
  initialTemp: number,
  envTemp: number,
  timeSec: number,
  k: number = K_COOLING_BASE,
  pressureKpa: number = 101.325
): number {
  const kEff = k * (pressureKpa / 101.325);
  return formatThermalTemp(envTemp + (initialTemp - envTemp) * Math.exp(-kEff * timeSec));
}

export function newtonCoolingStep(
  currentTemp: number,
  envTemp: number,
  dtSec: number,
  k: number = K_COOLING_BASE,
  pressureKpa: number = 101.325,
  forcedConvectionMultiplier: number = 1
): number {
  const kEff = k * (pressureKpa / 101.325) * forcedConvectionMultiplier;
  return formatThermalTemp(envTemp + (currentTemp - envTemp) * Math.exp(-kEff * dtSec));
}

export function generateReactionThermalCurve(
  startTemp: number,
  peakTemp: number,
  envTemp: number,
  options: {
    totalDuration?: number;
    minPoints?: number;
    k?: number;
    pressureKpa?: number;
    approachFraction?: number;
  } = {}
): ThermalDataPoint[] {
  const {
    totalDuration = 30,
    minPoints = MIN_EXPORT_POINTS,
    k = K_COOLING_BASE,
    pressureKpa = 101.325,
    approachFraction = 0.15,
  } = options;

  const numPoints = Math.max(minPoints, MIN_EXPORT_POINTS);
  const approachTime = totalDuration * approachFraction;
  const points: ThermalDataPoint[] = [];

  for (let i = 0; i < numPoints; i++) {
    const t = (i / (numPoints - 1)) * totalDuration;
    let temp: number;
    if (t <= approachTime) {
      const progress = t / Math.max(approachTime, 0.01);
      const frac = 1 - Math.exp(-5 * progress);
      temp = startTemp + (peakTemp - startTemp) * frac;
    } else {
      temp = newtonCoolingTemp(peakTemp, envTemp, t - approachTime, k, pressureKpa);
    }
    points.push({ time: formatThermalTemp(t), temp: formatThermalTemp(temp) });
  }
  return points;
}

export function resampleThermalData(
  data: ThermalDataPoint[],
  minPoints: number = MIN_EXPORT_POINTS
): ThermalDataPoint[] {
  if (data.length === 0) return [];
  const formatted = data.map((d) => ({
    time: formatThermalTemp(d.time),
    temp: formatThermalTemp(d.temp),
  }));
  if (formatted.length >= minPoints) return formatted;

  const startTime = formatted[0].time;
  const duration = Math.max(formatted[formatted.length - 1].time - startTime, minPoints - 1);
  const result: ThermalDataPoint[] = [];

  for (let i = 0; i < minPoints; i++) {
    const t = startTime + (i / (minPoints - 1)) * duration;
    let temp = formatted[formatted.length - 1].temp;
    if (t <= formatted[0].time) {
      temp = formatted[0].temp;
    } else {
      for (let j = 0; j < formatted.length - 1; j++) {
        const t0 = formatted[j].time;
        const t1 = formatted[j + 1].time;
        if (t >= t0 && t <= t1) {
          const frac = (t - t0) / Math.max(t1 - t0, 1e-6);
          temp = formatted[j].temp + frac * (formatted[j + 1].temp - formatted[j].temp);
          break;
        }
      }
    }
    result.push({ time: formatThermalTemp(t), temp: formatThermalTemp(temp) });
  }
  return result;
}

export function prepareExportThermalData(
  recorded: ThermalDataPoint[],
  envTemp: number,
  minPoints: number = MIN_EXPORT_POINTS,
  pressureKpa: number = 101.325
): ThermalDataPoint[] {
  const formatted = recorded.map((d) => ({
    time: formatThermalTemp(d.time),
    temp: formatThermalTemp(d.temp),
  }));

  if (formatted.length >= minPoints) {
    const uniqueTemps = new Set(formatted.map((d) => d.temp));
    if (uniqueTemps.size >= minPoints) return formatted;
  }

  if (formatted.length >= 2) {
    const resampled = resampleThermalData(formatted, minPoints);
    if (new Set(resampled.map((d) => d.temp)).size >= Math.min(minPoints, 5)) return resampled;
  }

  const startTemp = formatted.length > 0 ? formatted[0].temp : envTemp;
  const peakTemp =
    formatted.length > 0
      ? formatted.reduce(
          (extreme, d) =>
            Math.abs(d.temp - envTemp) > Math.abs(extreme - envTemp) ? d.temp : extreme,
          formatted[0].temp
        )
      : envTemp;

  const duration =
    formatted.length > 1 ? Math.max(formatted[formatted.length - 1].time, minPoints - 1) : 30;

  return generateReactionThermalCurve(startTemp, peakTemp, envTemp, {
    totalDuration: duration,
    minPoints,
    pressureKpa,
  });
}

export function buildDisplayThermalCurve(
  recorded: ThermalDataPoint[],
  envTemp: number,
  minPoints: number = MIN_EXPORT_POINTS,
  pressureKpa: number = 101.325
): ThermalDataPoint[] {
  if (recorded.length === 0) return [];
  if (recorded.length >= minPoints) return recorded;
  return prepareExportThermalData(recorded, envTemp, minPoints, pressureKpa);
}
