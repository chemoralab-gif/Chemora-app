import ExcelJS from "exceljs";
import { ThermalDataPoint } from "@/components/types/thermal";
import { formatThermalTemp } from "./thermalCurve";

export interface ThermalExportMeta {
  atmosphericTemp: number;
  pressure: number;
  metalMass: number;
  metalTemp: number;
  waterMass: number;
  metalName?: string;
  specificHeat?: number;
}

interface ChartRenderOptions {
  width?: number;
  height?: number;
  envTemp: number;
  isCooling?: boolean;
}

/** Render a line chart to PNG bytes using Canvas API */
export function renderThermalLineChartPng(
  data: ThermalDataPoint[],
  options: ChartRenderOptions
): Uint8Array {
  const width = options.width ?? 720;
  const height = options.height ?? 400;
  const padding = { top: 48, right: 32, bottom: 56, left: 64 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const temps = data.map((d) => d.temp);
  const times = data.map((d) => d.time);
  const minT = Math.min(...temps, options.envTemp) - 5;
  const maxT = Math.max(...temps, options.envTemp) + 5;
  const minTime = times[0];
  const maxTime = times[times.length - 1];

  const toX = (t: number) =>
    padding.left + ((t - minTime) / Math.max(maxTime - minTime, 1)) * plotW;
  const toY = (temp: number) =>
    padding.top + plotH - ((temp - minT) / Math.max(maxT - minT, 1)) * plotH;

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Title
  ctx.fillStyle = "#1a1a2e";
  ctx.font = "bold 16px Segoe UI, Arial, sans-serif";
  ctx.fillText("Temperature vs Time", padding.left, 28);

  // Grid
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  const yTicks = 6;
  for (let i = 0; i <= yTicks; i++) {
    const temp = minT + (i / yTicks) * (maxT - minT);
    const y = toY(temp);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + plotW, y);
    ctx.stroke();
    ctx.fillStyle = "#6b7280";
    ctx.font = "11px Segoe UI, Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${formatThermalTemp(temp)}°C`, padding.left - 8, y + 4);
  }

  const xTicks = Math.min(data.length, 10);
  for (let i = 0; i <= xTicks; i++) {
    const t = minTime + (i / xTicks) * (maxTime - minTime);
    const x = toX(t);
    ctx.strokeStyle = "#e5e7eb";
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, padding.top + plotH);
    ctx.stroke();
    ctx.fillStyle = "#6b7280";
    ctx.textAlign = "center";
    ctx.fillText(`${formatThermalTemp(t)}`, x, padding.top + plotH + 20);
  }

  // Axis labels
  ctx.fillStyle = "#374151";
  ctx.font = "12px Segoe UI, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Time (s)", padding.left + plotW / 2, height - 12);
  ctx.save();
  ctx.translate(16, padding.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Temperature (°C)", 0, 0);
  ctx.restore();

  // Environmental reference line
  const envY = toY(options.envTemp);
  ctx.strokeStyle = "#9ca3af";
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(padding.left, envY);
  ctx.lineTo(padding.left + plotW, envY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#6b7280";
  ctx.font = "10px Segoe UI, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Atmospheric ${options.envTemp}°C`, padding.left + 4, envY - 6);

  // Data line
  const lineColor = options.isCooling ? "#2563eb" : "#dc2626";
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  data.forEach((d, i) => {
    const x = toX(d.time);
    const y = toY(d.temp);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Data points
  ctx.fillStyle = lineColor;
  data.forEach((d) => {
    const x = toX(d.time);
    const y = toY(d.temp);
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Legend
  ctx.fillStyle = lineColor;
  ctx.fillRect(padding.left + plotW - 120, padding.top + 8, 14, 14);
  ctx.fillStyle = "#374151";
  ctx.font = "11px Segoe UI, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Temperature (°C)", padding.left + plotW - 100, padding.top + 19);

  const dataUrl = canvas.toDataURL("image/png");
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Build Excel workbook with embedded line-chart image (not cell-only data) */
export async function exportThermalExcel(
  data: ThermalDataPoint[],
  meta: ThermalExportMeta,
  filename = "thermal_analysis.xlsx"
): Promise<void> {
  const maxTemp = Math.max(...data.map((d) => d.temp));
  const minTemp = Math.min(...data.map((d) => d.temp));
  const finalTemp = data[data.length - 1]?.temp ?? meta.atmosphericTemp;
  const isCooling = data.some((d) => d.temp < meta.atmosphericTemp);

  const pngBytes = renderThermalLineChartPng(data, {
    envTemp: meta.atmosphericTemp,
    isCooling,
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Chemora Thermal Analysis";
  workbook.created = new Date();

  // Sheet 1: Visual line graph (embedded chart image)
  const graphSheet = workbook.addWorksheet("Temperature Graph", {
    views: [{ showGridLines: false }],
  });
  graphSheet.getColumn(1).width = 3;
  for (let r = 1; r <= 28; r++) graphSheet.getRow(r).height = 18;

  const imageId = workbook.addImage({
    buffer: pngBytes,
    extension: "png",
  });
  graphSheet.addImage(imageId, {
    tl: { col: 0.5, row: 1 },
    ext: { width: 720, height: 400 },
  });

  graphSheet.getCell("A24").value = "Chemora — Thermal Analysis Line Graph";
  graphSheet.getCell("A24").font = { bold: true, size: 12, color: { argb: "FF1A1A2E" } };
  graphSheet.getCell("A25").value = `${data.length} readings · Peak ${formatThermalTemp(maxTemp)}°C · Final ${formatThermalTemp(finalTemp)}°C`;
  graphSheet.getCell("A25").font = { size: 10, color: { argb: "FF6B7280" } };

  // Sheet 2: Numeric data table (supporting the chart)
  const dataSheet = workbook.addWorksheet("Data");
  dataSheet.columns = [
    { header: "Time (s)", key: "time", width: 14 },
    { header: "Temperature (°C)", key: "temp", width: 18 },
  ];
  const headerRow = dataSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2563EB" },
  };
  data.forEach((d) => {
    dataSheet.addRow({ time: d.time, temp: d.temp });
  });

  // Sheet 3: Parameters
  const paramSheet = workbook.addWorksheet("Parameters");
  paramSheet.columns = [
    { header: "Parameter", key: "param", width: 32 },
    { header: "Value", key: "value", width: 20 },
  ];
  paramSheet.getRow(1).font = { bold: true };
  const params: [string, string | number][] = [
    ["Atmospheric Temperature (°C)", formatThermalTemp(meta.atmosphericTemp)],
    ["Atmospheric Pressure (kPa)", formatThermalTemp(meta.pressure)],
    ["Metal Mass (g)", formatThermalTemp(meta.metalMass)],
    ["Metal Temperature (°C)", formatThermalTemp(meta.metalTemp)],
    ["Liquid Mass (g)", formatThermalTemp(meta.waterMass)],
    ["Active Metal", meta.metalName ?? "None"],
    ["Specific Heat (J/g°C)", meta.specificHeat != null ? formatThermalTemp(meta.specificHeat) : "N/A"],
    ["Peak Temperature (°C)", formatThermalTemp(maxTemp)],
    ["Minimum Temperature (°C)", formatThermalTemp(minTemp)],
    ["Final Temperature (°C)", formatThermalTemp(finalTemp)],
    ["Duration (s)", formatThermalTemp(data[data.length - 1]?.time ?? 0)],
    ["Data Points", data.length],
    ["Distinct Temperatures", new Set(data.map((d) => d.temp)).size],
  ];
  params.forEach(([param, value]) => paramSheet.addRow({ param, value }));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
