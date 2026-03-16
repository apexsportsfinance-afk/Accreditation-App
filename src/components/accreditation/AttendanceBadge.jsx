import React from 'react';
import { CheckCircle2, Clock, MinusCircle } from 'lucide-react';

export default function AttendanceBadge({ status, time }) {
  if (status === 'present') {
    return (
      <div className="flex flex-col items-start gap-0.5 group-hover:-translate-y-0.5 transition-transform duration-300">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-500/20 to-emerald-400/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-bold tracking-wide shadow-lg shadow-emerald-900/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Checked In
        </span>
        {time && (
          <span className="text-[9px] text-emerald-500/60 font-medium pl-2 uppercase tracking-widest">
            {time}
          </span>
        )}
      </div>
    );
  }

  if (status === 'late') {
    return (
      <div className="flex flex-col items-start gap-0.5 group-hover:-translate-y-0.5 transition-transform duration-300">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500/20 to-orange-400/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold tracking-wide shadow-lg shadow-amber-900/20">
          <Clock className="w-3.5 h-3.5" />
          Late Arrival
        </span>
        {time && (
          <span className="text-[9px] text-amber-500/60 font-medium pl-2 uppercase tracking-widest">
            {time}
          </span>
        )}
      </div>
    );
  }

  // default / absent
  return (
    <div className="flex flex-col items-start gap-0.5 group-hover:-translate-y-0.5 transition-transform duration-300 opacity-60">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-transparent border border-dashed border-slate-700 rounded-full text-slate-500 text-xs font-medium tracking-wide">
        <MinusCircle className="w-3.5 h-3.5" />
        Not Arrived
      </span>
    </div>
  );
}
