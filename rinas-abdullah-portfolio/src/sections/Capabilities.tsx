import { motion } from "motion/react";
import { capabilities } from "@/data/experience";
import { education, profile } from "@/data/profile";
import { SheetHeader } from "@/components/SheetHeader";
import { Reveal } from "@/animations/Reveal";
import { rise, stagger } from "@/animations/variants";

export function Capabilities() {
  return (
    <section id="capabilities" aria-labelledby="capabilities-title" className="shell py-24 md:py-36">
      <SheetHeader sheet="04" label="Capabilities & education" note="Schedule of skills" />

      <div className="mt-14 grid gap-16 lg:grid-cols-12">
        {/* Education — set as a specification */}
        <Reveal as="div" className="lg:col-span-4">
          <h2 id="capabilities-title" className="sr-only">Capabilities and education</h2>
          <p className="t-label">Education</p>
          <p className="t-heading mt-6 text-3xl">{education.institution}</p>
          <p className="mt-2 text-steel">
            {education.field} · {education.location}
          </p>
          <div className="mt-10 border-t border-[var(--rule)] pt-6">
            <p className="t-label">Grade point average</p>
            <p className="t-display mt-3 flex items-baseline gap-3 text-[clamp(4.5rem,9vw,7.5rem)]">
              {education.gpa}
              <span className="font-mono text-base font-normal tracking-[0.1em] text-steel">/ {education.gpaScale}</span>
            </p>
            <p className="t-label mt-2">{education.note}</p>
          </div>
          <div className="mt-10 border-t border-[var(--rule)] pt-6">
            <p className="t-label">Languages</p>
            <p className="mt-3 text-paper/90">{profile.languages.join(" · ")}</p>
          </div>
        </Reveal>

        {/* Capability schedule */}
        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="lg:col-span-8"
        >
          <table className="w-full border-collapse text-left">
            <caption className="t-label pb-4 text-left">Technical capabilities</caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">Ref.</th>
                <th scope="col">Domain</th>
                <th scope="col">Capabilities</th>
              </tr>
            </thead>
            <tbody>
              {capabilities.map((c) => (
                <motion.tr key={c.key} variants={rise} className="group border-t border-[var(--rule)] last:border-b align-top">
                  <th scope="row" className="hidden w-12 py-8 font-mono text-xs font-normal tracking-[0.14em] text-steel-dim transition-colors group-hover:text-cyan sm:table-cell">
                    {c.label}
                  </th>
                  <td className="w-[38%] py-8 pr-6">
                    <span className="t-heading block text-2xl sm:text-[1.75rem]">{c.title}</span>
                  </td>
                  <td className="py-8">
                    <ul className="flex flex-wrap gap-x-2 gap-y-2 text-[0.95rem] text-paper/80">
                      {c.items.map((item, i) => (
                        <li key={item} className="whitespace-nowrap">
                          {item}
                          {i < c.items.length - 1 && <span aria-hidden className="ml-2 text-steel-dim">/</span>}
                        </li>
                      ))}
                    </ul>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}
