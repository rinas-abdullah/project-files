import { certifications, community } from "@/data/experience";
import { SheetHeader } from "@/components/SheetHeader";
import { Reveal } from "@/animations/Reveal";

export function Leadership() {
  return (
    <section aria-labelledby="leadership-title" className="bg-graphite/40 py-24 md:py-36">
      <div className="shell">
        <SheetHeader sheet="04.1" label="Leadership, community & certification" />

        <div className="mt-14 grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <h2 id="leadership-title" className="t-heading text-[clamp(2rem,4vw,3.25rem)]">
                Building communities,
                <span className="text-steel"> not only products.</span>
              </h2>
            </Reveal>
            <ol className="mt-12">
              {community.map((c, i) => (
                <Reveal as="li" key={c.org} className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-t border-[var(--rule)] py-8 last:border-b">
                  <span className="font-mono text-xs tracking-[0.14em] text-steel-dim">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="t-heading text-2xl">{c.org}</h3>
                    <p className="t-label mt-2 text-cyan">{c.role}</p>
                    <p className="mt-4 max-w-lg text-[0.95rem] leading-relaxed text-paper/75">{c.body}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>

          <Reveal className="lg:col-span-4 lg:col-start-9">
            <h3 className="t-label">Certification register</h3>
            <ol className="mt-6 border-t border-[var(--rule-strong)]">
              {certifications.map((c, i) => (
                <li key={c.name} className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-b border-[var(--rule)] py-5">
                  <span className="pt-0.5 font-mono text-[11px] tracking-[0.14em] text-steel-dim">C{i + 1}</span>
                  <div>
                    <p className="text-[0.98rem] text-paper">{c.name}</p>
                    {c.issuer && <p className="mt-1 text-sm text-steel">{c.issuer}</p>}
                  </div>
                </li>
              ))}
            </ol>
            <p className="t-label mt-4 normal-case tracking-[0.04em]">Listed as recorded on the CV.</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
