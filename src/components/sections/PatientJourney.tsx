"use client";

import { motion } from "framer-motion";
import { Landmark, Home, Activity, BrainCircuit, AlertTriangle, UserCheck, Heart } from "lucide-react";

const steps = [
  {
    icon: <Landmark className="w-6 h-6 text-primary-blue" />,
    title: "المستشفى",
    subtitle: "1. نقطة الانطلاق",
    desc: "يبدأ المسار بتجهيز المريض واللباد الطبي الذكي دِثار قبل الخروج.",
    badge: "تهيئة سريرية",
  },
  {
    icon: <Home className="w-6 h-6 text-medical-blue" />,
    title: "المنزل",
    subtitle: "2. العودة إلى الواقع",
    desc: "المريض يعيش يومه الطبيعي بينما تستمر القياسات الحركية والحرارية.",
    badge: "متابعة يومية",
  },
  {
    icon: <Activity className="w-6 h-6 text-smart-green" />,
    title: "المراقبة",
    subtitle: "3. متابعة مستمرة",
    desc: "يُسجل دِثار الضغط والحرارة والخطوات في الوقت الحقيقي.",
    badge: "بيانات آنية",
  },
  {
    icon: <BrainCircuit className="w-6 h-6 text-purple-500" />,
    title: "التحليل الذكي",
    subtitle: "4. دماغ دِثار",
    desc: "يُقارن الذكاء الاصطناعي القياسات بالخط الأساسي للمريض.",
    badge: "كشف صامت",
  },
  {
    icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
    title: "الكشف المبكر",
    subtitle: "5. تنبيه مبكر",
    desc: "يُبلغ النظام الفريق الطبي عن أي تغير مقلق قبل ظهور الأعراض.",
    badge: "حماية نشطة",
  },
  {
    icon: <UserCheck className="w-6 h-6 text-teal-500" />,
    title: "التدخل الطبي",
    subtitle: "6. توصية دقيقة",
    desc: "يحصل الطبيب على تقرير موجز مع اقتراحات علاجية مباشرة.",
    badge: "قرار مبني على بيانات",
  },
  {
    icon: <Heart className="w-6 h-6 text-pink-500" />,
    title: "التعافي",
    subtitle: "7. عودة النشاط",
    desc: "ينهي المريض رحلته دون مضاعفات ويستعيد حركته بثقة.",
    badge: "نتيجة مؤكدة",
  },
];

export default function PatientJourney() {
  return (
    <section id="patient-journey" className="relative w-full py-24 overflow-hidden bg-transparent text-dark-text">

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 items-start">
          <div className="lg:col-span-5 text-right" dir="rtl">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-blue mb-3 font-sans unified-english">
              Patient Journey with Dithar
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight font-arabic unified-typography">
              بداية جديدة لرحلة كل مريض
            </h2>
            <p className="mt-5 text-sm sm:text-base leading-relaxed text-muted-text dark:text-slate-300 max-w-xl font-light font-arabic unified-typography">
              تصميم مميز يبين كيف يرافق دِثار المريض من تجهيز الخروج إلى التعافي الدائم عبر رصد ذكي وتحكم سريري.
            </p>

            <div className="mt-10 grid gap-4">
              <div className="rounded-4xl border border-primary-blue/10 bg-primary-blue/5 p-5 shadow-lg shadow-primary-blue/5">
                <p className="text-xs uppercase text-primary-blue font-semibold font-sans">رؤى ذكية</p>
                <p className="mt-3 text-sm leading-relaxed text-dark-text font-arabic">
                  رؤية واحدة تجمع بيئة المريض، قياسات اللباد الطبي الذكي، وتوصيات الأطباء في لوحة واضحة.
                </p>
              </div>
              <div className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
                <p className="text-xs uppercase text-slate-500 font-semibold font-sans">تحكم متقدم</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-text font-arabic">
                  واجهة أنيقة تكشف الحالة الحالية للمريض وتربط بين مؤشرات الحركة والتدخلات الطبية بسرعة.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 relative">
            <div className="rounded-4xl border border-slate-200 bg-white/90 p-6 shadow-2xl shadow-slate-200/20 overflow-hidden">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold font-sans unified-english">Patient Pathway</p>
                    <h3 className="mt-2 text-2xl font-bold font-arabic text-dark-text">خريطة رحلة المريض الرقمية</h3>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700">
                    <span className="h-2 w-2 rounded-full bg-primary-blue" />
                    متابعة آنية
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 right-16 w-px bg-primary-blue/20" />
                  <div className="space-y-6">
                    {steps.map((step, index) => (
                      <motion.div
                        key={step.title}
                        initial={{ opacity: 0, x: 60 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.5, delay: index * 0.08 }}
                        className="relative flex flex-row-reverse gap-5"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white border border-primary-blue/10 shadow-sm">
                            {step.icon}
                          </div>
                          {index < steps.length - 1 ? (
                            <div className="h-full w-px bg-primary-blue/20" />
                          ) : null}
                        </div>
                        <div className="flex-1 rounded-4xl border border-slate-200 bg-slate-50 p-5 shadow-sm shadow-slate-200/50">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <span className="text-xs uppercase text-primary-blue font-semibold font-sans">{step.subtitle}</span>
                            <span className="rounded-full bg-primary-blue/10 px-3 py-1 text-[11px] font-semibold text-primary-blue">{step.badge}</span>
                          </div>
                          <h4 className="mt-3 text-lg font-bold font-arabic text-dark-text">{step.title}</h4>
                          <p className="mt-2 text-sm leading-relaxed text-muted-text font-arabic">{step.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-4xl border border-slate-200 bg-primary-blue/5 p-5">
                    <p className="text-xs uppercase text-primary-blue font-semibold font-sans">النتيجة</p>
                    <p className="mt-3 text-sm font-arabic text-dark-text leading-relaxed">
                      دعم العلاج بالمراقبة الحية والتدخل المبكر حتى قبل ظهور العلامات الواضحة.
                    </p>
                  </div>
                  <div className="rounded-4xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs uppercase text-slate-500 font-semibold font-sans">التجربة</p>
                    <p className="mt-3 text-sm font-arabic text-muted-text leading-relaxed">
                      تجربة المرضى تصبح أكثر أماناً وراحة بفضل رصد دِثار الفوري والمترابط.
                    </p>
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
