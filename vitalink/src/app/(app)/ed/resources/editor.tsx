"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { ResourceBadge } from "@/components/shared/status";
import { api, errorText } from "@/lib/client-api";
import { formatDateTime } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

export function ResourceEditor({ hospitalId, r }: { hospitalId: string; r: { type: string; status: string; available: number | null; total: number | null; note: string | null; updatedAt: string } }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="rounded-lg border p-3"
      data-testid={`resource-${r.type}`}
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const n = (k: string) => (String(fd.get(k) ?? "") === "" ? null : Number(fd.get(k)));
        setBusy(true);
        const res = await api(`/api/hospitals/${hospitalId}/resources`, { type: r.type, status: fd.get("status"), available: n("available"), total: n("total"), note: String(fd.get("note") ?? "") || null });
        setBusy(false);
        if (!res.ok) return toast.error(errorText(t, res));
        toast.success(t.common.saved);
        router.refresh();
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">{t.enums.resource[r.type as keyof typeof t.enums.resource]}</span>
        <ResourceBadge s={r.status} />
      </div>
      <div className="grid grid-cols-[1.3fr_0.7fr_0.7fr_auto] gap-2">
        <Select name="status" defaultValue={r.status} className="h-9" data-testid={`resource-status-${r.type}`}>
          {(["AVAILABLE", "LIMITED", "UNAVAILABLE", "UNKNOWN"] as const).map((s) => (
            <option key={s} value={s}>
              {t.enums.resourceStatus[s]}
            </option>
          ))}
        </Select>
        <Input name="available" type="number" min={0} defaultValue={r.available ?? ""} className="h-9" placeholder={t.common.available} aria-label={t.common.available} />
        <Input name="total" type="number" min={0} defaultValue={r.total ?? ""} className="h-9" placeholder={t.common.total} aria-label={t.common.total} />
        <Button size="sm" className="h-9" disabled={busy} data-testid={`resource-save-${r.type}`}>
          {busy ? <Loader2 className="animate-spin" /> : <Save />}
        </Button>
      </div>
      <Input name="note" defaultValue={r.note ?? ""} className="mt-2 h-9" placeholder={t.resources.noteLabel} />
      <div className="mt-1 text-[10px] text-muted-foreground">
        {t.common.updated}: {formatDateTime(r.updatedAt, locale)}
      </div>
    </form>
  );
}

export function CapabilityToggle({ hospitalId, capability, available, disabled }: { hospitalId: string; capability: string; available: boolean; disabled: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={disabled || busy}
      onClick={async () => {
        setBusy(true);
        const r = await api(`/api/hospitals/${hospitalId}/capabilities`, { capability, available: !available });
        setBusy(false);
        if (!r.ok) return toast.error(errorText(t, r));
        router.refresh();
      }}
      className={cn("flex items-center justify-between rounded-lg border px-3 py-2 text-sm", available ? "border-teal-300 bg-stable-soft" : "bg-muted/50 text-muted-foreground", disabled && "cursor-default")}
    >
      {t.enums.capability[capability as keyof typeof t.enums.capability]}
      <span className={cn("size-2.5 rounded-full", available ? "bg-stable" : "bg-slate-300")} />
    </button>
  );
}
