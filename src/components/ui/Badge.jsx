import React from "react";
import { cn } from "../../lib/utils";

const variants = {
  default: "bg-slate-800/80 border border-slate-700/50 text-slate-300 shadow-sm",
  primary: "bg-primary-500/15 border border-primary-500/30 text-primary-400 shadow-[0_0_10px_rgba(14,165,233,0.1)]",
  success: "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]",
  warning: "bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]",
  danger: "bg-red-500/15 border border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]",
  info: "bg-blue-500/15 border border-blue-500/30 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]",
  solid: "bg-primary-500 text-white shadow-lg shadow-primary-500/30"
};

export function Badge({ children, variant = "default", className, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-widest",
        variants[variant] || variants.default,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
