import type { Metadata } from "next";
import Link from "next/link";
import { startSessionAction } from "@/app/actions/app";
import { Radar, TrendLine } from "@/components/app/charts";
import { Badge, Button, ButtonLink, Card, CardHeader, DIFFICULTY_AR, EmptyState, Meter, pct, Stat, fmtDate } from "@/components/ui";
import { can } from "@/server/auth/rbac";
import { requireActor } from "@/server/auth/session";
import { commandCenter } from "@/server/services/dashboard";

export const metadata: Metadata = { title: "مركز القيادة" };

export default async function CommandCenterPage() {
  const actor = await requireActor();
  const data = await commandCenter(actor);
  const canRun = can(actor, "simulation:run");
  const rec = data.openRec;
  const recReasons = (rec?.rationale as { reasonsAr?: string[] } | undefined)?.reasonsAr ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-subtle">مركز قيادة أَمَد</p>
          <h1 className="mt-1 text-2xl font-semibold">مرحبًا، {actor.name}</h1>
        </div>
        {canRun && <ButtonLink href="/app/scenarios" variant="secondary">استعراض السيناريوهات</ButtonLink>}
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="مؤشر الجاهزية" subtitle="متوسط أبعاد السرعة والدقة والاستقلالية والاكتمال في آخر جلسة مكتملة" action={<Link href="/app/methodology" className="text-xs text-lime hover:underline">كيف يُحسب؟</Link>} />
          {data.latest ? (
            <div className="grid gap-6 p-5 sm:grid-cols-[180px_1fr]">
              <div className="flex flex-col gap-1">
                <span className="text-5xl font-semibold tabular-nums text-lime">{data.latest.overall.toFixed(1)}</span>
                <span className="text-xs text-subtle">من 100 · {fmtDate(data.latest.createdAt)}</span>
                <span className="mt-1 text-xs text-silver">{data.history.length} جلسة مقاسة</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {([
                  ["السرعة", data.latest.speed],
                  ["الدقة", data.latest.accuracy],
                  ["الاستقلالية", data.latest.independence],
                  ["الاكتمال", data.latest.completeness],
                ] as const).map(([l, v]) => (
                  <div key={l} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs"><span className="text-silver">{l}</span><span className="tabular-nums">{pct(v)}</span></div>
                    <Meter value={v * 100} label={l} />
                  </div>
                ))}
              </div>
              {data.history.length > 1 && (
                <div className="sm:col-span-2">
                  <p className="mb-2 text-xs text-subtle">الاتجاه عبر الجلسات</p>
                  <TrendLine points={data.history.map((h) => ({ label: h.title, value: h.overall }))} />
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              title="لا توجد قياسات بعد"
              body="يظهر مؤشر الجاهزية بعد إكمال أول جلسة تدريب كاملة: احتواء الحادثة ثم تسليم التحقيق الجنائي. لا نعرض أي أرقام قبل ذلك."
            />
          )}
        </Card>

        <Card>
          <CardHeader title="التدريب التالي المقترح" subtitle={rec ? "مُولَّد من نتائج جلستك الأخيرة" : data.latest ? "محسوب الآن من ملفك السلوكي الحالي" : "نقطة بداية محسوبة — لا يوجد لديك سجل بعد"} />
          {rec ? (
            <div className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2">
                <p className="font-medium">{rec.scenario.titleAr}</p>
                <Badge tone="lime">{DIFFICULTY_AR[rec.scenario.difficulty]}</Badge>
              </div>
              <ul className="flex flex-col gap-1.5 text-sm text-silver">
                {recReasons.map((r) => <li key={r} className="flex gap-2"><span className="text-lime">•</span>{r}</li>)}
              </ul>
              {canRun && (
                <form action={startSessionAction}>
                  <input type="hidden" name="scenarioId" value={rec.scenarioId} />
                  <Button type="submit" className="w-full">ابدأ هذا التدريب</Button>
                </form>
              )}
            </div>
          ) : data.starter ? (
            <div className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2">
                <p className="font-medium">{data.starter.scenario.titleAr}</p>
                <Badge tone="lime">{DIFFICULTY_AR[data.starter.scenario.difficulty]}</Badge>
              </div>
              <ul className="flex flex-col gap-1.5 text-sm text-silver">
                {data.starter.reasonsAr.map((r) => <li key={r} className="flex gap-2"><span className="text-lime">•</span>{r}</li>)}
              </ul>
              {canRun ? (
                <form action={startSessionAction}>
                  <input type="hidden" name="scenarioId" value={data.starter.scenarioId} />
                  <Button type="submit" className="w-full">{data.latest ? "ابدأ هذا التدريب" : "ابدأ أول تدريب"}</Button>
                </form>
              ) : (
                <p className="text-xs text-subtle">دورك الحالي للقراءة فقط ولا يتيح بدء المحاكاة.</p>
              )}
            </div>
          ) : (
            <EmptyState title="لا توجد سيناريوهات منشورة" body="لم يُنشر أي سيناريو في هذه البيئة بعد." />
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="أضعف الكفاءات" subtitle="من ملفك السلوكي المحدّث بعد كل جلسة" />
          {data.profile.length ? (
            <div className="flex flex-col gap-3 p-5">
              {data.profile.length >= 3 && <Radar axes={data.profile.map((p) => ({ label: p.name, value: p.level }))} />}
              {data.profile.slice(0, 4).map((p) => (
                <div key={p.key} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs"><span className="text-silver">{p.name}</span><span className="tabular-nums">{pct(p.level)} · {p.samples} قياس</span></div>
                  <Meter value={p.level * 100} tone={p.level < 0.5 ? "warn" : "lime"} label={p.name} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="لم تُقَس أي كفاءة بعد" body="تُقاس الكفاءات من قراراتك داخل المحاكاة: ما تفحصه، وما تعزله، وما توثّقه." />
          )}
        </Card>

        <Card>
          <CardHeader title="أداء الاحتواء والتحقيق" />
          <div className="grid grid-cols-2 gap-5 p-5">
            <Stat label="جلسات مكتملة" value={data.containment.completed} />
            <Stat label="احتُويت بنجاح" value={data.containment.completed ? `${data.containment.contained}/${data.containment.completed}` : "—"} />
            <Stat label="متوسط زمن الاحتواء" value={data.containment.avgMinute === null ? "—" : `${data.containment.avgMinute.toFixed(0)} د`} sub="دقائق محاكاة" />
            <Stat label="دقة التحقيق" value={pct(data.investigationAccuracy)} sub={data.investigations ? `${data.investigations} تقرير` : undefined} />
          </div>
        </Card>

        <Card>
          <CardHeader title="محاكاة نشطة" />
          {data.active.length ? (
            <ul className="divide-y divide-line">
              {data.active.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm">{s.scenario.titleAr}</p>
                    <p className="text-xs text-subtle">{s.phase === "SIMULATION" ? `الاستجابة الحية · T+${s.simMinute}د` : "بانتظار التحقيق الجنائي"}</p>
                  </div>
                  <ButtonLink href={`/app/sessions/${s.id}`} variant="secondary" className="h-8 px-3">متابعة</ButtonLink>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="لا توجد محاكاة جارية" body="الجلسات التي تبدأها تبقى محفوظة على الخادم ويمكنك العودة إليها في أي وقت." />
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="أحدث أحداث التدريب" />
        {data.recentEvents.length ? (
          <ul className="divide-y divide-line">
            {data.recentEvents.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-sm">
                  <span className="flex items-center gap-2">
                    <Badge tone={e.kind.startsWith("siem") ? "warn" : e.kind === "session.contained" ? "ok" : e.kind === "session.breached" ? "danger" : "neutral"}>{e.session.scenario.titleAr}</Badge>
                    <span className="text-silver">{e.message}</span>
                  </span>
                  <Link href={`/app/sessions/${e.session.id}`} className="text-xs text-subtle hover:text-fg">{fmtDate(e.createdAt)}</Link>
                </li>
              ))}
          </ul>
        ) : (
          <EmptyState title="لا توجد أحداث" body="ستظهر هنا أحداث جلساتك: بداية المحاكاة، تنبيهات SIEM، الاحتواء أو الاختراق." />
        )}
      </Card>
    </div>
  );
}
