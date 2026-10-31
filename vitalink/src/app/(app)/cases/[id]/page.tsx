import Link from "next/link";
import { notFound } from "next/navigation";
import { Ambulance, ArrowRightLeft, Hospital } from "lucide-react";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { formatDateTime } from "@/lib/i18n/format";
import { getCaseDetail } from "@/lib/case-detail";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { ConditionBadge, DeliveryBadge, EncounterStatusBadge, IdentityBadge, PriorityBadge, ReadinessBadge, T } from "@/components/shared/status";
import { LiveRefresh } from "@/components/live-provider";
import {
  AcknowledgeButton,
  AlertList,
  CaseMap,
  CompletenessCard,
  DestinationPanel,
  DivertDialog,
  EtaBlock,
  HandoverPanel,
  HealthProfileCard,
  JourneyStepper,
  MediaGallery,
  PreparationPanel,
  Timeline,
  TriagePanel,
  VitalTiles,
} from "@/components/case/panels";
import { VitalsChart } from "@/components/charts/vitals-chart";
import { cn } from "@/lib/utils";

const TABS = ["overview", "vitals", "timeline", "interventions", "medications", "media", "history", "triage", "destination", "preparation", "handover", "audit"] as const;
type Tab = (typeof TABS)[number];

export default async function CaseView({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const user = await requirePermission("case:read");
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  const tab: Tab = (TABS as readonly string[]).includes(rawTab ?? "") ? (rawTab as Tab) : "overview";
  const c = await getCaseDetail(user, id);
  if (!c) notFound();
  const { t, locale } = await getDict();

  const isDestHospital = user.orgType === "PLATFORM" || (user.orgType === "HOSPITAL" && user.hospitalId === c.destination?.id);
  const canAck = can(user.role, "case:acknowledge") && isDestHospital && !c.acknowledgedAt && !!c.preAlertSentAt && !["COMPLETED", "CANCELLED"].includes(c.status);
  const canDivert = can(user.role, "destination:change") && !["ARRIVED", "HANDOVER", "COMPLETED", "CANCELLED"].includes(c.status);
  const latestAck = c.acknowledgments.at(-1);

  if (tab === "history" && c.patient.health) {
    await audit({ id: user.id, email: user.email, role: user.role, organizationId: user.organizationId }, "patient.health_record_viewed", "Patient", c.patient.id, undefined, { encounterId: c.id });
  }
  const auditRows =
    tab === "audit" && can(user.role, "audit:read")
      ? await prisma.auditEvent.findMany({
          where: { OR: [{ entityId: c.id }, { entityId: c.patient.id }, { after: { path: ["encounterId"], equals: c.id } }] },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
      : null;

  const tabLabel = (k: Tab) => t.caseView.tabs[k];

  return (
    <div className="space-y-4">
      <LiveRefresh encounterId={c.id} />
      {c.divertedAway ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-warning-soft px-4 py-3 text-sm font-semibold text-amber-900" data-testid="case-diverted">
          <ArrowRightLeft className="size-4" /> {t.destination.diverted} — {t.destination.divertedTo} {c.destination?.name}
        </div>
      ) : null}

      {/* Patient header */}
      <div className="rounded-xl border bg-card p-4 shadow-[0_1px_2px_rgba(11,26,51,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge p={c.priority} long className="px-2.5 py-1 text-xs" />
              <EncounterStatusBadge s={c.status} />
              <ConditionBadge s={c.conditionTrend} />
              <IdentityBadge unknown={c.patient.isUnknown} verified={c.patient.verified} />
            </div>
            <h1 className="ltr mt-2 text-start text-2xl font-semibold tracking-tight" data-testid="case-patient">
              {c.patient.label}
            </h1>
            <div className="mt-1 text-sm text-muted-foreground">
              {c.patient.age != null ? `${c.patient.age}${c.patient.ageEstimated ? "~" : ""} ${t.common.years}` : t.common.unknown} · <T k={`enums.sex.${c.patient.sex}`} />
              {c.patient.nationalIdLast4 ? <span className="ltr"> · {t.caseView.nationalId} ••••••{c.patient.nationalIdLast4}</span> : null}
              {c.patient.temporaryId && !c.patient.isUnknown ? <span className="ltr"> · {c.patient.temporaryId}</span> : null}
              <span className="ltr"> · {c.code}</span>
            </div>
            <div className="mt-2 text-sm">
              <span className="text-muted-foreground">{t.caseView.chiefComplaint}: </span>
              <span className="font-medium">{c.chiefComplaint}</span>
            </div>
          </div>
          <div className="grid min-w-[280px] gap-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Ambulance className="size-4" /> {t.caseView.ambulance}
              </span>
              <span className="ltr font-semibold">{c.mission.ambulance.callSign}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Hospital className="size-4" /> {t.caseView.hospital}
              </span>
              <span className="font-semibold">{c.destination ? (locale === "ar" ? c.destination.nameAr : c.destination.name) : "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{t.caseView.readiness}</span>
              <ReadinessBadge s={c.readiness} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{t.ed.ack}</span>
              {c.acknowledgedAt && latestAck ? (
                <span className="text-xs font-medium text-teal-700" data-testid="ack-status">
                  {latestAck.by} · {t.roles[latestAck.role as keyof typeof t.roles]} · {formatDateTime(c.acknowledgedAt, locale, { dateStyle: undefined, timeStyle: "medium" })}
                </span>
              ) : (
                <Badge variant="critical" data-testid="ack-status">
                  {t.ed.notAck}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{t.enums.event.HOSPITAL_NOTIFIED}</span>
              <DeliveryBadge s={c.preAlertDelivery} />
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {canAck ? <AcknowledgeButton encounterId={c.id} size="lg" /> : null}
          {canDivert ? <DivertDialog c={c} /> : null}
        </div>
      </div>

      {/* Tabs */}
      <nav className="-mx-1 flex gap-1 overflow-x-auto border-b px-1" data-testid="case-tabs">
        {TABS.map((k) => (
          <Link
            key={k}
            href={`/cases/${c.id}?tab=${k}`}
            scroll={false}
            className={cn("whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium", tab === k ? "border-navy-900 text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
            data-testid={`tab-${k}`}
          >
            {tabLabel(k)}
            {k === "media" && c.media.length ? <span className="ms-1 text-xs text-muted-foreground">({c.media.length})</span> : null}
          </Link>
        ))}
      </nav>

      {tab === "overview" ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
          <div className="min-w-0 space-y-4">
            <AlertList alerts={c.alerts} />
            <VitalTiles latest={c.latest} />
            <Card>
              <CardHeader>
                <CardTitle>{t.caseView.journey}</CardTitle>
              </CardHeader>
              <CardContent>
                <JourneyStepper c={c} />
              </CardContent>
            </Card>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t.caseView.tabs.interventions}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  {c.interventions.length ? c.interventions.map((i) => <div key={i.id}>• <T k={`enums.intervention.${i.type}`} /> <span className="text-xs text-muted-foreground">{formatDateTime(i.at, locale, { dateStyle: undefined, timeStyle: "short" })}</span></div>) : <div className="text-muted-foreground">{t.caseView.noInterventions}</div>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t.caseView.tabs.medications}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  {c.medications.length ? c.medications.map((m) => <div key={m.id} className="ltr text-start">• {m.name} {m.dose} {m.route} <span className="text-xs text-muted-foreground">{formatDateTime(m.at, locale, { dateStyle: undefined, timeStyle: "short" })}</span></div>) : <div className="text-muted-foreground">{t.caseView.noMedications}</div>}
                </CardContent>
              </Card>
            </div>
            {c.patient.health ? <HealthProfileCard c={c} /> : null}
            <Card>
              <CardHeader>
                <CardTitle>{t.caseView.tabs.timeline}</CardTitle>
              </CardHeader>
              <CardContent>
                <Timeline events={c.events} limit={10} />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <EtaBlock c={c} />
            <CaseMap c={c} className="h-80" />
            <CompletenessCard c={c} />
            <Card>
              <CardContent className="space-y-1.5 pt-4 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{t.caseView.registration}</span>
                  <span className="font-medium" data-testid="registration-status">
                    <T k={`enums.registration.${c.registration.status}`} />
                  </span>
                </div>
                {c.registration.ref ? <div className="ltr text-end text-xs text-muted-foreground">{c.registration.ref}</div> : null}
                <div className="text-[11px] text-muted-foreground">{t.caseView.registrationSimulated}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "vitals" ? (
        <div className="space-y-4">
          <VitalTiles latest={c.latest} />
          <VitalsChart points={c.vitals} />
          <Card>
            <CardContent className="pt-4">
              <Table>
                <THead>
                  <TR>
                    <TH>{t.common.time}</TH>
                    <TH>{t.caseView.type}</TH>
                    <TH>{t.caseView.value}</TH>
                    <TH>{t.caseView.unit}</TH>
                    <TH>{t.caseView.source}</TH>
                    <TH>{t.common.status}</TH>
                  </TR>
                </THead>
                <TBody>
                  {[...c.vitals].reverse().slice(0, 150).map((v) => (
                    <TR key={v.id}>
                      <TD className="tabular text-xs">{formatDateTime(v.at, locale, { dateStyle: undefined, timeStyle: "medium" })}</TD>
                      <TD>
                        <T k={`enums.vital.${v.type}`} />
                      </TD>
                      <TD className="ltr font-semibold tabular">{v.type === "BLOOD_PRESSURE" ? `${Math.round(v.value)}/${Math.round(v.value2 ?? 0)}` : v.value}</TD>
                      <TD className="ltr text-xs">{v.unit}</TD>
                      <TD className="text-xs">
                        <T k={`enums.vitalSource.${v.source}`} />
                      </TD>
                      <TD>
                        <Badge variant={v.status === "CRITICAL" ? "critical" : v.status === "ABNORMAL" ? "warning" : "stable"}>
                          <T k={`enums.vitalStatus.${v.status}`} />
                        </Badge>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              {!c.vitals.length ? <div className="p-4 text-sm text-muted-foreground">{t.caseView.noVitals}</div> : null}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "timeline" ? (
        <Card>
          <CardContent className="pt-5">
            <Timeline events={c.events} />
          </CardContent>
        </Card>
      ) : null}

      {tab === "interventions" ? (
        <Card>
          <CardContent className="pt-4">
            <Table>
              <THead>
                <TR>
                  <TH>{t.caseView.type}</TH>
                  <TH>{t.caseView.performedAt}</TH>
                  <TH>{t.caseView.performedBy}</TH>
                  <TH>{t.common.notes}</TH>
                </TR>
              </THead>
              <TBody>
                {c.interventions.map((i) => (
                  <TR key={i.id}>
                    <TD className="font-medium">
                      <T k={`enums.intervention.${i.type}`} />
                    </TD>
                    <TD className="tabular text-xs">{formatDateTime(i.at, locale)}</TD>
                    <TD>{i.by}</TD>
                    <TD className="text-xs text-muted-foreground">{i.notes}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            {!c.interventions.length ? <div className="p-4 text-sm text-muted-foreground">{t.caseView.noInterventions}</div> : null}
          </CardContent>
        </Card>
      ) : null}

      {tab === "medications" ? (
        <Card>
          <CardContent className="pt-4">
            <Table>
              <THead>
                <TR>
                  <TH>{t.caseView.medication}</TH>
                  <TH>{t.caseView.dose}</TH>
                  <TH>{t.caseView.route}</TH>
                  <TH>{t.common.time}</TH>
                  <TH>{t.caseView.administeredBy}</TH>
                  <TH>{t.common.notes}</TH>
                </TR>
              </THead>
              <TBody>
                {c.medications.map((m) => (
                  <TR key={m.id}>
                    <TD className="ltr font-medium">{m.name}</TD>
                    <TD className="ltr">{m.dose}</TD>
                    <TD className="ltr">{m.route}</TD>
                    <TD className="tabular text-xs">{formatDateTime(m.at, locale)}</TD>
                    <TD>{m.by}</TD>
                    <TD className="text-xs text-muted-foreground">{m.notes}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            {!c.medications.length ? <div className="p-4 text-sm text-muted-foreground">{t.caseView.noMedications}</div> : null}
          </CardContent>
        </Card>
      ) : null}

      {tab === "media" ? (can(user.role, "media:read") ? <MediaGallery c={c} /> : <div className="text-sm text-muted-foreground">{t.common.restricted}</div>) : null}

      {tab === "history" ? (
        can(user.role, "health:read") ? (
          <div className="space-y-4">
            <HealthProfileCard c={c} />
            <Card>
              <CardHeader>
                <CardTitle>{t.paramedic.identify.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {c.patient.identities.length ? (
                  <ul className="space-y-1.5 text-sm">
                    {c.patient.identities.map((i) => (
                      <li key={i.id} className="flex flex-wrap items-center gap-2">
                        <Badge variant={i.status === "VERIFIED" ? "stable" : "critical"}>
                          <T k={`enums.identity.${i.status}`} />
                        </Badge>
                        <span className="ltr">{i.provider}</span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(i.at, locale)}</span>
                        {i.ref ? <span className="ltr text-xs text-muted-foreground">{i.ref}</span> : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-muted-foreground">{t.enums.identity.UNIDENTIFIED}</div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">{t.common.restricted}</div>
        )
      ) : null}

      {tab === "triage" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <TriagePanel c={c} canRun={can(user.role, "triage:run")} canDecide={can(user.role, "triage:decide")} />
          <Card>
            <CardHeader>
              <CardTitle>{t.triage.history}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <TH>{t.common.time}</TH>
                    <TH>{t.triage.suggested}</TH>
                    <TH>{t.triage.risk}</TH>
                    <TH>{t.triage.decided}</TH>
                    <TH>{t.triage.finalPriority}</TH>
                  </TR>
                </THead>
                <TBody>
                  {c.triage.map((a) => (
                    <TR key={a.id}>
                      <TD className="text-xs tabular">{formatDateTime(a.at, locale)}</TD>
                      <TD>
                        <PriorityBadge p={a.suggested} />
                      </TD>
                      <TD className="tabular">{a.risk}</TD>
                      <TD className="text-xs">
                        <T k={`enums.triageDecision.${a.decision}`} />
                        {a.overrideReason ? <div className="text-muted-foreground">{a.overrideReason}</div> : null}
                      </TD>
                      <TD>{a.finalPriority ? <PriorityBadge p={a.finalPriority} /> : "—"}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "destination" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <DestinationPanel c={c} canRecommend={can(user.role, "destination:recommend")} canSelect={can(user.role, "destination:select_initial")} canChange={can(user.role, "destination:change")} />
          <CaseMap c={c} className="h-[420px]" />
        </div>
      ) : null}

      {tab === "preparation" ? <PreparationPanel c={c} canEdit={can(user.role, "case:prepare") && isDestHospital} /> : null}

      {tab === "handover" ? <HandoverPanel c={c} canStart={can(user.role, "handover:start")} canReceive={can(user.role, "handover:receive") && isDestHospital} /> : null}

      {tab === "audit" ? (
        auditRows ? (
          <Card>
            <CardHeader>
              <CardTitle>{t.caseView.audit.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <TH>{t.common.time}</TH>
                    <TH>{t.audit.user}</TH>
                    <TH>{t.audit.action}</TH>
                    <TH>{t.audit.entity}</TH>
                  </TR>
                </THead>
                <TBody>
                  {auditRows.map((a) => (
                    <TR key={a.id}>
                      <TD className="text-xs tabular">{formatDateTime(a.createdAt, locale, { timeStyle: "medium" })}</TD>
                      <TD className="text-xs">
                        <span className="ltr">{a.userEmail}</span>
                        {a.role ? <div className="text-muted-foreground">{t.roles[a.role]}</div> : null}
                      </TD>
                      <TD className="ltr font-mono text-xs">{a.action}</TD>
                      <TD className="ltr text-xs">{a.entityType}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="text-sm text-muted-foreground">{t.common.restricted}</div>
        )
      ) : null}
    </div>
  );
}
