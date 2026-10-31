"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, Radio, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { api, errorText } from "@/lib/client-api";
import { fmt, formatEta } from "@/lib/i18n/format";

const TYPES = ["TRAFFIC_ACCIDENT", "MEDICAL_EMERGENCY", "CARDIAC", "STROKE", "TRAUMA", "FIRE", "MASS_CASUALTY", "OTHER"] as const;
export const PRESETS = [
  { name: "Al-Zahra, Jeddah", lat: 21.583, lng: 39.137 },
  { name: "Al-Rehab, Jeddah", lat: 21.553, lng: 39.228 },
  { name: "Al-Andalus, Jeddah", lat: 21.528, lng: 39.162 },
  { name: "Al-Muhammadiyah, Jeddah", lat: 21.646, lng: 39.122 },
  { name: "Al-Nuzha, Jeddah", lat: 21.612, lng: 39.183 },
  { name: "Al-Thaghr, Jeddah", lat: 21.479, lng: 39.215 },
  { name: "Obhur Al-Shamaliyah, Jeddah", lat: 21.724, lng: 39.125 },
  { name: "Madinah Rd, Jeddah", lat: 21.555, lng: 39.192 },
];

export function DispatchForm({ ambulances }: { ambulances: { id: string; callSign: string; baseName: string }[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [preset, setPreset] = useState(0);
  const [busy, setBusy] = useState(false);
  const p = PRESETS[preset];
  return (
    <form
      key={preset}
      className="grid gap-3"
      data-testid="dispatch-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setBusy(true);
        const r = await api("/api/missions", {
          incidentType: fd.get("type"),
          address: String(fd.get("address")),
          description: String(fd.get("description") ?? "") || undefined,
          lat: Number(fd.get("lat")),
          lng: Number(fd.get("lng")),
          ambulanceId: fd.get("ambulanceId"),
          isMassCasualty: fd.get("mci") === "on",
        });
        setBusy(false);
        if (!r.ok) return toast.error(errorText(t, r));
        toast.success(t.common.sent);
        router.refresh();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.incidents.type}>
          <Select name="type" defaultValue="MEDICAL_EMERGENCY">
            {TYPES.map((x) => (
              <option key={x} value={x}>
                {t.enums.incidentType[x]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.dispatch.selectAmbulance}>
          <Select name="ambulanceId" required disabled={!ambulances.length}>
            {ambulances.map((a) => (
              <option key={a.id} value={a.id}>
                {a.callSign} · {a.baseName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.dispatch.preset}>
          <Select value={preset} onChange={(e) => setPreset(Number(e.target.value))}>
            {PRESETS.map((x, i) => (
              <option key={x.name} value={i}>
                {x.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.incidents.address}>
          <Input name="address" defaultValue={p.name} required />
        </Field>
        <Field label={t.dispatch.lat}>
          <Input name="lat" type="number" step="0.0001" defaultValue={p.lat} dir="ltr" required />
        </Field>
        <Field label={t.dispatch.lng}>
          <Input name="lng" type="number" step="0.0001" defaultValue={p.lng} dir="ltr" required />
        </Field>
      </div>
      <Field label={t.paramedic.description}>
        <Textarea name="description" rows={2} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="mci" className="size-4" /> {t.dispatch.massCasualty}
      </label>
      <Button type="submit" variant="critical" disabled={busy || !ambulances.length}>
        {busy ? <Loader2 className="animate-spin" /> : <Radio />} {t.dispatch.dispatch}
      </Button>
    </form>
  );
}

export type PendingRec = {
  id: string;
  encounterId: string;
  code: string;
  priority: string;
  patient: string;
  from: string | null;
  to: string;
  score: number;
  etaSeconds: number | null;
  reasons: { code: string; params?: Record<string, string | number>; positive: boolean }[];
  requestedBy: string | null;
};

export function RecommendationApproval({ rec }: { rec: PendingRec }) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const decide = async (approve: boolean) => {
    setBusy(approve ? "a" : "r");
    const r = await api(`/api/recommendations/${rec.id}/decision`, { approve, note: note || undefined });
    setBusy(null);
    if (!r.ok) return toast.error(errorText(t, r));
    toast.success(t.common.saved);
    router.refresh();
  };
  const reasonText = (r: PendingRec["reasons"][number]) => {
    const p = { ...(r.params ?? {}) };
    if (p.cap) p.cap = t.enums.capability[p.cap as keyof typeof t.enums.capability] ?? p.cap;
    if (p.res) p.res = t.enums.resource[p.res as keyof typeof t.enums.resource] ?? p.res;
    return fmt(t.destination.reason[r.code as keyof typeof t.destination.reason] ?? r.code, p);
  };
  return (
    <div className="rounded-lg border border-violet-200 bg-ai-soft/40 p-3" data-testid="pending-recommendation">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold">
          <span className="ltr">{rec.code}</span> · {rec.priority} · <span className="ltr">{rec.patient}</span>
        </div>
        <div className="flex items-center gap-1 text-sm font-semibold text-ai">
          <Sparkles className="size-4" /> {rec.score}%
        </div>
      </div>
      <div className="mt-1 text-sm">
        {rec.from ?? "—"} → <strong>{rec.to}</strong> <span className="ltr text-xs text-muted-foreground">({formatEta(rec.etaSeconds, t.common.min)})</span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {rec.reasons.slice(0, 5).map((r, i) => (
          <span key={i} className={`rounded px-1.5 py-0.5 text-[11px] ${r.positive ? "bg-stable-soft text-teal-800" : "bg-warning-soft text-amber-800"}`}>
            {reasonText(r)}
          </span>
        ))}
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">{t.destination.disclaimer}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.common.reason} className="h-8 max-w-60 text-xs" />
        <Button size="sm" variant="warning" onClick={() => decide(true)} disabled={!!busy} data-testid="rec-approve">
          {busy === "a" ? <Loader2 className="animate-spin" /> : <Check />} {t.dispatch.approveChange}
        </Button>
        <Button size="sm" variant="outline" onClick={() => decide(false)} disabled={!!busy}>
          <X /> {t.common.reject}
        </Button>
      </div>
    </div>
  );
}
