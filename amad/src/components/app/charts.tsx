/** Minimal, dependency-free SVG charts. Every chart plots a documented, persisted metric. */

export function TrendLine({ points, height = 120 }: { points: { label: string; value: number }[]; height?: number }) {
  const w = 600;
  const pad = 24;
  if (points.length === 0) return null;
  const xs = points.map((_, i) => (points.length === 1 ? w / 2 : pad + (i * (w - pad * 2)) / (points.length - 1)));
  const y = (v: number) => height - pad - (v / 100) * (height - pad * 2);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${xs[i].toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="h-auto w-full ltr" role="img" aria-label={`مؤشر الجاهزية عبر ${points.length} جلسة`}>
      {[0, 50, 100].map((g) => (
        <g key={g}>
          <line x1={pad} x2={w - pad} y1={y(g)} y2={y(g)} stroke="var(--amad-border)" strokeWidth="1" />
          <text x={4} y={y(g) + 4} fontSize="10" fill="var(--amad-subtle)">{g}</text>
        </g>
      ))}
      <path d={d} fill="none" stroke="var(--amad-lime)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={xs[i]} cy={y(p.value)} r="3.5" fill="var(--amad-bg)" stroke="var(--amad-lime)" strokeWidth="2">
          <title>{`${p.label}: ${p.value.toFixed(1)}`}</title>
        </circle>
      ))}
    </svg>
  );
}

/** Competency radar (0..1 levels). Needs at least 3 axes to be meaningful; caller falls back to bars otherwise. */
export function Radar({ axes, size = 260 }: { axes: { label: string; value: number }[]; size?: number }) {
  const c = size / 2;
  const r = size / 2 - 62;
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    return [c + Math.cos(a) * r * v, c + Math.sin(a) * r * v];
  };
  const poly = axes.map((a, i) => pt(i, Math.max(0.02, a.value)).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-auto w-full max-w-[300px]" role="img" aria-label="مخطط الكفاءات">
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <polygon key={g} points={axes.map((_, i) => pt(i, g).join(",")).join(" ")} fill="none" stroke="var(--amad-border)" />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="var(--amad-border)" />;
      })}
      <polygon points={poly} fill="rgba(199,242,48,0.18)" stroke="var(--amad-lime)" strokeWidth="1.5" />
      {axes.map((a, i) => {
        const [x, y] = pt(i, 1.2);
        return (
          <text key={a.label} x={x} y={y} fontSize="10" fill="var(--amad-silver)" textAnchor="middle" dominantBaseline="middle">
            {a.label}
            <title>{`${a.label}: ${Math.round(a.value * 100)}٪`}</title>
          </text>
        );
      })}
    </svg>
  );
}
