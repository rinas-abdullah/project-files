"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Play } from "lucide-react";
import type { Card as CardData } from "@/lib/queries";
import { useI18n } from "@/components/i18n-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, Field } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EncounterStatusBadge, PriorityBadge, ReadinessBadge } from "@/components/shared/status";
import { api, errorText } from "@/lib/client-api";
import { formatEta } from "@/lib/i18n/format";

type Sim = { running: boolean; tick: number; tickMs: number; drives: string[]; monitors: { encounterId: string; scenario: string }[] };

type ActionProps = { action: string; label: string; extra?: Record<string, unknown>; variant?: "outline" | "default" | "critical" | "ai" | "stable" | "warning"; run: (a: string, e?: Record<string, unknown>) => void; busy: string | null };

function DemoAction({ action, label, extra, variant = "outline", run, busy }: ActionProps) {
  return (
    <Button variant={variant} onClick={() => run(action, extra)} disabled={!!busy} data-testid={`demo-${action}`} className="justify-start">
      {busy === action ? <Loader2 className="animate-spin" /> : <Play />} {label}
    </Button>
  );
}

export function DemoPanel({ cases, sim }: { cases: CardData[]; sim: Sim }) {
  const { t } = useI18n();
  const router = useRouter();
  const [selected, setId] = useState(cases[0]?.id ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [steps, setSteps] = useState(5);
  const [trend, setTrend] = useState("DETERIORATING");
  const [resource, setResource] = useState("CT_STATUS");
  const id = cases.some((c) => c.id === selected) ? selected : cases[0]?.id ?? "";
  const c = cases.find((x) => x.id === id);
  if (!cases.length) return <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{t.demo.noActive}</div>;

  const run = async (action: string, extra: Record<string, unknown> = {}) => {
    setBusy(action);
    const r = await api("/api/demo", { action, encounterId: id, ...extra });
    setBusy(null);
    if (!r.ok) return toast.error(errorText(t, r));
    toast.success(`${t.demo.result}: ✓`);
    router.refresh();
  };
  const driving = c ? sim.drives.length > 0 : false;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>{t.demo.target}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={id} onChange={(e) => setId(e.target.value)} data-testid="demo-target">
              {cases.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.priority} · {x.patientLabel} · {x.ambulance} · {t.enums.encounterStatus[x.status as keyof typeof t.enums.encounterStatus]}
                </option>
              ))}
            </Select>
            {c ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <PriorityBadge p={c.priority} />
                <Link href={`/cases/${c.id}`} className="ltr font-semibold text-info hover:underline">
                  {c.code}
                </Link>
                <EncounterStatusBadge s={c.status} />
                <ReadinessBadge s={c.readiness} />
                <span className="ltr text-xs text-muted-foreground">
                  {c.destination?.name ?? "—"} · {formatEta(c.etaSeconds, t.common.min)} · {t.enums.phase[c.arrivalPhase as keyof typeof t.enums.phase]}
                </span>
              </div>
            ) : null}
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t.demo.moveAmbulance}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Field label={t.demo.steps}>
                <Select value={steps} onChange={(e) => setSteps(Number(e.target.value))}>
                  {[1, 3, 5, 10, 20].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </Field>
              <DemoAction run={run} busy={busy} action="move" label={t.demo.moveAmbulance} extra={{ steps }} />
              <DemoAction run={run} busy={busy} action="drive_start" label={t.paramedic.startDriving} variant="default" />
              <DemoAction run={run} busy={busy} action="drive_stop" label={t.paramedic.stopDriving} />
              <DemoAction run={run} busy={busy} action="delay" label={`${t.demo.changeEta} (+3 ${t.common.min})`} extra={{ minutes: 3 }} />
              <DemoAction run={run} busy={busy} action="geofence" label={t.demo.geofence} variant="warning" />
              <DemoAction run={run} busy={busy} action="arrive" label={t.demo.arrive} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t.caseView.patient}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <DemoAction run={run} busy={busy} action="vital" label={t.demo.sendVital} />
              <DemoAction run={run} busy={busy} action="monitor_start" label={`${t.paramedic.simulateMonitor} (${t.paramedic.scenario.DETERIORATING})`} variant="ai" />
              <DemoAction run={run} busy={busy} action="monitor_stop" label={t.paramedic.stopMonitor} />
              <Field label={t.paramedic.conditionForm.trend}>
                <Select value={trend} onChange={(e) => setTrend(e.target.value)}>
                  {(["STABLE", "IMPROVING", "DETERIORATING", "CRITICAL"] as const).map((x) => (
                    <option key={x} value={x}>
                      {t.enums.condition[x]}
                    </option>
                  ))}
                </Select>
              </Field>
              <DemoAction run={run} busy={busy} action="condition" label={t.demo.changeCondition} extra={{ trend }} />
              <DemoAction run={run} busy={busy} action="upload_image" label={t.demo.uploadImage} />
              <DemoAction run={run} busy={busy} action="identify" label={t.demo.identify} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t.caseView.hospital}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <DemoAction run={run} busy={busy} action="ack" label={t.demo.ack} variant="stable" />
              <Field label={t.resources.resources}>
                <Select value={resource} onChange={(e) => setResource(e.target.value)}>
                  {["CT_STATUS", "CATH_LAB", "OR_STATUS", "ICU_BEDS", "TRAUMA_BAY"].map((x) => (
                    <option key={x} value={x}>
                      {t.enums.resource[x as keyof typeof t.enums.resource]}
                    </option>
                  ))}
                </Select>
              </Field>
              <DemoAction run={run} busy={busy} action="resource" label={t.demo.resourceChange} extra={{ resourceType: resource }} />
              <DemoAction run={run} busy={busy} action="handover" label={t.demo.handover} />
              <DemoAction run={run} busy={busy} action="release" label={t.demo.release} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                <Badge variant="ai">{t.triage.label}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <DemoAction run={run} busy={busy} action="triage" label={t.demo.triage} variant="ai" />
              <DemoAction run={run} busy={busy} action="destination" label={t.demo.destination} variant="ai" />
              <p className="text-[11px] text-muted-foreground">{t.destination.disclaimer}</p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>{t.demo.simStatus}</CardTitle>
          <Badge variant={sim.running ? "stable" : "muted"}>{sim.running ? t.demo.running : t.common.stop}</Badge>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tick</span>
            <span className="tabular">
              {sim.tick} · {sim.tickMs} ms
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.demo.drives}</span>
            <span className="tabular" data-testid="sim-drives">{sim.drives.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.demo.monitors}</span>
            <span className="tabular">{sim.monitors.length}</span>
          </div>
          {driving ? null : null}
        </CardContent>
      </Card>
    </div>
  );
}
