import React from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

export function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-primary-400",
  change,
  changeType = "neutral",
  className
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-gradient-to-br from-swim-deep/60 via-primary-950/50 to-ocean-950/40 border border-primary-500/20 rounded-xl p-5 shadow-lg shadow-primary-900/20",
        className
      )}
    >
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-lg text-slate-400 font-extralight mb-1">{title}</p>
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
          {change && (
            <p className={cn(
              "text-sm mt-1 font-medium",
              changeType === "positive" && "text-emerald-400",
              changeType === "negative" && "text-red-400",
              changeType === "neutral" && "text-slate-500"
            )}>
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/20 shadow-sm relative overflow-hidden group">
            <Icon className={cn("w-6 h-6 transition-transform group-hover:scale-110", iconColor)} />
          </div>
        )}
      </div>
      <div className="mt-4 flex items-end gap-1 h-10 opacity-60 hover:opacity-100 transition-opacity">
        {[30, 50, 40, 70, 55, 80, 60, 90, 100].map((h, i) => (
          <div 
            key={i} 
            className="flex-1 rounded-t-sm bg-primary-500 transition-all duration-300 ease-out hover:bg-primary-400"
            style={{ height: `${h}%` }}
          ></div>
        ))}
      </div>
    </motion.div>
  );
}

export default StatsCard;
