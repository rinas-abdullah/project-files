"use client";

import React, { useState, useEffect } from "react";
import { Search, User, Activity, AlertCircle, CheckCircle2, ActivitySquare, Plus, Send, FileText } from "lucide-react";
import { Patient } from "@/lib/types/portal";
import { GlassCard, GlassBadge, GlassButton } from "@/components/ui/glass";

export function DoctorPortal() {
  const [searchMrn, setSearchMrn] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("pat-1");
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Fetch real patients from API
  useEffect(() => {
    async function loadPatients() {
      try {
        const res = await fetch("/api/patients");
        if (res.ok) {
          const data = await res.json();
          if (data.patients && data.patients.length > 0) {
            setPatients(data.patients);
            if (!selectedPatientId) {
              setSelectedPatientId(data.patients[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load patients", err);
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, [selectedPatientId]);

  // Filter patients based on search
  const filteredPatients = patients.filter(p => 
    p.mrn.toLowerCase().includes(searchMrn.toLowerCase()) || 
    p.name.includes(searchMrn) ||
    p.diagnosis.includes(searchMrn)
  );

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedPatient) return;
    setIsSavingNote(true);

    try {
      const res = await fetch(`/api/patients/${selectedPatient.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "add_note",
          content: newNote,
          author: "د. خالد السليمان"
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.patient) {
          setPatients(prev => prev.map(p => p.id === data.patient.id ? data.patient : p));
          setNewNote("");
        }
      }
    } catch (err) {
      console.error("Failed to save note", err);
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-arabic">المتابعة السريرية — منظومة اللباد الطبي الذكي</h1>
          <p className="text-sm text-slate-500 mt-1 font-arabic">الوصول السريع لبيانات حركة المريض، ومؤشرات خطر التقرحات، والتوصيات الطبية الاستباقية.</p>
        </div>
        
        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث برقم الملف (MRN) أو الاسم..."
            value={searchMrn}
            onChange={(e) => setSearchMrn(e.target.value)}
            className="w-full pr-10 pl-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4D8D] transition-shadow shadow-sm font-arabic"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: PATIENT LIST */}
        <GlassCard className="lg:col-span-4 flex flex-col h-[650px] p-0">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans">قائمة الحالات النشطة ({filteredPatients.length})</h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Live API</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm font-arabic">جاري تحميل سجلات المرضى...</div>
            ) : filteredPatients.map(patient => (
              <button
                key={patient.id}
                onClick={() => setSelectedPatientId(patient.id)}
                className={`w-full text-right p-3.5 rounded-xl transition-colors border cursor-pointer ${
                  selectedPatient?.id === patient.id
                    ? "bg-blue-50/70 border-blue-200 shadow-xs"
                    : "bg-transparent border-transparent hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-md ${selectedPatient?.id === patient.id ? 'bg-blue-100 text-[#0B4D8D]' : 'bg-slate-100 text-slate-500'}`}>
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-sm text-slate-900 font-arabic">{patient.name}</span>
                  </div>
                  <GlassBadge status={patient.status === "stable" ? "success" : patient.status === "critical" ? "critical" : "warning"}>
                    {patient.statusLabel}
                  </GlassBadge>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono pl-9" dir="ltr">
                  <span>{patient.mrn}</span>
                  <span className="font-arabic">{patient.complianceScore}% <span className="font-sans text-[10px]">امتثال</span></span>
                </div>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* RIGHT COLUMN: CLINICAL DASHBOARD */}
        {selectedPatient ? (
          <div className="lg:col-span-8 space-y-6">
            {/* Patient Header Card */}
            <GlassCard className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-slate-700 font-bold px-2 py-1 bg-slate-100 rounded-md border border-slate-200" dir="ltr">{selectedPatient.mrn}</span>
                  <span className="px-2 py-1 rounded-md bg-blue-50 text-[#0B4D8D] text-[10px] font-bold border border-blue-100 tracking-wider font-arabic">{selectedPatient.careType}</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1 font-arabic">{selectedPatient.name}</h2>
                <p className="text-sm text-slate-600 font-medium font-arabic">
                  <span className="text-slate-400">التشخيص الأساسي:</span> {selectedPatient.diagnosis}
                </p>
              </div>
              
              <div className="text-left" dir="ltr">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Device ID</span>
                <p className="text-xs font-bold font-mono text-slate-800">DITHAR-PAD-9842</p>
              </div>
            </GlassCard>

            {/* Vitals & Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <GlassCard className="p-4 flex flex-col justify-between">
                <span className="text-[11px] text-slate-500 font-semibold mb-2 font-arabic">معدل التزام اللباد الذكي</span>
                <div className="flex items-baseline gap-1.5" dir="ltr">
                  <span className="text-2xl font-bold text-emerald-700 font-mono">{selectedPatient.complianceScore}%</span>
                  {selectedPatient.complianceScore > 90 ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-orange-600" />}
                </div>
              </GlassCard>

              <GlassCard className="p-4 flex flex-col justify-between">
                <span className="text-[11px] text-slate-500 font-semibold mb-2 font-arabic">مؤشر الصحة والوقاية</span>
                <div className="flex items-baseline gap-1.5" dir="ltr">
                  <span className="text-2xl font-bold text-slate-900 font-mono">{selectedPatient.metrics.healthScore}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">/ 100</span>
                </div>
              </GlassCard>

              <GlassCard className="p-4 flex flex-col justify-between">
                <span className="text-[11px] text-slate-500 font-semibold mb-2 font-arabic">أعلى درجة حرارة موضعية</span>
                <div className="flex items-baseline gap-1.5" dir="ltr">
                  <span className={`text-2xl font-bold font-mono ${selectedPatient.metrics.maxTemp > 37.5 ? 'text-orange-600' : 'text-slate-900'}`}>
                    {selectedPatient.metrics.maxTemp}°C
                  </span>
                </div>
              </GlassCard>

              <GlassCard className="p-4 flex flex-col justify-between">
                <span className="text-[11px] text-slate-500 font-semibold mb-2 font-arabic">متوسط الخطوات اليومية</span>
                <div className="flex items-baseline gap-1.5" dir="ltr">
                  <span className="text-2xl font-bold text-[#0B4D8D] font-mono">{selectedPatient.metrics.steps.toLocaleString()}</span>
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </GlassCard>
            </div>

            {/* AI Clinical Recommendations */}
            {selectedPatient.recommendation && (
              <GlassCard className="p-6 bg-slate-50 border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ActivitySquare className="w-4 h-4 text-[#0B4D8D]" />
                    <h3 className="text-sm font-bold text-slate-900 font-arabic">تحليل محرك الذكاء الاصطناعي السريري</h3>
                  </div>
                  <GlassBadge status="info">Dithar AI Insight</GlassBadge>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <p className="text-sm text-slate-700 leading-relaxed font-medium font-arabic">
                    {selectedPatient.recommendation}
                  </p>
                </div>
              </GlassCard>
            )}

            {/* Medical Notes & Doctor Actions */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0B4D8D]" />
                  <h3 className="text-sm font-bold text-slate-900 font-arabic">الملاحظات السريرية والقرارات الطبية</h3>
                </div>
                <span className="text-xs text-slate-400 font-arabic">{selectedPatient.medicalNotes?.length || 0} ملاحظات مسجلة</span>
              </div>

              {/* Add note input */}
              <form onSubmit={handleAddNote} className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="أضف ملاحظة سريرية جديدة للمريض..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4D8D]/20 focus:border-[#0B4D8D] font-arabic"
                />
                <button
                  type="submit"
                  disabled={isSavingNote || !newNote.trim()}
                  className="px-4 py-2.5 bg-[#0B4D8D] text-white rounded-xl font-bold text-xs hover:bg-blue-800 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer font-arabic transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSavingNote ? "حفظ..." : "إضافة"}</span>
                </button>
              </form>

              {/* Notes list */}
              <div className="space-y-2.5 max-h-48 overflow-y-auto">
                {selectedPatient.medicalNotes && selectedPatient.medicalNotes.length > 0 ? (
                  selectedPatient.medicalNotes.map((note) => (
                    <div key={note.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-150 text-right">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-800 font-arabic">{note.author}</span>
                        <span className="text-[10px] text-slate-400 font-mono" dir="ltr">{note.date}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-arabic leading-relaxed">{note.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-3 font-arabic">لا توجد ملاحظات سريرية مضافة بعد.</p>
                )}
              </div>
            </GlassCard>
          </div>
        ) : null}
      </div>
    </div>
  );
}
