"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, CheckCheck } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { SeverityBadge } from "@/components/shared/status";
import { api, toastResult } from "@/lib/client-api";
import { formatDateTime } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

export type AlertRow = { id: string; type: string; severity: string; status: string; message: string; createdAt: string; encounterId: string | null; encounterCode: string | null; hospital: string | null; ambulance: string | null };

export function AlertsList({ alerts, canManage, compact }: { alerts: AlertRow[]; canManage: boolean; compact?: boolean }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const act = async (id: string, action: "acknowledge" | "resolve") => {
    setBusy(id);
    const r = await api(`/api/alerts/${id}`, { action });
    setBusy(null);
    if (toastResult(t, r)) router.refresh();
  };
  if (!alerts.length) return <div className="py-4 text-center text-sm text-muted-foreground">{t.alertsPage.none}</div>;
  return (
    <ul className="divide-y" data-testid="alerts-list">
      {alerts.map((a) => (
        <li key={a.id} className={cn("flex items-start gap-3 py-2.5", a.status === "RESOLVED" && "opacity-60")} data-alert-type={a.type}>
          <AlertTriangle className={cn("mt-0.5 size-4 shrink-0", a.severity === "CRITICAL" ? "text-critical" : a.severity === "WARNING" ? "text-warning" : "text-info")} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">{t.enums.alertType[a.type as keyof typeof t.enums.alertType] ?? a.type}</span>
              {!compact ? <SeverityBadge s={a.severity} /> : null}
              {a.status !== "OPEN" ? <span className="text-[11px] text-muted-foreground">{t.enums.alertStatus[a.status as keyof typeof t.enums.alertStatus]}</span> : null}
            </div>
            <div className="ltr truncate text-start text-xs text-muted-foreground">{a.message}</div>
            <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
              <span>{formatDateTime(a.createdAt, locale)}</span>
              {a.encounterId ? (
                <Link className="ltr text-info hover:underline" href={`/cases/${a.encounterId}`}>
                  {a.encounterCode}
                </Link>
              ) : null}
              {a.hospital && !compact ? <span>{a.hospital}</span> : null}
            </div>
          </div>
          {canManage && a.status !== "RESOLVED" ? (
            <div className="flex shrink-0 gap-1">
              {a.status === "OPEN" ? (
                <button title={t.alertsPage.acknowledge} disabled={busy === a.id} onClick={() => act(a.id, "acknowledge")} className="rounded-md border p-1.5 hover:bg-muted">
                  <Check className="size-3.5" />
                </button>
              ) : null}
              <button title={t.alertsPage.resolve} disabled={busy === a.id} onClick={() => act(a.id, "resolve")} className="rounded-md border p-1.5 hover:bg-muted">
                <CheckCheck className="size-3.5" />
              </button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
