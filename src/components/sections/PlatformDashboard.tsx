"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import Image from "next/image";
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import Link from "next/link";
import {
  Activity, Bell, ChevronRight, Users,
  AlertTriangle, ShieldCheck, HeartPulse,
  Settings, TrendingUp, TrendingDown, Zap, X, Check,
  Download, Send, Calendar, BarChart2, Wifi, Battery,
  Clock, FileText, RefreshCw, ArrowLeft,
} from "lucide-react";

/* ═══════════════════════════════
   TYPES & CONSTANTS
═══════════════════════════════ */

type Risk = "high" | "medium" | "stable";
type AlertLevel = "danger" | "warning" | "info";

const RISK_CONFIG = {
  high:   { label: "خطر",    color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", bar: "#ef4444", dot: "#ef4444" },
  medium: { label: "متوسط",  color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", bar: "#f59e0b", dot: "#f59e0b" },
  stable: { label: "مستقر", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", bar: "#10b981", dot: "#10b981" },
};

const ALERT_COLORS = {
  danger:  { bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.2)",   text: "#b91c1c", icon: "🔴" },
  warning: { bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.2)",  text: "#b45309", icon: "🟡" },
  info:    { bg: "rgba(11,77,141,0.08)",  border: "rgba(11,77,141,0.2)",  text: "#0B4D8D", icon: "🔵" },
};

/* ═══════════════════════════════
   PATIENT DATA
═══════════════════════════════ */

function generateCadence(base: number, variance: number, len = 24) {
  return Array.from({ length: len }, (_, i) => ({
    t: `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`,
    left:  Math.max(10, Math.round(base + (Math.random() - 0.5) * variance)),
    right: Math.max(10, Math.round(base * 1.05 + (Math.random() - 0.5) * variance * 0.8)),
  }));
}

function generateTemp(base: number, trend: number, len = 48) {
  return Array.from({ length: len }, (_, i) => ({
    t: `${String(Math.floor(i * 0.5)).padStart(2, "0")}h`,
    temp: parseFloat((base + trend * (i / len) + (Math.random() - 0.5) * 0.15).toFixed(1)),
    normal: 36.8,
  }));
}

const PATIENTS = [
  {
    id: "P-2401", name: "عبدالرحمن السعود", age: 58, gender: "ذكر",
    condition: "Diabetic Foot — Type 2", ward: "جناح ج-4", physician: "د. العمري",
    risk: "high" as Risk, admitted: "2026-05-28",
    vitals: { steps: 1420, balance: 78, tempC: 37.2, heartRate: 82, bmi: 29.4, hba1c: 8.7, humidity: 81 },
    recovery: 52, compliance: 68, alerts: 4,
    cadence: generateCadence(48, 22),
    temperature: generateTemp(37.0, 0.25),
    pressure: { bigToe: 0.93, toe2: 0.82, toe3: 0.66, toe4: 0.46, toe5: 0.32, ball: 0.87, arch: 0.18, heel: 0.91 },
    pressureR: { bigToe: 0.54, toe2: 0.47, toe3: 0.38, toe4: 0.29, toe5: 0.22, ball: 0.51, arch: 0.31, heel: 0.49 },
    aiAlerts: [
      { level: "danger"  as AlertLevel, text: "ضغط حرج على الإبهام والكعب — خطر تقرح مرحلة 2" },
      { level: "danger"  as AlertLevel, text: "ارتفاع حراري +1.2°C في الكعب اليسار — احتمال التهاب" },
      { level: "warning" as AlertLevel, text: "رطوبة داخلية 81% — خطر عدوى فطرية" },
      { level: "info"    as AlertLevel, text: "موعد مراجعة طارئة خلال 6 ساعات" },
    ],
  },
  {
    id: "P-2389", name: "نورة الزهراني", age: 44, gender: "أنثى",
    condition: "Diabetic Neuropathy", ward: "جناح أ-2", physician: "د. الغامدي",
    risk: "stable" as Risk, admitted: "2026-06-01",
    vitals: { steps: 3210, balance: 91, tempC: 35.9, heartRate: 74, bmi: 26.1, hba1c: 7.1, humidity: 49 },
    recovery: 83, compliance: 94, alerts: 1,
    cadence: generateCadence(72, 8),
    temperature: generateTemp(35.9, 0.03),
    pressure: { bigToe: 0.54, toe2: 0.49, toe3: 0.43, toe4: 0.37, toe5: 0.32, ball: 0.57, arch: 0.33, heel: 0.59 },
    pressureR: { bigToe: 0.51, toe2: 0.46, toe3: 0.41, toe4: 0.35, toe5: 0.30, ball: 0.54, arch: 0.31, heel: 0.56 },
    aiAlerts: [
      { level: "info" as AlertLevel, text: "معدل الخطوات طبيعي — الأداء الحركي جيد" },
    ],
  },
  {
    id: "P-2412", name: "هيفاء المطيري", age: 61, gender: "أنثى",
    condition: "Post-Stroke Rehab — Left Hemiplegia", ward: "جناح ب-1", physician: "د. الحارثي",
    risk: "medium" as Risk, admitted: "2026-05-31",
    vitals: { steps: 1890, balance: 67, tempC: 36.5, heartRate: 81, bmi: 27.3, hba1c: 6.8, humidity: 55 },
    recovery: 58, compliance: 74, alerts: 2,
    cadence: generateCadence(52, 18),
    temperature: generateTemp(36.4, 0.08),
    pressure: { bigToe: 0.74, toe2: 0.41, toe3: 0.31, toe4: 0.25, toe5: 0.19, ball: 0.68, arch: 0.22, heel: 0.71 },
    pressureR: { bigToe: 0.38, toe2: 0.33, toe3: 0.28, toe4: 0.23, toe5: 0.18, ball: 0.36, arch: 0.27, heel: 0.40 },
    aiAlerts: [
      { level: "warning" as AlertLevel, text: "عدم تماثل حركي 42% بين الطرفين — الطرف المصاب أضعف" },
      { level: "info"    as AlertLevel, text: "تحسن 8% في كفاءة مشية الطرف الأيسر خلال 7 أيام" },
    ],
  },
  {
    id: "P-2398", name: "سعد الشمري", age: 76, gender: "ذكر",
    condition: "Elderly Fall Prevention", ward: "جناح د-3", physician: "د. القرشي",
    risk: "medium" as Risk, admitted: "2026-06-03",
    vitals: { steps: 2240, balance: 72, tempC: 36.2, heartRate: 74, bmi: 26.5, hba1c: 6.2, humidity: 52 },
    recovery: 76, compliance: 85, alerts: 1,
    cadence: generateCadence(58, 16),
    temperature: generateTemp(36.1, 0.02),
    pressure: { bigToe: 0.58, toe2: 0.51, toe3: 0.44, toe4: 0.38, toe5: 0.28, ball: 0.55, arch: 0.42, heel: 0.61 },
    pressureR: { bigToe: 0.55, toe2: 0.48, toe3: 0.42, toe4: 0.36, toe5: 0.26, ball: 0.52, arch: 0.40, heel: 0.58 },
    aiAlerts: [
      { level: "warning" as AlertLevel, text: "تراجع ثبات مركز الجاذبية 15% — خطر سقوط مرتفع" },
    ],
  },
];

/* ═══════════════════════════════
   PRESSURE COLOR SCALE
═══════════════════════════════ */

function pressureToColor(v: number, alpha = 1): string {
  if (v >= 0.90) return `rgba(220,38,38,${alpha})`;
  if (v >= 0.75) return `rgba(234,88,12,${alpha})`;
  if (v >= 0.60) return `rgba(234,179,8,${alpha})`;
  if (v >= 0.45) return `rgba(34,197,94,${alpha})`;
  if (v >= 0.30) return `rgba(11,77,141,${alpha})`;
  return `rgba(99,102,241,${alpha * 0.7})`;
}

/* ═══════════════════════════════
   FOOT HEATMAP COMPONENT
═══════════════════════════════ */

type Zones = typeof PATIENTS[0]["pressure"];

const ZONE_COORDS: Record<keyof Zones, { cx: string; cy: string; rw: string; rh: string }> = {
  bigToe: { cx: "42%", cy: "8%",  rw: "18%", rh: "10%" },
  toe2:   { cx: "31%", cy: "6%",  rw: "13%", rh: "8%"  },
  toe3:   { cx: "21%", cy: "8%",  rw: "11%", rh: "7%"  },
  toe4:   { cx: "12%", cy: "12%", rw: "9%",  rh: "6%"  },
  toe5:   { cx: "5%",  cy: "17%", rw: "8%",  rh: "6%"  },
  ball:   { cx: "35%", cy: "28%", rw: "24%", rh: "14%" },
  arch:   { cx: "17%", cy: "53%", rw: "17%", rh: "20%" },
  heel:   { cx: "27%", cy: "82%", rw: "24%", rh: "14%" },
};

function FootOverlay({ zones, flip = false }: { zones: Zones; flip?: boolean }) {
  return (
    <div className="absolute inset-0" style={{ transform: flip ? "scaleX(-1)" : undefined }}>
      {(Object.entries(ZONE_COORDS) as [keyof Zones, { cx: string; cy: string; rw: string; rh: string }][]).map(([key, pos]) => {
        const val = zones[key];
        return (
          <div
            key={key}
            className="absolute rounded-full"
            style={{
              left: pos.cx, top: pos.cy,
              width: pos.rw, height: pos.rh,
              transform: "translate(-50%, -50%)",
              background: `radial-gradient(ellipse, ${pressureToColor(val, 0.85)} 0%, ${pressureToColor(val, 0.4)} 45%, transparent 80%)`,
              filter: "blur(4px)",
              mixBlendMode: "multiply", // Better for light backgrounds
              transition: "background 0.8s ease",
            }}
          />
        );
      })}
    </div>
  );
}

function DualFootHeatmap({ patient }: { patient: typeof PATIENTS[0] }) {
  const maxL = Math.max(...Object.values(patient.pressure));
  const maxR = Math.max(...Object.values(patient.pressureR));

  return (
    <div className="flex gap-2 w-full h-full p-2 bg-slate-50/50">
      {/* Left */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
            يسار
          </span>
          <span className="text-[9px] font-mono font-bold" style={{ color: pressureToColor(maxL) }}>
            {Math.round(maxL * 100)}%
          </span>
        </div>
        <div className="relative flex-1 overflow-hidden">
          <Image
            src="/images/foot-heatmap.png"
            alt="left foot"
            fill
            className="object-contain"
            style={{
              filter: "brightness(0.9) grayscale(0.5) opacity(0.8)",
              transform: "scaleX(2)",
              transformOrigin: "left center",
            }}
          />
          <FootOverlay zones={patient.pressure} />
        </div>
      </div>

      {/* divider */}
      <div className="w-px bg-slate-200 self-stretch" />

      {/* Right */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
            يمين
          </span>
          <span className="text-[9px] font-mono font-bold" style={{ color: pressureToColor(maxR) }}>
            {Math.round(maxR * 100)}%
          </span>
        </div>
        <div className="relative flex-1 overflow-hidden">
          <Image
            src="/images/foot-heatmap.png"
            alt="right foot"
            fill
            className="object-contain"
            style={{
              filter: "brightness(0.9) grayscale(0.5) opacity(0.8)",
              transform: "scaleX(2)",
              transformOrigin: "right center",
            }}
          />
          <FootOverlay zones={patient.pressureR} flip />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════
   CUSTOM CHART TOOLTIP
═══════════════════════════════ */

function ChartTooltip({ active, payload, label, unit }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  active?: boolean; payload?: any[];
  label?: string; unit?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur-md">
      <p className="text-[10px] text-slate-500 mb-1">{label}</p>
      {payload.map((p: { color: string; name: string; value: number }, i: number) => (
        <div key={i} className="flex items-center gap-2 text-[11px]">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-600 font-arabic">{p.name}:</span>
          <span className="font-mono font-bold text-slate-900">{p.value}{unit}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════
   TOAST
═══════════════════════════════ */

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      className="fixed bottom-6 right-6 z-100 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-2xl"
    >
      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
      <span className="text-sm text-slate-800 font-arabic">{msg}</span>
      <button onClick={onClose}><X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700" /></button>
    </motion.div>
  );
}

/* ═══════════════════════════════
   STAT CARD
═══════════════════════════════ */

function StatCard({ label, value, sub, color, pulse = false }: {
  label: string; value: string | number; sub: string;
  color: string; icon?: React.ElementType; pulse?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400 }}
      className="rounded-2xl border border-slate-100 bg-white px-3 py-3 shadow-sm cursor-default"
    >
      <p className="text-[9px] uppercase text-slate-500 font-arabic mb-2">{label}</p>
      <p className="text-2xl font-bold font-mono" style={{ color }}>
        {value}
        {pulse && <span className="inline-block w-1.5 h-4 ml-0.5 mb-0.5 rounded-sm bg-current animate-pulse" />}
      </p>
      <p className="text-[9px] text-slate-500 mt-0.5 font-arabic">{sub}</p>
    </motion.div>
  );
}

/* ═══════════════════════════════
   MAIN COMPONENT
═══════════════════════════════ */

export default function PlatformDashboard() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [time, setTime] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [liveTemp, setLiveTemp] = useState<number>(0);
  const [showFallAlert, setShowFallAlert] = useState(false);
  const liveRef = useRef(0);

  const patient = PATIENTS[selectedIdx];
  const risk = RISK_CONFIG[patient.risk];

  /* real-time clock */
  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, []);

  /* live temperature drift (reset baseline when patient changes) */
  useEffect(() => {
    liveRef.current = patient.vitals.tempC;
  }, [patient.vitals.tempC]);

  useEffect(() => {
    const i = setInterval(() => {
      liveRef.current = parseFloat((liveRef.current + (Math.random() - 0.5) * 0.05).toFixed(2));
      setLiveTemp(parseFloat(liveRef.current.toFixed(1)));
    }, 1500);
    return () => clearInterval(i);
  }, []);

  const notify = useCallback((msg: string) => setToast(msg), []);

  const totAlerts = PATIENTS.reduce((s, p) => s + p.alerts, 0);
  const highCount = PATIENTS.filter((p) => p.risk === "high").length;
  const stableCount = PATIENTS.filter((p) => p.risk === "stable").length;

  const navItems = [
    { id: "dashboard", icon: Activity,      label: "لوحة التحكم" },
    { id: "patients",  icon: Users,         label: "المرضى" },
    { id: "live",      icon: HeartPulse,    label: "مراقبة حية" },
    { id: "analytics", icon: BarChart2,     label: "التحليلات" },
    { id: "alerts",    icon: AlertTriangle, label: "التنبيهات", badge: totAlerts },
    { id: "reports",   icon: FileText,      label: "التقارير" },
  ];

  return (
    <section id="dashboard" className="relative w-full bg-transparent overflow-hidden">
      <ContainerScroll
        titleComponent={
          <div className="mb-6 text-center select-none px-4">
            <span className="text-xs font-semibold tracking-[0.35em] uppercase font-sans unified-english text-primary-blue">
              CLINICAL MONITORING PLATFORM
            </span>
            <h2 className="mt-3 text-[36px] sm:text-[48px] lg:text-[54px] font-bold font-arabic leading-[1.2] text-[#0F172A] tracking-tight unified-typography">
              رعاية مستمرة في متناول يديك
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-slate-500 leading-relaxed font-arabic font-light unified-typography">
              منصة دِثار السريرية — مراقبة مستمرة عبر 9 مناطق ضغط، درجة الحرارة، الرطوبة الداخلية، وتحليل المشية بالذكاء الاصطناعي في وقت فعلي.
            </p>
            <div className="mt-6">
              <Link
                href="/portal"
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-primary-blue hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-900/20 hover:scale-105 transition-all group"
              >
                <span>🌐 اضغط هنا لفتح منصة دِثار التفاعلية (Portal) | دخول نفاذ 🇸🇦 • الطبيب • المستشفيات</span>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        }
      >
        {/* ── Dashboard inner (Clickable iPad Screen to /portal) ── */}
        <Link
          href="/portal"
          className="block w-full h-full overflow-auto relative group cursor-pointer rounded-[1.8rem] bg-white text-[#0F172A] shadow-2xl shadow-slate-200/50 border border-slate-100"
        >
          {/* Floating Hover Badge on iPad Screen */}
          <div className="absolute top-3 right-1/2 translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity bg-primary-blue text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 pointer-events-none">
            <span>انقر لفتح المنصة الكاملة (Portal) ➔</span>
          </div>

          {/* ── Main body ── */}
          <div className="bg-white relative" style={{ minHeight: 660 }}>
            <div className="p-6">
              <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
                <div className="space-y-6">
                  <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500">مرحبا بك في منصة المريض</p>
                        <h3 className="mt-1 text-2xl font-bold text-slate-900">{patient.name}</h3>
                        <p className="mt-2 text-sm text-slate-500 leading-relaxed">نظرة عامة على حالة قدمك الذكية الآن.</p>
                      </div>
                      <div className="inline-flex items-center gap-3 rounded-full bg-white px-4 py-2 border border-slate-200 shadow-sm">
                        <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold">92</div>
                        <div className="text-right">
                          <p className="text-[11px] text-slate-500 uppercase tracking-[0.12em]">الصحة العامة</p>
                          <p className="text-sm font-bold text-slate-900">مستقر</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h4 className="text-base font-bold text-slate-900">Live Plantar Heatmap</h4>
                          <p className="text-[10px] text-slate-500 mt-1">توزيع الضغط والحرارة المباشر</p>
                        </div>
                        <span className="rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] border border-emerald-100">Live</span>
                      </div>
                      <div className="flex flex-col lg:flex-row gap-5">
                        <div className="lg:w-36 rounded-[1.75rem] bg-slate-50 p-4 flex items-center justify-center">
                          <Image src="/images/foot-heatmap.png" alt="Plantar Heatmap" width={120} height={160} className="object-contain" />
                        </div>
                        <div className="flex-1 space-y-4">
                          {[
                            { label: "مقدمة القدم", value: "28", status: "Low Risk", style: "bg-emerald-50 text-emerald-700 border-emerald-100" },
                            { label: "مشط القدم", value: "14", status: "Normal", style: "bg-slate-50 text-slate-700 border-slate-100" },
                            { label: "كعب القدم", value: "46", status: "Elevated", style: "bg-orange-50 text-orange-700 border-orange-100" },
                          ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 p-4">
                              <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-900">{item.label}</p>
                                <p className="text-[9px] text-slate-500 uppercase tracking-[0.12em] mt-1">{item.status}</p>
                              </div>
                              <div className="text-left">
                                <p className="text-xl font-bold text-slate-900">{item.value}</p>
                                <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold ${item.style}`}>{item.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h4 className="text-base font-bold text-slate-900">Dithar Smart PAD Node</h4>
                          <p className="text-[10px] text-slate-500 mt-1">ID: {patient.id}</p>
                        </div>
                        <span className="rounded-full bg-red-50 text-red-700 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] border border-red-100">غير متصل</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4 text-right">
                          {[
                            { label: "Signal", value: "Excellent" },
                            { label: "Battery", value: "88%" },
                            { label: "Firmware", value: "v2.4.1" },
                            { label: "Last Sync", value: "قبل 2 دقائق" },
                          ].map((item) => (
                            <div key={item.label}>
                              <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] mb-1">{item.label}</p>
                              <p className="text-sm font-semibold text-slate-900">{item.value}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col items-center justify-center gap-4">
                          <Image src="/images/smart-insole-closed.png" alt="Dithar Smart PAD" width={130} height={130} className="object-contain" />
                          <button className="w-full rounded-3xl bg-[#0B4D8D] text-white py-3 text-sm font-bold hover:bg-blue-800 transition-colors">
                            خارطة الصحة الشاملة
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      { label: "الخطوات", value: "4,281", sub: "خطوة" },
                      { label: "الرطوبة", value: "42%", sub: "RH" },
                      { label: "درجة الحرارة", value: "37.1°C", sub: "Temp" },
                      { label: "الضغط", value: "118 kPa", sub: "Pressure" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[10px] text-slate-500 uppercase tracking-[0.18em] font-bold">{stat.label}</p>
                          <span className="text-[11px] font-bold text-slate-700">{stat.sub}</span>
                        </div>
                        <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[11px] font-bold text-slate-900">خارطة الصحة الشاملة</p>
                        <p className="text-[9px] text-slate-400 mt-1">مؤشر الحركة وضغط القدم</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Realtime</span>
                    </div>
                    <div className="rounded-[2rem] overflow-hidden bg-slate-50 p-4">
                      <div className="relative h-[360px] w-full">
                        <svg viewBox="0 0 100 250" className="h-full w-full text-slate-300" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                          <path d="M50 10c-6 0-11 5-11 11s5 11 11 11 11-5 11-11-5-11-11-11zm-15 30c-5 0-9 4-9 9v40c0 3 2 5 5 5s5-2 5-5V55h4v65c0 5-4 9-9 9v75c0 4 3 8 8 8 3 0 6-2 7-5l4-35 4 35c1 3 4 5 7 5 5 0 8-4 8-8v-75c-5 0-9-4-9-9V55h4v35c0 3 2 5 5 5s5-2 5-5V49c0-5-4-9-9-9H35z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </ContainerScroll>

      {/* caption */}
      <p className="text-center text-xs text-slate-500 -mt-10 pb-8 font-arabic font-medium">
        اختر أي مريض من القائمة الجانبية • اضغط لفتح المنصة الكاملة • البيانات تتحدث عبر BLE 5.2
      </p>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* Level 1 Fall Alert Simulation Modal */}
      <AnimatePresence>
        {showFallAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-red-100 overflow-hidden"
            >
              <div className="bg-red-500 p-6 flex flex-col items-center justify-center text-white relative">
                <button onClick={() => setShowFallAlert(false)} className="absolute top-4 left-4 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4 animate-pulse">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold font-arabic mb-1">تنبيه مستوى أول (لحظي)</h3>
                <p className="text-sm font-arabic font-medium opacity-90 text-center">انحراف مفاجئ في مركز الثقل (CoG &gt; 15°)</p>
              </div>
              <div className="p-6 bg-white flex flex-col gap-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4 text-primary-blue" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 font-arabic">استجابة الحشوة (Haptic)</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed font-arabic">تم تفعيل اهتزاز تصحيحي في الحذاء الأيسر لتنبيه المريض وإعادة ضبط التوازن.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 font-arabic">توجيه صوتي (Voice Prompt)</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed font-arabic">تم إطلاق تنبيه صوتي للمريض عبر التطبيق: &quot;الرجاء التوقف بأمان وتصحيح الوضعية&quot;.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFallAlert(false)}
                  className="mt-2 w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm font-arabic transition-colors shadow-md"
                >
                  إغلاق التنبيه والمتابعة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
