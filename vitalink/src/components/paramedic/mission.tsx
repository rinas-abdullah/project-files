"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Navigation, Pause, Play, Power, Siren, LocateFixed, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { api, errorText } from "@/lib/client-api";

const TYPES = ["TRAFFIC_ACCIDENT", "MEDICAL_EMERGENCY", "CARDIAC", "STROKE", "TRAUMA", "FIRE", "MASS_CASUALTY", "OTHER"] as const;

export function NewMissionForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="grid gap-4"
      data-testid="new-mission-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setBusy(true);
        const r = await api("/api/missions", { incidentType: fd.get("incidentType"), address: String(fd.get("address") ?? ""), description: String(fd.get("description") ?? "") || undefined });
        setBusy(false);
        if (!r.ok) return toast.error(errorText(t, r));
        router.refresh();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t.paramedic.incidentType}>
          <Select name="incidentType" defaultValue="MEDICAL_EMERGENCY" className="h-12" data-testid="incident-type">
            {TYPES.map((x) => (
              <option key={x} value={x}>
                {t.enums.incidentType[x]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.paramedic.address}>
          <Input name="address" required minLength={2} className="h-12" defaultValue="Prince Sultan Rd, Al-Salamah, Jeddah" data-testid="incident-address" />
        </Field>
      </div>
      <Field label={t.paramedic.description}>
        <Textarea name="description" rows={2} />
      </Field>
      <Button type="submit" size="xl" variant="critical" disabled={busy} data-testid="start-mission">
        {busy ? <Loader2 className="animate-spin" /> : <Siren />} {t.paramedic.startMission}
      </Button>
    </form>
  );
}

export function OnSceneButton({ missionId }: { missionId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="lg"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const r = await api(`/api/missions/${missionId}/on-scene`, {});
        setBusy(false);
        if (!r.ok) return toast.error(errorText(t, r));
        router.refresh();
      }}
    >
      <MapPin /> {t.paramedic.markOnScene}
    </Button>
  );
}

export function TransportControls({ missionId, ambulanceId, transporting, driving }: { missionId: string; ambulanceId: string; transporting: boolean; driving: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const drive = async (action: string) => {
    setBusy(action);
    const r = await api(`/api/missions/${missionId}/drive`, { action, steps: action === "start" ? 2 : 4 });
    setBusy(null);
    if (!r.ok) toast.error(errorText(t, r));
    router.refresh();
  };
  const gps = () => {
    if (!navigator.geolocation) return toast.error(t.errors.NETWORK);
    setBusy("gps");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const r = await api(`/api/ambulances/${ambulanceId}/position`, { lat: pos.coords.latitude, lng: pos.coords.longitude, speedKmh: pos.coords.speed ? pos.coords.speed * 3.6 : undefined });
        setBusy(null);
        if (!r.ok) toast.error(errorText(t, r));
        else router.refresh();
      },
      () => {
        setBusy(null);
        toast.error(t.common.error);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };
  return (
    <div className="flex flex-wrap gap-2">
      {transporting ? (
        driving ? (
          <Button variant="outline" onClick={() => drive("stop")} disabled={!!busy} data-testid="drive-stop">
            <Pause /> {t.paramedic.stopDriving}
          </Button>
        ) : (
          <Button onClick={() => drive("start")} disabled={!!busy} data-testid="drive-start">
            {busy === "start" ? <Loader2 className="animate-spin" /> : <Play />} {t.paramedic.startDriving}
          </Button>
        )
      ) : null}
      {transporting ? (
        <Button variant="outline" onClick={() => drive("step")} disabled={!!busy} data-testid="drive-step">
          <Navigation /> +
        </Button>
      ) : null}
      <Button variant="outline" onClick={gps} disabled={!!busy}>
        <LocateFixed /> {t.paramedic.useGps}
      </Button>
    </div>
  );
}

export function ReleaseButton({ missionId }: { missionId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="stable"
      size="xl"
      className="w-full"
      disabled={busy}
      data-testid="release-ambulance"
      onClick={async () => {
        setBusy(true);
        const r = await api(`/api/missions/${missionId}/release`, {});
        setBusy(false);
        if (!r.ok) return toast.error(errorText(t, r));
        toast.success(t.paramedic.released);
        router.push("/paramedic");
        router.refresh();
      }}
    >
      {busy ? <Loader2 className="animate-spin" /> : <Power />} {t.paramedic.release}
    </Button>
  );
}
