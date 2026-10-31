import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { formatDateTime } from "@/lib/i18n/format";
import { encounterScope } from "@/lib/scope";
import { PageHeader, Kpi, Empty } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarList } from "@/components/charts/charts";
import { EncounterStatusBadge, PriorityBadge } from "@/components/shared/status";
import { LiveRefresh } from "@/components/live-provider";

export default async function MciPage() {
  const user = await requirePermission("command:read");
  const { t, locale } = await getDict();
  const incidents = await prisma.incident.findMany({
    where: { isMassCasualty: true, status: "OPEN", ...(user.orgType === "EMS" ? { organizationId: user.organizationId } : {}) },
    include: { missions: { include: { ambulance: true } }, encounters: { where: encounterScope(user), include: { patient: true, destinationHospital: true } } },
    orderBy: { reportedAt: "desc" },
  });
  return (
    <div className="space-y-5">
      <LiveRefresh />
      <PageHeader title={t.mci.title} subtitle={t.mci.subtitle} />
      {incidents.length === 0 ? <Empty>{t.mci.none}</Empty> : null}
      {incidents.map((inc) => {
        const e = inc.encounters;
        const dist = new Map<string, number>();
        e.forEach((x) => dist.set(x.destinationHospital?.name ?? "—", (dist.get(x.destinationHospital?.name ?? "—") ?? 0) + 1));
        return (
          <Card key={inc.id} className="border-red-200">
            <CardHeader>
              <div>
                <CardTitle className="text-base">
                  <Link href={`/incidents/${inc.id}`} className="ltr hover:underline">
                    {inc.code}
                  </Link>{" "}
                  · {inc.address}
                </CardTitle>
                <div className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(inc.reportedAt, locale)} {inc.description ? `· ${inc.description}` : ""}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                <Kpi label={t.mci.totalPatients} value={e.length} />
                <Kpi label="P1" value={e.filter((x) => x.priority === "P1").length} tone="critical" />
                <Kpi label="P2" value={e.filter((x) => x.priority === "P2").length} tone="warning" />
                <Kpi label="P3" value={e.filter((x) => x.priority === "P3").length} tone="info" />
                <Kpi label="P4" value={e.filter((x) => x.priority === "P4").length} tone="stable" />
                <Kpi label={t.mci.ambulances} value={inc.missions.length} />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <div className="mb-2 text-sm font-semibold">{t.mci.distribution}</div>
                  <BarList data={[...dist.entries()].map(([key, value]) => ({ key, value }))} label={t.mci.totalPatients} />
                </div>
                <ul className="divide-y text-sm">
                  {e.map((x) => (
                    <li key={x.id} className="flex items-center justify-between py-2">
                      <Link href={`/cases/${x.id}`} className="flex items-center gap-2 hover:underline">
                        <PriorityBadge p={x.priority} /> <span className="ltr">{x.patient.isUnknown ? x.patient.temporaryId : x.patient.fullName}</span>
                      </Link>
                      <EncounterStatusBadge s={x.status} />
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
