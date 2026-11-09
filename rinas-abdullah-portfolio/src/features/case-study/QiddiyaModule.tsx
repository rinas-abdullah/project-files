import { Suspense, lazy, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Box, TriangleAlert } from "lucide-react";
import type { Project } from "@/types";
import { ModuleSection } from "./ModuleSection";
import { QiddiyaMap, qiddiyaContributions, type QiddiyaKey } from "./QiddiyaMap";
import { Reveal } from "@/animations/Reveal";
import { useWebGL } from "@/hooks/useWebGL";
import { ease } from "@/animations/variants";

const QiddiyaScene = lazy(() => import("./QiddiyaScene"));

export default function QiddiyaModule(_: { project: Project }) {
  const [active, setActive] = useState<QiddiyaKey | null>("gameplay");
  const [sceneOpen, setSceneOpen] = useState(false);
  const webgl = useWebGL();
  const current = qiddiyaContributions.find((c) => c.key === active);

  return (
    <>
      <ModuleSection
        id="qiddiya-contribution"
        label="Contribution"
        title={
          <>
            A team game,
            <span className="text-steel"> built end to end in a hackathon.</span>
          </>
        }
        intro="Seven areas of contribution within the collaborative team. Select one to read more."
      >
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          <Reveal className="lg:col-span-7">
            <div className="drafting-grid reg-marks border border-[var(--rule)] bg-graphite p-4">
              <QiddiyaMap active={active} onActive={setActive} />
            </div>
          </Reveal>
          <Reveal className="lg:col-span-5">
            <div className="min-h-28 border-t border-[var(--rule)] pt-6" aria-live="polite">
              <AnimatePresence mode="wait">
                {current && (
                  <motion.div key={current.key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease }}>
                    <p className="t-label text-amber">Contribution</p>
                    <p className="t-heading mt-3 text-3xl">{current.label}</p>
                    <p className="mt-3 text-paper/80">{current.body}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <dl className="mt-10 grid grid-cols-[8rem_1fr] gap-y-3 border-t border-[var(--rule)] pt-6 text-sm">
              <dt className="t-label pt-0.5">Engine</dt>
              <dd>Unity</dd>
              <dt className="t-label pt-0.5">Unity experience</dt>
              <dd>1–3 years overall</dd>
              <dt className="t-label pt-0.5">Context</dt>
              <dd>General Game Design Hackathon — not organised by Qiddiya</dd>
              <dt className="t-label pt-0.5">Archive</dt>
              <dd className="text-amber">Original game files lost — no gameplay footage exists</dd>
            </dl>
          </Reveal>
        </div>
      </ModuleSection>

      <ModuleSection
        id="qiddiya-sketch"
        label="Optional"
        title={
          <>
            A web sketch of the idea.
            <span className="text-steel"> Not the original game.</span>
          </>
        }
        intro="Because the Unity build no longer exists, this is a new, deliberately abstract three.js scene illustrating the idea of exploring a city in 3D. It loads only if you ask for it."
      >
        <Reveal>
          <div className="reg-marks relative aspect-[4/3] w-full border border-[var(--rule)] bg-graphite sm:aspect-[16/8]">
            {!sceneOpen ? (
              <div className="drafting-grid absolute inset-0 grid place-items-center p-6 text-center">
                <div className="max-w-md">
                  <Box aria-hidden className="mx-auto size-6 text-amber" />
                  {webgl === false ? (
                    <p className="mt-4 text-sm text-steel">
                      <TriangleAlert aria-hidden className="mr-1 inline size-4 text-amber" />
                      Your browser doesn't support WebGL, so the sketch can't be shown. Everything else on this page works normally.
                    </p>
                  ) : (
                    <>
                      <p className="mt-4 text-sm text-paper/80">Interactive web concept · three.js · drag or use arrow keys to look around</p>
                      <button type="button" onClick={() => setSceneOpen(true)} className="btn btn-primary mt-6" disabled={webgl === null}>
                        Load concept sketch
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <Suspense fallback={<div className="absolute inset-0 grid place-items-center"><span className="t-label">Loading sketch…</span></div>}>
                <QiddiyaScene />
              </Suspense>
            )}
            <span className="absolute left-3 top-3 inline-flex items-center gap-2 border border-amber/40 bg-obsidian/85 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-amber">
              <span aria-hidden className="size-1.5 bg-amber" /> New web concept — not the Unity build
            </span>
          </div>
        </Reveal>
      </ModuleSection>
    </>
  );
}
