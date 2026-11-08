import { Suspense, lazy, useEffect, useState } from "react";
import { Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDownRight, ArrowRight } from "lucide-react";
import { profile } from "@/data/profile";
import { LatticeFallback } from "@/features/hero/LatticeFallback";
import { useWebGL } from "@/hooks/useWebGL";
import { ease } from "@/animations/variants";
import { cn } from "@/lib/cn";

const LatticeCanvas = lazy(() => import("@/features/hero/LatticeCanvas"));

const CYCLE_MS = 2800;

export function Hero() {
  const reduced = !!useReducedMotion();
  const webgl = useWebGL();
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [mountCanvas, setMountCanvas] = useState(false);

  // Cycle the highlighted role; pause while the visitor is pointing at the list.
  useEffect(() => {
    if (reduced || hovering) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % profile.titles.length), CYCLE_MS);
    return () => window.clearInterval(id);
  }, [reduced, hovering]);

  // Defer the WebGL chunk until the browser is idle after first paint.
  useEffect(() => {
    if (!webgl) return;
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300));
    const id = ric(() => setMountCanvas(true));
    return () => (window.cancelIdleCallback ?? window.clearTimeout)(id as number);
  }, [webgl]);

  const line = (delay: number) => ({
    initial: { y: "105%" },
    animate: { y: "0%" },
    transition: { duration: 1.1, delay, ease },
  });

  return (
    <section aria-labelledby="hero-name" className="relative overflow-hidden pt-16">
      {/* Drafting datum lines */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="shell relative h-full">
          <div className="absolute inset-y-0 left-[var(--gutter)] w-px bg-[var(--rule)]" />
          <div className="absolute inset-y-0 right-[var(--gutter)] hidden w-px bg-[var(--rule)] md:block" />
        </div>
      </div>

      <div className="shell relative grid min-h-[calc(100svh-4rem)] grid-rows-[auto_1fr_auto] gap-y-8 pb-10 pt-6 lg:gap-y-0">
        {/* Title block */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="grid grid-cols-2 gap-4 border-b border-[var(--rule)] pb-3 pl-4 md:grid-cols-3"
        >
          <span className="t-label">Portfolio · Index</span>
          <span className="t-label hidden text-center md:block">{profile.location}</span>
          <span className="t-label text-right">{profile.coordinates}</span>
        </motion.div>

        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-6">
          {/* Name + roles */}
          <div className="relative z-10 pl-4 lg:col-span-7">
            <h1 id="hero-name" className="t-display text-[clamp(3.6rem,12.5vw,10.75rem)]">
              {profile.nameParts.map((part, i) => (
                <span key={part} className="block overflow-hidden pb-[0.06em]">
                  <motion.span
                    {...line(0.15 + i * 0.12)}
                    className={cn("block", i === 1 ? "text-steel" : "text-paper")}
                  >
                    {part}
                  </motion.span>
                </span>
              ))}
            </h1>

            <ol
              aria-label="Roles"
              className="mt-8 max-w-xl border-t border-[var(--rule)]"
              onPointerEnter={() => setHovering(true)}
              onPointerLeave={() => setHovering(false)}
            >
              {profile.titles.map((title, i) => {
                const on = i === active;
                return (
                  <motion.li
                    key={title}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.55 + i * 0.07, ease }}
                    className="border-b border-[var(--rule)]"
                  >
                    <button
                      type="button"
                      onPointerEnter={() => setActive(i)}
                      onFocus={() => setActive(i)}
                      onClick={() => setActive(i)}
                      aria-pressed={on}
                      className="group flex w-full items-baseline gap-4 py-2.5 text-left"
                    >
                      <span className={cn("font-mono text-[11px] tracking-[0.14em] transition-colors", on ? "text-cyan" : "text-steel-dim")}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={cn(
                          "font-display text-lg tracking-tight transition-colors duration-500 sm:text-xl",
                          on ? "text-paper" : "text-steel group-hover:text-paper/80",
                        )}
                      >
                        {title}
                      </span>
                      <span
                        aria-hidden
                        className={cn("ml-auto h-px self-center bg-cyan transition-all duration-700", on ? "w-10 opacity-100" : "w-0 opacity-0")}
                      />
                    </button>
                  </motion.li>
                );
              })}
            </ol>
          </div>

          {/* Figure */}
          <motion.figure
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.4 }}
            className="relative order-first -mx-[var(--gutter)] h-[min(62vw,22rem)] sm:h-[26rem] lg:order-none lg:col-span-5 lg:mx-0 lg:h-[min(72vh,40rem)]"
          >
            <div className={cn("absolute inset-0 transition-opacity duration-700", canvasReady ? "opacity-0" : "opacity-100")}>
              <LatticeFallback active={active} />
            </div>
            {mountCanvas && (
              <Suspense fallback={null}>
                <div className={cn("absolute inset-0 transition-opacity duration-1000", canvasReady ? "opacity-100" : "opacity-0")}>
                  <LatticeCanvas active={active} reducedMotion={reduced} onReady={() => setCanvasReady(true)} />
                </div>
              </Suspense>
            )}
            <figcaption className="absolute bottom-0 left-[var(--gutter)] right-[var(--gutter)] flex justify-between gap-4 lg:left-0 lg:right-0">
              <span className="t-label">Fig. 00 — Five disciplines, one structure</span>
              <span className="t-label hidden text-cyan sm:inline">Level {String(active + 1).padStart(2, "0")}</span>
            </figcaption>
          </motion.figure>
        </div>

        {/* Statement + actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.95, ease }}
          className="grid gap-8 border-t border-[var(--rule)] pl-4 pt-6 lg:grid-cols-12 lg:items-end"
        >
          <p className="max-w-2xl font-display text-[clamp(1.25rem,2.1vw,1.75rem)] leading-snug tracking-tight text-paper/90 lg:col-span-7">
            {profile.tagline}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
            <Link to={{ hash: "#work" }} className="btn btn-primary justify-between sm:justify-start">
              Explore Selected Work <ArrowDownRight aria-hidden className="size-4" />
            </Link>
            <Link to={{ hash: "#contact" }} className="btn btn-ghost justify-between sm:justify-start">
              Connect With Me <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
