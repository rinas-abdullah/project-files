import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#dc2626" />
      <path d="M5 17h6l2.5-6 4 11 3-7.5 1.5 2.5H27" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <div className="leading-none" dir="ltr">
        <div className="text-[15px] font-bold tracking-tight">VitaLink</div>
        <div className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.18em] opacity-60">Ambulance ↔ ED</div>
      </div>
    </div>
  );
}
