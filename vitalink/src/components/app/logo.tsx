import Image from "next/image";
import { cn } from "@/lib/utils";

/** Compact mark for small spaces: heartbeat line with a cross, in the brand colours. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#1f3f8c" />
      <path d="M4 19h7l2.5-9 4 14 3-8h7.5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 6v6M21 9h6" stroke="#ef3b3f" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/** The team's VitaLink wordmark (VITA navy, LINK red, heartbeat + cross). */
export function Logo({ className, size = "md", onDark }: { className?: string; size?: "sm" | "md" | "lg"; onDark?: boolean }) {
  const h = size === "lg" ? 56 : size === "sm" ? 24 : 32;
  return (
    <div className={cn("flex w-fit items-center", onDark && "rounded-xl bg-white px-3 py-1.5 shadow-sm", className)}>
      <Image src="/brand/vitalink-logo.png" alt="VitaLink" width={Math.round((h * 640) / 207)} height={h} priority className="h-auto" style={{ height: h, width: "auto" }} />
    </div>
  );
}
