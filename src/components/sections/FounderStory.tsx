"use client";

import { motion } from "framer-motion";
import { Quote, Users } from "lucide-react";

const team = [
  {
    nameAr: "ريناس عبدالله",
    nameEn: "Rinas Abdullah",
    roleAr: "الرئيس التنفيذي",
    roleEn: "CEO",
    descAr: "قيادة استراتيجية دِثار، وبناء الشراكات مع الجهات الصحية، والإشراف على تطوير المنظومة.",
  },
  {
    nameAr: "تالا القرني",
    nameEn: "Tala Alqarni",
    roleAr: "المديرة التنفيذية التقنية — هندسة الأجهزة والنسيج الإلكتروني والمستشعرات",
    roleEn: "CTO — Hardware, E-Fabric & Sensors",
    descAr: "تطوير Dithar E-Fabric ووحدة Micro-Core، واختبارات الدقة والسلامة.",
  },
  {
    nameAr: "نواف المروعي",
    nameEn: "Nawaf Almarougi",
    roleAr: "مدير المنصة الرقمية والذكاء الاصطناعي",
    roleEn: "AI & Digital Platform Director",
    descAr: "تطوير منصة الرعاية الرقمية والتطبيق، وتحليل البيانات والتنبيهات وحمايتها.",
  },
];

export default function FounderStory() {
  return (
    <section id="founder-story" className="relative w-full py-20 px-6 md:px-12 bg-transparent overflow-hidden">
      <div className="w-full max-w-4xl mx-auto z-10 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="relative p-8 sm:p-10 rounded-3xl glassmorphism border border-slate-200/60 shadow-sm shadow-slate-100/50 text-right"
          dir="rtl"
        >
          <Quote className="w-8 h-8 text-primary-blue/30 mb-4" />
          <span className="text-xs font-semibold tracking-wider text-primary-blue uppercase mb-3 block font-sans unified-english">
            FOUNDER STORY
          </span>
          <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-arabic font-medium">
            سبع عمليات في القدم في سن الرابعة عشرة، دون وسيلة لمعرفة كم وزن تضع المؤسِّسة على قدمها. من هنا جاءت فكرة دِثار: لبادة تبقى في الحذاء المعتاد — لا حذاء طبي يُشعر المريض بأنه مختلف فيتهرب من ارتدائه، بل أداة بسيطة تساعده على الالتزام بحد التحميل الذي يحدده طبيبه.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative p-8 sm:p-10 rounded-3xl glassmorphism border border-slate-200/60 shadow-sm shadow-slate-100/50 text-right"
          dir="rtl"
        >
          <div className="flex items-center gap-2 mb-6 justify-end">
            <span className="text-xs font-semibold tracking-wider text-primary-blue uppercase font-sans unified-english">
              FOUNDING TEAM
            </span>
            <Users className="w-4 h-4 text-primary-blue" />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {team.map((member) => (
              <div key={member.nameEn} className="flex flex-col items-end text-right">
                <p className="text-base font-bold text-slate-900 font-arabic">{member.nameAr}</p>
                <p className="text-[10px] font-sans uppercase tracking-[0.14em] text-slate-400 mb-2">{member.nameEn}</p>
                <p className="text-xs font-semibold text-primary-blue font-arabic leading-relaxed">{member.roleAr}</p>
                <p className="mt-2 text-xs text-slate-500 font-arabic leading-relaxed font-light">{member.descAr}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 pt-4 border-t border-slate-200/70 text-xs text-slate-400 font-arabic leading-relaxed">
            فريق سعودي يجمع القيادة والهندسة والذكاء الاصطناعي، مدعوم بشراكات مع الخدمات الطبية بوزارة الداخلية ومستشفيات بن لادن.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
