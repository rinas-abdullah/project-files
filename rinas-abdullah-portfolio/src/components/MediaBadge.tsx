import type { MediaKind } from "@/types";
import { kindLabel } from "@/lib/media";
import { cn } from "@/lib/cn";

/** Discloses how an image was made. Concept renders are flagged in amber. */
export function MediaBadge({ kind, className }: { kind: MediaKind; className?: string }) {
  const concept = kind === "concept" || kind === "render";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 border bg-obsidian/85 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] backdrop-blur-sm",
        concept ? "border-amber/40 text-amber" : "border-steel/30 text-steel",
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5", concept ? "bg-amber" : "bg-cyan")} />
      {kindLabel[kind]}
    </span>
  );
}
