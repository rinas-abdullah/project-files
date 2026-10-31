"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BrainCircuit,
  Check,
  CheckCircle2,
  Circle,
  Hospital,
  Loader2,
  MapPinned,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  ArrowRightLeft,
  HandHelping,
  ClipboardCheck,
  Clock,
} from "lucide-react";
import type { CaseDetail } from "@/lib/case-detail";
import { useI18n } from "@/components/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { PriorityBadge, ReadinessBadge, VitalStatusDot } from "@/components/shared/status";
import { LiveMap } from "@/components/maps/live-map";
import { api, errorText } from "@/lib/client-api";
import { fmt, formatDateTime, formatEta, formatKm, formatTime } from "@/lib/i18n/format";
import { formatVital, VITAL_ORDER, type VitalTypeKey } from "@/lib/engines/vitals";
import { cn } from "@/lib/utils";

function useAction() {
  const router = useRouter();
  const { t } = useI18n();
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (key: string, url: string, body: unknown = {}, success?: string) => {
    setBusy(key);
    const r = await api(url, body);
    setBusy(null);
    if (!r.ok) {
      toast.error(errorText(t, r));
      return null;
    }
    if (success) toast.success(success);
    router.refresh();
    return r.data;
  };
  return { busy, run };
}

// ───────────── Vitals tiles ─────────────

export function VitalTiles({ latest, large }: { latest: CaseDetail["latest"]; large?: boolean }) {
  const { t } = useI18n();
  return (
    <div className={cn("grid gap-2", large ? "grid-cols-2 sm:grid-cols-4 xl:grid-cols-7" : "grid-cols-3 sm:grid-cols-4 lg:grid-cols-7")} data-testid="vital-tiles">
      {VITAL_ORDER.map((type) => {
        const v = latest[type];
        return (
          <div
            key={`${type}-${v?.at}`}
            className={cn(
              "flash-update rounded-xl border p-3",
              v?.status === "CRITICAL" ? "border-red-200 bg-critical-soft" : v?.status === "ABNORMAL" ? "border-amber-200 bg-warning-soft" : "bg-white",
            )}
            data-testid={`vital-${type}`}
          >
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
              <span>{t.enums.vitalShort[type]}</span>
              {v ? <VitalStatusDot s={v.status} /> : null}
            </div>
            <div className={cn("ltr mt-1 font-semibold tabular", large ? "text-2xl" : "text-xl", v?.status === "CRITICAL" ? "text-critical" : v?.status === "ABNORMAL" ? "text-amber-700" : "text-foreground")}>
              {v ? formatVital(type, v.value, v.value2) : "—"}
            </div>
            <div className="mt-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{v ? formatTime(v.at, "en").slice(0, 5) : ""}</span>
              {v?.source === "MONITOR" ? <span className="font-semibold text-ai">MON</span> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ───────────── Timeline ─────────────

const EVENT_TONE: Record<string, string> = {
  CASE_CREATED: "bg-navy-900",
  HOSPITAL_NOTIFIED: "bg-warning",
  HOSPITAL_ACKNOWLEDGED: "bg-stable",
  CONDITION_CHANGED: "bg-critical",
  PRIORITY_CHANGED: "bg-critical",
  DESTINATION_CHANGED: "bg-warning",
  ARRIVED: "bg-navy-900",
  HANDOVER_COMPLETED: "bg-stable",
  TRIAGE_ASSESSED: "bg-ai",
  TRIAGE_DECIDED: "bg-ai",
  DESTINATION_RECOMMENDED: "bg-ai",
  GEOFENCE_ENTERED: "bg-critical",
};

function eventDetail(t: ReturnType<typeof useI18n>["t"], type: string, d: Record<string, unknown> | null): string | null {
  if (!d) return null;
  const s = (k: string) => (d[k] == null ? "" : String(d[k]));
  switch (type) {
    case "CASE_CREATED":
      return [s("code"), d.temporaryId ? s("temporaryId") : "", d.priority ? s("priority") : ""].filter(Boolean).join(" · ");
    case "VITALS_RECORDED":
      return Array.isArray(d.values) ? (d.values as { type: VitalTypeKey; value: number; value2: number | null }[]).map((v) => `${t.enums.vitalShort[v.type]} ${formatVital(v.type, v.value, v.value2)}`).join(" · ") : d.count ? `×${s("count")}` : null;
    case "INTERVENTION_PERFORMED":
      return `${t.enums.intervention[s("type") as keyof typeof t.enums.intervention] ?? s("type")}${d.notes ? ` — ${s("notes")}` : ""}`;
    case "MEDICATION_GIVEN":
      return `${s("name")} ${s("dose")} ${s("route")}${d.allergyConflict ? ` ⚠ ${s("allergyConflict")}` : ""}`;
    case "CLINICAL_NOTE":
      return s("text");
    case "CONDITION_CHANGED":
      return `${t.enums.condition[s("from") as keyof typeof t.enums.condition] ?? s("from")} → ${t.enums.condition[s("to") as keyof typeof t.enums.condition] ?? s("to")}${d.note ? ` — ${s("note")}` : ""}`;
    case "PRIORITY_CHANGED":
      return `${s("from")} → ${s("to")}${d.reason ? ` — ${s("reason")}` : ""}`;
    case "TRIAGE_ASSESSED":
      return `${t.triage.suggested}: ${s("suggested")} · ${t.triage.risk} ${s("risk")} · ${t.triage.confidence} ${s("confidence")}%`;
    case "TRIAGE_DECIDED":
      return `${t.enums.triageDecision[(s("decision") === "CONFIRM" ? "CONFIRMED" : "OVERRIDDEN") as "CONFIRMED"]} · ${s("final")}${d.reason ? ` — ${s("reason")}` : ""}`;
    case "DESTINATION_SELECTED":
    case "HOSPITAL_ACKNOWLEDGED":
    case "APPROACHING":
    case "GEOFENCE_ENTERED":
    case "ARRIVED":
      return s("hospital") || null;
    case "HOSPITAL_NOTIFIED":
      return `${s("hospital")}${d.delivery ? ` · ${t.enums.delivery[s("delivery") as keyof typeof t.enums.delivery] ?? s("delivery")}` : ""}`;
    case "DESTINATION_RECOMMENDED":
      return `${s("hospital")} · ${s("score")}%`;
    case "DESTINATION_CHANGED":
      return `${s("from")} → ${s("to")} — ${s("reason")}`;
    case "PREPARATION_UPDATED":
      return `${t.enums.prep[s("item") as keyof typeof t.enums.prep] ?? s("item")} · ${d.done ? "✓" : "✗"}`;
    case "READINESS_CHANGED":
      return `${t.enums.readiness[s("to") as keyof typeof t.enums.readiness] ?? s("to")}${d.note ? ` — ${s("note")}` : ""}`;
    case "REGISTRATION_UPDATED":
      return `${t.enums.registration[s("status") as keyof typeof t.enums.registration] ?? s("status")}${d.reference ? ` · ${s("reference")}` : ""}${d.reason ? ` · ${s("reason")}` : ""}`;
    case "IDENTITY_DETECTED":
    case "IDENTITY_MATCHED":
      return `${s("provider")}${d.last4 ? ` · ••••${s("last4")}` : ""}`;
    case "HEALTH_RECORD_RETRIEVED":
      return s("source");
    case "PHOTO_UPLOADED":
      return t.enums.mediaCategory[s("category") as keyof typeof t.enums.mediaCategory] ?? null;
    case "HANDOVER_COMPLETED":
      return d.notes ? s("notes") : null;
    default:
      return null;
  }
}

export function Timeline({ events, limit }: { events: CaseDetail["events"]; limit?: number }) {
  const { t, locale } = useI18n();
  const list = limit ? events.slice(0, limit) : events;
  if (!list.length) return <div className="text-sm text-muted-foreground">{t.caseView.noEvents}</div>;
  return (
    <ol className="relative space-y-3 border-s border-border ps-5" data-testid="timeline">
      {list.map((e) => {
        const detail = eventDetail(t, e.type, e.detail);
        return (
          <li key={e.id} className="relative">
            <span className={cn("absolute -start-[25px] top-1.5 size-2.5 rounded-full ring-4 ring-white", EVENT_TONE[e.type] ?? "bg-slate-400")} />
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="text-sm font-semibold">{t.enums.event[e.type as keyof typeof t.enums.event] ?? e.type}</span>
              <span className="text-[11px] tabular text-muted-foreground">{formatDateTime(e.at, locale, { dateStyle: undefined, timeStyle: "medium" })}</span>
            </div>
            {detail ? <div className="ltr mt-0.5 text-start text-xs text-muted-foreground">{detail}</div> : null}
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {e.actor}
              {e.role ? ` · ${t.roles[e.role as keyof typeof t.roles]}` : ""}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ───────────── Patient journey stepper ─────────────

export function JourneyStepper({ c }: { c: CaseDetail }) {
  const { t, locale } = useI18n();
  const prep = c.preparations.some((p) => p.done) || ["PREPARING", "READY", "LIMITED", "RESOURCE_CONSTRAINT"].includes(c.readiness);
  const steps: { key: keyof typeof t.journey; at: string | null; done: boolean }[] = [
    { key: "INCIDENT", at: c.mission.dispatchedAt, done: true },
    { key: "DISPATCHED", at: c.mission.dispatchedAt, done: true },
    { key: "ASSESSED", at: c.createdAt, done: true },
    { key: "IDENTITY", at: c.patient.identities[0]?.at ?? null, done: c.patient.identities.length > 0 || !c.patient.isUnknown },
    { key: "VITALS", at: c.vitals[0]?.at ?? null, done: c.vitals.length > 0 },
    { key: "PREALERT", at: c.preAlertSentAt, done: !!c.preAlertSentAt },
    { key: "ACK", at: c.acknowledgedAt, done: !!c.acknowledgedAt },
    { key: "PREPARING", at: c.preparations.find((p) => p.done)?.at ?? null, done: prep },
    { key: "APPROACHING", at: c.approachingAt, done: !!c.approachingAt },
    { key: "ARRIVAL", at: c.arrivedAt, done: !!c.arrivedAt },
    { key: "HANDOVER", at: c.handoverStartedAt, done: !!c.handoverStartedAt },
    { key: "COMPLETED", at: c.handoverCompletedAt, done: !!c.handoverCompletedAt },
  ];
  const current = steps.findIndex((s) => !s.done);
  return (
    <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6 xl:grid-cols-12" data-testid="journey">
      {steps.map((s, i) => (
        <li key={s.key} className={cn("rounded-lg border px-2 py-2", s.done ? "border-teal-200 bg-stable-soft" : i === current ? "border-navy-700 bg-white ring-2 ring-navy-700/10" : "bg-muted/40")}>
          <div className="flex items-center gap-1.5">
            {s.done ? <CheckCircle2 className="size-3.5 shrink-0 text-stable" /> : <Circle className={cn("size-3.5 shrink-0", i === current ? "text-navy-800" : "text-muted-foreground")} />}
            <span className="truncate text-[11px] font-semibold">{t.journey[s.key]}</span>
          </div>
          <div className="mt-0.5 text-[10px] tabular text-muted-foreground">{s.done && s.at ? formatTime(s.at, locale).slice(0, 5) : "—"}</div>
        </li>
      ))}
    </ol>
  );
}

// ───────────── Completeness ─────────────

export function CompletenessCard({ c }: { c: CaseDetail }) {
  const { t } = useI18n();
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
    <Card>
      <CardHeader>
        <CardTitle>{t.caseView.completeness}</CardTitle>
        <span className="text-lg font-semibold tabular" data-testid="completeness">{c.completeness.score}%</span>
      </CardHeader>
      <CardContent>
        <Progress value={c.completeness.score} tone={c.completeness.score >= 75 ? "stable" : c.completeness.score >= 50 ? "warning" : "critical"} />
        <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
          {Object.entries(c.completeness.items).map(([k, ok]) => (
            <div key={k} className="flex items-center gap-1.5">
              {ok ? <Check className="size-3.5 text-stable" /> : <Circle className="size-3.5 text-muted-foreground" />}
              <span className={ok ? "" : "text-muted-foreground"}>{labels[k]}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ───────────── Map ─────────────

export function CaseMap({ c, className }: { c: CaseDetail; className?: string }) {
  const { t, locale } = useI18n();
  return (
    <LiveMap
      className={className ?? "h-72"}
      showGeofence
      fitTo={c.destination ? "highlight" : "all"}
      hospitals={c.hospitals.map((h) => ({ id: h.id, name: h.name, label: locale === "ar" ? h.nameAr : h.name, lat: h.lat, lng: h.lng, geofenceRadiusM: h.geofenceRadiusM, approachRadiusM: h.approachRadiusM, highlight: h.id === c.destination?.id }))}
      ambulances={[{ id: c.mission.ambulance.id, callSign: c.mission.ambulance.callSign, lat: c.mission.ambulance.lat, lng: c.mission.ambulance.lng, status: c.mission.ambulance.status, route: c.mission.route, highlight: true, etaLabel: c.mission.etaSeconds != null && c.mission.status === "TRANSPORTING" ? formatEta(c.mission.etaSeconds, t.common.min) : undefined }]}
      incidents={c.mission.status === "ON_SCENE" || c.mission.status === "DISPATCHED" ? [{ id: c.mission.incident.id, lat: c.mission.incident.lat, lng: c.mission.incident.lng, label: c.mission.incident.address }] : []}
    />
  );
}

export function EtaBlock({ c }: { c: CaseDetail }) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="rounded-lg bg-navy-900 p-3 text-white">
        <div className="text-[10px] uppercase tracking-wider text-white/60">{t.caseView.eta}</div>
        <div className="ltr mt-1 text-2xl font-semibold tabular" data-testid="eta">
          {c.arrivedAt ? "✓" : formatEta(c.mission.etaSeconds, t.common.min)}
        </div>
      </div>
      <div className="rounded-lg border bg-white p-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.paramedic.distance}</div>
        <div className="ltr mt-1 text-lg font-semibold tabular">{formatKm(c.mission.distanceMeters, t.common.km)}</div>
      </div>
      <div className="rounded-lg border bg-white p-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.caseView.phase}</div>
        <div className="mt-1 text-sm font-semibold" data-testid="phase">
          {t.enums.phase[c.mission.phase as keyof typeof t.enums.phase]}
        </div>
      </div>
    </div>
  );
}

// ───────────── AI triage ─────────────

export function TriagePanel({ c, canRun, canDecide }: { c: CaseDetail; canRun: boolean; canDecide: boolean }) {
  const { t, locale } = useI18n();
  const { busy, run } = useAction();
  const [overriding, setOverriding] = useState(false);
  const [prio, setPrio] = useState("P1");
  const [reason, setReason] = useState("");
  const latest = c.triage[0];
  const open = !["COMPLETED", "CANCELLED"].includes(c.status);

  return (
    <Card className="border-violet-200" data-testid="triage-panel">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="size-4 text-ai" /> {t.triage.title}
          </CardTitle>
          <CardDescription className="mt-1">
            <Badge variant="ai">{t.triage.label}</Badge>
          </CardDescription>
        </div>
        {canRun && open ? (
          <Button size="sm" variant="ai" onClick={() => run("run", `/api/encounters/${c.id}/triage`)} disabled={busy === "run"} data-testid="triage-run">
            {busy === "run" ? <Loader2 className="animate-spin" /> : <Sparkles />} {latest ? t.triage.rerun : t.triage.run}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {!latest ? (
          <div className="text-sm text-muted-foreground">{t.triage.noAssessment}</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-ai-soft p-3">
                <div className="text-[11px] text-violet-800">{t.triage.suggested}</div>
                <div className="mt-1">
                  <PriorityBadge p={latest.suggested} className="px-2.5 py-1 text-sm" />
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-[11px] text-muted-foreground">{t.triage.risk}</div>
                <div className="mt-1 text-xl font-semibold tabular" data-testid="triage-risk">{latest.risk}</div>
                <Progress value={latest.risk} tone={latest.risk >= 70 ? "critical" : latest.risk >= 40 ? "warning" : "stable"} className="mt-1" />
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-[11px] text-muted-foreground">{t.triage.confidence}</div>
                <div className="mt-1 text-xl font-semibold tabular">{latest.confidence}%</div>
                <Progress value={latest.confidence} tone="ai" className="mt-1" />
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-muted-foreground">{t.triage.reasons}</div>
              <ul className="space-y-1">
                {latest.factors.slice(0, 8).map((f) => (
                  <li key={f.code} className="flex items-start justify-between gap-2 text-sm">
                    <span>
                      • {t.triage.factor[f.code as keyof typeof t.triage.factor] ?? f.code}
                      {locale === "en" && f.detail !== t.triage.factor[f.code as keyof typeof t.triage.factor] ? <span className="ms-1 text-xs text-muted-foreground">({f.detail})</span> : null}
                    </span>
                    <span className="ltr shrink-0 text-xs font-semibold tabular text-violet-700">+{f.points}</span>
                  </li>
                ))}
                {latest.factors.length === 0 ? <li className="text-sm text-muted-foreground">{t.common.none}</li> : null}
              </ul>
            </div>
            {latest.missing.length ? (
              <div className="rounded-lg border border-amber-200 bg-warning-soft p-2.5 text-xs text-amber-900">
                <span className="font-semibold">{t.triage.missing}: </span>
                {latest.missing.map((m) => t.triage.missingItem[m as keyof typeof t.triage.missingItem] ?? m).join(" · ")}
              </div>
            ) : null}
            <div className="flex items-center gap-2 rounded-lg border border-dashed p-2.5 text-xs font-semibold text-foreground">
              <ShieldCheck className="size-4 text-ai" /> {t.common.clinicalConfirmationRequired}
            </div>
            {latest.decision === "PENDING" ? (
              canDecide && open ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="stable" onClick={() => run("confirm", `/api/triage/${latest.id}/decision`, { decision: "CONFIRM" }, t.common.saved)} disabled={!!busy} data-testid="triage-confirm">
                      <Check /> {t.triage.confirm} ({latest.suggested})
                    </Button>
                    <Button variant="outline" onClick={() => setOverriding((v) => !v)} data-testid="triage-override">
                      {t.triage.override}
                    </Button>
                  </div>
                  {overriding ? (
                    <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[140px_1fr_auto]">
                      <Select value={prio} onChange={(e) => setPrio(e.target.value)} aria-label={t.triage.overridePriority}>
                        {["P1", "P2", "P3", "P4"].map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </Select>
                      <Input placeholder={t.triage.overrideReason} value={reason} onChange={(e) => setReason(e.target.value)} data-testid="override-reason" />
                      <Button
                        disabled={reason.trim().length < 5 || !!busy}
                        onClick={async () => {
                          const ok = await run("override", `/api/triage/${latest.id}/decision`, { decision: "OVERRIDE", priority: prio, reason }, t.common.saved);
                          if (ok) setOverriding(false);
                        }}
                        data-testid="override-submit"
                      >
                        {t.common.confirm}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <Badge variant="warning">{t.enums.triageDecision.PENDING}</Badge>
              )
            ) : (
              <div className="rounded-lg bg-muted p-2.5 text-xs">
                <span className="font-semibold">{t.enums.triageDecision[latest.decision as keyof typeof t.enums.triageDecision]}</span> · {t.triage.finalPriority}: <strong>{latest.finalPriority}</strong>
                {latest.overrideReason ? <> · {latest.overrideReason}</> : null}
                <div className="mt-0.5 text-muted-foreground">
                  {latest.decidedBy} · {formatDateTime(latest.decidedAt, locale)}
                </div>
              </div>
            )}
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {t.triage.disclaimer} {t.triage.engine}: <span className="ltr">{latest.engine}</span>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ───────────── Smart destination ─────────────

export function DestinationPanel({ c, canRecommend, canSelect, canChange }: { c: CaseDetail; canRecommend: boolean; canSelect: boolean; canChange: boolean }) {
  const { t, locale } = useI18n();
  const { busy, run } = useAction();
  const rec = c.recommendation;
  const locked = !!c.preAlertSentAt && !!c.destination;
  const open = !["COMPLETED", "CANCELLED", "ARRIVED", "HANDOVER"].includes(c.status);
  const reasonText = (r: { code: string; params?: Record<string, string | number> }) => {
    const p = { ...(r.params ?? {}) };
    if (p.cap) p.cap = t.enums.capability[p.cap as keyof typeof t.enums.capability] ?? p.cap;
    if (p.res) p.res = t.enums.resource[p.res as keyof typeof t.enums.resource] ?? p.res;
    return fmt(t.destination.reason[r.code as keyof typeof t.destination.reason] ?? r.code, p);
  };
  return (
    <Card data-testid="destination-panel">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <MapPinned className="size-4 text-ai" /> {t.destination.title}
          </CardTitle>
          <CardDescription className="mt-1">{t.destination.disclaimer}</CardDescription>
        </div>
        {canRecommend && open ? (
          <Button size="sm" variant="ai" onClick={() => run("rec", `/api/encounters/${c.id}/recommend`)} disabled={busy === "rec"} data-testid="destination-run">
            {busy === "rec" ? <Loader2 className="animate-spin" /> : <Sparkles />} {t.destination.run}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-2.5 text-sm">
          <span className="text-muted-foreground">{t.destination.current}</span>
          <span className="font-semibold" data-testid="current-destination">
            {c.destination ? (locale === "ar" ? c.destination.nameAr : c.destination.name) : t.paramedic.noDestination}
          </span>
        </div>
        {rec ? (
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant={rec.status === "PENDING" ? "warning" : rec.status === "APPROVED" ? "stable" : "muted"}>{t.enums.recommendation[rec.status as keyof typeof t.enums.recommendation]}</Badge>
              {rec.required.length ? (
                <span className="text-muted-foreground">
                  {t.destination.required}: {rec.required.map((r) => t.enums.capability[r as keyof typeof t.enums.capability] ?? r).join(" · ")}
                </span>
              ) : null}
            </div>
            <ol className="space-y-2">
              {rec.ranking.map((h, i) => {
                const isCurrent = c.destination?.id === h.hospitalId;
                return (
                  <li key={h.hospitalId} className={cn("rounded-lg border p-3", i === 0 ? "border-violet-300 bg-ai-soft/60" : "bg-white")} data-testid={i === 0 ? "recommended-hospital" : undefined}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          {i === 0 ? <Sparkles className="size-3.5 text-ai" /> : <span className="text-xs text-muted-foreground">#{i + 1}</span>}
                          {h.name}
                          {isCurrent ? <Badge variant="outline">{t.destination.current}</Badge> : null}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {h.reasons.slice(0, 6).map((r, k) => (
                            <span key={k} className={cn("rounded px-1.5 py-0.5 text-[11px]", r.positive ? "bg-stable-soft text-teal-800" : "bg-warning-soft text-amber-800")}>
                              {reasonText(r)}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="text-lg font-semibold tabular">{h.score}%</div>
                        <div className="ltr text-[11px] text-muted-foreground">{formatEta(h.etaSeconds, t.common.min)}</div>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-5 gap-1 text-center text-[10px] text-muted-foreground">
                      <span>{t.destination.capabilityPts} {h.breakdown.capability}</span>
                      <span>{t.destination.etaPts} {h.breakdown.eta}</span>
                      <span>{t.destination.resourcesPts} {h.breakdown.resources}</span>
                      <span>{t.destination.loadPts} {h.breakdown.load}</span>
                      <span>{t.destination.penaltyPts} −{h.breakdown.penalty}</span>
                    </div>
                    {!isCurrent && open ? (
                      <div className="mt-2 flex justify-end gap-2">
                        {canSelect && !locked ? (
                          <Button size="sm" onClick={() => run(`sel-${h.hospitalId}`, `/api/encounters/${c.id}/destination`, { hospitalId: h.hospitalId, recommendationId: i === 0 && rec.status === "PENDING" ? rec.id : undefined }, t.common.saved)} disabled={!!busy} data-testid={i === 0 ? "select-recommended" : undefined}>
                            <Hospital /> {t.destination.select}
                          </Button>
                        ) : null}
                        {canChange && locked && i === 0 && rec.status === "PENDING" ? (
                          <Button size="sm" variant="warning" onClick={() => run("approve", `/api/recommendations/${rec.id}/decision`, { approve: true }, t.common.saved)} disabled={!!busy} data-testid="approve-recommendation">
                            <ArrowRightLeft /> {t.dispatch.approveChange}
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
            {locked && canSelect && !canChange && rec.status === "PENDING" && rec.hospitalId !== c.destination?.id ? (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-warning-soft p-2.5 text-xs text-amber-900">
                <Clock className="size-4" /> {t.destination.requestChange} — {t.destination.awaitingApproval}
              </div>
            ) : null}
            <p className="text-[11px] text-muted-foreground">
              <span className="ltr">{rec.engine}</span> · {formatDateTime(rec.at, locale)}
            </p>
          </>
        ) : canSelect && !locked && open ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {c.hospitals.map((h) => (
              <Button key={h.id} variant="outline" onClick={() => run(`sel-${h.id}`, `/api/encounters/${c.id}/destination`, { hospitalId: h.id }, t.common.saved)} disabled={!!busy}>
                <Hospital /> {locale === "ar" ? h.nameAr : h.name}
              </Button>
            ))}
          </div>
        ) : null}
        {c.destinationHistory.length ? (
          <div>
            <div className="mb-1 text-xs font-semibold text-muted-foreground">{t.destination.history}</div>
            <ul className="space-y-1.5">
              {c.destinationHistory.map((h) => (
                <li key={h.id} className="rounded-lg border bg-warning-soft/50 p-2 text-xs">
                  <div className="font-semibold">
                    {h.from ?? "—"} → {h.to}
                  </div>
                  <div className="text-muted-foreground">
                    {h.reason} · {h.by} ({t.roles[h.role as keyof typeof t.roles] ?? h.role}) · {formatDateTime(h.at, locale)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ───────────── Divert (dispatch) ─────────────

export function DivertDialog({ c, trigger }: { c: Pick<CaseDetail, "id" | "destination" | "hospitals"> & { code?: string }; trigger?: React.ReactNode }) {
  const { t, locale } = useI18n();
  const { busy, run } = useAction();
  const [open, setOpen] = useState(false);
  const options = c.hospitals.filter((h) => h.id !== c.destination?.id);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="warning" size="sm" data-testid="divert-open">
            <ArrowRightLeft /> {t.caseView.divert}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent title={t.destination.changeTitle} description={t.destination.disclaimer}>
        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const ok = await run("divert", `/api/encounters/${c.id}/divert`, { hospitalId: fd.get("hospitalId"), reason: fd.get("reason") }, t.common.saved);
            if (ok) setOpen(false);
          }}
        >
          <Field label={t.destination.previousHospital}>
            <Input value={c.destination ? (locale === "ar" ? c.destination.nameAr : c.destination.name) : "—"} disabled />
          </Field>
          <Field label={t.destination.newHospital}>
            <Select name="hospitalId" required data-testid="divert-hospital">
              {options.map((h) => (
                <option key={h.id} value={h.id}>
                  {locale === "ar" ? h.nameAr : h.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.destination.changeReason}>
            <Textarea name="reason" required minLength={5} rows={3} data-testid="divert-reason" />
          </Field>
          <Button type="submit" variant="warning" disabled={busy === "divert"} data-testid="divert-submit">
            {busy === "divert" ? <Loader2 className="animate-spin" /> : <ArrowRightLeft />} {t.common.confirm}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ───────────── Acknowledge ─────────────

export function AcknowledgeButton({ encounterId, size = "default" }: { encounterId: string; size?: "default" | "sm" | "lg" }) {
  const { t } = useI18n();
  const { busy, run } = useAction();
  return (
    <Button variant="critical" size={size} onClick={() => run("ack", `/api/encounters/${encounterId}/acknowledge`, {}, t.ed.ack)} disabled={busy === "ack"} data-testid="acknowledge">
      {busy === "ack" ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} {t.ed.acknowledge}
    </Button>
  );
}

// ───────────── Preparation ─────────────

const PREP_ITEMS = ["TEAM_NOTIFIED", "BED_PREPARING", "TRAUMA_TEAM_ACTIVATED", "STROKE_TEAM_ACTIVATED", "CATH_LAB_ALERTED", "ISOLATION_REQUIRED", "SPECIALIST_REQUESTED", "BLOOD_BANK_ALERTED", "CT_PREPARATION", "OR_PREPARATION"] as const;
const READINESS = ["NOT_STARTED", "REVIEWING", "PREPARING", "READY", "LIMITED", "RESOURCE_CONSTRAINT"] as const;

export function PreparationPanel({ c, canEdit }: { c: CaseDetail; canEdit: boolean }) {
  const { t, locale } = useI18n();
  const { busy, run } = useAction();
  const [note, setNote] = useState("");
  const done = new Map(c.preparations.map((p) => [p.item, p]));
  const editable = canEdit && !c.divertedAway && !["COMPLETED", "CANCELLED"].includes(c.status);
  return (
    <Card data-testid="preparation-panel">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-4" /> {t.caseView.preparation.title}
          </CardTitle>
        </div>
        <ReadinessBadge s={c.readiness} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {PREP_ITEMS.map((item) => {
            const p = done.get(item);
            const checked = !!p?.done;
            return (
              <button
                key={item}
                disabled={!editable || busy === item}
                onClick={() => run(item, `/api/encounters/${c.id}/preparation`, { item, done: !checked })}
                className={cn("flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-start text-sm transition", checked ? "border-teal-300 bg-stable-soft" : "bg-white hover:bg-muted/50", !editable && "cursor-default")}
                data-testid={`prep-${item}`}
              >
                <span className="flex items-center gap-2">
                  {checked ? <CheckCircle2 className="size-4 text-stable" /> : <Circle className="size-4 text-muted-foreground" />}
                  {t.enums.prep[item]}
                </span>
                {p && checked ? <span className="text-[10px] text-muted-foreground">{p.by} · {formatTime(p.at, locale).slice(0, 5)}</span> : null}
              </button>
            );
          })}
        </div>
        {editable ? (
          <div className="grid gap-2 rounded-lg border p-3">
            <div className="text-xs font-semibold text-muted-foreground">{t.caseView.preparation.setReadiness}</div>
            <div className="flex flex-wrap gap-1.5">
              {READINESS.map((r) => (
                <Button
                  key={r}
                  size="sm"
                  variant={c.readiness === r ? (r === "RESOURCE_CONSTRAINT" ? "critical" : r === "LIMITED" ? "warning" : r === "READY" ? "stable" : "default") : "outline"}
                  onClick={() => run(`r-${r}`, `/api/encounters/${c.id}/readiness`, { readiness: r, note: note || undefined }, t.common.saved)}
                  disabled={!!busy}
                  data-testid={`readiness-${r}`}
                >
                  {t.enums.readiness[r]}
                </Button>
              ))}
            </div>
            <Input placeholder={t.caseView.preparation.note} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ───────────── Handover ─────────────

export function HandoverPanel({ c, canStart, canReceive }: { c: CaseDetail; canStart: boolean; canReceive: boolean }) {
  const { t, locale } = useI18n();
  const { busy, run } = useAction();
  const [notes, setNotes] = useState("");
  const h = c.handover;
  const s = (h?.summary ?? null) as null | {
    patient?: { label: string; age: number | null; sex: string };
    chiefComplaint?: string;
    priority?: string;
    latestVitals?: Record<string, { value: number; value2: number | null; status: string }>;
    interventions?: { type: string; at: string; by: string }[];
    medications?: { name: string; dose: string; route: string; at: string }[];
    allergies?: string[] | null;
    conditionChanges?: { type: string; at: string; detail: Record<string, unknown> }[];
  };
  const mins = (a: string | null, b: string | null) => (a && b ? Math.round(((new Date(b).getTime() - new Date(a).getTime()) / 60000) * 10) / 10 : null);
  return (
    <Card data-testid="handover-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HandHelping className="size-4" /> {t.caseView.handover.title}
        </CardTitle>
        {h ? <Badge variant={h.status === "COMPLETED" ? "stableSolid" : "ai"}>{t.enums.handover[h.status as keyof typeof t.enums.handover]}</Badge> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {!h ? (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">{t.caseView.handover.notStarted}</div>
            {c.status === "ARRIVED" && (canStart || canReceive) ? (
              <Button onClick={() => run("start", `/api/encounters/${c.id}/handover`, { action: "start" })} disabled={!!busy} data-testid="handover-start">
                {busy === "start" ? <Loader2 className="animate-spin" /> : <HandHelping />} {t.caseView.handover.start}
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                [t.caseView.handover.startedAt, h.startedAt, h.startedBy],
                [t.caseView.handover.acceptedAt, h.acceptedAt, h.acceptedBy],
                [t.caseView.handover.completedAt, h.completedAt, h.completedBy],
              ].map(([label, at, by]) => (
                <div key={label as string} className={cn("rounded-lg border p-2", at ? "bg-stable-soft" : "bg-muted/40")}>
                  <div className="text-muted-foreground">{label}</div>
                  <div className="font-semibold tabular">{at ? formatTime(at as string, locale) : "—"}</div>
                  <div className="truncate text-muted-foreground">{by ?? ""}</div>
                </div>
              ))}
            </div>
            {s && s.patient ? (
              <div className="rounded-lg border p-3 text-sm">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.caseView.handover.summary}</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">{t.caseView.patient}: </span>
                    <span className="font-semibold">{s.patient.label}</span> · {s.patient.age ?? "?"} · {t.enums.sex[s.patient.sex as keyof typeof t.enums.sex]}
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t.caseView.priority}: </span>
                    <strong>{s.priority}</strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">{t.caseView.chiefComplaint}: </span>
                    {s.chiefComplaint}
                  </div>
                  <div className="ltr sm:col-span-2 text-start">
                    {Object.entries(s.latestVitals ?? {}).map(([k, v]) => (
                      <span key={k} className="me-3 inline-block text-xs">
                        <span className="text-muted-foreground">{t.enums.vitalShort[k as VitalTypeKey]}</span> <strong>{formatVital(k as VitalTypeKey, v.value, v.value2)}</strong>
                      </span>
                    ))}
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t.caseView.tabs.interventions}: </span>
                    {(s.interventions ?? []).map((i) => t.enums.intervention[i.type as keyof typeof t.enums.intervention]).join(", ") || "—"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t.caseView.tabs.medications}: </span>
                    <span className="ltr">{(s.medications ?? []).map((m) => `${m.name} ${m.dose}`).join(", ") || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t.caseView.handover.allergies}: </span>
                    {s.allergies == null ? t.common.unknown : s.allergies.length ? <strong className="text-critical">{s.allergies.join(", ")}</strong> : t.caseView.health.noKnownAllergies}
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t.caseView.handover.conditionChanges}: </span>
                    {(s.conditionChanges ?? []).length}
                  </div>
                </div>
              </div>
            ) : null}
            {h.status === "STARTED" && canReceive && !c.divertedAway ? (
              <Button variant="stable" onClick={() => run("accept", `/api/encounters/${c.id}/handover`, { action: "accept" }, t.common.saved)} disabled={!!busy} data-testid="handover-accept">
                <Check /> {t.caseView.handover.accept}
              </Button>
            ) : null}
            {h.status === "ACCEPTED" && canReceive && !c.divertedAway ? (
              <div className="grid gap-2">
                <Textarea placeholder={t.caseView.handover.receivingNotes} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                <Button variant="stable" onClick={() => run("complete", `/api/encounters/${c.id}/handover`, { action: "complete", notes: notes || undefined }, t.common.saved)} disabled={!!busy} data-testid="handover-complete">
                  <CheckCircle2 /> {t.caseView.handover.complete}
                </Button>
              </div>
            ) : null}
            {h.status === "COMPLETED" ? (
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg border p-2">
                  <div className="text-muted-foreground">{t.caseView.handover.arrivalToHandover}</div>
                  <div className="text-base font-semibold tabular">{mins(c.arrivedAt, h.completedAt) ?? "—"} {t.common.min}</div>
                </div>
                <div className="rounded-lg border p-2">
                  <div className="text-muted-foreground">{t.caseView.handover.duration}</div>
                  <div className="text-base font-semibold tabular">{mins(h.startedAt, h.completedAt) ?? "—"} {t.common.min}</div>
                </div>
                <div className="rounded-lg border p-2">
                  <div className="text-muted-foreground">{t.caseView.handover.returnToService}</div>
                  <div className="text-base font-semibold tabular">{mins(h.completedAt, c.mission.releasedAt) ?? "—"} {c.mission.releasedAt ? t.common.min : ""}</div>
                </div>
              </div>
            ) : null}
            {h.notes ? <div className="text-xs text-muted-foreground">{h.notes}</div> : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ───────────── Health profile ─────────────

export function HealthProfileCard({ c }: { c: CaseDetail }) {
  const { t, locale } = useI18n();
  const h = c.patient.health;
  if (!h)
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.caseView.health.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground" data-testid="health-unavailable">{t.caseView.health.unavailable}</div>
        </CardContent>
      </Card>
    );
  const list = (items: string[], danger?: boolean) => (items.length ? <ul className="space-y-1">{items.map((x) => <li key={x} className={cn("ltr text-start text-sm", danger && "font-semibold text-critical")}>• {x}</li>)}</ul> : <div className="text-sm text-muted-foreground">{t.common.none}</div>);
  return (
    <Card data-testid="health-profile">
      <CardHeader>
        <div>
          <CardTitle>{t.caseView.health.title}</CardTitle>
          <CardDescription className="mt-1">{t.caseView.health.simulated}</CardDescription>
        </div>
        <Badge variant="ai">{t.common.simulated}</Badge>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="mb-1 text-xs font-semibold text-muted-foreground">{t.caseView.health.allergies}</div>
          {h.allergies.length ? list(h.allergies, true) : <div className="text-sm">{t.caseView.health.noKnownAllergies}</div>}
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold text-muted-foreground">{t.caseView.health.bloodType}</div>
          <div className="ltr text-start text-xl font-semibold">{h.bloodType ?? "—"}</div>
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold text-muted-foreground">{t.caseView.health.alerts}</div>
          {list(h.medicalAlerts, true)}
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold text-muted-foreground">{t.caseView.health.chronic}</div>
          {list(h.chronicConditions)}
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold text-muted-foreground">{t.caseView.health.medications}</div>
          {list(h.medicationHistory.map((m) => `${m.name} — ${m.dose}`))}
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold text-muted-foreground">{t.caseView.health.diagnoses}</div>
          {list(h.criticalDiagnoses, true)}
        </div>
        <div className="text-[11px] text-muted-foreground sm:col-span-2 lg:col-span-3">
          {t.caseView.health.source}: <span className="ltr">{h.source}</span> · {formatDateTime(h.fetchedAt, locale)}
        </div>
      </CardContent>
    </Card>
  );
}

// ───────────── Media ─────────────

export function MediaGallery({ c }: { c: CaseDetail }) {
  const { t, locale } = useI18n();
  if (!c.media.length) return <div className="text-sm text-muted-foreground">{t.caseView.noMedia}</div>;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="media-gallery">
      {c.media.map((m) => (
        <figure key={m.id} className="overflow-hidden rounded-xl border bg-white">
          {m.kind === "VIDEO" ? (
            <video src={`/api/media/${m.id}`} controls className="aspect-video w-full bg-black" preload="metadata" />
          ) : (
            <a href={`/api/media/${m.id}`} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/media/${m.id}`} alt={m.caption ?? m.category} className="aspect-video w-full bg-muted object-cover" loading="lazy" />
            </a>
          )}
          <figcaption className="space-y-0.5 p-3 text-xs">
            <div className="flex items-center justify-between">
              <Badge variant="outline">{t.enums.mediaCategory[m.category as keyof typeof t.enums.mediaCategory]}</Badge>
              <span className="text-muted-foreground tabular">{formatDateTime(m.at, locale)}</span>
            </div>
            {m.caption ? <div className="text-foreground">{m.caption}</div> : null}
            <div className="text-muted-foreground">
              {t.caseView.uploadedBy}: {m.by}
            </div>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export function AlertList({ alerts }: { alerts: CaseDetail["alerts"] }) {
  const { t } = useI18n();
  if (!alerts.length) return null;
  return (
    <div className="space-y-1.5" data-testid="case-alerts">
      {alerts.map((a) => (
        <div key={a.id} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-sm", a.severity === "CRITICAL" ? "border-red-200 bg-critical-soft text-red-800" : a.severity === "WARNING" ? "border-amber-200 bg-warning-soft text-amber-900" : "border-blue-200 bg-info-soft text-blue-900")}>
          <AlertTriangle className="size-4 shrink-0" />
          <span className="font-semibold">{t.enums.alertType[a.type as keyof typeof t.enums.alertType]}</span>
          <span className="ltr truncate text-xs opacity-80">{a.message}</span>
        </div>
      ))}
    </div>
  );
}
