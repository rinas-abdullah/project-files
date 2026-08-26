"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Activity, ShieldCheck, Cpu, AlertTriangle, MonitorCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: "01",
      icon: <User className="w-6 h-6" />,
      titleAr: "الحركة الطبيعية للمريض",
      titleEn: "Natural Movement",
      desc: "يمارس المريض حياته اليومية المعتادة دون قيود أو أسلاك، مستخدماً اللباد الطبي الذكي دِثار لمراقبة توزيع الأحمال والضغط.",
      specs: ["Thickness: 2.8mm", "Weight: 18g", "Medical Grade", "Battery: 72h"],
    },
    {
      num: "02",
      icon: <Activity className="w-6 h-6" />,
      titleAr: "جمع البيانات الفورية",
      titleEn: "Data Collection",
      desc: "يقوم اللباد الذكي بمسح مستمر للضغط والحرارة والرطوبة والتوازن بمعدل 100 مرة في الثانية بدقة متناهية.",
      specs: ["Rate: 100 Hz", "Nodes: 14 Active", "Calibration: Nominal", "Pressure: Calibrated"],
    },
    {
      num: "03",
      icon: <ShieldCheck className="w-6 h-6" />,
      titleAr: "النقل المشفر الآمن",
      titleEn: "Secure Transmission",
      desc: "تُرسل البيانات الحيوية من اللباد لتطبيق المريض الذكي عبر بلوتوث BLE، ومنه للسحابة الطبية بأعلى درجات التشفير.",
      specs: ["BLE 5.2 Link", "Status: Encrypted", "AES-256 E2EE", "Signal: Excellent"],
    },
    {
      num: "04",
      icon: <Cpu className="w-6 h-6" />,
      titleAr: "تحليل الذكاء الاصطناعي",
      titleEn: "AI Pattern Analysis",
      desc: "تقوم نماذج الذكاء الاصطناعي السحابية بتحليل أنماط الضغط والمؤشرات، ومقارنة القياسات بالخط الأساسي (Baseline) للمريض لتتبع الانحرافات.",
      specs: ["Symmetry: 94.8%", "Balance: 51%L / 49%R", "Style: Dynamic Load", "Stable Pattern"],
    },
    {
      num: "05",
      icon: <AlertTriangle className="w-6 h-6" />,
      titleAr: "رصد التغيرات الشاذة",
      titleEn: "Anomaly Detection",
      desc: "عند اكتشاف أي خلل مثل زيادة الضغط في موضع ما أو ارتفاع موضعي طفيف للحرارة، يتم تحديدها كتغير شاذ صامت.",
      specs: ["Warning: Plantar Overload", "Deviation: +26% Load", "Severity: Moderate Risk"],
    },
    {
      num: "06",
      icon: <MonitorCheck className="w-6 h-6" />,
      titleAr: "تنبيهات للأطباء",
      titleEn: "Actionable Insights",
      desc: "يتم إرسال إشعار فوري وتوصية سريرية للطبيب المعالج عبر منصة دِثار السحابية للتدخل المبكر ومنع المضاعفات.",
      specs: ["Recipient: Dr. Asem Al-Khaldi", "Method: Secure API", "Status: Delivered (ACK)"],
    },
  ];

  const renderPreview = () => {
    return (
      <div className="relative flex items-center justify-center select-none" dir="ltr">
        {/* Large Smart PAD Photo directly on background */}
        <img 
          src="/smart-insole-closed.png" 
          alt="Dithar Smart PAD" 
          className={cn(
            "h-95 sm:h-112.5 md:h-125 lg:h-135 xl:h-145 w-auto object-contain transform -rotate-12 filter transition-all duration-500 drop-shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:drop-shadow-[0_20px_50px_rgba(0,0,0,0.4)]",
            activeStep === 4 ? "brightness-95 contrast-105" : "brightness-100"
          )}
        />

        {/* Overlays on the physical insole */}
        {/* Step 1: Active Sensor Nodes */}
        {activeStep === 1 && (
          <div className="absolute inset-0 pointer-events-none">
            <span className="absolute w-3.5 h-3.5 rounded-full bg-primary-blue shadow-[0_0_12px_#3b82f6] animate-pulse" style={{ left: "45%", top: "70%" }} />
            <span className="absolute w-3.5 h-3.5 rounded-full bg-primary-blue shadow-[0_0_12px_#3b82f6] animate-pulse" style={{ left: "50%", top: "74%" }} />
            <span className="absolute w-3.5 h-3.5 rounded-full bg-primary-blue shadow-[0_0_12px_#3b82f6] animate-pulse" style={{ left: "44%", top: "52%" }} />
            <span className="absolute w-3.5 h-3.5 rounded-full bg-primary-blue shadow-[0_0_12px_#3b82f6] animate-pulse" style={{ left: "48%", top: "46%" }} />
            <span className="absolute w-3.5 h-3.5 rounded-full bg-primary-blue shadow-[0_0_12px_#3b82f6] animate-pulse" style={{ left: "47%", top: "32%" }} />
            <span className="absolute w-3.5 h-3.5 rounded-full bg-primary-blue shadow-[0_0_12px_#3b82f6] animate-pulse" style={{ left: "52%", top: "27%" }} />
            <span className="absolute w-3.5 h-3.5 rounded-full bg-primary-blue shadow-[0_0_12px_#3b82f6] animate-pulse" style={{ left: "56%", top: "22%" }} />
          </div>
        )}



        {/* Step 3: AI Digital Twin Hologram Grid */}
        {activeStep === 3 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg viewBox="0 0 100 150" className="h-52 w-auto text-purple-500/15 transform -rotate-12" fill="currentColor">
              <path d="M50 10 C62 10, 70 20, 68 35 C66 45, 60 52, 60 65 C60 78, 65 85, 65 105 C65 125, 58 140, 50 140 C42 140, 35 125, 35 105 C35 85, 40 78, 40 65 C40 52, 34 45, 32 35 C30 20, 38 10, 50 10 Z" />
            </svg>
            <div className="absolute w-24 h-24 rounded-full border border-purple-500/25 animate-pulse" />
          </div>
        )}

        {/* Step 4: Flashing Warning Red Hotspot on Heel */}
        {activeStep === 4 && (
          <div className="absolute pointer-events-none" style={{ left: "43%", top: "71%" }}>
            <motion.span 
              className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-rose-500/40 animate-ping"
            />
            <span 
              className="absolute -translate-x-1/2 -translate-y-1/2 w-5.5 h-5.5 rounded-full bg-rose-500 border-2 border-white shadow-[0_0_15px_#ef4444]"
            />
          </div>
        )}

        {/* Step 5: Checkmark shield */}
        {activeStep === 5 && (
          <div className="absolute w-14 h-14 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.35)] animate-pulse pointer-events-none">
            <ShieldCheck className="w-7 h-7" />
          </div>
        )}
      </div>
    );
  };

  return (
    <section id="workflow" className="relative w-full bg-transparent text-dark-text py-24 px-6 md:px-12 flex flex-col justify-center items-center overflow-hidden scroll-mt-28">

      <div className="w-full max-w-7xl mx-auto z-10">
        {/* Title Block */}
        <div className="flex flex-col items-center justify-center text-center mb-16 select-none">
          <span className="text-xs font-semibold tracking-wider text-primary-blue dark:text-medical-blue uppercase mb-3 font-sans unified-english">
            CONTINUOUS CARE WORKFLOW
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-arabic leading-tight">
            كيف يعمل دِثار؟
          </h2>
          <h3 className="text-xl sm:text-2xl font-light text-primary-blue dark:text-medical-blue mt-2 font-sans unified-english">
            How Dithar Works
          </h3>
          <p className="text-muted-text text-sm md:text-base mt-4 max-w-2xl font-light leading-relaxed font-arabic">
            من الخطوة الأولى للمريض وحتى اتخاذ القرار الطبي السريري المناسب، تعمل التقنية بشكل خفي، متواصل، ودقيق.
          </p>
        </div>

        {/* Dynamic Timeline Layout */}
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch mt-8">
          
          {/* Left Column (DOM First in code, but order-1 on mobile & order-2 on desktop -> renders Left in RTL layout) */}
          <div className="order-1 lg:order-2 lg:col-span-6 flex items-center justify-center relative min-h-100 sm:min-h-120 lg:min-h-135">
            {renderPreview()}
          </div>

          {/* Right Column (DOM Second in code, but order-2 on mobile & order-1 on desktop -> renders Right in RTL layout) */}
          <div className="order-2 lg:order-1 lg:col-span-6 flex flex-col gap-4 text-right justify-center" dir="rtl">
            <div className="relative flex flex-col gap-3 pr-6 border-r-2 border-slate-200/60 dark:border-zinc-800/80 mr-2">
              {steps.map((s, idx) => {
                const isActive = activeStep === idx;
                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setActiveStep(idx)}
                    onClick={() => setActiveStep(idx)}
                    className="cursor-pointer group select-none relative py-3.5 transition-all duration-300"
                  >
                    {/* Pulsing indicator marker on the active timeline line */}
                    <div className="absolute -right-7.75 top-1/2 -translate-y-1/2 flex items-center justify-center z-10">
                      <div 
                        className={cn(
                          "w-4 h-4 rounded-full border-2 transition-all duration-300 flex items-center justify-center",
                          isActive 
                            ? "border-primary-blue bg-white dark:bg-zinc-950 scale-125" 
                            : "border-slate-300 bg-slate-100 dark:border-zinc-850 dark:bg-zinc-900 group-hover:border-primary-blue/60"
                        )}
                      >
                        {isActive && (
                          <motion.span 
                            layoutId="activeTimelineIndicator" 
                            className="w-1.5 h-1.5 rounded-full bg-primary-blue" 
                          />
                        )}
                      </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex flex-row-reverse items-center justify-between gap-4">
                      <div className="flex flex-row-reverse items-center gap-4">
                        <div className={cn(
                          "p-3 rounded-2xl border transition-all duration-300 shrink-0",
                          isActive 
                            ? "bg-primary-blue/10 border-primary-blue/30 text-primary-blue dark:bg-medical-blue/20 dark:border-medical-blue/30 dark:text-medical-blue shadow-sm scale-105" 
                            : "bg-slate-50 dark:bg-zinc-950 border-slate-200/50 dark:border-zinc-850 text-slate-400 dark:text-zinc-500 group-hover:border-slate-350 dark:group-hover:border-zinc-800"
                        )}>
                          {s.icon}
                        </div>
                        
                        <div className="flex flex-col items-start text-right">
                          <span className={cn(
                            "text-[9px] font-bold tracking-wider uppercase font-sans transition-colors",
                            isActive ? "text-primary-blue dark:text-medical-blue" : "text-slate-400 dark:text-zinc-500"
                          )}>
                            {s.titleEn}
                          </span>
                          <h4 className={cn(
                            "text-base sm:text-lg font-bold font-arabic leading-snug transition-colors",
                            isActive ? "text-dark-text dark:text-zinc-100" : "text-slate-500 dark:text-zinc-400 group-hover:text-slate-700 dark:group-hover:text-zinc-300"
                          )}>
                            {s.titleAr}
                          </h4>
                        </div>
                      </div>
                      
                      <span className={cn(
                        "text-[10px] font-bold font-sans transition-colors px-2 py-0.5 rounded-full border",
                        isActive
                          ? "border-primary-blue/20 bg-primary-blue/5 text-primary-blue dark:border-medical-blue/20 dark:bg-medical-blue/10 dark:text-medical-blue"
                          : "border-slate-200 bg-slate-50 text-slate-450 dark:border-zinc-800 dark:bg-zinc-950/20 dark:text-zinc-550"
                      )}>
                        STEP {s.num}
                      </span>
                    </div>

                    {/* Description showing only for active step */}
                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <p className="text-xs sm:text-sm text-muted-text dark:text-zinc-400 mt-2.5 leading-relaxed font-light font-arabic pr-16 max-w-[95%]">
                            {s.desc}
                          </p>

                          {/* Technical Callout Specs Badges */}
                          <div className="flex flex-wrap gap-2 mt-3.5 pr-16 justify-end select-none" dir="ltr">
                            {s.specs.map((spec, specIdx) => {
                              let badgeColor = "bg-primary-blue/5 border-primary-blue/15 text-primary-blue dark:bg-medical-blue/10 dark:border-medical-blue/20 dark:text-medical-blue";
                              if (idx === 2) badgeColor = "bg-emerald-500/5 border-emerald-500/15 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400";
                              if (idx === 3) badgeColor = "bg-purple-500/5 border-purple-500/15 text-purple-600 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-400";
                              if (idx === 4) badgeColor = "bg-rose-500/5 border-rose-500/15 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400";
                              if (idx === 5) badgeColor = "bg-teal-500/5 border-teal-500/15 text-teal-600 dark:bg-teal-500/10 dark:border-teal-500/20 dark:text-teal-400";
                              
                              return (
                                <span 
                                  key={specIdx} 
                                  className={cn(
                                    "text-[9px] font-mono px-2.5 py-0.5 rounded-full border tracking-wide shadow-2xs font-semibold",
                                    badgeColor
                                  )}
                                >
                                  {spec}
                                </span>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
