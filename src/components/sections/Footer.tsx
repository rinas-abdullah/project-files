"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, MapPin, ArrowUp, Phone, X } from "lucide-react";
import Image from "next/image";

const XIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const PLATFORM_LINKS = [
  { label: "المنتج",               href: "#introducing"    },
  { label: "كيف يعمل",            href: "#workflow"       },
  { label: "التوأم الرقمي",       href: "#digitaltwin"    },
  { label: "محرك الذكاء الاصطناعي", href: "#ai-engine"   },
  { label: "لوحة التحكم",         href: "#dashboard"      },
];

const COMPANY_LINKS = [
  { label: "لماذا دِثار",   href: "#why-dithar"      },
  { label: "نموذج العمل",   href: "#business-model"  },
  { label: "فرصة السوق",    href: "#market"          },
  { label: "خارطة الطريق", href: "#roadmap"         },
  { label: "الفريق",        href: "#team"            },
];

const SOCIALS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/dithar/",
    icon: <LinkedinIcon />,
  },
  {
    label: "X",
    href: "https://x.com/DitharHealth",
    icon: <XIcon />,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/DitharHealth",
    icon: <InstagramIcon />,
  },
];

function scrollTo(href: string) {
  const id = href.replace("#", "");
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

export default function Footer() {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  return (
    <footer className="relative w-full overflow-hidden bg-[#050D1A] text-white">

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary-blue/60 to-transparent" />

      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />

      {/* Large watermark */}
      <div
        aria-hidden
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-black font-sans select-none pointer-events-none whitespace-nowrap"
        style={{ fontSize: "clamp(5rem, 18vw, 14rem)", lineHeight: 1, color: "rgba(255,255,255,0.022)", letterSpacing: "-0.04em" }}
      >
        DITHAR
      </div>

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-10">

        {/* ── Top section: Brand statement ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 pb-14 border-b border-white/[0.07]">

          {/* Brand */}
          <div className="flex flex-col items-start gap-5" dir="rtl">
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="cursor-pointer group flex items-center gap-3">
              <Image
                src="/logo-white.png"
                alt="دِثار — Dithar"
                width={190}
                height={125}
                className="object-contain drop-shadow-[0_4px_25px_rgba(14,131,84,0.3)] group-hover:scale-105 transition-transform duration-300"
                priority
              />
            </button>

            <p className="text-white/45 text-sm leading-relaxed font-arabic font-light max-w-xs text-right">
              منصة رعاية صحية ذكية تعتمد على اللباد الطبي الذكي (Smart PAD) ومنصة سحابية بالذكاء الاصطناعي لمراقبة المرضى بشكل مستمر.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-2.5">
              {SOCIALS.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          <div className="grid grid-cols-2 gap-x-16 gap-y-8" dir="rtl">
            <div>
              <p className="text-[10px] font-bold tracking-[0.22em] uppercase font-sans text-white/30 mb-5">PLATFORM</p>
              <nav className="flex flex-col gap-3">
                {PLATFORM_LINKS.map(l => (
                  <a
                    key={l.label}
                    href={l.href}
                    onClick={e => { e.preventDefault(); scrollTo(l.href); }}
                    className="text-sm text-white/50 hover:text-white transition-colors duration-200 font-arabic"
                  >
                    {l.label}
                  </a>
                ))}
              </nav>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.22em] uppercase font-sans text-white/30 mb-5">COMPANY</p>
              <nav className="flex flex-col gap-3">
                {COMPANY_LINKS.map(l => (
                  <a
                    key={l.label}
                    href={l.href}
                    onClick={e => { e.preventDefault(); scrollTo(l.href); }}
                    className="text-sm text-white/50 hover:text-white transition-colors duration-200 font-arabic"
                  >
                    {l.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8" dir="rtl">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[11px] text-white/25 font-sans" dir="ltr">
              © 2026 Dithar Health Technologies. All rights reserved.
            </p>
            <span className="hidden sm:block w-px h-3 bg-white/10" />
            <button
              onClick={() => setShowPrivacy(true)}
              className="text-[11px] text-white/30 hover:text-white transition-colors duration-200 font-arabic cursor-pointer bg-transparent border-none p-0"
            >
              سياسة الخصوصية
            </button>
            <span className="w-px h-3 bg-white/10" />
            <button
              onClick={() => setShowTerms(true)}
              className="text-[11px] text-white/30 hover:text-white transition-colors duration-200 font-arabic cursor-pointer bg-transparent border-none p-0"
            >
              شروط الخدمة
            </button>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-white/30 font-arabic">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-white/20" />
              جدة، المملكة العربية السعودية
            </span>
            <span className="hidden sm:block w-px h-3 bg-white/10" />
            <a href="mailto:dithar.sa@outlook.com" className="flex items-center gap-1.5 hover:text-white/60 transition-colors duration-200" dir="ltr">
              <Mail className="w-3 h-3 text-white/20" />
              dithar.sa@outlook.com
            </a>
            <span className="hidden sm:block w-px h-3 bg-white/10" />
            <a href="tel:+966571990916" className="flex items-center gap-1.5 hover:text-white/60 transition-colors duration-200" dir="ltr">
              <Phone className="w-3 h-3 text-white/20" />
              +966 57 199 0916
            </a>
          </div>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Scroll to top"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* ── Modals: Privacy Policy & Terms of Service ── */}
      <AnimatePresence>
        {showPrivacy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            onClick={() => setShowPrivacy(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-full max-w-2xl bg-[#091526]/95 border border-white/[0.08] backdrop-blur-md rounded-3xl p-8 text-right overflow-hidden shadow-2xl relative"
              dir="rtl"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowPrivacy(false)}
                className="absolute top-6 left-6 text-white/40 hover:text-white transition-colors p-1 bg-white/[0.04] border border-white/[0.08] rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-2xl font-bold font-arabic text-white mb-6 border-b border-white/[0.06] pb-4">
                سياسة الخصوصية لـ دِثار
              </h3>

              <div className="text-white/70 text-sm leading-relaxed font-arabic font-light space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <p className="font-medium text-white">نلتزم في منصة &quot;دِثار&quot; بحماية سرية وأمن البيانات الصحية والشخصية للمرضى والشركاء السريريين وفقاً لأعلى المعايير العالمية والأنظمة المحلية.</p>
                
                <div className="space-y-2 mt-4">
                  <h4 className="font-semibold text-primary-blue text-base">1. البيانات التي نجمعها</h4>
                  <p>نقوم بجمع البيانات الحيوية ومؤشرات الحركة وميكانيكا المشي (Gait analysis) وتوزيع الضغط والحرارة من خلال المستشعرات الذكية المدمجة في لباد دِثار الطبي الذكي (Smart PAD)، بالإضافة لبيانات الحساب الشخصي التي يضيفها الطاقم الطبي.</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-primary-blue text-base">2. كيف نستخدم بياناتك</h4>
                  <p>تُستخدم البيانات الحيوية حصرياً لتمكين محرك الذكاء الاصطناعي من تحليل حركة المريض وتوفير تنبؤات مبكرة للمخاطر السريرية (مثل القرح السكرية وسقوط كبار السن) ومشاركتها مع طبيبك المعالج فقط لدعم اتخاذ القرار الطبي.</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-primary-blue text-base">3. أمن وتشفير البيانات</h4>
                  <p>يتم تشفير كافة البيانات الطبية تشفيراً كاملاً (End-to-End Encryption) أثناء نقلها لاسلكياً من اللباد الذكي إلى التطبيق وأثناء تخزينها سحابياً، بما يتوافق مع معايير الأمان وحماية البيانات الطبية (HIPAA) وتوجيهات المجلس الصحي السعودي.</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-primary-blue text-base">4. مشاركة البيانات</h4>
                  <p>لا يتم بيع أو مشاركة بيانات المرضى مع أي أطراف ثالثة لأغراض تجارية إطلاقاً. تُشارك البيانات حصرياً مع المنشأة الصحية المشرفة على المريض والباحثين المعتمدين بعد إخفاء هوية المريض تماماً لأغراض البحث العلمي المعتمد.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showTerms && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            onClick={() => setShowTerms(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-full max-w-2xl bg-[#091526]/95 border border-white/[0.08] backdrop-blur-md rounded-3xl p-8 text-right overflow-hidden shadow-2xl relative"
              dir="rtl"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowTerms(false)}
                className="absolute top-6 left-6 text-white/40 hover:text-white transition-colors p-1 bg-white/[0.04] border border-white/[0.08] rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-2xl font-bold font-arabic text-white mb-6 border-b border-white/[0.06] pb-4">
                شروط الخدمة والاستخدام
              </h3>

              <div className="text-white/70 text-sm leading-relaxed font-arabic font-light space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <p className="font-medium text-white">باستخدامك لمنصة &quot;دِثار&quot; والأجهزة الذكية التابعة لها، فإنك توافق على الامتثال للشروط والأحكام التالية:</p>

                <div className="space-y-2 mt-4">
                  <h4 className="font-semibold text-primary-blue text-base">1. الاستخدام المخصص والمسؤولية الطبية</h4>
                  <p>منظومة دِثار (اللباد الطبي والمستشعرات والذكاء الاصطناعي) هي أداة لمراقبة وتحليل المؤشرات الحيوية ودعم القرارات الطبية، وليست بديلاً للتشخيص السريري المباشر أو حالات الطوارئ الطبية الحرجة. يجب دائماً استشارة الطبيب المختص عند اتخاذ أي قرار علاجي.</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-primary-blue text-base">2. الشراكات الطبية والتجريبية</h4>
                  <p>تخضع جميع عمليات تشغيل وتجربة لباد دِثار الطبي الذكي سريرياً داخل المستشفيات للبروتوكولات والموافقات الأخلاقية الرسمية (IRB) الموقعة مسبقاً بين شركة دِثار والمنشأة الصحية الشريكة.</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-primary-blue text-base">3. الملكية الفكرية</h4>
                  <p>جميع حقوق الملكية الفكرية والعلامات التجارية وبراءات الاختراع المتعلقة بالتصميم الهندسي الإلكتروني للباد الذكي، وخوارزميات التنبؤ بمحرك الذكاء الاصطناعي، والواجهات البرمجية، هي ملكية حصرية ومحفوظة لشركة دِثار للتقنيات الصحية ويُمنع نسخها أو إعادة هندستها عكسياً.</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-primary-blue text-base">4. التعديلات وتحديث الخدمة</h4>
                  <p>نحتفظ بالحق في تعديل هذه الشروط أو تحديث خوارزميات المنصة دورياً لضمان مواكبة الأبحاث والممارسات الطبية الحديثة، وسيتم إخطار المستخدمين والشركاء بأي تغييرات جوهرية تؤثر على الاستخدام.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}
