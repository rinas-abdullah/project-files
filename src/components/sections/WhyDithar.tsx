"use client";

import { motion } from "framer-motion";
import { EyeOff, Eye, ShieldAlert, ShieldCheck, ZapOff, Zap, CalendarDays, BarChart } from "lucide-react";

export default function WhyDithar() {
  const comparison = [
    {
      label: "مدى وضوح الحالة • Telemetry Visibility",
      without: {
        icon: <EyeOff className="w-5 h-5 text-red-400" />,
        text: "رؤية محدودة ومتقطعة • Limited Visibility",
        desc: "تقتصر مراقبة المريض على الزيارات العيادية المتباعدة فقط، مما يترك فترات طويلة عمياء للمؤشرات الصحية.",
      },
      withDithar: {
        icon: <Eye className="w-5 h-5 text-smart-green" />,
        text: "مراقبة مستمرة فاعلة • Continuous Monitoring",
        desc: "تسجيل فوري متواصل على مدار الساعة لكل خطوة وتحميل وزني، لضمان توافر البيانات في بيئته المنزلية الواقعية.",
      },
    },
    {
      label: "نمط الرعاية الطبية • Care Philosophy",
      without: {
        icon: <ZapOff className="w-5 h-5 text-red-400" />,
        text: "استجابة علاجية رد فعلية • Reactive Care",
        desc: "يتم تقديم التدخل الطبي فقط بعد تدهور الحالة الحركية أو ظهور قرح سريرية واضحة ومؤلمة للمريض.",
      },
      withDithar: {
        icon: <Zap className="w-5 h-5 text-smart-green" />,
        text: "رعاية استباقية وقائية • Proactive Care",
        desc: "رصد وتحديد احتمالية المخاطر أو الالتهابات الصامتة مسبقاً، وإرسال تنبيهات وقائية للتدخل المبكر جداً.",
      },
    },
    {
      label: "زمن كشف المضاعفات • Detection Latency",
      without: {
        icon: <ShieldAlert className="w-5 h-5 text-red-400" />,
        text: "كشف متأخر جداً • Delayed Detection",
        desc: "يتم تشخيص المضاعفات الحركية أو الجلدية غالباً بعد تفاقمها للحد الذي يتطلب علاجاً جراحياً مكلفاً ومعقداً.",
      },
      withDithar: {
        icon: <ShieldCheck className="w-5 h-5 text-smart-green" />,
        text: "رصد فوري مبكر • Early Detection",
        desc: "اكتشاف أدق التغيرات الفيزيولوجية الحركية في مهدها، مما يوفر فرصة تصحيح سريعة وخسائر سريرية صفرية.",
      },
    },
    {
      label: "أدلة القرارات الطبية • Clinical Insights",
      without: {
        icon: <CalendarDays className="w-5 h-5 text-red-400" />,
        text: "زيارات تقليدية دورية • Periodic Visits",
        desc: "يعتمد الطبيب في التشخيص على الفحوصات اللحظية المتباعدة والتقييم البصري التقريبي داخل عيادته.",
      },
      withDithar: {
        icon: <BarChart className="w-5 h-5 text-smart-green" />,
        text: "تحليلات يومية موثوقة • Daily Insights",
        desc: "تزويد الطبيب بتقرير إحصائي متكامل ودقيق يسجل كافة تفاصيل المشي والتحميل طوال فترة المتابعة المنزلية.",
      },
    },
  ];

  return (
    <section id="why-dithar" className="relative min-h-screen w-full bg-transparent text-dark-text py-24 px-6 md:px-12 flex flex-col justify-center items-center overflow-hidden">


      <div className="w-full max-w-7xl mx-auto z-10">
        
        {/* Title */}
        <div className="flex flex-col items-center justify-center text-center mb-20 select-none">
          <span className="text-xs font-semibold tracking-wider text-primary-blue uppercase mb-3 font-sans unified-english">
            COMPARATIVE CLINICAL VALUE
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-arabic leading-tight unified-typography">
            لماذا منصة دِثار؟
          </h2>
          <h3 className="text-xl sm:text-2xl font-light text-primary-blue mt-2 font-sans unified-english">
            Why Dithar
          </h3>
          <p className="text-muted-text text-sm md:text-base mt-4 max-w-2xl font-light leading-relaxed unified-typography">
            مقارنة سريرية توضح الفارق الجذري بين نموذج الرعاية التقليدي القائم على رد الفعل ونموذج دِثار القائم على الاستباقية.
          </p>
        </div>

        {/* Comparison Layout */}
        <div className="flex flex-col gap-12 w-full max-w-5xl mx-auto">
          {comparison.map((item, idx) => (
            <div key={idx} className="w-full flex flex-col gap-6 text-right">
              {/* Feature Title */}
              <h4 className="text-sm font-bold text-primary-blue font-arabic border-r-2 border-primary-blue pr-3">
                {item.label}
              </h4>

              {/* Grid Cards side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* WITHOUT DITHAR (Left Column in typical layout, right-aligned text) */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10 hover:border-red-500/20 transition-all duration-300 flex flex-col items-end text-right"
                >
                  <div className="flex flex-row-reverse items-center gap-2 mb-3 text-red-500">
                    {item.without.icon}
                    <span className="text-sm font-bold font-arabic">{item.without.text}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-text leading-relaxed font-light font-arabic">
                    {item.without.desc}
                  </p>
                </motion.div>

                {/* WITH DITHAR */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="p-6 rounded-2xl bg-smart-green/5 border border-smart-green/10 hover:border-smart-green/20 transition-all duration-300 flex flex-col items-end text-right"
                >
                  <div className="flex flex-row-reverse items-center gap-2 mb-3 text-smart-green">
                    {item.withDithar.icon}
                    <span className="text-sm font-bold font-arabic">{item.withDithar.text}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-dark-text/90 leading-relaxed font-light font-arabic">
                    {item.withDithar.desc}
                  </p>
                </motion.div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
