import { useState } from "react";
import { motion } from "motion/react";
import type { MediaAsset, Project } from "@/types";
import { ModuleSection } from "./ModuleSection";
import { ResponsiveImage } from "@/components/ResponsiveImage";
import { MediaBadge } from "@/components/MediaBadge";
import { Reveal } from "@/animations/Reveal";
import { ease } from "@/animations/variants";
import { cn } from "@/lib/cn";

const insole: MediaAsset = {
  base: "dithar-insole",
  widths: [820, 480],
  width: 820,
  height: 691,
  alt: "Render of the Dithar smart insole in black with a perforated sensing surface and small indicator lights.",
  kind: "render",
  caption: "Product render — Dithar insole.",
};

/** Layers as depicted in the product render's exploded view, top to bottom. */
const layers = [
  { name: "Top cover", body: "The surface the foot touches, finished for everyday footwear." },
  { name: "Cushioning", body: "A comfort layer that keeps the instrumented insole wearable all day." },
  { name: "Sensing layer", body: "A perforated layer positioning sensing points across the sole of the foot." },
  { name: "Electronics", body: "The circuit board that reads the sensors and prepares data for transmission." },
  { name: "Power", body: "An integrated battery to run the electronics." },
  { name: "Base shell", body: "A moulded base that encloses and protects the stack." },
];

const flow = [
  { k: "Insole", v: "Plantar sensing", t: "Device" },
  { k: "Bluetooth LE", v: "Low-energy wireless link", t: "Transport" },
  { k: "Platform", v: "Node.js · PostgreSQL · Firebase", t: "Cloud" },
  { k: "Analytics", v: "Python · TensorFlow", t: "AI" },
  { k: "Interfaces", v: "Clinician · Facility · Patient", t: "React" },
];

function LayerStack({ active, onActive }: { active: number; onActive: (i: number) => void }) {
  const gap = 46;
  return (
    <svg viewBox="0 0 420 360" className="h-full w-full" role="group" aria-label="Exploded view of the insole layers">
      {layers.map((l, i) => {
        const y = 40 + i * gap;
        const on = i === active;
        const d = `M70 ${y + 22} C 70 ${y - 2}, 150 ${y - 10}, 250 ${y - 6} C 330 ${y - 3}, 360 ${y + 4}, 352 ${y + 16} C 344 ${y + 30}, 280 ${y + 34}, 200 ${y + 30} C 120 ${y + 27}, 70 ${y + 40}, 70 ${y + 22}Z`;
        return (
          <g
            key={l.name}
            tabIndex={0}
            role="button"
            aria-pressed={on}
            aria-label={`${l.name}: ${l.body}`}
            onPointerEnter={() => onActive(i)}
            onFocus={() => onActive(i)}
            onClick={() => onActive(i)}
            className="cursor-pointer outline-none"
          >
            <motion.path
              d={d}
              animate={{ x: on ? 14 : 0, opacity: on ? 1 : 0.55 }}
              transition={{ duration: 0.45, ease }}
              fill={on ? "rgba(101,223,255,0.10)" : "#0C1118"}
              stroke={on ? "#65DFFF" : "#8192A3"}
              strokeWidth={on ? 1.5 : 1}
            />
            <line x1={360} y1={y + 12} x2={392} y2={y + 12} stroke={on ? "#65DFFF" : "#8192A3"} strokeOpacity={on ? 1 : 0.3} />
            <text x={398} y={y + 16} className={cn("font-mono text-[10px]", on ? "fill-cyan" : "fill-steel-dim")}>
              {String(i + 1).padStart(2, "0")}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function DitharModule(_: { project: Project }) {
  const [layer, setLayer] = useState(2);
  return (
    <>
      <ModuleSection
        id="dithar-anatomy"
        label="Anatomy"
        title={
          <>
            An instrument disguised as an insole.
            <span className="text-steel"> Six layers, one wearable.</span>
          </>
        }
        intro="The layer names below follow the exploded view in the product render. Select a layer to read its role."
      >
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <Reveal className="relative lg:col-span-5">
            <div className="relative mx-auto max-w-md">
              <ResponsiveImage asset={insole} sizes="(min-width: 1024px) 34vw, 90vw" fit="contain" className="aspect-[820/691] bg-transparent" />
              <MediaBadge kind="render" className="absolute left-0 top-0" />
            </div>
          </Reveal>
          <Reveal className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:col-span-7">
            <div className="aspect-[420/360]">
              <LayerStack active={layer} onActive={setLayer} />
            </div>
            <ol className="self-center">
              {layers.map((l, i) => (
                <li key={l.name} className="border-t border-[var(--rule)] last:border-b">
                  <button
                    type="button"
                    onClick={() => setLayer(i)}
                    onPointerEnter={() => setLayer(i)}
                    aria-pressed={i === layer}
                    className="grid w-full grid-cols-[2rem_1fr] py-3 text-left"
                  >
                    <span className={cn("font-mono text-[11px] tracking-[0.14em]", i === layer ? "text-cyan" : "text-steel-dim")}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={cn("transition-colors", i === layer ? "text-paper" : "text-steel")}>{l.name}</span>
                    {i === layer && (
                      <motion.span initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="col-start-2 mt-2 text-sm leading-relaxed text-paper/70">
                        {l.body}
                      </motion.span>
                    )}
                  </button>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </ModuleSection>

      <ModuleSection
        id="dithar-flow"
        label="Data path"
        title={
          <>
            From footstep to clinician,
            <span className="text-steel"> in five hops.</span>
          </>
        }
        intro="The insole streams over Bluetooth Low Energy; the platform stores and serves data; models analyse it; role-based interfaces present it to the people who need it."
      >
        <Reveal as="ol" className="grid border-y border-[var(--rule)] sm:grid-cols-5">
          {flow.map((f, i) => (
            <li key={f.k} className="relative border-b border-[var(--rule)] py-6 pr-4 last:border-b-0 sm:border-b-0 sm:border-r sm:px-4 sm:first:pl-0 sm:last:border-r-0">
              <p className="t-label flex items-center gap-2">
                <span className="text-cyan">{String(i + 1).padStart(2, "0")}</span> {f.t}
              </p>
              <p className="t-heading mt-4 text-xl">{f.k}</p>
              <p className="mt-2 text-sm text-steel">{f.v}</p>
              {i < flow.length - 1 && (
                <span aria-hidden className="absolute -right-1.5 top-1/2 hidden size-3 -translate-y-1/2 rotate-45 border-r border-t border-cyan/70 bg-obsidian sm:block" />
              )}
            </li>
          ))}
        </Reveal>
      </ModuleSection>
    </>
  );
}
