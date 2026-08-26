"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Send, CheckCircle, Phone } from "lucide-react";

const LinkedinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const CONTACT_ITEMS = [
  {
    icon: <Mail className="w-4 h-4" />,
    label: "البريد الإلكتروني",
    value: "dithar.sa@outlook.com",
    href: "mailto:dithar.sa@outlook.com",
    dir: "ltr" as const,
  },
  {
    icon: <Phone className="w-4 h-4" />,
    label: "الهاتف",
    value: "+966 57 199 0916",
    href: "tel:+966571990916",
    dir: "ltr" as const,
  },
  {
    icon: <XIcon />,
    label: "منصة X (تويتر)",
    value: "@DitharHealth",
    href: "https://x.com/DitharHealth",
    dir: "ltr" as const,
    external: true,
  },
  {
    icon: <InstagramIcon />,
    label: "انستغرام",
    value: "@DitharHealth",
    href: "https://www.instagram.com/DitharHealth",
    dir: "ltr" as const,
    external: true,
  },
  {
    icon: <LinkedinIcon />,
    label: "LinkedIn",
    value: "linkedin.com/company/dithar",
    href: "https://www.linkedin.com/company/dithar/",
    dir: "ltr" as const,
    external: true,
  },
  {
    icon: <MapPin className="w-4 h-4" />,
    label: "المقر الرئيسي",
    value: "جدة، المملكة العربية السعودية",
    href: undefined,
    dir: "rtl" as const,
  },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", institution: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          institution: form.institution,
          message: form.message,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setSubmitted(true);
        setForm({ name: "", email: "", institution: "", message: "" });
      } else {
        setError(result.error || "عذراً، حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة لاحقاً.");
      }
    } catch (err) {
      setError("فشل الاتصال بالخادم. يرجى مراسلتنا مباشرة عبر البريد الإلكتروني.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="relative w-full bg-transparent py-28 px-6 md:px-12 flex flex-col items-center overflow-hidden scroll-mt-28"
    >
      <div className="w-full max-w-7xl mx-auto z-10">

        {/* ── Header ── */}
        <div className="flex flex-col items-center text-center mb-16 select-none" dir="rtl">
          <motion.span
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-xs font-semibold tracking-[0.25em] text-primary-blue uppercase mb-4 font-sans"
          >
            CLINICAL / PILOT PARTNERSHIP REQUEST
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
            className="text-4xl sm:text-5xl font-bold font-arabic leading-tight text-dark-text"
          >
            شكّل شراكة القيادة الطبية
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
            className="text-muted-text text-sm md:text-base mt-4 max-w-lg font-light leading-relaxed font-arabic"
          >
            للمستشفيات والمراكز البحثية الراغبة في تجربة منظومة دِثار سريرياً أو بناء شراكة استراتيجية.
          </motion.p>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* ── LEFT: Info ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="lg:col-span-4 flex flex-col gap-6"
            dir="rtl"
          >
            {/* Info card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-bold font-arabic text-dark-text mb-1">تواصل معنا مباشرة</h3>
              <p className="text-xs text-muted-text font-arabic leading-relaxed mb-7">
                فريق الشراكات الطبية في دِثار يرد خلال 24 ساعة.
              </p>

              <div className="flex flex-col gap-5">
                {CONTACT_ITEMS.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-blue/5 border border-primary-blue/10 flex items-center justify-center text-primary-blue shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase font-sans">{item.label}</span>
                      {item.href ? (
                        <a
                          href={item.href}
                          target={item.external ? "_blank" : undefined}
                          rel={item.external ? "noopener noreferrer" : undefined}
                          dir={item.dir}
                          className="text-sm font-medium text-dark-text hover:text-primary-blue transition-colors truncate font-sans mt-0.5"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <span dir={item.dir} className="text-sm font-medium text-dark-text mt-0.5 font-arabic">{item.value}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust badge */}
            <div className="rounded-2xl border border-smart-green/15 bg-smart-green/[0.04] p-5">
              <p className="text-[11px] font-bold text-smart-green uppercase tracking-wider font-sans mb-2">Clinical-Grade Partnership</p>
              <p className="text-xs text-slate-600 font-arabic leading-relaxed">
                جميع الشراكات تمر عبر بروتوكول تقييم سريري موثّق لضمان جودة التطبيق الطبي.
              </p>
            </div>
          </motion.div>

          {/* ── RIGHT: Form ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-8"
          >
            <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm" dir="rtl">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center text-center py-16 gap-5"
                >
                  <div className="w-16 h-16 rounded-full bg-smart-green/10 border border-smart-green/20 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-smart-green" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold font-arabic text-dark-text mb-2">تم إرسال طلبك بنجاح</h4>
                    <p className="text-sm text-muted-text font-arabic max-w-xs mx-auto leading-relaxed">
                      سيتواصل معك فريق شراكات دِثار الطبية خلال 24 ساعة.
                    </p>
                  </div>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-2 px-5 py-2.5 rounded-xl border border-slate-200 text-xs text-muted-text hover:text-dark-text hover:border-slate-300 transition-all cursor-pointer"
                  >
                    إرسال طلب آخر
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="mb-2">
                    <h3 className="text-xl font-bold font-arabic text-dark-text">طلب شراكة سريرية أو تجريبية</h3>
                    <p className="text-xs text-muted-text font-arabic mt-1">Clinical / Pilot Partnership Request</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 font-bold font-sans tracking-wide">الاسم الكامل • Full Name</label>
                      <input
                        type="text" required
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="مثال: د. فيصل السديري"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-dark-text text-sm text-right placeholder-slate-400 focus:border-primary-blue focus:bg-white focus:outline-none transition-all font-arabic"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-400 font-bold font-sans tracking-wide">البريد الإلكتروني • Email</label>
                      <input
                        type="email" required
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="name@institution.com"
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-dark-text text-sm text-right placeholder-slate-400 focus:border-primary-blue focus:bg-white focus:outline-none transition-all font-sans"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-bold font-sans tracking-wide">المنظومة الطبية / الشريك • Institution</label>
                    <input
                      type="text" required
                      value={form.institution}
                      onChange={e => setForm({ ...form, institution: e.target.value })}
                      placeholder="مثال: مستشفى الملك فيصل التخصصي"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-dark-text text-sm text-right placeholder-slate-400 focus:border-primary-blue focus:bg-white focus:outline-none transition-all font-arabic"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-bold font-sans tracking-wide">تفاصيل الطلب • Message</label>
                    <textarea
                      required rows={5}
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      placeholder="تفاصيل طلب الشراكة أو الرغبة في تجربة المنظومة سريرياً..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-dark-text text-sm text-right placeholder-slate-400 focus:border-primary-blue focus:bg-white focus:outline-none transition-all resize-none font-arabic leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-primary-blue hover:bg-medical-blue text-white rounded-xl font-semibold text-sm transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2.5 font-arabic disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        إرسال الطلب • Submit Inquiry
                      </>
                    )}
                  </button>

                  {error && (
                    <p className="text-xs text-red-500 font-arabic text-center mt-2">{error}</p>
                  )}
                </form>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
