"use client";

import { motion } from "framer-motion";
import { Ruler, Gauge, BatteryCharging, Grid3x3, Bluetooth, Zap } from "lucide-react";

export default function DeviceSpecs() {
  const specs = [
    {
      icon: <Ruler className="w-6 h-6 text-primary-blue" />,
      label: "السماكة",
      labelEn: "Thickness",
      value: "2.8 مم",
    },
    {
      icon: <Gauge className="w-6 h-6 text-medical-blue" />,
      label: "الوزن",
      labelEn: "Weight",
      value: "18 غم",
    },
    {
      icon: <BatteryCharging className="w-6 h-6 text-smart-green" />,
      label: "عمر البطارية",
      labelEn: "Battery Life",
      value: "72 ساعة تشغيل متواصل",
    },
    {
      icon: <Grid3x3 className="w-6 h-6 text-purple-400" />,
      label: "مصفوفة الاستشعار",
      labelEn: "Sensor Array",
      value: "9 مناطق ضغط وحرارة",
    },
    {
      icon: <Bluetooth className="w-6 h-6 text-primary-blue" />,
      label: "الاتصال",
      labelEn: "Connectivity",
      value: "BLE 5.2 مشفّر",
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      label: "الشحن",
      labelEn: "Charging",
      value: "خارجي + دعم ذاتي من الحركة",
    },
  ];

  return (
    <section
      id="specs"
      className="relative w-full bg-transparent text-[#0F172A] py-16 px-6 md:px-12 flex flex-col justify-center items-center overflow-hidden scroll-mt-28"
    >
      <div className="w-full max-w-6xl mx-auto z-10">
        {/* Title */}
        <div className="flex flex-col items-center justify-center text-center mb-10 select-none">
          <span className="text-xs font-semibold tracking-wider text-medical-blue uppercase mb-3 font-sans unified-english">
            TECHNICAL SPECIFICATIONS
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-arabic leading-tight unified-typography">
            المواصفات التقنية للباد الذكي
          </h2>
          <p className="text-muted-text text-sm mt-3 max-w-xl font-light leading-relaxed unified-typography">
            أرقام هندسية دقيقة من تصميم اللباد الطبي الذكي الحالي.
          </p>
        </div>

        {/* Spec Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {specs.map((s, idx) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: idx * 0.06 }}
              className="p-5 rounded-2xl glassmorphism border border-slate-200/50 shadow-sm shadow-slate-100/50 flex flex-col items-end text-right"
            >
              <div className="p-2.5 rounded-xl bg-slate-100/55 mb-3">
                {s.icon}
              </div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.12em] font-sans">
                {s.labelEn}
              </p>
              <p className="text-sm font-bold text-slate-800 font-arabic mt-0.5">
                {s.label}
              </p>
              <p className="text-base font-bold text-primary-blue font-arabic mt-2">
                {s.value}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
