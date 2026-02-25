import React, { useState } from "react";
import { Download, Eye, Loader2, X } from "lucide-react";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { getCountryName, calculateAge } from "../../lib/utils";

const roleColorSchemes = {
  athlete: { bg: "#2563eb", text: "#ffffff" },
  coach: { bg: "#0d9488", text: "#ffffff" },
  media: { bg: "#d97706", text: "#ffffff" },
  official: { bg: "#7c3aed", text: "#ffffff" },
  medical: { bg: "#e11d48", text: "#ffffff" },
  staff: { bg: "#475569", text: "#ffffff" },
  vip: { bg: "#b45309", text: "#ffffff" }
};

const getRoleColors = (role) => {
  const key = role?.toLowerCase() || "default";
  return roleColorSchemes[key] || { bg: "#475569", text: "#ffffff" };
};

export default function BadgeGenerator({ accreditation, event, zones = [], onClose }) {
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const generateBadgePDF = async () => {
    setGenerating(true);
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [210, 100]
      });

      const roleColors = getRoleColors(accreditation.role);
      const fullName = `${accreditation.firstName || ""} ${accreditation.lastName || ""}`.trim().toUpperCase();
      const countryName = getCountryName(accreditation.nationality);
      const zoneCodes = accreditation.zoneCode?.split(",").map(z => z.trim()).filter(Boolean) || [];
      const age = accreditation.dateOfBirth && event?.ageCalculationYear 
        ? calculateAge(accreditation.dateOfBirth, event.ageCalculationYear) 
        : null;

      // Background
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, 210, 100, "F");

      // Top accent bar with role color
      const roleColorHex = roleColors.bg;
      const r = parseInt(roleColorHex.slice(1, 3), 16);
      const g = parseInt(roleColorHex.slice(3, 5), 16);
      const b = parseInt(roleColorHex.slice(5, 7), 16);
      pdf.setFillColor(r, g, b);
      pdf.rect(0, 0, 210, 12, "F");

      // Role text on accent bar
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("Helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text((accreditation.role || "PARTICIPANT").toUpperCase(), 105, 8, { align: "center" });

      // Event name
      pdf.setTextColor(148, 163, 184);
      pdf.setFont("Helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(event?.name || "EVENT", 15, 20);

      // Full name
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("Helvetica", "bold");
      pdf.setFontSize(18);
      const nameLines = pdf.splitTextToSize(fullName, 120);
      pdf.text(nameLines, 15, 32);

      // Details section
      pdf.setFont("Helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(203, 213, 225);
      let detailY = 48;
      pdf.text(`Club: ${accreditation.club || "N/A"}`, 15, detailY);
      detailY += 6;
      pdf.text(`Country: ${countryName}`, 15, detailY);
      detailY += 6;
      if (age !== null) {
        pdf.text(`Age: ${age} years`, 15, detailY);
        detailY += 6;
      }
      pdf.text(`Gender: ${accreditation.gender || "N/A"}`, 15, detailY);

      // Badge number
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("Helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text(`Badge: ${accreditation.badgeNumber || "---"}`, 15, 80);

      // ID
      pdf.setFont("Helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      const idNumber = accreditation.accreditationId?.split("-")?.pop() || "---";
      pdf.text(`ID: ${idNumber}`, 15, 86);

      // Zone access section (bottom)
      pdf.setFillColor(0, 61, 82);
      pdf.rect(0, 88, 210, 12, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("Helvetica", "bold");
      pdf.setFontSize(12);
      if (zoneCodes.length > 0) {
        const zonesText = zoneCodes.slice(0, 4).join("  |  ");
        pdf.text(zonesText, 105, 95, { align: "center" });
      } else {
        pdf.setTextColor(148, 163, 184);
        pdf.text("NO ACCESS", 105, 95, { align: "center" });
      }

      // Generate QR code
      const verifyId = accreditation.accreditationId || accreditation.badgeNumber || accreditation.id || "unknown";
      const verifyUrl = `${window.location.origin}/verify/${verifyId}`;
      const qrCanvas = await QRCode.toCanvas(verifyUrl, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 300,
        color: {
          dark: "#000000",
          light: "#FFFFFF"
        }
      });

      const qrImage = qrCanvas.toDataURL("image/png");
      // Add QR code on the right side
      pdf.addImage(qrImage, "PNG", 155, 20, 40, 40);

      // QR label
      pdf.setFont("Helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(148, 163, 184);
      pdf.text("Scan to verify", 175, 65, { align: "center" });

      // Border
      pdf.setDrawColor(30, 41, 59);
      pdf.setLineWidth(0.5);
      pdf.rect(2, 2, 206, 96);

      // Save the PDF
      const fileName = `${accreditation.firstName}_${accreditation.lastName}_Badge_${accreditation.badgeNumber || "card"}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating badge PDF. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const generatePreview = async () => {
    setGenerating(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1050;
      canvas.height = 500;

      const ctx = canvas.getContext("2d");
      const roleColors = getRoleColors(accreditation.role);
      const fullName = `${accreditation.firstName || ""} ${accreditation.lastName || ""}`.trim().toUpperCase();
      const countryName = getCountryName(accreditation.nationality);
      const zoneCodes = accreditation.zoneCode?.split(",").map(z => z.trim()).filter(Boolean) || [];
      const age = accreditation.dateOfBirth && event?.ageCalculationYear 
        ? calculateAge(accreditation.dateOfBirth, event.ageCalculationYear) 
        : null;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 1050, 500);
      gradient.addColorStop(0, "#0f172a");
      gradient.addColorStop(1, "#1e293b");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1050, 500);

      // Top accent bar
      ctx.fillStyle = roleColors.bg;
      ctx.fillRect(0, 0, 1050, 60);

      // Role text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px Arial";
      ctx.textAlign = "center";
      ctx.fillText((accreditation.role || "PARTICIPANT").toUpperCase(), 525, 40);

      // Event name
      ctx.textAlign = "left";
      ctx.fillStyle = "#94a3b8";
      ctx.font = "16px Arial";
      ctx.fillText(event?.name || "EVENT", 40, 95);

      // Full name
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 38px Arial";
      ctx.fillText(fullName, 40, 145);

      // Details
      ctx.font = "18px Arial";
      ctx.fillStyle = "#cbd5e1";
      let detailY = 190;
      ctx.fillText(`Club: ${accreditation.club || "N/A"}`, 40, detailY);
      detailY += 30;
      ctx.fillText(`Country: ${countryName}`, 40, detailY);
      detailY += 30;
      if (age !== null) {
        ctx.fillText(`Age: ${age} years`, 40, detailY);
        detailY += 30;
      }
      ctx.fillText(`Gender: ${accreditation.gender || "N/A"}`, 40, detailY);

      // Badge number
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px Arial";
      ctx.fillText(`Badge: ${accreditation.badgeNumber || "---"}`, 40, 380);

      // ID
      ctx.font = "16px Arial";
      ctx.fillStyle = "#94a3b8";
      const idNumber = accreditation.accreditationId?.split("-")?.pop() || "---";
      ctx.fillText(`ID: ${idNumber}`, 40, 410);

      // Zone section
      ctx.fillStyle = "#003d52";
      ctx.fillRect(0, 440, 1050, 60);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px Arial";
      ctx.textAlign = "center";
      if (zoneCodes.length > 0) {
        const zonesText = zoneCodes.slice(0, 4).join("  |  ");
        ctx.fillText(zonesText, 525, 480);
      } else {
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("NO ACCESS", 525, 480);
      }

      // Generate QR code
      const verifyIdPreview = accreditation.accreditationId || accreditation.badgeNumber || accreditation.id || "unknown";
      const verifyUrlPreview = `${window.location.origin}/verify/${verifyIdPreview}`;
      const qrCanvas = await QRCode.toCanvas(verifyUrlPreview, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 200,
        color: {
          dark: "#000000",
          light: "#FFFFFF"
        }
      });

      // Draw QR code
      ctx.drawImage(qrCanvas, 800, 100, 200, 200);

      // QR label
      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px Arial";
      ctx.fillText("Scan to verify", 900, 330);

      // Border
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 3;
      ctx.strokeRect(5, 5, 1040, 490);

      setPreviewImage(canvas.toDataURL("image/png"));
      setPreview(true);
    } catch (error) {
      console.error("Error generating preview:", error);
      alert("Error generating preview. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Generate Simple Badge</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}
      </div>

      <p className="text-lg text-slate-400 font-extralight">
        Generate a simple landscape badge PDF with QR code for{" "}
        <span className="text-white font-medium">
          {accreditation.firstName} {accreditation.lastName}
        </span>
      </p>

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={generatePreview}
          disabled={generating}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-lg"
        >
          {generating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Eye size={18} />
              <span>Preview Badge</span>
            </>
          )}
        </button>

        <button
          onClick={generateBadgePDF}
          disabled={generating}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 text-lg"
        >
          {generating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <Download size={18} />
              <span>Download PDF Badge</span>
            </>
          )}
        </button>
      </div>

      {preview && previewImage && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-bold text-white">Badge Preview</h4>
            <button
              onClick={() => setPreview(false)}
              className="text-slate-400 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <div className="overflow-x-auto">
            <img 
              src={previewImage} 
              alt="Badge Preview" 
              className="w-full rounded-lg shadow-lg max-w-4xl"
            />
          </div>
          <p className="text-lg text-slate-500 mt-4 font-extralight">
            This is how your badge will look when printed. Click "Download PDF Badge" to save it.
          </p>
        </div>
      )}
    </div>
  );
}
