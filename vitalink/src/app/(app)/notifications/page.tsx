import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { formatDateTime } from "@/lib/i18n/format";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarkAllRead } from "./mark-all";
import { LiveRefresh } from "@/components/live-provider";

export default async function NotificationsPage() {
  const user = await requireUser();
  const { t, locale } = await getDict();
  const rows = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div className="space-y-4">
      <LiveRefresh />
      <PageHeader title={t.notifications.title} subtitle={`${rows.filter((r) => !r.readAt).length} ${t.notifications.unread}`} actions={<MarkAllRead />} />
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y">
            {rows.length === 0 ? <li className="p-6 text-center text-sm text-muted-foreground">{t.notifications.empty}</li> : null}
            {rows.map((n) => (
              <li key={n.id} className={`flex items-start justify-between gap-3 px-4 py-3 ${n.readAt ? "" : "bg-info-soft/50"}`}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{t.enums.notificationType[n.type]}</Badge>
                    <span className="text-sm font-semibold">{t.enums.notificationTitle[n.title as keyof typeof t.enums.notificationTitle] ?? n.title}</span>
                  </div>
                  <div className="ltr mt-1 text-start text-xs text-muted-foreground">{n.body}</div>
                </div>
                <div className="shrink-0 text-end text-xs text-muted-foreground">
                  <div>{formatDateTime(n.createdAt, locale)}</div>
                  {n.link ? (
                    <Link href={n.link} className="text-info hover:underline">
                      {t.common.open}
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
