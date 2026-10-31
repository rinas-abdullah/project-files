"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Select } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { api, errorText } from "@/lib/client-api";

const MODES = ["SIMULATED", "NOT_CONFIGURED", "NOT_CONNECTED", "SANDBOX", "CONNECTED"] as const;

export function IntegrationModeSelect({ integrationKey, status }: { integrationKey: string; status: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">{t.integrations.setStatus}</span>
      <Select
        className="h-8 text-xs"
        value={status}
        disabled={busy}
        data-testid={`mode-${integrationKey}`}
        onChange={async (e) => {
          setBusy(true);
          const r = await api(`/api/integrations/${integrationKey}`, { status: e.target.value });
          setBusy(false);
          if (!r.ok) toast.error(r.error === "CREDENTIALS_MISSING" ? t.integrations.credentialsMissing : errorText(t, r));
          router.refresh();
        }}
      >
        {MODES.map((m) => (
          <option key={m} value={m}>
            {t.enums.integrationStatus[m]}
          </option>
        ))}
      </Select>
    </div>
  );
}
