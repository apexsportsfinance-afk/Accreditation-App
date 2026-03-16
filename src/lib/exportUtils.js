import * as XLSX from "xlsx";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { AccreditationsAPI } from "./storage";
import { AttendanceAPI } from "./attendanceApi";

/**
 * Clean strings for filenames
 */
const sanitizeFilename = (name) => {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
};

/**
 * Given a club's full name, fetches ALL their registrants across all categories
 * and joins attendance data.
 */
async function fetchClubData(eventId, clubFull) {
  // 1. Fetch all accreditations for this event
  const allAccs = await AccreditationsAPI.getByEventId(eventId) || [];
  
  // 2. Fetch all attendance records for this event
  const allAttendance = await AttendanceAPI.getEventAttendance(eventId) || [];

  // Filter for THIS specific club (ignoring case/whitespace)
  const clubTerm = String(clubFull).trim().toLowerCase();
  const clubMembers = allAccs.filter(a => String(a.club || "").trim().toLowerCase() === clubTerm);

  // Map into the exact requested output format
  const formattedData = clubMembers.map((member, index) => {
    // Determine attendance string
    const memberAttendance = allAttendance.filter(att => att.athlete_id === member.id);
    let attendanceStr = "Not Arrived";
    
    if (memberAttendance.length > 0) {
      // Get most recent scan
      const latestRecord = [...memberAttendance].sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
      const timeStr = new Date(latestRecord.check_in_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      attendanceStr = `Marked at ${timeStr}`;
    }

    // Determine status string (usually standard title case is fine)
    let accStatus = member.status === "approved" ? "Accreditation Issued" : "Pending";
    if (member.status === "rejected") accStatus = "Rejected";

    return {
      "Sr#": index + 1, // Reset to 1 per club file
      "Name": `${member.firstName || ""} ${member.lastName || ""}`.trim(),
      "Club Name": clubFull,
      "Category": member.role || "Athlete", // Ensure coaches/managers are mapped here
      "Accreditation Status": accStatus,
      "Attendance": attendanceStr
    };
  });

  return formattedData;
}

/**
 * Generates an Excel Blob (binary representation) for a single club
 */
function generateExcelBlob(clubFull, clubData) {
  const ws = XLSX.utils.json_to_sheet(clubData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");
  
  // Note: High-end styling like frozen headers/colors requires xlsx-js-style library
  // Standard sheetjs does not support rich formatting in the free tier
  
  // write to array buffer
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

/**
 * Main Export Handler
 * Drives the modal's selected clubs into either a single file or a ZIP.
 */
export async function generateClubExports(eventId, eventName, selectedClubs, format, updateProgress) {
  if (!selectedClubs || selectedClubs.length === 0) return;

  const dateStr = new Date().toISOString().split('T')[0];

  // If only 1 club is selected AND we're doing Excel, just download the single file natively
  if (selectedClubs.length === 1 && format === 'xlsx') {
    const clubName = selectedClubs[0];
    updateProgress(`Fetching data for ${clubName}...`);
    const clubData = await fetchClubData(eventId, clubName);
    
    updateProgress(`Generating Excel...`);
    const blob = generateExcelBlob(clubName, clubData);
    
    saveAs(blob, `${sanitizeFilename(clubName)}-Attendance-${dateStr}.xlsx`);
    return;
  }

  // --- MULTI-CLUB / ZIP FLOW ---
  const zip = new JSZip();
  const folderName = `${sanitizeFilename(eventName)}-Club-Reports-${dateStr}`;
  const folder = zip.folder(folderName);

  for (let i = 0; i < selectedClubs.length; i++) {
    const clubFull = selectedClubs[i];
    updateProgress(`Generating file ${i + 1} of ${selectedClubs.length}: ${clubFull}...`);
    
    // 1. Fetch
    const clubData = await fetchClubData(eventId, clubFull);
    
    // 2. Format
    if (format === 'xlsx') {
      const blob = generateExcelBlob(clubFull, clubData);
      folder.file(`${sanitizeFilename(clubFull)}-Attendance-${dateStr}.xlsx`, blob);
    } 
    // Extendable: Add CSV/PDF generators here below if needed.
    // For now, defaulting multi to xlsx if requested 
  }

  // 3. Generate ZIP metadata
  folder.file("README.txt", `Generated on: ${new Date().toLocaleString()}\nEvent: ${eventName}\nTotal Clubs Exported: ${selectedClubs.length}\nFormat: ${format.toUpperCase()}`);

  updateProgress(`Zipping ${selectedClubs.length} files together...`);

  // 4. Client-side Download
  const zipContent = await zip.generateAsync({ type: "blob" });
  saveAs(zipContent, `Multi-Club-Export-${dateStr}.zip`);
}
