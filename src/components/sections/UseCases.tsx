"use client";

import { motion } from "framer-motion";
import { ShieldAlert, Accessibility, Shield, Award, Clipboard, Users, Building, Activity, HeartPulse } from "lucide-react";

export default function UseCases() {
  const patientCases = [
    {
      icon: <ShieldAlert className="w-8 h-8 text-red-400" />,
      title: "وقاية القدم السكري • Diabetic Foot",
      desc: "حماية استباقية لمرضى السكري من خلال الرصد المستمر لنقاط الضغط والحرارة المرتفعة لمنع تشكل التقرحات الصامتة.",
      gradient: "from-red-500/10 to-transparent",
      border: "hover:border-red-500/30",
    },
    {
      icon: <Accessibility className="w-8 h-8 text-medical-blue" />,
      title: "كبار السن والتوازن • Elderly Patients",
      desc: "تحليل ثبات الوقوف، ومركز الجاذبية، وتغيرات سرعة المشي للتنبؤ باحتمالية السقوط وحماية المسنين في منازلهم.",
      gradient: "from-medical-blue/10 to-transparent",
      border: "hover:border-medical-blue/30",
    },
    {
      icon: <Activity className="w-8 h-8 text-smart-green" />,
      title: "تأهيل الجلطات • Stroke Rehab",
      desc: "متابعة تطور التماثل الحركي بين الطرفين المصاب والسليم أثناء جلسات إعادة التأهيل المنزلي بعد السكتات الدماغية.",
      gradient: "from-smart-green/10 to-transparent",
      border: "hover:border-smart-green/30",
    },
    {
      icon: <HeartPulse className="w-8 h-8 text-purple-400" />,
      title: "الاعتلالات العصبية • Neurological",
      desc: "رصد وتوثيق التغيرات الحركية الدقيقة لمرضى التصلب المتعدد MS ومرض باركنسون لتقييم كفاءة الخطة العلاجية.",
      gradient: "from-purple-500/10 to-transparent",
      border: "hover:border-purple-500/30",
    },
    {
      icon: <Clipboard className="w-8 h-8 text-teal-400" />,
      title: "التعافي الجراحي • Post-Surgical",
      desc: "مراقبة معدل تحميل الوزن التدريجي الموصى به طبياً بعد جراحات المفاصل والكسور لضمان وتيرة تعافي آمنة.",
      gradient: "from-teal-500/10 to-transparent",
      border: "hover:border-teal-500/30",
    },
  ];

  const institutionCases = [
    {
      icon: <Users className="w-6 h-6 text-medical-blue" />,
      title: "الرعاية المنزلية • Home Care",
      desc: "تمكين مزودي الرعاية من متابعة المرضى في منازلهم بمؤشرات موضوعية دقيقة بدلاً من التقارير الشفهية.",
    },
    {
      icon: <Building className="w-6 h-6 text-primary-blue" />,
      title: "المستشفيات • Hospitals",
      desc: "تقليل معدلات العودة للتنويم (Readmission) وتحسين كفاءة خطط الخروج للمرضى ذوي الحالات المزمنة.",
    },
    {
      icon: <Activity className="w-6 h-6 text-smart-green" />,
      title: "مراكز التأهيل • Rehab Centers",
      desc: "أدوات متطورة لتقييم التوازن وتماثل المشي أثناء التمارين وبعد العمليات لتسريع وتيرة الشفاء.",
    },
    {
      icon: <Shield className="w-6 h-6 text-purple-400" />,
      title: "شركات التأمين • Insurance",
      desc: "تقليل التكاليف العلاجية الباهظة الناتجة عن بتر الأطراف أو العمليات المعقدة بالاعتماد على الفحص الاستباقي.",
    },
  ];

  return (
    <section className="relative min-h-screen w-full bg-transparent text-[#0F172A] py-24 px-6 md:px-12 flex flex-col justify-center items-center overflow-hidden">

      <div className="w-full max-w-7xl mx-auto z-10">
        
        {/* Section Title */}
        <div className="flex flex-col items-center justify-center text-center mb-16 select-none">
          <span className="text-xs font-semibold tracking-wider text-medical-blue uppercase mb-3 font-sans unified-english">
            VERSATILE CLINICAL USE CASES
          </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-arabic leading-tight unified-typography">
            مجالات استخدام دِثار الحيوية
          </h2>
          <h3 className="text-xl sm:text-2xl font-light text-medical-blue mt-2 font-sans unified-english">
            Clinical Use Cases
          </h3>
            <p className="text-muted-text text-sm md:text-base mt-4 max-w-2xl font-light leading-relaxed unified-typography">
            تمتد تطبيقات المنصة لتغطي طيفاً واسعاً من الاحتياجات السريرية لحماية المرضى ودعم المنظومات الصحية.
          </p>
        </div>

        {/* Category 1: Patient Cases (Large Premium Cards) */}
        <div className="mb-16">
          <h4 className="text-lg font-bold text-slate-800 font-arabic mb-8 border-r-4 border-medical-blue pr-4 text-right">
            حالات المتابعة الحركية للمريض • Patient Applications
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patientCases.map((c, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`p-8 rounded-3xl glassmorphism border border-slate-200/50 shadow-sm shadow-slate-100/50 transition-all duration-300 flex flex-col items-end text-right group relative overflow-hidden ${c.border}`}
              >
                {/* Smooth hover gradient */}
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full bg-linear-to-bl ${c.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>
                
                <div className="p-4 rounded-2xl bg-slate-100/50 group-hover:bg-medical-blue/10 transition-colors duration-300 mb-6">
                  {c.icon}
                </div>
                <h5 className="text-lg font-bold text-slate-800 font-arabic mb-3">
                  {c.title}
                </h5>
                <p className="text-sm text-muted-text leading-relaxed font-light font-arabic">
                  {c.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Category 2: Institutional Cases (Sleek Horizontal Layout) */}
        <div>
          <h4 className="text-lg font-bold text-slate-800 font-arabic mb-8 border-r-4 border-smart-green pr-4 text-right">
            المنظومات والمؤسسات الطبية • Institutional Providers
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {institutionCases.map((c, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="p-6 rounded-2xl glassmorphism border border-slate-200/50 shadow-sm shadow-slate-100/50 flex flex-col items-end text-right hover:border-smart-green/20 transition-all duration-300"
              >
                <div className="p-3 rounded-xl bg-slate-100/55 mb-4">
                  {c.icon}
                </div>
                <h5 className="text-md font-bold text-slate-800 font-arabic mb-2">
                  {c.title}
                </h5>
                <p className="text-xs text-muted-text leading-relaxed font-light font-arabic">
                  {c.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
