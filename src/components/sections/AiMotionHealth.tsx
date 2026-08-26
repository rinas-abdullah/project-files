"use client";

import { motion } from "framer-motion";
import { Activity, Target, Thermometer, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "الخط الأساسي الشخصي",
    desc: "يبني النظام ملف حركة فردي خلال الأيام الأولى، ليعرف الفروق الطبيعية الخاصة بك بدلاً من الاعتماد على معدلات عامة.",
    icon: Activity,
  },
  {
    title: "كشف الانحرافات الدقيقة",
    desc: "يراقب تغيرات الميل، توزيع الضغط، وطول الخطوة في كل خطوة، ليكشف أي انحراف عن نمطك الحركي الطبيعي.",
    icon: Target,
  },
  {
    title: "مراقبة الحرارة الوظيفية",
    desc: "يربط بين التغيرات الحرارية في القدم وحركة الضغط لتوقع التهاب الأنسجة أو ضعف التروية قبل ظهور الأعراض.",
    icon: Thermometer,
  },
  {
    title: "تقييم المخاطر المسبق",
    desc: "يمكنه تقييم احتمال تشكل قرح أو خلل استقراري قبل أسابيع، ويقترح الإجراءات العلاجية المبكرة.",
    icon: ShieldCheck,
  },
];

export default function AiMotionHealth() {
  return (
    <section id="ai-motion-health" className="relative w-full py-24 bg-transparent overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_55%)] pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[280px] bg-[radial-gradient(circle_at_bottom,_rgba(16,185,129,0.14),_transparent_55%)] pointer-events-none" />

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 flex flex-col text-right" dir="rtl">
          <span className="text-xs font-semibold tracking-wider text-primary-blue dark:text-medical-blue uppercase mb-3 font-sans unified-english">
            Clinical Motion Intelligence
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-arabic leading-tight text-dark-text dark:text-zinc-100 unified-typography">
            ذكاء اصطناعي يفهم صحتك الحركية
          </h2>
          <h3 className="text-lg md:text-xl font-light text-primary-blue dark:text-medical-blue mt-3 font-sans tracking-wide unified-english">
            Precise Out-of-Hospital Foot Motion Analysis
          </h3>
          <p className="text-muted-text text-sm sm:text-base mt-5 leading-relaxed font-light font-arabic max-w-xl unified-typography">
            دِثار لا يكتفي بجمع البيانات؛ بل يحللها بطريقة سريرية، ويربط بين الضغط، التوازن، والحرارة لتقديم تقرير واقعي لدكتورك عن حالة المريض الجسدية.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.35, delay: index * 0.08 }}
                  className="rounded-3xl border border-primary-blue/10 bg-primary-blue/5 dark:border-medical-blue/25 dark:bg-medical-blue/10 p-5 shadow-sm shadow-primary-blue/5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-primary-blue dark:bg-zinc-950/90 dark:text-medical-blue shadow-sm shadow-slate-200/50">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-dark-text dark:text-zinc-100 font-arabic">
                        {feature.title}
                      </h4>
                    </div>
                    <div className="text-xs font-semibold text-primary-blue dark:text-medical-blue">{`0${index + 1}`}</div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300 font-light font-arabic">
                    {feature.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-6 flex items-center justify-center">
          <div className="w-full max-w-xl rounded-[2rem] border border-primary-blue/15 dark:border-medical-blue/20 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md shadow-2xl shadow-slate-900/10 overflow-hidden">
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-primary-blue/10 via-transparent to-transparent" />
              <div className="relative p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.28em] text-primary-blue dark:text-medical-blue">
                      HEALTH MOTION AI
                    </p>
                    <h3 className="mt-3 text-2xl font-bold text-dark-text dark:text-zinc-100 font-arabic">
                      تحليلات حركية فورية
                    </h3>
                  </div>
                  <span className="inline-flex rounded-full border border-primary-blue/20 bg-primary-blue/10 px-3 py-1 text-[11px] font-semibold text-primary-blue dark:text-medical-blue">
                    Real-time
                  </span>
                </div>

                <div className="mt-8 grid gap-4">
                   <div className="rounded-3xl bg-slate-100/80 dark:bg-zinc-900/80 p-4 border border-slate-200/60 dark:border-zinc-800/70">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500 font-semibold font-arabic">توازن الخطوة</p>
                    <div className="mt-2 flex items-end gap-3">
                      <span className="text-3xl font-bold text-dark-text dark:text-zinc-100">92%</span>
                      <span className="text-xs text-slate-500">Score</span>
                    </div>
                    <p className="mt-2 text-[13px] text-slate-500 leading-snug font-light font-arabic">
                      مستوى الاستقرار الحركي المحسوب من الضغط والتذبذب في مركز الثقل.
                    </p>
                  </div>

                  <div className="rounded-3xl bg-slate-100/80 dark:bg-zinc-900/80 p-4 border border-slate-200/60 dark:border-zinc-800/70">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500 font-semibold font-arabic">التغير الحراري</p>
                    <div className="mt-2 flex items-end gap-3">
                      <span className="text-3xl font-bold text-dark-text dark:text-zinc-100">+0.6°C</span>
                      <span className="text-xs text-slate-500">Trend</span>
                    </div>
                    <p className="mt-2 text-[13px] text-slate-500 leading-snug font-light font-arabic">
                      مؤشر لدفء موضعي غير طبيعي يمكن ربطه بتغيرات التروية أو الالتهاب.
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-3xl border border-primary-blue/10 dark:border-medical-blue/20 bg-primary-blue/5 dark:bg-medical-blue/10 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-blue dark:text-medical-blue">
                    توصية طبية
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-arabic font-light">
                    يوصى بمراجعة ضغط الحذاء الطبي وضبط الحماية الحرارية للقدم اليسرى خلال 24 ساعة المقبلة.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
