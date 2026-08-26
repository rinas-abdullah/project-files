"use client";

import { motion } from "framer-motion";
import { Milestone, Settings, Award, Building2, Globe, Sparkles } from "lucide-react";

export default function Roadmap() {
  const milestones = [
    {
      year: "2024",
      icon: <Settings className="w-5 h-5 text-primary-blue" />,
      title: "تطوير النموذج الأولي • Prototype Development",
      desc: "إنتاج اللباد الطبي الذكي دِثار في نسخته المختبرية الأولى وإجراء الفحوصات الفنية والتأكد من موثوقية المستشعرات في بيئات محاكاة.",
    },
    {
      year: "2027",
      icon: <Award className="w-5 h-5 text-medical-blue" />,
      title: "التحقق والاعتماد السريري • Clinical Validation",
      desc: "البدء في دراسات سريرية موثقة بالتعاون مع مراكز علاج السكري والمستشفيات الجامعية الكبرى للتحقق من كفاءة التنبؤ الذكي.",
    },
    {
      year: "2028",
      icon: <Building2 className="w-5 h-5 text-smart-green" />,
      title: "التدشين والاعتماد التجاري • Hospital Deployment",
      desc: "الحصول على التراخيص الطبية اللازمة من الهيئات التنظيمية، وإطلاق خدمات المنصة تجارياً للمستشفيات الخاصة ومزودي الخدمة.",
    },
    {
      year: "2029",
      icon: <Globe className="w-5 h-5 text-purple-400" />,
      title: "التوسع الإقليمي • Regional Expansion",
      desc: "توقيع شراكات استراتيجية مع شركات التأمين الكبرى والتوسع في الأسواق الإقليمية والخليجية لدعم كبار السن ومرضى السكري.",
    },
    {
      year: "2030",
      icon: <Sparkles className="w-5 h-5 text-teal-400" />,
      title: "منظومة الصحة الاستباقية • Ecosystem",
      desc: "بناء شبكة وقائية متكاملة تعتمد بالكامل على التحليلات الاستباقية الحركية وتكاملها مع ملفات المرضى الطبية بشكل مؤتمت.",
    },
  ];

  return (
    <section id="roadmap" className="relative min-h-screen w-full bg-transparent text-[#0F172A] py-24 px-6 md:px-12 flex flex-col justify-center items-center overflow-hidden">

      <div className="w-full max-w-7xl mx-auto z-10">
        
        {/* Title */}
        <div className="flex flex-col items-center justify-center text-center mb-20 select-none">
          <span className="text-xs font-semibold tracking-wider text-medical-blue uppercase mb-3 font-sans flex items-center gap-2">
            <Milestone className="w-4 h-4 text-medical-blue" />
            STRATEGIC VENTURE MILESTONES
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-arabic leading-tight unified-typography">
            خارطة الطريق المستقبلية
          </h2>
          <h3 className="text-xl sm:text-2xl font-light text-medical-blue mt-2 font-sans unified-english">
            Strategic Roadmap
          </h3>
          <p className="text-muted-text text-sm md:text-base mt-4 max-w-2xl font-light leading-relaxed unified-typography">
            الخطة التنفيذية لنمو وتطوير دِثار، انتقالاً من إثبات المفهوم الهندسي وحتى التوسع التجاري الإقليمي المتكامل.
          </p>
        </div>

        {/* Timeline Path */}
        <div className="relative flex flex-col gap-12 w-full max-w-3xl mx-auto">
          {/* Vertical track line */}
          <div className="absolute right-8 top-8 bottom-8 w-0.5 bg-slate-200/60 pointer-events-none"></div>

          {milestones.map((m, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="flex flex-row-reverse items-start gap-6 relative"
            >
              {/* Year badge node */}
              <div className="w-16 h-16 rounded-full bg-white border border-slate-200/80 hover:border-medical-blue/40 shadow-sm shadow-slate-100/50 transition-all duration-300 flex flex-col items-center justify-center z-10 shrink-0">
                <span className="text-xs font-extrabold text-medical-blue font-sans leading-none mb-1">{m.year}</span>
                {m.icon}
              </div>

              {/* Card info */}
              <div className="flex-1 flex flex-col text-right pt-2">
                <h4 className="text-lg font-bold text-slate-800 font-arabic mb-2 leading-none">
                  {m.title.includes(" • ") ? (
                    <>
                      <span className="font-arabic">{m.title.split(" • ")[0]}</span>
                      <span className="unified-english"> • {m.title.split(" • ")[1]}</span>
                    </>
                  ) : (
                    m.title
                  )}
                </h4>
                <p className="text-sm text-muted-text leading-relaxed font-light font-arabic">
                  {m.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
