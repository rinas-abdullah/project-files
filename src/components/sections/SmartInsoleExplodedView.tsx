"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type PadPart = {
  id: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  x: string;
  y: string;
};

// Positions are approximate — placed over public/pad-exploded-layers.png
const PAD_PARTS: PadPart[] = [
  {
    id: "top",
    nameAr: "طبقة قابلة للغسل",
    nameEn: "Washable Top Layer",
    descAr: "السطح العلوي القابل للغسل الذي يلامس القدم مباشرةً، للحفاظ على نظافة اللبادة التي تبقى داخل الحذاء باستمرار.",
    x: "50%",
    y: "12%",
  },
  {
    id: "foam",
    nameAr: "طبقة EVA مريحة",
    nameEn: "EVA Comfort Layer",
    descAr: "طبقة EVA مريحة تقع أسفل سطح الملامسة لضمان راحة القدم طوال فترة اللبس.",
    x: "50%",
    y: "30%",
  },
  {
    id: "connector",
    nameAr: "رقاقة NFC",
    nameEn: "NFC Chip",
    descAr: "تعرّف نوع الحذاء عند تركيب الكبسولة، فتستخدم المعايرة الخاصة بهذا الحذاء تلقائياً دون إدخال يدوي من المريض.",
    x: "27%",
    y: "47%",
  },
  {
    id: "sensors",
    nameAr: "حساسات الضغط",
    nameEn: "Pressure Sensors",
    descAr: "حساسات ضغط رقيقة جُرّبت فعلياً بأحمال من 5 إلى 25 كغم في حذاء وشبشب (3 محاولات لكل حمل) — تستجيب للوزن، لكن القياس الدقيق بالكيلوغرام لم يتحقق بعد لأن الحساس يتشبّع عند الأحمال الأعلى.",
    x: "63%",
    y: "40%",
  },
  {
    id: "base",
    nameAr: "طبقة EVA سفلية",
    nameEn: "EVA Bottom Base",
    descAr: "الطبقة الخارجية السفلية التي تشكّل الهيكل الواقي الأساسي للبادة. لا توجد بطارية أو إلكترونيات تحت وزن الجسم في أي من طبقات اللبادة.",
    x: "50%",
    y: "85%",
  },
];

export default function SmartInsoleExplodedView() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activePart = PAD_PARTS.find((p) => p.id === activeId);

  return (
    <section className="relative w-full pt-36 pb-24 bg-transparent overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-semibold tracking-wider text-primary-blue dark:text-medical-blue uppercase mb-3 block font-sans unified-english">
            INTERACTIVE EXPLODED DEMO
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-dark-text font-arabic mb-4 unified-typography">
            العرض المفكك: اللبادة
          </h2>
          <h3 className="text-lg md:text-xl font-light text-primary-blue dark:text-medical-blue mt-2 font-sans tracking-wide">
            Exploded View: The Pad
          </h3>
          <div className="w-24 h-1 bg-primary-blue dark:bg-medical-blue mx-auto rounded-full mt-4"></div>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-10 lg:gap-6" dir="ltr">
          {/* Left (RTL: right): component list */}
          <div className="hidden lg:flex flex-col justify-center w-1/4 z-20 relative" dir="rtl">
            <div className="space-y-6">
              {PAD_PARTS.map((part, idx) => {
                const isActive = activeId === part.id;
                return (
                  <button
                    key={part.id}
                    onClick={() => setActiveId(isActive ? null : part.id)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 text-right cursor-pointer transition-all duration-300 select-none group",
                      isActive ? "scale-[1.03]" : "hover:translate-x-1"
                    )}
                  >
                    <span
                      className={cn(
                        "w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold font-sans border transition-all",
                        isActive
                          ? "border-primary-blue bg-primary-blue/10 text-primary-blue dark:border-medical-blue dark:bg-medical-blue/15 dark:text-medical-blue"
                          : "border-slate-200 bg-slate-50 text-slate-400 dark:border-zinc-800 dark:bg-zinc-900 group-hover:border-primary-blue/50"
                      )}
                    >
                      {idx + 1}
                    </span>
                    <span className="flex-1">
                      <span
                        className={cn(
                          "block font-bold text-sm font-arabic transition-colors",
                          isActive
                            ? "text-primary-blue dark:text-medical-blue"
                            : "text-dark-text group-hover:text-primary-blue dark:group-hover:text-medical-blue"
                        )}
                      >
                        {part.nameAr}
                      </span>
                      <span className="block text-[10px] text-muted-text font-sans uppercase tracking-wide mt-0.5">
                        {part.nameEn}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center: the real exploded photo with numbered hotspots */}
          <div className="w-full lg:w-2/4 flex items-center justify-center relative" dir="ltr">
            <div className="relative w-full max-w-xl aspect-[1408/768] select-none">
              <Image
                src="/pad-exploded-layers.png"
                alt="Dithar pad — exploded layers"
                fill
                className="object-contain drop-shadow-xl rounded-2xl"
              />
              {PAD_PARTS.map((part, idx) => {
                const isActive = activeId === part.id;
                return (
                  <button
                    key={part.id}
                    onClick={() => setActiveId(isActive ? null : part.id)}
                    className="absolute z-20 flex items-center justify-center cursor-pointer focus:outline-none -translate-x-1/2 -translate-y-1/2"
                    style={{ left: part.x, top: part.y }}
                  >
                    {isActive && (
                      <span className="absolute w-8 h-8 rounded-full animate-ping opacity-50 bg-primary-blue/30 dark:bg-medical-blue/30" />
                    )}
                    <span
                      className={cn(
                        "relative flex items-center justify-center w-6 h-6 rounded-full border font-sans text-[10px] font-bold backdrop-blur-md shadow-sm transition-all duration-300",
                        isActive
                          ? "border-primary-blue bg-white/95 text-primary-blue dark:bg-zinc-950/95 dark:border-medical-blue dark:text-medical-blue scale-110"
                          : "border-slate-300 bg-white/80 text-slate-600 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300 hover:scale-105 hover:border-primary-blue/50"
                      )}
                    >
                      {idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden lg:block w-1/4" />

          {/* Mobile list */}
          <div className="lg:hidden flex flex-col space-y-3" dir="rtl">
            {PAD_PARTS.map((part, idx) => (
              <button
                key={part.id}
                onClick={() => setActiveId(activeId === part.id ? null : part.id)}
                className={cn(
                  "p-4 rounded-xl shadow-sm border text-right cursor-pointer transition-all duration-300 flex items-center justify-between gap-3",
                  activeId === part.id
                    ? "bg-primary-blue/5 dark:bg-medical-blue/10 border-primary-blue dark:border-medical-blue"
                    : "bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border-slate-200 dark:border-zinc-800"
                )}
              >
                <span className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold border border-slate-200 bg-slate-50 text-slate-500">
                  {idx + 1}
                </span>
                <span className="flex-1">
                  <h4
                    className={cn(
                      "font-bold text-sm font-arabic",
                      activeId === part.id ? "text-primary-blue dark:text-medical-blue" : "text-dark-text"
                    )}
                  >
                    {part.nameAr}
                  </h4>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Detail card */}
        <div className="max-w-4xl mx-auto mt-16 px-4">
          <AnimatePresence mode="wait">
            {activePart ? (
              <motion.div
                key={activePart.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-xl text-right flex flex-col items-end"
              >
                <div className="flex flex-row-reverse items-center gap-2 mb-3">
                  <h4 className="text-lg font-bold text-dark-text font-arabic">{activePart.nameAr}</h4>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-blue dark:bg-medical-blue" />
                  <span className="text-xs font-semibold text-primary-blue dark:text-medical-blue bg-primary-blue/10 dark:bg-medical-blue/10 px-3 py-1 rounded-full font-sans uppercase tracking-wider">
                    {activePart.nameEn}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-muted-text leading-relaxed font-light font-arabic">
                  {activePart.descAr}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="default-prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white/40 dark:bg-zinc-900/20 border border-dashed border-slate-200 dark:border-zinc-800/60 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[120px]"
              >
                <HelpCircle className="w-8 h-8 text-slate-400 dark:text-zinc-650 mb-3 animate-pulse" />
                <p className="text-sm text-muted-text font-arabic font-light">
                  انقري على أي رقم لرؤية ما جُرّب فعلياً وما هو تصميم في كل طبقة من طبقات اللبادة.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Label */}
        <div className="flex justify-center mt-12">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-500 text-xs font-bold font-arabic">
            <Layers className="w-3.5 h-3.5" />
            عرض تفكيكي توضيحي — حساس الضغط جُرّب فعلياً، باقي الطبقات تصميم
          </span>
        </div>
      </div>
    </section>
  );
}
