import React from "react";
import { cn } from "../../lib/utils";

function Badge({ children, className, variant = "default" }) {
  const variants = {
    default: "bg-slate-700/80 text-slate-300 border border-slate-600",
    primary: "bg-primary-500/20 text-primary-300 border border-primary-500/40",
    success: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
    warning: "bg-amber-500/20 text-amber-300 border border-amber-500/40",
    danger: "bg-red-500/20 text-red-300 border border-red-500/40",
    info: "bg-ocean-500/20 text-ocean-300 border border-ocean-500/40"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-lg font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export { Badge };
export default Badge;