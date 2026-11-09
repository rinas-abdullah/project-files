import type { ReactNode } from "react";
import { Reveal } from "@/animations/Reveal";
import { cn } from "@/lib/cn";

interface Props {
  id: string;
  label: string;
  title: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Consistent frame for a case study's bespoke module: label rail + heading, then free composition. */
export function ModuleSection({ id, label, title, intro, children, className }: Props) {
  return (
    <section aria-labelledby={id} className={cn("shell mt-24 md:mt-36", className)}>
      <div className="grid gap-6 border-t border-[var(--rule)] pt-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-3">
          <p className="t-label">
            <span className="text-cyan">§</span> {label}
          </p>
        </Reveal>
        <Reveal className="lg:col-span-8">
          <h2 id={id} className="t-heading text-[clamp(1.9rem,3.6vw,3rem)]">
            {title}
          </h2>
          {intro && <p className="t-body mt-5 max-w-2xl">{intro}</p>}
        </Reveal>
      </div>
      <div className="mt-12 md:mt-16">{children}</div>
    </section>
  );
}
