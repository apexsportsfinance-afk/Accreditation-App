import React from "react";
import { cn } from "../../lib/utils";

function Badge({ children, className, variant = "default" }) {
  const variants = {
    default: "bg-slate-600/90 text-white border border-slate-500",
    primary: "bg-primary-500/30 text-cyan-200 border border-primary-400/50",
    success: "bg-emerald-500/30 text-emerald-200 border border-emerald-400/50",
    warning: "bg-amber-500/30 text-amber-200 border border-amber-400/50",
    danger: "bg-red-500/30 text-red-200 border border-red-400/50",
    info: "bg-blue-500/30 text-blue-200 border border-blue-400/50"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-lg font-semibold",
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
