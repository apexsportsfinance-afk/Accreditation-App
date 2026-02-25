import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// A6 dimensions in mm (105 x 148)
const A6_W = 105;
const A6_H = 148;

// A5 dimensions in mm (148 x 210)
const A5_W = 148;
const A5_H = 210;

// Paper size configurations
export const PDF_SIZES = {
  a6: { width: A6_W, height: A6_H, label: "A6 (105 × 148 mm)", scale: 4 },
  a5: { width: A5_W, height: A5_H, label: "A5 (148 × 210 mm)", scale: 5 },
  card: { width: 85.6, height: 54, label: "ID Card (85.6 × 54 mm)", scale: 4 }
};

// Image size configurations
export const IMAGE_SIZES = {
  small: { width: 800, height: 1132, label: "Standard (800px)", quality: 0.9 },
  medium: { width: 1600, height: 2264, label: "HD (1600px)", quality: 0.95 },
  large: { width: 2400, height: 3396, label: "Ultra HD (2400px)", quality: 1 },
  hd: { width: 3200, height: 4528, label: "Print Quality (3200px)", quality: 1 }
};

/**
 * Wait for all images within an element to load
 */
const waitForImages = async (element) => {
  const images = element.querySelectorAll("img");
  const imagePromises = Array.from(images).map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
      // Timeout after 5 seconds
      setTimeout(resolve, 5000);
    });
  });
  await Promise.all(imagePromises);
  // Additional small delay to ensure rendering is complete
  await new Promise(resolve => setTimeout(resolve, 100));
};

/**
 * Captures the HTML card preview elements and generates a PDF
 * This captures the EXACT visual appearance of the HTML preview
 */
export const captureCardAsPDF = async (frontCardId, backCardId, sizeKey = "a6") => {
  const frontEl = document.getElementById(frontCardId);
  const backEl = document.getElementById(backCardId);

  if (!frontEl) {
    throw new Error("Front card element not found");
  }

  const size = PDF_SIZES[sizeKey] || PDF_SIZES.a6;

  // Wait for all images to load before capturing
  await waitForImages(frontEl);
  if (backEl) {
    await waitForImages(backEl);
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [size.width, size.height]
  });

  // Capture front card with high quality settings
  const frontCanvas = await html2canvas(frontEl, {
    scale: size.scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    imageTimeout: 15000,
    removeContainer: false,
    // Ensure exact pixel rendering
    windowWidth: frontEl.scrollWidth,
    windowHeight: frontEl.scrollHeight
  });

  const frontImgData = frontCanvas.toDataURL("image/png", 1.0);
  pdf.addImage(frontImgData, "PNG", 0, 0, size.width, size.height);

  // Capture back card if exists
  if (backEl) {
    pdf.addPage([size.width, size.height], "portrait");
    const backCanvas = await html2canvas(backEl, {
      scale: size.scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 15000,
      removeContainer: false,
      windowWidth: backEl.scrollWidth,
      windowHeight: backEl.scrollHeight
    });
    const backImgData = backCanvas.toDataURL("image/png", 1.0);
    pdf.addImage(backImgData, "PNG", 0, 0, size.width, size.height);
  }

  return pdf;
};

/**
 * Download the captured PDF with size option
 */
export const downloadCapturedPDF = async (frontCardId, backCardId, fileName, sizeKey = "a6") => {
  const pdf = await captureCardAsPDF(frontCardId, backCardId, sizeKey);
  pdf.save(fileName);
  return true;
};

/**
 * Open the captured PDF in a new tab
 */
export const openCapturedPDFInTab = async (frontCardId, backCardId, sizeKey = "a6") => {
  const pdf = await captureCardAsPDF(frontCardId, backCardId, sizeKey);
  const blob = pdf.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 120000);
  return true;
};

/**
 * Get PDF blob for preview/print
 */
export const getCapturedPDFBlob = async (frontCardId, backCardId, sizeKey = "a6") => {
  const pdf = await captureCardAsPDF(frontCardId, backCardId, sizeKey);
  return pdf.output("blob");
};

/**
 * Capture card as image with size options
 */
export const captureCardAsImage = async (cardId, sizeKey = "medium") => {
  const cardEl = document.getElementById(cardId);
  if (!cardEl) {
    throw new Error("Card element not found");
  }

  // Wait for images to load
  await waitForImages(cardEl);

  const size = IMAGE_SIZES[sizeKey] || IMAGE_SIZES.medium;
  // Calculate scale based on element size and desired output size
  const rect = cardEl.getBoundingClientRect();
  const scale = size.width / rect.width;

  const canvas = await html2canvas(cardEl, {
    scale: scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    imageTimeout: 15000,
    removeContainer: false,
    windowWidth: cardEl.scrollWidth,
    windowHeight: cardEl.scrollHeight
  });

  return canvas.toDataURL("image/png", size.quality);
};

/**
 * Download card as image
 */
export const downloadCardAsImage = async (cardId, fileName, sizeKey = "medium") => {
  const dataUrl = await captureCardAsImage(cardId, sizeKey);
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
};

/**
 * Download both front and back cards as separate images
 */
export const downloadBothCardsAsImages = async (frontCardId, backCardId, baseFileName, sizeKey = "medium") => {
  const frontDataUrl = await captureCardAsImage(frontCardId, sizeKey);
  const backDataUrl = await captureCardAsImage(backCardId, sizeKey);
  // Download front
  const frontLink = document.createElement("a");
  frontLink.href = frontDataUrl;
  frontLink.download = `${baseFileName}_front.png`;
  document.body.appendChild(frontLink);
  frontLink.click();
  document.body.removeChild(frontLink);
  // Small delay between downloads
  await new Promise(resolve => setTimeout(resolve, 300));
  // Download back
  const backLink = document.createElement("a");
  backLink.href = backDataUrl;
  backLink.download = `${baseFileName}_back.png`;
  document.body.appendChild(backLink);
  backLink.click();
  document.body.removeChild(backLink);
  return true;
};
