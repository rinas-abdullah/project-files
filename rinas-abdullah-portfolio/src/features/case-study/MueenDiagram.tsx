import { cn } from "@/lib/cn";

export type MueenNodeId = "cv" | "sensors" | "fusion" | "anomaly" | "predict" | "dashboard" | "teams";

export const mueenNodes: Array<{ id: MueenNodeId; label: string; stage: string; x: number; y: number; body: string }> = [
  { id: "cv", label: "Camera feeds", stage: "Input", x: 90, y: 120, body: "Computer vision reads density and movement from video across the site." },
  { id: "sensors", label: "Field sensors", stage: "Input", x: 90, y: 300, body: "Sensor data adds context the cameras cannot see on their own." },
  { id: "fusion", label: "Sensor fusion", stage: "Fusion", x: 330, y: 210, body: "Vision and sensor streams are aligned into one real-time picture of the crowd." },
  { id: "anomaly", label: "Anomaly detection", stage: "Analytics", x: 570, y: 120, body: "Behavioural analytics flag movement that departs from the expected pattern." },
  { id: "predict", label: "Predictive flow", stage: "Analytics", x: 570, y: 300, body: "Predictive analytics anticipate congestion so flow can be managed early." },
  { id: "dashboard", label: "Ops dashboard", stage: "Operations", x: 810, y: 210, body: "A real-time operational view supporting data-driven decisions." },
  { id: "teams", label: "Safety personnel", stage: "Response", x: 810, y: 370, body: "Teams act on alerts and forecasts — proactive intervention rather than reaction." },
];

const edges: Array<[MueenNodeId, MueenNodeId]> = [
  ["cv", "fusion"],
  ["sensors", "fusion"],
  ["fusion", "anomaly"],
  ["fusion", "predict"],
  ["anomaly", "dashboard"],
  ["predict", "dashboard"],
  ["dashboard", "teams"],
];

/** Upstream/downstream path through a node, used for highlighting. */
const pathOf = (id: MueenNodeId | null) => {
  if (!id) return new Set<string>();
  const set = new Set<string>([id]);
  const walk = (n: MueenNodeId, dir: 0 | 1) =>
    edges.forEach((e) => {
      if (e[dir] === n && !set.has(e[1 - dir])) {
        set.add(e[1 - dir]);
        walk(e[1 - dir] as MueenNodeId, dir);
      }
    });
  walk(id, 0);
  walk(id, 1);
  return set;
};

interface Props {
  active?: MueenNodeId | null;
  onActive?: (id: MueenNodeId | null) => void;
  compact?: boolean;
  className?: string;
}

/** Mu'een system architecture. Interactive in the case study, ambient in the explorer. */
export function MueenDiagram({ active = null, onActive, compact, className }: Props) {
  const lit = pathOf(active);
  const pos = Object.fromEntries(mueenNodes.map((n) => [n.id, n]));
  const W = 170;
  const H = 54;
  const interactive = !!onActive;
  return (
    <svg
      viewBox="0 0 900 440"
      className={cn("h-full w-full", className)}
      role={interactive ? "group" : "img"}
      aria-label="Mu'een architecture: camera feeds and field sensors feed sensor fusion, which drives anomaly detection and predictive flow, which feed an operations dashboard used by safety personnel."
    >
      <defs>
        <marker id="mu-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 8 4 0 8z" fill="#8192A3" />
        </marker>
      </defs>
      {["Input", "Fusion", "Analytics", "Operations"].map((s, i) => (
        <text key={s} x={90 + i * 240} y={34} textAnchor="middle" className="fill-steel-dim font-mono text-[11px] uppercase tracking-[0.16em]">
          {String(i + 1).padStart(2, "0")} {s}
        </text>
      ))}
      {edges.map(([a, b]) => {
        const A = pos[a];
        const B = pos[b];
        const on = active ? lit.has(a) && lit.has(b) : false;
        const x1 = A.x + W / 2;
        const x2 = B.x - W / 2;
        const vertical = A.x === B.x;
        const d = vertical
          ? `M${A.x} ${A.y + H / 2} L${B.x} ${B.y - H / 2 - 4}`
          : `M${x1} ${A.y} C ${x1 + 50} ${A.y}, ${x2 - 50} ${B.y}, ${x2 - 4} ${B.y}`;
        return (
          <g key={`${a}-${b}`}>
            <path d={d} fill="none" stroke={on ? "#65DFFF" : "#8192A3"} strokeOpacity={on ? 0.9 : 0.3} strokeWidth={on ? 1.5 : 1} markerEnd="url(#mu-arrow)" />
            {!compact && (
              <path d={d} fill="none" stroke="#65DFFF" strokeWidth="1.5" strokeDasharray="4 60" className="mu-flow" strokeOpacity={active && !on ? 0.1 : 0.7} />
            )}
          </g>
        );
      })}
      {mueenNodes.map((n) => {
        const on = active === n.id;
        const near = lit.has(n.id);
        return (
          <g
            key={n.id}
            transform={`translate(${n.x - W / 2} ${n.y - H / 2})`}
            tabIndex={interactive ? 0 : undefined}
            role={interactive ? "button" : undefined}
            aria-label={interactive ? `${n.label}: ${n.body}` : undefined}
            aria-pressed={interactive ? on : undefined}
            onPointerEnter={() => onActive?.(n.id)}
            onFocus={() => onActive?.(n.id)}
            onClick={() => onActive?.(n.id)}
            className={cn(interactive && "cursor-pointer outline-none")}
            style={{ opacity: active && !near ? 0.35 : 1, transition: "opacity .4s" }}
          >
            <rect width={W} height={H} fill={on ? "rgba(101,223,255,0.08)" : "#0C1118"} stroke={on ? "#65DFFF" : "#8192A3"} strokeOpacity={on ? 1 : 0.45} />
            <text x={14} y={22} className="fill-steel font-mono text-[10px] uppercase tracking-[0.14em]">{n.stage}</text>
            <text x={14} y={41} className="fill-paper font-display text-[15px]">{n.label}</text>
          </g>
        );
      })}
      <style>{`.mu-flow{animation:mu-dash 3.2s linear infinite}@keyframes mu-dash{to{stroke-dashoffset:-128}}@media (prefers-reduced-motion:reduce){.mu-flow{display:none}}`}</style>
    </svg>
  );
}
