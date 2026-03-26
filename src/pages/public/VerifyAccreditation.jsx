import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  CheckCircle, XCircle, Download, Calendar,
  MessageSquare, Globe, AlertTriangle, ChevronDown, ChevronUp, ShieldCheck,
  User, Hash, MapPin, Building, Cake, ExternalLink, Bell, X, Paperclip, FileText
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { EventSettingsAPI, FormFieldSettingsAPI, BroadcastV2API, AthleteEventsAPI, GlobalSettingsAPI } from "../../lib/broadcastApi";
import { computeExpiryStatus, formatEventDateTime } from "../../lib/expiryUtils";
import { getCountryFlag, COUNTRIES, calculateAge } from "../../lib/utils";
import { toast } from "sonner";

// Helper function to calculate exact split time between PB and Record
const parseTimeSeconds = (timeStr) => {
  if (!timeStr || timeStr === "NT" || timeStr === "NP") return null;
  let clean = timeStr.trim().replace(/[A-Za-z]/g, '');
  if (!clean) return null;
  if (clean.includes(':')) {
    const parts = clean.split(':');
    if (parts.length >= 2) {
      return (parseInt(parts[0], 10) * 60) + parseFloat(parts[1]);
    }
  }
  return parseFloat(clean);
};

const formatTimeDiff = (pbStr, recordStr) => {
  const pbSec = parseTimeSeconds(pbStr);
  const recSec = parseTimeSeconds(recordStr);
  if (pbSec === null || recSec === null || isNaN(pbSec) || isNaN(recSec)) return null;
  const diff = recSec - pbSec; 
  const isFaster = diff >= 0;
  const sign = diff > 0 ? "+" : diff < 0 ? "-" : "";
  const absDiff = Math.abs(diff);
  let diffDisplay;
  if (absDiff >= 60) {
     const m = Math.floor(absDiff / 60);
     let s = (absDiff % 60).toFixed(2);
     if (s < 10) s = "0" + s;
     diffDisplay = `${sign}${m}:${s}`;
  } else {
     diffDisplay = `${sign}${absDiff.toFixed(2)}`;
  }
  return { text: diffDisplay, isFaster: isFaster };
};

export default function VerifyAccreditation() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [eventSettings, setEventSettings] = useState({});
  const [fieldSettings, setFieldSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [athleteMatrix, setAthleteMatrix] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [globSettings, setGlobSettings] = useState({});
  
  const filteredMessages = React.useMemo(() => {
    const allAthleteMessages = messages.filter(m => m.type === "athlete").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const allGlobalMessages = messages.filter(m => m.type === "global").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const allMessages = [...allAthleteMessages, ...allGlobalMessages].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const fallbackGlobalMessage = allGlobalMessages.length === 0 ? eventSettings["broadcast_message"] : null;
    return { allAthleteMessages, allGlobalMessages, allMessages, fallbackGlobalMessage };
  }, [messages, eventSettings]);

  useEffect(() => { if (id) loadAll(); }, [id]);
  useEffect(() => { if (data?.event_id && data?.role) loadMessages(); }, [data]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let accData, accErr;
      const fetchAccreditation = async () => {
        if (isUUID) {
          const { data: byAcc } = await supabase.from("accreditations").select("*, events:event_id(id, name, start_date, logo_url)").eq("accreditation_id", id).maybeSingle();
          if (byAcc) return { data: byAcc, error: null };
          return supabase.from("accreditations").select("*, events:event_id(id, name, start_date, logo_url)").eq("id", id).maybeSingle();
        }
        return supabase.from("accreditations").select("*, events:event_id(id, name, start_date, logo_url)").eq("accreditation_id", id).maybeSingle();
      };
      const { data: fetchedData, error: fetchedError } = await fetchAccreditation();
      accData = fetchedData; accErr = fetchedError;
      if (accErr) throw accErr;
      if (!accData) throw new Error("Accreditation not found");

      const [eSettings, fieldSets, matrix, gSettings] = await Promise.all([
        accData?.event_id ? EventSettingsAPI.getAll(accData.event_id) : Promise.resolve({}),
        accData?.event_id ? FormFieldSettingsAPI.getByEventId(accData.event_id) : Promise.resolve({}),
        accData?.id && accData?.role?.toLowerCase() === "athlete" ? AthleteEventsAPI.getForAthlete(accData.id) : Promise.resolve([]),
        GlobalSettingsAPI.getAll()
      ]);

      setData(accData); setEventSettings(eSettings); setFieldSettings(fieldSets || {}); setAthleteMatrix(matrix || []); setGlobSettings(gSettings || {});
    } catch (err) { console.error(err); setError(err.message || "Not found"); } finally { setLoading(false); }
  };

  const loadMessages = async () => {
    try {
      if (!data?.event_id || !data?.id) return;
      const msgs = await BroadcastV2API.getForAthlete(data.event_id, data.id);
      setMessages(msgs || []);
      const readIds = JSON.parse(localStorage.getItem('qr_read_msgs') || "[]");
      setUnreadTotal(msgs?.filter(m => m.id && !readIds.includes(m.id)).length || 0);
    } catch (err) { console.error(err); }
  };

  const recalculateUnread = () => {
    try {
      const readIds = JSON.parse(localStorage.getItem('qr_read_msgs') || "[]");
      const unread = filteredMessages.allMessages.filter(m => m.id && !readIds.includes(m.id)).length;
      setUnreadTotal(unread);
    } catch (e) { setUnreadTotal(0); }
  };

  useEffect(() => { if (!loading && data) recalculateUnread(); }, [filteredMessages.allMessages, loading, data]);

  const mergedEvents = React.useMemo(() => {
    if (!data) return [];
    const matrixRows = [...athleteMatrix];
    return matrixRows.sort((a, b) => {
        const numA = parseInt(a.event_code, 10);
        const numB = parseInt(b.event_code, 10);
        if (isNaN(numA) && isNaN(numB)) return String(a.event_code).localeCompare(String(b.event_code));
        if (isNaN(numA)) return 1;
        if (isNaN(numB)) return -1;
        return numA - numB;
    });
  }, [athleteMatrix, data]);

  const markAllAsRead = () => {
    try {
      const readIds = JSON.parse(localStorage.getItem('qr_read_msgs') || "[]");
      let updated = false;
      filteredMessages.allMessages.forEach(m => { if (m.id && !readIds.includes(m.id)) { readIds.push(m.id); updated = true; } });
      if (updated) localStorage.setItem('qr_read_msgs', JSON.stringify(readIds));
      setUnreadTotal(0); setShowMessagesModal(true);
    } catch (e) {}
  };

  const expiry = computeExpiryStatus(data);
  const statusConfig = React.useMemo(() => {
    if (data?.status === 'rejected') return { label: 'Rejected', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/40', icon: <XCircle className="w-7 h-7 text-red-500" /> };
    if (data?.status === 'pending') return { label: 'Pending', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/40', icon: <AlertTriangle className="w-7 h-7 text-amber-500" /> };
    if (expiry.isExpired) return { label: 'Expired', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/40', icon: <XCircle className="w-7 h-7 text-red-500" /> };
    return { label: 'Valid', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/40', icon: <CheckCircle className="w-7 h-7 text-emerald-500" /> };
  }, [data?.status, expiry.isExpired]);

  const eventPdfUrl = globSettings[`event_${data?.event_id}_heat_sheet_url`];
  const eventResultPdfUrl = globSettings[`event_${data?.event_id}_event_result_url`];

  const showForQR = (key) => { const loc = fieldSettings[key] || "both"; return loc === "both" || loc === "qr"; };

  if (loading) return <div className="min-h-screen bg-[#050b18] flex items-center justify-center text-slate-500 font-black uppercase tracking-widest text-xs">Loading...</div>;
  if (error || !data) return <div className="min-h-screen bg-[#050b18] flex items-center justify-center text-red-500 font-bold uppercase tracking-widest text-sm">{error || "Data not found"}</div>;

  return (
    <div id="verify-accreditation-page" className="min-h-screen bg-[#050b18] text-slate-200 font-inter selection:bg-cyan-500/30 pb-20 overflow-x-hidden">
      {showMessagesModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-300" onClick={() => setShowMessagesModal(false)}>
          <div className="bg-[#0a1120] w-full max-w-lg rounded-t-[2.5rem] sm:rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-8 max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3"><div className="p-2 bg-cyan-500/10 rounded-xl"><Bell className="w-5 h-5 text-cyan-400" /></div><h2 className="text-xl font-black text-white uppercase tracking-tighter">Event Messages</h2></div>
              <button onClick={() => setShowMessagesModal(false)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-6 h-6 text-white/40" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {filteredMessages.allMessages.length > 0 ? filteredMessages.allMessages.map((m, i) => (
                <div key={m.id || i} className={`p-5 rounded-2xl border backdrop-blur-md ${m.type === "athlete" ? "bg-indigo-500/5 border-indigo-500/20" : "bg-cyan-500/5 border-cyan-500/20"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${m.type === "athlete" ? "bg-indigo-500/20 text-indigo-300" : "bg-cyan-500/20 text-cyan-300"}`}>{m.type === "athlete" ? "Personal" : "Broadcast"}</span>
                    <span className="text-[10px] text-white/30 font-bold">{new Date(m.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-white/80 font-medium leading-relaxed">{m.message}</p>
                </div>
              )) : <div className="h-40 flex flex-col items-center justify-center opacity-20"><MessageSquare className="w-12 h-12 mb-2" /><p className="font-bold uppercase tracking-widest text-xs">No active messages</p></div>}
            </div>
            <button onClick={() => setShowMessagesModal(false)} className="w-full mt-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-black uppercase tracking-widest text-xs transition-all">Close Panel</button>
          </div>
        </div>
      )}

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-xl mx-auto px-4 py-6 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        {eventSettings["banner_url"] && (
          <div className="w-full mb-6 rounded-2xl overflow-hidden shadow-2xl border border-white/5">
            <img src={eventSettings["banner_url"]} alt="banner" className="w-full h-auto object-contain bg-gray-900" />
          </div>
        )}

        <div className={`w-full mb-6 flex items-center justify-between px-6 py-4 rounded-3xl border backdrop-blur-md ${statusConfig.bgColor} ${statusConfig.borderColor} shadow-lg shadow-black/50`}>
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="p-2.5 rounded-xl bg-white/5 shadow-inner">{statusConfig.icon}</div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-black text-xl leading-none uppercase tracking-tighter ${statusConfig.color}`}>{statusConfig.label} Accreditation</h3>
              <p className="text-white/70 text-xs font-bold mt-1.5 uppercase tracking-wide truncate">{data.events?.name}</p>
            </div>
          </div>
          <button onClick={markAllAsRead} className="relative p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all ml-4">
            <Bell className={`w-6 h-6 ${unreadTotal > 0 ? "text-cyan-400 animate-pulse" : "text-white/40"}`} />
            {unreadTotal > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-[#0a1120]">{unreadTotal}</span>}
          </button>
        </div>

        {showForQR("events") && (
          <div className="w-full bg-white rounded-2xl shadow-2xl shadow-black/80 p-5 border border-gray-200 animate-in zoom-in-95 duration-500">
            <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
              <div className="w-20 h-24 border-2 border-gray-200 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50 flex items-center justify-center">
                {data.photo_url ? <img src={data.photo_url} alt="Profile" className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-gray-300" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-blue-900 text-xl uppercase leading-tight truncate">{data.first_name} {data.last_name}</h3>
                <p className="text-slate-500 text-xs mt-1 font-bold uppercase tracking-wider">{data.club || "Independent"}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">
                  <span className="text-[10px] font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded uppercase">{data.role}</span>
                  <span className="text-[10px] font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded uppercase">{data.gender}</span>
                  {data.date_of_birth && <span className="text-[10px] font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded uppercase">Age: {calculateAge(data.date_of_birth, new Date().getFullYear())}</span>}
                </div>
              </div>
            </div>

            <div className="py-4 flex justify-between items-center bg-slate-50/50 -mx-5 px-5 border-b border-gray-100">
              <div>
                <p className="text-[9px] text-slate-400 font-black uppercase">ID: <span className="text-slate-900">{data.accreditation_id?.split("-")?.pop() || "---"}</span></p>
                <p className="text-[9px] text-slate-400 font-black uppercase">Badge: <span className="text-slate-900">{data.badge_number || "---"}</span></p>
              </div>
              <div className="flex items-center gap-2">
                {data.nationality && <div className="flex items-center gap-1.5">{getCountryFlag(data.nationality) && <img src={getCountryFlag(data.nationality)} alt="flag" className="w-8 h-5 rounded-sm shadow-sm" />}<span className="text-xs text-slate-900 font-black uppercase">{data.nationality}</span></div>}
              </div>
            </div>

            {mergedEvents.length > 0 && (
              <div className="mt-4 space-y-4">
                {mergedEvents.map((ev, i) => {
                  let displayName = ev.event_name || ev._ev?.eventName || "";
                  let eventRecords = [];
                  if (displayName.includes("|||RECORD_DATA|||")) {
                    const parts = displayName.split("|||RECORD_DATA|||");
                    displayName = parts[0].trim();
                    try { eventRecords = JSON.parse(parts[1].trim()); } catch(e) {}
                  }
                  
                  let ageRecord = null;
                  if (eventRecords.length > 0 && data.date_of_birth) {
                    const athleteAge = calculateAge(data.date_of_birth, new Date().getFullYear());
                    ageRecord = eventRecords.find(r => athleteAge >= parseInt(r.age, 10)) || eventRecords[0];
                  }

                  return (
                    <div key={i} className="flex flex-col gap-2 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-blue-800 bg-blue-50 px-2 py-0.5 rounded text-[10px] w-8 text-center">{ev.event_code || ev._ev?.eventCode}</span>
                        <span className="text-slate-800 text-xs font-bold leading-tight flex-1">{displayName}</span>
                        {ev.rank && <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">RANK {ev.rank}</span>}
                      </div>
                      
                      <div className="flex items-center justify-between pl-10">
                        {ageRecord && <div className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">{ageRecord.age} REC: {ageRecord.time}</div>}
                        {ev.seed_time && <div className="text-[9px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded uppercase ml-auto flex items-center gap-1.5">
                          PB: {ev.seed_time}
                          {ageRecord && ev.seed_time !== "NT" && (() => {
                            const diff = formatTimeDiff(ev.seed_time, ageRecord.time);
                            return diff && <span className={`px-1 rounded-sm ${diff.isFaster ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>{diff.text}</span>;
                          })()}
                        </div>}
                      </div>

                      {ev.heat && <div className="flex gap-2 pl-10 mt-1"><span className="text-[9px] font-black uppercase text-blue-600 tracking-widest">Heat: {ev.heat}</span><span className="text-[9px] font-black uppercase text-blue-600 tracking-widest">Lane: {ev.lane}</span></div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="w-full mt-8 grid grid-cols-2 gap-3">
          <DownloadField url={data.heat_sheet_url} visible={showForQR("heat_sheet_pdf")} label="Heat List" icon={<FileText className="w-4 h-4" />} color="bg-blue-600" />
          <DownloadField url={data.event_result_url} visible={showForQR("event_result_pdf")} label="Res Sheet" icon={<Building className="w-4 h-4" />} color="bg-emerald-600" />
          <DownloadField url={eventPdfUrl} visible={showForQR("global_pdf")} label="Event PDF" icon={<Calendar className="w-4 h-4" />} color="bg-indigo-600" />
          <DownloadField url={eventResultPdfUrl} visible={showForQR("global_pdf")} label="Results" icon={<Download className="w-4 h-4" />} color="bg-cyan-600" />
        </div>

        <p className="mt-16 text-white/10 text-[9px] uppercase font-black tracking-[0.6em] text-center">Apex Sports Accreditation System</p>
      </div>
    </div>
  );
}

function DownloadField({ url, visible, label, icon, color }) {
  if (!visible || !url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className={`${color} p-4 rounded-xl flex items-center justify-between group transition-all hover:scale-[1.02] active:scale-95 shadow-lg`}>
      <div className="flex flex-col"><span className="text-[8px] text-white/50 uppercase font-black tracking-widest">Download</span><span className="text-xs text-white font-bold">{label}</span></div>
      <div className="p-2 bg-white/10 rounded-lg">{icon}</div>
    </a>
  );
}
