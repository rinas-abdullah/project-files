"use client";

import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Activity, Cpu, Thermometer, Footprints } from "lucide-react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

interface Hotspot {
  id: string;
  index: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  dotX: number; // SVG % coordinate X
  dotY: number; // SVG % coordinate Y
  labelY: number; // SVG % coordinate Y for label alignment
  side: "left" | "right";
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const hotspots: Hotspot[] = [
  {
    id: "pressure",
    index: "01",
    nameAr: "مستشعرات الضغط",
    nameEn: "Pressure Sensors",
    descAr: "ترسم خريطة توزيع الضغط الديناميكي عبر 14 منطقة حيوية في القدم لتقييم حركة السير واكتشاف نقاط التحميل غير المتوازنة.",
    descEn: "Maps dynamic pressure distribution across 14 bio-zones to evaluate gait and detect off-balance loading points.",
    dotX: 62,
    dotY: 26,
    labelY: 20,
    side: "left",
    icon: Footprints,
  },
  {
    id: "motion",
    index: "02",
    nameAr: "تحليل الحركة",
    nameEn: "Motion Analysis",
    descAr: "مستشعر القصور الذاتي (IMU) ثلاثي المحاور يقيس اتزان المشي، وطول الخطوة، والتردد الحركي بدقة متناهية.",
    descEn: "3-axis inertial measurement unit (IMU) registers gait symmetry, step length, and motion frequency.",
    dotX: 50,
    dotY: 45,
    labelY: 38,
    side: "right",
    icon: Activity,
  },
  {
    id: "temp",
    index: "03",
    nameAr: "مراقبة الحرارة",
    nameEn: "Temperature Sensors",
    descAr: "ترصد الفروقات الحرارية الدقيقة للتنبؤ بالالتهابات الصامتة ونقص التروية الدموية الطرفية.",
    descEn: "Detects micro-thermal fluctuations to predict silent localized inflammation and arterial insufficiency.",
    dotX: 45,
    dotY: 55,
    labelY: 68,
    side: "left",
    icon: Thermometer,
  },
  {
    id: "ai",
    index: "04",
    nameAr: "معالج الذكاء الاصطناعي",
    nameEn: "AI Processing Core",
    descAr: "معالج مدمج متناهي الصغر يعالج البيانات محلياً لتصفية التشويش وتأمين نقل تدفق البيانات بشكل مشفر.",
    descEn: "Ultra-low power processor computes clinical metrics edge-side, ensuring encrypted data transfer.",
    dotX: 38,
    dotY: 74,
    labelY: 82,
    side: "right",
    icon: Cpu,
  },
];

export default function Hero() {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-screen w-full overflow-hidden bg-transparent flex flex-col justify-start"
    >
      {/* Global background is now loaded from RootLayout */}


      {/* Dynamic 3D Scroll Presentation */}
      <div className="relative z-10 w-full md:-mt-10">
        <ContainerScroll
          titleComponent={
            <div className="flex flex-col items-center justify-center text-center select-none px-4 max-w-4xl mx-auto">
              {/* Arabic Dominant Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.05 }}
                className="font-arabic text-[36px] sm:text-[48px] lg:text-[54px] font-bold leading-[1.2] text-[#0F172A] tracking-tight"
              >
                الرعاية الصحية لا تنتهي عند مغادرة المستشفى
              </motion.h1>

              {/* English Support line */}
              <motion.h2
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.12 }}
                className="mt-3 font-sans text-md sm:text-lg font-light tracking-wide text-slate-400 max-w-2xl leading-relaxed"
              >
                Healthcare does not end when the patient leaves the hospital
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-5 font-arabic text-sm sm:text-base font-light leading-relaxed text-slate-500 max-w-2xl"
              >
                دِثار منصة صحية ذكية تربط اللباد الطبي الذكي (Smart PAD) بمنصة تحليل سريرية متقدمة لمراقبة توزيع الضغط، الحرارة الموضعية، والتغيرات الوظيفية للمريض بشكل استباقي.
              </motion.p>

              {/* Minimal Horizontal Capability List (Replaces all generic cards) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="mt-6.5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500 font-sans tracking-wide border-t border-b border-slate-100 py-3 w-full max-w-2xl"
              >
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-blue" />
                  Pressure Analysis
                </span>
                <span className="hidden md:inline h-3 w-px bg-slate-200" />
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-blue" />
                  Gait Monitoring
                </span>
                <span className="hidden md:inline h-3 w-px bg-slate-200" />
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-blue" />
                  Temperature Tracking
                </span>
                <span className="hidden md:inline h-3 w-px bg-slate-200" />
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-smart-green" />
                  Predictive Insights
                </span>
              </motion.div>


            </div>
          }
        >
          {/* CENTERPIECE: Insole product rendering inside the clinical device frame */}
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-white dark:bg-slate-950">
            {/* Floating Brand Badge */}
            <div className="absolute top-3 right-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xs select-none">
              <Image src="/logo-icon.png" alt="Dithar" width={16} height={16} className="object-contain dark:hidden" />
              <Image src="/logo-icon-white.png" alt="Dithar" width={16} height={16} className="object-contain hidden dark:block" />
              <span className="text-[11px] font-bold font-arabic text-primary-blue dark:text-medical-blue">دِثار Smart PAD</span>
            </div>

            {/* Product Photograph (Full cover fit for landscape diagnostic view) */}
            <div className="absolute inset-0 w-full h-full select-none">
              <Image
                src="/insole-clinical-premium.png"
                alt="DITHAR Smart Clinical PAD"
                fill
                priority
                className="object-cover filter drop-shadow-sm"
              />
            </div>

            <div className="relative w-full h-full flex items-center justify-center max-w-2xl mx-auto select-none">

              {/* DESKTOP BLUEPRINT OVERLAYS */}
              {!isMobile && (
                <>
                  {/* Instructional hint for user interaction */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs font-sans text-slate-500 dark:text-slate-400 z-20">
                    اضغط على الكلمات لتظهر المعلومات
                  </div>
                  {/* SVG Connecting Lines */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    {hotspots.map((item) => (
                      <g
                        key={item.id}
                        className="transition-all duration-300"
                        style={{
                          opacity: activeHotspot === null ? 0.35 : activeHotspot === item.id ? 1 : 0.1
                        }}
                      >
                        {/* Connecting Line */}
                        <line
                          x1={item.dotX}
                          y1={item.dotY}
                          x2={item.side === "left" ? 18 : 82}
                          y2={item.labelY}
                          stroke={activeHotspot === item.id ? "#39B56A" : "#0B4D8D"}
                          strokeWidth={activeHotspot === item.id ? "0.6" : "0.4"}
                        />
                        {/* Dot on Insole */}
                        <circle
                          cx={item.dotX}
                          cy={item.dotY}
                          r={activeHotspot === item.id ? "1.8" : "1"}
                          fill={activeHotspot === item.id ? "#39B56A" : "#0B4D8D"}
                        />
                        {/* Dot on Label side */}
                        <circle
                          cx={item.side === "left" ? 18 : 82}
                          cy={item.labelY}
                          r="0.8"
                          fill={activeHotspot === item.id ? "#39B56A" : "#0B4D8D"}
                        />
                      </g>
                    ))}
                  </svg>

                  {/* Hotspots clickable triggers on the insole */}
                  {hotspots.map((item) => (
                    <button
                      key={item.id}
                      className="absolute z-20 w-8 h-8 flex items-center justify-center cursor-pointer transition-transform focus:outline-none"
                      style={{
                        left: `${item.dotX}%`,
                        top: `${item.dotY}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      onMouseEnter={() => setActiveHotspot(item.id)}
                      onMouseLeave={() => setActiveHotspot(null)}
                      onClick={() => setActiveHotspot(item.id)}
                    >
                      <span className="relative flex h-3 w-3 items-center justify-center">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 transition-colors duration-300 ${activeHotspot === item.id ? "bg-smart-green/40" : "bg-primary-blue/15"}`} />
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 transition-colors duration-300 ${activeHotspot === item.id ? "bg-smart-green scale-125" : "bg-primary-blue"}`} />
                      </span>
                    </button>
                  ))}

                  {/* Sidebar Annotation Labels */}
                  {hotspots.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeHotspot === item.id;
                    return (
                      <div
                        key={item.id}
                        onMouseEnter={() => setActiveHotspot(item.id)}
                        onMouseLeave={() => setActiveHotspot(null)}
                        onClick={() => setActiveHotspot(item.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setActiveHotspot(item.id);
                          }
                        }}
                        className={`absolute z-20 flex flex-col focus:outline-none transition-all duration-300 cursor-pointer ${item.side === "left" ? "right-[82%] text-right items-end" : "left-[82%] text-left items-start"
                          } ${isActive ? "opacity-100 scale-102" : "opacity-45 hover:opacity-85"}`}
                        style={{
                          top: `${item.labelY}%`,
                          transform: "translateY(-50%)",
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 transition-colors duration-300 ${isActive ? "text-smart-green" : "text-slate-500"}`} />
                          <span className="font-sans text-[9px] font-bold tracking-[0.14em] text-primary-blue uppercase">
                            {item.nameEn}
                          </span>
                        </div>
                        <span className="font-arabic text-xs font-semibold text-slate-800 mt-1">
                          {item.nameAr}
                        </span>

                        <AnimatePresence>
                          {isActive && (
                            <motion.div
                              initial={{ opacity: 0, height: 0, y: -4 }}
                              animate={{ opacity: 1, height: "auto", y: 0 }}
                              exit={{ opacity: 0, height: 0, y: -4 }}
                              transition={{ duration: 0.2 }}
                              className={`mt-1.5 flex flex-col gap-1 max-w-50 overflow-hidden ${item.side === "left" ? "items-end text-right" : "items-start text-left"
                                }`}
                            >
                              <p className="font-arabic text-[10px] font-light leading-relaxed text-slate-500 dark:text-slate-400">
                                {item.descAr}
                              </p>
                              <p className="font-sans text-[8px] text-slate-400 dark:text-slate-500 leading-normal">
                                {item.descEn}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </>
              )}

              {/* MOBILE TRIGGERS */}
              {isMobile && (
                <>
                  {hotspots.map((item) => (
                    <button
                      key={item.id}
                      className="absolute z-20 w-8 h-8 flex items-center justify-center focus:outline-none"
                      style={{
                        left: `${item.dotX}%`,
                        top: `${item.dotY}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                      onClick={() => setActiveHotspot(activeHotspot === item.id ? null : item.id)}
                    >
                      <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${activeHotspot === item.id ? "bg-smart-green" : "bg-primary-blue"}`} />
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${activeHotspot === item.id ? "bg-smart-green" : "bg-primary-blue"}`} />
                      </span>
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Embedded Clinical Detail Widget inside the scanner card (bottom overlay) */}
            <div className="absolute bottom-4 left-6 right-6 z-30 lg:hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeHotspot || "default"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="w-full max-w-lg mx-auto bg-white/95 backdrop-blur-md border border-slate-100/60 shadow-[0_8px_30px_rgba(11,77,141,0.03)] rounded-xl p-3.5"
                >
                  {activeHotspot ? (
                    <div className="flex flex-col text-right">
                      <div className="flex flex-col border-b border-slate-100/50 pb-1.5 mb-1.5">
                        <span className="font-arabic text-xs font-bold text-slate-800">
                          {hotspots.find((h) => h.id === activeHotspot)?.nameAr}
                        </span>
                        <span className="font-sans text-[8px] font-bold tracking-[0.14em] text-smart-green uppercase mt-0.5">
                          {hotspots.find((h) => h.id === activeHotspot)?.nameEn}
                        </span>
                      </div>
                      <p className="font-arabic text-xs font-light leading-relaxed text-slate-600">
                        {hotspots.find((h) => h.id === activeHotspot)?.descAr}
                      </p>
                      <p className="font-sans text-[9px] text-slate-400 mt-1 leading-relaxed">
                        {hotspots.find((h) => h.id === activeHotspot)?.descEn}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-1 text-center select-none">
                      <span className="font-sans text-[8px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        CLINICAL SPECIFICATIONS
                      </span>
                      <p className="font-arabic text-[11px] font-light text-slate-500 mt-1">
                        {isMobile
                          ? "انقر على النقاط النشطة لاستكشاف مكونات اللباد الطبي الذكي"
                          : "مرر الفأرة فوق نقاط الاستشعار لاستكشاف مكونات اللباد الطبي الذكي"
                        }
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </ContainerScroll>
      </div>


    </section>
  );
}