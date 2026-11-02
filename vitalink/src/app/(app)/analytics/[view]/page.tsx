import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { formatMin } from "@/lib/i18n/format";
import {
  ambulanceTable,
  completenessBreakdown,
  destinationStats,
  hospitalTable,
  loadEncounters,
  overview,
  qualityStats,
  resourceStats,
  responseStages,
  triageStats,
} from "@/lib/services/metrics";
import { PageHeader, Kpi } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ResourceBadge } from "@/components/shared/status";
import { BarList, ColumnChart, DailyStack } from "@/components/charts/charts";
import { cn, nowMs } from "@/lib/utils";

const VIEWS = ["overview", "ambulances", "hospitals", "flow", "response", "completeness", "triage", "destination", "resources", "quality"] as const;
type View = (typeof VIEWS)[number];

export default async function AnalyticsPage({ params, searchParams }: { params: Promise<{ view: string }>; searchParams: Promise<{ days?: string }> }) {
  const user = await requirePermission("analytics:read");
  const { view: rawView } = await params;
  if (!(VIEWS as readonly string[]).includes(rawView)) notFound();
  const view = rawView as View;
  const { days: rawDays } = await searchParams;
  const days = [7, 30, 60, 90].includes(Number(rawDays)) ? Number(rawDays) : 30;
  const { t, locale } = await getDict();
  const to = new Date(nowMs() + 60_000);
  const from = new Date(to.getTime() - days * 86400_000);
  from.setUTCHours(0, 0, 0, 0);
  const list = await loadEncounters(user, from, to);
  const hospitals = await prisma.hospital.findMany({ select: { id: true, name: true, nameAr: true }, orderBy: { name: "asc" } });
  const hName = (h: { name: string; nameAr: string }) => (locale === "ar" ? h.nameAr : h.name);
  const m = t.common.min;
  const a = t.analytics;

  const o = overview(list, from, to);
  const content = await (async () => {
    switch (view) {
      case "overview":
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-8">
              <Kpi label={a.cases} value={o.cases} testId="analytics-cases" />
              <Kpi label={a.criticalCases} value={o.critical} tone="critical" />
              <Kpi label={a.avgTransport} value={<span className="ltr">{formatMin(o.avgTransportMin, m)}</span>} />
              <Kpi label={a.avgAck} value={<span className="ltr">{formatMin(o.avgAckMin, m)}</span>} />
              <Kpi label={a.avgHandover} value={<span className="ltr">{formatMin(o.avgHandoverMin, m)}</span>} />
              <Kpi label={a.returnToService} value={<span className="ltr">{formatMin(o.avgRtsMin, m)}</span>} />
              <Kpi label={a.destinationChanges} value={o.destinationChanges} tone="warning" />
              <Kpi label={a.completeness} value={`${o.avgCompleteness ?? 0}%`} tone="stable" />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>{a.casesPerDay}</CardTitle>
              </CardHeader>
              <CardContent>
                <DailyStack data={o.days} labels={{ other: `${a.cases} (P2–P4)`, critical: `${a.criticalCases} (P1)` }} />
              </CardContent>
            </Card>
            <div className="grid gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{a.byPriority}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ColumnChart data={o.byPriority} colorBy="priority" label={a.cases} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{a.byIncidentType}</CardTitle>
                </CardHeader>
                <CardContent>
                  <BarList data={o.byType.map((x) => ({ ...x, label: t.enums.incidentType[x.key as keyof typeof t.enums.incidentType] }))} label={a.cases} />
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case "ambulances": {
        const rows = ambulanceTable(list);
        return (
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>{a.views.ambulances}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <THead>
                    <TR>
                      <TH>{a.ambulance}</TH>
                      <TH>{a.cases}</TH>
                      <TH>{a.avgTransport}</TH>
                      <TH>{a.avgHandover}</TH>
                      <TH>{a.returnToService}</TH>
                      <TH>{a.dataCompleteness}</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {rows.map((r) => (
                      <TR key={r.id}>
                        <TD className="ltr font-semibold">{r.callSign}</TD>
                        <TD className="tabular">{r.cases}</TD>
                        <TD className="ltr tabular">{formatMin(r.avgTransportMin, m)}</TD>
                        <TD className="ltr tabular">{formatMin(r.avgHandoverMin, m)}</TD>
                        <TD className="ltr tabular">{formatMin(r.avgRtsMin, m)}</TD>
                        <TD className="w-48">
                          <div className="flex items-center gap-2 text-xs tabular">
                            <Progress value={r.completeness ?? 0} tone="stable" /> {r.completeness ?? 0}%
                          </div>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{a.cases}</CardTitle>
              </CardHeader>
              <CardContent>
                <BarList data={rows.map((r) => ({ key: r.callSign, value: r.cases }))} label={a.cases} />
              </CardContent>
            </Card>
          </div>
        );
      }
      case "hospitals": {
        const rows = hospitalTable(list, hospitals);
        return (
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>{a.views.hospitals}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table data-testid="hospital-comparison">
                  <THead>
                    <TR>
                      <TH>{a.hospital}</TH>
                      <TH>{a.incomingCases}</TH>
                      <TH>{a.avgAck}</TH>
                      <TH>{a.avgHandover}</TH>
                      <TH>{a.resourceConstraints}</TH>
                      <TH>{a.diversions}</TH>
                      <TH>{a.criticalCases}</TH>
                      <TH>{a.ackRate}</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {rows.map((r) => (
                      <TR key={r.id}>
                        <TD className="font-semibold">{hName(r)}</TD>
                        <TD className="tabular">{r.incoming}</TD>
                        <TD className="ltr tabular">{formatMin(r.avgAckMin, m)}</TD>
                        <TD className="ltr tabular">{formatMin(r.avgHandoverMin, m)}</TD>
                        <TD className="tabular">{r.constraints}</TD>
                        <TD className="tabular">{r.diversions}</TD>
                        <TD className="tabular">{r.critical}</TD>
                        <TD className="tabular">{r.ackRate}%</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </CardContent>
            </Card>
            <div className="grid gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{a.incomingCases}</CardTitle>
                </CardHeader>
                <CardContent>
                  <BarList data={rows.map((r) => ({ key: r.id, label: hName(r), value: r.incoming }))} label={a.cases} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{a.avgHandover}</CardTitle>
                </CardHeader>
                <CardContent>
                  <BarList data={rows.map((r) => ({ key: r.id, label: hName(r), value: r.avgHandoverMin ?? 0 }))} label={m} />
                </CardContent>
              </Card>
            </div>
          </div>
        );
      }
      case "flow": {
        const funnel = [
          { key: t.journey.ASSESSED, value: list.length },
          { key: t.journey.VITALS, value: list.filter((e) => e.vitals.length).length },
          { key: t.journey.PREALERT, value: list.filter((e) => e.preAlertSentAt).length },
          { key: t.journey.ACK, value: list.filter((e) => e.acknowledgedAt).length },
          { key: t.journey.ARRIVAL, value: list.filter((e) => e.arrivedAt).length },
          { key: t.journey.COMPLETED, value: list.filter((e) => e.handoverCompletedAt).length },
        ];
        return (
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{a.funnel}</CardTitle>
              </CardHeader>
              <CardContent>
                <BarList data={funnel} label={a.cases} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{a.byHour}</CardTitle>
              </CardHeader>
              <CardContent>
                <ColumnChart data={o.byHour} label={a.cases} />
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{a.casesPerDay}</CardTitle>
              </CardHeader>
              <CardContent>
                <DailyStack data={o.days} labels={{ other: `${a.cases} (P2–P4)`, critical: `${a.criticalCases} (P1)` }} />
              </CardContent>
            </Card>
          </div>
        );
      }
      case "response": {
        const stages = responseStages(list);
        return (
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{a.views.response}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <THead>
                    <TR>
                      <TH>{a.stage}</TH>
                      <TH>n</TH>
                      <TH>{a.medianMin}</TH>
                      <TH>{a.p90Min}</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {stages.map((s) => (
                      <TR key={s.key}>
                        <TD>{a[s.key as "transport"] ?? s.key}</TD>
                        <TD className="tabular">{s.n}</TD>
                        <TD className="tabular">{s.median ?? "—"}</TD>
                        <TD className="tabular">{s.p90 ?? "—"}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{a.medianMin}</CardTitle>
              </CardHeader>
              <CardContent>
                <BarList data={stages.map((s) => ({ key: s.key, label: a[s.key as "transport"] ?? s.key, value: s.median ?? 0 }))} label={m} />
              </CardContent>
            </Card>
          </div>
        );
      }
      case "completeness": {
        const c = completenessBreakdown(list);
        const labels: Record<string, string> = {
          identity: t.caseView.identityStatus,
          chiefComplaint: t.caseView.chiefComplaint,
          vitals: t.caseView.tabs.vitals,
          interventions: t.caseView.tabs.interventions,
          medications: t.caseView.tabs.medications,
          eta: t.caseView.eta,
          destination: t.caseView.hospital,
          handover: t.caseView.tabs.handover,
        };
        return (
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{a.dataCompleteness}</CardTitle>
                <span className="text-2xl font-semibold tabular">{c.avg ?? 0}%</span>
              </CardHeader>
              <CardContent className="space-y-3">
                {c.elements.map((e) => (
                  <div key={e.key}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{labels[e.key]}</span>
                      <span className="tabular font-semibold">{e.rate}%</span>
                    </div>
                    <Progress value={e.rate} tone={e.rate >= 80 ? "stable" : e.rate >= 50 ? "warning" : "critical"} />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{a.completeness} %</CardTitle>
              </CardHeader>
              <CardContent>
                <ColumnChart data={c.distribution} label={a.cases} />
              </CardContent>
            </Card>
          </div>
        );
      }
      case "triage": {
        const s = triageStats(list);
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
              <Kpi label={a.triageAssessments} value={s.assessments} tone="ai" />
              <Kpi label={a.confirmed} value={s.confirmed} tone="stable" />
              <Kpi label={a.overridden} value={s.overridden} tone="warning" />
              <Kpi label={a.agreement} value={`${s.agreement}%`} />
              <Kpi label={a.avgConfidence} value={`${s.avgConfidence ?? 0}%`} />
              <Kpi label={a.upTriage} value={s.upTriage} />
              <Kpi label={a.downTriage} value={s.downTriage} />
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>{a.suggestedVsFinal}</CardTitle>
                    <CardDescription className="mt-1">{t.triage.label}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <THead>
                      <TR>
                        <TH>{t.triage.suggested} ↓ / {t.triage.finalPriority} →</TH>
                        {["P1", "P2", "P3", "P4"].map((p) => (
                          <TH key={p}>{p}</TH>
                        ))}
                      </TR>
                    </THead>
                    <TBody>
                      {s.matrix.map((r) => (
                        <TR key={r.suggested}>
                          <TD className="font-semibold">{r.suggested}</TD>
                          {(["P1", "P2", "P3", "P4"] as const).map((p) => (
                            <TD key={p} className={cn("tabular", r.suggested === p && "bg-stable-soft font-semibold")}>
                              {r[p]}
                            </TD>
                          ))}
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t.triage.overrideReason}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5 text-sm">
                    {s.reasons.length ? s.reasons.map((r, i) => <li key={i}>• {r}</li>) : <li className="text-muted-foreground">{t.common.none}</li>}
                  </ul>
                  <p className="mt-4 text-[11px] text-muted-foreground">{t.triage.disclaimer}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      }
      case "destination": {
        const s = destinationStats(list);
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              <Kpi label={a.recommendations} value={s.recommendations} tone="ai" />
              <Kpi label={a.approvedRate} value={`${s.approvedRate}%`} />
              <Kpi label={t.destination.score} value={`${s.avgScore ?? 0}%`} />
              <Kpi label={a.diversions} value={s.diversions} tone="warning" />
              <Kpi label={a.diversionRate} value={`${s.diversionRate}%`} />
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{a.topRecommended}</CardTitle>
                </CardHeader>
                <CardContent>
                  <BarList data={s.top} label={a.recommendations} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t.destination.changeReason}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5 text-sm">
                    {s.reasons.length ? s.reasons.map((r) => <li key={r.key} className="flex justify-between gap-3"><span>{r.key}</span><span className="tabular font-semibold">{r.value}</span></li>) : <li className="text-muted-foreground">{t.common.none}</li>}
                  </ul>
                  <p className="mt-4 text-[11px] text-muted-foreground">{t.destination.disclaimer}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      }
      case "resources": {
        const rs = await resourceStats(from, to);
        const types = ["ED_CAPACITY", "AVAILABLE_BEDS", "ICU_BEDS", "TRAUMA_BAY", "CT_STATUS", "CATH_LAB", "OR_STATUS", "SPECIALISTS"] as const;
        return (
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>{a.statusShare}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <THead>
                    <TR>
                      <TH>{a.hospital}</TH>
                      {types.map((ty) => (
                        <TH key={ty}>{t.enums.resource[ty]}</TH>
                      ))}
                    </TR>
                  </THead>
                  <TBody>
                    {rs.map((h) => (
                      <TR key={h.id}>
                        <TD className="font-semibold">{hName(h)}</TD>
                        {types.map((ty) => (
                          <TD key={ty}>
                            {h.resources[ty] ? (
                              <div className="flex flex-col items-start gap-0.5">
                                <ResourceBadge s={h.resources[ty].status} />
                                {h.resources[ty].total != null && h.resources[ty].total! > 1 ? <span className="text-[10px] tabular text-muted-foreground">{h.resources[ty].available}/{h.resources[ty].total}</span> : null}
                              </div>
                            ) : (
                              "—"
                            )}
                          </TD>
                        ))}
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{a.constraintEvents}</CardTitle>
              </CardHeader>
              <CardContent>
                <BarList data={rs.map((h) => ({ key: h.id, label: hName(h), value: h.constraintEvents }))} label={a.constraintEvents} />
              </CardContent>
            </Card>
          </div>
        );
      }
      case "quality": {
        const q = await qualityStats(user, list, from, to);
        const tiles: [string, number | null, string, boolean][] = [
          [a.documentationCompleteness, q.documentation, "%", true],
          [a.preArrivalRate, q.preArrivalRate, "%", true],
          [a.ackRate, q.ackRate, "%", true],
          [a.handoverCompletionRate, q.handoverCompletionRate, "%", true],
          [a.criticalAlertResponse, q.criticalAlertResponseMin, ` ${m}`, false],
          [a.diversionRate, q.diversionRate, "%", false],
        ];
        return (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" data-testid="quality-dashboard">
            {tiles.map(([label, v, unit, higherBetter]) => (
              <Card key={label}>
                <CardContent className="pt-4">
                  <div className="text-xs font-medium text-muted-foreground">{label}</div>
                  <div className="ltr mt-2 text-start text-3xl font-semibold tabular">
                    {v ?? "—"}
                    {v != null ? unit : ""}
                  </div>
                  {unit === "%" && v != null ? <Progress className="mt-3" value={v} tone={higherBetter ? (v >= 85 ? "stable" : v >= 60 ? "warning" : "critical") : v <= 10 ? "stable" : "warning"} /> : null}
                </CardContent>
              </Card>
            ))}
          </div>
        );
      }
    }
  })();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={a.title}
        title={a.views[view]}
        subtitle={<Badge variant="muted">{t.reports.generated}</Badge>}
        actions={
          <div className="flex gap-1">
            {[7, 30, 60, 90].map((d) => (
              <Link key={d} href={`/analytics/${view}?days=${d}`} className={cn("rounded-lg border px-3 py-1.5 text-xs font-medium", d === days ? "bg-navy-900 text-white" : "bg-white hover:bg-muted")}>
                {t.common.lastDays.replace("{n}", String(d))}
              </Link>
            ))}
          </div>
        }
      />
      <nav className="-mx-1 flex gap-1 overflow-x-auto border-b px-1">
        {VIEWS.map((v) => (
          <Link key={v} href={`/analytics/${v}?days=${days}`} className={cn("whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium", v === view ? "border-navy-900" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {a.views[v]}
          </Link>
        ))}
      </nav>
      {content}
    </div>
  );
}
