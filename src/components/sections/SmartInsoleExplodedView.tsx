"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bluetooth, Layers, HelpCircle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
type Layer = {
  id: string;
  index: number;
  nameAr: string;
  nameEn: string;
  shortDescAr: string;
  fullDescAr: string;
  color: string;
};

// --- Combined Layer Data from ExplodedView & Reference Images ---
const INSOLE_LAYERS: Layer[] = [
  {
    id: "layer-1",
    index: 7,
    nameAr: "طبقة قماش مضاد للبكتيريا",
    nameEn: "Antibacterial Fabric",
    shortDescAr: "ناعمة وتهوية عالية",
    fullDescAr: "السطح العلوي الناعم المضاد للبكتيريا والفطريات، عالي التهوية ومقاوم للروائح، يلامس القدم مباشرةً ويوفر بيئة صحية نظيفة في جميع الظروف.",
    color: "#222222",
  },
  {
    id: "layer-2",
    index: 6,
    nameAr: "طبقة رغوة مرنة (PU)",
    nameEn: "Flexible PU Foam",
    shortDescAr: "لمنح الراحة وامتصاص الصدمات",
    fullDescAr: "رغوة بوليمر مرنة عالية الاسترداد تمنح الراحة القصوى وتمتص صدمات الخطوة، تقع مباشرةً أسفل سطح الملامسة لضمان أعلى مستوى راحة.",
    color: "#e5e7eb",
  },
  {
    id: "layer-3",
    index: 5,
    nameAr: "طبقة المستشعرات",
    nameEn: "Multi-Sensor Array",
    shortDescAr: "حساسات الضغط والحرارة والرطوبة و IMU",
    fullDescAr: "الطبقة الاستشعارية المتكاملة التي تضم حساسات الضغط (14 نقطة) والحرارة الموزعة والرطوبة ووحدة قياس الحركة IMU — كلها في طبقة واحدة مرنة.",
    color: "#4b5563",
  },
  {
    id: "layer-4",
    index: 4,
    nameAr: "لوحة الدوائر PCB",
    nameEn: "Flexible Circuit Board",
    shortDescAr: "مصممة خصيصاً بشكل مرن",
    fullDescAr: "لوحة دوائر مرنة مصممة خصيصاً بشكل يتوافق مع انحناء القدم، تحتوي على المعالج المركزي وهوائي BLE وكافة مسارات الإشارة الكهربائية.",
    color: "#059669",
  },
  {
    id: "layer-5",
    index: 3,
    nameAr: "طبقة حصاد الطاقة",
    nameEn: "Energy Harvesting Layer",
    shortDescAr: "كهرضغطية تولد طاقة من الضغط والاحتكاك",
    fullDescAr: "ملفات كهروضغطية نحاسية تولّد تياراً كهربائياً من ضغط المشي، وتعمل جنباً إلى جنب مع تقنية طاقة الاحتكاك لشحن وحدة التخزين بشكل ذاتي ومستمر.",
    color: "#b45309",
  },
  {
    id: "layer-6",
    index: 2,
    nameAr: "بطارية ليثيوم بوليمر",
    nameEn: "Lithium Polymer Battery",
    shortDescAr: "قابلة لإعادة الشحن ذاتياً",
    fullDescAr: "خلية تخزين طاقة رقيقة قابلة لإعادة الشحن الكامل بشكل مستمر عبر طاقة الاحتكاك الناتجة عن الضغط والحركة — دون الحاجة لشحن خارجي.",
    color: "#9ca3af",
  },
  {
    id: "layer-7",
    index: 1,
    nameAr: "طبقة عزل وحماية",
    nameEn: "Insulation & Protection Layer",
    shortDescAr: "مقاومة للرطوبة والاهتزاز",
    fullDescAr: "طبقة عازلة متخصصة مقاومة للرطوبة والاهتزاز، تحمي المكونات الإلكترونية الداخلية وتمنع التأثيرات البيئية الخارجية.",
    color: "#1f2937",
  },
  {
    id: "layer-8",
    index: 0,
    nameAr: "طبقة EVA سفلية",
    nameEn: "EVA Bottom Base",
    shortDescAr: "مقاومة للانزلاق والتآكل",
    fullDescAr: "الطبقة الخارجية السفلية المصنوعة من مواد طبية متقدمة مقاومة للانزلاق والتآكل والصدمات، تشكّل الهيكل الواقي الأساسي للباد الذكي.",
    color: "#111827",
  },
];

const PCB_COMPONENTS = [
  { name: "BLE Antenna", nameAr: "هوائي البلوتوث" },
  { name: "Microcontroller", nameAr: "وحدة المعالجة المركزية" },
  { name: "Power Management", nameAr: "نظام إدارة الطاقة" },
  { name: "Memory", nameAr: "وحدة التخزين المؤقت" },
  { name: "Connectors", nameAr: "موصلات الشحن والبرمجة" },
  { name: "LED Indicator", nameAr: "مؤشر الحالة الضوئي" },
];

// --- Shared Base Path ---
const INSOLE_PATH = "M 45 10 C 75 5, 95 40, 85 100 C 75 160, 70 190, 70 230 C 70 265, 60 275, 50 275 C 40 275, 30 265, 30 230 C 30 180, 15 150, 15 100 C 15 40, 25 15, 45 10 Z";

// --- SVG Textures & Filters ---
const SvgDefs = () => (
  <svg className="w-0 h-0 absolute">
    <defs>
      {/* Noise filter */}
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
        <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.18 0" />
        <feBlend mode="multiply" in2="SourceGraphic" in="noise" />
      </filter>

      {/* Fabric Mesh Pattern (Premium Top Mesh) */}
      <pattern id="fabric-mesh" width="3" height="3" patternUnits="userSpaceOnUse">
        <rect width="3" height="3" fill="#1b1d24" />
        <circle cx="1.5" cy="1.5" r="0.7" fill="#2d323e" />
      </pattern>

      {/* EVA Grip Pattern (Carbon style) */}
      <pattern id="eva-grip" width="5" height="5" patternUnits="userSpaceOnUse">
        <rect width="5" height="5" fill="#0c0e12" />
        <path d="M 0 2.5 L 5 2.5 M 2.5 0 L 2.5 5" stroke="#181c24" strokeWidth="0.6" />
      </pattern>
      
      {/* Holes for Sensor Layer */}
      <pattern id="holes" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
        <circle cx="5" cy="5" r="2.8" fill="#1b222d" />
      </pattern>

      {/* Coils for Energy Layer */}
      <pattern id="coils" x="0" y="0" width="100" height="40" patternUnits="userSpaceOnUse">
        <path d="M 10 20 Q 25 5 50 20 T 90 20" fill="none" stroke="url(#gold-grad)" strokeWidth="0.8" opacity="0.75"/>
        <path d="M 10 25 Q 25 10 50 25 T 90 25" fill="none" stroke="url(#gold-grad)" strokeWidth="0.8" opacity="0.75"/>
        <path d="M 10 30 Q 25 15 50 30 T 90 30" fill="none" stroke="url(#gold-grad)" strokeWidth="0.8" opacity="0.75"/>
      </pattern>

      {/* Gold Trace Gradient */}
      <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="50%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#fef08a" />
      </linearGradient>

      {/* Silver Foil Battery Gradient */}
      <linearGradient id="silver-foil" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9ca3af" />
        <stop offset="30%" stopColor="#f3f4f6" />
        <stop offset="60%" stopColor="#cbd5e1" />
        <stop offset="90%" stopColor="#f9fafb" />
        <stop offset="100%" stopColor="#6b7280" />
      </linearGradient>

      {/* PCB Green Gradient */}
      <linearGradient id="pcb-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#065f46" />
        <stop offset="100%" stopColor="#042f2c" />
      </linearGradient>

      {/* Energy Harvest Copper Base */}
      <linearGradient id="copper-base" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#92400e" />
        <stop offset="50%" stopColor="#78350f" />
        <stop offset="100%" stopColor="#451a03" />
      </linearGradient>
    </defs>
  </svg>
);

// --- Individual Layer Renderer with 3D Wall Extrusion ---
const LayerShape = ({ layer, isExploded }: { layer: Layer; isExploded: boolean }) => {
  let topFill = "";
  let wallFill = "";
  let thickness = 2; // Pseudo-3D wall height in pixels

  switch (layer.id) {
    case "layer-1": // Fabric
      topFill = "url(#fabric-mesh)";
      wallFill = "#0a0b0d";
      thickness = 3.5;
      break;
    case "layer-2": // PU Foam
      topFill = "#f8fafc";
      wallFill = "#cbd5e1";
      thickness = 4.5;
      break;
    case "layer-3": // Sensors
      topFill = "#2d3748";
      wallFill = "#1a202c";
      thickness = 2;
      break;
    case "layer-4": // PCB
      topFill = "url(#pcb-grad)";
      wallFill = "#022c22";
      thickness = 2.5;
      break;
    case "layer-5": // Coils
      topFill = "url(#copper-base)";
      wallFill = "#2d1502";
      thickness = 2;
      break;
    case "layer-6": // Battery
      topFill = "url(#silver-foil)";
      wallFill = "#4b5563";
      thickness = 3;
      break;
    case "layer-7": // Insulation (make it match Energy Harvesting layer appearance)
      // Match visual style and thickness to layer-5 (Energy Harvesting)
      topFill = "url(#copper-base)";
      wallFill = "#2d1502";
      thickness = 2;
      break;
    case "layer-8": // EVA Base
      topFill = "url(#eva-grip)";
      wallFill = "#050608";
      thickness = 6.5;
      break;
  }

  return (
    <svg viewBox="0 0 100 280" className="w-full h-full drop-shadow-xl overflow-visible">
      {/* 3D Side Wall / Bevel */}
      <path 
        d={INSOLE_PATH}
        fill={wallFill}
        transform={`translate(0, ${thickness})`}
        stroke="#00000040"
        strokeWidth="0.5"
      />

      {/* Top Surface */}
      <path 
        d={INSOLE_PATH}
        fill={topFill}
        stroke="#00000020"
        strokeWidth="0.8"
        filter={layer.id === "layer-1" || layer.id === "layer-8" ? "url(#noise)" : ""}
      />

      {/* Layer 1: Fabric Top branding & contoured highlights */}
      {layer.id === "layer-1" && (
        <g>
           {/* Heel cup depression gradient overlay */}
           <g transform="translate(0, 120)">
             {/* Radial shading to create depth contour */}
             <ellipse cx="50" cy="95" rx="20" ry="16" fill="none" stroke="#2a2e38" strokeWidth="1.2" opacity="0.7" />
             <ellipse cx="50" cy="95" rx="15" ry="12" fill="#0e1013" opacity="0.5" />
             
             {/* Foot icon inside heel cup */}
             <g transform="translate(47.5, 83) scale(0.6)" fill="#e2e8f0" opacity="0.9">
               <path d="M 4.5 15 C 2.5 15, 0 12, 0 7 C 0 2, 2.5 0, 4.5 0 C 6.5 0, 9 2, 9 7 C 9 12, 6.5 15, 4.5 15 Z" />
               <circle cx="-2.5" cy="-2" r="2.3" />
               <circle cx="1.5" cy="-4.5" r="2.0" />
               <circle cx="6" cy="-5" r="1.7" />
               <circle cx="10" cy="-3.5" r="1.4" />
               <circle cx="13" cy="-1" r="1.1" />
             </g>
             
             {/* Brand Logo text (White/Silver pop) */}
             <text x="50" y="112" fontSize="9" fill="#ffffff" textAnchor="middle" fontWeight="bold" letterSpacing="0.6" fontFamily="sans-serif">Dithar</text>
             <text x="50" y="120" fontSize="3.5" fill="#94a3b8" textAnchor="middle" letterSpacing="0.8" fontFamily="sans-serif">SMART PAD</text>
           </g>

           {/* Ventilation holes grid */}
           <g opacity="0.45" fill="#060709">
             {[
               [40,50],[50,50],[60,50],
               [38,62],[48,62],[58,62],
               [40,74],[50,74],[60,74],
               [42,86],[50,86],[58,86],
             ].map(([cx, cy], i) => (
               <circle key={i} cx={cx} cy={cy} r="1.1" />
             ))}
           </g>
           
           {/* Glowing activity dots */}
           <g className="animate-pulse" opacity={isExploded ? 0.25 : 1}>
             <circle cx="45" cy="145" r="1.6" fill="#10b981" filter="drop-shadow(0 0 2.5px #10b981)" />
             <circle cx="40" cy="155" r="1.6" fill="#06b6d4" filter="drop-shadow(0 0 2.5px #06b6d4)" />
             <circle cx="35" cy="165" r="1.6" fill="#06b6d4" filter="drop-shadow(0 0 2.5px #06b6d4)" />
             <circle cx="30" cy="175" r="1.6" fill="#10b981" filter="drop-shadow(0 0 2.5px #10b981)" />
           </g>
        </g>
      )}

      {/* Layer 2: PU Foam cushion visual lines */}
      {layer.id === "layer-2" && (
        <g opacity="0.3">
          {[50, 90, 130, 170, 210].map((yVal, i) => (
            <path key={i} d={`M 25 ${yVal} L 75 ${yVal}`} stroke="#cbd5e1" strokeWidth="0.8" />
          ))}
        </g>
      )}

      {/* Layer 3: Sensor Array & Concentric Piezo Rings */}
      {layer.id === "layer-3" && (
        <g>
          <path d={INSOLE_PATH} fill="url(#holes)" opacity="0.45" />
          {/* Pressure sensor nodes */}
          {[
            [35,45],[50,40],[65,45],
            [32,70],[50,68],[68,70],
            [40,110],[60,110],
            [42,160],[58,160],
            [50,225]
          ].map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="5" fill="#10b981" opacity="0.75" />
              {/* Inner ring */}
              <circle cx={cx} cy={cy} r="3.2" fill="none" stroke="#ffffff" strokeWidth="0.6" opacity="0.8" />
              <circle cx={cx} cy={cy} r="1.2" fill="#fff" />
            </g>
          ))}
        </g>
      )}

      {/* Layer 4: Flexible PCB (with copper/gold traces & realistic SMD components) */}
      {layer.id === "layer-4" && (
        <g>
          {/* Main Gold Tracks */}
          <path d="M 50 30 L 50 250 M 35 90 Q 50 110 65 90 M 32 150 Q 50 170 68 150 M 35 210 L 65 210" stroke="url(#gold-grad)" strokeWidth="0.75" opacity="0.7" fill="none" />
          <path d={INSOLE_PATH} fill="url(#pcb-pads)" opacity="0.25" />
          
          {/* Main MCU (Microprocessor) with pins */}
          <g transform="translate(40, 120)">
            <rect x="0" y="0" width="20" height="20" fill="#111827" rx="1.5" stroke="#374151" strokeWidth="0.5" />
            {/* Pins on left and right */}
            {[-1.5, 3.5, 8.5, 13.5, 18.5].map((yPin, idx) => (
              <g key={idx}>
                <rect x="-2" y={yPin} width="2.5" height="1" fill="#cbd5e1" />
                <rect x="20" y={yPin} width="2.5" height="1" fill="#cbd5e1" />
              </g>
            ))}
            {/* Center Core dot */}
            <circle cx="16" cy="4" r="1" fill="#d97706" />
          </g>
          
          {/* Memory Chip */}
          <rect x="44" y="80" width="12" height="18" fill="#1f2937" rx="1" stroke="#4b5563" strokeWidth="0.5" />
          {/* Resistors & Capacitors (SMD styling) */}
          {[
            [34, 52, "#9ca3af"], [62, 48, "#9ca3af"],
            [35, 100, "#d97706"], [60, 102, "#9ca3af"],
            [36, 195, "#cbd5e1"], [55, 220, "#9ca3af"]
          ].map(([xPos, yPos, colorStr], idx) => (
            <g key={idx}>
              <rect x={Number(xPos)} y={Number(yPos)} width="6" height="3" fill={String(colorStr)} rx="0.5" />
              {/* Metallic ends of capacitor */}
              <rect x={Number(xPos)} y={Number(yPos)} width="1.5" height="3" fill="#e5e7eb" />
              <rect x={Number(xPos) + 4.5} y={Number(yPos)} width="1.5" height="3" fill="#e5e7eb" />
            </g>
          ))}
          
          {/* Bluetooth module / BLE Antenna meander line */}
          <g transform="translate(22, 205)">
            <path d="M 0 0 L 12 0 L 12 4 L 2 4 L 2 8 L 12 8 L 12 12 L 0 12" fill="none" stroke="url(#gold-grad)" strokeWidth="0.8" />
          </g>
        </g>
      )}

      {/* Layer 5: Energy Coils (concentric golden ellipses) */}
      {layer.id === "layer-5" && (
        <g>
          <path d={INSOLE_PATH} fill="url(#coils)" />
          {/* Concentric forefoot coil lines */}
          <ellipse cx="50" cy="70" rx="18" ry="24" fill="none" stroke="url(#gold-grad)" strokeWidth="0.8" opacity="0.8" />
          <ellipse cx="50" cy="70" rx="14" ry="19" fill="none" stroke="url(#gold-grad)" strokeWidth="0.8" opacity="0.8" />
          <ellipse cx="50" cy="70" rx="10" ry="14" fill="none" stroke="url(#gold-grad)" strokeWidth="0.8" opacity="0.8" />

          {/* Concentric heel coil lines */}
          <ellipse cx="50" cy="200" rx="15" ry="20" fill="none" stroke="url(#gold-grad)" strokeWidth="0.8" opacity="0.8" />
          <ellipse cx="50" cy="200" rx="11" ry="15" fill="none" stroke="url(#gold-grad)" strokeWidth="0.8" opacity="0.8" />
        </g>
      )}

      {/* Layer 6: Battery Silver Foil with 3D Depth */}
      {layer.id === "layer-6" && (
        <g>
          {/* Battery Wall (Thickness / Shading) */}
          <rect x="32" y="77" width="36" height="110" fill="#4b5563" rx="2" />
          {/* Silver foil body */}
          <rect x="32" y="75" width="36" height="110" fill="url(#silver-foil)" rx="2" stroke="#9ca3af" strokeWidth="0.6" />
          {/* Yellow Kapton Tape wrap */}
          <rect x="32" y="75" width="36" height="9" fill="#eab308" fillOpacity="0.95" rx="1" />
          {/* Red/Black wire terminal leads */}
          <rect x="42" y="72" width="2" height="3" fill="#ef4444" />
          <rect x="56" y="72" width="2" height="3" fill="#111827" />
          {/* White manufacturer label card */}
          <rect x="36" y="94" width="28" height="76" fill="#ffffff" fillOpacity="0.85" rx="1.5" />
          {/* Technical Specs Text */}
          <text x="50" y="128" fontSize="4.5" fill="#374151" textAnchor="middle" fontWeight="bold" transform="rotate(90 50 128)">Li-Po 3.7V 500mAh 1.85Wh</text>
          <text x="44" y="128" fontSize="3.5" fill="#4b5563" textAnchor="middle" transform="rotate(90 44 128)">DITHAR SYSTEM A-1</text>
        </g>
      )}

      {/* Layer 7: Insulation Ribs */}
      {layer.id === "layer-7" && (
        <g opacity="0.25">
          {Array.from({ length: 18 }).map((_, i) => (
            <path key={i} d={`M 22 ${25 + i * 13} Q 50 ${35 + i * 13} 78 ${25 + i * 13}`} stroke="#000" strokeWidth="2.5" fill="none" />
          ))}
        </g>
      )}
    </svg>
  );
};

export default function SmartInsoleExplodedView() {
  const [isExploded, setIsExploded] = useState(false);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  // Auto-explode after a short delay for demonstration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExploded(true);
      setActiveLayerId("layer-1"); // Default focus on the top fabric
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const selectLayer = (id: string) => {
    setActiveLayerId(id);
    setIsExploded(true);
  };


  return (
    <section className="relative w-full pt-36 pb-24 bg-transparent overflow-hidden font-sans">
      <SvgDefs />

      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Header Title (Using Theme Font Color Variables) */}
        <div className="text-center mb-16">
          <span className="text-xs font-semibold tracking-wider text-primary-blue dark:text-medical-blue uppercase mb-3 block font-sans unified-english">
            INTERACTIVE EXPLODED DEMO
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-dark-text font-arabic mb-4 unified-typography">
            العرض المفكك التقني
          </h2>
          <h3 className="text-lg md:text-xl font-light text-primary-blue dark:text-medical-blue mt-2 font-sans tracking-wide">
            Exploded Smart PAD View
          </h3>
          <div className="w-24 h-1 bg-primary-blue dark:bg-medical-blue mx-auto rounded-full mt-4"></div>
        </div>

        {/* Layout forced to LTR to keep Labels on Left and PCB Panel on Right */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-4 relative" dir="ltr">
          
          {/* Left: Arabic Labels (Interactive list using Unified Theme colors) */}
          <div className="hidden lg:grid grid-rows-8 h-175 w-1/4 z-20 relative" dir="rtl">
            {INSOLE_LAYERS.map((layer, idx) => (
              <motion.div 
                key={layer.id}
                initial={{ opacity: 0, x: -25 }}
                animate={{ opacity: isExploded ? 1 : 0, x: isExploded ? 0 : -25 }}
                transition={{ duration: 0.45, delay: idx * 0.06, ease: "easeOut" }}
                onClick={() => selectLayer(layer.id)}
                className={cn(
                  "relative flex h-full items-center justify-start pr-8 cursor-pointer group transition-all duration-300 select-none",
                  activeLayerId === layer.id ? "scale-105" : "hover:translate-x-2"
                )}
              >
                <div className="text-right pr-4">
                  <h4 className={cn(
                    "font-bold text-sm font-arabic transition-colors duration-300 whitespace-nowrap",
                    activeLayerId === layer.id ? "text-primary-blue dark:text-medical-blue font-extrabold" : "text-dark-text group-hover:text-primary-blue dark:group-hover:text-medical-blue"
                  )}>
                    {layer.nameAr}
                  </h4>
                  <p className="text-xs text-muted-text font-arabic mt-0.5 whitespace-nowrap">{layer.shortDescAr}</p>
                </div>
                {/* Connecting Dot */}
                <div className={cn(
                  "absolute right-0 w-2.5 h-2.5 rounded-full transition-all duration-300",
                  activeLayerId === layer.id 
                    ? "bg-primary-blue dark:bg-medical-blue ring-4 ring-primary-blue/30 dark:ring-medical-blue/30 scale-125" 
                    : "bg-slate-300 dark:bg-slate-700 group-hover:bg-primary-blue dark:group-hover:bg-medical-blue group-hover:ring-4 group-hover:ring-primary-blue/20 dark:group-hover:ring-medical-blue/20"
                )} />
                {/* Connecting Line (goes right towards the center model) */}
                <div className={cn(
                  "absolute right-0 top-1/2 w-[120px] xl:w-37.5 border-t border-dashed pointer-events-none transition-all duration-300",
                  activeLayerId === layer.id
                    ? "border-primary-blue/50 dark:border-medical-blue/50"
                    : "border-slate-350 dark:border-slate-700/50 group-hover:border-primary-blue/40 dark:group-hover:border-medical-blue/40"
                )} style={{ transform: "translateX(100%)" }} />
              </motion.div>
            ))}
          </div>

          {/* Center: 3D Exploded View Canvas */}
          <div className="w-full lg:w-2/4 flex justify-center items-center h-[600px] lg:h-175 [perspective:2000px] relative z-10">
            <motion.div
              className="relative w-[180px] sm:w-[240px] h-[550px] sm:h-[650px] lg:h-175 cursor-pointer"
              onClick={() => setIsExploded(!isExploded)}
              animate={isExploded ? { y: 0 } : { y: [-10, 10, -10] }}
              transition={isExploded ? { duration: 0.5 } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                className="relative w-full h-full"
                style={{ transformStyle: "preserve-3d" }}
                animate={{ rotateX: 60, rotateZ: 45 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {[...INSOLE_LAYERS].reverse().map((layer, index) => {
                  const layerIndexFromTop = INSOLE_LAYERS.length - 1 - index;
                  const zPosition = isExploded 
                    ? (3.5 - layerIndexFromTop) * 58 
                    : (3.5 - layerIndexFromTop) * 1;

                  return (
                    <motion.div
                      key={layer.id}
                      className="absolute inset-0"
                      style={{ transformStyle: "preserve-3d" }}
                      initial={{ z: 0 }}
                      animate={{ 
                        z: zPosition,
                        scale: activeLayerId === layer.id ? 1.05 : 1,
                        filter: activeLayerId === layer.id ? "brightness(1.08) drop-shadow(0 0 12px rgba(30,136,200,0.45))" : "brightness(1)"
                      }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectLayer(layer.id);
                      }}
                    >
                      <LayerShape layer={layer} isExploded={isExploded} />
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          </div>

          {/* Right: PCB Components Panel (Aligned left relative to itself with Unified Theme colors) */}
          <motion.div 
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: isExploded ? 1 : 0, x: isExploded ? 0 : 25 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="w-full lg:w-1/4 z-20"
            dir="ltr"
          >
            <div className="bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              {/* Subtle top background highlight */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary-blue to-medical-blue" />
              
              <div className="flex justify-between items-center mb-6">
                <Bluetooth className="w-6 h-6 text-primary-blue dark:text-medical-blue" />
                <h3 className="text-base font-bold text-dark-text font-arabic text-right w-full pr-2">مكونات النظام الإلكتروني</h3>
              </div>

              {/* Decorative PCB Edge on the left (facing the center model) */}
              <div className="relative border-l-2 border-primary-blue/30 dark:border-medical-blue/30 pl-10 mt-8 space-y-6">
                {/* Decorative PCB line elements on left edge */}
                <div className="absolute -left-2 -top-4 -bottom-4 w-6 bg-emerald-900 rounded-r-full overflow-hidden opacity-90 shadow-inner">
                  <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(#fbbf24 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
                  <div className="absolute top-8 left-1 w-3.5 h-3.5 bg-zinc-800 rounded-sm" />
                  <div className="absolute top-24 left-1 w-4 h-6 bg-zinc-900 rounded-sm" />
                  <div className="absolute bottom-16 left-1 w-3.5 h-3.5 bg-yellow-600 rounded-sm" />
                </div>

                {PCB_COMPONENTS.map((comp, idx) => (
                  <div key={idx} className="relative flex flex-col items-start text-left select-none group">
                    {/* Connecting line to the PCB stripe on the left edge */}
                    <div className="absolute -left-6 top-1/2 w-5 border-t border-slate-350 dark:border-slate-650 -translate-y-1/2" />
                    <div className="absolute -left-7 top-1/2 w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 -translate-y-1/2 group-hover:bg-primary-blue dark:group-hover:bg-medical-blue transition-colors" />
                    
                    <span className="text-sm font-semibold text-dark-text font-sans">{comp.name}</span>
                    {comp.nameAr && (
                      <span className="text-xs text-muted-text font-arabic mt-0.5">{comp.nameAr}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile-only Arabic Labels list (shown below PCB panel on small screens) */}
            <div className="lg:hidden flex flex-col space-y-4 mt-8" dir="rtl">
              {INSOLE_LAYERS.map((layer) => (
                <div 
                  key={layer.id} 
                  onClick={() => selectLayer(layer.id)}
                  className={cn(
                    "p-4 rounded-xl shadow-sm border text-right cursor-pointer transition-all duration-300",
                    activeLayerId === layer.id 
                      ? "bg-primary-blue/5 dark:bg-medical-blue/10 border-primary-blue dark:border-medical-blue" 
                      : "bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border-slate-200 dark:border-zinc-800"
                  )}
                >
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <h4 className={cn(
                      "font-bold text-sm font-arabic",
                      activeLayerId === layer.id ? "text-primary-blue dark:text-medical-blue" : "text-dark-text"
                    )}>
                      {layer.nameAr}
                    </h4>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      activeLayerId === layer.id ? "bg-primary-blue dark:bg-medical-blue" : "bg-slate-300 dark:bg-slate-700"
                    )} />
                  </div>
                  <p className="text-xs text-muted-text font-arabic">{layer.shortDescAr}</p>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* Detailed Technical Description Card (Unified theme colors) */}
        <div className="max-w-4xl mx-auto mt-16 px-4">
          <AnimatePresence mode="wait">
            {activeLayerId ? (
              <motion.div
                key={activeLayerId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-xl text-right flex flex-col items-end"
              >
                <div className="flex flex-row-reverse items-center gap-2 mb-3">
                  <h4 className="text-lg font-bold text-dark-text font-arabic">
                    {INSOLE_LAYERS.find(l => l.id === activeLayerId)?.nameAr}
                  </h4>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-blue dark:bg-medical-blue" />
                  <span className="text-xs font-semibold text-primary-blue dark:text-medical-blue bg-primary-blue/10 dark:bg-medical-blue/10 px-3 py-1 rounded-full font-sans uppercase tracking-wider">
                    {INSOLE_LAYERS.find(l => l.id === activeLayerId)?.nameEn}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-muted-text leading-relaxed font-light font-arabic">
                  {INSOLE_LAYERS.find(l => l.id === activeLayerId)?.fullDescAr}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="default-prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white/40 dark:bg-zinc-900/20 border border-dashed border-slate-200 dark:border-zinc-800/60 rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[120px]"
              >
                <HelpCircle className="w-8 h-8 text-slate-400 dark:text-zinc-650 mb-3 animate-pulse" />
                <p className="text-sm text-muted-text font-arabic font-light">
                  انقر على أي طبقة من طبقات اللباد الطبي الذكي أو استكشف المكونات لرؤية المواصفات الفنية التفصيلية هنا.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Master Toggle Buttons */}
        <div className="flex justify-center mt-12 gap-4 z-30 relative select-none">
          <button 
            onClick={() => {
              setIsExploded(true);
              if (!activeLayerId) setActiveLayerId("layer-1");
            }}
            className={cn(
              "px-6 py-2.5 rounded-full border text-sm font-medium transition-all duration-300 font-arabic flex items-center gap-2 cursor-pointer",
              isExploded 
                ? "border-primary-blue dark:border-medical-blue bg-primary-blue/5 dark:bg-medical-blue/10 text-primary-blue dark:text-medical-blue" 
                : "border-slate-200 dark:border-zinc-800 hover:border-slate-350 hover:bg-slate-50 dark:hover:bg-zinc-900 text-dark-text"
            )}
          >
            <Layers className="w-4 h-4" />
            تفكيك طبقات اللباد الذكي
          </button>
          <button 
            onClick={() => {
              setIsExploded(false);
              setActiveLayerId(null);
            }}
            className={cn(
              "px-6 py-2.5 rounded-full border text-sm font-medium transition-all duration-300 font-arabic flex items-center gap-2 cursor-pointer",
              !isExploded 
                ? "border-primary-blue dark:border-medical-blue bg-primary-blue/5 dark:bg-medical-blue/10 text-primary-blue dark:text-medical-blue" 
                : "border-slate-200 dark:border-zinc-800 hover:border-slate-350 hover:bg-slate-50 dark:hover:bg-zinc-900 text-dark-text"
            )}
          >
            <ShieldCheck className="w-4 h-4" />
            تجميع اللباد معاً
          </button>
        </div>
      </div>
    </section>
  );
}
