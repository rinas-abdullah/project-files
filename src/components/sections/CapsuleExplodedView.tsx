"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Magnet, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type CapsulePart = {
  id: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  x: string;
  y: string;
};

// Positions are approximate — placed over public/capsule-exploded.jpg
const CAPSULE_PARTS: CapsulePart[] = [
  {
    id: "shell",
    nameAr: "الغلاف الخارجي",
    nameEn: "Outer Shell",
    descAr: "الغلاف الذي يثبّت مغناطيسياً على جانب الكعب من الخارج، ويحوي كل الإلكترونيات — لا شيء منها تحت وزن الجسم.",
    x: "49%",
    y: "16%",
  },
  {
    id: "motion",
    nameAr: "حساس حركة دقيق",
    nameEn: "Tiny Motion Sensor",
    descAr: "يسجّل تردد المشي والميلان والتوازن.",
    x: "50%",
    y: "36%",
  },
  {
    id: "temp",
    nameAr: "حساس حرارة ورطوبة",
    nameEn: "Temperature & Humidity Sensor",
    descAr: "نفس نوع القياس الذي جُرّب فعلياً مبكراً: ارتفاع +4.9°C داخل الحذاء و+1.4°C داخل الشبشب خلال 20 دقيقة.",
    x: "50%",
    y: "43%",
  },
  {
    id: "bluetooth",
    nameAr: "رقاقة بلوتوث",
    nameEn: "Bluetooth Chip",
    descAr: "تنقل البيانات من الكبسولة إلى جوال المريض، ومنه إلى المنصة.",
    x: "50%",
    y: "50%",
  },
  {
    id: "motor",
    nameAr: "هزّاز بحجم العملة",
    nameEn: "Coin-Sized Vibration Motor",
    descAr: "يهتز فوراً عند تجاوز الحد الذي يضعه الطبيب — أول خطوة في التصعيد المتدرج للتنبيه.",
    x: "50%",
    y: "58%",
  },
  {
    id: "battery",
    nameAr: "بطارية قابلة لإعادة الشحن",
    nameEn: "Rechargeable Battery",
    descAr: "تُشحن عبر محطة شحن USB ليلاً — داخل الكبسولة فقط، أبداً تحت القدم.",
    x: "50%",
    y: "66%",
  },
  {
    id: "magnet",
    nameAr: "حلقة مغناطيسية",
    nameEn: "Magnetic Ring",
    descAr: "تثبّت الكبسولة على جانب الكعب، وتسمح بفكها وتركيبها بنقرة واحدة عند تغيير الحذاء.",
    x: "50%",
    y: "73%",
  },
  {
    id: "contacts",
    nameAr: "نقاط تماس الشحن",
    nameEn: "Charging Contact Pads",
    descAr: "تلامس محطة الشحن لتعبئة الكبسولتين (واحدة لكل قدم) ليلاً.",
    x: "54%",
    y: "82%",
  },
];

export default function CapsuleExplodedView() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activePart = CAPSULE_PARTS.find((p) => p.id === activeId);

  return (
    <section className="relative w-full pt-16 pb-24 bg-transparent overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header — mirrors the Pad exploded-view section */}
        <div className="text-center mb-4">
          <span className="text-xs font-semibold tracking-wider text-primary-blue dark:text-medical-blue uppercase mb-3 block font-sans unified-english">
            INTERACTIVE EXPLODED DEMO
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-dark-text font-arabic mb-4 unified-typography">
            العرض المفكك: الكبسولة المغناطيسية
          </h2>
          <h3 className="text-lg md:text-xl font-light text-primary-blue dark:text-medical-blue mt-2 font-sans tracking-wide">
            Exploded View: The Magnetic Capsule
          </h3>
          <div className="w-24 h-1 bg-primary-blue dark:bg-medical-blue mx-auto rounded-full mt-4"></div>
        </div>

        <div className="flex justify-center mb-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold font-arabic">
            <Magnet className="w-3.5 h-3.5" />
            تصميم مفاهيمي — لم تُبنَ الكبسولة بعد
          </span>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-10 lg:gap-6" dir="ltr">
          {/* Left (RTL: right): component list, same visual language as the Pad panel */}
          <div className="hidden lg:flex flex-col justify-center w-1/4 z-20 relative" dir="rtl">
            <div className="space-y-5">
              {CAPSULE_PARTS.map((part, idx) => {
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

          {/* Center: the real photo with numbered hotspots */}
          <div className="w-full lg:w-2/4 flex items-center justify-center relative" dir="ltr">
            <div className="relative w-full max-w-xl aspect-[1179/629] select-none">
              <Image
                src="/capsule-exploded.jpg"
                alt="Dithar magnetic capsule — exploded concept render"
                fill
                className="object-contain drop-shadow-xl rounded-2xl"
              />
              {CAPSULE_PARTS.map((part, idx) => {
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

          {/* Right (RTL: left): matches the Pad panel's placeholder space for symmetry */}
          <div className="hidden lg:block w-1/4" />

          {/* Mobile list */}
          <div className="lg:hidden flex flex-col space-y-3" dir="rtl">
            {CAPSULE_PARTS.map((part, idx) => (
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
        <div className="max-w-4xl mx-auto mt-12 px-4">
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
                className="bg-white/40 dark:bg-zinc-900/20 border border-dashed border-slate-200 dark:border-zinc-800/60 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[100px]"
              >
                <HelpCircle className="w-8 h-8 text-slate-400 dark:text-zinc-650 mb-3" />
                <p className="text-sm text-muted-text font-arabic font-light">
                  انقري على أي رقم لرؤية ماذا يفعل هذا الجزء من الكبسولة.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
