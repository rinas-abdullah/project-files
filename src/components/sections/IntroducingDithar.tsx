"use client";

import { useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { Activity, HelpCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// Traced from the real assembled-pad photo (public/pad-closed.png) so the
// silhouette matches the actual product shape exactly, then re-styled as an
// original illustration (gradient, fabric texture, teal trim, connector) —
// not a placed photo.
const PAD_SILHOUETTE_PATH =
  "M3330 6239 c-290 -17 -528 -78 -767 -195 -290 -142 -457 -304 -499 -483 -53 -222 48 -609 226 -876 129 -192 330 -395 605 -610 42 -33 91 -72 108 -86 18 -14 50 -36 72 -49 22 -13 90 -56 150 -95 229 -150 248 -160 560 -320 169 -87 254 -126 372 -171 35 -13 89 -37 120 -53 32 -16 87 -38 123 -49 36 -12 142 -49 235 -82 94 -34 197 -71 230 -81 33 -11 105 -38 160 -59 55 -21 132 -47 170 -58 39 -11 120 -38 180 -60 61 -22 146 -53 190 -68 44 -15 116 -40 160 -56 177 -65 363 -131 415 -148 30 -10 87 -33 125 -50 39 -18 105 -43 148 -56 43 -13 99 -34 125 -48 26 -14 90 -39 142 -57 52 -17 123 -47 157 -65 34 -19 95 -43 135 -53 40 -10 96 -29 123 -41 58 -25 192 -70 210 -70 7 0 30 -12 51 -26 21 -15 75 -39 119 -54 44 -15 103 -38 130 -52 28 -14 73 -31 100 -38 28 -7 111 -42 185 -77 74 -36 151 -67 170 -71 44 -7 202 -69 323 -127 52 -25 101 -45 108 -45 16 0 158 -57 174 -70 12 -9 135 -54 285 -103 71 -24 166 -61 285 -112 116 -49 389 -141 539 -181 49 -13 106 -30 125 -37 48 -19 264 -72 376 -92 50 -9 110 -22 135 -30 25 -7 65 -16 88 -19 24 -4 60 -15 80 -25 52 -26 174 -51 215 -44 20 3 59 -2 93 -12 41 -12 90 -16 168 -15 61 1 129 0 151 -3 105 -13 143 -19 177 -29 45 -13 156 6 206 35 26 15 42 17 82 12 41 -6 56 -3 84 14 48 30 72 26 111 -16 33 -36 35 -36 77 -27 25 6 58 6 79 1 29 -7 44 -4 83 17 62 33 100 21 133 -42 39 -77 60 -87 120 -58 27 13 87 31 144 43 20 4 35 -3 61 -26 42 -36 43 -37 97 -13 34 15 49 17 89 9 68 -14 98 -4 122 41 35 65 73 100 153 138 43 20 86 48 95 62 48 71 78 92 131 92 88 0 125 75 60 122 -38 28 -56 62 -65 119 -8 53 -25 87 -54 114 -26 23 -53 81 -45 95 11 18 -21 62 -59 82 -23 11 -54 31 -69 44 -16 13 -41 24 -57 24 -83 0 -182 96 -261 256 -40 80 -62 112 -86 126 -38 23 -46 39 -48 100 -2 56 -20 80 -87 114 -31 16 -54 37 -69 63 -25 45 -36 52 -144 89 -90 31 -125 67 -125 131 -1 126 -71 292 -174 413 -143 167 -360 314 -826 558 -359 188 -960 511 -985 530 -5 4 -91 53 -190 107 -943 523 -1274 641 -2230 792 -585 93 -717 133 -1195 363 -69 33 -183 88 -255 123 -451 218 -1379 489 -2070 604 -245 41 -652 64 -885 50z";

// --- Types ---
type Hotspot = {
  id: string;
  icon: React.ReactNode;
  title: string;
  titleEn: string;
  desc: string;
  color: string; // Tailwind border/text color
  dotColor: string; // Hex color for SVG dot
  x: string; // Left percentage position on image
  y: string; // Top percentage position on image
};

export default function IntroducingDithar() {
  const [selectedHotspot, setSelectedHotspot] = useState<string>("pressure");


  const hotspots: Hotspot[] = [
    {
      id: "pressure",
      icon: <Activity className="w-5 h-5" />,
      title: "حساسات الضغط (في اللبادة)",
      titleEn: "Pressure Sensors (in the Pad)",
      desc: "حساسات ضغط رقيقة داخل اللبادة التي تبقى في الحذاء تستجيب لوزن القدم — جُرّب هذا بأحمال 5 إلى 25 كغم في حذاء وشبشب. القياس الدقيق بالكيلوغرام لم يتحقق بعد؛ الحساس يتشبّع عند الأحمال الأعلى.",
      color: "border-primary-blue text-primary-blue bg-primary-blue/5 dark:border-medical-blue/30 dark:text-medical-blue dark:bg-medical-blue/10",
      dotColor: "#1e88c8",
      x: "50%",
      y: "45%",
    },
    {
      id: "nfc",
      icon: <HelpCircle className="w-5 h-5" />,
      title: "رقاقة NFC (في اللبادة)",
      titleEn: "NFC Chip (in the Pad)",
      desc: "تعرّف نوع الحذاء عند تركيب الكبسولة، فتستخدم المعايرة الخاصة بهذا الحذاء تلقائياً دون إدخال يدوي من المريض.",
      color: "border-primary-blue text-primary-blue bg-primary-blue/5 dark:border-medical-blue/30 dark:text-medical-blue dark:bg-medical-blue/10",
      dotColor: "#06b6d4",
      x: "74%",
      y: "62%",
    },
    {
      id: "eva",
      icon: <Zap className="w-5 h-5" />,
      title: "طبقة EVA وطبقة قابلة للغسل",
      titleEn: "EVA Comfort & Washable Layer",
      desc: "طبقة EVA مريحة وطبقة علوية قابلة للغسل — لا بطارية ولا إلكترونيات تحت وزن الجسم، فقط الحساسات الرقيقة والرقاقة.",
      color: "border-primary-blue text-primary-blue bg-primary-blue/5 dark:border-medical-blue/30 dark:text-medical-blue dark:bg-medical-blue/10",
      dotColor: "#fbbf24",
      x: "17%",
      y: "22%",
    },
  ];

  const activeInfo = hotspots.find((h) => h.id === selectedHotspot) || hotspots[0];

  return (
    <section id="introducing" className="relative w-full py-24 bg-transparent overflow-hidden font-sans scroll-mt-28">

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center" dir="ltr">
        
        {/* Left: Product Photo with Overlay Hotspots (Scaled Up) */}
        <div className="lg:col-span-6 flex justify-center items-center relative order-last lg:order-first">


          {/* Container scaled up to 600px max width */}
          <div className="relative w-full max-w-120 sm:max-w-137.5 lg:max-w-150 select-none transition-all duration-300">
            {/* Original illustration — silhouette traced from the real pad photo, re-drawn with its own gradient, fabric texture and trim color */}
            <motion.svg
              viewBox="0 0 1408 768"
              className="w-full h-auto filter drop-shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              aria-label="Dithar pad illustration"
            >
              <defs>
                <linearGradient id="padIllustrationGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6b7684" />
                  <stop offset="55%" stopColor="#4b5563" />
                  <stop offset="100%" stopColor="#333a44" />
                </linearGradient>
                <pattern id="padFabricTexture" width="14" height="14" patternUnits="userSpaceOnUse">
                  <circle cx="7" cy="7" r="1.1" fill="#000000" opacity="0.18" />
                </pattern>
              </defs>
              <g transform="translate(0,768) scale(0.1,-0.1)">
                <path
                  d={PAD_SILHOUETTE_PATH}
                  fill="url(#padIllustrationGrad)"
                  stroke="#0f6657"
                  strokeWidth="26"
                  strokeLinejoin="round"
                />
                <path d={PAD_SILHOUETTE_PATH} fill="url(#padFabricTexture)" />
              </g>
              {/* Magnetic connector snap */}
              <circle cx="1040" cy="478" r="26" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="3" />
              <circle cx="1040" cy="478" r="14" fill="#f8fafc" />
            </motion.svg>

            {/* Hotspots Overlay */}
            {hotspots.map((hs, index) => {
              const isActive = selectedHotspot === hs.id;
              const badgeNum = index + 1;
              return (
                <button
                  key={hs.id}
                  onClick={() => setSelectedHotspot(hs.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group focus:outline-none z-10"
                  style={{ left: hs.x, top: hs.y }}
                >
                  <div className="relative flex items-center justify-center">
                    {/* Pulsing ring underneath */}
                    {isActive && (
                      <span 
                        className="absolute w-9 h-9 rounded-full animate-ping opacity-60 bg-primary-blue/20 dark:bg-medical-blue/30 border border-primary-blue/30 dark:border-medical-blue/30"
                      />
                    )}
                    
                    {/* Glassmorphic Numbered Badge */}
                    <div 
                      className={cn(
                        "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border transition-all duration-300 font-sans text-xs font-bold backdrop-blur-md shadow-sm select-none",
                        isActive 
                          ? "border-primary-blue bg-white/95 text-primary-blue dark:bg-zinc-950/95 dark:border-medical-blue dark:text-medical-blue shadow-[0_0_15px_rgba(30,136,200,0.4)] scale-110" 
                          : "border-slate-200 bg-white/60 text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400 group-hover:scale-105 group-hover:border-primary-blue/50 dark:group-hover:border-medical-blue/50 group-hover:text-primary-blue dark:group-hover:text-medical-blue group-hover:bg-white/80 dark:group-hover:bg-zinc-900/80"
                      )}
                    >
                      {badgeNum}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Dynamic Info Panel (Aligned RTL) */}
        <div className="lg:col-span-6 flex flex-col text-right" dir="rtl">
          <span className="text-xs font-semibold tracking-wider text-primary-blue dark:text-medical-blue uppercase mb-3 block font-sans">
            TECHNOLOGY UNVEILING
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-dark-text font-arabic leading-tight">
            تعرّف على دِثار
          </h2>
          <h3 className="text-lg md:text-xl font-light text-primary-blue dark:text-medical-blue mt-2 font-sans tracking-wide">
            Meet Dithar: Pad + Magnetic Capsule
          </h3>
          <p className="text-muted-text text-sm sm:text-base mt-4 leading-relaxed font-light font-arabic">
            دِثار لبادة طبية ذكية رقيقة تبقى داخل كل حذاء، وكبسولة إلكترونية واحدة تنتقل بينها وتثبت مغناطيسياً على الكعب من الخارج. اللبادة لا تحمل بطارية أبداً — فالمريض لا ينقل لبادة من حذاء لحذاء، بل ينقل الكبسولة فقط بنقرة واحدة.
          </p>

          {/* Hotspots Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
            {hotspots.map((h, index) => {
              const isSelected = selectedHotspot === h.id;
              const badgeNum = index + 1;
              return (
                 <button
                  key={h.id}
                  onClick={() => setSelectedHotspot(h.id)}
                  className={cn(
                    "flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl border text-right cursor-pointer transition-all duration-300 select-none overflow-hidden",
                    isSelected
                      ? "border-primary-blue bg-primary-blue/5 text-primary-blue dark:border-medical-blue/30 dark:bg-medical-blue/10 dark:text-medical-blue font-semibold translate-x-[-2px] shadow-sm"
                      : "border-slate-200 dark:border-zinc-800 hover:border-slate-350 hover:bg-slate-50 dark:hover:bg-zinc-900 text-dark-text/80"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "p-2 rounded-lg transition-colors shrink-0",
                      isSelected 
                        ? "bg-primary-blue/10 text-primary-blue dark:bg-medical-blue/20 dark:text-medical-blue" 
                        : "bg-slate-100 dark:bg-zinc-900 text-muted-text"
                    )}>
                      {h.icon}
                    </div>
                    <span className="text-xs sm:text-sm font-arabic font-medium truncate">{h.title}</span>
                  </div>
                  
                  {/* Matching index number badge */}
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-sans border transition-all duration-300 shrink-0",
                    isSelected
                      ? "border-primary-blue/30 bg-primary-blue/15 text-primary-blue dark:border-medical-blue/30 dark:bg-medical-blue/25 dark:text-medical-blue"
                      : "border-slate-200 bg-slate-50 text-slate-400 dark:border-zinc-850 dark:bg-zinc-900/60 dark:text-zinc-500"
                  )}>
                    {badgeNum}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Hotspot details with smooth transitions */}
          <div className="mt-8 relative min-h-[140px] w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeInfo.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  "p-6 rounded-2xl border flex flex-col items-end text-right w-full backdrop-blur-sm",
                  activeInfo.color
                )}
              >
                <div className="flex flex-row-reverse items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider font-sans opacity-75">
                    {activeInfo.titleEn} profile
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-bold mb-2 font-arabic">
                  {activeInfo.title} <span className="unified-english">• {activeInfo.titleEn}</span>
                </h4>
                <p className="text-xs sm:text-sm leading-relaxed text-muted-text dark:text-slate-300 font-light font-arabic">
                  {activeInfo.desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

      </div>
    </section>
  );
}