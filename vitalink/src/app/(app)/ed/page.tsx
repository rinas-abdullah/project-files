import Link from "next/link";
import { notFound } from "next/navigation";
import { Ambulance, AlertTriangle, BedDouble, CircleCheck, ClipboardList, Clock, Siren, Users } from "lucide-react";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { formatEta } from "@/lib/i18n/format";
import { can } from "@/lib/rbac";
import { INCOMING_STATUSES, OPEN_STATUSES, openAlerts, scopedEncounters, toAlertRow, toCard, mapHospitals } from "@/lib/queries";
import { Kpi, Empty } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveRefresh } from "@/components/live-provider";
import { IncomingCaseCard } from "@/components/ed/case-card";
import { AlertsList } from "@/components/shared/alerts-list";
import { ResourceBadge } from "@/components/shared/status";
import { LiveMap } from "@/components/maps/live-map";
import { CaseList, FocusPanel, StatusTile } from "@/components/ed/board";
import { CaseMap, PreparationPanel } from "@/components/case/panels";
import { getCaseDetail } from "@/lib/case-detail";

export default async function EdDashboard({ searchParams }: { searchParams: Promise<{ h?: string; case?: string }> }) {
  const user = await requirePermission("case:acknowledge");
  const { t, locale } = await getDict();
  const { h, case: caseParam } = await searchParams;
  const hospitals = await prisma.hospital.findMany({ orderBy: { name: "asc" } });
  // Hospital users are locked to their own ED; platform admins can switch.
  const hospitalId = user.orgType === "HOSPITAL" ? user.hospitalId : h ?? hospitals[0]?.id;
  if (!hospitalId) notFound();
  const hospital = hospitals.find((x) => x.id === hospitalId)!;
  const scopeUser = user.orgType === "HOSPITAL" ? user : { ...user, orgType: "HOSPITAL" as const, hospitalId };

  const [incomingRows, arrivedRows, divertedRows, resources, alerts, allHospitals] = await Promise.all([
    scopedEncounters(scopeUser, { destinationHospitalId: hospitalId, status: { in: [...INCOMING_STATUSES] } }),
    scopedEncounters(scopeUser, { destinationHospitalId: hospitalId, status: { in: ["ARRIVED", "HANDOVER"] } }),
    scopedEncounters(scopeUser, { destinationHospitalId: { not: hospitalId }, destinationHistory: { some: { fromHospitalId: hospitalId } }, status: { in: [...OPEN_STATUSES] } }, 10),
    prisma.hospitalResource.findMany({ where: { hospitalId }, orderBy: { type: "asc" } }),
    openAlerts(scopeUser, 20),
    mapHospitals(),
  ]);
  const incoming = incomingRows.map(toCard).sort((a, b) => a.priority.localeCompare(b.priority) || (a.etaSeconds ?? 1e9) - (b.etaSeconds ?? 1e9));
  const arrived = arrivedRows.map(toCard);
  const diverted = divertedRows.map(toCard);
  const unack = incoming.filter((c) => !c.acknowledgedAt).length;
  const critical = [...incoming, ...arrived].filter((c) => c.priority === "P1").length;
  const nextEta = incoming.reduce<number | null>((m, c) => (c.etaSeconds != null && (m == null || c.etaSeconds < m) ? c.etaSeconds : m), null);
  const available = resources.filter((r) => r.status === "AVAILABLE").length;
  const canAck = can(user.role, "case:acknowledge");
  const board = [...incoming, ...arrived];
  const selected = board.find((c) => c.id === caseParam) ?? board[0] ?? null;
  const detail = selected ? await getCaseDetail(user, selected.id) : null;
  const hrefBase = `/ed?${user.orgType !== "HOSPITAL" ? `h=${hospitalId}&` : ""}case=`;
  const awaitingPrep = incoming.filter((c) => c.acknowledgedAt && c.readiness !== "READY").length;
  const ready = incoming.filter((c) => c.readiness === "READY").length;
  const received = board.filter((c) => c.acknowledgedAt).length;
  const b = t.ed.board;

  return (
    <div className="space-y-5">
      <LiveRefresh />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-navy-800">
            <Ambulance className="size-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold">{b.title}</h1>
            <p className="text-sm text-muted-foreground">
              {t.ed.title} · {locale === "ar" ? hospital.nameAr : hospital.name}
            </p>
          </div>
        </div>
        {user.orgType !== "HOSPITAL" ? (
          <div className="flex flex-wrap gap-1">
            {hospitals.map((x) => (
              <Link key={x.id} href={`/ed?h=${x.id}`} className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${x.id === hospitalId ? "bg-navy-900 text-white" : "bg-white hover:bg-muted"}`}>
                {x.code}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatusTile label={b.enRoute} value={incoming.length} tone="orange" icon={<Ambulance className="size-5" />} testId="kpi-incoming-patients" />
        <StatusTile label={b.awaitingPrep} value={awaitingPrep} tone="blue" icon={<ClipboardList className="size-5" />} />
        <StatusTile label={b.ready} value={ready} tone="green" icon={<BedDouble className="size-5" />} />
        <StatusTile label={b.received} value={received} tone="teal" icon={<CircleCheck className="size-5" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
        <CaseList cases={board} selectedId={selected?.id ?? null} hrefBase={hrefBase} />
        {selected ? <FocusPanel c={selected} detail={detail} canAck={canAck} /> : <Empty>{b.select}</Empty>}
        <div className="space-y-4">
          {detail ? (
            <section className="rounded-2xl border bg-white p-3">
              <h2 className="px-1.5 pb-2 text-[15px] font-bold">{b.location}</h2>
              <CaseMap c={detail} className="h-56 overflow-hidden rounded-xl" />
            </section>
          ) : null}
          {detail ? <PreparationPanel c={detail} canEdit={can(user.role, "case:prepare") && (user.orgType === "PLATFORM" || user.hospitalId === detail.destination?.id)} /> : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label={t.ed.incomingAmbulances} value={new Set(incoming.map((c) => c.ambulance)).size} icon={<Ambulance className="size-4" />} testId="kpi-incoming-ambulances" />
        <Kpi label={t.ed.incomingPatients} value={incoming.length} icon={<Users className="size-4" />} />
        <Kpi label={t.ed.criticalCases} value={critical} tone={critical ? "critical" : "default"} icon={<Siren className="size-4" />} />
        <Kpi label={t.ed.nextArrival} value={<span className="ltr">{formatEta(nextEta, t.common.min)}</span>} tone="info" icon={<Clock className="size-4" />} />
        <Kpi label={t.ed.unacknowledged} value={unack} tone={unack ? "warning" : "stable"} icon={<AlertTriangle className="size-4" />} testId="kpi-unack" />
        <Kpi label={t.ed.availableResources} value={`${available}/${resources.length}`} tone={available < resources.length / 2 ? "warning" : "stable"} icon={<BedDouble className="size-4" />} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-5">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {b.all} <span className="ms-1 text-foreground">({incoming.length})</span>
            </h2>
            {incoming.length === 0 ? (
              <Empty>{t.ed.noIncoming}</Empty>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2" data-testid="incoming-board">
                {incoming.map((c) => (
                  <IncomingCaseCard key={c.id} c={c} canAck={canAck} />
                ))}
              </div>
            )}
          </section>
          {arrived.length ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t.ed.arrivedQueue}</h2>
              <div className="grid gap-3 lg:grid-cols-2">
                {arrived.map((c) => (
                  <IncomingCaseCard key={c.id} c={c} canAck={canAck} />
                ))}
              </div>
            </section>
          ) : null}
          {diverted.length ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t.ed.divertedAway}</h2>
              <div className="grid gap-3 lg:grid-cols-2">
                {diverted.map((c) => (
                  <IncomingCaseCard key={c.id} c={c} canAck={false} divertedAway />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <div className="space-y-5">
          <LiveMap
            className="h-72"
            showGeofence
            hospitals={allHospitals.map((x) => ({ ...x, label: locale === "ar" ? x.nameAr : x.name, highlight: x.id === hospitalId }))}
            ambulances={incoming.map((c) => ({ id: c.ambulanceId, callSign: c.ambulance, lat: c.ambulanceLat, lng: c.ambulanceLng, status: "TRANSPORTING", etaLabel: formatEta(c.etaSeconds, t.common.min), highlight: c.priority === "P1" }))}
          />
          <Card>
            <CardHeader>
              <CardTitle>{t.ed.alerts}</CardTitle>
              <Link href="/alerts" className="text-xs text-info hover:underline">
                {t.common.viewAll}
              </Link>
            </CardHeader>
            <CardContent>
              <AlertsList alerts={alerts.map(toAlertRow)} canManage={can(user.role, "alerts:manage")} compact />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t.ed.resources}</CardTitle>
              {can(user.role, "hospital:resources") ? (
                <Link href="/ed/resources" className="text-xs text-info hover:underline">
                  {t.resources.update}
                </Link>
              ) : null}
            </CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {resources.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2">
                    <span>{t.enums.resource[r.type]}</span>
                    <span className="flex items-center gap-2">
                      {r.available != null && r.total != null ? (
                        <span className="text-xs tabular text-muted-foreground">
                          {r.available}/{r.total}
                        </span>
                      ) : null}
                      <ResourceBadge s={r.status} />
                    </span>
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
