import { GRID, PLATES, PLATE_SIZE, iso, plateY } from "./lattice-geometry";
import { cn } from "@/lib/cn";

/** Static isometric drawing of the lattice: first paint, reduced data, and no-WebGL fallback. */
export function LatticeFallback({ active, className }: { active: number; className?: string }) {
  const h = PLATE_SIZE / 2;
  const corners = [
    [-h, -h],
    [h, -h],
    [h, h],
    [-h, h],
  ];
  const pt = (x: number, y: number, z: number) => {
    const p = iso(x, y, z);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  };
  const top = plateY(0);
  const bottom = plateY(PLATES - 1);
  return (
    <svg viewBox="-260 -260 520 520" className={cn("h-full w-full", className)} aria-hidden>
      {corners.map(([x, z]) => (
        <line
          key={`c${x}${z}`}
          x1={iso(x, top + 0.3, z).x}
          y1={iso(x, top + 0.3, z).y}
          x2={iso(x, bottom - 0.3, z).x}
          y2={iso(x, bottom - 0.3, z).y}
          stroke="#8192A3"
          strokeOpacity="0.25"
          strokeWidth="1"
        />
      ))}
      {Array.from({ length: PLATES }, (_, i) => {
        const y = plateY(i);
        const on = i === active;
        const stroke = on ? "#65DFFF" : "#8192A3";
        return (
          <g key={i} style={{ transition: "opacity .6s" }}>
            <polygon
              points={corners.map(([x, z]) => pt(x, y, z)).join(" ")}
              fill={on ? "rgba(101,223,255,0.06)" : "rgba(12,17,24,0.55)"}
              stroke={stroke}
              strokeOpacity={on ? 0.95 : 0.45}
              strokeWidth={on ? 1.4 : 1}
            />
            {Array.from({ length: GRID - 1 }, (_, g) => {
              const t = -h + ((g + 1) * PLATE_SIZE) / GRID;
              return (
                <g key={g} stroke={stroke} strokeOpacity={on ? 0.35 : 0.12} strokeWidth="0.75">
                  <line x1={iso(t, y, -h).x} y1={iso(t, y, -h).y} x2={iso(t, y, h).x} y2={iso(t, y, h).y} />
                  <line x1={iso(-h, y, t).x} y1={iso(-h, y, t).y} x2={iso(h, y, t).x} y2={iso(h, y, t).y} />
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
