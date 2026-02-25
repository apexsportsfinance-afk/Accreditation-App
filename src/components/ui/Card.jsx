import React from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

function Card({
  children,
  className,
  hover = false,
  ...props
}) {
  const Component = hover ? motion.div : "div";
  return (
    <Component
      className={cn(
        "bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90 border border-cyan-700/30 rounded-xl backdrop-blur-xl shadow-xl shadow-black/40",
        className
      )}
      {...(hover && {
        whileHover: { scale: 1.02, borderColor: "rgba(0, 188, 212, 0.5)" },
        transition: { duration: 0.2 }
      })}
      {...props}
    >
      {children}
    </Component>
  );
}

function CardHeader({ children, className }) {
  return (
    <div className={cn(
      "px-6 py-4 border-b border-cyan-700/30 bg-gradient-to-r from-slate-800/60 to-transparent",
      className
    )}>
      {children}
    </div>
  );
}

function CardContent({ children, className }) {
  return (
    <div className={cn("p-6", className)}>
      {children}
    </div>
  );
}

function CardFooter({ children, className }) {
  return (
    <div className={cn(
      "px-6 py-4 border-t border-cyan-700/30 bg-gradient-to-r from-transparent to-slate-800/60",
      className
    )}>
      {children}
    </div>
  );
}

export { Card, CardHeader, CardContent, CardFooter };
export default Card;
