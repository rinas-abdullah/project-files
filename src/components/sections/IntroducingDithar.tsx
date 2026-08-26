"use client";

import { useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { Activity, Thermometer, Droplets, HelpCircle, Cpu, Zap, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

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
      title: "مستشعرات الضغط",
      titleEn: "Pressure Sensors",
      desc: "تقوم برسم خريطة توزيع الضغط الديناميكي عبر 14 منطقة حيوية في القدم لتقييم حركة السير واكتشاف مناطق التحميل غير المتوازنة التي قد تسبب قرحاً سكرية.",
      color: "border-primary-blue text-primary-blue bg-primary-blue/5 dark:border-medical-blue/30 dark:text-medical-blue dark:bg-medical-blue/10",
      dotColor: "#1e88c8",
      x: "24%",
      y: "76%",
    },
    {
      id: "temp",
      icon: <Thermometer className="w-5 h-5" />,
      title: "مستشعرات الحرارة",
      titleEn: "Temperature Sensors",
      desc: "ترصد الفروقات الحرارية الدقيقة بين مناطق القدم المختلفة للتنبؤ بالالتهابات الموضعية الصامتة ونقص التروية الدموية الطرفية لدى مرضى السكري.",
      color: "border-primary-blue text-primary-blue bg-primary-blue/5 dark:border-medical-blue/30 dark:text-medical-blue dark:bg-medical-blue/10",
      dotColor: "#ef4444",
      x: "44%",
      y: "52%",
    },
    {
      id: "humidity",
      icon: <Droplets className="w-5 h-5" />,
      title: "مستشعرات الرطوبة",
      titleEn: "Humidity Sensors",
      desc: "تقيس مستويات الرطوبة الدقيقة داخل الحذاء للتأكد من تهوية البيئة الحركية ومنع نمو الفطريات أو تشققات الجلد الجافة.",
      color: "border-primary-blue text-primary-blue bg-primary-blue/5 dark:border-medical-blue/30 dark:text-medical-blue dark:bg-medical-blue/10",
      dotColor: "#06b6d4",
      x: "49%",
      y: "41%",
    },
    {
      id: "motion",
      icon: <HelpCircle className="w-5 h-5" />,
      title: "تتبع الحركة",
      titleEn: "Motion Tracking",
      desc: "وحدة قياس القصور الذاتي (IMU) سداسية المحاور تسجل وتراقب تردد المشي، وطول الخطوة، والتوازن الحركي في الوقت الحقيقي بدقة متناهية.",
      color: "border-primary-blue text-primary-blue bg-primary-blue/5 dark:border-medical-blue/30 dark:text-medical-blue dark:bg-medical-blue/10",
      dotColor: "#6366f1",
      x: "53%",
      y: "22%",
    },
    {
      id: "ai",
      icon: <Cpu className="w-5 h-5" />,
      title: "معالجة الذكاء الاصطناعي",
      titleEn: "AI Processor",
      desc: "معالج مدمج متناهي الصغر يعالج البيانات محلياً لتصفية التشويش وتجهيز المؤشرات وتأمين نقل تدفق البيانات للمنصة السحابية بشكل مشفر.",
      color: "border-primary-blue text-primary-blue bg-primary-blue/5 dark:border-medical-blue/30 dark:text-medical-blue dark:bg-medical-blue/10",
      dotColor: "#8b5cf6",
      x: "55%",
      y: "33%",
    },
    {
      id: "energy",
      icon: <Zap className="w-5 h-5" />,
      title: "حصد الطاقة ذاتياً",
      titleEn: "Energy Harvesting",
      desc: "تقنية كهرضغطية مدمجة تحوّل ضغط الخطوات إلى طاقة كهربائية لشحن وحدة التخزين الداخلية بشكل ذاتي ومستمر دون الحاجة لمصدر شحن خارجي.",
      color: "border-primary-blue text-primary-blue bg-primary-blue/5 dark:border-medical-blue/30 dark:text-medical-blue dark:bg-medical-blue/10",
      dotColor: "#fbbf24",
      x: "36%",
      y: "60%",
    },
    {
      id: "comms",
      icon: <Wifi className="w-5 h-5" />,
      title: "الاتصال اللاسلكي",
      titleEn: "Wireless Comms (BLE)",
      desc: "شريحة بلوتوث مدمجة منخفضة استهلاك الطاقة (BLE) تضمن ربطاً فورياً مستمراً ومحمي بالكامل مع تطبيق المريض ونقل القياسات المعتمدة.",
      color: "border-primary-blue text-primary-blue bg-primary-blue/5 dark:border-medical-blue/30 dark:text-medical-blue dark:bg-medical-blue/10",
      dotColor: "#3b82f6",
      x: "59%",
      y: "27%",
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
            {/* The Smart PAD Photo */}
            <motion.img
              src="/smart-insole-closed.png"
              alt="Dithar Smart PAD"
              className="w-full h-auto object-contain filter drop-shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            />

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
            Meet Dithar Smart PAD
          </h3>
          <p className="text-muted-text text-sm sm:text-base mt-4 leading-relaxed font-light font-arabic">
            دِثار هو لباد طبي ذكي (Smart PAD) مدمج بأحدث تقنيات الاستشعار السريرية لمراقبة المؤشرات الصحية الوظيفية، توزيع الضغط، والحرارة الموضعية للمريض بشكل مستمر ودقيق.
          </p>

          {/* Hotspots Buttons Grid */}
          <div className="grid grid-cols-2 gap-3 mt-8">
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