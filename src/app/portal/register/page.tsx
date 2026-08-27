"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/AuthContext";
import { UserPlus, Stethoscope, MailCheck } from "lucide-react";
import { GlassCard } from "@/components/ui/glass";

type ContactMethod = "email" | "phone";

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<"form" | "verify">("form");
  const [contactMethod, setContactMethod] = useState<ContactMethod>("email");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [hospital, setHospital] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("كلمتا المرور غير متطابقتين");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          [contactMethod]: contact,
          password,
          department: department || undefined,
          hospital: hospital || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.requiresVerification) {
        setPendingEmail(data.email);
        setStep("verify");
      } else if (res.ok && data.success) {
        login(data.user);
        router.push("/portal/doctor");
      } else {
        setErrorMessage(data.error || "تعذر إنشاء الحساب");
      }
    } catch {
      setErrorMessage("حدث خطأ في الاتصال بالخادم");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, code: otpCode }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        login(data.user);
        router.push("/portal/doctor");
      } else {
        setErrorMessage(data.error || "رمز التحقق غير صحيح");
      }
    } catch {
      setErrorMessage("حدث خطأ في الاتصال بالخادم");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-[#0B4D8D]/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] rounded-full bg-blue-400/10 blur-[80px]" />
      </div>

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        <div className="mb-8">
          <Image src="/logo.png" alt="Dithar Logo" width={140} height={42} className="object-contain" priority />
        </div>

        <GlassCard className="w-full p-8 shadow-xl border-white/50 backdrop-blur-xl bg-white/80">
          {step === "verify" ? (
            <>
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <MailCheck className="w-6 h-6 text-[#0B4D8D]" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 mb-2">تحقق من بريدك</h1>
                <p className="text-sm text-slate-500">
                  أرسلنا رمز تحقق مكوّن من 6 أرقام إلى<br />
                  <span className="font-bold text-slate-700" dir="ltr">{pendingEmail}</span>
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">رمز التحقق</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white/50 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#0B4D8D]/20 focus:border-[#0B4D8D] transition-all"
                    dir="ltr"
                    maxLength={6}
                    required
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-arabic text-center">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-full py-3 bg-[#0B4D8D] text-white rounded-xl font-bold text-sm shadow-md hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                >
                  {isLoading ? <span>جاري التحقق...</span> : <span>تأكيد الرمز</span>}
                </button>

                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="w-full text-xs text-slate-500 hover:text-[#0B4D8D] transition-colors cursor-pointer"
                >
                  رجوع لتعديل البيانات
                </button>
              </form>
            </>
          ) : (
          <>
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-6 h-6 text-[#0B4D8D]" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">حساب طبيب جديد</h1>
            <p className="text-sm text-slate-500">أنشئ حسابك للانضمام لمنصة دِثار الطبية</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">الاسم الكامل</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4D8D]/20 focus:border-[#0B4D8D] transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">طريقة التواصل</label>
                <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => { setContactMethod("email"); setContact(""); }}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${contactMethod === "email" ? "bg-white text-[#0B4D8D] shadow-sm" : "text-slate-500"}`}
                  >
                    البريد الإلكتروني
                  </button>
                  <button
                    type="button"
                    onClick={() => { setContactMethod("phone"); setContact(""); }}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${contactMethod === "phone" ? "bg-white text-[#0B4D8D] shadow-sm" : "text-slate-500"}`}
                  >
                    رقم الجوال
                  </button>
                </div>
              </div>
              <input
                type={contactMethod === "email" ? "email" : "tel"}
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder={contactMethod === "email" ? "dr.name@hospital.sa" : "05xxxxxxxx"}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4D8D]/20 focus:border-[#0B4D8D] transition-all"
                dir="ltr"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">التخصص (اختياري)</label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4D8D]/20 focus:border-[#0B4D8D] transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">المنشأة (اختياري)</label>
                <input
                  type="text"
                  value={hospital}
                  onChange={e => setHospital(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4D8D]/20 focus:border-[#0B4D8D] transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4D8D]/20 focus:border-[#0B4D8D] transition-all"
                dir="ltr"
                minLength={8}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">تأكيد كلمة المرور</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4D8D]/20 focus:border-[#0B4D8D] transition-all"
                dir="ltr"
                minLength={8}
                required
              />
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
                <span>جاري الإنشاء...</span>
              ) : (
                <>
                  <span>إنشاء الحساب</span>
                  <UserPlus className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
          </>
          )}

          <p className="mt-6 text-center text-xs text-slate-500">
            لديك حساب بالفعل؟{" "}
            <Link href="/portal/login" className="font-bold text-[#0B4D8D] hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </GlassCard>

        <p className="mt-8 text-xs text-slate-400 text-center font-medium">
          Dithar Medical System © 2026<br />
          Secure Portal Entry
        </p>
      </div>
    </div>
  );
}
