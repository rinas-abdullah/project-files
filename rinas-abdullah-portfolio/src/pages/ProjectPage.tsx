import { Suspense, lazy, type ComponentType } from "react";
import { Link, useParams } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";
import { getProject, projects } from "@/data/projects";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { ProjectFigure } from "@/sections/WorkExplorer";
import { Reveal } from "@/animations/Reveal";
import { ease } from "@/animations/variants";
import { disciplineMeta } from "@/lib/disciplines";
import { profile } from "@/data/profile";
import type { CaseModule, Project } from "@/types";
import NotFoundPage from "./NotFoundPage";

const modules: Record<CaseModule, ComponentType<{ project: Project }>> = {
  dithar: lazy(() => import("@/features/case-study/DitharModule")),
  rasd: lazy(() => import("@/features/case-study/RasdModule")),
  rikaz: lazy(() => import("@/features/case-study/RikazModule")),
  mueen: lazy(() => import("@/features/case-study/MueenModule")),
  muyassir: lazy(() => import("@/features/case-study/MuyassirModule")),
  qiddiya: lazy(() => import("@/features/case-study/QiddiyaModule")),
};

export default function ProjectPage() {
  const { slug } = useParams();
  const project = getProject(slug);
  useDocumentMeta({
    title: project ? `${project.name} — ${project.category} · ${profile.name}` : `Not found — ${profile.name}`,
    description: project?.summary ?? "This page could not be found.",
    path: `/work/${slug ?? ""}`,
  });
  if (!project) return <NotFoundPage />;

  const i = projects.indexOf(project);
  const prev = projects[(i - 1 + projects.length) % projects.length];
  const next = projects[(i + 1) % projects.length];
  const Module = modules[project.module];

  return (
    <article key={project.slug} aria-labelledby="case-title">
      {/* Case header */}
      <header className="shell pt-28 md:pt-36">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="flex items-center justify-between gap-4 border-b border-[var(--rule)] pb-3">
          <Link to={{ pathname: "/", hash: "#work" }} className="group inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-steel hover:text-paper">
            <ArrowLeft aria-hidden className="size-4 transition-transform group-hover:-translate-x-1" /> All work
          </Link>
          <span className="t-label">
            Case <span className="text-paper">{project.index}</span> / {String(projects.length).padStart(2, "0")}
          </span>
        </motion.div>

        <div className="mt-12 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }} className="t-label text-cyan">
              {project.category}
            </motion.p>
            <h1 id="case-title" className="t-display mt-5 overflow-hidden text-[clamp(3.5rem,11vw,9.5rem)]">
              <motion.span className="block" initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ duration: 1, delay: 0.1, ease }}>
                {project.name}
              </motion.span>
            </h1>
          </div>
          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-[6.5rem_1fr] content-end gap-y-3 self-end text-sm lg:col-span-4"
          >
            {project.role && (
              <>
                <dt className="t-label pt-0.5">Role</dt>
                <dd className="text-paper">{project.role}</dd>
              </>
            )}
            <dt className="t-label pt-0.5">Status</dt>
            <dd className="text-paper">{project.status}</dd>
            <dt className="t-label pt-0.5">Disciplines</dt>
            <dd className="text-paper/85">{project.disciplines.map((d) => disciplineMeta[d].label).join(" · ")}</dd>
            {project.stack && (
              <>
                <dt className="t-label pt-0.5">Stack</dt>
                <dd className="text-paper/85">{project.stack.join(" · ")}</dd>
              </>
            )}
          </motion.dl>
        </div>
      </header>

      {/* Lead figure */}
      <motion.figure
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3, ease }}
        className="shell mt-14"
      >
        <div className="reg-marks aspect-[16/10] w-full border border-[var(--rule)] md:aspect-[16/8]">
          <ProjectFigure project={project} sizes="(min-width: 1472px) 1400px, 100vw" priority />
        </div>
        <figcaption className="mt-3 flex flex-wrap justify-between gap-2">
          <span className="t-label">{project.figureLabel}</span>
          {project.cover && <span className="t-label">{project.cover.caption}</span>}
        </figcaption>
      </motion.figure>

      {/* Overview */}
      <section aria-label="Overview" className="shell mt-24 grid gap-10 md:mt-32 lg:grid-cols-12">
        <Reveal className="lg:col-span-3">
          <p className="t-label">
            <span className="text-cyan">§</span> Overview
          </p>
        </Reveal>
        <Reveal className="lg:col-span-8">
          <p className="font-display text-[clamp(1.35rem,2.4vw,2rem)] leading-[1.35] tracking-tight text-paper/90">{project.overview}</p>
          {project.disclosure && (
            <aside aria-label="Integrity note" className="mt-10 grid grid-cols-[1.5rem_1fr] gap-3 border-l border-amber/60 bg-amber/[0.04] py-4 pl-4 pr-5">
              <Info aria-hidden className="mt-0.5 size-4 text-amber" />
              <p className="text-sm leading-relaxed text-paper/80">
                <span className="t-label mr-2 text-amber">Note</span>
                {project.disclosure}
              </p>
            </aside>
          )}
        </Reveal>
      </section>

      {/* Project-specific module */}
      <Suspense fallback={<div className="shell mt-24 h-96" aria-busy="true" />}>
        <Module project={project} />
      </Suspense>

      {/* Highlights */}
      {project.highlights.length > 0 && (
        <section aria-labelledby="highlights-title" className="shell mt-24 md:mt-36">
          <div className="grid gap-10 lg:grid-cols-12">
            <Reveal className="lg:col-span-3">
              <h2 id="highlights-title" className="t-label">
                <span className="text-cyan">§</span> Key capabilities
              </h2>
            </Reveal>
            <ol className="grid gap-px bg-[var(--rule)] sm:grid-cols-2 lg:col-span-9">
              {project.highlights.map((h, n) => (
                <Reveal as="li" key={h.title} className="bg-obsidian p-6 sm:p-8">
                  <span className="font-mono text-[11px] tracking-[0.14em] text-steel-dim">{String(n + 1).padStart(2, "0")}</span>
                  <h3 className="t-heading mt-4 text-2xl">{h.title}</h3>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-paper/75">{h.body}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Pager */}
      <nav aria-label="More case studies" className="shell mt-28 grid border-t border-[var(--rule)] md:mt-40 md:grid-cols-2">
        {[
          { p: prev, dir: "Previous" as const },
          { p: next, dir: "Next" as const },
        ].map(({ p, dir }) => (
          <Link
            key={dir}
            to={`/work/${p.slug}`}
            className={`group flex flex-col gap-4 border-b border-[var(--rule)] py-10 md:border-b-0 ${dir === "Next" ? "md:items-end md:border-l md:pl-10 md:text-right" : "md:pr-10"}`}
          >
            <span className="t-label inline-flex items-center gap-2">
              {dir === "Previous" && <ArrowLeft aria-hidden className="size-4 transition-transform group-hover:-translate-x-1" />}
              {dir} case · {p.index}
              {dir === "Next" && <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />}
            </span>
            <span className="t-heading text-[clamp(2rem,4.5vw,3.75rem)] text-steel transition-colors duration-500 group-hover:text-paper">{p.name}</span>
            <span className="t-label">{p.category}</span>
          </Link>
        ))}
      </nav>
    </article>
  );
}
