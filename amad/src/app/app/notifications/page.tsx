import type { Metadata } from "next";
import Link from "next/link";
import { markAllReadAction } from "@/app/actions/app";
import { Button, Card, EmptyState, cx, fmtDate } from "@/components/ui";
import { requireActor } from "@/server/auth/session";
import { listNotifications } from "@/server/services/dashboard";

export const metadata: Metadata = { title: "الإشعارات" };

export default async function NotificationsPage() {
  const actor = await requireActor();
  const items = await listNotifications(actor);
  const unread = items.filter((n) => !n.readAt).length;
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">الإشعارات</h1>
          <p className="mt-1 text-sm text-silver">إشعارات داخل التطبيق. الإرسال بالبريد غير مفعّل في هذا الإصدار.</p>
        </div>
        {unread > 0 && <form action={markAllReadAction}><Button type="submit" variant="secondary">تعليم الكل كمقروء ({unread})</Button></form>}
      </header>
      <Card>
        {items.length === 0 ? <EmptyState title="لا إشعارات" body="ستصلك إشعارات عند جاهزية تقارير الجاهزية والتوصيات الجديدة." /> : (
          <ul className="divide-y divide-line">
            {items.map((n) => (
              <li key={n.id} className={cx("flex flex-wrap items-start justify-between gap-3 px-5 py-3", !n.readAt && "bg-lime/5")}>
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium">{!n.readAt && <span className="h-1.5 w-1.5 rounded-full bg-lime" aria-label="غير مقروء" />}{n.title}</p>
                  <p className="mt-0.5 text-sm text-silver">{n.body}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-subtle">
                  {fmtDate(n.createdAt)}
                  {n.href && <Link href={n.href} className="text-lime hover:underline">فتح</Link>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
