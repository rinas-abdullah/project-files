import Link from "next/link";
import { Activity, Ambulance, Clock, HeartPulse, Siren, Timer } from "lucide-react";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { formatEta, formatMin } from "@/lib/i18n/format";
import { can } from "@/lib/rbac";
import { INCOMING_STATUSES, OPEN_STATUSES, commandKpis, hospitalLoadTable, mapAmbulances, mapHospitals, openAlerts, scopedEncounters, toAlertRow, toCard } from "@/lib/queries";
import { PageHeader, Kpi, Empty } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EncounterStatusBadge, PriorityBadge, T } from "@/components/shared/status";
import { AlertsList } from "@/components/shared/alerts-list";
import { LiveRefresh } from "@/components/live-provider";
import { LiveMap } from "@/components/maps/live-map";
import { minutesSince } from "@/lib/utils";

export default async function CommandCenter() {
  const user = await requirePermission("command:read");
  const { t, locale } = await getDict();
  const [kpis, ambulances, hospitals, loads, activeRows, alerts, incidents] = await Promise.all([
    commandKpis(user),
    mapAmbulances(user.orgType === "EMS" ? { organizationId: user.organizationId } : {}),
    mapHospitals(),
    hospitalLoadTable(),
    scopedEncounters(user, { status: { in: [...OPEN_STATUSES] } }),
    openAlerts(user, 25),
    prisma.incident.findMany({ where: { status: "OPEN", ...(user.orgType === "EMS" ? { organizationId: user.organizationId } : {}) }, include: { _count: { select: { encounters: true, missions: true } } }, orderBy: { reportedAt: "desc" } }),
  ]);
  const active = activeRows.map(toCard);
  const critical = active.filter((c) => c.priority === "P1" || c.conditionTrend === "CRITICAL" || c.conditionTrend === "DETERIORATING");
  const unack = active.filter((c) => c.preAlertSentAt && !c.acknowledgedAt && (INCOMING_STATUSES as readonly string[]).includes(c.status));

  return (
    <div className="space-y-5">
      <LiveRefresh />
      <PageHeader eyebrow={t.app.name} title={t.command.title} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label={t.command.activeAmbulances} value={kpis.activeAmbulances} icon={<Ambulance className="size-4" />} testId="kpi-active-ambulances" />
        <Kpi label={t.command.activeCases} value={kpis.activeCases} icon={<Activity className="size-4" />} testId="kpi-active-cases" />
        <Kpi label={t.command.criticalCases} value={kpis.criticalCases} tone={kpis.criticalCases ? "critical" : "default"} icon={<Siren className="size-4" />} />
        <Kpi label={t.command.avgEta} value={<span className="ltr">{formatMin(kpis.avgEtaMin, t.common.min)}</span>} icon={<Clock className="size-4" />} />
        <Kpi label={t.command.medianAck} value={<span className="ltr">{formatMin(kpis.medianAckMin, t.common.min)}</span>} sub={t.common.lastDays.replace("{n}", "7")} icon={<Timer className="size-4" />} />
        <Kpi label={t.command.medianHandover} value={<span className="ltr">{formatMin(kpis.medianHandoverMin, t.common.min)}</span>} sub={t.common.lastDays.replace("{n}", "7")} icon={<HeartPulse className="size-4" />} />
      </div>

      <div className="grid gap-5 2xl:grid-cols-[1fr_460px]">
        <LiveMap
          className="h-[520px]"
          showGeofence
          hospitals={hospitals.map((h) => ({ ...h, label: locale === "ar" ? h.nameAr : h.name }))}
          ambulances={ambulances.map((a) => ({ ...a, etaLabel: a.etaSeconds != null ? formatEta(a.etaSeconds, t.common.min) : undefined, highlight: active.some((c) => c.ambulanceId === a.id && c.priority === "P1") }))}
          incidents={incidents.map((i) => ({ id: i.id, lat: i.lat, lng: i.lng, label: `${i.code} · ${i.address}` }))}
        />
        <Card>
          <CardHeader>
            <CardTitle>{t.command.exceptions}</CardTitle>
            <Link href="/alerts" className="text-xs text-info hover:underline">
              {t.common.viewAll}
            </Link>
          </CardHeader>
          <CardContent className="max-h-[460px] overflow-y-auto">
            <AlertsList alerts={alerts.map(toAlertRow)} canManage={can(user.role, "alerts:manage")} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.command.hospitalLoads}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t.analytics.hospital}</TH>
                <TH>{t.command.incoming}</TH>
                <TH>{t.command.criticalIncoming}</TH>
                <TH>{t.command.activeEd}</TH>
                <TH>{t.command.avgHandover}</TH>
                <TH>{t.analytics.resourceConstraints}</TH>
              </TR>
            </THead>
            <TBody>
              {loads.map((h) => (
                <TR key={h.id}>
                  <TD className="font-semibold">{locale === "ar" ? h.nameAr : h.name}</TD>
                  <TD className="tabular">{h.load.incoming}</TD>
                  <TD className="tabular">{h.load.criticalIncoming ? <span className="font-semibold text-critical">{h.load.criticalIncoming}</span> : 0}</TD>
                  <TD className="w-56">
                    <div className="flex items-center gap-2 text-xs tabular">
                      <Progress value={h.occupancyPct} tone={h.occupancyPct > 85 ? "critical" : h.occupancyPct > 65 ? "warning" : "stable"} />
                      {h.occupancyPct}%
                    </div>
                  </TD>
                  <TD className="ltr tabular">{formatMin(h.load.avgHandoverMin, t.common.min)}</TD>
                  <TD>
                    <div className="flex flex-wrap gap-1">
                      {h.constrained.length ? h.constrained.map((r) => <Badge key={r.type} variant={r.status === "UNAVAILABLE" ? "critical" : "warning"}>{t.enums.resource[r.type]}</Badge>) : <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{t.command.criticalPatients}</CardTitle>
            <Badge variant="critical">{critical.length}</Badge>
          </CardHeader>
          <CardContent>
            {critical.length ? (
              <ul className="divide-y">
                {critical.map((c) => (
                  <li key={c.id} className="py-2">
                    <Link href={`/cases/${c.id}`} className="flex items-center justify-between gap-2 text-sm hover:underline">
                      <span className="flex items-center gap-2">
                        <PriorityBadge p={c.priority} /> <span className="ltr">{c.patientLabel}</span>
                      </span>
                      <span className="ltr text-xs tabular">{c.ambulance} · {c.arrivedAt ? "✓" : formatEta(c.etaSeconds, t.common.min)}</span>
                    </Link>
                    <div className="truncate text-[11px] text-muted-foreground">{c.chiefComplaint}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>{t.common.none}</Empty>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.command.unacknowledged}</CardTitle>
            <Badge variant="warning">{unack.length}</Badge>
          </CardHeader>
          <CardContent>
            {unack.length ? (
              <ul className="divide-y">
                {unack.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <Link href={`/cases/${c.id}`} className="flex items-center gap-2 hover:underline">
                      <PriorityBadge p={c.priority} /> <span className="ltr">{c.code}</span>
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {c.destination?.name} · {c.preAlertSentAt ? minutesSince(c.preAlertSentAt) : 0} {t.common.min}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>{t.common.none}</Empty>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.command.activeIncidents}</CardTitle>
          </CardHeader>
          <CardContent>
            {incidents.length ? (
              <ul className="divide-y">
                {incidents.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <Link href={`/incidents/${i.id}`} className="hover:underline">
                      <T k={`enums.incidentType.${i.type}`} /> {i.isMassCasualty ? <Badge variant="criticalSolid">MCI</Badge> : null}
                      <div className="text-[11px] text-muted-foreground">{i.address}</div>
                    </Link>
                    <span className="text-xs tabular text-muted-foreground">
                      {t.incidents.missions}: {i._count.missions} · {t.incidents.patients}: {i._count.encounters}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>{t.common.none}</Empty>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.command.activeCases}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t.cases.code}</TH>
                <TH>{t.caseView.patient}</TH>
                <TH>{t.common.status}</TH>
                <TH>{t.caseView.ambulance}</TH>
                <TH>{t.caseView.hospital}</TH>
                <TH>{t.caseView.eta}</TH>
              </TR>
            </THead>
            <TBody>
              {active.map((c) => (
                <TR key={c.id}>
                  <TD>
                    <Link href={`/cases/${c.id}`} className="ltr font-mono text-xs text-info hover:underline">
                      {c.code}
                    </Link>
                  </TD>
                  <TD className="flex items-center gap-2">
                    <PriorityBadge p={c.priority} /> <span className="ltr">{c.patientLabel}</span>
                  </TD>
                  <TD>
                    <EncounterStatusBadge s={c.status} />
                  </TD>
                  <TD className="ltr">{c.ambulance}</TD>
                  <TD className="text-xs">{c.destination?.name ?? "—"}</TD>
                  <TD className="ltr tabular">{c.arrivedAt ? "—" : formatEta(c.etaSeconds, t.common.min)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
