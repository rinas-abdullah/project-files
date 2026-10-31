import Link from "next/link";
import { notFound } from "next/navigation";
import { Ambulance, Hospital, MapPin, UserPlus, Plus } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { formatDateTime } from "@/lib/i18n/format";
import { getCaseDetail } from "@/lib/case-detail";
import { can } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConditionBadge, DeliveryBadge, EncounterStatusBadge, IdentityBadge, PriorityBadge, ReadinessBadge, T } from "@/components/shared/status";
import { LiveRefresh } from "@/components/live-provider";
import { OutboxPanel, OutboxProvider, ConnectionBadge } from "@/components/paramedic/outbox";
import {
  CreatePatientDialog,
  IdentifyDialog,
  VitalsDialog,
  InterventionDialog,
  MedicationDialog,
  MediaDialog,
  NoteDialog,
  ConditionDialog,
  PriorityDialog,
  PreAlertTile,
  MonitorTile,
} from "@/components/paramedic/actions";
import { TransportControls, ReleaseButton } from "@/components/paramedic/mission";
import { VitalTiles, Timeline, TriagePanel, DestinationPanel, HandoverPanel, CaseMap, EtaBlock, AlertList, HealthProfileCard } from "@/components/case/panels";
import { VitalsChart } from "@/components/charts/vitals-chart";

export default async function ParamedicWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (user.role !== "PARAMEDIC") notFound();
  const { id } = await params;
  const c = await getCaseDetail(user, id);
  if (!c) notFound();
  const { t, locale } = await getDict();
  const siblings = await prisma.patientEncounter.findMany({ where: { missionId: c.mission.id }, include: { patient: true }, orderBy: { createdAt: "asc" } });
  const open = !["COMPLETED", "CANCELLED"].includes(c.status);
  const allClosed = siblings.every((s) => ["COMPLETED", "CANCELLED"].includes(s.status));
  const latestAck = c.acknowledgments.at(-1);

  return (
    <OutboxProvider storageKey={`vl-outbox:${user.id}`}>
      <LiveRefresh />
      <div className="space-y-4">
        {/* Mission header */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-navy-900 px-4 py-3 text-white">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <div className="flex items-center gap-2">
              <Ambulance className="size-5 text-red-400" />
              <span className="ltr text-lg font-semibold">{c.mission.ambulance.callSign}</span>
            </div>
            <div className="text-sm">
              <span className="text-white/60">{t.paramedic.incident}: </span>
              <T k={`enums.incidentType.${c.mission.incident.type}`} />
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <MapPin className="size-4 text-white/60" />
              {c.mission.incident.address}
            </div>
            <div className="ltr text-xs text-white/50" data-testid="mission-code" data-mission-id={c.mission.id}>{c.mission.code}</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
              <T k={`enums.missionStatus.${c.mission.status}`} />
            </Badge>
            <ConnectionBadge />
          </div>
        </div>

        {/* Patient tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">{t.paramedic.patients}:</span>
          {siblings.map((s) => (
            <Link key={s.id} href={`/paramedic/${s.id}`} className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm ${s.id === c.id ? "border-navy-900 bg-navy-900 text-white" : "bg-white hover:bg-muted"}`}>
              <PriorityBadge p={s.priority} /> <span className="ltr">{s.patient.isUnknown ? s.patient.temporaryId : s.patient.fullName}</span>
            </Link>
          ))}
          {open || !c.mission.releasedAt ? (
            <CreatePatientDialog
              missionId={c.mission.id}
              trigger={
                <Button variant="outline" size="sm">
                  <Plus /> {t.paramedic.createPatient}
                </Button>
              }
            />
          ) : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_400px]">
          <div className="min-w-0 space-y-4">
            {/* Current patient */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t.paramedic.currentPatient}</div>
                    <div className="ltr mt-0.5 text-start text-2xl font-semibold" data-testid="patient-label">
                      {c.patient.label}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {c.patient.age != null ? `${c.patient.age}${c.patient.ageEstimated ? "~" : ""} ${t.common.years}` : t.common.unknown} · <T k={`enums.sex.${c.patient.sex}`} />
                      {c.patient.nationalIdLast4 ? <span className="ltr"> · ID ••••••{c.patient.nationalIdLast4}</span> : null}
                      {!c.patient.isUnknown && c.patient.temporaryId ? <span className="ltr"> · {c.patient.temporaryId}</span> : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <PriorityBadge p={c.priority} long className="px-2.5 py-1 text-xs" />
                    <ConditionBadge s={c.conditionTrend} />
                    <IdentityBadge unknown={c.patient.isUnknown} verified={c.patient.verified} />
                    <EncounterStatusBadge s={c.status} />
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">{t.caseView.chiefComplaint}: </span>
                    <span className="font-medium">{c.chiefComplaint}</span>
                  </div>
                  {c.mechanism ? (
                    <div>
                      <span className="text-muted-foreground">{t.caseView.mechanism}: </span>
                      {c.mechanism}
                    </div>
                  ) : null}
                </div>
                {c.patient.health?.allergies.length ? (
                  <div className="mt-3 rounded-lg border border-red-200 bg-critical-soft px-3 py-2 text-sm font-semibold text-red-700">
                    {t.caseView.health.allergies}: <span className="ltr">{c.patient.health.allergies.join(", ")}</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <AlertList alerts={c.alerts} />
            <VitalTiles latest={c.latest} large />

            {open ? (
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.paramedic.quick}</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" data-testid="quick-actions">
                  <IdentifyDialog encounterId={c.id} integrationStatus={c.integrations.NAFATH ?? "NOT_CONFIGURED"} />
                  <VitalsDialog encounterId={c.id} />
                  <InterventionDialog encounterId={c.id} />
                  <MedicationDialog encounterId={c.id} allergies={c.patient.health?.allergies ?? []} />
                  <MediaDialog encounterId={c.id} />
                  <NoteDialog encounterId={c.id} />
                  <ConditionDialog encounterId={c.id} current={c.conditionTrend} />
                  <PriorityDialog encounterId={c.id} current={c.priority} />
                  <MonitorTile encounterId={c.id} running={c.monitorRunning} integrationStatus={c.integrations.MEDICAL_MONITOR ?? "NOT_CONFIGURED"} />
                  <PreAlertTile encounterId={c.id} hasDestination={!!c.destination} sent={!!c.preAlertSentAt} delivery={c.preAlertDelivery} />
                </div>
              </div>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle>{t.caseView.tabs.vitals}</CardTitle>
              </CardHeader>
              <CardContent>
                <VitalsChart points={c.vitals} compact />
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <TriagePanel c={c} canRun={can(user.role, "triage:run")} canDecide={can(user.role, "triage:decide")} />
              <DestinationPanel c={c} canRecommend={can(user.role, "destination:recommend")} canSelect={can(user.role, "destination:select_initial")} canChange={can(user.role, "destination:change")} />
            </div>

            <HealthProfileCard c={c} />

            <Card>
              <CardHeader>
                <CardTitle>{t.caseView.tabs.timeline}</CardTitle>
              </CardHeader>
              <CardContent>
                <Timeline events={c.events} limit={25} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className={c.acknowledgedAt ? "border-teal-300" : c.preAlertSentAt ? "border-amber-300" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hospital className="size-4" /> {t.paramedic.destination}
                </CardTitle>
                <DeliveryBadge s={c.preAlertDelivery} />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-lg font-semibold" data-testid="paramedic-destination">
                  {c.destination ? (locale === "ar" ? c.destination.nameAr : c.destination.name) : <span className="text-muted-foreground">{t.paramedic.noDestination}</span>}
                </div>
                <EtaBlock c={c} />
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t.paramedic.readiness}</span>
                    <span data-testid="paramedic-readiness">
                      <ReadinessBadge s={c.readiness} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between" data-testid="paramedic-ack">
                    <span className="text-muted-foreground">{t.ed.ack}</span>
                    {latestAck && c.acknowledgedAt ? (
                      <Badge variant="stableSolid">
                        {t.paramedic.acknowledged} · {latestAck.by}
                      </Badge>
                    ) : (
                      <Badge variant="muted">{t.paramedic.notAcknowledged}</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t.caseView.registration}</span>
                    <span className="text-xs font-medium">
                      <T k={`enums.registration.${c.registration.status}`} />
                    </span>
                  </div>
                  {c.preAlertSentAt ? (
                    <div className="text-[11px] text-muted-foreground">
                      {t.enums.event.HOSPITAL_NOTIFIED}: {formatDateTime(c.preAlertSentAt, locale)}
                    </div>
                  ) : null}
                </div>
                {c.mission.status === "TRANSPORTING" || c.mission.status === "ON_SCENE" ? <TransportControls missionId={c.mission.id} ambulanceId={c.mission.ambulance.id} transporting={c.mission.status === "TRANSPORTING"} driving={c.mission.driving} /> : null}
              </CardContent>
            </Card>

            <CaseMap c={c} className="h-80" />

            {c.status === "ARRIVED" || c.handover ? <HandoverPanel c={c} canStart={can(user.role, "handover:start")} canReceive={false} /> : null}
            {c.handover?.status === "STARTED" || c.handover?.status === "ACCEPTED" ? <div className="rounded-lg border bg-ai-soft p-3 text-sm text-violet-900">{t.paramedic.handoverWaiting}</div> : null}
            {allClosed && !c.mission.releasedAt ? <ReleaseButton missionId={c.mission.id} /> : null}
            {c.mission.releasedAt ? (
              <div className="rounded-lg border border-teal-300 bg-stable-soft p-3 text-sm font-semibold text-teal-800">
                {t.paramedic.released} · {formatDateTime(c.mission.releasedAt, locale)}{" "}
                <Link href="/paramedic" className="ms-2 text-info underline">
                  <UserPlus className="inline size-4" /> {t.paramedic.newMission}
                </Link>
              </div>
            ) : null}

            <OutboxPanel />
          </div>
        </div>
      </div>
    </OutboxProvider>
  );
}
