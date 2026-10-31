import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, actions, className, eyebrow }: { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; className?: string; eyebrow?: React.ReactNode }) {
  return (
    <div className={cn("mb-5 flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        {eyebrow ? <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</div> : null}
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Kpi({ label, value, sub, tone = "default", icon, testId }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "default" | "critical" | "warning" | "stable" | "ai" | "info"; icon?: React.ReactNode; testId?: string }) {
  const toneCls = {
    default: "text-foreground",
    critical: "text-critical",
    warning: "text-warning",
    stable: "text-stable",
    ai: "text-ai",
    info: "text-info",
  }[tone];
  return (
    <div className="rounded-xl border bg-card p-4 shadow-[0_1px_2px_rgba(11,26,51,0.04)]" data-testid={testId}>
      <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
        <span className="truncate">{label}</span>
        {icon ? <span className="opacity-70">{icon}</span> : null}
      </div>
      <div className={cn("mt-2 text-2xl font-semibold tabular tracking-tight", toneCls)}>{value}</div>
      {sub ? <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{children}</div>;
}
