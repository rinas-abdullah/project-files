"use client";

import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Cpu, 
  Wifi, 
  Terminal, 
  Sparkles
} from "lucide-react";

const members = [
  {
    name: "ريناس عبدالله",
    letter: "ر",
    role: "المؤسسة والرئيسة التنفيذية • Founder & CEO",
    domain: "CYBERSECURITY & STRATEGY",
    bio: "متخصصة في الأمن السيبراني، صاحبة فكرة دِثار والمسؤولة عن الرؤية الاستراتيجية، نموذج العمل، تطوير المنتج، إدارة الفريق، والشراكات الاستثمارية.",
    icon: ShieldCheck,
    accent: "#0B4D8D",
    accentLight: "rgba(11,77,141,0.12)",
    accentBorder: "rgba(11,77,141,0.25)",
    badge: "CEO & Founder 🇸🇦"
  },
  {
    name: "طلال الشريف",
    letter: "ط",
    role: "المؤسس المشارك ومهندس الإلكترونيات وإنترنت الأشياء • Co-Founder & IoT Engineer",
    domain: "IOT & HARDWARE",
    bio: "مسؤول عن تصميم المكونات الإلكترونية والمستشعرات وآليات جمع ومعالجة البيانات داخل اللباد الطبي الذكي.",
    icon: Wifi,
    accent: "#0D9488",
    accentLight: "rgba(13,148,136,0.12)",
    accentBorder: "rgba(13,148,136,0.25)",
    badge: "IoT & Hardware Lead 📡"
  },
  {
    name: "ليان أيمن",
    letter: "ل",
    role: "المؤسسة المشاركة ومتخصصة في تقنية المعلومات • Co-Founder & IT Specialist",
    domain: "IT & INFRASTRUCTURE",
    bio: "تدعم البنية التقنية للمنصة، تحلل المتطلبات التقنية، وتساهم في تطوير الأنظمة الرقمية وتجربة المستخدم.",
    icon: Terminal,
    accent: "#F59E0B",
    accentLight: "rgba(245,158,11,0.12)",
    accentBorder: "rgba(245,158,11,0.25)",
    badge: "IT Infrastructure 💻"
  },
  {
    name: "غلا الشاعري",
    letter: "غ",
    role: "المؤسسة المشاركة ومهندسة إلكترونيات • Co-Founder & Electronics Engineer",
    domain: "ELECTRONICS DESIGN",
    bio: "تدعم تصميم الأنظمة الإلكترونية والمكونات المدمجة وتساهم في تطوير الحلول التقنية للباد الذكي.",
    icon: Cpu,
    accent: "#10B981",
    accentLight: "rgba(16,185,129,0.12)",
    accentBorder: "rgba(16,185,129,0.25)",
    badge: "Electronics Design 🔌"
  },
];

export default function Team() {
  return (
    <section
      id="team"
      className="relative w-full bg-transparent text-dark-text py-28 px-6 md:px-12 flex flex-col items-center overflow-hidden scroll-mt-28"
    >
      <div className="w-full max-w-6xl mx-auto z-10">

        {/* ── Header ── */}
        <div className="flex flex-col items-center text-center mb-16 select-none">
          <motion.div
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-blue/10 border border-primary-blue/20 text-primary-blue text-xs font-bold mb-4 font-sans"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary-blue" />
            <span>LEADERSHIP & TECHNICAL EXPERTISE</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}
            className="text-4xl sm:text-5xl font-bold font-arabic leading-tight text-dark-text"
          >
            فريق التأسيس والقيادة
          </motion.h2>
          <motion.h3
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.13 }}
            className="text-xl font-light text-primary-blue mt-3 font-sans"
          >
            Founders &amp; Leadership
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.18 }}
            className="text-muted-text text-sm md:text-base mt-4 max-w-2xl font-light leading-relaxed font-arabic"
          >
            رؤية وطموح وطني يجمع بين الأمن السيبراني، إنترنت الأشياء، الهندسة الإلكترونية، وتقنية المعلومات لبناء وتطوير حلول دِثار الذكية.
          </motion.p>
        </div>

        {/* ── Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {members.map((m, idx) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: "easeOut" }}
                className="group relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300"
                style={{ borderTop: `4px solid ${m.accent}` }}
                dir="rtl"
              >
                {/* Ambient glow behind avatar */}
                <div
                  className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity"
                  style={{ background: m.accent }}
                />

                <div className="relative p-6 flex flex-col gap-5 h-full justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden border shadow-sm shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform"
                        style={{ borderColor: m.accentBorder, background: m.accentLight, color: m.accent }}>
                        <Icon className="w-7 h-7" />
                      </div>

                      <span
                        className="text-[10px] font-extrabold tracking-[0.18em] uppercase font-sans px-2.5 py-1 rounded-lg"
                        style={{ color: m.accent, background: m.accentLight, border: `1px solid ${m.accentBorder}` }}
                      >
                        {m.domain}
                      </span>
                    </div>

                    {/* Name + role */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold font-arabic text-dark-text dark:text-white leading-tight">
                          {m.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-xs text-muted-text font-arabic mt-1.5">{m.role}</p>
                    </div>

                    {/* Divider */}
                    <div className="h-px w-full mb-3.5" style={{ background: m.accentBorder }} />

                    {/* Bio */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-arabic font-light">
                      {m.bio}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
