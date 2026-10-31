import { cn } from "@/lib/utils";

export function Progress({ value, className, tone = "navy" }: { value: number; className?: string; tone?: "navy" | "stable" | "warning" | "critical" | "ai" }) {
  const color = { navy: "bg-navy-800", stable: "bg-stable", warning: "bg-warning", critical: "bg-critical", ai: "bg-ai" }[tone];
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
