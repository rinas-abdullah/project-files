import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { AppNav, type NavItem } from "@/components/app/nav";
import { Badge, Wordmark } from "@/components/ui";
import { can, ROLE_LABEL_AR } from "@/server/auth/rbac";
import { requireActor } from "@/server/auth/session";
import { unreadCount } from "@/server/services/dashboard";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const actor = await requireActor();
  const unread = await unreadCount(actor);
  const items: NavItem[] = [
    { href: "/app", label: "مركز القيادة" },
    { href: "/app/scenarios", label: "السيناريوهات" },
    { href: "/app/history", label: "سجل التدريب" },
    ...(can(actor, "team:view") ? [{ href: "/app/team", label: "جاهزية الفريق" }] : []),
    ...(can(actor, "audit:view") ? [{ href: "/app/audit", label: "سجل التدقيق" }] : []),
    { href: "/app/notifications", label: "الإشعارات", count: unread },
    { href: "/app/methodology", label: "منهجية القياس" },
    { href: "/app/account", label: "الحساب" },
  ];
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="no-print border-b border-line bg-surface lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-l">
        <div className="flex items-center justify-between px-4 py-4 lg:block">
          <Link href="/app" className="text-fg"><Wordmark size="sm" /></Link>
          <form action={logoutAction} className="lg:hidden">
            <button className="text-sm text-silver hover:text-fg" type="submit">خروج</button>
          </form>
        </div>
        <div className="px-3 pb-3 lg:pb-0"><AppNav items={items} /></div>
        <div className="hidden border-t border-line px-4 py-4 text-xs lg:absolute lg:bottom-0 lg:block lg:w-60">
          <p className="truncate text-fg">{actor.name}</p>
          <p className="truncate text-subtle">{actor.orgName}</p>
          <div className="mt-2 flex items-center justify-between">
            <Badge tone="neutral">{ROLE_LABEL_AR[actor.role]}</Badge>
            <form action={logoutAction}><button className="text-silver hover:text-fg" type="submit">تسجيل الخروج</button></form>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        {actor.orgIsDemo && (
          <div className="no-print border-b border-warn/30 bg-warn/10 px-4 py-2 text-center text-xs text-warn">
            منظمة تجريبية — الحسابات لأغراض العرض، وكل النتائج الظاهرة ناتجة عن جلسات تدريب لُعبت فعلًا داخل هذه البيئة.
          </div>
        )}
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
