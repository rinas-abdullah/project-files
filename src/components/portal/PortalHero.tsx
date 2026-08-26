import React from "react";
import { Sparkles, Smartphone, User, Stethoscope, Building2, ChevronLeft } from "lucide-react";

interface PortalHeroProps {
  activePortal: "patient" | "doctor" | "hospital";
  setActivePortal: (portal: "patient" | "doctor" | "hospital") => void;
  setShowDownloadModal: (show: boolean) => void;
}

export function PortalHero({ activePortal, setActivePortal, setShowDownloadModal }: PortalHeroProps) {
  return (
    <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-4">
      <div className="bg-gradient-to-r from-[#0B2038] via-[#09182A] to-[#0D2B22] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>المنظومة الوطنية الموحدة لشركة دِثار للتقنيات الصحية</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
              منصة دِثار | DITHAR Portal
            </h1>
            <p className="mt-2 text-slate-300 text-xs md:text-sm font-light leading-relaxed max-w-2xl">
              ربط تكاملي آمن بين المريض، الطبيب المعالج، وإدارة المنشأة الصحية عبر اللباد الطبي الذكي (Smart PAD) والمنظومة السحابية الموحدة.
            </p>
          </div>

          {/* App Store & Google Play CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowDownloadModal(true)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 text-white transition-all group"
            >
              <Smartphone className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="text-right">
                <p className="text-[9px] text-slate-400">حمل للآيفون والآيباد</p>
                <p className="text-xs font-bold">App Store</p>
              </div>
            </button>
            <button
              onClick={() => setShowDownloadModal(true)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/20 text-white transition-all group"
            >
              <Smartphone className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
              <div className="text-right">
                <p className="text-[9px] text-slate-400">حمل للأندرويد</p>
                <p className="text-xs font-bold">Google Play</p>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile & Responsive Portal Selector Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setActivePortal("patient")}
            className={`p-4 rounded-2xl text-right transition-all flex items-center justify-between border ${
              activePortal === "patient"
                ? "bg-emerald-600/30 border-emerald-500/80 shadow-lg shadow-emerald-950/50"
                : "bg-white/[0.04] border-white/10 hover:bg-white/[0.08]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${activePortal === "patient" ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-300"}`}>
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">👤 بوابة المريض</h3>
                <p className="text-[11px] text-slate-400">ربط اللباد، متابعة الخطة، وتنبيهات الضغط</p>
              </div>
            </div>
            <ChevronLeft className={`w-5 h-5 ${activePortal === "patient" ? "text-emerald-400" : "text-slate-500"}`} />
          </button>

          <button
            onClick={() => setActivePortal("doctor")}
            className={`p-4 rounded-2xl text-right transition-all flex items-center justify-between border ${
              activePortal === "doctor"
                ? "bg-sky-600/30 border-sky-500/80 shadow-lg shadow-sky-950/50"
                : "bg-white/[0.04] border-white/10 hover:bg-white/[0.08]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${activePortal === "doctor" ? "bg-sky-500 text-white" : "bg-white/10 text-slate-300"}`}>
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">🩺 بوابة الطبيب</h3>
                <p className="text-[11px] text-slate-400">البحث برقم الملف الطبي والمتابعة السريرية</p>
              </div>
            </div>
            <ChevronLeft className={`w-5 h-5 ${activePortal === "doctor" ? "text-sky-400" : "text-slate-500"}`} />
          </button>

          <button
            onClick={() => setActivePortal("hospital")}
            className={`p-4 rounded-2xl text-right transition-all flex items-center justify-between border ${
              activePortal === "hospital"
                ? "bg-indigo-600/30 border-indigo-500/80 shadow-lg shadow-indigo-950/50"
                : "bg-white/[0.04] border-white/10 hover:bg-white/[0.08]"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${activePortal === "hospital" ? "bg-indigo-500 text-white" : "bg-white/10 text-slate-300"}`}>
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">🏥 بوابة المستشفيات والمؤسسات</h3>
                <p className="text-[11px] text-slate-400">إدارة أسطول الأجهزة والتقارير الإحصائية</p>
              </div>
            </div>
            <ChevronLeft className={`w-5 h-5 ${activePortal === "hospital" ? "text-indigo-400" : "text-slate-500"}`} />
          </button>
        </div>
      </div>
    </section>
  );
}
