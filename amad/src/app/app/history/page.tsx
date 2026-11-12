import type { Metadata } from "next";
import Link from "next/link";
import { Badge, ButtonLink, Card, DIFFICULTY_AR, EmptyState, fmtDate } from "@/components/ui";
import { requireActor } from "@/server/auth/session";
import { sessionHistory } from "@/server/services/dashboard";

export const metadata: Metadata = { title: "سجل التدريب" };

const PHASE: Record<string, { label: string; tone: "warn" | "info" | "neutral" }> = {
  SIMULATION: { label: "استجابة حية", tone: "warn" },
  FORENSICS: { label: "تحقيق جنائي", tone: "info" },
  COMPLETED: { label: "مكتملة", tone: "neutral" },
};
const OUTCOME: Record<string, { label: string; tone: "ok" | "danger" | "warn" }> = {
  CONTAINED: { label: "احتواء", tone: "ok" },
  BREACHED: { label: "اختراق", tone: "danger" },
  TIMEOUT: { label: "انتهاء الوقت", tone: "warn" },
};

export default async function HistoryPage() {
  const actor = await requireActor();
  const rows = await sessionHistory(actor);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">سجل التدريب</h1>
      <Card>
        {rows.length === 0 ? (
          <EmptyState title="لا توجد جلسات" body="لم تبدأ أي جلسة تدريب بعد." action={<ButtonLink href="/app/scenarios">استعراض السيناريوهات</ButtonLink>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-xs text-subtle">
                <tr className="border-b border-line">
                  <th className="px-5 py-3 text-start font-normal">السيناريو</th>
                  <th className="px-3 py-3 text-start font-normal">البداية</th>
                  <th className="px-3 py-3 text-start font-normal">المرحلة</th>
                  <th className="px-3 py-3 text-start font-normal">النتيجة</th>
                  <th className="px-5 py-3 text-start font-normal">الجاهزية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-2">
                    <td className="px-5 py-3"><Link href={`/app/sessions/${r.id}`} className="hover:text-lime">{r.scenario.titleAr}</Link> <span className="text-xs text-subtle">· {DIFFICULTY_AR[r.scenario.difficulty]}</span></td>
                    <td className="px-3 py-3 text-xs text-silver">{fmtDate(r.startedAt)}</td>
                    <td className="px-3 py-3"><Badge tone={PHASE[r.phase].tone}>{PHASE[r.phase].label}</Badge></td>
                    <td className="px-3 py-3">{r.outcome ? <Badge tone={OUTCOME[r.outcome].tone}>{OUTCOME[r.outcome].label}</Badge> : "—"}</td>
                    <td className="px-5 py-3 tabular-nums">{r.readiness ? r.readiness.overall.toFixed(1) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
