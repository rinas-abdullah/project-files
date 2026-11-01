"use client";

import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Activity, Cpu, Thermometer, Footprints } from "lucide-react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

interface Hotspot {
  id: string;
  index: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  dotX: number; // % position over the landscape (desktop) photo
  dotY: number;
  dotXMobile: number; // % position over the portrait (mobile) photo
  dotYMobile: number;
  labelY: number; // SVG % coordinate Y for label alignment
  side: "left" | "right";
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const hotspots: Hotspot[] = [
  {
    id: "pressure",
    index: "01",
    nameAr: "اللبادة — حساسات الضغط",
    nameEn: "The Pad — Pressure Sensors",
    descAr: "لبادة رقيقة تبقى داخل كل حذاء أو شبشب أو جبيرة: حساسات ضغط رقيقة ورقاقة NFC تعرّف نوع الحذاء وطبقة EVA مريحة وطبقة قابلة للغسل. لا بطارية ولا إلكترونيات تحت وزن الجسم.",
    descEn: "A thin pad that stays inside each shoe, slipper, or cast: thin pressure sensors, an NFC chip that identifies the shoe, an EVA comfort layer, and a washable top layer. No battery or electronics under body weight.",
    dotX: 68,
    dotY: 36,
    dotXMobile: 64,
    dotYMobile: 68,
    labelY: 20,
    side: "left",
    icon: Footprints,
  },
  {
    id: "capsule",
    index: "02",
    nameAr: "الكبسولة المغناطيسية",
    nameEn: "The Magnetic Capsule",
    descAr: "كبسولة واحدة لكل قدم تثبت مغناطيسياً على جانب الكعب من الخارج وتنتقل بين اللبادات عند تغيير الحذاء. بداخلها المعالج وحساس الحركة والميلان وحساس الحرارة والرطوبة والهزّاز والبلوتوث والبطارية.",
    descEn: "One capsule per foot, magnetically attached to the outside of the heel, moving between pads when the shoe changes. It holds the processor, motion/tilt sensor, temperature/humidity sensor, buzzer, Bluetooth, and battery.",
    dotX: 26,
    dotY: 47,
    dotXMobile: 53,
    dotYMobile: 26,
    labelY: 38,
    side: "right",
    icon: Cpu,
  },
  {
    id: "temp",
    index: "03",
    nameAr: "الحرارة والرطوبة",
    nameEn: "Temperature & Humidity",
    descAr: "تقيس الكبسولة الحرارة والرطوبة داخل الحذاء — جُرّب هذا فعلياً: ارتفاع +4.9°C داخل الحذاء و+1.4°C داخل الشبشب خلال 20 دقيقة في تجارب أولية.",
    descEn: "The capsule measures in-shoe temperature and humidity — tested in early trials: +4.9°C inside a shoe and +1.4°C inside a slipper over 20 minutes.",
    dotX: 52,
    dotY: 58,
    dotXMobile: 42,
    dotYMobile: 52,
    labelY: 68,
    side: "left",
    icon: Thermometer,
  },
  {
    id: "alert",
    index: "04",
    nameAr: "التنبيه الفوري",
    nameEn: "Immediate Alert",
    descAr: "عند تجاوز الحد الذي يضعه الطبيب، تهتز الكبسولة فوراً ويظهر إشعار في جوال المريض، ثم تتصاعد التنبيهات تدريجياً إذا تكرر الأمر.",
    descEn: "When the doctor-set limit is exceeded, the capsule vibrates immediately and a phone notification appears, escalating gradually if it repeats.",
    dotX: 80,
    dotY: 60,
    dotXMobile: 40,
    dotYMobile: 80,
    labelY: 82,
    side: "right",
    icon: Activity,
  },
];

export default function Hero() {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  // Matches ContainerScroll's own breakpoint (768px) for when its device
  // frame switches from the tall mobile shape to the wide desktop shape —
  // the portrait vs. landscape pad photo must switch at the same point.
  const [isFrameMobile, setIsFrameMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsFrameMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-screen w-full overflow-hidden bg-transparent flex flex-col justify-start"
    >
      {/* Global background is now loaded from RootLayout */}


      {/* Dynamic 3D Scroll Presentation */}
      <div className="relative z-10 w-full md:-mt-10">
        <ContainerScroll
          titleComponent={
            <div className="flex flex-col items-center justify-center text-center select-none px-4 max-w-4xl mx-auto">
              {/* Arabic Dominant Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.05 }}
                className="font-arabic text-[36px] sm:text-[48px] lg:text-[54px] font-bold leading-[1.2] text-[#0F172A] tracking-tight"
              >
                الرعاية الصحية لا تنتهي عند مغادرة المستشفى
              </motion.h1>

              {/* English Support line */}
              <motion.h2
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.12 }}
                className="mt-3 font-sans text-md sm:text-lg font-light tracking-wide text-slate-400 max-w-2xl leading-relaxed"
              >
                Healthcare does not end when the patient leaves the hospital
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-5 font-arabic text-sm sm:text-base font-light leading-relaxed text-slate-500 max-w-2xl"
              >
                دِثار لبادة طبية ذكية رقيقة تبقى داخل كل حذاء، وكبسولة إلكترونية واحدة تنتقل بينها وتثبت مغناطيسياً على الكعب — تقيس الحمل على القدم والحركة والحرارة والرطوبة، وتنبّه المريض فوراً، وترسل البيانات إلى منصة تربط المريض وعائلته وطبيبه والمنشأة الصحية. الفئة الأولى للإطلاق: التأهيل بعد جراحات القدم والكاحل (التحميل الجزئي للوزن).
              </motion.p>

              {/* Minimal Horizontal Capability List (Replaces all generic cards) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="mt-6.5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500 font-sans tracking-wide border-t border-b border-slate-100 py-3 w-full max-w-2xl"
              >
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-blue" />
                  Pressure Analysis
                </span>
                <span className="hidden md:inline h-3 w-px bg-slate-200" />
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-blue" />
                  Gait Monitoring
                </span>
                <span className="hidden md:inline h-3 w-px bg-slate-200" />
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-blue" />
                  Temperature Tracking
                </span>
                <span className="hidden md:inline h-3 w-px bg-slate-200" />
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-smart-green" />
                  Predictive Insights
                </span>
              </motion.div>


            </div>
          }
        >
          {/* CENTERPIECE: Insole product rendering inside the clinical device frame */}
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-white dark:bg-slate-950">
            {/* Floating Brand Badge */}
            <div className="absolute top-3 right-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 shadow-xs select-none">
              <Image src="/logo-icon.png" alt="Dithar" width={16} height={16} className="object-contain dark:hidden" />
              <Image src="/logo-icon-white.png" alt="Dithar" width={16} height={16} className="object-contain hidden dark:block" />
              <span className="text-[11px] font-bold font-arabic text-primary-blue dark:text-medical-blue">دِثار — لبادة وكبسولة</span>
            </div>

            {/* Product Photograph — portrait crop on mobile (matches the tall device frame), landscape on desktop */}
            <div className="absolute inset-0 w-full h-full select-none">
              <Image
                src={isFrameMobile ? "/pad-sensor-view-portrait.jpg" : "/pad-sensor-view.jpg"}
                alt="DITHAR pad — sensor layout"
                fill
                priority
                className="object-cover filter drop-shadow-sm"
              />
            </div>

            <div className="relative w-full h-full flex items-center justify-center max-w-2xl mx-auto select-none">

              {/* Instructional hint for desktop interaction */}
              {!isMobile && (
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs font-sans text-slate-500 dark:text-slate-400 z-20">
                  اضغط على النقاط لاستكشاف المكونات
                </div>
              )}

              {/* Numbered hotspot badges directly on the insole */}
              {hotspots.map((item, index) => {
                const isActive = activeHotspot === item.id;
                return (
                  <button
                    key={item.id}
                    className="absolute z-20 flex items-center justify-center cursor-pointer focus:outline-none"
                    style={{
                      left: `${isFrameMobile ? item.dotXMobile : item.dotX}%`,
                      top: `${isFrameMobile ? item.dotYMobile : item.dotY}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    onMouseEnter={() => setActiveHotspot(item.id)}
                    onMouseLeave={() => !isMobile && setActiveHotspot(null)}
                    onClick={() => setActiveHotspot(isMobile && isActive ? null : item.id)}
                  >
                    {isActive && (
                      <span className="absolute w-9 h-9 rounded-full animate-ping opacity-50 bg-smart-green/30" />
                    )}
                    <span
                      className={`relative flex items-center justify-center w-7 h-7 rounded-full border font-sans text-xs font-bold backdrop-blur-md shadow-sm transition-all duration-300 select-none ${
                        isActive
                          ? "border-smart-green bg-white/95 text-smart-green dark:bg-zinc-950/95 shadow-[0_0_15px_rgba(57,181,106,0.4)] scale-110"
                          : "border-slate-200 bg-white/70 text-primary-blue dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-medical-blue hover:scale-105 hover:border-primary-blue/50"
                      }`}
                    >
                      {index + 1}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Embedded Clinical Detail Widget (single info panel for all breakpoints) */}
            <div className="absolute bottom-4 left-6 right-6 z-30">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeHotspot || "default"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="w-full max-w-lg mx-auto bg-white/95 backdrop-blur-md border border-slate-100/60 shadow-[0_8px_30px_rgba(11,77,141,0.03)] rounded-xl p-3.5"
                >
                  {activeHotspot ? (
                    <div className="flex flex-col text-right">
                      <div className="flex flex-col border-b border-slate-100/50 pb-1.5 mb-1.5">
                        <span className="font-arabic text-xs font-bold text-slate-800">
                          {hotspots.find((h) => h.id === activeHotspot)?.nameAr}
                        </span>
                        <span className="font-sans text-[8px] font-bold tracking-[0.14em] text-smart-green uppercase mt-0.5">
                          {hotspots.find((h) => h.id === activeHotspot)?.nameEn}
                        </span>
                      </div>
                      <p className="font-arabic text-xs font-light leading-relaxed text-slate-600">
                        {hotspots.find((h) => h.id === activeHotspot)?.descAr}
                      </p>
                      <p className="font-sans text-[9px] text-slate-400 mt-1 leading-relaxed">
                        {hotspots.find((h) => h.id === activeHotspot)?.descEn}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-1 text-center select-none">
                      <span className="font-sans text-[8px] font-bold uppercase tracking-[0.18em] text-slate-400">
                        CLINICAL SPECIFICATIONS
                      </span>
                      <p className="font-arabic text-[11px] font-light text-slate-500 mt-1">
                        {isMobile
                          ? "انقر على النقاط النشطة لاستكشاف مكونات اللباد الطبي الذكي"
                          : "مرر الفأرة فوق نقاط الاستشعار لاستكشاف مكونات اللباد الطبي الذكي"
                        }
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </ContainerScroll>
      </div>


    </section>
  );
}