import React from "react";
import Image from "next/image";
import { 
  Wifi, Activity, 
  Clock, Battery, Bluetooth, Cpu, 
  Droplets, Thermometer, Footprints, 
  ActivitySquare, CheckCircle2, AlertTriangle, AlertCircle
} from "lucide-react";
import { portalMockData } from "@/lib/portal-mock-data";
import { GlassCard, GlassBadge } from "@/components/ui/glass";
import { LineChart, Line, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { useArduinoFirebase } from "@/hooks/useArduinoFirebase";
import { useArduino } from "@/hooks/useArduino";
import { Patient } from "@/lib/types/portal";
import { useLanguage } from "@/lib/LanguageContext";

// Static data for sparklines to prevent re-renders and freezing
const SPARKLINE_DATA_STEPS = [{value: 30}, {value: 40}, {value: 35}, {value: 50}, {value: 49}, {value: 60}, {value: 70}, {value: 91}, {value: 125}];
const SPARKLINE_DATA_PRESSURE = [{value: 110}, {value: 112}, {value: 115}, {value: 118}, {value: 118}, {value: 119}, {value: 117}, {value: 118}];
const SPARKLINE_DATA_TEMP = [{value: 36.5}, {value: 36.6}, {value: 36.8}, {value: 37.0}, {value: 37.1}, {value: 37.1}, {value: 37.0}, {value: 37.1}];
const SPARKLINE_DATA_HUMIDITY = [{value: 45}, {value: 44}, {value: 43}, {value: 42}, {value: 42}, {value: 42}, {value: 41}, {value: 42}];

interface LiveTelemetry {
  liveVitals: {
    temperature: number;
    pressure: number;
    steps: number;
    humidity: number;
    complianceScore: number;
    symmetryScore: number;
  };
}

const TREND_DATA = [
  { day: 'Sun', forefoot: 1700, midfoot: 300, heel: 600 },
  { day: 'Mon', forefoot: 1600, midfoot: 450, heel: 700 },
  { day: 'Wed', forefoot: 1500, midfoot: 250, heel: 400 },
  { day: 'Thu', forefoot: 1400, midfoot: 700, heel: 600 },
  { day: 'Fri', forefoot: 1350, midfoot: 150, heel: 650 },
  { day: 'Sat', forefoot: 1300, midfoot: 900, heel: 500 },
  { day: 'Sun', forefoot: 1200, midfoot: 250, heel: 550 },
];

export function PatientPortal({ patientData }: { patientData?: Patient }) {
  const { isConnected: isFirebaseConnected, data: firebaseData } = useArduinoFirebase();
  const { isConnected: isSerialConnected, data: serialData, connect: connectSerial, disconnect: disconnectSerial } = useArduino();
  const [liveApiData, setLiveApiData] = React.useState<LiveTelemetry | null>(null);
  const [isLiveStreaming, setIsLiveStreaming] = React.useState(true);

  const data = portalMockData.patientPortal;
  const { t, language } = useLanguage();

  const RADAR_DATA = [
    { subject: language === 'ar' ? 'مخاطر القدم' : 'Foot Risk', A: 80, fullMark: 100 },
    { subject: language === 'ar' ? 'مخاطر الضغط' : 'Pressure Risk', A: 60, fullMark: 100 },
    { subject: language === 'ar' ? 'استقرار المفصل' : 'Joint Stability', A: 90, fullMark: 100 },
    { subject: language === 'ar' ? 'تقييم الكاحل' : 'Ankle Score', A: 85, fullMark: 100 },
    { subject: language === 'ar' ? 'توزيع الحمل' : 'Load Dist', A: 65, fullMark: 100 },
    { subject: language === 'ar' ? 'تنبؤ التوزيع' : 'Load Pred', A: 75, fullMark: 100 },
  ];

  // Poll live telemetry API periodically
  React.useEffect(() => {
    if (!isLiveStreaming) return;
    const fetchTelemetry = async () => {
      try {
        const res = await fetch("/api/telemetry/live?patientId=pat-1");
        if (res.ok) {
          const json = await res.json();
          if (json.telemetry) {
            setLiveApiData(json.telemetry);
          }
        }
      } catch (err) {
        // ignore
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  const isConnected = isSerialConnected || isFirebaseConnected || !!liveApiData;
  const currentTemp = isSerialConnected && serialData 
    ? serialData.temp.toFixed(1) 
    : isFirebaseConnected && firebaseData 
    ? firebaseData.temp.toFixed(1)
    : liveApiData 
    ? liveApiData.liveVitals.temperature.toFixed(1)
    : patientData?.metrics?.maxTemp || "37.1";

  const currentPressure = isSerialConnected && serialData
    ? serialData.pressure.toString()
    : isFirebaseConnected && firebaseData
    ? firebaseData.pressure.toString()
    : liveApiData
    ? liveApiData.liveVitals.pressure.toString()
    : patientData?.metrics?.avgPressure || "118";

  const currentSteps = isSerialConnected && serialData
    ? serialData.steps.toLocaleString()
    : isFirebaseConnected && firebaseData
    ? firebaseData.steps.toLocaleString()
    : liveApiData
    ? liveApiData.liveVitals.steps.toLocaleString()
    : patientData?.metrics?.steps.toLocaleString() || "4,281";

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      
      {/* HUMAN BODY MAP (Right Sidebar in RTL) */}
      <div className="order-first lg:order-last w-full lg:w-48 shrink-0 flex flex-col items-center">
        <h3 className="text-xs font-bold text-slate-900 mb-8 mt-2">{t.portal}</h3>
        
        <div className="relative w-full flex-1 min-h-[300px] lg:min-h-[400px] flex flex-col items-center justify-start mt-8">
          <div className="relative z-10 w-28 h-64 text-slate-500 opacity-80">
            <svg viewBox="0 0 100 250" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
              <path d="M50 10c-6 0-11 5-11 11s5 11 11 11 11-5 11-11-5-11-11-11zm-15 30c-5 0-9 4-9 9v40c0 3 2 5 5 5s5-2 5-5V55h4v65c0 5-4 9-9 9v75c0 4 3 8 8 8 3 0 6-2 7-5l4-35 4 35c1 3 4 5 7 5 5 0 8-4 8-8v-75c-5 0-9-4-9-9V55h4v35c0 3 2 5 5 5s5-2 5-5V49c0-5-4-9-9-9H35z" />
            </svg>
          </div>
          <div className="absolute top-[240px] w-32 h-6 border-2 border-[#0B4D8D]/30 rounded-[100%] animate-ping opacity-70" />
          <div className="absolute top-[245px] w-24 h-4 bg-[#0B4D8D]/20 blur-md rounded-[100%]" />
          <div className="absolute top-[242px] w-28 h-5 border border-[#0B4D8D]/50 rounded-[100%]" />
        </div>
      </div>

      {/* MAIN CARDS */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 w-full max-w-full overflow-hidden">
        
        {/* COLUMN 1: RIGHT IN RTL */}
        <div className="space-y-6 flex flex-col w-full">
          
          {/* WELCOME */}
          <GlassCard className="p-6 flex flex-col justify-between min-h-[200px]">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xs font-semibold text-slate-500 mb-1">{t.good_morning}</h2>
                <h1 className="text-xl font-bold text-slate-900">{patientData?.name || "أحمد حمد"}</h1>
                <p className="text-xs text-slate-500 mt-1">{t.patient_overview}</p>
              </div>
            </div>
            
            <div className="mt-8 flex items-end justify-between">
              <div className="relative w-14 h-14 shrink-0 order-last">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                  <path className="text-[#059669]" strokeDasharray="92, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </div>
              <div className="order-first">
                <p className="text-xs font-semibold text-slate-700 mb-1">{t.overall_health}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-bold text-[#059669] font-mono">{patientData?.metrics?.healthScore || 92}</span>
                  <span className="text-xs text-slate-500 font-mono">/100</span>
                </div>
                <div className="flex items-center gap-2">
                  <GlassBadge status="success" className="text-[9px] px-1.5 py-0">{patientData?.metrics?.healthScoreLabel || t.stable}</GlassBadge>
                  <span className="text-[9px] text-slate-400">{t.last_update}</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* SMART PAD */}
          <GlassCard className="p-4 md:p-6 flex flex-col min-h-[280px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-slate-400" />
                <h3 className="font-bold text-slate-900 text-sm">{t.smart_pad}</h3>
              </div>
              {isConnected ? (
                <GlassBadge status="success" className="gap-1.5 px-2 bg-white shadow-sm border border-slate-200 text-slate-700 font-bold text-[10px]">
                  {t.connected}
                </GlassBadge>
              ) : (
                <GlassBadge status="neutral" className="gap-1.5 px-2 bg-red-50 text-red-600 border border-red-100 font-bold text-[10px]">
                  {t.disconnected}
                </GlassBadge>
              )}
            </div>

            <p className="text-[9px] font-mono font-bold text-slate-400 text-left w-full mb-4" dir="ltr">ID: DITHAR-PAD-9842</p>

            <div className="flex-1 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="grid grid-cols-2 md:grid-cols-1 gap-4 md:gap-y-3 w-full md:w-1/2" dir="ltr">
                <div className="text-left">
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Signal</p>
                  <p className="text-xs font-semibold font-mono text-slate-900 flex items-center justify-start md:justify-end gap-1.5"><Bluetooth className="w-3 h-3 text-slate-400" /> Excellent</p>
                </div>
                <div className="text-left">
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Battery</p>
                  <p className="text-xs font-semibold font-mono text-slate-900 flex items-center justify-start md:justify-end gap-1.5"><Battery className="w-3 h-3 text-slate-400" /> 88%</p>
                </div>
                <div className="text-left">
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Last Sync</p>
                  <p className="text-xs font-semibold font-mono text-slate-900 flex items-center justify-start md:justify-end gap-1.5"><Clock className="w-3 h-3 text-slate-400" /> {isConnected ? "Live Data" : "2 min ago"}</p>
                </div>
                <div className="text-left">
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Firmware</p>
                  <p className="text-xs font-semibold font-mono text-slate-900 flex items-center justify-start md:justify-end gap-1.5"><Cpu className="w-3 h-3 text-slate-400" /> v2.4.1</p>
                </div>
              </div>

              <div className="w-full md:w-1/2 flex flex-col items-center justify-center gap-3 mt-4 md:mt-0">
                <Image 
                  src="/images/smart-insole-closed.png" 
                  alt="Dithar Smart PAD" 
                  width={110} 
                  height={110} 
                  className="object-contain -rotate-[15deg] drop-shadow-xl"
                  unoptimized
                  onError={(e) => { (e.target as HTMLImageElement).src = '/images/insole-clinical-premium.png'; }}
                />
                
                {/* Hardware Web Serial Button */}
                {isSerialConnected ? (
                  <button
                    onClick={disconnectSerial}
                    className="w-full py-1.5 px-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold hover:bg-red-100 transition-colors font-arabic cursor-pointer"
                  >
                    قطع اتصال USB
                  </button>
                ) : (
                  <button
                    onClick={connectSerial}
                    className="w-full py-1.5 px-3 rounded-lg bg-blue-50 text-[#0B4D8D] border border-blue-200 text-[10px] font-bold hover:bg-blue-100 transition-colors font-arabic cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Cpu className="w-3 h-3 text-[#0B4D8D]" />
                    <span>ربط جهاز USB (Arduino)</span>
                  </button>
                )}
              </div>
            </div>
          </GlassCard>

          {/* TIME EVOLUTION */}
          <GlassCard className="p-4 md:p-6 flex flex-col w-full overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm">{t.time_evolution}</h3>
              <button className="text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md hover:bg-slate-100">
                {t.view_evolution}
              </button>
            </div>
            
            <p className="text-xs font-bold text-slate-700 mb-4 text-center">{t.pressure_trends}</p>
            
            <div className="h-48 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={TREND_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b' }} />
                  <Line type="monotone" dataKey="forefoot" name="Forefoot" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: 'white', strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="midfoot" name="Midfoot" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: 'white', strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="heel" name="Heel" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: 'white', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* PREDICTIVE INDICATORS */}
          <GlassCard className="p-4 md:p-6 flex flex-col w-full overflow-hidden">
            <div className="mb-4">
              <h3 className="font-bold text-slate-900 text-sm">{t.predictive_indicators}</h3>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              {/* Radar Chart */}
              <div className="w-full sm:w-1/2 flex flex-col items-center">
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="60%" data={RADAR_DATA}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 8, fontWeight: 'bold' }} />
                      <Radar name="Patient" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Alerts */}
              <div className="w-full sm:w-1/2 space-y-2 flex flex-col justify-center">
                <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-emerald-900">{language === 'ar' ? "مخاطر تقرح باطن القدم" : "Foot Ulcer Risk"}</p>
                    <p className="text-[9px] text-emerald-700 font-medium">{language === 'ar' ? "منخفض جداً" : "Very Low"}</p>
                  </div>
                </div>
                <div className="bg-orange-50 border border-orange-100 p-2.5 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-orange-900">{language === 'ar' ? "تنبيه حركة المفاصل" : "Joint Mobility Alert"}</p>
                    <p className="text-[9px] text-orange-800 font-medium">{language === 'ar' ? "استخدام القدم اليسرى أقل من المعتاد" : "Left foot usage is lower than usual"}</p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
          
        </div>

        {/* COLUMN 2: LEFT IN RTL */}
        <div className="space-y-6 flex flex-col w-full">
          
          {/* CLINICAL INSIGHTS */}
          <GlassCard className="p-6 flex flex-col min-h-[200px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ActivitySquare className="w-4 h-4 text-slate-400" />
                <h3 className="font-bold text-slate-900 text-sm">{t.clinical_insights}</h3>
              </div>
            </div>
            <div className="space-y-3 flex-1 flex flex-col justify-center">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <p className="text-xs text-slate-800 leading-relaxed font-medium">توزيع ضغط ممتاز، لا توجد أي مؤشرات حرارية مقلقة في باطن القدم.</p>
              </div>
              <div className="bg-[#ECFDF5] border border-[#059669]/20 rounded-xl p-3">
                <span className="text-[10px] font-semibold text-[#059669] block mb-1">{t.clinical_recommendations}</span>
                <p className="text-xs text-[#065F46] leading-relaxed font-medium">الاستمرار على خطة المشي اليومية المعتمدة من الطبيب المعالج.</p>
              </div>
            </div>
          </GlassCard>

          {/* PLANTAR HEATMAP */}
          <GlassCard className="p-6 flex flex-col min-h-[280px]">
            <div className="mb-6">
              <h3 className="font-bold text-slate-900 text-sm mb-1">{t.live_heatmap}</h3>
            </div>
            <div className="flex-1 flex flex-col sm:flex-row items-center sm:items-stretch gap-4">
              <div className="flex-1 flex flex-col justify-center space-y-3 w-full">
                {([
                  { label: "مقدمة القدم", en: "Forefoot", value: data.livePlantar.metatarsals.value, status: "Low Risk", color: "text-[#059669]", badge: "success" },
                  { label: "مشط القدم", en: "Midfoot", value: data.livePlantar.midfoot.value, status: "Normal", color: "text-slate-900", badge: "neutral" },
                  { label: "كعب القدم", en: "Heel", value: data.livePlantar.heel.value, status: "Elevated", color: "text-orange-500", badge: "warning" }
                ] as const).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between w-full">
                    <div>
                      <GlassBadge status={item.badge} className="mb-0.5 bg-white border border-slate-100 shadow-sm px-1.5 text-[8px]">{item.status}</GlassBadge>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[8px] text-slate-400 font-sans">kPa</span>
                        <span className={`text-xs font-bold font-mono ${item.color}`}>{item.value}</span>
                      </div>
                    </div>
                    <div className="text-end">
                      <span className="text-[10px] font-bold text-slate-900 block">{language === 'ar' ? item.label : item.en}</span>
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{language === 'ar' ? item.en : item.label}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="w-28 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center p-3 shrink-0">
                <Image src="/images/foot-heatmap.png" alt="Plantar Heatmap" width={80} height={140} className="object-contain" />
              </div>
            </div>
          </GlassCard>

          {/* 2 VITALS (Temp, Humidity) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassCard className="p-4 flex flex-col justify-between min-h-[120px]">
              <div className="flex justify-between items-start mb-2">
                <div className="text-start flex-1">
                  <p className="text-[9px] font-bold text-slate-500 mb-0.5">{t.highest_temp}</p>
                  <div className="flex items-baseline gap-1 justify-start">
                    <span className="text-lg font-bold text-slate-900 font-mono">{currentTemp}</span>
                    <span className="text-[8px] font-medium text-slate-400">°C</span>
                  </div>
                </div>
              </div>
              <div className="mt-auto h-8 opacity-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={SPARKLINE_DATA_TEMP}>
                    <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="p-4 flex flex-col justify-between min-h-[120px]">
              <div className="flex justify-between items-start mb-2">
                <div className="text-start flex-1">
                  <p className="text-[9px] font-bold text-slate-500 mb-0.5">{t.humidity_level}</p>
                  <div className="flex items-baseline gap-1 justify-start">
                    <span className="text-lg font-bold text-slate-900 font-mono">{patientData?.metrics?.humidity || 42}</span>
                    <span className="text-[8px] font-medium text-slate-400">%</span>
                  </div>
                </div>
              </div>
              <div className="mt-auto h-8 opacity-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={SPARKLINE_DATA_HUMIDITY}>
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

        </div>
      </div>
    </div>
  );
}
