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
        "bg-gradient-to-br from-swim-deep/80 via-primary-950/60 to-ocean-950/50 border border-primary-500/20 rounded-xl backdrop-blur-xl shadow-xl shadow-primary-900/30",
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
    <div className={cn("px-6 py-4 border-b border-primary-500/20 bg-gradient-to-r from-primary-900/20 to-transparent", className)}>
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
    <div className={cn("px-6 py-4 border-t border-primary-500/20 bg-gradient-to-r from-transparent to-primary-900/20", className)}>
      {children}
    </div>
  );
}

export { Card, CardHeader, CardContent, CardFooter };
export default Card;
