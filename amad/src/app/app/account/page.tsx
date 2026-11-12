import type { Metadata } from "next";
import { revokeOtherSessionsAction } from "@/app/actions/auth";
import { Badge, Button, Card, CardHeader, fmtDate } from "@/components/ui";
import { ROLE_LABEL_AR } from "@/server/auth/rbac";
import { listSessions } from "@/server/auth/service";
import { requireActor } from "@/server/auth/session";

export const metadata: Metadata = { title: "الحساب" };

export default async function AccountPage({ searchParams }: PageProps<"/app/account">) {
  const actor = await requireActor();
  const sessions = await listSessions(actor);
  const { revoked } = await searchParams;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">الحساب</h1>
      <Card>
        <CardHeader title="الملف الشخصي" />
        <dl className="grid gap-4 p-5 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-subtle">الاسم</dt><dd>{actor.name}</dd></div>
          <div><dt className="text-xs text-subtle">البريد الإلكتروني</dt><dd className="ltr text-start">{actor.email}</dd></div>
          <div><dt className="text-xs text-subtle">المنظمة</dt><dd>{actor.orgName}</dd></div>
          <div><dt className="text-xs text-subtle">الدور</dt><dd><Badge>{ROLE_LABEL_AR[actor.role]}</Badge></dd></div>
        </dl>
      </Card>
      <Card>
        <CardHeader
          title="الجلسات النشطة"
          subtitle="الأجهزة المسجّل دخولها إلى حسابك"
          action={sessions.length > 1 ? <form action={revokeOtherSessionsAction}><Button type="submit" variant="danger" className="h-8 px-3">إنهاء الجلسات الأخرى</Button></form> : undefined}
        />
        {revoked && <p className="border-b border-line bg-ok/10 px-5 py-2 text-sm text-ok">تم إنهاء الجلسات الأخرى.</p>}
        <ul className="divide-y divide-line text-sm">
          {sessions.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
              <span className="ltr max-w-md truncate text-start text-xs text-silver">{s.userAgent ?? "unknown agent"}</span>
              <span className="flex items-center gap-2 text-xs text-subtle">{s.id === actor.sessionId && <Badge tone="lime">هذه الجلسة</Badge>}{fmtDate(s.createdAt)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
