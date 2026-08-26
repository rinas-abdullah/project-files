import React from "react";
import { cn } from "@/lib/utils";

/**
 * Clinical Medical Card
 * Replaces old GlassCard. Uses standard div, no framer-motion, clean clinical borders.
 */
export const GlassCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";

/**
 * Clinical Button
 * Standardized sizes, 10-12px rounded borders.
 */
export const GlassButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }>(
  ({ className, variant = "primary", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "px-4 py-2 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          variant === "primary" && "bg-[#0B4D8D] text-white hover:bg-[#083B6C] focus-visible:ring-[#0B4D8D]",
          variant === "secondary" && "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus-visible:ring-slate-200",
          variant === "danger" && "bg-white text-red-600 border border-red-200 hover:bg-red-50 focus-visible:ring-red-200",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
GlassButton.displayName = "GlassButton";

/**
 * Clinical Status Badge
 */
export const GlassBadge = ({ status, children, className }: { status: "success" | "warning" | "critical" | "info" | "neutral", children: React.ReactNode, className?: string }) => {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border",
      status === "success" && "bg-[#ECFDF5] text-[#059669] border-[#059669]/20",
      status === "warning" && "bg-[#FFFBEB] text-[#D97706] border-[#D97706]/20",
      status === "critical" && "bg-[#FEF2F2] text-[#DC2626] border-[#DC2626]/20",
      status === "info" && "bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/20",
      status === "neutral" && "bg-slate-50 text-slate-600 border-slate-200",
      className
    )}>
      {children}
    </span>
  );
};
