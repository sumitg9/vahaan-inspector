import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "border-transparent bg-brand text-white",
    secondary: "border-transparent bg-slate-100 text-slate-900",
    destructive: "border-transparent bg-red-50 text-semantic-red border border-red-200",
    outline: "text-slate-700 border border-slate-300",
    success: "border-teal-200 bg-teal-50 text-semantic-teal border",
    warning: "border-amber-200 bg-amber-50 text-amber-700 border",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
