import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function ExternalLink({ href, children, className, label }: { href: string; children: ReactNode; className?: string; label?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn("group inline-flex items-center gap-1.5", className)}
    >
      {children}
      <ArrowUpRight aria-hidden className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
