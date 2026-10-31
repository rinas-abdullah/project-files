"use client";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

type Variant = BadgeProps["variant"];

export const priorityVariant = (p: string): Variant => (p === "P1" ? "criticalSolid" : p === "P2" ? "warningSolid" : p === "P3" ? "info" : "stable");

export function PriorityBadge({ p, long, className }: { p: string; long?: boolean; className?: string }) {
  const { t } = useI18n();
  const label = long ? t.enums.priority[p as keyof typeof t.enums.priority] : p;
  return (
    <Badge variant={priorityVariant(p)} className={cn(p === "P1" && "pulse-critical", className)}>
      {label}
    </Badge>
  );
}

const statusVariant: Record<string, Variant> = {
  CREATED: "muted",
  ACTIVE: "info",
  PRE_ALERT_SENT: "warning",
  ACKNOWLEDGED: "stable",
  PREPARING: "stable",
  APPROACHING: "info",
  ARRIVED: "default",
  HANDOVER: "ai",
  COMPLETED: "muted",
  CANCELLED: "muted",
  DIVERTED: "warning",
};
export function EncounterStatusBadge({ s }: { s: string }) {
  const { t } = useI18n();
  return <Badge variant={statusVariant[s] ?? "muted"}>{t.enums.encounterStatus[s as keyof typeof t.enums.encounterStatus] ?? s}</Badge>;
}

const readinessVariant: Record<string, Variant> = {
  NOT_STARTED: "muted",
  REVIEWING: "info",
  PREPARING: "warning",
  READY: "stableSolid",
  LIMITED: "warning",
  RESOURCE_CONSTRAINT: "criticalSolid",
};
export function ReadinessBadge({ s }: { s: string }) {
  const { t } = useI18n();
  return <Badge variant={readinessVariant[s] ?? "muted"}>{t.enums.readiness[s as keyof typeof t.enums.readiness] ?? s}</Badge>;
}

const resourceVariant: Record<string, Variant> = { AVAILABLE: "stable", LIMITED: "warning", UNAVAILABLE: "critical", UNKNOWN: "muted" };
export function ResourceBadge({ s }: { s: string }) {
  const { t } = useI18n();
  return <Badge variant={resourceVariant[s] ?? "muted"}>{t.enums.resourceStatus[s as keyof typeof t.enums.resourceStatus] ?? s}</Badge>;
}

const integrationVariant: Record<string, Variant> = { CONNECTED: "stableSolid", SANDBOX: "info", SIMULATED: "ai", NOT_CONNECTED: "muted", NOT_CONFIGURED: "muted", ERROR: "criticalSolid" };
export function IntegrationBadge({ s }: { s: string }) {
  const { t } = useI18n();
  return <Badge variant={integrationVariant[s] ?? "muted"}>{t.enums.integrationStatus[s as keyof typeof t.enums.integrationStatus] ?? s}</Badge>;
}

const ambVariant: Record<string, Variant> = { AVAILABLE: "stable", DISPATCHED: "warning", ON_SCENE: "info", TRANSPORTING: "criticalSolid", AT_HOSPITAL: "default", OUT_OF_SERVICE: "muted" };
export function AmbulanceStatusBadge({ s }: { s: string }) {
  const { t } = useI18n();
  return <Badge variant={ambVariant[s] ?? "muted"}>{t.enums.ambulanceStatus[s as keyof typeof t.enums.ambulanceStatus] ?? s}</Badge>;
}

export function ConditionBadge({ s }: { s: string }) {
  const { t } = useI18n();
  const v: Variant = s === "CRITICAL" ? "criticalSolid" : s === "DETERIORATING" ? "critical" : s === "IMPROVING" ? "stable" : "muted";
  return <Badge variant={v}>{t.enums.condition[s as keyof typeof t.enums.condition] ?? s}</Badge>;
}

export function IdentityBadge({ unknown, verified }: { unknown: boolean; verified: boolean }) {
  const { t } = useI18n();
  if (unknown) return <Badge variant="warning">{t.enums.identity.UNIDENTIFIED}</Badge>;
  return <Badge variant={verified ? "stable" : "outline"}>{verified ? t.enums.identity.VERIFIED : t.enums.identity.MANUAL}</Badge>;
}

export function DeliveryBadge({ s }: { s: string | null | undefined }) {
  const { t } = useI18n();
  if (!s) return null;
  const v: Variant = s === "DELIVERED" ? "stable" : s === "FAILED" ? "criticalSolid" : s === "RETRYING" ? "warning" : "muted";
  return <Badge variant={v}>{t.enums.delivery[s as keyof typeof t.enums.delivery] ?? s}</Badge>;
}

export function SeverityBadge({ s }: { s: string }) {
  const { t } = useI18n();
  const v: Variant = s === "CRITICAL" ? "criticalSolid" : s === "WARNING" ? "warning" : "info";
  return <Badge variant={v}>{t.enums.alertSeverity[s as keyof typeof t.enums.alertSeverity] ?? s}</Badge>;
}

export function VitalStatusDot({ s }: { s: string }) {
  return <span className={cn("inline-block size-2 rounded-full", s === "CRITICAL" ? "bg-critical" : s === "ABNORMAL" ? "bg-warning" : "bg-stable")} />;
}

export function T({ k }: { k: string }) {
  // Resolve a dotted dictionary path at runtime (used for dynamic enum labels in server components)
  const { t } = useI18n();
  const v = k.split(".").reduce<unknown>((o, p) => (o && typeof o === "object" ? (o as Record<string, unknown>)[p] : undefined), t);
  return <>{typeof v === "string" ? v : k.split(".").pop()}</>;
}
