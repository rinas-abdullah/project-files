import type { Project } from "@/types";
import { ModuleSection } from "./ModuleSection";
import { ResponsiveImage } from "@/components/ResponsiveImage";
import { MediaBadge } from "@/components/MediaBadge";
import { Reveal } from "@/animations/Reveal";

const journey = [
  { k: "Photograph", v: "Upload photos of the storefront, the entrance and the inside." },
  { k: "Match", v: "Photos are matched against the requirements for the shop's activity." },
  { k: "Report", v: "A report in the owner's language: what passes, what is missing." },
  { k: "Fix", v: "Each gap comes with how to fix it — for example, adding a ramp beside the steps." },
  { k: "Re-check", v: "Fix and check again, then apply for the licence with confidence." },
];

export default function MuyassirModule({ project }: { project: Project }) {
  return (
    <ModuleSection
      id="muyassir-journey"
      label="Owner journey"
      title={
        <>
          Know how ready you are
          <span className="text-steel"> before you apply.</span>
        </>
      }
      intro="The journey below is taken from the platform's own interface copy."
    >
      <div className="grid gap-12 lg:grid-cols-12">
        <Reveal as="ol" className="lg:col-span-7">
          {journey.map((s, i) => (
            <li key={s.k} className="grid grid-cols-[3rem_1fr] gap-x-2 border-t border-[var(--rule)] py-6 last:border-b sm:grid-cols-[3rem_10rem_1fr]">
              <span className="font-mono text-xs tracking-[0.14em] text-cyan">{String(i + 1).padStart(2, "0")}</span>
              <p className="t-heading text-2xl">{s.k}</p>
              <p className="col-start-2 mt-2 text-[0.95rem] leading-relaxed text-paper/75 sm:col-start-3 sm:mt-0">{s.v}</p>
            </li>
          ))}
        </Reveal>
        {project.cover && (
          <Reveal className="lg:col-span-4 lg:col-start-9">
            <figure>
              <div className="relative mx-auto aspect-[3/4] max-w-sm border border-[var(--rule)]">
                <ResponsiveImage
                  asset={{ ...project.cover, alt: "Detail of the Muyassir readiness report on a phone: 63% readiness, 2 items to fix, 2 to review, 6 compliant." }}
                  sizes="(min-width: 1024px) 30vw, 90vw"
                  className="h-full w-full"
                  imgClassName="object-[79%_50%]"
                />
                <MediaBadge kind="screenshot" className="absolute left-3 top-3" />
              </div>
              <figcaption className="t-label mt-3 text-center">Detail — readiness report, sample shop</figcaption>
            </figure>
          </Reveal>
        )}
      </div>
    </ModuleSection>
  );
}
