// Lazy-load PDF generation libraries only when needed
export async function exportToPDF(fileName: string, element: HTMLElement) {
  try {
    const { default: html2canvas } = await import("html2canvas");
    const { jsPDF } = await import("jspdf");

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add image to PDF, split across pages if necessary
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(fileName);
  } catch (error) {
    console.error("PDF export failed:", error);
    throw error;
  }
}

export async function generateChemistryPDF(fileName: string, element: HTMLElement) {
  return exportToPDF(fileName, element);
}
