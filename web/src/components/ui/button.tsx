import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-bold ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none";

    const variantStyles = {
      default: "bg-brand text-white hover:bg-brand-hover shadow-sm",
      destructive: "bg-semantic-red text-white hover:bg-red-700 shadow-sm",
      outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm",
      secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200",
      ghost: "hover:bg-slate-100 text-slate-700 hover:text-slate-900",
      link: "text-brand underline-offset-4 hover:underline",
      success: "bg-semantic-teal text-white hover:bg-teal-700 shadow-sm",
    };

    const sizeStyles = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-[11px]",
      lg: "h-11 rounded-lg px-8 text-sm",
      icon: "h-9 w-9",
    };

    return (
      <button
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
