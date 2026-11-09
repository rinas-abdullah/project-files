import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { projects } from "@/data/projects";
import { SheetHeader } from "@/components/SheetHeader";
import { ResponsiveImage, preloadMedia } from "@/components/ResponsiveImage";
import { MediaBadge } from "@/components/MediaBadge";
import { MueenDiagram } from "@/features/case-study/MueenDiagram";
import { QiddiyaMap } from "@/features/case-study/QiddiyaMap";
import { Reveal } from "@/animations/Reveal";
import { ease } from "@/animations/variants";
import type { Project } from "@/types";
import { cn } from "@/lib/cn";

/** The figure shown for a project: its cover, or a purpose-drawn diagram when no faithful image exists. */
export function ProjectFigure({ project, sizes, priority }: { project: Project; sizes: string; priority?: boolean }) {
  if (project.cover) {
    return (
      <div className="relative h-full w-full">
        <ResponsiveImage asset={project.cover} sizes={sizes} priority={priority} className="h-full w-full" />
        <MediaBadge kind={project.cover.kind} className="absolute left-3 top-3" />
      </div>
    );
  }
  return (
    <div className="drafting-grid relative grid h-full w-full place-items-center bg-graphite p-6">
      {project.module === "mueen" ? <MueenDiagram /> : <QiddiyaMap />}
      <span className="absolute left-3 top-3 inline-flex items-center gap-2 border border-steel/30 bg-obsidian/85 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-steel">
        <span aria-hidden className="size-1.5 bg-steel" /> {project.module === "mueen" ? "System diagram" : "Contribution diagram"}
      </span>
    </div>
  );
}

export function WorkExplorer() {
  const [active, setActive] = useState(0);
  const current = projects[active];

  // Warm the cache so switching projects never shows an empty frame.
  useEffect(() => {
    const id = window.setTimeout(() => projects.forEach((p) => p.cover && preloadMedia(p.cover)), 1500);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <section id="work" aria-labelledby="work-title" className="relative bg-graphite/40 py-24 md:py-36">
      <div className="shell">
        <SheetHeader sheet="01" label="Selected work" note={`${projects.length} ventures & projects`} />
        <div className="mt-14 grid gap-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <h2 id="work-title" className="t-display text-[clamp(2.75rem,7vw,6.25rem)]">
              Ventures, systems
              <br />
              <span className="text-steel">& experiments.</span>
            </h2>
          </Reveal>
          <Reveal className="self-end lg:col-span-4 lg:col-start-9">
            <p className="t-body">
              Three ventures founded and led, a GovTech platform, a crowd-safety system design and a collaborative game. Each opens into a case study.
            </p>
          </Reveal>
        </div>

        {/* Desktop: index + sticky figure */}
        <div className="mt-20 hidden gap-10 lg:grid lg:grid-cols-12">
          <ol className="lg:col-span-5" aria-label="Projects">
            {projects.map((p, i) => {
              const on = i === active;
              return (
                <li key={p.slug} className="border-t border-[var(--rule)] last:border-b">
                  <Link
                    to={`/work/${p.slug}`}
                    onPointerEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    aria-describedby={on ? "work-figure-caption" : undefined}
                    className="group grid grid-cols-[3rem_1fr_auto] items-baseline gap-x-4 py-6"
                  >
                    <span className={cn("font-mono text-xs tracking-[0.14em] transition-colors", on ? "text-cyan" : "text-steel-dim")}>{p.index}</span>
                    <span>
                      <span className={cn("t-heading block text-[clamp(1.75rem,2.6vw,2.6rem)] transition-colors duration-500", on ? "text-paper" : "text-steel")}>
                        {p.name}
                      </span>
                      <span className="t-label mt-2 block">{p.category}</span>
                    </span>
                    <ArrowUpRight
                      aria-hidden
                      className={cn("size-5 transition-all duration-500", on ? "translate-x-0 text-cyan opacity-100" : "-translate-x-2 opacity-0")}
                    />
                  </Link>
                </li>
              );
            })}
          </ol>

          <div className="lg:col-span-7">
            <div className="sticky top-24">
              <div className="reg-marks relative aspect-[16/10] w-full border border-[var(--rule)] bg-obsidian">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={current.slug}
                    initial={{ opacity: 0, clipPath: "inset(0 0 0 100%)" }}
                    animate={{ opacity: 1, clipPath: "inset(0 0 0 0%)" }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.75, ease }}
                    className="absolute inset-0"
                  >
                    <ProjectFigure project={current} sizes="(min-width: 1024px) 56vw, 100vw" />
                  </motion.div>
                </AnimatePresence>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={current.slug}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease }}
                  className="mt-6 grid grid-cols-[1fr_auto] gap-6"
                >
                  <div>
                    <p id="work-figure-caption" className="max-w-xl text-[0.98rem] leading-relaxed text-paper/85">{current.summary}</p>
                    <p className="t-label mt-4">
                      {current.role ? `${current.role} · ` : ""}
                      {current.status}
                    </p>
                  </div>
                  <span className="t-label whitespace-nowrap">{current.figureLabel.split(" — ")[0]}</span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile & tablet: stacked plates */}
        <ol className="mt-16 grid gap-16 lg:hidden" aria-label="Projects">
          {projects.map((p) => (
            <Reveal as="li" key={p.slug}>
              <Link to={`/work/${p.slug}`} className="group block">
                <div className="reg-marks aspect-[16/10] w-full border border-[var(--rule)]">
                  <ProjectFigure project={p} sizes="100vw" />
                </div>
                <div className="mt-5 grid grid-cols-[2.5rem_1fr] gap-x-3">
                  <span className="pt-2 font-mono text-xs tracking-[0.14em] text-cyan">{p.index}</span>
                  <div>
                    <h3 className="t-heading text-[2rem]">{p.name}</h3>
                    <p className="t-label mt-2">{p.category}</p>
                    <p className="mt-4 text-[0.98rem] leading-relaxed text-paper/80">{p.summary}</p>
                    <span className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-paper">
                      Read case study <ArrowUpRight aria-hidden className="size-4 text-cyan" />
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
