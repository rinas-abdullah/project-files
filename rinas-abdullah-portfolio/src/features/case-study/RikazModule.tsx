import { useMemo, useState } from "react";
import { motion } from "motion/react";
import type { Project } from "@/types";
import { ModuleSection } from "./ModuleSection";
import { Reveal } from "@/animations/Reveal";
import { ease } from "@/animations/variants";
import { cn } from "@/lib/cn";

/** Deterministic pseudo-noise so the illustration is identical on every render. */
const noise = (i: number, seed: number) => {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x) - 0.5;
};

const N = 220;
const burst = (i: number, at: number) => {
  const d = i - at;
  return d < 0 ? 0 : Math.exp(-d / 14) * Math.sin(d * 0.9) * 1.0;
};

const traceA = Array.from({ length: N }, (_, i) => noise(i, 1) * 0.35 + burst(i, 70));
const traceB = Array.from({ length: N }, (_, i) => noise(i, 2) * 0.35 + burst(i, 118));
const toPath = (arr: number[], h: number, mid: number) =>
  arr.map((v, i) => `${i === 0 ? "M" : "L"}${((i / (N - 1)) * 600).toFixed(1)} ${(mid - v * h).toFixed(1)}`).join(" ");

const steps = [
  { k: "Position", v: "Geophones are placed on the ground either side of a suspected leak." },
  { k: "Capture", v: "Channels are recorded on a shared clock, so their timing can be compared." },
  { k: "Process", v: "An edge computer filters and compares the signals at the survey point." },
  { k: "Verify", v: "The operator display presents the result to support a dig / no-dig decision." },
];

export default function RikazModule(_: { project: Project }) {
  const [step, setStep] = useState(2);
  const pa = useMemo(() => toPath(traceA, 26, 60), []);
  const pb = useMemo(() => toPath(traceB, 26, 160), []);
  const corr = useMemo(() => {
    const pts = Array.from({ length: 121 }, (_, i) => {
      const lag = i - 60;
      const v = Math.exp(-((lag - 24) ** 2) / 40) * 0.95 + Math.abs(noise(i, 3)) * 0.12;
      return `${i === 0 ? "M" : "L"}${(i * 5).toFixed(1)} ${(300 - v * 60).toFixed(1)}`;
    });
    return pts.join(" ");
  }, []);

  return (
    <ModuleSection
      id="rikaz-signal"
      label="Principle"
      title={
        <>
          Listening to the ground
          <span className="text-steel"> before breaking it.</span>
        </>
      }
      intro="When two synchronized geophones hear the same leak, the difference in arrival time carries information about where it is. The traces below illustrate that principle."
    >
      <div className="grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <div className="drafting-grid reg-marks border border-[var(--rule)] bg-graphite p-4 sm:p-6">
            <svg viewBox="0 0 600 330" className="w-full" role="img" aria-label="Illustration: two geophone traces with the same burst arriving at different times, and a correlation curve peaking at the time offset.">
              <text x="0" y="16" className="fill-steel font-mono text-[10px] uppercase tracking-[0.14em]">Geophone A</text>
              <text x="0" y="116" className="fill-steel font-mono text-[10px] uppercase tracking-[0.14em]">Geophone B</text>
              <text x="0" y="226" className="fill-steel font-mono text-[10px] uppercase tracking-[0.14em]">Cross-correlation</text>
              <motion.path d={pa} fill="none" stroke="#F3F6F8" strokeOpacity="0.8" strokeWidth="1.2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 2.2, ease }} />
              <motion.path d={pb} fill="none" stroke="#F3F6F8" strokeOpacity="0.8" strokeWidth="1.2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 2.2, delay: 0.3, ease }} />
              <line x1={(70 / (N - 1)) * 600} y1="24" x2={(70 / (N - 1)) * 600} y2="190" stroke="#65DFFF" strokeDasharray="3 4" strokeOpacity="0.7" />
              <line x1={(118 / (N - 1)) * 600} y1="124" x2={(118 / (N - 1)) * 600} y2="190" stroke="#65DFFF" strokeDasharray="3 4" strokeOpacity="0.7" />
              <line x1={(70 / (N - 1)) * 600} y1="184" x2={(118 / (N - 1)) * 600} y2="184" stroke="#65DFFF" />
              <text x={(94 / (N - 1)) * 600} y="200" textAnchor="middle" className="fill-cyan font-mono text-[10px]">Δt</text>
              <line x1="0" y1="300" x2="600" y2="300" stroke="#8192A3" strokeOpacity="0.3" />
              <motion.path d={corr} fill="none" stroke="#65DFFF" strokeWidth="1.5" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, delay: 1.2, ease }} />
              <text x={(60 + 24) * 5} y="232" textAnchor="middle" className="fill-paper font-mono text-[10px]">peak = offset</text>
            </svg>
          </div>
          <p className="t-label mt-3">Illustration of the principle — not recorded field data</p>
        </Reveal>

        <Reveal as="ol" className="lg:col-span-5">
          {steps.map((s, i) => (
            <li key={s.k} className="border-t border-[var(--rule)] last:border-b">
              <button
                type="button"
                aria-pressed={i === step}
                onClick={() => setStep(i)}
                onPointerEnter={() => setStep(i)}
                className="grid w-full grid-cols-[3rem_1fr] py-5 text-left"
              >
                <span className={cn("font-mono text-xs tracking-[0.14em]", i === step ? "text-cyan" : "text-steel-dim")}>{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <span className={cn("t-heading block text-2xl transition-colors", i === step ? "text-paper" : "text-steel")}>{s.k}</span>
                  <span className={cn("mt-2 block text-[0.95rem] leading-relaxed transition-colors", i === step ? "text-paper/80" : "text-steel-dim")}>{s.v}</span>
                </span>
              </button>
            </li>
          ))}
        </Reveal>
      </div>
    </ModuleSection>
  );
}
