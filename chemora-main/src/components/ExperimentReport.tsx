import { useEffect, useRef, useState } from "react";
import { ExperimentMaterial, ExperimentStep } from "@/lib/reactions";
import { CalorimetryData } from "@/components/ThermalAnalysisPanel";
import { X, FileText, Clock, Download, Edit3, Trash2 } from "lucide-react";
import jsPDF from "jspdf";

interface ExperimentReportProps {
  steps: ExperimentStep[];
  calorimetryData: CalorimetryData | null;
  hiddenMaterialIds: string[];
  deskRemovedMaterialIds: string[];
  onHideMaterial: (materialId: string) => void;
  onClose: () => void;
  onClear: () => void;
}

type MaterialCategory = "container" | "chemical" | "apparatus" | "safety" | "other";

type ReportMaterial = {
  id: string;
  label: string;
  category: MaterialCategory;
  count: number;
};

const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  container: "Containers",
  chemical: "Chemicals",
  apparatus: "Heating, Mixing & Measuring",
  safety: "Safety",
  other: "Other Materials",
};

const MATERIAL_CATEGORY_ORDER: MaterialCategory[] = ["container", "chemical", "apparatus", "safety", "other"];

function generateAim(steps: ExperimentStep[]): string {
  const procedureSteps = steps.filter((step) => !step.materialOnly);
  if (procedureSteps.length === 0) return "To investigate chemical reactions in a laboratory setting.";
  const types = new Set(procedureSteps.map((s) => s.reaction?.effect).filter(Boolean));
  const parts: string[] = [];
  if (types.has("explosion") || types.has("fire")) parts.push("exothermic reactions");
  if (types.has("bubbles") || types.has("fizz") || types.has("gas-release")) parts.push("gas-producing reactions");
  if (types.has("color-change") || types.has("indicator-change")) parts.push("colour changes and indicator behaviour");
  if (types.has("precipitate")) parts.push("precipitation reactions");
  if (types.has("rust")) parts.push("oxidation and corrosion");
  if (parts.length === 0) parts.push("chemical reactions");
  return `To investigate ${parts.join(", ")} by mixing various chemicals and observing the results.`;
}

function normalizeMaterialCategory(category: ExperimentMaterial["category"]): MaterialCategory {
  if (category === "container") return "container";
  if (category === "chemical") return "chemical";
  if (category === "safety") return "safety";
  if (category === "heating" || category === "mixing" || category === "measuring") return "apparatus";
  return "other";
}

function addMaterial(materials: Map<string, ReportMaterial>, material: Omit<ReportMaterial, "count">) {
  const current = materials.get(material.id);
  materials.set(material.id, {
    ...material,
    count: (current?.count ?? 0) + 1,
  });
}

function subtractMaterial(materials: Map<string, ReportMaterial>, materialId: string) {
  const material = materials.get(materialId);
  if (!material) return;
  if (material.count <= 1) {
    materials.delete(materialId);
    return;
  }
  materials.set(materialId, { ...material, count: material.count - 1 });
}

function generateMaterials(steps: ExperimentStep[], deskRemovedMaterialIds: string[], reportRemovedMaterialIds: string[]): ReportMaterial[] {
  const materials = new Map<string, ReportMaterial>();

  steps.forEach((step) => {
    if (!step.material) return;
    const material = step.material;
    addMaterial(materials, {
      id: material.id,
      label: material.label,
      category: normalizeMaterialCategory(material.category),
    });
  });

  deskRemovedMaterialIds.forEach((materialId) => subtractMaterial(materials, materialId));
  reportRemovedMaterialIds.forEach((materialId) => subtractMaterial(materials, materialId));

  return Array.from(materials.values()).sort((a, b) => {
    const categoryDiff = MATERIAL_CATEGORY_ORDER.indexOf(a.category) - MATERIAL_CATEGORY_ORDER.indexOf(b.category);
    if (categoryDiff !== 0) return categoryDiff;
    return a.label.localeCompare(b.label);
  });
}

function groupMaterials(materials: ReportMaterial[]) {
  return MATERIAL_CATEGORY_ORDER.map((category) => ({
    category,
    label: MATERIAL_CATEGORY_LABELS[category],
    items: materials.filter((material) => material.category === category),
  })).filter((group) => group.items.length > 0);
}

function getMaterialLabel(material: ReportMaterial): string {
  if (material.category === "chemical" || material.count <= 1) return material.label;
  return `${material.label} x${material.count}`;
}

function generateConclusion(steps: ExperimentStep[]): string {
  const procedureSteps = steps.filter((step) => !step.materialOnly);
  if (procedureSteps.length === 0) return "No reactions were performed during this experiment.";
  const successful = procedureSteps.filter((s) => s.reaction && s.reaction.intensity > 0);
  const noReaction = procedureSteps.filter((s) => s.reaction && s.reaction.intensity === 0);
  let conclusion = `In this experiment, ${procedureSteps.length} reaction${procedureSteps.length !== 1 ? "s" : ""} were attempted. `;
  if (successful.length > 0) {
    conclusion += `${successful.length} produced observable results including ${[...new Set(successful.map((s) => s.reaction!.effect.replace("-", " ")))].join(", ")}. `;
    const maxIntensity = Math.max(...successful.map((s) => s.reaction!.intensity));
    const most = successful.find((s) => s.reaction!.intensity === maxIntensity);
    if (most) conclusion += `The most vigorous reaction was ${most.reaction!.equation} with an intensity of ${maxIntensity}/10. `;
  }
  if (noReaction.length > 0) {
    conclusion += `${noReaction.length} combination${noReaction.length !== 1 ? "s" : ""} showed no reaction. `;
  }
  conclusion += "These observations are consistent with the reactivity series and principles of chemical bonding.";
  return conclusion;
}

// Helper to sanitize unicode subscripts for jsPDF (basic fonts don't support them)
function sanitizeForPDF(text: string): string {
  const subscriptMap: Record<string, string> = {
    "\u2080": "0", "\u2081": "1", "\u2082": "2", "\u2083": "3",
    "\u2084": "4", "\u2085": "5", "\u2086": "6", "\u2087": "7",
    "\u2088": "8", "\u2089": "9",
    "\u2070": "0", "\u00B9": "1", "\u00B2": "2", "\u00B3": "3",
    "\u2074": "4", "\u2075": "5", "\u2076": "6", "\u2077": "7",
    "\u2078": "8", "\u2079": "9",
  };
  let result = text;
  for (const [unicode, ascii] of Object.entries(subscriptMap)) {
    result = result.split(unicode).join(ascii);
  }
  // Replace other common unicode
  result = result.split("\u00B7").join(".");
  return result;
}

function makeExportFilename(value: string, fallback: string, extension: "pdf"): string {
  const trimmed = value.trim();
  const safeBase = (trimmed || fallback)
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "")
    .slice(0, 80);
  const filename = safeBase || fallback;
  return filename.toLowerCase().endsWith(`.${extension}`) ? filename : `${filename}.${extension}`;
}

export default function ExperimentReport({ steps, calorimetryData, hiddenMaterialIds, deskRemovedMaterialIds, onHideMaterial, onClose, onClear }: ExperimentReportProps) {
  const [aim, setAim] = useState(generateAim(steps));
  const [conclusion, setConclusion] = useState(generateConclusion(steps));
  const [editingAim, setEditingAim] = useState(false);
  const [editingConclusion, setEditingConclusion] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pdfFileName, setPdfFileName] = useState(() => `experiment-report-${new Date().toISOString().slice(0, 10)}`);
  const [removedMaterial, setRemovedMaterial] = useState<ReportMaterial | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const removeTimeoutRef = useRef<number | null>(null);

  const materials = generateMaterials(steps, deskRemovedMaterialIds, hiddenMaterialIds);
  const materialGroups = groupMaterials(materials);
  const procedureSteps = steps.filter((step) => !step.materialOnly);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!removedMaterial) return;
    if (removeTimeoutRef.current !== null) window.clearTimeout(removeTimeoutRef.current);

    const materialId = removedMaterial.id;
    removeTimeoutRef.current = window.setTimeout(() => {
      onHideMaterial(materialId);
      removeTimeoutRef.current = null;
      if (mountedRef.current) setRemovedMaterial(null);
    }, 5000);
  }, [removedMaterial, onHideMaterial]);

  const handleRemoveMaterial = (material: ReportMaterial) => {
    setRemovedMaterial(material);
  };

  const handleUndoRemoveMaterial = () => {
    if (removeTimeoutRef.current !== null) {
      window.clearTimeout(removeTimeoutRef.current);
      removeTimeoutRef.current = null;
    }
    setRemovedMaterial(null);
  };

  const handleConfirmRemoveMaterial = () => {
    if (!removedMaterial) return;
    if (removeTimeoutRef.current !== null) {
      window.clearTimeout(removeTimeoutRef.current);
      removeTimeoutRef.current = null;
    }
    onHideMaterial(removedMaterial.id);
    setRemovedMaterial(null);
  };

  const handleSavePDF = async () => {
    setSaving(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      const checkPage = (needed: number) => {
        if (y + needed > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
      };

      // Title
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Chemistry Experiment Report", pageWidth / 2, y, { align: "center" });
      y += 8;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(120, 120, 120);
      pdf.text(`Date: ${new Date().toLocaleDateString()}  |  Reactions: ${procedureSteps.length}`, pageWidth / 2, y, { align: "center" });
      pdf.setTextColor(0, 0, 0);
      y += 4;

      // Divider
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;

      // Section helper
      const sectionTitle = (title: string) => {
        checkPage(12);
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text(title, margin, y);
        y += 2;
        pdf.setDrawColor(66, 133, 244);
        pdf.setLineWidth(0.5);
        pdf.line(margin, y, margin + pdf.getTextWidth(title), y);
        pdf.setLineWidth(0.2);
        pdf.setDrawColor(200, 200, 200);
        y += 6;
      };

      // Aim
      sectionTitle("Aim");
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      const aimLines = pdf.splitTextToSize(sanitizeForPDF(aim), contentWidth);
      checkPage(aimLines.length * 5);
      pdf.text(aimLines, margin, y);
      y += aimLines.length * 5 + 6;

      // Materials
      sectionTitle("Materials Used");
      if (materials.length === 0) {
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "italic");
        pdf.text("No materials used.", margin, y);
        y += 6;
      } else {
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        materialGroups.forEach((group) => {
          checkPage(8);
          pdf.setFont("helvetica", "bold");
          pdf.text(group.label, margin, y);
          y += 5;
          pdf.setFont("helvetica", "normal");
          const colWidth = contentWidth / 2;
          group.items.forEach((m, i) => {
            checkPage(5);
            const col = i % 2;
            const xPos = margin + col * colWidth;
            pdf.text(`- ${sanitizeForPDF(getMaterialLabel(m))}`, xPos, y);
            if (col === 1 || i === group.items.length - 1) y += 4.5;
          });
          y += 2;
        });
        y += 4;
      }

      // Calorimetry Data
      if (calorimetryData) {
        sectionTitle("Calorimetry Data");
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        const calRows = [
          [`Metal: ${sanitizeForPDF(calorimetryData.metalSymbol)} (${calorimetryData.metalName})`, `Specific Heat: ${calorimetryData.specificHeat} J/(g.C)`],
          [`Metal Mass: ${calorimetryData.metalMass} g`, `Metal Temp: ${calorimetryData.metalTemp} C`],
          [`Liquid Mass: ${calorimetryData.waterMass} g`, `Liquid Temp: ${calorimetryData.waterTemp} C`],
          [`Equilibrium Temp: ${calorimetryData.equilibriumTemp.toFixed(1)} C`, ``],
          [`Heat lost by metal: ${calorimetryData.heatLost.toFixed(1)} J`, `Heat gained by liquid: ${calorimetryData.heatGained.toFixed(1)} J`],
        ];
        const colW = contentWidth / 2;
        calRows.forEach((row) => {
          checkPage(5);
          pdf.text(row[0], margin, y);
          if (row[1]) pdf.text(row[1], margin + colW, y);
          y += 5;
        });
        y += 4;
      }

      // Procedure
      sectionTitle(`Procedure & Observations (${procedureSteps.length} steps)`);
      if (procedureSteps.length === 0) {
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "italic");
        pdf.text("No reactions recorded.", margin, y);
        y += 6;
      } else {
        procedureSteps.forEach((step, i) => {
          checkPage(25);
          // Step header
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          pdf.text(`Step ${i + 1} - ${sanitizeForPDF(step.beakerLabel)}`, margin, y);
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(120, 120, 120);
          pdf.text(step.timestamp.toLocaleTimeString(), pageWidth - margin, y, { align: "right" });
          pdf.setTextColor(0, 0, 0);
          y += 5;

          // Chemicals
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "normal");
          if (step.chemicals.length > 0) {
            const chemsText = `Chemicals: ${step.chemicals.map((c) => `${c.name} (${sanitizeForPDF(c.formula)})`).join(" + ")}`;
            const chemsLines = pdf.splitTextToSize(chemsText, contentWidth);
            checkPage(chemsLines.length * 4);
            pdf.text(chemsLines, margin + 3, y);
            y += chemsLines.length * 4;
          }

          if (step.apparatus.length > 0) {
            const appText = `Apparatus: ${step.apparatus.join(", ")}`;
            const appLines = pdf.splitTextToSize(appText, contentWidth);
            checkPage(appLines.length * 4);
            pdf.text(appLines, margin + 3, y);
            y += appLines.length * 4;
          }

          // Only show reaction details for actual reactions (intensity > 0)
          if (step.reaction && step.reaction.intensity > 0) {
            checkPage(12);
            // Equation in a box
            pdf.setFillColor(245, 245, 250);
            const eqText = sanitizeForPDF(step.reaction.equation);
            const eqWidth = Math.min(pdf.getTextWidth(eqText) + 8, contentWidth);
            pdf.roundedRect(margin + 3, y - 3, eqWidth, 6, 1, 1, "F");
            pdf.setFont("courier", "normal");
            pdf.setFontSize(9);
            pdf.text(eqText, margin + 7, y);
            y += 6;

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);
            const descLines = pdf.splitTextToSize(sanitizeForPDF(step.reaction.description), contentWidth - 6);
            checkPage(descLines.length * 4);
            pdf.text(descLines, margin + 3, y);
            y += descLines.length * 4;

            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Effect: ${step.reaction.effect.replace("-", " ")}  |  Intensity: ${step.reaction.intensity}/10`, margin + 3, y);
            pdf.setTextColor(0, 0, 0);
            y += 5;
          }

          // Step separator
          y += 2;
          if (i < procedureSteps.length - 1) {
            pdf.setDrawColor(230, 230, 230);
            pdf.line(margin + 5, y, pageWidth - margin - 5, y);
            y += 4;
          }
        });
        y += 4;
      }

      // Conclusion
      sectionTitle("Conclusion");
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      const concLines = pdf.splitTextToSize(sanitizeForPDF(conclusion), contentWidth);
      checkPage(concLines.length * 5);
      pdf.text(concLines, margin, y);

      pdf.save(makeExportFilename(pdfFileName, `experiment-report-${new Date().toISOString().slice(0, 10)}`, "pdf"));
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Experiment Report</h2>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={pdfFileName}
              onChange={(event) => setPdfFileName(event.target.value)}
              className="h-7 w-36 rounded-md border border-border bg-background px-2 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary sm:w-44"
              placeholder="PDF file name"
              title="PDF file name"
            />
            <button
              onClick={onClear}
              className="text-xs text-destructive hover:text-destructive/80 transition-colors px-3 py-1 rounded-md border border-destructive/30 hover:bg-destructive/10 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
            <button
              onClick={handleSavePDF}
              disabled={saving}
              className="text-xs text-primary hover:text-primary/80 transition-colors px-3 py-1 rounded-md border border-primary/30 hover:bg-primary/10 flex items-center gap-1 disabled:opacity-50"
            >
              <Download className="w-3 h-3" /> {saving ? "Saving..." : "Save PDF"}
            </button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={contentRef}>
          {/* Title */}
          <div className="text-center border-b border-border pb-4">
            <h1 className="text-lg font-bold text-foreground">Chemistry Experiment Report</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Date: {new Date().toLocaleDateString()} | Reactions: {procedureSteps.length}
            </p>
          </div>

          {/* Aim */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Aim</h3>
              <button onClick={() => setEditingAim(!editingAim)} className="text-muted-foreground hover:text-primary transition-colors">
                <Edit3 className="w-3 h-3" />
              </button>
            </div>
            {editingAim ? (
              <textarea
                value={aim}
                onChange={(e) => setAim(e.target.value)}
                className="w-full text-sm text-foreground bg-secondary/30 border border-border rounded-lg p-3 min-h-[60px] resize-y focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed bg-secondary/20 rounded-lg p-3">{aim}</p>
            )}
          </section>

          {/* Materials */}
          <section>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">Materials Used</h3>
            {materials.length === 0 ? (
              <p className="text-sm text-muted-foreground/60 italic">No materials used yet.</p>
            ) : (
              <div className="space-y-3">
                {materialGroups.map((group) => (
                  <div key={group.category} className="space-y-1">
                    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </h4>
                    <ul className="grid grid-cols-2 gap-1">
                      {group.items.map((material) => (
                        <li key={material.id} className="group flex items-center gap-1 rounded-md pr-1 text-xs text-muted-foreground hover:bg-secondary/30">
                          <span className="h-1 w-1 rounded-full bg-primary" />
                          <span className="min-w-0 flex-1 truncate">{getMaterialLabel(material)}</span>
                          <button
                            onClick={() => handleRemoveMaterial(material)}
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                            title="Remove material from report"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Calorimetry Data */}
          {calorimetryData && (
            <section>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">Calorimetry Data</h3>
              <div className="bg-secondary/30 border border-border rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-muted-foreground">
                    Metal: <span className="font-medium text-foreground">{calorimetryData.metalSymbol} · {calorimetryData.metalName}</span>
                  </div>
                  <div className="text-muted-foreground">
                    Specific Heat: <span className="font-mono text-foreground">{calorimetryData.specificHeat} J/(g·°C)</span>
                  </div>
                  <div className="text-muted-foreground">
                    Metal Mass: <span className="font-mono text-foreground">{calorimetryData.metalMass} g</span>
                  </div>
                  <div className="text-muted-foreground">
                    Metal Temp: <span className="font-mono text-foreground">{calorimetryData.metalTemp}°C</span>
                  </div>
                  <div className="text-muted-foreground">
                    Liquid Mass: <span className="font-mono text-foreground">{calorimetryData.waterMass} g</span>
                  </div>
                  <div className="text-muted-foreground">
                    Liquid Temp: <span className="font-mono text-foreground">{calorimetryData.waterTemp}°C</span>
                  </div>
                </div>
                <div className="border-t border-border pt-2 space-y-1">
                  <p className="text-xs text-foreground font-medium">
                    Equilibrium Temperature: <span className="font-mono text-primary">{calorimetryData.equilibriumTemp.toFixed(1)}°C</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Heat lost by metal: <span className="font-mono text-destructive">{calorimetryData.heatLost.toFixed(1)} J</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Heat gained by liquid: <span className="font-mono text-primary">{calorimetryData.heatGained.toFixed(1)} J</span>
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Procedure / Steps */}
          <section>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">
              Procedure & Observations ({procedureSteps.length} steps)
            </h3>
            {procedureSteps.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No reactions recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {procedureSteps.map((step, i) => (
                  <div key={i} className="bg-secondary/30 border border-border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        Step {i + 1} — {step.beakerLabel}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {step.timestamp.toLocaleTimeString()}
                      </span>
                    </div>

                    {step.chemicals.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">Chemicals: </span>
                        {step.chemicals.map((c) => `${c.name} (${c.formula})`).join(" + ")}
                      </div>
                    )}

                    {step.apparatus.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">Apparatus: </span>
                        {step.apparatus.join(", ")}
                      </div>
                    )}

                    {step.reaction && (
                      <>
                        <div className="bg-secondary/50 rounded px-3 py-2 border border-border">
                          <p className="font-mono text-xs text-primary">{step.reaction.equation}</p>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{step.reaction.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground capitalize">
                            {step.reaction.effect.replace("-", " ")}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Reactivity: {step.reaction.intensity}/10
                          </span>
                          {step.reaction.indicatorColor && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <span className="w-2 h-2 rounded-full" style={{ background: step.reaction.indicatorColor }} />
                              Color change
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Conclusion */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Conclusion</h3>
              <button onClick={() => setEditingConclusion(!editingConclusion)} className="text-muted-foreground hover:text-primary transition-colors">
                <Edit3 className="w-3 h-3" />
              </button>
            </div>
            {editingConclusion ? (
              <textarea
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                className="w-full text-sm text-foreground bg-secondary/30 border border-border rounded-lg p-3 min-h-[80px] resize-y focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed bg-secondary/20 rounded-lg p-3">{conclusion}</p>
            )}
          </section>
        </div>
      </div>
      {removedMaterial && (
        <div className="fixed bottom-4 right-4 z-[60] max-w-sm rounded-lg border border-border bg-card/80 p-4 text-sm text-foreground shadow-2xl backdrop-blur-md">
          <p className="font-medium">{removedMaterial.label} removed from Materials Used.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            It will stay on the Fusion Desk. This only removes it from the report.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={handleUndoRemoveMaterial}
              className="rounded-md border border-primary/30 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10"
            >
              Undo
            </button>
            <button
              onClick={handleConfirmRemoveMaterial}
              className="rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-secondary"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
