"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, Thermometer, ShieldCheck, 
  Droplets, Footprints, Gauge, Sparkles,
  Layers, CheckCircle2, ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// Anatomical sensor coordinate mapping for Left and Right feet
const SENSOR_POINTS = [
  // Left Foot
  { id: "L_toe", foot: "left", label: "إصبع الإبهام (Hallux)", x: "36%", y: "22%", pressure: 42, temp: 36.6, risk: "normal" },
  { id: "L_meta1", foot: "left", label: "مشط القدم الأول (Metatarsal 1)", x: "34%", y: "38%", pressure: 58, temp: 37.1, risk: "elevated" },
  { id: "L_meta5", foot: "left", label: "مشط القدم الخامس (Metatarsal 5)", x: "24%", y: "42%", pressure: 38, temp: 36.4, risk: "normal" },
  { id: "L_arch", foot: "left", label: "قوس باطن القدم (Medial Arch)", x: "32%", y: "56%", pressure: 18, temp: 36.3, risk: "normal" },
  { id: "L_heel", foot: "left", label: "عظم الكعب (Calcaneus)", x: "29%", y: "78%", pressure: 64, temp: 36.9, risk: "normal" },
  
  // Right Foot
  { id: "R_toe", foot: "right", label: "إصبع الإبهام (Hallux)", x: "64%", y: "22%", pressure: 40, temp: 36.5, risk: "normal" },
  { id: "R_meta1", foot: "right", label: "مشط القدم الأول (Metatarsal 1)", x: "66%", y: "38%", pressure: 46, temp: 36.7, risk: "normal" },
  { id: "R_meta5", foot: "right", label: "مشط القدم الخامس (Metatarsal 5)", x: "76%", y: "42%", pressure: 36, temp: 36.3, risk: "normal" },
  { id: "R_arch", foot: "right", label: "قوس باطن القدم (Medial Arch)", x: "68%", y: "56%", pressure: 16, temp: 36.2, risk: "normal" },
  { id: "R_heel", foot: "right", label: "عظم الكعب (Calcaneus)", x: "71%", y: "78%", pressure: 62, temp: 36.8, risk: "normal" },
];

export default function DigitalTwin() {
  const [activeTab, setActiveTab] = useState<"pressure" | "thermal" | "gait">("pressure");
  const [selectedSensor, setSelectedSensor] = useState<string>("L_meta1");
  const [loadL, setLoadL] = useState(49.2);

  // Gentle realistic live biomechanical drift
  useEffect(() => {
    const id = setInterval(() => {
      setLoadL(p => parseFloat(Math.max(48.2, Math.min(50.8, p + (Math.random() * 0.4 - 0.2))).toFixed(1)));
    }, 2500);
    return () => clearInterval(id);
  }, []);

  const loadR = useMemo(() => parseFloat((100 - loadL).toFixed(1)), [loadL]);
  const activeSensorData = SENSOR_POINTS.find(s => s.id === selectedSensor) || SENSOR_POINTS[1];

  return (
    <section id="digitaltwin" className="w-full py-28 px-4 sm:px-6 md:px-12 flex flex-col items-center bg-slate-50/50 relative overflow-hidden">
      
      {/* Background medical grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0B4D8D08_1px,transparent_1px),linear-gradient(to_bottom,#0B4D8D08_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />

      {/* ── Section Header ── */}
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 relative z-10">
        <div className="max-w-2xl text-right">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#0B4D8D] text-xs font-bold mb-4 font-arabic">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>المراقبة السريرية المستمرة • Continuous Clinical Telemetry</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 font-arabic leading-[1.25] tracking-tight">
            التوأم الرقمي لميكانيكا المشي وتوزيع الأحمال
          </h2>
          
          <p className="text-slate-600 text-sm md:text-base font-arabic leading-relaxed font-light">
            تحليل فوري دقيق لبيانات ميكانيكا القدم وتوزيع الضغط والحرارة الموضعية عبر 9 مستشعرات ذكية مدمجة في اللباد الطبي، لتمكين الفريق الطبي من التنبؤ بالمخاطر قبل ظهورها سريرياً.
          </p>
        </div>
        
        {/* Clinical View Tabs */}
        <div className="flex items-center p-1.5 bg-white shadow-sm rounded-2xl border border-slate-200/80 self-start lg:self-auto shrink-0">
          {([
            { id: "pressure", label: "خريطة الضغط الأخمصي", icon: Gauge },
            { id: "thermal", label: "المسح الحراري (ΔT)", icon: Thermometer },
            { id: "gait", label: "ميكانيكا وتوازن المشية", icon: Activity },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-arabic font-bold transition-all cursor-pointer",
                activeTab === tab.id 
                  ? "bg-[#0B4D8D] text-white shadow-md shadow-blue-900/10" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Clinical Intelligence Grid ── */}
      <div className="w-full max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

          {/* ════ LEFT: INTERACTIVE ANATOMICAL PLANTAR SCAN (7 COLS) ════ */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden min-h-[520px]">
            
            {/* Header / Mode Indicator */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 z-10">
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold font-arabic text-slate-900">
                    {activeTab === "pressure" && "خريطة الضغط الديناميكي الأخمصي (Dynamic Plantar Pressure)"}
                    {activeTab === "thermal" && "التدرج الحراري الموضعي ومؤشرات الالتهاب (ΔT Thermography)"}
                    {activeTab === "gait" && "مسار مركز الضغط والتماثل الحركي (Gait Kinematics)"}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 font-sans mt-0.5" dir="ltr">
                  {activeTab === "pressure" && "Dual Foot Real-time 9-Zone Matrix"}
                  {activeTab === "thermal" && "Thermal Gradient & Micro-inflammation Detection"}
                  {activeTab === "gait" && "Center of Pressure (COP) & Weight Symmetry"}
                </p>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Live Feed</span>
              </div>
            </div>

            {/* Visual Plantar Display with Accurately Anchored Anatomical Sensors */}
            <div className="relative flex-1 w-full my-6 flex items-center justify-center min-h-[340px]">
              
              {/* Dual Anatomical Foot Outline */}
              <div className="relative w-72 h-80 flex items-center justify-center select-none">
                <img 
                  src="/images/foot-heatmap.png" 
                  alt="Plantar Anatomy" 
                  className="w-full h-full object-contain filter contrast-125 opacity-70"
                />

                {/* Accurately positioned anatomical sensor hotspots */}
                {SENSOR_POINTS.map(point => {
                  const isSelected = selectedSensor === point.id;
                  const isThermal = activeTab === "thermal";
                  
                  return (
                    <button
                      key={point.id}
                      onClick={() => setSelectedSensor(point.id)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                      style={{ left: point.x, top: point.y }}
                      title={`${point.label}: ${isThermal ? point.temp + '°C' : point.pressure + ' kPa'}`}
                    >
                      {/* Pulsing Aura if elevated */}
                      {point.risk === "elevated" && (
                        <span className="absolute -inset-2 rounded-full bg-amber-400/30 animate-ping pointer-events-none" />
                      )}
                      
                      {/* Sensor Pin Node */}
                      <span className={cn(
                        "flex items-center justify-center rounded-full font-mono text-[9px] font-bold shadow-md transition-all",
                        isSelected 
                          ? "w-8 h-8 bg-[#0B4D8D] text-white ring-4 ring-blue-100 scale-110" 
                          : point.risk === "elevated"
                          ? "w-6 h-6 bg-amber-500 text-white ring-2 ring-white"
                          : "w-6 h-6 bg-white text-slate-700 border border-slate-300 hover:border-[#0B4D8D]"
                      )}>
                        {isThermal ? `${point.temp.toFixed(0)}°` : point.pressure}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Sensor Floating Info Overlay */}
              <motion.div 
                key={activeSensorData.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3.5 shadow-lg text-right max-w-xs z-20"
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-[10px] font-bold text-slate-400 font-sans uppercase">
                    {activeSensorData.foot === "left" ? "القدم اليسرى" : "القدم اليمنى"}
                  </span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-bold",
                    activeSensorData.risk === "elevated" 
                      ? "bg-amber-50 text-amber-700 border border-amber-200" 
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  )}>
                    {activeSensorData.risk === "elevated" ? "انتباه سريري" : "نطاق آمن"}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 font-arabic mb-1">{activeSensorData.label}</p>
                <div className="flex items-center gap-4 text-xs font-mono text-slate-600">
                  <span>الضغط: <b className="text-slate-900">{activeSensorData.pressure} kPa</b></span>
                  <span>الحرارة: <b className="text-slate-900">{activeSensorData.temp}°C</b></span>
                </div>
              </motion.div>
            </div>

            {/* Bottom Heatmap Scale / Indicator */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-arabic text-[11px]">تدرج الحمل السريري:</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold">آمن (&lt;40 kPa)</span>
                <div className="w-36 h-2 rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500" />
                <span className="text-[10px] text-rose-600 font-bold">مرتفع (&gt;75 kPa)</span>
              </div>
            </div>
          </div>

          {/* ════ RIGHT: CLINICAL METRICS & AI BIOMECHANICS (5 COLS) ════ */}
          <div className="lg:col-span-5 flex flex-col gap-5 justify-between">
            
            {/* Card 1: Peak Pressure & Tissue Risk */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm text-right">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-2xl text-[#0B4D8D]">
                  <Gauge className="w-5 h-5" />
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 font-arabic">
                  المعيار السريري للضغط
                </span>
              </div>
              
              <div className="flex items-baseline justify-end gap-1.5 mb-1" dir="ltr">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono">58.4</span>
                <span className="text-sm font-bold text-slate-400 font-mono">kPa</span>
              </div>
              
              <h4 className="text-base font-bold text-slate-900 font-arabic mb-1.5">
                ذروة الضغط الأخمصي (Peak Pressure)
              </h4>
              <p className="text-xs text-slate-500 font-arabic leading-relaxed font-light">
                متوسط الضغط ضمن العتبة الآمنة (&lt; 70 kPa). تم رصد استجابة حركية متوازنة تمنع تركز الإجهاد الميكانيكي على الأنسجة الرخوة.
              </p>
            </div>

            {/* Card 2: Gait Symmetry & Kinetic Balance */}
            <div className="bg-gradient-to-br from-[#0B2038] to-[#091526] rounded-3xl p-6 text-white shadow-md relative overflow-hidden text-right">
              <div className="flex justify-between items-center mb-4">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  تماثل حركي ممتاز
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-arabic">توازن وتماثل المشية (Gait Symmetry)</span>
                  <div className="p-2 bg-white/10 rounded-xl text-emerald-400">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* L/R Distribution Bar */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs font-mono text-slate-300" dir="ltr">
                  <span>LEFT: {loadL}%</span>
                  <span>RIGHT: {loadR}%</span>
                </div>
                <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden flex p-0.5">
                  <div className="h-full bg-blue-400 rounded-l-full transition-all duration-700" style={{ width: `${loadL}%` }} />
                  <div className="h-full bg-emerald-400 rounded-r-full transition-all duration-700" style={{ width: `${loadR}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <p className="text-xs text-slate-300 font-arabic font-light">
                  مؤشر تماثل الخطوة: <b className="text-emerald-400 font-mono text-sm">94.8%</b> (توزيع أحمال طبيعي)
                </p>
              </div>
            </div>

            {/* Card 3: Microclimate & Temperature Dual Strip */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* Thermal Delta */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm text-right flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Thermometer className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">ΔT Thermography</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono text-slate-900 mb-0.5" dir="ltr">0.4°C</p>
                  <p className="text-xs font-bold text-slate-800 font-arabic">الفارق الحراري بين القدمين</p>
                  <p className="text-[11px] text-slate-400 font-arabic mt-0.5">ضمن المعدل الآمن (&lt; 2.2°C)</p>
                </div>
              </div>

              {/* Internal Humidity */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm text-right flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-blue-50 text-[#0B4D8D] rounded-xl">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Microclimate</span>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono text-slate-900 mb-0.5" dir="ltr">41% RH</p>
                  <p className="text-xs font-bold text-slate-800 font-arabic">رطوبة الحيز الداخلي</p>
                  <p className="text-[11px] text-slate-400 font-arabic mt-0.5">بيئة جافة تمنع تراخي الأنسجة</p>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
