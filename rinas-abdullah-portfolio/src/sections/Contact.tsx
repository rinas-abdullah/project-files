import { useState, type FormEvent } from "react";
import { ArrowUpRight, Check, ChevronDown, Copy, Mail } from "lucide-react";
import { profile } from "@/data/profile";
import { SheetHeader } from "@/components/SheetHeader";
import { ExternalLink } from "@/components/ExternalLink";
import { Reveal } from "@/animations/Reveal";
import { cn } from "@/lib/cn";

const topics = ["Venture or partnership", "Role or opportunity", "Project collaboration", "Speaking or community", "Something else"];

export function Contact() {
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");
  const [drafted, setDrafted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
    window.setTimeout(() => setCopied("idle"), 2600);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const topic = String(data.get("topic") ?? topics[0]);
    const message = String(data.get("message") ?? "").trim();
    if (message.length < 10) {
      setError("Please write a short message (at least 10 characters).");
      return;
    }
    setError(null);
    const subject = `${topic}${name ? ` — ${name}` : ""}`;
    const body = `${message}\n\n${name ? `— ${name}` : ""}`;
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setDrafted(true);
  };

  const field =
    "w-full border-0 border-b border-[var(--rule-strong)] bg-transparent px-0 py-3 text-paper placeholder:text-steel-dim focus:border-cyan focus:outline-none focus:ring-0 transition-colors";

  return (
    <section id="contact" aria-labelledby="contact-title" className="relative overflow-hidden py-24 md:py-36">
      <div className="shell">
        <SheetHeader sheet="05" label="Contact" note={profile.location} />

        <div className="mt-14 grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal>
              <h2 id="contact-title" className="t-display text-[clamp(3rem,9vw,8.5rem)]">
                Let's build
                <br />
                something
                <br />
                <span className="text-cyan">secure.</span>
              </h2>
            </Reveal>

            <Reveal className="mt-14">
              <dl className="grid border-t border-[var(--rule)] sm:grid-cols-2">
                <div className="border-b border-[var(--rule)] py-6 sm:border-r sm:pr-6">
                  <dt className="t-label">Email</dt>
                  <dd className="mt-3 flex flex-wrap items-center gap-3">
                    <a href={`mailto:${profile.email}`} className="link-underline break-all text-lg text-paper">
                      {profile.email}
                    </a>
                    <button
                      type="button"
                      onClick={copy}
                      className="inline-flex min-h-9 items-center gap-1.5 border border-[var(--rule)] px-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-steel transition-colors hover:text-paper"
                    >
                      {copied === "ok" ? <Check aria-hidden className="size-3.5 text-cyan" /> : <Copy aria-hidden className="size-3.5" />}
                      {copied === "ok" ? "Copied" : "Copy"}
                    </button>
                    <span role="status" className="sr-only">
                      {copied === "ok" ? "Email address copied to clipboard" : copied === "fail" ? "Copy failed — please select the address manually" : ""}
                    </span>
                  </dd>
                  {copied === "fail" && <p className="mt-2 text-xs text-amber">Clipboard unavailable — select the address to copy it.</p>}
                </div>
                <div className="border-b border-[var(--rule)] py-6 sm:pl-6">
                  <dt className="t-label">Location</dt>
                  <dd className="mt-3 text-lg text-paper">{profile.location}</dd>
                </div>
                <div className="border-b border-[var(--rule)] py-6 sm:border-r sm:pr-6">
                  <dt className="t-label">LinkedIn</dt>
                  <dd className="mt-3 text-lg">
                    <ExternalLink href={profile.linkedin} className="text-paper hover:text-cyan">
                      in/rinas-abdullah
                    </ExternalLink>
                  </dd>
                </div>
                <div className="border-b border-[var(--rule)] py-6 sm:pl-6">
                  <dt className="t-label">GitHub</dt>
                  <dd className="mt-3 text-lg">
                    <ExternalLink href={profile.github} className="text-paper hover:text-cyan">
                      rinas-abdullah
                    </ExternalLink>
                  </dd>
                </div>
              </dl>
            </Reveal>
          </div>

          <Reveal className="lg:col-span-5">
            <form onSubmit={onSubmit} noValidate aria-describedby="form-note" className="reg-marks border border-[var(--rule)] bg-graphite/60 p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <p className="t-label text-paper">Draft a message</p>
                <Mail aria-hidden className="size-4 text-steel" />
              </div>
              <p id="form-note" className="mt-3 text-sm leading-relaxed text-steel">
                This form doesn't send anything on its own. It opens your email app with a drafted message addressed to Rinas, which you review and send.
              </p>

              <div className="mt-8 grid gap-6">
                <div>
                  <label htmlFor="c-name" className="t-label">Your name</label>
                  <input id="c-name" name="name" autoComplete="name" className={field} placeholder="Optional" />
                </div>
                <div>
                  <label htmlFor="c-topic" className="t-label">Topic</label>
                  <div className="relative">
                    <select id="c-topic" name="topic" className={cn(field, "cursor-pointer appearance-none pr-8")} defaultValue={topics[0]}>
                      {topics.map((t) => (
                        <option key={t} className="bg-graphite">
                          {t}
                        </option>
                      ))}
                    </select>
                    <ChevronDown aria-hidden className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-steel" />
                  </div>
                </div>
                <div>
                  <label htmlFor="c-msg" className="t-label">Message</label>
                  <textarea
                    id="c-msg"
                    name="message"
                    rows={5}
                    required
                    aria-invalid={!!error}
                    aria-describedby={error ? "c-msg-error" : undefined}
                    className={cn(field, "resize-y")}
                    placeholder="What are you building?"
                    onInput={() => error && setError(null)}
                  />
                  {error && (
                    <p id="c-msg-error" role="alert" className="mt-2 text-sm text-amber">
                      {error}
                    </p>
                  )}
                </div>
              </div>

              <button type="submit" className="btn btn-primary mt-8 w-full justify-between">
                Open in email app <ArrowUpRight aria-hidden className="size-4" />
              </button>
              <p role="status" className="mt-4 min-h-5 text-sm text-steel">
                {drafted && (
                  <>
                    Your email app should now show the draft. Nothing opened? Write to{" "}
                    <a href={`mailto:${profile.email}`} className="text-paper underline underline-offset-4">
                      {profile.email}
                    </a>
                    .
                  </>
                )}
              </p>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
