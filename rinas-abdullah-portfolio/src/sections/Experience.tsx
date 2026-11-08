import { useState } from "react";
import { motion } from "motion/react";
import { roles } from "@/data/experience";
import { SheetHeader } from "@/components/SheetHeader";
import { Reveal } from "@/animations/Reveal";
import { ease } from "@/animations/variants";
import { cn } from "@/lib/cn";

const START = { y: 2025, m: 10 };
const months = ["Oct", "Nov", "Dec", "Jan", "Feb"];
const years = ["2025", "", "", "2026", ""];
const idx = (d: { y: number; m: number }) => (d.y - START.y) * 12 + d.m - START.m;

export function Experience() {
  const [hot, setHot] = useState<string | null>(null);
  const chronological = [...roles].sort((a, b) => idx(a.start) - idx(b.start));

  return (
    <section id="experience" aria-labelledby="experience-title" className="bg-graphite/40 py-24 md:py-36">
      <div className="shell">
        <SheetHeader sheet="03" label="Professional experience" note="Jeddah · 2025 — 2026" />
        <div className="mt-14 grid gap-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-8">
            <h2 id="experience-title" className="t-display text-[clamp(2.75rem,7vw,6.25rem)]">
              Security, from
              <br />
              <span className="text-steel">policy to packet.</span>
            </h2>
          </Reveal>
          <Reveal className="self-end lg:col-span-4">
            <p className="t-body">
              Governance and risk, network defence and infrastructure, and clinical IT — including two roles held concurrently.
            </p>
          </Reveal>
        </div>

        {/* Timeline */}
        <Reveal className="mt-20" amount={0.3}>
          <figure aria-label="Timeline of roles from October 2025 to February 2026">
            <div className="grid grid-cols-[minmax(7rem,30%)_1fr] gap-x-4 sm:grid-cols-[minmax(10rem,28%)_1fr]">
              <span />
              <div className="grid grid-cols-5 border-b border-[var(--rule)] pb-2">
                {months.map((m, i) => (
                  <span key={m} className="t-label">
                    {m}
                    {years[i] && <span className="hidden text-steel-dim sm:inline"> {years[i]}</span>}
                  </span>
                ))}
              </div>
              {chronological.map((r, i) => {
                const s = idx(r.start);
                const e = idx(r.end);
                const on = hot === r.org;
                return (
                  <div key={r.org} className="contents">
                    <button
                      type="button"
                      onPointerEnter={() => setHot(r.org)}
                      onPointerLeave={() => setHot(null)}
                      onFocus={() => setHot(r.org)}
                      onBlur={() => setHot(null)}
                      onClick={() => document.getElementById(`role-${i}`)?.scrollIntoView({ block: "center" })}
                      className={cn("truncate border-b border-[var(--rule)] py-4 text-left text-sm transition-colors", on ? "text-paper" : "text-steel")}
                    >
                      {r.org}
                    </button>
                    <div className="relative border-b border-[var(--rule)]">
                      <div aria-hidden className="absolute inset-0 grid grid-cols-5">
                        {months.map((m) => (
                          <span key={m} className="border-l border-[var(--rule)] opacity-50" />
                        ))}
                      </div>
                      <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.1, delay: 0.15 * i, ease }}
                        style={{ left: `${(s / 5) * 100}%`, width: `${((e - s + 1) / 5) * 100}%` }}
                        className={cn(
                          "absolute top-1/2 h-2 origin-left -translate-y-1/2 transition-colors duration-300",
                          on ? "bg-cyan" : "bg-slate-hi",
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <figcaption className="t-label mt-4">Fig. 03 — Role timeline. Bars span the months stated on the CV.</figcaption>
          </figure>
        </Reveal>

        {/* Roles */}
        <ol className="mt-20 grid gap-px bg-[var(--rule)] lg:grid-cols-3">
          {roles.map((r) => {
            const i = chronological.indexOf(r);
            const on = hot === r.org;
            return (
              <Reveal
                as="li"
                key={r.org}
                id={`role-${i}`}
                className={cn("flex flex-col bg-obsidian p-6 transition-colors duration-500 sm:p-8", on && "bg-graphite")}
              >
                <div onPointerEnter={() => setHot(r.org)} onPointerLeave={() => setHot(null)} className="flex h-full flex-col">
                  <p className="t-label flex flex-wrap items-center gap-x-3">
                    <span className={cn(on ? "text-cyan" : "text-paper")}>{r.period}</span>
                    {r.concurrent && <span className="text-steel-dim">· Concurrent</span>}
                  </p>
                  <h3 className="t-heading mt-6 text-2xl">{r.title}</h3>
                  <p className="mt-2 text-sm text-steel">
                    {r.org} · {r.location}
                  </p>
                  <ul className="mt-8 grid gap-4 text-[0.95rem] leading-relaxed text-paper/80">
                    {r.points.map((p) => (
                      <li key={p} className="grid grid-cols-[1rem_1fr]">
                        <span aria-hidden className="mt-[0.7em] h-px w-2.5 bg-steel" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <ul aria-label="Focus areas" className="mt-auto flex flex-wrap gap-2 pt-8">
                    {r.focus.map((f) => (
                      <li key={f} className="border border-[var(--rule)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-steel">
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
