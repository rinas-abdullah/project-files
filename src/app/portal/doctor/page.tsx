"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Patient, PatientStatus } from "@/lib/types/portal";
import { PageLoader, EmptyState } from "@/components/ui/loading-states";
import { GlassCard, GlassBadge } from "@/components/ui/glass";
import { Search, Filter, AlertTriangle, User, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

function AddPatientModal({ onClose, onCreated }: { onClose: () => void; onCreated: (mrn: string) => void }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [careType, setCareType] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, age, diagnosis, careType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر إنشاء السجل");
      onCreated(data.patient.mrn);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-slate-900 mb-1">إضافة سجل مريض جديد</h2>
        <p className="text-xs text-slate-500 mb-6">ينشئ رقم ملف طبي (MRN) فريد يستخدمه المريض لتفعيل حسابه لاحقاً</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">اسم المريض</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4D8D]/20 focus:border-[#0B4D8D]"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">العمر</label>
              <input
                type="number"
                min={1}
                max={130}
                value={age}
                onChange={e => setAge(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4D8D]/20 focus:border-[#0B4D8D]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">نوع الرعاية</label>
              <input
                type="text"
                value={careType}
                onChange={e => setCareType(e.target.value)}
                placeholder="الرعاية المنزلية HHC"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4D8D]/20 focus:border-[#0B4D8D]"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">التشخيص</label>
            <input
              type="text"
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4D8D]/20 focus:border-[#0B4D8D]"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 bg-[#0B4D8D] text-white rounded-xl font-bold text-sm shadow-md hover:bg-blue-800 transition-colors disabled:opacity-70 cursor-pointer"
          >
            {isSaving ? "جاري الإنشاء..." : "إنشاء السجل"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function DoctorPortalPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMrn, setNewMrn] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { t, language } = useLanguage();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchQuery) params.set("search", searchQuery);
        if (filterStatus && filterStatus !== "all") params.set("status", filterStatus);

        const res = await fetch(`/api/patients?${params.toString()}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || t.error);
        setPatients(json.patients || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.error);
      } finally {
        setLoading(false);
      }
    }

    // Simple debounce
    const timeout = setTimeout(loadData, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, filterStatus, t.error, refreshKey]);

  const getStatusBadgeType = (status: PatientStatus): "critical" | "warning" | "success" | "info" | "neutral" => {
    switch (status) {
      case "critical": return "critical";
      case "alert": return "warning";
      case "stable": return "success";
      case "needs_followup": return "info";
      default: return "neutral";
    }
  };

  return (
    <div className="space-y-6 flex flex-col w-full h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">{t.clinical_followup}</h1>
          <p className="text-sm text-slate-500">{t.doctor_desc}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:flex-1 md:w-64">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 ${language === 'ar' ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              placeholder={t.search_mrn}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4D8D]/20 focus:border-[#0B4D8D] transition-all ${language === 'ar' ? 'pr-9 pl-4' : 'pl-9 pr-4'}`}
            />
          </div>
          
          <div className="relative shrink-0 w-full sm:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`w-full appearance-none py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4D8D]/20 focus:border-[#0B4D8D] transition-all text-slate-700 font-medium cursor-pointer ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
            >
              <option value="all">{t.all_cases}</option>
              <option value="alert">{t.alerts}</option>
              <option value="critical">{t.critical}</option>
              <option value="needs_followup">{t.needs_followup}</option>
              <option value="stable">{t.stable}</option>
            </select>
            <Filter className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none ${language === 'ar' ? 'right-3' : 'left-3'}`} />
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#0B4D8D] text-white text-sm font-bold hover:bg-blue-800 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>مريض جديد</span>
          </button>
        </div>
      </div>

      {newMrn && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between gap-3">
          <span>
            تم إنشاء السجل بنجاح — رقم الملف الطبي: <span className="font-mono font-bold" dir="ltr">{newMrn}</span> — شارك هذا الرقم مع المريض لتفعيل حسابه من صفحة الدخول.
          </span>
          <button type="button" onClick={() => setNewMrn(null)} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showAddModal && (
        <AddPatientModal
          onClose={() => setShowAddModal(false)}
          onCreated={(mrn) => {
            setShowAddModal(false);
            setNewMrn(mrn);
            setRefreshKey(k => k + 1);
          }}
        />
      )}

      <GlassCard className="flex-1 min-h-[400px] flex flex-col p-0 overflow-hidden w-full max-w-full">
        {loading ? (
          <PageLoader />
        ) : error ? (
          <EmptyState title={t.error} description={error} icon={AlertTriangle} />
        ) : patients.length === 0 ? (
          <EmptyState title="No Results" description="No patients found matching the criteria." icon={User} />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-start min-w-[800px]">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className={`px-6 py-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t.patient_name}</th>
                  <th className={`px-6 py-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t.diagnosis_care}</th>
                  <th className={`px-6 py-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t.compliance}</th>
                  <th className={`px-6 py-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t.status}</th>
                  <th className={`px-6 py-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>{t.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{patient.name}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{patient.mrn}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-900 font-medium">{patient.diagnosis}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{patient.careType}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full max-w-[80px] bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${patient.complianceScore >= 90 ? 'bg-emerald-500' : 'bg-orange-500'}`}
                            style={{ width: `${patient.complianceScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700 font-mono">{patient.complianceScore}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <GlassBadge status={getStatusBadgeType(patient.status)} className="whitespace-nowrap px-2.5 py-1 text-xs">
                        {patient.statusLabel}
                      </GlassBadge>
                    </td>
                    <td className="px-6 py-4">
                      <Link 
                        href={`/portal/patient/${patient.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-[#0B4D8D] hover:border-[#0B4D8D] hover:bg-blue-50 transition-all opacity-100 md:opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title={t.action}
                      >
                        {language === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
