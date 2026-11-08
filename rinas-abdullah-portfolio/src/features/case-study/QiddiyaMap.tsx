import { cn } from "@/lib/cn";

export const qiddiyaContributions = [
  { key: "concept", label: "Game concept", body: "Shaping the idea of a 3D exploration game inspired by Qiddiya City." },
  { key: "gameplay", label: "Gameplay", body: "Designing how players move through and discover the environment." },
  { key: "uiux", label: "UI / UX", body: "Interface and player-facing flows inside the game." },
  { key: "programming", label: "Programming", body: "Implementing gameplay systems in Unity." },
  { key: "environment", label: "3D environment", body: "Building and arranging the explorable 3D world." },
  { key: "testing", label: "Testing", body: "Play-testing and fixing issues under hackathon time pressure." },
  { key: "coordination", label: "Coordination", body: "Keeping a collaborative team aligned on scope and delivery." },
] as const;

export type QiddiyaKey = (typeof qiddiyaContributions)[number]["key"];

interface Props {
  active?: QiddiyaKey | null;
  onActive?: (k: QiddiyaKey | null) => void;
  className?: string;
}

/** Radial contribution map — seven areas Rinas worked across, around the team project. */
export function QiddiyaMap({ active = null, onActive, className }: Props) {
  const R = 160;
  const cx = 260;
  const cy = 230;
  const n = qiddiyaContributions.length;
  const interactive = !!onActive;
  return (
    <svg
      viewBox="0 0 520 460"
      className={cn("h-full w-full", className)}
      role={interactive ? "group" : "img"}
      aria-label="Contribution map: game concept, gameplay, UI/UX, programming, 3D environment, testing and coordination around the team project."
    >
      {[R, R * 0.62, R * 0.3].map((r) => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="#8192A3" strokeOpacity="0.18" />
      ))}
      <line x1={cx - R - 30} y1={cy} x2={cx + R + 30} y2={cy} stroke="#8192A3" strokeOpacity="0.12" />
      <line x1={cx} y1={cy - R - 30} x2={cx} y2={cy + R + 30} stroke="#8192A3" strokeOpacity="0.12" />
      <rect x={cx - 64} y={cy - 22} width={128} height={44} fill="#0C1118" stroke="#E8B45A" strokeOpacity="0.6" />
      <text x={cx} y={cy - 3} textAnchor="middle" className="fill-paper font-display text-[13px]">Team project</text>
      <text x={cx} y={cy + 13} textAnchor="middle" className="fill-amber font-mono text-[9px] uppercase tracking-[0.14em]">Unity · Hackathon</text>
      {qiddiyaContributions.map((c, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const x = cx + Math.cos(a) * R;
        const y = cy + Math.sin(a) * R;
        const on = active === c.key;
        const right = Math.cos(a) > 0.2;
        const left = Math.cos(a) < -0.2;
        return (
          <g
            key={c.key}
            tabIndex={interactive ? 0 : undefined}
            role={interactive ? "button" : undefined}
            aria-pressed={interactive ? on : undefined}
            aria-label={interactive ? `${c.label}: ${c.body}` : undefined}
            onPointerEnter={() => onActive?.(c.key)}
            onFocus={() => onActive?.(c.key)}
            onClick={() => onActive?.(c.key)}
            className={cn(interactive && "cursor-pointer outline-none")}
            style={{ opacity: active && !on ? 0.4 : 1, transition: "opacity .4s" }}
          >
            <line x1={cx + Math.cos(a) * 66} y1={cy + Math.sin(a) * 26} x2={x} y2={y} stroke={on ? "#E8B45A" : "#8192A3"} strokeOpacity={on ? 0.9 : 0.3} />
            <circle cx={x} cy={y} r={on ? 7 : 5} fill={on ? "#E8B45A" : "#0C1118"} stroke="#E8B45A" />
            <circle cx={x} cy={y} r={18} fill="transparent" />
            <text
              x={x + (right ? 14 : left ? -14 : 0)}
              y={y + (right || left ? 4 : Math.sin(a) < 0 ? -16 : 24)}
              textAnchor={right ? "start" : left ? "end" : "middle"}
              className={cn("font-mono text-[11px] uppercase tracking-[0.12em]", on ? "fill-amber" : "fill-paper")}
            >
              {c.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
