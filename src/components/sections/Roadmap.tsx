"use client";

import { motion } from "framer-motion";
import { Milestone, Settings, Building2, Sparkles } from "lucide-react";

const STATUS = {
  done: { label: "منجز", dot: "bg-smart-green", text: "text-smart-green" },
  next: { label: "المرحلة التالية", dot: "bg-amber-500", text: "text-amber-600" },
  upcoming: { label: "قادم", dot: "bg-slate-300", text: "text-slate-400" },
} as const;

export default function Roadmap() {
  const phases = [
    {
      num: "01",
      icon: <Settings className="w-5 h-5 text-primary-blue" />,
      status: STATUS.done,
      title: "التحقق والنموذج الأولي • Validation & Prototype",
      desc: "بناء واختبار النموذج الأولي الأول لنسيج Dithar E-Fabric ووحدة Micro-Core، والتحقق المبدئي من استجابة المستشعرات للحمل والحرارة والرطوبة في بيئة منزلية — قبل أي تجربة سريرية.",
    },
    {
      num: "02",
      icon: <Building2 className="w-5 h-5 text-medical-blue" />,
      status: STATUS.next,
      title: "الإطلاق المؤسسي بعد الاعتماد التنظيمي • Institutional Hospital Launch",
      desc: "استكمال الاعتمادات والتراخيص التنظيمية اللازمة، ثم إطلاق فئة التأهيل بعد جراحات القدم والكاحل ضمن المستشفيات والمنظومات الطبية الشريكة.",
    },
    {
      num: "03",
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
      status: STATUS.upcoming,
      title: "التوسع إلى حالات استخدام جديدة • Expansion to New Use Cases",
      desc: "التوسع التدريجي إلى القدم السكرية وتحليل المشي وإعادة تأهيل الحركة والمتابعة المنزلية للحالات المزمنة، مع تحقق مستقل لكل فئة استخدام قبل تفعيلها.",
    },
  ];

  return (
    <section id="roadmap" className="relative min-h-screen w-full bg-transparent text-[#0F172A] py-24 px-6 md:px-12 flex flex-col justify-center items-center overflow-hidden">

      <div className="w-full max-w-7xl mx-auto z-10">

        {/* Title */}
        <div className="flex flex-col items-center justify-center text-center mb-20 select-none">
          <span className="text-xs font-semibold tracking-wider text-medical-blue uppercase mb-3 font-sans flex items-center gap-2">
            <Milestone className="w-4 h-4 text-medical-blue" />
            GROWTH PHASES
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-arabic leading-tight unified-typography">
            خارطة الطريق المستقبلية
          </h2>
          <h3 className="text-xl sm:text-2xl font-light text-medical-blue mt-2 font-sans unified-english">
            Strategic Roadmap
          </h3>
          <p className="text-muted-text text-sm md:text-base mt-4 max-w-2xl font-light leading-relaxed unified-typography">
            ثلاث مراحل نمو، كل مرحلة تُبنى على تحقق المرحلة التي قبلها — من إثبات النموذج الأولي، إلى الإطلاق المؤسسي، إلى التوسع التدريجي لحالات استخدام جديدة.
          </p>
        </div>

        {/* Timeline Path */}
        <div className="relative flex flex-col gap-12 w-full max-w-3xl mx-auto">
          {/* Vertical track line */}
          <div className="absolute right-8 top-8 bottom-8 w-0.5 bg-slate-200/60 pointer-events-none"></div>

          {phases.map((p, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="flex flex-row-reverse items-start gap-6 relative"
            >
              {/* Phase badge node */}
              <div className="w-16 h-16 rounded-full bg-white border border-slate-200/80 hover:border-medical-blue/40 shadow-sm shadow-slate-100/50 transition-all duration-300 flex flex-col items-center justify-center z-10 shrink-0">
                <span className="text-xs font-extrabold text-medical-blue font-sans leading-none mb-1">{p.num}</span>
                {p.icon}
              </div>

              {/* Card info */}
              <div className="flex-1 flex flex-col text-right pt-2">
                <div className="flex items-center justify-end gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider font-sans ${p.status.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${p.status.dot}`} />
                    {p.status.label}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-slate-800 font-arabic mb-2 leading-none">
                  {p.title.includes(" • ") ? (
                    <>
                      <span className="font-arabic">{p.title.split(" • ")[0]}</span>
                      <span className="unified-english"> • {p.title.split(" • ")[1]}</span>
                    </>
                  ) : (
                    p.title
                  )}
                </h4>
                <p className="text-sm text-muted-text leading-relaxed font-light font-arabic">
                  {p.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
