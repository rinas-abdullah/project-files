"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

type Stage = 0 | 1 | 2 | 3;

const STAGE_DURATIONS: Record<Stage, number> = {
  0: 1800,
  1: 2800,
  2: 2800,
  3: 3800,
};

const NOTIFICATIONS: { stage: Stage; time: string; badge: string; text: string }[] = [
  {
    stage: 1,
    time: "الآن",
    badge: "تنبيه فوري",
    text: "تجاوزت الحد الذي حدده طبيبك للتحميل على القدم.",
  },
  {
    stage: 2,
    time: "بعد تكرار التجاوز",
    badge: "إشعار للعائلة",
    text: "تكرر التجاوز، فتم إشعار جهة الاتصال المحددة للمتابعة.",
  },
  {
    stage: 3,
    time: "بعد عدة أيام",
    badge: "متابعة الطبيب",
    text: "استمر الأمر لأيام، فأصبحت أعلى قائمة المتابعة عند طبيبك.",
  },
];

export default function AlertLockScreen({ onStageChange }: { onStageChange?: (stage: Stage) => void }) {
  const [now, setNow] = useState<Date | null>(null);
  const [stage, setStage] = useState<Stage>(0);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const immediate = setTimeout(tick, 0);
    const clock = setInterval(tick, 15000);
    return () => {
      clearTimeout(immediate);
      clearInterval(clock);
    };
  }, []);

  useEffect(() => {
    onStageChange?.(stage);
  }, [stage, onStageChange]);

  useEffect(() => {
    const t = setTimeout(() => {
      setStage((s) => ((s + 1) % 4) as Stage);
    }, STAGE_DURATIONS[stage]);
    return () => clearTimeout(t);
  }, [stage]);

  const timeLabel = now
    ? now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", hour12: false })
    : "--:--";
  const dateLabel = now
    ? now.toLocaleDateString("ar-SA-u-ca-gregory", { weekday: "long", day: "numeric", month: "long" })
    : "";

  const visible = NOTIFICATIONS.filter((n) => n.stage <= stage);

  return (
    <div className="relative w-full max-w-62 mx-auto select-none">
      <div className="relative aspect-9/[18.5] w-full rounded-[2.2rem] border-[6px] border-slate-900 bg-linear-to-b from-[#0B2A4A] via-[#0B1E35] to-[#050D1A] overflow-hidden shadow-2xl">
        {/* notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-900 rounded-b-2xl z-20" />

        <div className="relative h-full flex flex-col items-center pt-10 px-3 pb-5" dir="rtl">
          <p className="text-white/70 text-[11px] font-arabic">{dateLabel}</p>
          <p className="text-white text-4xl font-bold font-sans tracking-tight mt-1" dir="ltr">
            {timeLabel}
          </p>

          <div className="mt-5 w-full flex-1 flex flex-col gap-2">
            <AnimatePresence>
              {visible.map((n) => (
                <motion.div
                  key={n.stage}
                  initial={{ opacity: 0, y: -14, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-full rounded-2xl bg-white/12 backdrop-blur-md border border-white/10 p-2.5 flex items-start gap-2.5"
                >
                  <div className="w-7 h-7 rounded-lg bg-white shrink-0 flex items-center justify-center overflow-hidden mt-0.5">
                    <Image src="/logo-icon.png" alt="" width={18} height={18} className="object-contain" />
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-white text-[10px] font-bold font-arabic">دِثار</span>
                      <span className="text-white/50 text-[9px] font-arabic shrink-0">{n.time}</span>
                    </div>
                    <p className="text-white/55 text-[9px] font-bold font-arabic uppercase tracking-wide mt-0.5">
                      {n.badge}
                    </p>
                    <p className="text-white text-[11px] font-arabic leading-snug mt-1">{n.text}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {stage === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 flex items-center justify-center gap-1.5 text-white/40 text-[10px] font-arabic"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                جاري المراقبة...
              </motion.div>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-white/30 text-[9px] font-arabic">
            <span className="w-8 h-1 rounded-full bg-white/25" />
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-slate-400 font-arabic text-center leading-relaxed">
        محاكاة لتسلسل التنبيه عبر الوقت — الفواصل الزمنية الحقيقية أطول بكثير (تكرار، ثم أيام)، وضُغطت هنا للعرض فقط.
      </p>
    </div>
  );
}
