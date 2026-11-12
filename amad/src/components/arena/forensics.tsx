"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { ForensicsData } from "@/server/services/views";
import { Badge, Button, Card, CardHeader, cx } from "@/components/ui";

const OUTCOME_AR: Record<string, { label: string; tone: "ok" | "danger" | "warn" }> = {
  CONTAINED: { label: "تم الاحتواء", tone: "ok" },
  BREACHED: { label: "حقق الخصم هدفه", tone: "danger" },
  TIMEOUT: { label: "انتهى الوقت", tone: "warn" },
};

export function Forensics({ data, sessionId }: { data: ForensicsData; sessionId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [q, setQ] = useState("");
  const [assetFilter, setAssetFilter] = useState("all");
  const [cited, setCited] = useState<string[]>([]);
  const [entryAsset, setEntryAsset] = useState("");
  const [entryTechnique, setEntryTechnique] = useState("");
  const [affected, setAffected] = useState<string[]>([]);
  const [identities, setIdentities] = useState<string[]>([]);
  const [sequence, setSequence] = useState<string[]>([]);
  const [seqPick, setSeqPick] = useState("");
  const [summary, setSummary] = useState("");
  const outcome = OUTCOME_AR[data.outcome ?? "TIMEOUT"];

  const evidence = useMemo(
    () =>
      data.evidence.filter(
        (e) => (assetFilter === "all" || e.asset === assetFilter) && (!q.trim() || e.content.toLowerCase().includes(q.trim().toLowerCase()) || e.source.includes(q.trim().toLowerCase())),
      ),
    [data.evidence, q, assetFilter],
  );

  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= sequence.length) return;
    const next = [...sequence];
    [next[i], next[j]] = [next[j], next[i]];
    setSequence(next);
  };

  async function submit() {
    setError(null);
    setFieldErrors({});
    if (!entryAsset || !entryTechnique) {
      setError("حدّد الأصل وتقنية الدخول الأولى.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/investigation`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entryAsset, entryTechnique, affectedAssets: affected, compromisedIdentities: identities, sequence, evidenceKeys: cited, summary }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; fields?: Record<string, string[]> };
      if (!res.ok) {
        setFieldErrors(body.fields ?? {});
        setError(body.error === "already-submitted" ? "تم تسليم هذا التحقيق مسبقًا." : "تعذر تسليم التحقيق. راجع الحقول.");
        if (body.error === "already-submitted") startTransition(() => router.refresh());
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setError("تعذر الاتصال بالخادم.");
    } finally {
      setBusy(false);
    }
  }

  const techName = (id: string) => data.techniques.find((t) => t.id === id)?.name ?? id;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-surface px-5 py-4">
        <div>
          <p className="text-xs text-subtle">المرحلة 3 — التحقيق الجنائي الرقمي</p>
          <h1 className="mt-1 text-xl font-semibold">{data.scenario.titleAr}</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Badge tone={outcome.tone}>{outcome.label}</Badge>
          <span className="text-subtle">انتهت الاستجابة عند <span className="ltr font-mono">{data.clock}</span></span>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="مستكشف الأدلة" subtitle={`${data.evidence.length} دليل — ما كشفته أثناء الاستجابة، وما حفظته في النسخ الجنائية`} />
          <div className="flex flex-wrap gap-2 border-b border-line px-5 py-3">
            <label htmlFor="ev-q" className="sr-only">بحث في الأدلة</label>
            <input id="ev-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث: IP، حساب، عملية…" className="h-9 min-w-48 flex-1 rounded-md border border-line-strong bg-surface-2 px-3 text-sm placeholder:text-subtle focus:border-lime focus:outline-none" />
            <label htmlFor="ev-asset" className="sr-only">تصفية حسب الأصل</label>
            <select id="ev-asset" value={assetFilter} onChange={(e) => setAssetFilter(e.target.value)} className="h-9 rounded-md border border-line-strong bg-surface-2 px-2 text-sm">
              <option value="all">كل الأصول</option>
              {data.scenario.assets.map((a) => <option key={a.id} value={a.id}>{a.id}</option>)}
            </select>
          </div>
          {data.evidence.length === 0 ? (
            <p className="px-5 py-8 text-sm text-subtle">لم تجمع أي أدلة: لم تُشغّل أوامر فحص ولم تأخذ نسخًا جنائية. سيؤثر ذلك على درجة الأدلة في التقييم.</p>
          ) : (
            <ul className="max-h-[560px] divide-y divide-line overflow-y-auto">
              {evidence.map((e) => {
                const on = cited.includes(e.key);
                return (
                  <li key={e.key} className={cx("px-5 py-3", on && "bg-lime/5")}>
                    <label className="flex cursor-pointer gap-3">
                      <input type="checkbox" checked={on} onChange={() => toggle(cited, setCited, e.key)} className="mt-1 accent-[var(--amad-lime)]" aria-label="استشهد بهذا الدليل" />
                      <span className="min-w-0 flex-1">
                        <span className="mb-1 flex flex-wrap items-center gap-1.5">
                          <Badge>{e.asset}</Badge>
                          <Badge tone="info">{e.source}</Badge>
                          <Badge tone={e.via === "LIVE" ? "neutral" : "lime"}>{e.via === "LIVE" ? "مكتشف أثناء الاستجابة" : "من النسخة الجنائية"}</Badge>
                        </span>
                        <span className="ltr block break-words text-start font-mono text-xs text-silver">{e.content}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
              {evidence.length === 0 && <li className="px-5 py-6 text-sm text-subtle">لا نتائج مطابقة.</li>}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="محرر النتائج" subtitle={`${cited.length} دليل مستشهد به`} />
          <div className="flex flex-col gap-5 p-5 text-sm">
            <fieldset className="grid gap-3 sm:grid-cols-2">
              <legend className="mb-2 text-xs text-subtle">نقطة الدخول الأولى</legend>
              <label className="flex flex-col gap-1.5">
                <span className="text-silver">الأصل</span>
                <select value={entryAsset} onChange={(e) => setEntryAsset(e.target.value)} className="h-10 rounded-md border border-line-strong bg-surface-2 px-2">
                  <option value="">— اختر —</option>
                  {data.scenario.assets.map((a) => <option key={a.id} value={a.id}>{a.id} · {a.name}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-silver">التقنية (ATT&CK)</span>
                <select value={entryTechnique} onChange={(e) => setEntryTechnique(e.target.value)} className="h-10 rounded-md border border-line-strong bg-surface-2 px-2">
                  <option value="">— اختر —</option>
                  {data.techniques.map((t) => <option key={t.id} value={t.id}>{t.id} · {t.name}</option>)}
                </select>
              </label>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-xs text-subtle">الأصول المخترقة</legend>
              <div className="flex flex-wrap gap-2">
                {data.scenario.assets.map((a) => (
                  <label key={a.id} className="flex cursor-pointer items-center gap-2 rounded border border-line-strong px-2 py-1.5 has-[:checked]:border-lime">
                    <input type="checkbox" checked={affected.includes(a.id)} onChange={() => toggle(affected, setAffected, a.id)} className="accent-[var(--amad-lime)]" />
                    <span className="ltr font-mono text-xs">{a.id}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-xs text-subtle">الحسابات المخترقة</legend>
              <div className="flex flex-wrap gap-2">
                {data.scenario.identities.map((i) => (
                  <label key={i.id} className="flex cursor-pointer items-center gap-2 rounded border border-line-strong px-2 py-1.5 has-[:checked]:border-lime">
                    <input type="checkbox" checked={identities.includes(i.id)} onChange={() => toggle(identities, setIdentities, i.id)} className="accent-[var(--amad-lime)]" />
                    <span className="ltr font-mono text-xs">{i.id}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-xs text-subtle">تسلسل الهجوم (إعادة بناء الحادثة)</legend>
              <div className="flex gap-2">
                <label htmlFor="seq-pick" className="sr-only">تقنية</label>
                <select id="seq-pick" value={seqPick} onChange={(e) => setSeqPick(e.target.value)} className="h-9 flex-1 rounded-md border border-line-strong bg-surface-2 px-2">
                  <option value="">— أضف تقنية —</option>
                  {data.techniques.filter((t) => !sequence.includes(t.id)).map((t) => <option key={t.id} value={t.id}>{t.id} · {t.name}</option>)}
                </select>
                <Button type="button" variant="secondary" className="h-9" disabled={!seqPick} onClick={() => { setSequence([...sequence, seqPick]); setSeqPick(""); }}>إضافة</Button>
              </div>
              {sequence.length > 0 && (
                <ol className="mt-2 flex flex-col gap-1">
                  {sequence.map((t, i) => (
                    <li key={t} className="flex items-center justify-between gap-2 rounded border border-line bg-surface-2 px-2 py-1">
                      <span className="text-xs"><span className="tabular-nums text-subtle">{i + 1}.</span> <span className="ltr font-mono">{t}</span> <span className="text-silver">{techName(t)}</span></span>
                      <span className="flex gap-1">
                        <button type="button" aria-label="تحريك لأعلى" onClick={() => move(i, -1)} className="rounded px-1.5 text-silver hover:bg-surface-3">↑</button>
                        <button type="button" aria-label="تحريك لأسفل" onClick={() => move(i, 1)} className="rounded px-1.5 text-silver hover:bg-surface-3">↓</button>
                        <button type="button" aria-label="حذف" onClick={() => setSequence(sequence.filter((x) => x !== t))} className="rounded px-1.5 text-danger hover:bg-danger/10">×</button>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </fieldset>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-subtle">ملخص التحقيق</span>
              <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} className="rounded-md border border-line-strong bg-surface-2 p-3 focus:border-lime focus:outline-none" placeholder="كيف دخل الخصم، وماذا فعل، وكيف احتُويت الحادثة…" aria-invalid={!!fieldErrors.summary} />
              {fieldErrors.summary && <span className="text-xs text-danger">{fieldErrors.summary.join(" · ")}</span>}
            </label>

            {error && <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-danger">{error}</p>}
            {data.canAct ? (
              <Button type="button" onClick={submit} disabled={busy || pending}>{busy || pending ? "جارٍ التقييم…" : "تسليم التحقيق واحتساب الجاهزية"}</Button>
            ) : (
              <p className="text-xs text-subtle">أنت تشاهد جلسة متدرب آخر للقراءة فقط.</p>
            )}
            <p className="text-xs text-subtle">يُقيَّم التحقيق على الخادم مقابل ما حدث فعلًا في هذه الجلسة. لا يمكن تعديله بعد التسليم.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
