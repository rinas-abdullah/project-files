import { startSessionAction } from "@/app/actions/app";
import { Badge, Button, Card, CardHeader, DIFFICULTY_AR, Meter, pct, Stat } from "@/components/ui";
import { PrintButton } from "./print-button";
import { clock } from "@/domain/engine/simulation";
import type { InvestigationScore } from "@/domain/forensics/scoring";
import type { Dimension } from "@/domain/readiness/scoring";
import type { SessionView } from "@/server/services/simulation";
import { TACTIC_AR } from "@/server/services/views";

interface Rec {
  scenarioId: string;
  scenario: { titleAr: string; difficulty: number };
  rationale: unknown;
  status: string;
}

const DIM_AR: Record<string, string> = { speed: "السرعة", accuracy: "الدقة", independence: "الاستقلالية", completeness: "الاكتمال" };
const OUTCOME_AR: Record<string, string> = { CONTAINED: "تم الاحتواء", BREACHED: "حقق الخصم هدفه", TIMEOUT: "انتهى الوقت" };

export function Report({ v, recommendation, competencyNames, canRun }: { v: SessionView; recommendation: Rec | null; competencyNames: Record<string, string>; canRun: boolean }) {
  const r = v.readiness!;
  const ev = r.evidence as unknown as Record<string, Dimension> & { competencies: Record<string, { score: number; observations: number }> };
  const inv = v.report!.score as unknown as InvestigationScore;
  const truth = inv.detail.truth;
  const techName = (t: string) => v.def.nodes.find((n) => n.technique === t)?.techniqueName ?? t;
  const reasons = (recommendation?.rationale as { reasonsAr?: string[] } | undefined)?.reasonsAr ?? [];

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-surface px-5 py-4 print-card">
        <div>
          <p className="text-xs text-subtle">المرحلة 4 — تقرير الجاهزية السلوكية</p>
          <h1 className="mt-1 text-xl font-semibold">{v.def.titleAr}</h1>
          <p className="mt-1 text-xs text-subtle">{v.session.user.name} · {OUTCOME_AR[v.session.outcome ?? "TIMEOUT"]} عند <span className="ltr font-mono">{clock(v.state.minute)}</span> · بذرة المحاكاة <span className="ltr font-mono">{v.session.seed}</span></p>
        </div>
        <PrintButton />
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="مؤشر الجاهزية لهذه الجلسة" subtitle={`المنهجية ${r.methodologyVersion} — نتائج داخل المحاكاة وليست تنبؤًا بالأداء الفعلي`} />
          <div className="grid gap-6 p-5 sm:grid-cols-[160px_1fr]">
            <div>
              <p className="text-5xl font-semibold tabular-nums text-lime">{r.overall.toFixed(1)}</p>
              <p className="text-xs text-subtle">من 100</p>
            </div>
            <div className="flex flex-col gap-4">
              {(["speed", "accuracy", "independence", "completeness"] as const).map((k) => (
                <details key={k} className="group">
                  <summary className="flex cursor-pointer list-none flex-col gap-1.5">
                    <span className="flex justify-between text-xs"><span className="text-silver">{DIM_AR[k]} <span className="text-subtle group-open:hidden">(عرض الحساب)</span></span><span className="tabular-nums">{pct(ev[k].score)}</span></span>
                    <Meter value={ev[k].score * 100} label={DIM_AR[k]} />
                  </summary>
                  <div className="mt-2 rounded border border-line bg-surface-2 p-3 text-xs">
                    <p className="text-silver">{ev[k].formula}</p>
                    <dl className="ltr mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-start font-mono text-subtle">
                      {Object.entries(ev[k].inputs).map(([ik, iv]) => (<div key={ik} className="contents"><dt>{ik}</dt><dd className="text-fg">{String(iv)}</dd></div>))}
                    </dl>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="المرحلة 5 — التدريب التالي" subtitle="محسوب من ملفك السلوكي المحدّث" />
          {recommendation ? (
            <div className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2">
                <p className="font-medium">{recommendation.scenario.titleAr}</p>
                <Badge tone="lime">{DIFFICULTY_AR[recommendation.scenario.difficulty]}</Badge>
              </div>
              <ul className="flex flex-col gap-1.5 text-sm text-silver">{reasons.map((x) => <li key={x} className="flex gap-2"><span className="text-lime">•</span>{x}</li>)}</ul>
              {canRun && recommendation.status === "OPEN" && v.isOwner && (
                <form action={startSessionAction} className="no-print">
                  <input type="hidden" name="scenarioId" value={recommendation.scenarioId} />
                  <Button type="submit" className="w-full">ابدأ التدريب التالي</Button>
                </form>
              )}
              {recommendation.status !== "OPEN" && <p className="text-xs text-subtle">تم بدء هذا التدريب أو استبداله بتوصية أحدث.</p>}
            </div>
          ) : (
            <p className="p-5 text-sm text-subtle">لا توجد توصية مرتبطة بهذه الجلسة.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="تقييم التحقيق الجنائي" subtitle={`الدرجة الكلية ${pct(inv.total)}`} />
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-5">
            <Stat label="نقطة الدخول" value={pct(inv.entry)} />
            <Stat label="الأصول" value={pct(inv.assets)} />
            <Stat label="الحسابات" value={pct(inv.identities)} />
            <Stat label="التسلسل" value={pct(inv.sequence)} />
            <Stat label="الأدلة" value={pct(inv.evidence)} />
          </div>
          <div className="flex flex-col gap-2 border-t border-line p-5 text-sm">
            <p><span className="text-subtle">نقطة الدخول الفعلية: </span><span className="ltr font-mono">{truth.entryAsset} · {truth.entryTechnique}</span></p>
            {inv.detail.missedAssets.length > 0 && <p><span className="text-subtle">أصول فاتتك: </span><span className="ltr font-mono text-warn">{inv.detail.missedAssets.join(", ")}</span></p>}
            {inv.detail.wrongAssets.length > 0 && <p><span className="text-subtle">أصول نُسبت خطأً: </span><span className="ltr font-mono text-danger">{inv.detail.wrongAssets.join(", ")}</span></p>}
            {inv.detail.missedIdentities.length > 0 && <p><span className="text-subtle">حسابات فاتتك: </span><span className="ltr font-mono text-warn">{inv.detail.missedIdentities.join(", ")}</span></p>}
            {inv.detail.wrongIdentities.length > 0 && <p><span className="text-subtle">حسابات نُسبت خطأً: </span><span className="ltr font-mono text-danger">{inv.detail.wrongIdentities.join(", ")}</span></p>}
            <p className="text-subtle">استشهدت بـ {inv.detail.citedTotal} دليل، منها {inv.detail.citedMalicious} مرتبط بنشاط الخصم{inv.detail.citedEntryEvidence ? "، وشمل دليل نقطة الدخول." : "، ولم يشمل دليل نقطة الدخول."}</p>
          </div>
        </Card>

        <Card>
          <CardHeader title="الكفاءات المقاسة في هذه الجلسة" />
          <div className="flex flex-col gap-3 p-5">
            {Object.entries(ev.competencies).sort((a, b) => a[1].score - b[1].score).map(([k, c]) => (
              <div key={k} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs"><span className="text-silver">{competencyNames[k] ?? k}</span><span className="tabular-nums">{pct(c.score)} · {c.observations} ملاحظة</span></div>
                <Meter value={c.score * 100} tone={c.score < 0.5 ? "warn" : "lime"} label={competencyNames[k] ?? k} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="سجل قرارات الخصم المتكيّف" subtitle="ما خطط له الخصم، ولماذا، وقرار الحارس — يُكشف بعد انتهاء التحقيق" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-xs text-subtle">
              <tr className="border-b border-line">
                <th className="px-5 py-2 text-start font-normal">الوقت</th>
                <th className="px-3 py-2 text-start font-normal">التكتيك</th>
                <th className="px-3 py-2 text-start font-normal">التقنية</th>
                <th className="px-3 py-2 text-start font-normal">الهدف</th>
                <th className="px-3 py-2 text-start font-normal">الحارس</th>
                <th className="px-5 py-2 text-start font-normal">سبب الاختيار</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {v.adversary.map((a) => (
                <tr key={a.id}>
                  <td className="ltr px-5 py-2 text-start font-mono text-xs text-subtle">{clock(a.simMinute)}</td>
                  <td className="px-3 py-2 text-xs">{TACTIC_AR[a.tactic] ?? a.tactic}</td>
                  <td className="ltr px-3 py-2 text-start font-mono text-xs">{a.technique} <span className="text-subtle">{techName(a.technique)}</span></td>
                  <td className="ltr px-3 py-2 text-start font-mono text-xs">{a.target}</td>
                  <td className="px-3 py-2">{a.approved ? <Badge tone="ok">اعتمد</Badge> : <Badge tone="danger">رفض: {a.guardianReason}</Badge>}</td>
                  <td className="px-5 py-2 text-xs text-silver">{a.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-5 py-3 text-xs text-subtle">التسلسل الفعلي: <span className="ltr font-mono">{truth.sequence.join(" → ")}</span></p>
      </Card>

      <Card>
        <CardHeader title="قراراتك الدفاعية" subtitle={`${v.actions.length} أمر`} />
        <ol className="divide-y divide-line text-sm">
          {v.actions.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2">
              <span className="flex items-center gap-3">
                <span className="ltr font-mono text-xs text-subtle">{clock(a.simMinute)}</span>
                <span className="ltr font-mono">{a.command}</span>
              </span>
              <span className="flex gap-1">
                {!a.valid && <Badge tone="danger">غير صالح</Badge>}
                {a.effective && <Badge tone="ok">فعّال</Badge>}
                {a.disruptive && <Badge tone="warn">تعطيل غير ضروري</Badge>}
                {a.productive && <Badge tone="info">كشف دليلًا</Badge>}
                <span className="text-xs tabular-nums text-subtle">{(a.latencyMs / 1000).toFixed(1)} ث</span>
              </span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
