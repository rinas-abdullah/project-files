import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold leading-4 whitespace-nowrap", {
  variants: {
    variant: {
      default: "border-transparent bg-navy-900 text-white",
      outline: "border-border text-foreground bg-white",
      muted: "border-transparent bg-muted text-muted-foreground",
      critical: "border-red-200 bg-critical-soft text-red-700",
      criticalSolid: "border-transparent bg-critical text-white",
      warning: "border-amber-200 bg-warning-soft text-amber-800",
      warningSolid: "border-transparent bg-warning text-white",
      stable: "border-teal-200 bg-stable-soft text-teal-800",
      stableSolid: "border-transparent bg-stable text-white",
      info: "border-blue-200 bg-info-soft text-blue-800",
      ai: "border-violet-200 bg-ai-soft text-violet-800",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
