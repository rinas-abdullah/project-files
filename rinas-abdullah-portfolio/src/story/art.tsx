/**
 * Flat illustrations for the walk. Everything is inline SVG so it scales,
 * themes with the time of day (see .art in story.css) and ships no images.
 */
import type { CSSProperties } from "react";

type P = { className?: string; style?: CSSProperties };

/* ------------------------------------------------------------------ */
/* The walker — swap this for your own illustration whenever you like. */
/* ------------------------------------------------------------------ */
export function Walker({ className, style }: P) {
  return (
    <svg viewBox="0 0 100 240" className={className} style={style} aria-hidden="true">
      <ellipse cx="50" cy="234" rx="30" ry="5" fill="rgba(20,16,30,.22)" />
      {/* back leg */}
      <g className="w-leg w-leg-back">
        <rect x="42" y="138" width="14" height="80" rx="6" fill="#d9ccb6" />
        <path d="M40 214h20c6 0 10 4 10 9v3H40z" fill="#b8492f" />
      </g>
      {/* back arm */}
      <g className="w-arm w-arm-back">
        <rect x="44" y="78" width="11" height="62" rx="5.5" fill="#174b4f" />
        <circle cx="49.5" cy="141" r="5.5" fill="#a87150" />
      </g>
      {/* backpack */}
      <rect x="20" y="80" width="22" height="50" rx="8" fill="#d9a441" />
      <rect x="23" y="104" width="16" height="14" rx="4" fill="#c18e30" />
      {/* coat */}
      <path d="M34 76c4-6 28-6 32 0l6 92c-14 6-34 6-46 0z" fill="#1f5f63" />
      <path d="M50 76v90" stroke="#174b4f" strokeWidth="1.5" />
      <path d="M44 74l6 14 6-14" fill="#efe6d6" />
      {/* front leg */}
      <g className="w-leg w-leg-front">
        <rect x="44" y="138" width="14" height="80" rx="6" fill="#efe6d6" />
        <path d="M42 214h20c6 0 10 4 10 9v3H42z" fill="#e2674a" />
      </g>
      {/* front arm */}
      <g className="w-arm w-arm-front">
        <rect x="45" y="78" width="11" height="62" rx="5.5" fill="#24727a" />
        <circle cx="50.5" cy="141" r="5.5" fill="#b8825d" />
      </g>
      {/* head */}
      <rect x="46" y="58" width="10" height="14" rx="3" fill="#a87150" />
      <circle cx="53" cy="44" r="17" fill="#b8825d" />
      <path d="M36 44c-2-14 8-24 20-23 9 1 15 7 14 15-6-4-14-4-18 0-3 3-3 8-6 9-4 1-7-1-10-1z" fill="#2a1e1a" />
      <circle cx="49" cy="46" r="3.2" fill="#a87150" />
      <circle cx="63" cy="43" r="1.6" fill="#2a1e1a" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */

export function Palm({ className, style, flip }: P & { flip?: boolean }) {
  return (
    <svg viewBox="0 0 140 260" className={className} style={{ ...style, transform: flip ? "scaleX(-1)" : undefined }} aria-hidden="true">
      <path d="M66 258c-2-60 2-130 10-190" stroke="#8a6440" strokeWidth="10" fill="none" strokeLinecap="round" />
      {[80, 105, 130, 155, 180, 205, 230].map((y) => (
        <path key={y} d={`M${62 + (258 - y) * 0.06} ${y}h12`} stroke="#6f4f31" strokeWidth="2" />
      ))}
      <g fill="#3f7d4a">
        <path d="M76 66C56 40 26 38 4 52c26-4 48 4 72 14z" />
        <path d="M76 66C60 30 36 14 14 14c22 10 42 28 62 52z" fill="#4c9257" />
        <path d="M76 66c4-30 22-52 46-58-18 14-32 34-46 58z" />
        <path d="M76 66c22-22 46-28 62-18-24 0-42 8-62 18z" fill="#4c9257" />
        <path d="M76 66c26-6 46 6 56 28-18-14-36-20-56-28z" />
        <path d="M76 66c-22-4-46 12-56 38 18-20 36-30 56-38z" fill="#357040" />
      </g>
      <g fill="#c8792e">
        <circle cx="70" cy="74" r="4" />
        <circle cx="78" cy="76" r="4" />
        <circle cx="74" cy="81" r="4" />
      </g>
    </svg>
  );
}

export function Cloud({ className, style }: P) {
  return (
    <svg viewBox="0 0 200 80" className={className} style={style} aria-hidden="true">
      <g style={{ fill: "var(--cloud)" }}>
        <ellipse cx="60" cy="52" rx="48" ry="22" />
        <ellipse cx="104" cy="38" rx="42" ry="30" />
        <ellipse cx="148" cy="52" rx="44" ry="20" />
        <rect x="20" y="52" width="170" height="22" rx="11" />
      </g>
    </svg>
  );
}

/** King Fahd's Fountain — the jet that marks Jeddah's horizon. */
export function Fountain({ className, style }: P) {
  return (
    <svg viewBox="0 0 120 320" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id="jet" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset="1" stopColor="#fff" stopOpacity=".55" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="40" rx="44" ry="26" fill="#fff" opacity=".18" className="fountain-spray" />
      <path d="M58 318C57 200 56 90 58 20h4c2 70 1 180 0 298z" fill="url(#jet)" />
      <path d="M60 22c-18 8-34 40-40 90M60 22c18 8 34 40 40 90" stroke="#fff" strokeOpacity=".5" strokeWidth="3" fill="none" className="fountain-spray" />
      <ellipse cx="60" cy="316" rx="16" ry="4" fill="#fff" opacity=".6" />
      <ellipse cx="60" cy="300" rx="50" ry="120" fill="#ffe9b0" style={{ opacity: "calc(var(--glow) * .18)" }} />
    </svg>
  );
}

const lattice = (id: string, color: string) => (
  <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse">
    <rect width="6" height="6" fill={color} />
    <path d="M0 3h6M3 0v6" stroke="#2b1a10" strokeOpacity=".45" strokeWidth="1" />
  </pattern>
);

/** A Hijazi house from Al-Balad, with wooden roshan bays. */
export function HijaziHouse({ className, style, h = 360, wall = "#ead9bd", wood = "#7b4b2a", lit = false, id }: P & {
  h?: number;
  wall?: string;
  wood?: string;
  lit?: boolean;
  id: string;
}) {
  const floors = Math.max(2, Math.floor((h - 70) / 90));
  return (
    <svg viewBox={`0 0 160 ${h}`} className={className} style={style} aria-hidden="true">
      <defs>{lattice(`lat-${id}`, wood)}</defs>
      <rect x="6" y="18" width="148" height={h - 18} fill={wall} />
      <path d={`M6 18h148`} stroke="#fff" strokeOpacity=".5" strokeWidth="2" />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={8 + i * 16.5} y="6" width="10" height="14" fill={wall} />
      ))}
      {Array.from({ length: Math.floor(h / 22) }, (_, i) => (
        <path key={i} d={`M6 ${30 + i * 22}h148`} stroke="#000" strokeOpacity=".04" strokeWidth="2" />
      ))}
      {Array.from({ length: floors }, (_, f) => {
        const y = 34 + f * 90;
        const wide = f % 2 === 0;
        return (
          <g key={f}>
            <rect x={wide ? 22 : 40} y={y} width={wide ? 116 : 80} height="64" rx="2" fill={`url(#lat-${id})`} />
            <rect x={wide ? 18 : 36} y={y - 6} width={wide ? 124 : 88} height="8" fill={wood} />
            <rect x={wide ? 18 : 36} y={y + 62} width={wide ? 124 : 88} height="8" fill={wood} />
            {lit && <rect x={wide ? 22 : 40} y={y} width={wide ? 116 : 80} height="64" fill="#ffcf73" style={{ opacity: "calc(var(--glow) * .55)" }} />}
          </g>
        );
      })}
      <path d={`M62 ${h}v-40a18 18 0 0 1 36 0v40z`} fill={wood} />
      {lit && <path d={`M62 ${h}v-40a18 18 0 0 1 36 0v40z`} fill="#ffcf73" style={{ opacity: "calc(var(--glow) * .5)" }} />}
    </svg>
  );
}

export function Lighthouse({ className, style }: P) {
  return (
    <svg viewBox="0 0 200 400" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id="beam" x1="0" x2="1">
          <stop offset="0" stopColor="#fff3c4" stopOpacity=".9" />
          <stop offset="1" stopColor="#fff3c4" stopOpacity="0" />
        </linearGradient>
        <clipPath id="tower">
          <path d="M76 120h48l14 280H62z" />
        </clipPath>
      </defs>
      <path className="beam" d="M100 92L200 60v64z" fill="url(#beam)" style={{ opacity: "calc(.15 + var(--glow) * .85)" }} />
      <path d="M76 120h48l14 280H62z" fill="#f7f1e6" />
      <g clipPath="url(#tower)" fill="#d4513a">
        <rect x="40" y="160" width="120" height="40" />
        <rect x="40" y="250" width="120" height="40" />
        <rect x="40" y="340" width="120" height="40" />
      </g>
      <rect x="68" y="110" width="64" height="12" fill="#2b2f3a" />
      <rect x="82" y="78" width="36" height="32" fill="#fff3c4" />
      <rect x="82" y="78" width="36" height="32" fill="#ffd36b" style={{ opacity: "var(--glow)" }} />
      <path d="M80 78h40l-20-22z" fill="#d4513a" />
      <path d="M84 110v-32M100 110v-32M116 110v-32" stroke="#2b2f3a" strokeWidth="2" />
      <rect x="92" y="340" width="16" height="60" rx="8" fill="#2b2f3a" />
    </svg>
  );
}

export function Lanterns({ className, style, count = 8 }: P & { count?: number }) {
  const w = 1000;
  return (
    <svg viewBox={`0 0 ${w} 140`} preserveAspectRatio="none" className={className} style={style} aria-hidden="true">
      <path d={`M0 10Q${w / 2} 110 ${w} 10`} stroke="#3a2c25" strokeWidth="2" fill="none" />
      {Array.from({ length: count }, (_, i) => {
        const t = (i + 1) / (count + 1);
        const x = t * w;
        const y = 10 + 4 * 100 * t * (1 - t) * 1;
        const color = ["#e2674a", "#d9a441", "#2f8f8a", "#c4472c"][i % 4];
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <line y2="10" stroke="#3a2c25" strokeWidth="2" />
            <circle cy="26" r="26" fill="#ffd27a" style={{ opacity: "calc(var(--glow) * .35)" }} />
            <rect x="-9" y="10" width="18" height="30" rx="7" fill={color} />
            <rect x="-9" y="10" width="18" height="30" rx="7" fill="#ffe2a0" style={{ opacity: "calc(var(--glow) * .6)" }} />
            <rect x="-6" y="8" width="12" height="4" fill="#3a2c25" />
          </g>
        );
      })}
    </svg>
  );
}

export function Bench({ className, style }: P) {
  return (
    <svg viewBox="0 0 220 110" className={className} style={style} aria-hidden="true">
      <rect x="10" y="30" width="200" height="12" rx="3" fill="#8a5a3b" />
      <rect x="10" y="52" width="200" height="12" rx="3" fill="#7b4b2a" />
      <rect x="4" y="70" width="212" height="12" rx="3" fill="#8a5a3b" />
      <path d="M26 82v26M194 82v26M26 42v28M194 42v28" stroke="#2b2f3a" strokeWidth="6" />
    </svg>
  );
}

export function Moon({ className, style }: P) {
  return (
    <svg viewBox="0 0 200 200" className={className} style={style} aria-hidden="true">
      <defs>
        <radialGradient id="moon" cx=".4" cy=".38" r=".7">
          <stop offset="0" stopColor="#fff7df" />
          <stop offset=".75" stopColor="#f1dcae" />
          <stop offset="1" stopColor="#d9bd86" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="98" fill="#fff1c9" opacity=".12" />
      <circle cx="100" cy="100" r="70" fill="url(#moon)" />
      <circle cx="78" cy="86" r="12" fill="#d8c08f" opacity=".6" />
      <circle cx="120" cy="120" r="16" fill="#d8c08f" opacity=".5" />
      <circle cx="122" cy="76" r="7" fill="#d8c08f" opacity=".55" />
    </svg>
  );
}
