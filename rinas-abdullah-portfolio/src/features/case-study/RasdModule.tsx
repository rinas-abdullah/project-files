import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { Pause, Play, RotateCcw } from "lucide-react";
import type { Project } from "@/types";
import { ModuleSection } from "./ModuleSection";
import { Reveal } from "@/animations/Reveal";
import { cn } from "@/lib/cn";

/** Lines as shown in the replay panel of the Rasd Cyber interface. */
const session: Array<{ text: string; tone: "sys" | "alert" | "cmd" | "ok"; tactic?: number }> = [
  { text: "Connecting to live adversary simulation...", tone: "sys" },
  { text: "[INCIDENT] INITIAL-ACCESS – T1190", tone: "alert", tactic: 0 },
  { text: "Exposed service on an open port. Exploit attempt in progress.", tone: "sys" },
  { text: "analyst@rasd:~$ close-port", tone: "cmd" },
  { text: "Defense successful – the adversary pivots.", tone: "ok" },
  { text: "[INCIDENT] INITIAL-ACCESS – T1110", tone: "alert", tactic: 0 },
  { text: "Surveying leaked credentials against the login portal...", tone: "sys" },
];

const tactics = ["Access", "Exec", "Persist", "Lateral", "C2", "Exfil"];

const loop = [
  { k: "Engage", v: "Defenders work in a live terminal under incident pressure." },
  { k: "Adapt", v: "The AI adversary re-plans around every successful defence." },
  { k: "Learn", v: "Adaptive learning paths respond to how each defender performs." },
  { k: "Measure", v: "Activity becomes a readiness measure leaders can act on." },
];

function TerminalReplay() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? session.length : 0);
  const [playing, setPlaying] = useState(!reduced);

  useEffect(() => {
    if (!playing || !inView) return;
    const id = window.setTimeout(
      () => setShown((n) => (n >= session.length ? 0 : n + 1)),
      shown >= session.length ? 3800 : shown === 0 ? 600 : 1100,
    );
    return () => window.clearTimeout(id);
  }, [shown, playing, inView]);

  const reachedTactic = session.slice(0, shown).some((l) => l.tactic === 0);

  return (
    <div ref={ref} className="reg-marks border border-[var(--rule-strong)] bg-[#05090a]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--rule)] px-4 py-2.5">
        <span className="truncate font-mono text-xs text-paper/80">analyst@rasd-cy:~/lab05</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause replay" : "Play replay"}
            className="grid size-9 place-items-center text-steel hover:text-paper"
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <button type="button" onClick={() => setShown(0)} aria-label="Restart replay" className="grid size-9 place-items-center text-steel hover:text-paper">
            <RotateCcw className="size-4" />
          </button>
        </div>
      </div>
      <div className="min-h-[17rem] px-4 py-5 font-mono text-[12.5px] leading-7 sm:text-sm" aria-live="off">
        {session.slice(0, shown).map((l, i) => (
          <p
            key={i}
            className={cn(
              "break-words",
              l.tone === "alert" && "text-[#ff8a5c]",
              l.tone === "cmd" && "text-[#4ade80]",
              l.tone === "ok" && "text-paper",
              l.tone === "sys" && "text-paper/70",
            )}
          >
            {l.text}
          </p>
        ))}
        {shown < session.length && <span aria-hidden className="inline-block h-4 w-2 animate-pulse bg-paper/70 align-middle" />}
      </div>
      <div className="flex flex-wrap gap-1.5 border-t border-[var(--rule)] px-4 py-3">
        {tactics.map((t, i) => (
          <span
            key={t}
            className={cn(
              "border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors duration-500",
              i === 0 && reachedTactic ? "border-[#ff8a5c]/60 text-[#ff8a5c]" : "border-[var(--rule)] text-steel",
            )}
          >
            {t}
          </span>
        ))}
      </div>
      <p className="sr-only">
        Replay transcript: {session.map((l) => l.text).join(" ")}
      </p>
    </div>
  );
}

export default function RasdModule(_: { project: Project }) {
  return (
    <ModuleSection
      id="rasd-loop"
      label="The loop"
      title={
        <>
          The next attacker won't follow a script.
          <span className="text-steel"> Neither does the training.</span>
        </>
      }
      intro="A replay of the session shown in the platform's interface, recreated here as live text. Tactics follow MITRE ATT&CK."
    >
      <div className="grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <TerminalReplay />
          <p className="t-label mt-3">Recreated from the Rasd Cyber interface for illustration</p>
        </Reveal>
        <Reveal as="ol" className="lg:col-span-5">
          {loop.map((s, i) => (
            <li key={s.k} className="grid grid-cols-[3rem_1fr] border-t border-[var(--rule)] py-6 last:border-b">
              <span className="font-mono text-xs tracking-[0.14em] text-cyan">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <p className="t-heading text-2xl">{s.k}</p>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-paper/75">{s.v}</p>
              </div>
            </li>
          ))}
        </Reveal>
      </div>
    </ModuleSection>
  );
}
