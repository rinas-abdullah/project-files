"use client";

import { motion } from "framer-motion";
import { ShieldAlert, Accessibility, Shield, Clipboard, Users, Building, Activity, Baby } from "lucide-react";

export default function UseCases() {
  const launchCase = {
    icon: <Clipboard className="w-9 h-9 text-teal-500" />,
    title: "التأهيل بعد جراحات القدم والكاحل • Post-Surgical Rehab",
    desc: "فئة الإطلاق. الطبيب يحدد حد التحميل الجزئي للوزن (مثل 15 كغم لأول أسبوعين)، والكبسولة تنبّه المريض فوراً عند تجاوزه، بينما يتابع الطبيب الالتزام بين المواعيد ويعدّل الحد مع تقدّم التأهيل.",
    measures: "الحمل على القدم المصابة، وعدد مرات تجاوز الحد، والخطوات",
    alerts: "فوراً عند تجاوز الحد الذي حدده الطبيب",
    notifies: "المريض فوراً، والطبيب في تقرير الالتزام",
  };

  const upcomingCases = [
    {
      icon: <Activity className="w-8 h-8 text-red-400" />,
      title: "القدم السكرية • Diabetic Foot",
      measures: "نقاط الضغط المستمر، وفرق الحرارة بين القدمين، والرطوبة",
      alerts: "ضغط مستمر على نفس النقطة، أو ارتفاع حرارة قدم عن الأخرى لأيام",
      notifies: "المريض والعائلة، ثم الطبيب إذا استمر",
      gradient: "from-red-500/10 to-transparent",
      border: "hover:border-red-500/30",
    },
    {
      icon: <ShieldAlert className="w-8 h-8 text-smart-green" />,
      title: "الجلطات الدماغية (الشلل النصفي) • Stroke / Hemiplegia",
      measures: "توزيع الوزن بين القدمين، وتناظر المشي",
      alerts: "اعتماد زائد على القدم السليمة",
      notifies: "المريض أثناء التمارين، وأخصائي العلاج الطبيعي",
      gradient: "from-smart-green/10 to-transparent",
      border: "hover:border-smart-green/30",
    },
    {
      icon: <Accessibility className="w-8 h-8 text-medical-blue" />,
      title: "كبار السن (السقوط) • Elderly / Falls",
      measures: "الميلان والتوازن والسقوط، وقلة الحركة",
      alerts: "سقوط محتمل، أو انعدام حركة لفترة غير معتادة",
      notifies: "العائلة فوراً",
      gradient: "from-medical-blue/10 to-transparent",
      border: "hover:border-medical-blue/30",
    },
    {
      icon: <Baby className="w-8 h-8 text-purple-400" />,
      title: "تشوهات القدم الخلقية (مثل القدم الحنفاء) • Congenital Deformities",
      measures: "مدة لبس الجبيرة يومياً",
      alerts: "إذا قلّت ساعات اللبس عن المدة المطلوبة",
      notifies: "الوالدان، والطبيب في التقرير",
      gradient: "from-purple-500/10 to-transparent",
      border: "hover:border-purple-500/30",
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
            نفس الجهاز بخمسة أوضاع. الطبيب يختار الوضع من المنصة، فتتغير القياسات والتنبيهات حسبه. نبدأ بالتأهيل بعد الجراحة، والفئات الأربع الأخرى مراحل قادمة على نفس المنصة.
          </p>
        </div>

        {/* Launch Category: Post-Surgical Rehab */}
        <div className="mb-10">
          <h4 className="text-lg font-bold text-slate-800 font-arabic mb-8 border-r-4 border-teal-500 pr-4 text-right">
            فئة الإطلاق • Launch Category
          </h4>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="p-8 rounded-3xl glassmorphism border border-teal-500/30 shadow-sm shadow-slate-100/50 flex flex-col items-end text-right relative overflow-hidden"
          >
            <span className="absolute top-5 left-5 text-[10px] font-bold font-sans uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-600 border border-teal-500/20">
              Active Now
            </span>
            <div className="p-4 rounded-2xl bg-teal-500/10 mb-6">
              {launchCase.icon}
            </div>
            <h5 className="text-xl font-bold text-slate-800 font-arabic mb-3">
              {launchCase.title}
            </h5>
            <p className="text-sm text-muted-text leading-relaxed font-light font-arabic mb-5">
              {launchCase.desc}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-right border-t border-slate-200/70 pt-5">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ماذا يُقاس</p>
                <p className="text-xs text-slate-700 font-arabic leading-relaxed">{launchCase.measures}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">متى يُنبَّه</p>
                <p className="text-xs text-slate-700 font-arabic leading-relaxed">{launchCase.alerts}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">من يُبلَّغ</p>
                <p className="text-xs text-slate-700 font-arabic leading-relaxed">{launchCase.notifies}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* The other 4 categories: same device, same platform, upcoming stages */}
        <div className="mb-16">
          <h4 className="text-lg font-bold text-slate-800 font-arabic mb-8 border-r-4 border-medical-blue pr-4 text-right">
            مراحل قادمة — نفس الجهاز بخمسة أوضاع • Upcoming Stages
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {upcomingCases.map((c, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`p-6 rounded-3xl glassmorphism border border-slate-200/50 shadow-sm shadow-slate-100/50 transition-all duration-300 flex flex-col items-end text-right group relative overflow-hidden ${c.border}`}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full bg-linear-to-bl ${c.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>
                <span className="absolute top-4 left-4 text-[9px] font-bold font-sans uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  Upcoming
                </span>
                <div className="p-3 rounded-2xl bg-slate-100/50 group-hover:bg-medical-blue/10 transition-colors duration-300 mb-5">
                  {c.icon}
                </div>
                <h5 className="text-base font-bold text-slate-800 font-arabic mb-3">
                  {c.title}
                </h5>
                <div className="space-y-2 text-right w-full">
                  <p className="text-xs text-muted-text leading-relaxed font-light font-arabic">
                    <span className="font-bold text-slate-500">يُقاس: </span>{c.measures}
                  </p>
                  <p className="text-xs text-muted-text leading-relaxed font-light font-arabic">
                    <span className="font-bold text-slate-500">يُبلَّغ: </span>{c.notifies}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-xs text-muted-text font-arabic mt-6 text-center">
            الحدود الرقمية لكل فئة يضعها الطبيب، والمنصة لا تضع قيماً علاجية من نفسها.
          </p>
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
