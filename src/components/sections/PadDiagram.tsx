"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

type Callout = {
  id: string;
  titleAr: string;
  descAr: string;
  // Anchor point on the SVG (viewBox 0 0 1200 620) and the label's vertical slot
  x: number;
  y: number;
  labelY: number;
  side: "left" | "right";
};

const CALLOUTS: Callout[] = [
  // Right side, top to bottom
  { id: "top", titleAr: "الطبقة العلوية", descAr: "قماش مسامي مضاد للبكتيريا", x: 760, y: 128, labelY: 110, side: "right" },
  { id: "comfort", titleAr: "طبقة الراحة", descAr: "إسفنج EVA يوزّع الضغط على القدم", x: 790, y: 196, labelY: 190, side: "right" },
  { id: "traces", titleAr: "مسارات التوصيل", descAr: "خطوط موصلة مطبوعة بين الحساسات", x: 760, y: 290, labelY: 270, side: "right" },
  { id: "sensors", titleAr: "حساسات الضغط", descAr: "أربعة حساسات رقيقة (الدوائر المضيئة) — جُرّبت بأحمال 5–25 كغم", x: 838, y: 316, labelY: 350, side: "right" },
  { id: "substrate", titleAr: "شريحة الحساسات", descAr: "طبقة مرنة شفافة تحمل الدوائر", x: 900, y: 352, labelY: 430, side: "right" },
  { id: "base", titleAr: "القاعدة", descAr: "طبقة EVA مرنة وخفيفة", x: 780, y: 470, labelY: 510, side: "right" },
  // Left side, top to bottom
  { id: "magnet", titleAr: "نقطة التوصيل المغناطيسي", descAr: "تثبت عليها الكبسولة", x: 395, y: 340, labelY: 300, side: "left" },
  { id: "tab", titleAr: "لسان التوصيل", descAr: "عند الكعب من الجهة الخارجية", x: 350, y: 358, labelY: 380, side: "left" },
  { id: "nfc", titleAr: "رقاقة NFC", descAr: "تعرّف الكبسولة بنوع الحذاء", x: 470, y: 400, labelY: 460, side: "left" },
];

// Sensor dots in final (already-offset) SVG coordinates
const SENSOR_DOTS = [
  { x: 548, y: 362 },
  { x: 650, y: 348 },
  { x: 735, y: 372 },
  { x: 838, y: 356 },
];

// A shoe-sole silhouette: heel (narrower, rounded) on the left, toe (wider, rounded) on the right.
const SOLE = "M 300,215 C 300,172 322,136 368,120 C 432,98 552,92 650,95 C 762,99 862,110 908,138 C 940,158 956,184 956,215 C 956,246 940,272 908,292 C 862,320 762,331 650,335 C 552,338 432,332 368,310 C 322,294 300,258 300,215 Z";

const LAYER_DEFS = [
  { id: "top", dy: 0, fill: "url(#layer-top)", stroke: "#94a3b8", opacity: 1 },
  { id: "comfort", dy: 58, fill: "url(#layer-comfort)", stroke: "#64748b", opacity: 1 },
  { id: "sensor", dy: 116, fill: "url(#layer-sensor)", stroke: "#1e293b", opacity: 1 },
  { id: "base", dy: 182, fill: "url(#layer-base)", stroke: "#020617", opacity: 1 },
];

function offsetPath(dy: number) {
  // Translate every y-coordinate in SOLE by dy, keeping the same path shape.
  return SOLE.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_m, x, y) => `${x},${Number(y) + dy}`);
}

export default function PadDiagram() {
  return (
    <section className="relative w-full py-20 px-4 sm:px-6 lg:px-12 bg-transparent overflow-hidden font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-[2rem] border border-slate-200/70 bg-white/70 backdrop-blur-sm shadow-[0_20px_60px_rgba(15,23,42,0.06)] p-6 sm:p-10">
          <div className="flex items-start justify-between mb-2" dir="rtl">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-arabic">مكوّنات لباد دِثار</h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold font-arabic shrink-0">
              <Sparkles className="w-3 h-3" />
              تصوّر تصميمي
            </span>
          </div>

          <div className="relative w-full mt-6" dir="ltr">
            <svg viewBox="0 0 1200 620" className="w-full h-auto select-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="layer-top" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#eef2f6" />
                  <stop offset="100%" stopColor="#c7d0db" />
                </linearGradient>
                <linearGradient id="layer-comfort" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9aa7b8" />
                  <stop offset="100%" stopColor="#6b7a8f" />
                </linearGradient>
                <linearGradient id="layer-sensor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4b5c73" />
                  <stop offset="100%" stopColor="#374254" />
                </linearGradient>
                <linearGradient id="layer-base" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e2635" />
                  <stop offset="100%" stopColor="#0c111c" />
                </linearGradient>
                <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="160%">
                  <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.14" />
                </filter>
              </defs>

              {/* Stacked layers */}
              {LAYER_DEFS.map((l) => (
                <path key={l.id} d={offsetPath(l.dy)} fill={l.fill} stroke={l.stroke} strokeWidth="1.5" filter="url(#soft-shadow)" />
              ))}

              {/* Sensor layer overlay: connector tab + magnetic point + NFC chip + traces + pressure dots */}
              <g>
                {/* Connector tab protruding from heel (left side), on the sensor layer */}
                <path d="M 360,335 L 310,330 C 298,329 289,338 289,350 L 289,372 C 289,384 298,393 310,392 L 360,386 Z" fill="#4b5c73" stroke="#1e293b" strokeWidth="1.5" />
                <circle cx="316" cy="361" r="15" fill="#d6dde6" stroke="#9aa7b8" strokeWidth="2" />
                <circle cx="316" cy="361" r="6.5" fill="#f1f5f9" />

                {/* NFC chip */}
                <rect x="432" y="386" width="52" height="28" rx="4" fill="#1e2635" stroke="#64748b" strokeWidth="1" />
                <text x="458" y="405" textAnchor="middle" fontSize="10" fill="#9aa7b8" fontFamily="sans-serif">NFC</text>

                {/* Circuit traces: smooth curves converging toward the connector tab */}
                <g fill="none" stroke="#5eead4" strokeOpacity="0.5" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M 362,355 C 420,358 480,360 548,362" />
                  <path d="M 362,350 C 460,345 560,346 650,348" />
                  <path d="M 362,365 C 500,375 610,378 735,372" />
                  <path d="M 362,370 C 540,392 700,390 838,356" />
                </g>

                {/* Pressure sensor nodes */}
                {SENSOR_DOTS.map((d, i) => (
                  <g key={i} filter="url(#glow)">
                    <circle cx={d.x} cy={d.y} r="14" fill="#2dd4bf" fillOpacity="0.22" />
                    <circle cx={d.x} cy={d.y} r="7.5" fill="#2dd4bf" />
                    <circle cx={d.x} cy={d.y} r="3" fill="#ecfeff" />
                  </g>
                ))}
              </g>

              {/* Leader lines + dots for callouts — desktop only, labels need the side margins */}
              <g className="hidden lg:inline">
                {CALLOUTS.map((c) => {
                  const endX = c.side === "right" ? 1040 : 160;
                  return (
                    <g key={c.id}>
                      <path
                        d={`M ${c.x},${c.y} L ${(c.x + endX) / 2},${c.y} L ${(c.x + endX) / 2},${c.labelY} L ${endX},${c.labelY}`}
                        fill="none"
                        stroke="#0d9488"
                        strokeWidth="1"
                        strokeOpacity="0.55"
                      />
                      <circle cx={c.x} cy={c.y} r="3.5" fill="#0d9488" />
                      <circle cx={endX} cy={c.labelY} r="3" fill="#0d9488" />
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Text labels with leader lines — desktop only (needs the side margins) */}
            <div className="hidden lg:block">
              {CALLOUTS.map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: c.side === "right" ? 10 : -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4 }}
                  className="absolute"
                  style={{
                    top: `${(c.labelY / 620) * 100}%`,
                    [c.side === "right" ? "left" : "right"]: "88%",
                    transform: "translateY(-50%)",
                    textAlign: c.side === "right" ? "left" : "right",
                  }}
                  dir="rtl"
                >
                  <p className="text-xs sm:text-sm font-bold text-slate-900 font-arabic whitespace-nowrap">{c.titleAr}</p>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-arabic max-w-[150px] sm:max-w-[210px] leading-snug">{c.descAr}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile: stacked list instead of side leader-lines */}
          <div className="lg:hidden mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3" dir="rtl">
            {CALLOUTS.map((c) => (
              <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5 text-right">
                <span className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-900 font-arabic">{c.titleAr}</p>
                  <p className="text-[11px] text-slate-500 font-arabic leading-snug mt-0.5">{c.descAr}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Brand mark */}
          <div className="flex justify-end mt-6 pr-2" dir="ltr">
            <span className="text-[11px] font-bold text-slate-400 font-arabic">دِثار · Dithar</span>
          </div>
        </div>
      </div>
    </section>
  );
}
