// Thermal analysis types extracted to avoid circular imports

export interface CalorimetryData {
  metalName: string;
  metalSymbol: string;
  specificHeat: number;
  metalMass: number;
  metalTemp: number;
  waterMass: number;
  waterTemp: number;
  equilibriumTemp: number;
  heatLost: number;
  heatGained: number;
}

export interface ThermalDataPoint {
  time: number;
  temp: number;
}
