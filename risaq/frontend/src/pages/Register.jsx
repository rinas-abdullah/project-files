import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <span className="text-5xl mb-3">🛡️</span>
          <h1 className="text-2xl font-bold">رِسَاق</h1>
          <p className="text-risaq-muted text-sm mt-1">ابدأ رحلتك في التدريب السيبراني</p>
        </div>

        <div className="card p-8">
          <h2 className="text-lg font-bold mb-1">إنشاء حساب متدرب</h2>
          <p className="text-sm text-risaq-muted mb-6">سجّل الآن وابدأ أول مختبر خلال دقائق</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-risaq-muted">الاسم الكامل</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-risaq-muted">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                dir="ltr"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-risaq-muted">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                dir="ltr"
                minLength={8}
                required
              />
              <p className="text-[11px] text-risaq-muted">8 أحرف على الأقل</p>
            </div>

            {error && (
              <div className="text-xs text-risaq-danger bg-risaq-danger/10 border border-risaq-danger/30 rounded-xl px-3 py-2 text-center">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "جارِ الإنشاء..." : "إنشاء الحساب"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-risaq-muted mt-6">
          لديك حساب بالفعل؟{" "}
          <Link to="/login" className="text-risaq-primary font-bold hover:underline">
            سجّل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
