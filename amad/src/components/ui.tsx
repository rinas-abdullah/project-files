import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/**
 * Text wordmark. The approved AMAD logo asset is not in the repository; per the
 * brand brief we use a clean typographic placeholder rather than an approximation
 * of the logo. Replace with the official asset when provided.
 */
export function Wordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-xl";
  return (
    <span className={cx("inline-flex items-baseline gap-2 font-semibold tracking-tight", s)} aria-label="AMAD أمد">
      <span>أَمَد</span>
      <span className="ltr text-lime" style={{ fontSize: "0.62em", letterSpacing: "0.22em" }}>AMAD</span>
    </span>
  );
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 h-10 px-4 whitespace-nowrap";
const buttonVariants = {
  primary: "bg-lime text-ink hover:bg-lime-strong",
  secondary: "bg-surface-2 text-fg border border-line-strong hover:bg-surface-3",
  ghost: "text-silver hover:text-fg hover:bg-surface-2",
  danger: "bg-danger/15 text-danger border border-danger/40 hover:bg-danger/25",
};
export type ButtonVariant = keyof typeof buttonVariants;

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button className={cx(buttonBase, buttonVariants[variant], className)} {...props} />;
}

export function ButtonLink({ variant = "primary", className, ...props }: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return <Link className={cx(buttonBase, buttonVariants[variant], className)} {...props} />;
}

export function Card({ className, children, ...props }: ComponentProps<"section">) {
  return (
    <section className={cx("print-card rounded-lg border border-line bg-surface", className)} {...props}>
      {children}
    </section>
  );
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div>
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-subtle">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

const badgeTones = {
  neutral: "bg-surface-3 text-silver border-line-strong",
  lime: "bg-lime/10 text-lime border-lime/30",
  danger: "bg-danger/10 text-danger border-danger/30",
  warn: "bg-warn/10 text-warn border-warn/30",
  info: "bg-info/10 text-info border-info/30",
  ok: "bg-ok/10 text-ok border-ok/30",
};
export type Tone = keyof typeof badgeTones;

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium leading-none", badgeTones[tone], className)}>{children}</span>;
}

export function Meter({ value, tone = "lime", label }: { value: number; tone?: "lime" | "danger" | "warn" | "info"; label?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = { lime: "bg-lime", danger: "bg-danger", warn: "bg-warn", info: "bg-info" }[tone];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3" role="meter" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cx("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 px-5 py-8">
      <p className="text-sm font-medium text-fg">{title}</p>
      <p className="max-w-prose text-sm text-subtle">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Field({ label, name, error, hint, ...props }: ComponentProps<"input"> & { label: string; name: string; error?: string[]; hint?: string }) {
  const id = `f-${name}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-silver">{label}</label>
      <input
        id={id}
        name={name}
        aria-invalid={!!error?.length}
        aria-describedby={error?.length ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className="h-10 rounded-md border border-line-strong bg-surface-2 px-3 text-sm text-fg placeholder:text-subtle focus:border-lime focus:outline-none aria-[invalid=true]:border-danger"
        {...props}
      />
      {hint && !error?.length && <p id={`${id}-hint`} className="text-xs text-subtle">{hint}</p>}
      {error?.length ? <p id={`${id}-err`} className="text-xs text-danger">{error.join(" · ")}</p> : null}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-subtle">{label}</span>
      <span className="text-2xl font-semibold tabular-nums text-fg">{value}</span>
      {sub && <span className="text-xs text-silver">{sub}</span>}
    </div>
  );
}

export const DIFFICULTY_AR = ["", "مبتدئ", "أساسي", "متوسط", "متقدم", "خبير"];

export function pct(x: number | null | undefined, digits = 0) {
  if (x === null || x === undefined) return "—";
  return `${(x * 100).toFixed(digits)}٪`;
}

export function fmtDate(d: Date | string) {
  return new Intl.DateTimeFormat("ar-SA-u-nu-latn-ca-gregory", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));
}
