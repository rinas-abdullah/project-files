import React, { useState } from "react";
import { Building2, TrendingDown, ShieldCheck, Award, MoreHorizontal, Filter } from "lucide-react";
import { portalMockData } from "@/lib/portal-mock-data";
import { GlassCard, GlassBadge, GlassButton } from "@/components/ui/glass";

export function HospitalPortal() {
  const [fleetFilter, setFleetFilter] = useState<"all" | "active" | "storage">("all");
  const data = portalMockData.hospitalPortal;
  
  const filteredFleet = data.fleet.filter(f => {
    if (fleetFilter === "active") return f.isActive;
    if (fleetFilter === "storage") return f.isStorage;
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-[#0B4D8D] mb-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold tracking-widest uppercase">Enterprise Healthcare Fleet</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">إدارة المنشأة</h1>
          <p className="text-sm text-slate-500 mt-1">مستشفى الملك فيصل التخصصي ومركز الأبحاث</p>
        </div>
        
        <div className="flex items-center gap-3">
          <GlassButton variant="secondary" className="gap-2 text-xs py-2 shadow-sm">
            <Filter className="w-3.5 h-3.5" />
            تصدير التقرير
          </GlassButton>
        </div>
      </div>

      {/* STATISTICAL PERFORMANCE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-5 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <TrendingDown className="w-4 h-4" />
            </div>
            <GlassBadge status="success">معدل تحسن</GlassBadge>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mb-1">حالات السقوط للمنومين</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-slate-900 font-mono">-{data.stats.fallReduction}%</h3>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2.5 rounded-lg bg-blue-50 text-[#0B4D8D] border border-blue-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <GlassBadge status="success">معدل تحسن</GlassBadge>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mb-1">مضاعفات القدم السكرية</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-slate-900 font-mono">-{data.stats.ulcerReduction}%</h3>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-100">
              <Award className="w-4 h-4" />
            </div>
            <GlassBadge status="info">تقديري</GlassBadge>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold mb-1">الوفر المالي التشغيلي</p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-3xl font-bold text-slate-900 font-mono">{data.stats.savingsEstimate}M</h3>
            <span className="text-[11px] font-semibold text-slate-500">ريال</span>
          </div>
        </GlassCard>
      </div>

      {/* FLEET INVENTORY MANAGEMENT TABLE */}
      <GlassCard className="overflow-hidden p-0 flex flex-col">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50">
          <div>
            <h3 className="font-bold text-base text-slate-900 font-arabic">أسطول أجهزة اللباد الطبي الذكي (Smart PADs)</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 font-semibold font-arabic">إدارة ومتابعة اللبادات المخصصة للمرضى والمستودع السريري</p>
          </div>

          <div className="flex bg-slate-200/50 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setFleetFilter("all")}
              className={`px-3.5 py-1.5 rounded-md text-[11px] font-bold transition-colors ${fleetFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"}`}
            >
              الكل
            </button>
            <button
              onClick={() => setFleetFilter("active")}
              className={`px-3.5 py-1.5 rounded-md text-[11px] font-bold transition-colors ${fleetFilter === "active" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"}`}
            >
              نشط
            </button>
            <button
              onClick={() => setFleetFilter("storage")}
              className={`px-3.5 py-1.5 rounded-md text-[11px] font-bold transition-colors ${fleetFilter === "storage" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"}`}
            >
              مستودع
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="py-3 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">معرف الجهاز</th>
                <th className="py-3 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">الحالة</th>
                <th className="py-3 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">المريض</th>
                <th className="py-3 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">الطبيب</th>
                <th className="py-3 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">الاتصال</th>
                <th className="py-3 px-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFleet.map(fleet => (
                <tr key={fleet.deviceId} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-5">
                    <span className="font-mono text-sm font-bold text-slate-900">{fleet.deviceId}</span>
                  </td>
                  <td className="py-4 px-5">
                    <GlassBadge status={fleet.statusType as "success" | "warning" | "critical" | "info" | "neutral"}>{fleet.status}</GlassBadge>
                  </td>
                  <td className="py-4 px-5 text-sm">
                    <span className={`font-semibold ${fleet.isActive ? 'text-slate-900' : 'text-slate-400'}`}>{fleet.patient}</span>
                  </td>
                  <td className="py-4 px-5 text-xs text-slate-500 font-medium">
                    {fleet.doctor}
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${fleet.isActive ? 'bg-[#059669]' : 'bg-slate-300'}`} />
                      <span className={`text-[11px] font-mono font-bold ${fleet.isActive ? 'text-[#059669]' : 'text-slate-400'}`}>{fleet.battery}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-left">
                    <button className="p-1.5 text-slate-400 hover:text-[#0B4D8D] transition-colors rounded-md hover:bg-slate-100">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
