import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { websites } from "@/data/websites";
import { SheetHeader } from "@/components/SheetHeader";
import { ResponsiveImage } from "@/components/ResponsiveImage";
import { ExternalLink } from "@/components/ExternalLink";
import { Reveal } from "@/animations/Reveal";
import { ease } from "@/animations/variants";
import type { Website } from "@/types";
import { cn } from "@/lib/cn";

type View = "desktop" | "detail";

function SiteSpread({ site, index }: { site: Website; index: number }) {
  const [view, setView] = useState<View>(site.leadView ?? "desktop");
  const flip = index % 2 === 1;
  const tabsId = useId();
  const asset = site[view];

  return (
    <article aria-labelledby={`${site.slug}-title`} className="grid gap-10 border-t border-[var(--rule)] pt-10 lg:grid-cols-12 lg:gap-8 lg:pt-14">
      <Reveal className={cn("lg:col-span-4", flip && "lg:order-2 lg:col-start-9")}>
        <p className="t-label">
          <span className="text-cyan">W{index + 1}</span> · {site.sector}
        </p>
        <h3 id={`${site.slug}-title`} className="t-heading mt-5 text-[clamp(2.25rem,4vw,3.5rem)]">
          {site.name}
        </h3>
        {site.liveBranding && <p className="mt-3 font-mono text-[11px] leading-relaxed tracking-[0.06em] text-steel">{site.liveBranding}</p>}
        <p className="t-body mt-6">{site.observed}</p>

        <dl className="mt-8 grid grid-cols-[7.5rem_1fr] gap-y-3 border-t border-[var(--rule)] pt-6 text-sm">
          <dt className="t-label pt-0.5">Contribution</dt>
          <dd className="text-paper/90">{site.contribution}</dd>
          <dt className="t-label pt-0.5">On the site</dt>
          <dd>
            <ul className="grid gap-1 text-paper/80">
              {site.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </dd>
        </dl>

        <ExternalLink
          href={site.url}
          label={`Visit ${site.name} live site (${site.host})`}
          className="btn btn-ghost mt-8"
        >
          Visit {site.host}
        </ExternalLink>
      </Reveal>

      <Reveal className={cn("relative lg:col-span-8", flip && "lg:order-1 lg:col-start-1")}>
        <div className="mb-3 flex items-center justify-between gap-4">
          <div role="group" aria-label={`${site.name} screenshot view`} className="flex border border-[var(--rule)]">
            {((site.leadView === "detail" ? ["detail", "desktop"] : ["desktop", "detail"]) as View[]).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                aria-controls={`${tabsId}-panel`}
                onClick={() => setView(v)}
                className={cn(
                  "min-h-10 px-4 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors",
                  view === v ? "bg-paper text-obsidian" : "text-steel hover:text-paper",
                )}
              >
                {v === "desktop" ? "Home" : site.leadView === "detail" ? "Archive" : "Inside"}
              </button>
            ))}
          </div>
          <span className="t-label hidden sm:inline">Live capture · Nov 2026</span>
        </div>

        <div className="relative pb-16 pr-10 sm:pb-20 sm:pr-24">
          {/* Browser frame */}
          <div className="overflow-hidden border border-[var(--rule-strong)] bg-graphite shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-3 border-b border-[var(--rule)] px-3 py-2">
              <span aria-hidden className="flex gap-1.5">
                <span className="size-2 rounded-full bg-slate-hi" />
                <span className="size-2 rounded-full bg-slate-hi" />
                <span className="size-2 rounded-full bg-slate-hi" />
              </span>
              <span className="mx-auto truncate font-mono text-[10px] tracking-[0.08em] text-steel">{site.host}</span>
            </div>
            <div id={`${tabsId}-panel`} aria-live="polite" className="relative aspect-[16/10]">
              <AnimatePresence initial={false}>
                <motion.div
                  key={view}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease }}
                  className="absolute inset-0"
                >
                  <ResponsiveImage asset={asset} sizes="(min-width: 1024px) 60vw, 100vw" className="h-full w-full" imgClassName="object-top" />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Phone frame */}
          <div className="absolute bottom-0 right-0 w-[28%] max-w-[13rem] rounded-[1.4rem] border border-[var(--rule-strong)] bg-obsidian p-1.5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.95)]">
            <ResponsiveImage asset={site.mobile} sizes="(min-width: 1024px) 13rem, 28vw" className="aspect-[390/664] rounded-[1rem]" imgClassName="object-top" />
          </div>
        </div>
      </Reveal>
    </article>
  );
}

export function WebWork() {
  return (
    <section id="websites" aria-labelledby="websites-title" className="shell py-24 md:py-36">
      <SheetHeader sheet="02" label="Websites delivered" note="Live sites · captured Nov 2026" />
      <div className="mt-14 grid gap-6 lg:grid-cols-12">
        <Reveal className="lg:col-span-8">
          <h2 id="websites-title" className="t-display text-[clamp(2.75rem,7vw,6.25rem)]">
            Shipped for
            <br />
            <span className="text-steel">real businesses.</span>
          </h2>
        </Reveal>
        <Reveal className="self-end lg:col-span-4">
          <p className="t-body">
            Three live websites for three very different companies — a jewellery brand, an engineering consultancy and a performance-car centre. Captures are taken from the live sites.
          </p>
        </Reveal>
      </div>
      <div className="mt-20 grid gap-24">
        {websites.map((s, i) => (
          <SiteSpread key={s.slug} site={s} index={i} />
        ))}
      </div>
    </section>
  );
}
