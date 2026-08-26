"use client";

import React, { useEffect, useState } from "react";
import { MockAPI } from "@/lib/api/mock-api";
type HospitalStats = Awaited<ReturnType<typeof MockAPI.getHospitalStats>>;
import { Device } from "@/lib/types/portal";
import { PageLoader, EmptyState } from "@/components/ui/loading-states";
import { GlassCard, GlassBadge } from "@/components/ui/glass";
import { Search, Filter, AlertTriangle, Cpu, Activity, ShieldCheck, TrendingDown, Battery, Wifi, WifiOff, Wrench } from "lucide-react";

export default function HospitalPortalPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [stats, setStats] = useState<HospitalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLocation, setFilterLocation] = useState<string>("all");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [devicesData, statsData] = await Promise.all([
          MockAPI.getDevices(searchQuery, filterLocation),
          MockAPI.getHospitalStats()
        ]);
        setDevices(devicesData);
        setStats(statsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "حدث خطأ أثناء تحميل البيانات");
      } finally {
        setLoading(false);
      }
    }
    
    const timeout = setTimeout(loadData, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, filterLocation]);

  const getDeviceStatusInfo = (status: string) => {
    switch (status) {
      case "connected": return { type: "success", icon: Wifi, text: "متصل" };
      case "disconnected": return { type: "neutral", icon: WifiOff, text: "غير متصل" };
      case "low_battery": return { type: "warning", icon: Battery, text: "منخفض البطارية" };
      case "needs_maintenance": return { type: "error", icon: Wrench, text: "صيانة مطلوبة" };
      default: return { type: "neutral", icon: Cpu, text: "غير معروف" };
    }
  };

  if (loading && !stats) return <PageLoader />;
  if (error) return <EmptyState title="خطأ في التحميل" description={error} icon={AlertTriangle} />;

  return (
    <div className="space-y-6 flex flex-col w-full h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">إدارة المنشأة</h1>
        <p className="text-sm text-slate-500">نظرة عامة على أسطول الأجهزة الذكية والأداء السريري.</p>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            <GlassBadge status="success" className="text-[10px]">معدل تحسن</GlassBadge>
          </div>
          <p className="text-xs text-slate-500 font-bold mb-1">حالات التقرح التي تم منعها</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900 font-mono">{stats?.ulcerReduction}%</span>
            <span className="text-sm text-emerald-600 font-bold">-</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            </div>
            <GlassBadge status="info" className="text-[10px]">معدل تحسن</GlassBadge>
          </div>
          <p className="text-xs text-slate-500 font-bold mb-1">مضاعفات القدم السكرية</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900 font-mono">{stats?.fallReduction}%</span>
            <span className="text-sm text-blue-600 font-bold">-</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <TrendingDown className="w-5 h-5 text-amber-600" />
            </div>
            <GlassBadge status="warning" className="text-[10px]">تقديري</GlassBadge>
          </div>
          <p className="text-xs text-slate-500 font-bold mb-1">الوفر المالي التشغيلي</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-slate-900 font-mono">{stats?.savingsEstimate}</span>
            <span className="text-sm text-slate-500 font-bold">مليون ريال</span>
          </div>
        </GlassCard>
      </div>

      {/* DEVICES TABLE */}
      <GlassCard className="flex-1 min-h-[400px] flex flex-col p-0 overflow-hidden">
        
        {/* Table Header Controls */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white">
          <div>
            <h3 className="font-bold text-slate-900">أسطول الأجهزة الذكية</h3>
            <p className="text-xs text-slate-500 mt-1">إدارة ومتابعة البادات المخصصة للمرضى والمستودع</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="بحث برقم الجهاز أو المريض..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-9 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4D8D]/20 focus:border-[#0B4D8D] transition-all"
              />
            </div>
            
            <div className="relative shrink-0">
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4D8D]/20 focus:border-[#0B4D8D] transition-all text-slate-700 font-medium cursor-pointer"
              >
                <option value="all">الكل</option>
                <option value="active">نشط</option>
                <option value="storage">مستودع</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-12"><PageLoader /></div>
        ) : devices.length === 0 ? (
          <EmptyState title="لا توجد نتائج" description="لم يتم العثور على أجهزة تطابق شروط البحث." icon={Cpu} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">رقم الجهاز</th>
                  <th className="px-6 py-4">الحالة / الموقع</th>
                  <th className="px-6 py-4">المريض</th>
                  <th className="px-6 py-4">الطبيب المعالج</th>
                  <th className="px-6 py-4">الاتصال / البطارية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {devices.map((device) => {
                  const statusInfo = getDeviceStatusInfo(device.status);
                  const StatusIcon = statusInfo.icon;
                  return (
                    <tr key={device.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-700">
                        {device.deviceId}
                      </td>
                      <td className="px-6 py-4">
                        <GlassBadge status={device.isStorage ? 'neutral' : 'success'} className="whitespace-nowrap px-2.5 py-1 text-[10px]">
                          {device.location}
                        </GlassBadge>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {device.patientName}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {device.assignedDoctor || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`w-4 h-4 ${statusInfo.type === 'success' ? 'text-emerald-500' : statusInfo.type === 'error' ? 'text-red-500' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold text-slate-600">{statusInfo.text}</span>
                          <span className="text-xs text-slate-400 font-mono">({device.batteryLevel}%)</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
