"use client";

import { motion } from "framer-motion";
import { RotateCcw, EyeOff, BarChart2, Clock, ShieldCheck, Activity, Heart } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export default function HealthcareGap() {
  const cards = [
    {
      icon: <EyeOff className="w-7 h-7 text-medical-blue" />,
      title: "مراقبة محدودة",
      subtitle: "Limited Monitoring",
      description: "معظم المرضى يتلقون مراقبة أثناء المستشفى وينقطع المتابعة بعد الخروج، مما يزيد من خطر تدهور حالتهم الصحية دون اكتشاف.",
    },
    {
      icon: <RotateCcw className="w-7 h-7 text-medical-blue" />,
      title: "إعادة التنويم",
      subtitle: "Readmissions",
      description: "نسبة عالية من المرضى يعودون للمستشفى خلال 30 يوماً بعد الخروج مما يؤدي إلى تكاليف إضافية ومضاعفات أكبر.",
    },
    {
      icon: <Clock className="w-7 h-7 text-smart-green" />,
      title: "الكشف المتأخر",
      subtitle: "Late Detection",
      description: "تؤدي المضاعفات التي لا يتم اكتشافها في الوقت المناسب إلى نتائج أسوأ، وانخفاض جودة حياة المريض، وتكاليف علاج مرتفعة.",
    },
    {
      icon: <BarChart2 className="w-7 h-7 text-smart-green" />,
      title: "فقدان البيانات الحيوية",
      subtitle: "Missing Functional Data",
      description: "تعتبر البيانات الحيوية التقليدية محدودة للغاية عن فهم الحالة الوظيفية الحقيقية للمريض في الحياة اليومية في بيئته الطبيعية.",
    },
  ];

  return (
    <section
      id="gap"
      className="relative min-h-screen w-full bg-transparent text-[#0F172A] flex flex-col justify-center items-center py-24 px-6 md:px-12 overflow-hidden"
    >

      <div className="w-full max-w-5xl mx-auto z-10 flex flex-col items-center gap-16">

        {/* ── Header block — mirrors Hero titleComponent style ── */}
        <div className="flex flex-col items-center justify-center text-center select-none px-4 max-w-4xl mx-auto">

          {/* Badge */}

          {/* Arabic dominant headline — same size & weight as Hero h1 */}
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-arabic text-[36px] sm:text-[48px] lg:text-[54px] font-bold leading-[1.2] text-[#0F172A] tracking-tight unified-typography"
          >
            الفجوة المخفية بعد الخروج من المستشفى
          </motion.h2>

          {/* English support line — same as Hero h2 */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-3 font-sans text-md sm:text-lg font-light tracking-wide text-slate-400 max-w-2xl leading-relaxed unified-english"
          >
            The Hidden Gap After Hospital Discharge
          </motion.p>

          {/* Description — same as Hero description */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 font-arabic text-sm sm:text-base font-light leading-relaxed text-slate-500 max-w-2xl unified-typography"
          >
            عندما يغادر المريض المستشفى، تنتهي الرعاية السريرية المراقبة. وتبدأ فجوة غامضة في الرعاية المتواصلة تؤدي غالباً إلى تدهور صحي غير متوقع وتكاليف استشفاء طارئة.
          </motion.p>

          {/* Stats row — styled like Hero capability list */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 border-t border-b border-slate-100 py-4 w-full max-w-2xl"
          >
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-3xl font-bold text-medical-blue font-sans">
                <AnimatedCounter end={60} suffix="%" />
              </span>
              <span className="text-xs text-slate-400 font-arabic font-light text-center max-w-35">
                من المرضى بلا متابعة بعد الخروج
              </span>
            </div>
            <span className="hidden md:inline h-10 w-px bg-slate-200" />
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-3xl font-bold text-smart-green font-sans">
                <AnimatedCounter end={20} suffix="%" />
              </span>
              <span className="text-xs text-slate-400 font-arabic font-light text-center max-w-35">
                معدل إعادة التنويم خلال 30 يوم
              </span>
            </div>
          </motion.div>
        </div>

        {/* ── Problem Items — numbered list, no generic cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-0 w-full max-w-4xl mx-auto divide-y divide-slate-100/80 sm:divide-y-0"
        >
          {cards.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="relative flex gap-5 py-8 px-2 group"
            >
              {/* Icon + vertical line */}
              <div className="flex flex-col items-center gap-2 shrink-0 pt-1 z-10">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-slate-100 transition-all duration-300">
                  {card.icon}
                </div>
                {idx < cards.length - 1 && (
                  <div className="hidden sm:block w-px flex-1 bg-slate-200 mt-2" style={{ minHeight: 32 }} />
                )}
              </div>

              {/* Text */}
              <div className="flex flex-col text-right z-10" dir="rtl">
                <h3 className="text-base font-bold text-[#0F172A] font-arabic leading-snug">
                  {card.title}
                </h3>
                <p className="text-[11px] font-semibold text-slate-400 font-sans tracking-wider uppercase mt-0.5 mb-2" dir="ltr">
                  {card.subtitle}
                </p>
                <p className="text-sm text-slate-500 leading-relaxed font-light font-arabic">
                  {card.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Bottom Bar — same style as Hero capability strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-semibold text-slate-500 font-sans tracking-wide border-t border-slate-100 pt-6 w-full max-w-2xl"
        >
          <span className="flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-medical-blue" />
            نتائج أفضل
          </span>
          <span className="hidden md:inline h-3 w-px bg-slate-200" />
          <span className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-smart-green" />
            مراقبة مستمرة
          </span>
          <span className="hidden md:inline h-3 w-px bg-slate-200" />
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-medical-blue" />
            رؤى بالذكاء الاصطناعي
          </span>
        </motion.div>

      </div>
    </section>
  );
}