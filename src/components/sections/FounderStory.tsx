"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

export default function FounderStory() {
  return (
    <section id="founder-story" className="relative w-full py-20 px-6 md:px-12 bg-transparent overflow-hidden">
      <div className="w-full max-w-4xl mx-auto z-10">
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
      </div>
    </section>
  );
}
