"use client";

import Image from "next/image";
import { motion } from "framer-motion";

type Callout = {
  id: string;
  titleAr: string;
  descAr: string;
  x: number; // % position on the photo
  y: number;
  side: "left" | "right";
};

const CALLOUTS: Callout[] = [
  // Right side, top to bottom
  { id: "top", titleAr: "طبقة ملامسة القدم", descAr: "نسيج مريح يراعي التهوية والتعرق وملاءمة الجلد", x: 50, y: 12, side: "right" },
  { id: "comfort", titleAr: "توزيع الضغط", descAr: "طبقة تساعد على توزيع الحمل بانتظام على القدم", x: 50, y: 29, side: "right" },
  { id: "traces", titleAr: "شبكة التوصيل المرنة", descAr: "مسارات إلكترونية مرنة تنقل إشارات المستشعرات، وتتحمل الانحناء المتكرر", x: 58, y: 40, side: "right" },
  { id: "sensors", titleAr: "شبكة المستشعرات", descAr: "عناصر استشعار موزعة على ست مناطق قياس — جُرّبت بأحمال 5–25 كغم", x: 65, y: 43, side: "right" },
  { id: "substrate", titleAr: "الركيزة المرنة", descAr: "طبقة مرنة شفافة تحمل مسارات ومكوّنات الاستشعار", x: 73, y: 46, side: "right" },
  { id: "base", titleAr: "الحماية والدعم الميكانيكي", descAr: "تحمي المستشعرات والمسارات من الإجهاد والرطوبة، وتحافظ على ثبات القياس", x: 50, y: 85, side: "right" },
  // Left side, top to bottom
  { id: "microcore_link", titleAr: "نقطة الاتصال بـ Micro-Core", descAr: "توصيلة رفيعة تربط النسيج بوحدة المعالجة خارج مسار التحميل المباشر", x: 29, y: 46, side: "left" },
  { id: "protected_zone", titleAr: "منطقة محمية خارج التحميل", descAr: "تضمن ألا توضع الإلكترونيات تحت وزن الجسم مباشرة", x: 22, y: 47, side: "left" },
  { id: "heel_zone", titleAr: "منطقة قياس الكعب", descAr: "إحدى مناطق القياس الست — ضغط الكعب أثناء المشي والوقوف", x: 38, y: 52, side: "left" },
];

export default function PadDiagram() {
  return (
    <section className="relative w-full py-20 px-4 sm:px-6 lg:px-12 bg-transparent overflow-hidden font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-[2rem] border border-slate-200/70 bg-white/70 backdrop-blur-sm shadow-[0_20px_60px_rgba(15,23,42,0.06)] p-6 sm:p-10">
          <div className="mb-2" dir="rtl">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-arabic">طبقات نسيج Dithar E-Fabric</h2>
          </div>

          {/* Desktop: real photo with leader-line callouts on both sides */}
          <div className="hidden lg:grid grid-cols-[260px_1fr_260px] gap-4 items-center mt-8">
            {/* Left labels */}
            <div className="flex flex-col gap-10 items-end pr-2" dir="rtl">
              {CALLOUTS.filter((c) => c.side === "left").map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4 }}
                  className="relative text-right"
                >
                  <p className="text-sm font-bold text-slate-900 font-arabic">{c.titleAr}</p>
                  <p className="text-xs text-slate-500 font-arabic leading-snug mt-0.5">{c.descAr}</p>
                  <span className="absolute top-2 -left-6 w-5 border-t border-teal-600/60" />
                  <span className="absolute top-2 -left-6.5 w-1.5 h-1.5 rounded-full bg-teal-600 -translate-x-full" />
                </motion.div>
              ))}
            </div>

            {/* Photo — kept small: the pad itself is thin (2.8mm), the gaps here are only to separate the layers visually */}
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-md aspect-[1408/768]">
                <Image
                  src="/pad-exploded-layers.png"
                  alt="Dithar pad — exploded layers"
                  fill
                  className="object-contain drop-shadow-lg rounded-2xl"
                />
                {CALLOUTS.map((c) => (
                  <span
                    key={c.id}
                    className="absolute w-1.5 h-1.5 rounded-full bg-teal-600 ring-3 ring-teal-600/20 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${c.x}%`, top: `${c.y}%` }}
                  />
                ))}
              </div>
              <p className="mt-3 text-[11px] text-slate-400 font-arabic text-center max-w-55">
                الطبقات مفصولة هنا للتوضيح فقط — سماكة اللبادة الفعلية 2.8 مم، أرق من بطاقة ائتمان.
              </p>
            </div>

            {/* Right labels */}
            <div className="flex flex-col gap-6 items-start pl-2" dir="rtl">
              {CALLOUTS.filter((c) => c.side === "right").map((c) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4 }}
                  className="relative text-right"
                >
                  <p className="text-sm font-bold text-slate-900 font-arabic">{c.titleAr}</p>
                  <p className="text-xs text-slate-500 font-arabic leading-snug mt-0.5">{c.descAr}</p>
                  <span className="absolute top-2 -right-6 w-5 border-t border-teal-600/60" />
                  <span className="absolute top-2 -right-6.5 w-1.5 h-1.5 rounded-full bg-teal-600 translate-x-full" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile: photo + stacked list */}
          <div className="lg:hidden mt-6 flex flex-col items-center">
            <div className="relative w-full max-w-md aspect-[1408/768]">
              <Image
                src="/pad-exploded-layers.png"
                alt="Dithar pad — exploded layers"
                fill
                className="object-contain drop-shadow-lg rounded-2xl"
              />
            </div>
            <p className="mt-3 text-[11px] text-slate-400 font-arabic text-center max-w-55">
              الطبقات مفصولة هنا للتوضيح فقط — سماكة اللبادة الفعلية 2.8 مم، أرق من بطاقة ائتمان.
            </p>
            <div className="mt-6 w-full grid grid-cols-1 sm:grid-cols-2 gap-3" dir="rtl">
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
