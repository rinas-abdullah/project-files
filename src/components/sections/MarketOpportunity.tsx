"use client";

import { motion } from "framer-motion";
import { TrendingUp, BarChart3, LineChart, Globe } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { SpotlightCard } from "@/components/ui/spotlight-card";

export default function MarketOpportunity() {
  const markets = [
    {
      icon: <Globe className="w-6 h-6 text-primary-blue" />,
      title: "نمو سوق الصحة الرقمية • Digital Health",
      metric: 430,
      metricPrefix: "$",
      metricSuffix: "B",
      desc: "حجم السوق المتوقع بحلول عام 2030 بمعدل نمو سنوي مركب (CAGR) يبلغ 18.5%.",
      progress: 85,
      barColor: "bg-primary-blue",
      gradColor: "from-primary-blue/8",
    },
    {
      icon: <LineChart className="w-6 h-6 text-medical-blue" />,
      title: "التوسع في المراقبة عن بعد • Remote Monitoring",
      metric: 117,
      metricPrefix: "$",
      metricSuffix: "B",
      desc: "حجم سوق مراقبة المرضى عن بعد المتوقع عالمياً لدعم حالات الخروج والرعاية المستمرة.",
      progress: 72,
      barColor: "bg-medical-blue",
      gradColor: "from-medical-blue/8",
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-smart-green" />,
      title: "اعتماد الذكاء الاصطناعي • AI Healthcare",
      metric: 37,
      metricPrefix: "",
      metricSuffix: "% CAGR",
      desc: "معدل النمو المتسارع لتطبيقات الذكاء الاصطناعي في رصد وتوقع المخاطر السريرية.",
      progress: 90,
      barColor: "bg-smart-green",
      gradColor: "from-smart-green/8",
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-purple-400" />,
      title: "السوق المستهدف • Addressable Market",
      metric: 530,
      metricPrefix: "",
      metricSuffix: "M+ Patients",
      desc: "عدد مرضى السكري عالمياً المعرضين لخطر تقرحات القدم السريرية وخلل الاتزان الحركي.",
      progress: 60,
      barColor: "bg-purple-400",
      gradColor: "from-purple-400/8",
    },
  ];

  return (
    <section id="market" className="relative min-h-screen w-full bg-transparent text-dark-text py-24 px-6 md:px-12 flex flex-col justify-center items-center overflow-hidden">

      <div className="w-full max-w-7xl mx-auto z-10">
        {/* Title */}
        <div className="flex flex-col items-center justify-center text-center mb-20 select-none">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold tracking-wider text-primary-blue uppercase mb-3 font-sans unified-english"
          >
            GLOBAL HEALTHCARE ADDRESSABLE MARKET
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold font-arabic leading-tight"
          >
            حجم السوق والفرصة الاستثمارية
          </motion.h2>
          <motion.h3
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-xl sm:text-2xl font-light text-primary-blue mt-2 font-sans"
          >
            Market Opportunity
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-text text-sm md:text-base mt-4 max-w-2xl font-light leading-relaxed font-arabic"
          >
            دِثار يتواجد في قلب سوق بقيمة تتجاوز الـ 400 مليار دولار، حيث تُعد المراقبة الذكية والتدخل المبكر فرص استثمارية نادرة لصحة المرضى وخفض التكاليف.
          </motion.p>
        </div>

        {/* Market Opportunity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mx-auto">
          {markets.map((m, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              <SpotlightCard className="relative overflow-hidden rounded-4xl border border-slate-200/40 bg-linear-to-br from-white via-slate-50 to-slate-100 p-8 shadow-2xl shadow-slate-200/40 transition-all duration-300 group">
                <div className={`absolute -right-10 top-0 h-40 w-40 rounded-bl-full bg-linear-to-bl ${m.gradColor} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
                <div className="relative flex flex-col items-end text-right">
                  <div className="w-full flex flex-row-reverse justify-between items-start gap-4 mb-6">
                    <div className="flex-1 whitespace-nowrap text-right">
                      <span className="text-2xl sm:text-3xl font-extrabold text-primary-blue font-sans leading-none">
                        {m.metricPrefix}
                        <AnimatedCounter end={m.metric} suffix={m.metricSuffix} duration={2000} />
                      </span>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white shadow-sm border border-black/5 group-hover:scale-110 transition-transform duration-300">
                      {m.icon}
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-dark-text font-arabic mb-3 whitespace-nowrap">
                    {m.title.includes(" • ") ? (
                      <>
                        <span className="font-arabic whitespace-nowrap">{m.title.split(" • ")[0]}</span>
                        <span className="unified-english whitespace-nowrap"> • {m.title.split(" • ")[1]}</span>
                      </>
                    ) : (
                      m.title
                    )}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-light font-arabic mb-7">{m.desc}</p>
                  <div className="rounded-4xl border border-slate-200 bg-white/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs uppercase text-slate-500 font-semibold font-sans">نمو السوق</span>
                      <span className="text-xs font-semibold text-primary-blue">{m.progress}%</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${m.progress}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
                        className={`h-full ${m.barColor} rounded-full`}
                      />
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
