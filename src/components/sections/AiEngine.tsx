"use client";

import { motion } from "framer-motion";
import { Activity, Cpu, Thermometer, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    titleAr: "الخط الأساسي الشخصي",
    titleEn: "Personal Motion Baseline",
    desc: "يبني ملف حركة فردي لكل مريض لاكتشاف التغيرات الحقيقية.",
    icon: Activity,
    color: "text-primary-blue bg-primary-blue/10 border-primary-blue/30 dark:text-medical-blue dark:bg-medical-blue/15 dark:border-medical-blue/30",
  },
  {
    titleAr: "كشف الانحرافات الدقيقة",
    titleEn: "Micro-deviation Detection",
    desc: "يراقب تغيرات الضغط والتوازن في كل لحظة قبل أن تصبح مشكلة.",
    icon: Target,
    color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  },
  {
    titleAr: "تقييم الوضع الوظيفي",
    titleEn: "Functional Health Scoring",
    desc: "يولد تقرير استقرار بسيط وواضح للفريق الطبي.",
    icon: Cpu,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    titleAr: "رؤى قابلة للتطبيق",
    titleEn: "Actionable Clinical Insights",
    desc: "يوفر توصيات علاجية سريعة قابلة للتنفيذ.",
    icon: Thermometer,
    color: "text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-100 dark:bg-slate-900/70 dark:border-zinc-800",
  },
];

export default function AiEngine() {
  return (
    <section id="ai-engine" className="relative w-full py-24 bg-transparent overflow-hidden font-sans scroll-mt-28">

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 flex flex-col text-right" dir="rtl">
          <span className="text-xs font-semibold tracking-wider uppercase text-primary-blue dark:text-medical-blue mb-3 font-sans unified-english">
            Clinical Motion Intelligence
          </span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-dark-text dark:text-zinc-100 leading-tight font-arabic"
          >
            ذكاء اصطناعي يفهم صحتك الحركية
          </motion.h2>
          <motion.h3
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-3 text-lg md:text-xl font-light text-primary-blue dark:text-medical-blue tracking-wide font-sans unified-english"
          >
            Precise Out-of-Hospital Foot Motion Analysis
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 max-w-xl text-sm sm:text-base leading-relaxed text-slate-500 dark:text-slate-300 font-light font-arabic"
          >
            يجمع دِثار الذكاء الحركي الطبي مع منصة متابعة المرضى. يحلل الضغط والتوازن والحرارة مباشرةً ويحوّلها لرؤى قابلة للتطبيق.
          </motion.p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.titleAr}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className={cn(
                    "rounded-3xl border p-5 bg-white/90 dark:bg-slate-950/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:shadow-none",
                    feature.color
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-zinc-900">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold font-arabic text-slate-900 dark:text-slate-100">
                          {feature.titleAr}
                        </p>
                        <p className="text-[10px] font-sans uppercase tracking-[0.2em] text-slate-400">
                          {feature.titleEn}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 font-light font-arabic">
                    {feature.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-6 relative flex items-center justify-center">
          <div className="relative w-full max-w-130 rounded-4xl border border-slate-200 bg-white/90 shadow-2xl shadow-slate-200/10 dark:border-zinc-800 dark:bg-slate-950/90 dark:shadow-none overflow-hidden">
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-primary-blue/10 via-transparent to-transparent opacity-70" />

              <div className="relative p-8 sm:p-10">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-blue dark:text-medical-blue">
                      HEALTH MOTION AI
                    </span>
                    <h4 className="mt-3 text-2xl font-bold text-dark-text dark:text-zinc-100 font-arabic leading-tight">
                      وحدة الذكاء الاصطناعي الطبي
                    </h4>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-primary-blue/10 text-primary-blue dark:bg-medical-blue/15 dark:text-medical-blue">
                    <Cpu className="w-6 h-6" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold font-sans">
                      تحليل متكامل
                    </p>
                    <p className="mt-3 text-sm text-slate-900 dark:text-slate-100 font-arabic leading-relaxed">
                      يربط الرصد الحركي والضغط والحرارة في رؤية واحدة.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold font-sans">
                      متصل بالمنصة
                    </p>
                    <p className="mt-3 text-sm text-slate-900 dark:text-slate-100 font-arabic leading-relaxed">
                      ينقل البيانات مباشرة إلى منصة المتابعة والفريق الطبي.
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-4xl border border-slate-200 bg-slate-100/90 p-5 dark:border-zinc-800 dark:bg-slate-900/80">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 font-semibold font-sans">
                        أداء النموذج
                      </p>
                      <p className="mt-2 text-lg font-bold text-dark-text dark:text-zinc-100 font-arabic">
                        97.8% دقة تشخيص الميزات الحركية
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-blue dark:text-medical-blue">
                      <span className="h-2 w-2 rounded-full bg-primary-blue dark:bg-medical-blue" />
                      Clinical grade
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>دقة استقرار الوقوف</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">92%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>انحراف توزيع الضغط</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">4.3°</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>معدل الاستجابة التنبيهي</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">1.2s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
