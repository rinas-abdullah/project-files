import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Project } from "@/types";
import { ModuleSection } from "./ModuleSection";
import { MueenDiagram, mueenNodes, type MueenNodeId } from "./MueenDiagram";
import { Reveal } from "@/animations/Reveal";
import { ease } from "@/animations/variants";
import { cn } from "@/lib/cn";

const workflow = [
  { k: "Monitor", who: "Operations room", v: "A live view of density and movement across monitored zones." },
  { k: "Detect", who: "Analytics", v: "Anomalies in crowd behaviour are flagged as they emerge." },
  { k: "Anticipate", who: "Analytics", v: "Predictive signals indicate where congestion is likely to build." },
  { k: "Respond", who: "Safety personnel", v: "Teams intervene proactively, guided by the dashboard." },
];

export default function MueenModule(_: { project: Project }) {
  const [active, setActive] = useState<MueenNodeId | null>("fusion");
  const node = mueenNodes.find((n) => n.id === active);

  return (
    <>
      <ModuleSection
        id="mueen-architecture"
        label="Architecture"
        title={
          <>
            Many signals in,
            <span className="text-steel"> one operational picture out.</span>
          </>
        }
        intro="Select any component to trace what feeds it and what it feeds."
      >
        {/* Desktop / tablet diagram */}
        <Reveal className="hidden md:block">
          <div className="drafting-grid reg-marks border border-[var(--rule)] bg-graphite p-6">
            <MueenDiagram active={active} onActive={setActive} />
          </div>
          <div className="mt-4 grid min-h-16 grid-cols-[10rem_1fr] gap-6" aria-live="polite">
            <AnimatePresence mode="wait">
              {node && (
                <motion.div key={node.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease }} className="contents">
                  <p className="t-label text-cyan">{node.stage}</p>
                  <p className="text-paper/85">
                    <span className="text-paper">{node.label}.</span> {node.body}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="t-label mt-2">Fig. 04 — System architecture diagram</p>
        </Reveal>

        {/* Phone: the same architecture as a readable vertical sequence */}
        <ol className="md:hidden" aria-label="Mu'een architecture, in order">
          {mueenNodes.map((n, i) => (
            <li key={n.id} className="relative grid grid-cols-[1.5rem_1fr] gap-3 pb-6">
              <span aria-hidden className="relative flex justify-center">
                <span className="mt-1.5 size-2.5 border border-cyan bg-obsidian" />
                {i < mueenNodes.length - 1 && <span className="absolute bottom-[-0.25rem] top-5 w-px bg-[var(--rule-strong)]" />}
              </span>
              <div>
                <p className="t-label">{n.stage}</p>
                <p className="t-heading mt-1 text-xl">{n.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-paper/70">{n.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </ModuleSection>

      <ModuleSection
        id="mueen-workflow"
        label="User workflow"
        title={
          <>
            Designed for the people
            <span className="text-steel"> who have to act.</span>
          </>
        }
      >
        <Reveal as="ol" className="grid gap-px bg-[var(--rule)] sm:grid-cols-2 lg:grid-cols-4">
          {workflow.map((w, i) => (
            <li key={w.k} className={cn("bg-obsidian p-6", i === workflow.length - 1 && "bg-graphite")}>
              <p className="t-label">
                <span className="text-cyan">{String(i + 1).padStart(2, "0")}</span> · {w.who}
              </p>
              <p className="t-heading mt-6 text-3xl">{w.k}</p>
              <p className="mt-3 text-sm leading-relaxed text-paper/75">{w.v}</p>
            </li>
          ))}
        </Reveal>
      </ModuleSection>
    </>
  );
}
