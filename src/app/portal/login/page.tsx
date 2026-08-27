"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { UserRole } from "@/lib/types/portal";
import { User, Stethoscope, Building2, LogIn } from "lucide-react";
import { GlassCard } from "@/components/ui/glass";

// Mirrors the default demo accounts in src/lib/auth/users.ts (for display only —
// an operator who overrides the DEMO_*_PASSWORD env vars should update this too).
const DEMO_CREDENTIALS: Record<UserRole, { identifier: string; password: string }> = {
  patient: { identifier: "sara.alotaibi@dithar.sa", password: "Dithar@Patient2026!" },
  doctor: { identifier: "dr.khalid@dithar.sa", password: "Dithar@Doctor2026!" },
  hospital_admin: { identifier: "admin@kfshrc.edu.sa", password: "Dithar@Admin2026!" },
};

export default function LoginPage() {
  const { login } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const router = useRouter();

  const [role, setRole] = useState<UserRole>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        login(data.user);
        if (data.user.role === "patient") router.push("/portal/patient");
        else if (data.user.role === "doctor") router.push("/portal/doctor");
        else if (data.user.role === "hospital_admin") router.push("/portal/hospital");
      } else {
        setErrorMessage(data.error || "تعذر تسجيل الدخول");
      }
    } catch {
      setErrorMessage("حدث خطأ في الاتصال بالخادم");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
         <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-[#0B4D8D]/10 blur-[100px]" />
         <div className="absolute bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] rounded-full bg-blue-400/10 blur-[80px]" />
      </div>

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        
        {/* Language Toggle */}
        <button 
          onClick={toggleLanguage}
          className="absolute top-[-40px] right-0 text-xs font-bold text-slate-500 hover:text-[#0B4D8D] bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm transition-colors"
        >
          {language === "ar" ? "English" : "العربية"}
        </button>

        <div className="mb-8">
          <Image src="/logo.png" alt="Dithar Logo" width={140} height={42} className="object-contain" priority />
        </div>

        <GlassCard className="w-full p-8 shadow-xl border-white/50 backdrop-blur-xl bg-white/80">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-slate-900 mb-2">{t.welcome_back}</h1>
            <p className="text-sm text-slate-500">{t.login_subtitle}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">{t.select_role}</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "patient", label: t.role_patient, icon: User },
                  { id: "doctor", label: t.role_doctor, icon: Stethoscope },
                  { id: "hospital_admin", label: t.role_hospital, icon: Building2 }
                ].map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id as UserRole)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                      role === r.id 
                        ? "border-[#0B4D8D] bg-blue-50 text-[#0B4D8D]" 
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    <r.icon className={`w-5 h-5 mb-2 ${role === r.id ? "text-[#0B4D8D]" : "text-slate-400"}`} />
                    <span className="text-[10px] font-bold text-center leading-tight">{r.label}</span>
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 font-mono" dir="ltr">
                demo: {DEMO_CREDENTIALS[role].identifier} / {DEMO_CREDENTIALS[role].password}
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">{t.email}</label>
                <input 
                  type="text" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4D8D]/20 focus:border-[#0B4D8D] transition-all"
                  dir="ltr"
                  required
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">{t.password}</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4D8D]/20 focus:border-[#0B4D8D] transition-all"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-arabic text-center">
                {errorMessage}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3 bg-[#0B4D8D] text-white rounded-xl font-bold text-sm shadow-md hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? (
                <span>{t.loading}</span>
              ) : (
                <>
                  <span>{t.login_btn}</span>
                  <LogIn className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </GlassCard>

        <div className="mt-6 flex flex-col items-center gap-1.5 text-xs text-slate-500">
          <p>
            الأطباء الجدد يمكنهم{" "}
            <Link href="/portal/register" className="font-bold text-[#0B4D8D] hover:underline">
              إنشاء حساب جديد
            </Link>
          </p>
          <p>
            المرضى الذين لم يُفعّلوا حساباتهم بعد يمكنهم{" "}
            <Link href="/portal/patient/activate" className="font-bold text-[#0B4D8D] hover:underline">
              تفعيل الحساب
            </Link>
          </p>
        </div>

        <p className="mt-8 text-xs text-slate-400 text-center font-medium">
          Dithar Medical System © 2026<br/>
          Secure Portal Entry
        </p>
      </div>
    </div>
  );
}
