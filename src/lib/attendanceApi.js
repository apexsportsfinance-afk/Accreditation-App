import { supabase } from "./supabase";

export const AttendanceAPI = {
  /**
   * Records a new scan to the database.
   * @param {Object} data 
   * @param {string} data.eventId
   * @param {string} data.athleteId
   * @param {string} data.clubName 
   * @param {string} data.scannerLocation
   * @returns {Object} result indicating success, duplicate, or error
   */
  recordScan: async ({ eventId, athleteId, clubName, scannerLocation }) => {
    try {
      const now = new Date();
      const checkInDate = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const checkInTime = now.toISOString();

      // Check if duplicate exists for today
      const { data: existing, error: checkError } = await supabase
        .from("event_attendance")
        .select("id, scan_count")
        .eq("event_id", eventId)
        .eq("athlete_id", athleteId)
        .eq("check_in_date", checkInDate)
        .maybeSingle();
        
      if (existing) {
        // Increment scan count optionally, but report duplicate
        await supabase
          .from("event_attendance")
          .update({ scan_count: (existing.scan_count || 1) + 1 })
          .eq("id", existing.id);
          
        return { status: "duplicate", message: "Athlete already checked in today." };
      }

      // Insert new record
      const { error: insertError } = await supabase
        .from("event_attendance")
        .insert([{
          event_id: eventId,
          athlete_id: athleteId,
          club_name: clubName || null,
          check_in_date: checkInDate,
          check_in_time: checkInTime,
          scanner_location: scannerLocation || "Main Entrance",
          scan_count: 1
        }]);

      if (insertError) {
        if (insertError.code === "23505") { // Unique violation
          return { status: "duplicate", message: "Athlete already checked in today." };
        }
        throw insertError;
      }

      return { status: "success", message: "Attendance verified successfully." };

    } catch (err) {
      console.error("[AttendanceAPI] error recording scan:", err);
      return { status: "error", message: err.message || "Failed to record attendance." };
    }
  },

  /**
   * Gets attendance sheet for an event
   */
  getAttendanceForEvent: async (eventId, dateStr) => {
    try {
      const targetDate = dateStr || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from("event_attendance")
        .select("*")
        .eq("event_id", eventId)
        .eq("check_in_date", targetDate);
        
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("[AttendanceAPI] get error:", err);
      return [];
    }
  },

  /**
   * Gets ALL attendance records for an event regardless of date
   */
  getEventAttendance: async (eventId) => {
    try {
      const { data, error } = await supabase
        .from("event_attendance")
        .select("*")
        .eq("event_id", eventId);
        
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("[AttendanceAPI] getEventAttendance error:", err);
      return [];
    }
  }
};
