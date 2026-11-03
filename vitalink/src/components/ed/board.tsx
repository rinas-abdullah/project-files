"use client";
import Link from "next/link";
import { Ambulance, BedDouble, CheckCircle2, ChevronLeft, ClipboardList, Clock, FlaskConical, Heart, MapPin, Thermometer, UserRound, Wind } from "lucide-react";
import type { Card as CardData } from "@/lib/queries";
import type { CaseDetail } from "@/lib/case-detail";
import { useI18n } from "@/components/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/shared/status";
import { AcknowledgeButton } from "@/components/case/panels";
import { formatEta, formatTime } from "@/lib/i18n/format";
import { formatVital } from "@/lib/engines/vitals";
import { cn } from "@/lib/utils";

type Tone = "orange" | "blue" | "green" | "teal";
const TONE: Record<Tone, string> = {
  orange: "bg-orange-50 text-orange-600",
  blue: "bg-sky-50 text-sky-700",
  green: "bg-brand-soft text-navy-700",
  teal: "bg-teal-50 text-teal-700",
};

/** One of the four status counters across the top of the board. */
export function StatusTile({ label, value, icon, tone, testId }: { label: string; value: number; icon: React.ReactNode; tone: Tone; testId?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(16,40,34,0.04)]" data-testid={testId}>
      <div>
        <div className="text-[13px] font-medium text-muted-foreground">{label}</div>
        <div className="mt-1 text-[26px] font-bold leading-none tabular">{value}</div>
      </div>
      <span className={cn("flex size-11 items-center justify-center rounded-xl", TONE[tone])}>{icon}</span>
    </div>
  );
}

export function statusPill(c: CardData): { key: "pillArrived" | "pillReady" | "pillWaiting" | "pillEnRoute"; tone: Tone } {
  if (c.arrivedAt) return { key: "pillArrived", tone: "teal" };
  if (c.readiness === "READY") return { key: "pillReady", tone: "green" };
  if (c.acknowledgedAt) return { key: "pillWaiting", tone: "blue" };
  return { key: "pillEnRoute", tone: "orange" };
}

/** Right-hand list (start side in RTL): every incoming case, the selected one highlighted. */
export function CaseList({ cases, selectedId, hrefBase }: { cases: CardData[]; selectedId: string | null; hrefBase: string }) {
  const { t } = useI18n();
  const b = t.ed.board;
  return (
    <section className="rounded-2xl border bg-white p-3" data-testid="case-list">
      <h2 className="flex items-center gap-2 px-1.5 pb-2 text-[15px] font-bold">
        <ClipboardList className="size-4.5 text-navy-800" /> {b.caseList} <span className="text-muted-foreground">({cases.length})</span>
      </h2>
      {cases.length === 0 ? <p className="px-1.5 py-6 text-sm text-muted-foreground">{t.ed.noIncoming}</p> : null}
      <ul className="flex flex-col gap-1">
        {cases.map((c) => {
          const pill = statusPill(c);
          const active = c.id === selectedId;
          return (
            <li key={c.id}>
              <Link
                href={`${hrefBase}${c.id}`}
                scroll={false}
                className={cn("flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 transition", active ? "bg-brand-soft ring-1 ring-navy-900/25" : "hover:bg-muted/70")}
                data-testid="case-list-item"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className={cn("size-2 shrink-0 rounded-full", c.priority === "P1" ? "bg-critical" : c.priority === "P2" ? "bg-warning" : c.priority === "P3" ? "bg-info" : "bg-stable")} />
                  <span className="truncate text-sm font-semibold">{c.patientLabel}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold", TONE[pill.tone])}>{b[pill.key]}</span>
                  <ChevronLeft className="size-4 text-muted-foreground ltr:rotate-180" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function BigVital({ icon, value, label, status }: { icon: React.ReactNode; value: string; label: string; status?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl bg-muted/50 px-2 py-3">
      <div className={cn("ltr flex items-center gap-1.5 text-xl font-bold tabular", status === "CRITICAL" ? "text-critical" : status === "ABNORMAL" ? "text-amber-600" : "text-foreground")}>
        {icon}
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

/** Centre panel: the selected patient, laid out for a glance from across the room. */
export function FocusPanel({ c, detail, canAck }: { c: CardData; detail: CaseDetail | null; canAck: boolean }) {
  const { t, locale } = useI18n();
  const b = t.ed.board;
  const v = c.latest;
  const allergies = detail?.patient.health?.allergies ?? null;
  const pill = statusPill(c);
  return (
    <section className="rounded-2xl border bg-white p-5" data-testid="focus-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <UserRound className="size-5 text-navy-800" />
            <span className="ltr truncate">{c.patientLabel}</span>
            <PriorityBadge p={c.priority} />
            {c.isUnknown ? <Badge variant="warning">{t.enums.identity.UNIDENTIFIED}</Badge> : null}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {b.age}: {c.age != null ? `${c.age}${c.ageEstimated ? "~" : ""} ${t.common.years}` : "—"}
            <span className="mx-2 text-border">|</span>
            {b.complaint}: <span className="text-foreground">{c.chiefComplaint}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <BigVital icon={<Thermometer className="size-4" />} value={v.TEMPERATURE ? `${v.TEMPERATURE.value}°C` : "—"} label={t.enums.vital.TEMPERATURE} status={v.TEMPERATURE?.status} />
        <BigVital icon={<Wind className="size-4" />} value={v.SPO2 ? `${v.SPO2.value}%` : "—"} label={t.enums.vital.SPO2} status={v.SPO2?.status} />
        <BigVital icon={<Heart className="size-4" />} value={v.HEART_RATE ? `${v.HEART_RATE.value}` : "—"} label={`${t.enums.vital.HEART_RATE} (bpm)`} status={v.HEART_RATE?.status} />
        <BigVital icon={null} value={v.BLOOD_PRESSURE ? formatVital("BLOOD_PRESSURE", v.BLOOD_PRESSURE.value, v.BLOOD_PRESSURE.value2) : "—"} label={t.enums.vital.BLOOD_PRESSURE} status={v.BLOOD_PRESSURE?.status} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {allergies && allergies.length ? (
          <span className="flex items-center gap-1.5 rounded-lg bg-critical-soft px-3 py-1.5 text-sm font-semibold text-red-700" data-testid="focus-allergy">
            <FlaskConical className="size-4" /> {b.allergy}: {allergies.join("، ")}
          </span>
        ) : (
          <span className="rounded-lg bg-muted px-3 py-1.5 text-sm text-muted-foreground">{allergies ? b.noAllergy : b.allergyUnknown}</span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className={cn("flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold", TONE[pill.tone])}>
          <Ambulance className="size-4" /> {b[pill.key]} · <span className="ltr">{c.ambulance}</span>
        </div>
        <div className="flex items-center justify-center gap-2 rounded-xl bg-orange-50 px-3 py-2.5 text-sm font-bold text-orange-700">
          <Clock className="size-4" /> <span className="ltr">{c.arrivedAt ? formatTime(c.arrivedAt, locale).slice(0, 5) : formatEta(c.etaSeconds, t.common.min)}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
        {c.acknowledgedAt ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-navy-700">
            <CheckCircle2 className="size-4" /> {t.ed.ack} · {c.acknowledgedBy?.name}
          </span>
        ) : canAck && c.preAlertSentAt ? (
          <AcknowledgeButton encounterId={c.id} />
        ) : (
          <Badge variant="critical">{t.ed.notAck}</Badge>
        )}
        <Link href={`/cases/${c.id}`} className="flex items-center gap-1 text-sm font-semibold text-navy-800 hover:underline">
          {t.ed.openCase} <ChevronLeft className="size-4 ltr:rotate-180" />
        </Link>
      </div>
      {c.destination ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5" /> {locale === "ar" ? c.destination.nameAr : c.destination.name}
          <BedDouble className="ms-2 size-3.5" /> {t.enums.readiness[c.readiness as keyof typeof t.enums.readiness]}
        </p>
      ) : null}
    </section>
  );
}
