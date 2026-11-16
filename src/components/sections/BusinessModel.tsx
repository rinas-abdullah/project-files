"use client";

import { motion } from "framer-motion";
import { Package, Building, Wrench, RefreshCw, FileCheck, TrendingUp } from "lucide-react";

const segments = [
  {
    icon: <Package className="w-6 h-6 text-primary-blue" />,
    tag: "بيع الأجهزة",
    title: "مبيعات اللبادة ووحدة Micro-Core",
    desc: "بيع لبادة Dithar E-Fabric ووحدة Micro-Core للمستشفيات ومراكز التأهيل كجهاز طبي قائم بذاته.",
  },
  {
    icon: <Building className="w-6 h-6 text-medical-blue" />,
    tag: "ترخيص المنصة",
    title: "ترخيص منصة المتابعة للمنشآت الطبية",
    desc: "اشتراك دوري يتيح للمستشفيات والمنشآت الصحية الوصول لمنصة المتابعة والتنبيهات وتقارير الالتزام.",
  },
  {
    icon: <Wrench className="w-6 h-6 text-smart-green" />,
    tag: "الصيانة والدعم",
    title: "عقود الصيانة والدعم الفني",
    desc: "عقود دورية لصيانة الأجهزة ومعايرتها وتحديث البرمجيات، تضمن استمرارية دقة القياس.",
  },
  {
    icon: <RefreshCw className="w-6 h-6 text-purple-400" />,
    tag: "الاستبدال الدوري",
    title: "استبدال النسيج الاستهلاكي",
    desc: "دخل متكرر من استبدال طبقة النسيج الذكي بعد انتهاء عمرها الاستخدامي، دون حاجة لتغيير وحدة Micro-Core.",
  },
  {
    icon: <FileCheck className="w-6 h-6 text-teal-500" />,
    tag: "التكامل التنظيمي",
    title: "التكامل مع الأنظمة التنظيمية",
    desc: "دعم فني لربط بيانات الجهاز بمتطلبات الجهات التنظيمية والمنظومات الصحية التي تعتمده.",
  },
];

export default function BusinessModel() {
  return (
    <section id="business-model" className="relative w-full py-24 overflow-hidden bg-transparent text-dark-text">

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 items-center">
          <div className="lg:col-span-5 text-right" dir="rtl">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-medical-blue mb-3 font-sans">
              <TrendingUp className="w-4 h-4 text-medical-blue" />
              Business Model & Value
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight font-arabic unified-typography">
              كيف تجني دِثار قيمة عالية لكل طرف
            </h2>
            <h3 className="text-xl sm:text-2xl font-light text-primary-blue mt-3 font-sans unified-english">
              Business Model
            </h3>
            <p className="mt-5 text-sm md:text-base leading-relaxed text-slate-600 dark:text-slate-300 max-w-xl font-light font-arabic unified-typography">
              نموذج دخل متعدد المصادر: من بيع الأجهزة واستبدال النسيج الاستهلاكي، إلى ترخيص المنصة وعقود الصيانة والتكامل التنظيمي — مبني على استمرارية الاستخدام لا على بيع لمرة واحدة.
            </p>

            <div className="mt-8 grid gap-4 text-right">
              <div className="rounded-3xl border border-primary-blue/10 bg-primary-blue/5 p-6 text-right">
                <p className="text-xs uppercase tracking-[0.3em] text-primary-blue font-semibold font-arabic">
                  قيمة علاجية وتجارية
                </p>
                <p className="mt-3 text-sm text-dark-text leading-relaxed font-arabic">
                  توفير الرعاية عن بُعد يقلل من المضاعفات المكلفة ويحوّل إنفاق الرعاية الصحية إلى استثمار مستدام.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 text-right">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold font-arabic">
                  نموذج نمو قوي
                </p>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed font-arabic">
                  ترخيص دوري للمنصة مع عقود صيانة ودعم يمنح دِثار مصدر دخل متكرر يتوسع مع عدد المنشآت المشتركة.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {segments.map((segment, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/40 text-right"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="rounded-3xl bg-slate-100 p-3.5">
                    {segment.icon}
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.28em] text-slate-500 font-semibold font-arabic">
                    {segment.tag}
                  </span>
                </div>
                <h4 className="mt-6 text-lg font-bold text-dark-text font-arabic">
                  {segment.title}
                </h4>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 font-light font-arabic">
                  {segment.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
