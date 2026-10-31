"use client";
import Link from "next/link";
import { Ambulance, ArrowRightLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import type { Card as CardData } from "@/lib/queries";
import { useI18n } from "@/components/i18n-provider";
import { Badge } from "@/components/ui/badge";
import { ConditionBadge, EncounterStatusBadge, PriorityBadge, ReadinessBadge } from "@/components/shared/status";
import { AcknowledgeButton } from "@/components/case/panels";
import { formatEta, formatKm, formatTime } from "@/lib/i18n/format";
import { formatVital, type VitalTypeKey } from "@/lib/engines/vitals";
import { cn } from "@/lib/utils";

const SHOW: VitalTypeKey[] = ["HEART_RATE", "BLOOD_PRESSURE", "SPO2", "RESPIRATORY_RATE", "GCS"];

export function IncomingCaseCard({ c, canAck, divertedAway }: { c: CardData; canAck: boolean; divertedAway?: boolean }) {
  const { t, locale } = useI18n();
  const critical = c.priority === "P1" || c.criticalAlerts > 0;
  return (
    <div
      className={cn("relative overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgba(11,26,51,0.05)]", critical && !divertedAway && "border-red-300", divertedAway && "opacity-75")}
      data-testid="incoming-card"
      data-code={c.code}
    >
      <div className={cn("absolute inset-y-0 start-0 w-1", c.priority === "P1" ? "bg-critical" : c.priority === "P2" ? "bg-warning" : c.priority === "P3" ? "bg-info" : "bg-stable")} />
      <div className="p-4 ps-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge p={c.priority} />
              <span className="ltr truncate text-base font-semibold">{c.patientLabel}</span>
              {c.isUnknown ? <Badge variant="warning">{t.enums.identity.UNIDENTIFIED}</Badge> : null}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {c.age != null ? `${c.age}${c.ageEstimated ? "~" : ""} ${t.common.years}` : "—"} · {t.enums.sex[c.sex as keyof typeof t.enums.sex]} · <span className="ltr">{c.code}</span>
            </div>
          </div>
          <div className="text-end">
            <div className={cn("ltr text-2xl font-semibold tabular leading-none", c.etaSeconds != null && c.etaSeconds <= 300 && !c.arrivedAt ? "text-critical" : "text-foreground")} data-testid="card-eta">
              {c.arrivedAt ? <span className="text-base">{t.enums.encounterStatus.ARRIVED}</span> : formatEta(c.etaSeconds, t.common.min)}
            </div>
            <div className="ltr mt-1 text-[11px] text-muted-foreground">{c.arrivedAt ? formatTime(c.arrivedAt, locale).slice(0, 5) : formatKm(c.distanceMeters, t.common.km)}</div>
          </div>
        </div>

        <div className="mt-2 line-clamp-2 text-sm font-medium">{c.chiefComplaint}</div>

        <div className="ltr mt-3 grid grid-cols-5 gap-1.5">
          {SHOW.map((k) => {
            const v = c.latest[k];
            return (
              <div key={`${k}-${v?.at}`} className={cn("flash-update rounded-md px-1.5 py-1 text-center", v?.status === "CRITICAL" ? "bg-critical-soft text-red-700" : v?.status === "ABNORMAL" ? "bg-warning-soft text-amber-800" : "bg-muted/60")}>
                <div className="text-[9px] font-semibold uppercase text-muted-foreground">{t.enums.vitalShort[k]}</div>
                <div className="text-sm font-semibold tabular" data-testid={`card-${k}`}>{v ? formatVital(k, v.value, v.value2) : "—"}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Ambulance className="size-3.5" /> <span className="ltr font-medium text-foreground">{c.ambulance}</span>
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" /> {c.destination ? (locale === "ar" ? c.destination.nameAr : c.destination.name) : "—"}
          </span>
          <ConditionBadge s={c.conditionTrend} />
          <EncounterStatusBadge s={c.status} />
          <ReadinessBadge s={c.readiness} />
        </div>

        {divertedAway ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-300 bg-warning-soft px-3 py-2 text-xs font-semibold text-amber-900" data-testid="case-diverted">
            <ArrowRightLeft className="size-4" /> {t.destination.diverted} · {t.destination.divertedTo} {c.destination?.name}
          </div>
        ) : c.status === "DIVERTED" ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-300 bg-warning-soft px-3 py-2 text-xs font-semibold text-amber-900">
            <ArrowRightLeft className="size-4" /> {t.destination.divertedIncoming} {c.lastDiversion?.from ? `(${c.lastDiversion.from})` : ""}
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
          {c.acknowledgedAt ? (
            <span className="flex items-center gap-1.5 text-xs text-teal-700">
              <Clock className="size-3.5" /> {t.ed.ack} · {c.acknowledgedBy?.name} · {formatTime(c.acknowledgedAt, locale).slice(0, 5)}
            </span>
          ) : canAck && !divertedAway && c.preAlertSentAt ? (
            <AcknowledgeButton encounterId={c.id} size="sm" />
          ) : (
            <Badge variant={divertedAway ? "muted" : "critical"}>{t.ed.notAck}</Badge>
          )}
          <Link href={`/cases/${c.id}`} className="flex items-center gap-1 text-sm font-semibold text-info hover:underline" data-testid="open-case">
            {t.ed.openCase} <ChevronRight className="size-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
