"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { DropdownMenu, Popover } from "radix-ui";
import {
  Activity,
  Ambulance,
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  FileText,
  FlaskConical,
  Gauge,
  Languages,
  LayoutDashboard,
  LogOut,
  Menu,
  Plug,
  Radio,
  ScrollText,
  ShieldAlert,
  Siren,
  Users,
  X,
  TriangleAlert,
} from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { useLive } from "@/components/live-provider";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/i18n/format";
import { Logo } from "./logo";

const ICONS = {
  command: Gauge,
  dispatch: Radio,
  paramedic: Ambulance,
  ed: LayoutDashboard,
  resources: Building2,
  cases: ClipboardList,
  incidents: Siren,
  mci: ShieldAlert,
  alerts: TriangleAlert,
  analytics: BarChart3,
  reports: FileText,
  audit: ScrollText,
  integrations: Plug,
  users: Users,
  demo: FlaskConical,
  notifications: Bell,
} as const;

export type NavItem = { href: string; key: keyof typeof ICONS };
export type NavSection = { key: "sectionOperations" | "sectionClinical" | "sectionInsights" | "sectionAdmin"; items: NavItem[] };

type ShellUser = { name: string; email: string; role: string; org: string; unit: string | null };

export function AppShell({ user, nav, unread, compact, children }: { user: ShellUser; nav: NavSection[]; unread: number; compact?: boolean; children: React.ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href + "/")) || pathname === href.split("?")[0];

  const navList = (
    <nav className="flex flex-col gap-5">
      {nav.map((section) => (
        <div key={section.key}>
          <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">{t.nav[section.key]}</div>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const Icon = ICONS[item.key];
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                      active ? "bg-white/12 text-white" : "text-white/65 hover:bg-white/6 hover:text-white",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{t.nav[item.key]}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  if (compact) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-white/10 bg-navy-900 px-3 text-white sm:px-5">
          <Logo className="text-white" />
          <nav className="ms-2 hidden items-center gap-1 md:flex">
            {nav.flatMap((s) => s.items).map((item) => {
              const Icon = ICONS[item.key];
              return (
                <Link key={item.href} href={item.href} className={cn("flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm", isActive(item.href) ? "bg-white/12" : "text-white/70 hover:bg-white/6")}>
                  <Icon className="size-4" /> {t.nav[item.key]}
                </Link>
              );
            })}
          </nav>
          <div className="ms-auto flex items-center gap-1.5">
            <TopbarTools user={user} unread={unread} dark />
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] p-3 sm:p-5">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:ps-64">
      <aside className="fixed inset-y-0 start-0 z-50 hidden w-64 flex-col bg-navy-900 px-3 py-4 lg:flex">
        <div className="mb-6 px-2">
          <Logo className="text-white" />
        </div>
        <div className="flex-1 overflow-y-auto pe-1">{navList}</div>
        <div className="mt-4 rounded-lg bg-white/5 px-3 py-2.5 text-[11px] text-white/55">
          <div className="font-medium text-white/80">{user.org}</div>
          {user.unit ? <div>{user.unit}</div> : null}
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 start-0 flex w-72 flex-col bg-navy-900 px-3 py-4">
            <div className="mb-6 flex items-center justify-between px-2">
              <Logo className="text-white" />
              <button onClick={() => setOpen(false)} className="text-white/70" aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{navList}</div>
          </aside>
        </div>
      ) : null}

      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-white/90 px-3 backdrop-blur sm:px-6">
        <button className="rounded-md p-1.5 hover:bg-muted lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="size-5" />
        </button>
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="ms-auto flex items-center gap-1.5">
          <TopbarTools user={user} unread={unread} />
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] p-3 sm:p-6">{children}</main>
    </div>
  );
}

function TopbarTools({ user, unread, dark }: { user: ShellUser; unread: number; dark?: boolean }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { connected } = useLive();
  const btn = cn("relative flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm", dark ? "hover:bg-white/10 text-white/85" : "hover:bg-muted text-foreground");

  const switchLocale = async () => {
    await fetch("/api/locale", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale: locale === "ar" ? "en" : "ar" }) });
    router.refresh();
  };

  return (
    <>
      <span
        className={cn(
          "hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:flex",
          connected ? (dark ? "bg-teal-500/15 text-teal-300" : "bg-stable-soft text-teal-700") : dark ? "bg-amber-500/15 text-amber-300" : "bg-warning-soft text-amber-700",
        )}
        data-testid="live-indicator"
      >
        <Activity className="size-3.5" />
        {connected ? t.live.connected : t.live.reconnecting}
      </span>
      <NotificationBell unread={unread} btnClass={btn} />
      <button className={btn} onClick={switchLocale} aria-label={t.common.language} data-testid="lang-switch">
        <Languages className="size-4" />
        <span className="text-xs font-semibold">{locale === "ar" ? "EN" : "عربي"}</span>
      </button>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className={btn} data-testid="user-menu">
          <span className={cn("flex size-7 items-center justify-center rounded-full text-[11px] font-bold", dark ? "bg-white/15" : "bg-navy-900 text-white")}>
            {user.name
              .split(" ")
              .map((x) => x[0])
              .slice(0, 2)
              .join("")}
          </span>
          <span className="hidden text-start leading-tight md:block">
            <span className="block text-xs font-semibold">{user.name}</span>
            <span className={cn("block text-[10px]", dark ? "text-white/55" : "text-muted-foreground")}>{t.roles[user.role as keyof typeof t.roles]}</span>
          </span>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={6} className="z-[60] min-w-56 rounded-xl border bg-white p-1.5 text-sm shadow-xl">
            <div className="px-2.5 py-2">
              <div className="font-semibold">{user.name}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t.roles[user.role as keyof typeof t.roles]} · {user.org}
              </div>
            </div>
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-critical outline-none hover:bg-muted"
              onSelect={() => signOut({ callbackUrl: "/login" })}
              data-testid="sign-out"
            >
              <LogOut className="size-4" /> {t.common.signOut}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </>
  );
}

type Notif = { id: string; type: string; title: string; body: string; link: string | null; readAt: string | null; createdAt: string };

function NotificationBell({ unread: initial, btnClass }: { unread: number; btnClass: string }) {
  const { t, locale } = useI18n();
  const { subscribe } = useLive();
  const [unread, setUnread] = useState(initial);
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => setUnread(initial), [initial]);
  useEffect(
    () =>
      subscribe((ev) => {
        if (ev.t !== "notify") return;
        fetch("/api/notifications?count=1")
          .then((r) => r.json())
          .then((j) => setUnread(j.unread ?? 0))
          .catch(() => {});
      }),
    [subscribe],
  );
  useEffect(() => {
    if (!open) return;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((j) => {
        setItems(j.items ?? []);
        setUnread(j.unread ?? 0);
      })
      .catch(() => {});
  }, [open]);

  const markAll = async () => {
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
    setUnread(0);
    setItems((x) => x.map((n) => ({ ...n, readAt: new Date().toISOString() })));
  };
  const openItem = async (n: Notif) => {
    if (!n.readAt) {
      await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [n.id] }) });
      setUnread((u) => Math.max(0, u - 1));
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className={btnClass} aria-label={t.nav.notifications} data-testid="notifications-bell">
        <Bell className="size-4" />
        {unread > 0 ? (
          <span className="absolute -top-0.5 end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[10px] font-bold text-white" data-testid="unread-count">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={6} className="z-[60] w-[360px] max-w-[calc(100vw-1rem)] rounded-xl border bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <div className="text-sm font-semibold">{t.notifications.title}</div>
            <button className="text-xs text-info hover:underline" onClick={markAll}>
              {t.common.markAllRead}
            </button>
          </div>
          <ul className="max-h-96 divide-y overflow-y-auto">
            {items.length === 0 ? <li className="p-6 text-center text-sm text-muted-foreground">{t.notifications.empty}</li> : null}
            {items.map((n) => (
              <li key={n.id}>
                <button className={cn("w-full px-4 py-2.5 text-start hover:bg-muted/60", !n.readAt && "bg-info-soft/60")} onClick={() => openItem(n)}>
                  <div className="flex items-center gap-2">
                    {!n.readAt ? <span className="size-1.5 rounded-full bg-info" /> : null}
                    <span className="text-[13px] font-semibold">{t.enums.notificationTitle[n.title as keyof typeof t.enums.notificationTitle] ?? t.enums.notificationType[n.type as keyof typeof t.enums.notificationType] ?? n.title}</span>
                  </div>
                  <div className="ltr mt-0.5 truncate text-start text-xs text-muted-foreground">{n.body}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">{formatDateTime(n.createdAt, locale)}</div>
                </button>
              </li>
            ))}
          </ul>
          <Link href="/notifications" className="block border-t px-4 py-2 text-center text-xs font-medium text-info hover:bg-muted/50" onClick={() => setOpen(false)}>
            {t.common.viewAll}
          </Link>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
