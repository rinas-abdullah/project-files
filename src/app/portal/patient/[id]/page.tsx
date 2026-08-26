"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Patient } from "@/lib/types/portal";
import { PageLoader, EmptyState } from "@/components/ui/loading-states";
import { GlassCard, GlassBadge } from "@/components/ui/glass";
import { useToast } from "@/components/ui/use-toast";
import { ChevronRight, User, AlertTriangle, FileText, ActivitySquare, ShieldCheck, Thermometer, Footprints, Send } from "lucide-react";

export default function PatientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const patientId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [note, setNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!patientId) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/patients/${patientId}`);
        if (!res.ok) throw new Error("تعذر جلب بيانات المريض من الخادم");
        const json = await res.json();
        if (!json.patient) throw new Error("لم يتم العثور على بيانات المريض");
        setPatient(json.patient);
      } catch (err) {
        setError(err instanceof Error ? err.message : "حدث خطأ أثناء جلب البيانات");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [patientId]);

  const handleAddNote = async () => {
    if (!note.trim() || !patientId) return;
    
    try {
      setAddingNote(true);
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "add_note",
          content: note,
          author: "د. خالد السليمان"
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.patient) setPatient(json.patient);
        setNote("");
        toast({
          title: "تم الحفظ بنجاح",
          description: "تمت إضافة الملاحظة السريرية إلى ملف المريض.",
          type: "success"
        });
      }
    } catch (err) {
      toast({
        title: "خطأ",
        description: "تعذر حفظ الملاحظة السريرية.",
        type: "error"
      });
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) return <PageLoader />;
  if (error || !patient) return <EmptyState title="خطأ في التحميل" description={error || "مريض غير موجود"} icon={AlertTriangle} />;

  return (
    <div className="space-y-6 flex flex-col w-full h-full pb-10">
      
      {/* Header & Back Button */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">ملف المريض السريري</h1>
          <p className="text-sm text-slate-500 font-mono">{patient.mrn}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* COLUMN 1: PATIENT INFO */}
        <div className="xl:col-span-1 space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-sm">
                <User className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-900">{patient.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-slate-500">{patient.age} سنة</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-xs font-bold text-slate-500">{patient.careType}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 mb-1">التشخيص</p>
                <p className="text-sm font-bold text-slate-900">{patient.diagnosis}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 mb-1">الطبيب المعالج</p>
                <p className="text-sm font-bold text-slate-900">{patient.consultant}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 mb-1">نسبة الالتزام بخطة المشي</p>
                <div className="flex items-center justify-between">
                  <div className="w-full max-w-[80%] bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${patient.complianceScore >= 90 ? 'bg-emerald-500' : 'bg-orange-500'}`}
                      style={{ width: `${patient.complianceScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-900 font-mono">{patient.complianceScore}%</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* AI / Clinical Recommendation */}
          {patient.recommendation && (
            <GlassCard className="p-6 bg-[#0B4D8D]/5 border-[#0B4D8D]/10">
              <div className="flex items-center gap-2 mb-3">
                <ActivitySquare className="w-5 h-5 text-[#0B4D8D]" />
                <h3 className="font-bold text-[#0B4D8D]">التوصية السريرية (الذكية)</h3>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {patient.recommendation}
              </p>
            </GlassCard>
          )}
        </div>

        {/* COLUMN 2 & 3: METRICS & NOTES */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Main Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="p-5 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <p className="text-xs font-bold text-slate-500">الصحة العامة للقدم</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900 font-mono">{patient.metrics.healthScore}</span>
                <span className="text-xs font-bold text-slate-400">/ 100</span>
              </div>
            </GlassCard>

            <GlassCard className="p-5 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="w-4 h-4 text-amber-500" />
                <p className="text-xs font-bold text-slate-500">أعلى درجة حرارة</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900 font-mono">{patient.metrics.maxTemp}</span>
                <span className="text-xs font-bold text-slate-400">°C</span>
              </div>
            </GlassCard>

            <GlassCard className="p-5 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <Footprints className="w-4 h-4 text-blue-500" />
                <p className="text-xs font-bold text-slate-500">الخطوات اليومية</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900 font-mono">{patient.metrics.steps.toLocaleString()}</span>
                <span className="text-xs font-bold text-slate-400">خطوة</span>
              </div>
            </GlassCard>
          </div>

          {/* ALERTS */}
          {patient.alerts && patient.alerts.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">التنبيهات السريرية النشطة</h3>
              {patient.alerts.map(alert => (
                <div key={alert.id} className={`p-4 rounded-xl border flex gap-4 ${alert.type === 'warning' ? 'bg-orange-50 border-orange-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <div className="shrink-0 mt-1">
                    {alert.type === 'warning' ? (
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    ) : (
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className={`font-bold text-sm ${alert.type === 'warning' ? 'text-orange-900' : 'text-emerald-900'}`}>{alert.title}</h4>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${alert.type === 'warning' ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-800'}`}>{alert.time}</span>
                    </div>
                    <p className={`text-xs leading-relaxed ${alert.type === 'warning' ? 'text-orange-800' : 'text-emerald-800'}`}>{alert.description}</p>
                    
                    {alert.recommendation && (
                      <div className={`mt-3 p-2 rounded-lg text-xs font-bold border ${alert.type === 'warning' ? 'bg-orange-100/50 border-orange-200 text-orange-900' : 'bg-emerald-100/50 border-emerald-200 text-emerald-900'}`}>
                        إجراء مقترح: {alert.recommendation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MEDICAL NOTES */}
          <GlassCard className="p-0 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                الملاحظات السريرية
              </h3>
            </div>
            
            <div className="p-6 bg-slate-50/50 flex-1 space-y-4 max-h-[300px] overflow-y-auto">
              {patient.medicalNotes.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm font-bold">لا توجد ملاحظات سريرية سابقة.</div>
              ) : (
                patient.medicalNotes.map(note => (
                  <div key={note.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#0B4D8D]">{note.author}</span>
                      <span className="text-[10px] font-mono text-slate-400">{note.date}</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">{note.content}</p>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="اكتب ملاحظة سريرية جديدة..."
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4D8D]/20 focus:border-[#0B4D8D] transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNote();
                  }}
                />
                <button 
                  onClick={handleAddNote}
                  disabled={addingNote || !note.trim()}
                  className="px-4 py-2 bg-[#0B4D8D] text-white rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                  {addingNote ? "جاري الحفظ..." : (
                    <>
                      <span>إضافة</span>
                      <Send className="w-3.5 h-3.5 rotate-180" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </GlassCard>

        </div>
      </div>
    </div>
  );
}
