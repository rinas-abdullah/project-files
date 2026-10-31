import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { can } from "@/lib/rbac";
import { alertScope, toAlertRow } from "@/lib/queries";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { AlertsList } from "@/components/shared/alerts-list";
import { LiveRefresh } from "@/components/live-provider";
import { cn } from "@/lib/utils";

export default async function AlertsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requirePermission("case:read");
  const { t } = await getDict();
  const { status = "active" } = await searchParams;
  const rows = await prisma.alert.findMany({
    where: { AND: [alertScope(user), status === "active" ? { status: { not: "RESOLVED" } } : status === "resolved" ? { status: "RESOLVED" } : {}] },
    orderBy: [{ createdAt: "desc" }],
    take: 200,
    include: { encounter: { select: { id: true, code: true } }, hospital: { select: { name: true } }, ambulance: { select: { callSign: true } } },
  });
  const tabs = [
    ["active", t.enums.alertStatus.OPEN],
    ["resolved", t.enums.alertStatus.RESOLVED],
    ["all", t.common.all],
  ];
  return (
    <div className="space-y-4">
      <LiveRefresh types={["alert"]} />
      <PageHeader title={t.alertsPage.title} subtitle={`${rows.length}`} />
      <div className="flex gap-1">
        {tabs.map(([k, label]) => (
          <Link key={k} href={`/alerts?status=${k}`} className={cn("rounded-lg border px-3 py-1.5 text-sm", status === k ? "bg-navy-900 text-white" : "bg-white hover:bg-muted")}>
            {label}
          </Link>
        ))}
      </div>
      <Card>
        <CardContent className="pt-2">
          <AlertsList alerts={rows.map(toAlertRow)} canManage={can(user.role, "alerts:manage")} />
        </CardContent>
      </Card>
    </div>
  );
}
