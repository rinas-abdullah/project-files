"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import ThreeCanvas from "@/components/ThreeCanvas";
import SmartPad3D from "@/components/SmartPad3D";
import { Layers, ShieldCheck, HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ExplodedView() {
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  const [explodedFactor, setExplodedFactor] = useState(0);
  const explodedRef = useRef(0);

  // Smoothly animate the exploded factor using GSAP
  const animateExplode = (targetVal: number, callback?: () => void) => {
    const obj = { val: explodedRef.current };
    gsap.to(obj, {
      val: targetVal,
      duration: 0.8,
      ease: "power2.out",
      onUpdate: () => {
        explodedRef.current = obj.val;
        setExplodedFactor(obj.val);
      },
      onComplete: callback,
    });
  };

  const selectLayer = (index: number) => {
    setActiveLayer(index);
    // If the model is not exploded, explode it smoothly
    if (explodedRef.current < 0.95) {
      animateExplode(1);
    }
  };

  const explodeAll = () => {
    setActiveLayer(null);
    animateExplode(1);
  };

  const collapseAll = () => {
    setActiveLayer(null);
    animateExplode(0);
  };

  const layersInfo = [
    {
      index: 0,
      title: "1. طبقة EVA سفلية • Anti-Slip EVA Base",
      desc: "الطبقة الخارجية السفلية المصنوعة من مواد طبية متقدمة مقاومة للانزلاق والتآكل والصدمات، تشكّل الهيكل الواقي الأساسي للباد الذكي.",
    },
    {
      index: 1,
      title: "2. طبقة عزل وحماية • Insulation & Protection",
      desc: "طبقة عازلة متخصصة مقاومة للرطوبة والاهتزاز، تحمي المكونات الإلكترونية الداخلية وتمنع التأثيرات البيئية الخارجية.",
    },
    {
      index: 2,
      title: "3. وحدة التخزين الكهربائي • Power Storage Cell",
      desc: "خلية تخزين طاقة رقيقة قابلة لإعادة الشحن الكامل بشكل مستمر عبر طاقة الاحتكاك الناتجة عن الضغط والحركة — دون الحاجة لشحن خارجي.",
    },
    {
      index: 3,
      title: "4. طبقة حصاد الطاقة • Piezo + Friction Energy Harvesting",
      desc: "ملفات كهروضغطية نحاسية تولّد تياراً كهربائياً من ضغط المشي، وتعمل جنباً إلى جنب مع تقنية طاقة الاحتكاك لشحن وحدة التخزين بشكل ذاتي ومستمر.",
    },
    {
      index: 4,
      title: "5. لوحة الدوائر المرنة PCB • Flexible Circuit Board",
      desc: "لوحة دوائر مرنة مصممة خصيصاً بشكل يتوافق مع انحناء القدم، تحتوي على المعالج المركزي وهوائي BLE وكافة مسارات الإشارة الكهربائية.",
    },
    {
      index: 5,
      title: "6. طبقة المستشعرات • Multi-Sensor Array",
      desc: "الطبقة الاستشعارية المتكاملة التي تضم حساسات الضغط (14 نقطة) والحرارة الموزعة والرطوبة ووحدة قياس الحركة IMU — كلها في طبقة واحدة مرنة.",
    },
    {
      index: 6,
      title: "7. طبقة رغوة مرنة (PU) • Flexible PU Foam",
      desc: "رغوة بوليمر مرنة عالية الاسترداد تمنح الراحة القصوى وتمتص صدمات الخطوة، تقع مباشرةً أسفل سطح الملامسة لضمان أعلى مستوى راحة.",
    },
    {
      index: 7,
      title: "8. طبقة القماش المضاد للبكتيريا • Antibacterial Fabric",
      desc: "السطح العلوي الناعم المضاد للبكتيريا والفطريات، عالي التهوية ومقاوم للروائح، يلامس القدم مباشرةً ويوفر بيئة صحية نظيفة في جميع الظروف.",
    },
  ];

  return (
    <section className="relative min-h-screen w-full bg-transparent text-[#0F172A] flex items-center py-24 px-6 lg:px-16 overflow-hidden">

      <div className="w-full max-w-7xl mx-auto z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

        {/* Left Side: Exploded 3D Canvas Viewport */}
        <div className="lg:col-span-6 h-[400px] sm:h-[550px] w-full relative order-last lg:order-first">
          {/* Instructions overlay */}
          <div className="absolute top-4 left-4 z-20 glassmorphism rounded-2xl px-4 py-2 text-xs border border-slate-100/60 pointer-events-none">
            <span className="text-muted-text font-medium"><span className="font-arabic">اسحب لتدوير النموذج ثلاثي الأبعاد</span> <span className="unified-english">• Drag to Rotate</span></span>
          </div>

          <div className="w-full h-full cursor-grab active:cursor-grabbing">
            <ThreeCanvas cameraPos={[-1.5, 0, 7.5]} enableRotate enableZoom={false}>
              <SmartPad3D
                mode="exploded"
                explodedFactor={explodedFactor}
                activeLayer={activeLayer}
                onModelClick={explodeAll}
                onHotspotClick={(id) => {
                  // Map hotspot ID → new layer index
                  let targetIdx: number | null = null;
                  if (id === "pressure" || id === "temp" || id === "temperature" ||
                    id === "humidity" || id === "motion") targetIdx = 5;
                  else if (id === "ai" || id === "comms" || id === "communication") targetIdx = 4;
                  else if (id === "energy" || id === "power") targetIdx = 3;

                  if (targetIdx !== null) selectLayer(targetIdx);
                }}
              />
            </ThreeCanvas>
          </div>
        </div>

        {/* Right Side: Interactive Panel */}
        <div className="lg:col-span-6 flex flex-col justify-center text-right z-10 select-none">
          <span className="text-xs font-semibold tracking-wider text-medical-blue uppercase mb-3 font-sans flex items-center gap-2 justify-end unified-english">
            <Layers className="w-4 h-4 text-medical-blue" />
            INTERACTIVE EXPLODED DEMO
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-arabic leading-tight unified-typography">
            العرض المفكك التقني
          </h2>
          <h3 className="text-xl sm:text-2xl font-light text-medical-blue mt-2 font-sans unified-english">
            Exploded Smart PAD View
          </h3>
          <p className="text-muted-text text-sm md:text-base mt-4 max-w-xl font-light leading-relaxed font-arabic">
            تأمل الهيكل الداخلي المذهل المكون من 8 طبقات طبية إلكترونية دقيقة تعمل بانسجام مطلق لتأمين مراقبة سريرية مستمرة لخطواتك. انقر على أي طبقة أدناه لاستكشاف تفاصيلها الفنية.
          </p>

          {/* Master Control Buttons */}
          <div className="flex flex-row-reverse gap-3 mt-8 max-w-xl w-full">
            <button
              onClick={explodeAll}
              className={`flex-1 flex flex-row-reverse justify-center items-center gap-2 py-3 px-4 rounded-xl border transition-all duration-300 text-sm font-semibold font-arabic cursor-pointer ${explodedFactor > 0.85 && activeLayer === null
                  ? "border-medical-blue bg-medical-blue/20 text-medical-blue shadow-lg shadow-medical-blue/10 scale-102"
                  : "border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-800"
                }`}
            >
              <Layers className="w-4 h-4" />
              تفكيك طبقات اللباد الذكي
            </button>
            <button
              onClick={collapseAll}
              className={cn(
                "flex-1 flex flex-row-reverse justify-center items-center gap-2 py-3 px-4 rounded-xl border transition-all duration-300 text-sm font-semibold font-arabic cursor-pointer",
                explodedFactor < 0.15 && activeLayer === null
                  ? "border-medical-blue bg-medical-blue/20 text-medical-blue shadow-lg shadow-medical-blue/10 scale-102"
                  : "border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-800"
              )}
            >
              <ShieldCheck className="w-4 h-4" />
              تجميع اللباد معاً
            </button>
          </div>

          {/* Info on selected layer */}
          <div className="mt-8 text-center max-w-xl mx-auto" dir="rtl">
            <h4 className="text-base font-bold text-dark-text font-arabic">
              تفاصيل الهيكل الداخلي للباد الطبي الذكي
            </h4>
          </div>

          {/* Interactive Layers Selector Grid */}
          <div className="grid grid-cols-2 gap-2.5 mt-4 max-w-xl w-full">
            {layersInfo.map((l) => {
              const isSelected = activeLayer === l.index;
              return (
                <button
                  key={l.index}
                  onClick={() => selectLayer(l.index)}
                  className={`flex flex-row-reverse items-center gap-3 p-3 rounded-xl border text-right cursor-pointer transition-all duration-300 ${isSelected
                      ? "border-medical-blue bg-medical-blue/15 text-medical-blue font-semibold translate-x-1 shadow-md shadow-medical-blue/5"
                      : "border-slate-200/60 hover:border-slate-300/80 hover:bg-slate-50 text-slate-700"
                    }`}
                >
                  <div className={`p-1.5 rounded-lg ${isSelected ? "bg-medical-blue/20" : "bg-slate-100/60"}`}>
                    <Layers className="w-3.5 h-3.5 text-medical-blue" />
                  </div>
                  <span className="text-xs sm:text-sm font-arabic font-medium truncate">
                    {l.title.split(" • ")[0].substring(3)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Description Card with transitions */}
          <div className="mt-6 relative h-40 max-w-xl w-full">
            {layersInfo.map((l) => {
              const isCurrent = activeLayer === l.index;
              return (
                <motion.div
                  key={l.index}
                  className="absolute inset-0 p-6 rounded-2xl glassmorphism border border-slate-200/50 flex flex-col items-end justify-center text-right shadow-sm shadow-slate-100/50"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{
                    opacity: isCurrent ? 1 : 0,
                    scale: isCurrent ? 1 : 0.95,
                    pointerEvents: isCurrent ? "auto" : "none",
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <h4 className="text-base sm:text-lg font-bold text-smart-green font-arabic mb-2">
                    {l.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-text leading-relaxed font-light font-arabic">
                    {l.desc}
                  </p>
                </motion.div>
              );
            })}

            {/* Exploded overview summary */}
            <motion.div
              className="absolute inset-0 p-6 rounded-2xl glassmorphism border border-slate-200/50 flex flex-col items-end justify-center text-right shadow-sm shadow-slate-100/50"
              initial={{ opacity: 0 }}
              animate={{
                opacity: explodedFactor > 0.85 && activeLayer === null ? 1 : 0,
                pointerEvents: explodedFactor > 0.85 && activeLayer === null ? "auto" : "none",
              }}
              transition={{ duration: 0.3 }}
            >
              <h4 className="text-base sm:text-lg font-bold text-smart-green font-arabic mb-2">
                تفاصيل الهيكل الداخلي للباد الطبي الذكي
              </h4>
              <p className="text-xs sm:text-sm text-muted-text leading-relaxed font-light font-arabic">
                يحتوي دثار على 8 طبقات تقنية متطورة، تتكامل معاً لتوفير رصد سريري مستمر وسلس. اضغط على أي طبقة محددة في القائمة لقراءة تفاصيل الاستشعار الخاصة بها.
              </p>
            </motion.div>

            {/* Default prompt when fully compressed */}
            <motion.div
              className="absolute inset-0 p-6 rounded-2xl glassmorphism border border-slate-200/50 flex flex-col items-center justify-center text-center shadow-sm shadow-slate-100/50"
              initial={{ opacity: 1 }}
              animate={{
                opacity: explodedFactor < 0.15 && activeLayer === null ? 1 : 0,
                pointerEvents: explodedFactor < 0.15 && activeLayer === null ? "auto" : "none",
              }}
              transition={{ duration: 0.3 }}
            >
              <HeartPulse className="w-8 h-8 text-medical-blue mb-2 animate-pulse" />
              <p className="text-xs text-muted-text tracking-widest font-mono">
                CLICK A LAYER OR TOGGLE TO EXPLODE THE DEVICE
              </p>
            </motion.div>
          </div>
        </div>

      </div>
    </section>
  );
}
