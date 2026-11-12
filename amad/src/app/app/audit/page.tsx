import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, EmptyState, fmtDate } from "@/components/ui";
import { can } from "@/server/auth/rbac";
import { requireActor } from "@/server/auth/session";
import { auditTrail } from "@/server/services/dashboard";

export const metadata: Metadata = { title: "سجل التدقيق" };

export default async function AuditPage() {
  const actor = await requireActor();
  if (!can(actor, "audit:view")) notFound();
  const rows = await auditTrail(actor);
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">سجل التدقيق</h1>
        <p className="mt-1 text-sm text-silver">آخر 100 حدث في منظمتك. يُسجَّل الدخول والخروج وبدء المحاكاة وإنهاؤها وعرض بيانات الفريق.</p>
      </header>
      <Card>
        {rows.length === 0 ? <EmptyState title="لا أحداث" body="لا توجد أحداث تدقيق بعد." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-xs text-subtle"><tr className="border-b border-line"><th className="px-5 py-3 text-start font-normal">الوقت</th><th className="px-3 py-3 text-start font-normal">المستخدم</th><th className="px-3 py-3 text-start font-normal">الإجراء</th><th className="px-5 py-3 text-start font-normal">الهدف</th></tr></thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-2.5 text-xs text-silver">{fmtDate(r.createdAt)}</td>
                    <td className="px-3 py-2.5">{r.user?.name ?? "—"}</td>
                    <td className="ltr px-3 py-2.5 text-start font-mono text-xs">{r.action}</td>
                    <td className="ltr px-5 py-2.5 text-start font-mono text-xs text-subtle">{r.targetType ? `${r.targetType}:${r.targetId?.slice(0, 10)}…` : "—"}</td>
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
