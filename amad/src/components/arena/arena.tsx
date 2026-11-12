"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition, type KeyboardEvent } from "react";
import type { ArenaData } from "@/server/services/views";
import { Badge, Button, Card, CardHeader, cx, Meter } from "@/components/ui";

const ERRORS: Record<string, string> = {
  "unknown-command": "أمر غير معروف. اكتب help لعرض الأوامر المتاحة.",
  "wrong-arguments": "عدد المعاملات غير صحيح لهذا الأمر. اكتب help.",
  "invalid-characters": "يحتوي الأمر على رموز غير مسموحة. وحدة التحكم تقبل أوامر الدفاع المعتمدة فقط.",
  empty: "اكتب أمرًا.",
  "too-long": "الأمر طويل جدًا.",
  "simulation-ended": "انتهت مرحلة الاستجابة الحية.",
  "concurrent-update": "تم تحديث الجلسة من طلب آخر. أعد المحاولة.",
  unauthenticated: "انتهت الجلسة. سجّل الدخول مجددًا.",
};

export function Arena({ data, sessionId }: { data: ArenaData; sessionId: string }) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [histIdx, setHistIdx] = useState<number | null>(null);
  const consoleEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const history = useMemo(() => data.console.map((c) => c.command), [data.console]);
  const s = data.scenario;
  const remaining = Math.max(0, s.timeBudget - data.minute);

  useEffect(() => {
    consoleEnd.current?.scrollIntoView({ block: "nearest" });
  }, [data.console.length]);

  async function run(command: string) {
    if (!command.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/commands`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ command }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(ERRORS[body.error ?? ""] ?? "تعذر تنفيذ الأمر.");
        if (body.error === "simulation-ended") startTransition(() => router.refresh());
        return;
      }
      setInput("");
      setHistIdx(null);
      startTransition(() => router.refresh());
    } catch {
      setError("تعذر الاتصال بالخادم.");
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp" && history.length) {
      e.preventDefault();
      const i = histIdx === null ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(i);
      setInput(history[i]);
    } else if (e.key === "ArrowDown" && histIdx !== null) {
      e.preventDefault();
      const i = histIdx + 1;
      if (i >= history.length) {
        setHistIdx(null);
        setInput("");
      } else {
        setHistIdx(i);
        setInput(history[i]);
      }
    }
  }

  const insert = (token: string) => {
    setInput((v) => (v.trim() ? `${v.trim()} ${token}` : token));
    inputRef.current?.focus();
  };

  const loading = busy || pending;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-surface px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-danger" /></span>
            <span className="text-xs text-danger">حادثة نشطة — استجابة حية</span>
          </div>
          <h1 className="mt-1 text-xl font-semibold">{s.titleAr}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="text-center">
            <p className="text-xs text-subtle">ساعة المحاكاة</p>
            <p className="ltr font-mono text-2xl tabular-nums text-fg">{data.clock}</p>
          </div>
          <div className="w-44">
            <div className="mb-1 flex justify-between text-xs"><span className="text-subtle">الوقت المتبقي</span><span className="tabular-nums">{remaining} د</span></div>
            <Meter value={(remaining / s.timeBudget) * 100} tone={remaining < s.timeBudget * 0.25 ? "danger" : remaining < s.timeBudget * 0.5 ? "warn" : "lime"} label="الوقت المتبقي" />
          </div>
          <div className="text-center">
            <p className="text-xs text-subtle">التلميحات</p>
            <p className="tabular-nums">{data.hintsUsed}/{s.hintsAvailable}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_340px]">
        {/* Scenario context */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="الإيجاز" subtitle={s.organizationAr} />
            <div className="flex flex-col gap-3 p-5 text-sm">
              <p className="text-silver">{s.briefingAr}</p>
              <div>
                <p className="mb-1.5 text-xs text-subtle">الأهداف</p>
                <ul className="flex flex-col gap-1">
                  {s.objectivesAr.map((o) => <li key={o} className="flex gap-2 text-silver"><span className="text-lime">◆</span>{o}</li>)}
                </ul>
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader title="الهويات" subtitle="انقر لإدراج المعرّف في الأمر" />
            <ul className="divide-y divide-line">
              {s.identities.map((i) => (
                <li key={i.id}>
                  <button type="button" onClick={() => insert(i.id)} className="flex w-full items-center justify-between gap-2 px-5 py-2.5 text-start hover:bg-surface-2">
                    <span>
                      <span className="ltr block font-mono text-xs text-fg">{i.id}</span>
                      <span className="text-xs text-subtle">{i.displayName}</span>
                    </span>
                    <span className="flex gap-1">
                      {i.privileged && <Badge tone="info">مميز</Badge>}
                      {data.identities[i.id]?.disabled && <Badge tone="danger">معطّل</Badge>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Console */}
        <Card className="flex min-h-[520px] flex-col">
          <CardHeader title="وحدة التحكم الدفاعية" subtitle="أوامر دفاعية معتمدة فقط — لا تُنفَّذ أي أوامر على أنظمة حقيقية" action={<Badge tone="lime">آمنة</Badge>} />
          <div className="ltr max-h-[460px] min-h-[300px] flex-1 overflow-y-auto bg-bg/60 px-4 py-3 text-start font-mono text-[12.5px] leading-6" aria-live="polite">
            {data.console.length === 0 && <p className="text-subtle">AMAD defensive console. Type <span className="text-lime">help</span> to list commands.</p>}
            {data.console.map((c) => (
              <div key={c.seq} className="mb-2">
                <p><span className="text-subtle">[T+{c.minute}m]</span> <span className="text-lime">amad&gt;</span> <span className={c.valid ? "text-fg" : "text-danger"}>{c.command}</span></p>
                {c.output.map((line, i) => <p key={i} dir="auto" className="whitespace-pre-wrap text-silver">{line}</p>)}
              </div>
            ))}
            <div ref={consoleEnd} />
          </div>
          <div className="border-t border-line p-3">
            {error && <p role="alert" className="mb-2 text-xs text-danger">{error}</p>}
            {data.canAct ? (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(input);
                }}
              >
                <label htmlFor="cmd" className="sr-only">أمر دفاعي</label>
                <input
                  id="cmd"
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKey}
                  disabled={loading}
                  autoComplete="off"
                  spellCheck={false}
                  dir="ltr"
                  placeholder="e.g. logs web-01"
                  className="h-10 flex-1 rounded-md border border-line-strong bg-surface-2 px-3 font-mono text-sm text-fg placeholder:text-subtle focus:border-lime focus:outline-none"
                  autoFocus
                />
                <Button type="submit" disabled={loading || !input.trim()}>{loading ? "…" : "تنفيذ"}</Button>
              </form>
            ) : (
              <p className="text-xs text-subtle">أنت تشاهد جلسة متدرب آخر للقراءة فقط.</p>
            )}
            {data.canAct && (
              <div className="ltr mt-2 flex flex-wrap gap-1.5">
                {["help", "logs", "ps", "netstat", "isolate", "disable", "block", "kill", "image", "wait", "hint", "contain"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    disabled={loading}
                    onClick={() => (["help", "wait", "hint", "contain"].includes(c) ? run(c) : insert(c))}
                    className={cx("rounded border px-2 py-1 font-mono text-[11px]", c === "contain" ? "border-lime/40 text-lime hover:bg-lime/10" : "border-line-strong text-silver hover:bg-surface-2")}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Twin + adversary monitor + timeline */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="التوأم السيبراني" subtitle="انقر أصلًا لإدراجه في الأمر" />
            <TwinMap data={data} onPick={insert} />
          </Card>
          <Card>
            <CardHeader title="مراقب الخصم" subtitle="ما تراه أنت فقط — بلا معلومات مخفية" />
            <div className="flex flex-col gap-3 p-5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-subtle">المرحلة المقدّرة</span>
                {data.threatStage ? <Badge tone="warn">{data.threatStage.tactic}</Badge> : <span className="text-xs text-subtle">لم تُكتشف أدلة معادية بعد</span>}
              </div>
              {data.threatStage && <p className="ltr text-start font-mono text-xs text-silver">{data.threatStage.technique} · {data.threatStage.name}</p>}
              <div className="flex items-center justify-between">
                <span className="text-subtle">مرات تعطيل الخصم</span>
                <span className="tabular-nums">{data.adversaryDisruptions}</span>
              </div>
              <div>
                <p className="mb-1.5 text-xs text-subtle">تنبيهات SIEM</p>
                {data.alerts.length ? (
                  <ul className="flex flex-col gap-1.5">
                    {data.alerts.map((a) => (
                      <li key={a.seq} className="flex gap-2 text-xs">
                        <span className="ltr font-mono text-subtle">{a.clock}</span>
                        <span className={a.severity === "high" ? "text-danger" : "text-warn"}>{a.message}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-subtle">لا تنبيهات حتى الآن.</p>
                )}
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader title="الخط الزمني للحادثة" />
            <ol className="max-h-72 overflow-y-auto px-5 py-3 text-xs">
              {[...data.timeline].reverse().map((e) => (
                <li key={e.seq} className="flex gap-3 border-b border-line/60 py-1.5 last:border-0">
                  <span className="ltr shrink-0 font-mono text-subtle">{e.clock}</span>
                  <span className={cx(e.actor === "defender" ? "text-fg" : e.kind === "siem.alert" ? "text-warn" : e.kind === "adversary.disrupted" ? "text-lime" : "text-silver")}>
                    {e.actor === "defender" ? <span className="ltr font-mono">&gt; {e.message}</span> : e.message}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TwinMap({ data, onPick }: { data: ArenaData; onPick: (id: string) => void }) {
  const assets = data.scenario.assets;
  const W = 320;
  const H = 240;
  const pos = Object.fromEntries(
    assets.map((a, i) => {
      const ang = (Math.PI * 2 * i) / assets.length - Math.PI / 2;
      return [a.id, { x: W / 2 + Math.cos(ang) * 105, y: H / 2 + Math.sin(ang) * 82 }];
    }),
  );
  const edges = new Set<string>();
  for (const a of assets) for (const l of a.links) if (pos[l]) edges.add([a.id, l].sort().join("|"));
  return (
    <div className="p-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="ltr h-auto w-full" role="group" aria-label="خريطة الأصول">
        {[...edges].map((e) => {
          const [a, b] = e.split("|");
          const iso = data.assets[a]?.isolated || data.assets[b]?.isolated;
          return <line key={e} x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y} stroke={iso ? "var(--amad-border)" : "var(--amad-border-strong)"} strokeDasharray={iso ? "3 4" : undefined} />;
        })}
        {assets.map((a) => {
          const st = data.assets[a.id];
          const p = pos[a.id];
          const ring = st.isolated ? "var(--amad-subtle)" : st.alerts > 0 ? "var(--amad-warn)" : "var(--amad-border-strong)";
          return (
            <g key={a.id} role="button" tabIndex={0} aria-label={`${a.name} ${a.id}${st.isolated ? " معزول" : ""}`} onClick={() => onPick(a.id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick(a.id)} className="cursor-pointer focus:outline-none">
              <circle cx={p.x} cy={p.y} r={17} fill="var(--amad-surface-2)" stroke={ring} strokeWidth={st.alerts > 0 && !st.isolated ? 2.5 : 1.5} strokeDasharray={st.isolated ? "3 3" : undefined} />
              <text x={p.x} y={p.y + 3.5} textAnchor="middle" fontSize="9" fill="var(--amad-silver)">{a.criticality}</text>
              {st.imaged && <circle cx={p.x + 13} cy={p.y - 13} r={4} fill="var(--amad-lime)"><title>نسخة جنائية محفوظة</title></circle>}
              {st.evidence > 0 && <circle cx={p.x - 13} cy={p.y - 13} r={4} fill="var(--amad-info)"><title>{`${st.evidence} دليل مكتشف`}</title></circle>}
              <text x={p.x} y={p.y + 30} textAnchor="middle" fontSize="9.5" fontFamily="var(--font-mono)" fill={st.isolated ? "var(--amad-subtle)" : "var(--amad-text)"}>{a.id}</text>
              <title>{`${a.name} · ${a.ip} · أهمية ${a.criticality}/5`}</title>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 px-2 text-[11px] text-subtle">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full border-2 border-warn" />تنبيه</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full border border-dashed border-subtle" />معزول</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-lime" />نسخة جنائية</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-info" />أدلة مكتشفة</span>
        <span>الرقم = أهمية الأصل</span>
      </div>
      {data.blockedIps.length > 0 && <p className="ltr mt-2 px-2 text-start font-mono text-[11px] text-silver">blocked: {data.blockedIps.join(", ")}</p>}
    </div>
  );
}
