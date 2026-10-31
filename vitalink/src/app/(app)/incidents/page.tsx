import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { formatDateTime } from "@/lib/i18n/format";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { T } from "@/components/shared/status";

export default async function IncidentsPage() {
  const user = await requirePermission("case:read");
  if (user.orgType === "HOSPITAL") notFound();
  const { t, locale } = await getDict();
  const rows = await prisma.incident.findMany({
    where: user.orgType === "EMS" ? { organizationId: user.organizationId } : {},
    orderBy: { reportedAt: "desc" },
    take: 150,
    include: { _count: { select: { missions: true, encounters: true } } },
  });
  return (
    <div className="space-y-4">
      <PageHeader title={t.incidents.title} subtitle={`${rows.length}`} />
      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t.incidents.code}</TH>
                <TH>{t.incidents.type}</TH>
                <TH>{t.incidents.address}</TH>
                <TH>{t.incidents.reported}</TH>
                <TH>{t.incidents.missions}</TH>
                <TH>{t.incidents.patients}</TH>
                <TH>{t.common.status}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((i) => (
                <TR key={i.id}>
                  <TD>
                    <Link href={`/incidents/${i.id}`} className="ltr font-mono text-xs font-semibold text-info hover:underline">
                      {i.code}
                    </Link>
                  </TD>
                  <TD className="text-sm">
                    <T k={`enums.incidentType.${i.type}`} /> {i.isMassCasualty ? <Badge variant="criticalSolid">MCI</Badge> : null}
                  </TD>
                  <TD className="text-xs">{i.address}</TD>
                  <TD className="text-xs tabular">{formatDateTime(i.reportedAt, locale)}</TD>
                  <TD className="tabular">{i._count.missions}</TD>
                  <TD className="tabular">{i._count.encounters}</TD>
                  <TD>
                    <Badge variant={i.status === "OPEN" ? "warning" : "muted"}>{i.status === "OPEN" ? t.incidents.open : t.incidents.closed}</Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
