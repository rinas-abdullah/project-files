import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, Card, CardHeader, EmptyState, Meter, pct } from "@/components/ui";
import { can, ROLE_LABEL_AR } from "@/server/auth/rbac";
import { requireActor } from "@/server/auth/session";
import { teamOverview } from "@/server/services/dashboard";

export const metadata: Metadata = { title: "جاهزية الفريق" };

export default async function TeamPage() {
  const actor = await requireActor();
  if (!can(actor, "team:view")) notFound();
  const t = await teamOverview(actor);
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">جاهزية الفريق</h1>
        <p className="mt-1 text-sm text-silver">{actor.orgName} · متوسط الفريق: {t.teamAverage === null ? "لا توجد قياسات بعد" : t.teamAverage.toFixed(1)}</p>
      </header>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="الأعضاء" subtitle="محصورة في منظمتك فقط" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-xs text-subtle">
                <tr className="border-b border-line">
                  <th className="px-5 py-3 text-start font-normal">العضو</th>
                  <th className="px-3 py-3 text-start font-normal">الدور</th>
                  <th className="px-3 py-3 text-start font-normal">جلسات مقاسة</th>
                  <th className="px-3 py-3 text-start font-normal">آخر قياس</th>
                  <th className="px-5 py-3 text-start font-normal">المتوسط</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {t.rows.map((r) => (
                  <tr key={r.userId}>
                    <td className="px-5 py-3"><p>{r.name}</p><p className="ltr text-start text-xs text-subtle">{r.email}</p></td>
                    <td className="px-3 py-3"><Badge>{ROLE_LABEL_AR[r.role]}</Badge></td>
                    <td className="px-3 py-3 tabular-nums">{r.sessions}</td>
                    <td className="px-3 py-3 tabular-nums">{r.latest?.toFixed(1) ?? "—"}</td>
                    <td className="px-5 py-3 tabular-nums">{r.average?.toFixed(1) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <CardHeader title="فجوات الكفاءات في الفريق" subtitle="متوسط مستوى الأعضاء الذين قيست لديهم الكفاءة" />
          {t.teamCompetencies.length ? (
            <div className="flex flex-col gap-3 p-5">
              {t.teamCompetencies.map((c) => (
                <div key={c.key} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs"><span className="text-silver">{c.name}</span><span className="tabular-nums">{pct(c.average)} · {c.learners} متدرب</span></div>
                  <Meter value={(c.average ?? 0) * 100} tone={(c.average ?? 0) < 0.5 ? "warn" : "lime"} label={c.name} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="لا توجد قياسات" body="تظهر فجوات الفريق بعد أن يكمل الأعضاء جلسات تدريب." />
          )}
        </Card>
      </div>
    </div>
  );
}
