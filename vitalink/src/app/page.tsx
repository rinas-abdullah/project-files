import Link from "next/link";
import { ArrowRight, Ambulance, Building2, Fingerprint, BrainCircuit, MapPinned, Gauge, ShieldAlert, Activity } from "lucide-react";
import { getDict } from "@/lib/i18n";
import { Logo } from "@/components/app/logo";
import { LangToggle } from "@/components/public/lang-toggle";
import { getCurrentUser } from "@/lib/session";
import { homeFor } from "@/lib/rbac";

const FEATURE_ICONS = [Ambulance, Building2, Fingerprint, BrainCircuit, MapPinned, Gauge];

export default async function Landing() {
  const { t } = await getDict();
  const user = await getCurrentUser();
  const cta = user ? homeFor(user.role) : "/login";
  return (
    <div className="min-h-screen bg-white">
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Logo onDark />
          <div className="flex items-center gap-2">
            <LangToggle className="text-white/80 hover:bg-white/10" />
            <Link href={cta} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-navy-900 hover:bg-white/90" data-testid="landing-signin">
              {t.landing.signIn}
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-navy-950 pb-24 pt-36 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
        <div className="pointer-events-none absolute -top-40 end-[-10%] size-[620px] rounded-full bg-red-600/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
              <Activity className="size-3.5 text-red-400" /> {t.app.tagline}
            </div>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">{t.landing.hero}</h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">{t.landing.heroSub}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={cta} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/30 hover:bg-red-700">
                {t.landing.signIn} <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
              <a href="#journey" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white/90 hover:bg-white/5">
                {t.landing.learnMore}
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur" dir="ltr">
            <div className="mb-3 flex items-center justify-between text-xs text-white/60">
              <span>JED-A03 → University Medical Center</span>
              <span className="rounded bg-red-600 px-2 py-0.5 font-semibold text-white">P1</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                ["HR", "124", "text-red-400"],
                ["BP", "98/60", "text-amber-300"],
                ["SpO2", "93%", "text-amber-300"],
                ["ETA", "7 min", "text-teal-300"],
              ].map(([k, v, c]) => (
                <div key={k} className="rounded-xl bg-white/5 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-white/50">{k}</div>
                  <div className={`mt-1 text-lg font-semibold tabular ${c}`}>{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 text-xs">
              {["Pre-alert delivered · 14:02", "Acknowledged by ED Nurse · 14:03", "Trauma team activated · CT ready", "Geofence entered — arriving"].map((s, i) => (
                <div key={s} className="flex items-center gap-2 text-white/75">
                  <span className={`size-2 rounded-full ${i === 3 ? "bg-red-500" : "bg-teal-400"}`} /> {s}
                </div>
              ))}
            </div>
            <div className="mt-4 text-[10px] text-white/40">Illustrative preview</div>
          </div>
        </div>
      </section>

      <section id="journey" className="border-b bg-white py-16">
        <div className="mx-auto max-w-7xl px-5">
          <h2 className="text-2xl font-semibold tracking-tight text-navy-900">{t.landing.journeyTitle}</h2>
          <ol className="mt-8 flex flex-wrap items-center gap-2">
            {t.landing.journey.map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span className="rounded-lg border bg-background px-3 py-2 text-sm font-medium text-navy-900">
                  <span className="me-1.5 text-xs text-muted-foreground tabular">{String(i + 1).padStart(2, "0")}</span>
                  {s}
                </span>
                {i < t.landing.journey.length - 1 ? <ArrowRight className="size-4 text-muted-foreground rtl:rotate-180" /> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-navy-900">{t.landing.problemTitle}</h2>
            <ul className="mt-6 space-y-3">
              {t.landing.problems.map((p) => (
                <li key={p} className="flex gap-3 text-sm text-foreground">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0 text-critical" /> {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-navy-900">{t.landing.featuresTitle}</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {t.landing.features.map(([title, body], i) => {
                const Icon = FEATURE_ICONS[i];
                return (
                  <div key={title} className="rounded-xl border bg-white p-4">
                    <Icon className="size-5 text-navy-800" />
                    <div className="mt-3 text-sm font-semibold">{title}</div>
                    <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-navy-950 py-10 text-white/70">
        <div className="mx-auto max-w-7xl px-5">
          <div className="text-sm font-semibold text-white">{t.disclaimer.title}</div>
          <ul className="mt-3 space-y-1.5 text-xs leading-relaxed">
            {t.disclaimer.body.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <div className="mt-6 text-[11px] text-white/40">© VitaLink · {t.app.demoBuild}</div>
        </div>
      </footer>
    </div>
  );
}
