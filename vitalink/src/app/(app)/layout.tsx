import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { buildNav } from "@/lib/nav";
import { AppShell } from "@/components/app/app-shell";
import { LiveProvider } from "@/components/live-provider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });
  return (
    <LiveProvider>
      <AppShell
        user={{ name: user.name, email: user.email, role: user.role, org: user.organizationName, unit: user.hospitalName ?? user.ambulanceCallSign }}
        nav={buildNav(user.role)}
        unread={unread}
        compact={user.role === "PARAMEDIC"}
      >
        {children}
      </AppShell>
    </LiveProvider>
  );
}
