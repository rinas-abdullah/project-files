import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { formatEta } from "@/lib/i18n/format";
import { OPEN_STATUSES, commandKpis, mapAmbulances, mapHospitals, scopedEncounters, toCard } from "@/lib/queries";
import { encounterScope } from "@/lib/scope";
import { PageHeader, Kpi, Empty } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { AmbulanceStatusBadge, EncounterStatusBadge, PriorityBadge, ReadinessBadge } from "@/components/shared/status";
import { LiveRefresh } from "@/components/live-provider";
import { LiveMap } from "@/components/maps/live-map";
import { DispatchForm, RecommendationApproval, type PendingRec } from "@/components/dispatch/forms";
import { DivertDialog } from "@/components/case/panels";

export default async function DispatchPage() {
  const user = await requirePermission("dispatch:manage");
  const { t, locale } = await getDict();
  const [kpis, ambulances, hospitals, activeRows, recs] = await Promise.all([
    commandKpis(user),
    mapAmbulances(user.orgType === "EMS" ? { organizationId: user.organizationId } : {}),
    mapHospitals(),
    scopedEncounters(user, { status: { in: [...OPEN_STATUSES] } }),
    prisma.destinationRecommendation.findMany({
      where: { status: "PENDING", encounter: { AND: [encounterScope(user), { preAlertSentAt: { not: null }, status: { in: [...OPEN_STATUSES] } }] } },
      include: { encounter: { include: { patient: true, destinationHospital: true } }, recommendedHospital: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const active = activeRows.map(toCard);
  const pending: PendingRec[] = recs
    .filter((r) => r.recommendedHospitalId !== r.encounter.destinationHospitalId)
    .map((r) => {
      const ranking = r.ranking as unknown as { hospitalId: string; etaSeconds: number; reasons: PendingRec["reasons"] }[];
      const top = ranking.find((x) => x.hospitalId === r.recommendedHospitalId);
      return {
        id: r.id,
        encounterId: r.encounterId,
        code: r.encounter.code,
        priority: r.encounter.priority,
        patient: r.encounter.patient.isUnknown ? r.encounter.patient.temporaryId ?? "—" : r.encounter.patient.fullName ?? "—",
        from: r.encounter.destinationHospital?.name ?? null,
        to: r.recommendedHospital.name,
        score: Math.round(r.score),
        etaSeconds: top?.etaSeconds ?? null,
        reasons: top?.reasons ?? [],
        requestedBy: r.requestedByName,
      };
    });
  const available = ambulances.filter((a) => a.status === "AVAILABLE");
  const hospitalOpts = hospitals.map((h) => ({ id: h.id, name: h.name, nameAr: h.nameAr, lat: h.lat, lng: h.lng, geofenceRadiusM: h.geofenceRadiusM, approachRadiusM: h.approachRadiusM }));

  return (
    <div className="space-y-5">
      <LiveRefresh />
      <PageHeader title={t.dispatch.title} subtitle={user.organizationName} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label={t.command.activeAmbulances} value={kpis.activeAmbulances} />
        <Kpi label={t.command.activeCases} value={kpis.activeCases} />
        <Kpi label={t.command.criticalCases} value={kpis.criticalCases} tone={kpis.criticalCases ? "critical" : "default"} />
        <Kpi label={t.dispatch.availableAmbulances} value={`${available.length}/${ambulances.length}`} tone="stable" />
      </div>

      {pending.length ? (
        <Card className="border-violet-200">
          <CardHeader>
            <CardTitle>{t.dispatch.pendingRecommendations}</CardTitle>
            <Badge variant="ai">{t.common.decisionSupportOnly}</Badge>
          </CardHeader>
          <CardContent className="grid gap-3 lg:grid-cols-2">
            {pending.map((r) => (
              <RecommendationApproval key={r.id} rec={r} />
            ))}
          </CardContent>
        </Card>
      ) : null}

          <Card>
        <CardHeader>
          <CardTitle>{t.dispatch.activeMissions}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {active.length === 0 ? (
            <div className="p-4">
              <Empty>{t.common.noData}</Empty>
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>{t.caseView.ambulance}</TH>
                  <TH>{t.caseView.patient}</TH>
                  <TH>{t.common.status}</TH>
                  <TH>{t.caseView.hospital}</TH>
                  <TH>{t.caseView.eta}</TH>
                  <TH>{t.ed.ack}</TH>
                  <TH>{t.common.actions}</TH>
                </TR>
              </THead>
              <TBody>
                {active.map((c) => (
                  <TR key={c.id}>
                    <TD className="ltr font-semibold">{c.ambulance}</TD>
                    <TD>
                      <Link href={`/cases/${c.id}`} className="flex items-center gap-2 hover:underline">
                        <PriorityBadge p={c.priority} /> <span className="ltr">{c.patientLabel}</span>
                      </Link>
                      <div className="max-w-72 truncate text-[11px] text-muted-foreground">{c.chiefComplaint}</div>
                    </TD>
                    <TD>
                      <EncounterStatusBadge s={c.status} />
                    </TD>
                    <TD className="text-xs">
                      {c.destination ? (locale === "ar" ? c.destination.nameAr : c.destination.name) : "—"}
                      <div className="mt-0.5">
                        <ReadinessBadge s={c.readiness} />
                      </div>
                    </TD>
                    <TD className="ltr tabular">{c.arrivedAt ? "—" : formatEta(c.etaSeconds, t.common.min)}</TD>
                    <TD>{c.acknowledgedAt ? <Badge variant="stable">{t.ed.ack}</Badge> : c.preAlertSentAt ? <Badge variant="critical">{t.ed.notAck}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TD>
                    <TD>
                      {!["ARRIVED", "HANDOVER"].includes(c.status) ? <DivertDialog c={{ id: c.id, destination: c.destination ? { ...hospitalOpts.find((h) => h.id === c.destination!.id)! } : null, hospitals: hospitalOpts }} /> : null}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="min-w-0 space-y-5">
          <LiveMap
            className="h-[420px]"
            showGeofence
            hospitals={hospitals.map((h) => ({ ...h, label: locale === "ar" ? h.nameAr : h.name }))}
            ambulances={ambulances.map((a) => ({ ...a, etaLabel: a.etaSeconds != null ? formatEta(a.etaSeconds, t.common.min) : undefined }))}
          />
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>{t.dispatch.newIncident}</CardTitle>
            </CardHeader>
            <CardContent>
              <DispatchForm ambulances={available.map((a) => ({ id: a.id, callSign: a.callSign, baseName: a.baseName }))} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t.dispatch.fleet}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {ambulances.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2">
                    <span>
                      <span className="ltr font-semibold">{a.callSign}</span> <span className="text-xs text-muted-foreground">· {a.unitType} · {a.baseName}</span>
                    </span>
                    <AmbulanceStatusBadge s={a.status} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
