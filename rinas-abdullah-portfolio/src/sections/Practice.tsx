import { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { SheetHeader } from "@/components/SheetHeader";
import { Reveal } from "@/animations/Reveal";
import { stagger, rise } from "@/animations/variants";
import { disciplineMeta, disciplineOrder } from "@/lib/disciplines";
import { projects } from "@/data/projects";
import { education } from "@/data/profile";
import type { Discipline } from "@/types";
import { cn } from "@/lib/cn";

/** Positioning: a single statement, then the four disciplines as an axis linked to the work. */
export function Practice() {
  const [focus, setFocus] = useState<Discipline | null>(null);

  return (
    <section aria-labelledby="practice-title" className="shell py-24 md:py-36">
      <SheetHeader sheet="00.1" label="Practice" note="Founder · Architect · Builder" />

      <div className="mt-14 grid gap-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-9 lg:col-start-2">
          <h2 id="practice-title" className="t-heading text-[clamp(1.9rem,4.2vw,3.75rem)] text-paper">
            A cybersecurity graduate of {education.institution} who founds ventures and builds them end to end
            <span className="text-steel"> — the threat model, the model, the platform and the interface.</span>
          </h2>
        </Reveal>
      </div>

      <motion.ol
        variants={stagger(0.08)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mt-20 grid border-t border-[var(--rule)] sm:grid-cols-2 lg:grid-cols-4"
        onPointerLeave={() => setFocus(null)}
      >
        {disciplineOrder.map((d, i) => {
          const meta = disciplineMeta[d];
          const related = projects.filter((p) => p.disciplines.includes(d));
          const dim = focus && focus !== d;
          return (
            <motion.li
              key={d}
              variants={rise}
              onPointerEnter={() => setFocus(d)}
              onFocusCapture={() => setFocus(d)}
              className={cn(
                "relative border-b border-[var(--rule)] py-8 pr-6 transition-opacity duration-500 sm:[&:nth-child(odd)]:border-r lg:border-r lg:pl-6 lg:first:pl-0 lg:last:border-r-0",
                dim && "opacity-40",
              )}
            >
              <span
                aria-hidden
                className={cn("absolute left-0 top-0 h-px bg-cyan transition-all duration-700 lg:left-6", focus === d ? "w-16" : "w-0", i === 0 && "lg:left-0")}
              />
              <p className="t-label">
                <span className="text-paper">{String.fromCharCode(65 + i)}</span> — {meta.short}
              </p>
              <h3 className="t-heading mt-5 text-3xl">{meta.label}</h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-steel">{meta.line}</p>
              <ul className="mt-6 flex flex-wrap gap-x-3 gap-y-1">
                {related.map((p) => (
                  <li key={p.slug}>
                    <Link to={`/work/${p.slug}`} className="link-underline font-mono text-[11px] uppercase tracking-[0.12em] text-paper/80 hover:text-cyan">
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.li>
          );
        })}
      </motion.ol>
    </section>
  );
}
