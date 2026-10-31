"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Activity,
  BellRing,
  Camera,
  Fingerprint,
  Flag,
  HeartPulse,
  Loader2,
  NotebookPen,
  Pill,
  Stethoscope,
  TrendingDown,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { useOutbox } from "./outbox";
import { api, errorText } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type Tile = { icon: React.ComponentType<{ className?: string }>; label: string; tone?: "critical" | "ai" | "default" };

function ActionTile({ icon: Icon, label, tone = "default", ...rest }: Tile & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "flex min-h-[84px] flex-col items-start justify-between gap-2 rounded-xl border p-3 text-start text-sm font-semibold shadow-sm transition active:scale-[0.98] disabled:opacity-50",
        tone === "critical" ? "border-red-700 bg-critical text-white hover:bg-red-700" : "bg-white hover:border-navy-700 hover:bg-muted/40",
      )}
      {...rest}
    >
      <Icon className={cn("size-5", tone === "critical" ? "text-white" : "text-navy-800")} />
      <span className="leading-tight">{label}</span>
    </button>
  );
}

function useClose() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}

// ───────────── Create patient (new encounter) ─────────────

export function CreatePatientDialog({ missionId, trigger }: { missionId: string; trigger?: React.ReactNode }) {
  const { t } = useI18n();
  const router = useRouter();
  const { open, setOpen } = useClose();
  const [unknown, setUnknown] = useState(false);
  const [busy, setBusy] = useState(false);
  const f = t.paramedic.patientForm;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const s = (k: string) => (fd.get(k) as string)?.trim() || undefined;
    setBusy(true);
    const r = await api<{ id: string }>("/api/encounters", {
      missionId,
      isUnknown: unknown,
      fullName: unknown ? undefined : s("fullName"),
      temporaryName: unknown ? s("temporaryName") : undefined,
      age: s("age") ? Number(s("age")) : undefined,
      ageEstimated: fd.get("ageEstimated") === "on",
      sex: s("sex") ?? "UNKNOWN",
      nationalId: unknown ? undefined : s("nationalId"),
      phone: s("phone"),
      chiefComplaint: s("chiefComplaint") ?? "",
      mechanism: s("mechanism"),
      priority: s("priority") ?? "P3",
      notes: s("notes"),
    });
    setBusy(false);
    if (!r.ok) return toast.error(errorText(t, r));
    setOpen(false);
    router.push(`/paramedic/${r.data.id}`);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <ActionTile icon={UserPlus} label={t.paramedic.createPatient} data-testid="action-create-patient" />}</DialogTrigger>
      <DialogContent title={f.title} wide>
        <form onSubmit={submit} className="grid gap-4" data-testid="patient-form">
          <label className="flex items-center gap-3 rounded-lg border border-amber-200 bg-warning-soft p-3 text-sm font-medium text-amber-900">
            <input type="checkbox" className="size-5 accent-amber-600" checked={unknown} onChange={(e) => setUnknown(e.target.checked)} data-testid="unknown-toggle" />
            {f.unknownToggle}
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {unknown ? (
              <Field label={f.temporaryName}>
                <Input name="temporaryName" placeholder="e.g. Male, ~40, blue thobe" />
              </Field>
            ) : (
              <Field label={f.name}>
                <Input name="fullName" required={!unknown} data-testid="patient-name" />
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label={f.age}>
                <Input name="age" type="number" min={0} max={120} inputMode="numeric" data-testid="patient-age" />
              </Field>
              <Field label={f.sex}>
                <Select name="sex" defaultValue={unknown ? "MALE" : "MALE"} data-testid="patient-sex">
                  {(["MALE", "FEMALE", "UNKNOWN"] as const).map((s) => (
                    <option key={s} value={s}>
                      {t.enums.sex[s]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            {!unknown ? (
              <Field label={f.nationalId}>
                <Input name="nationalId" inputMode="numeric" pattern="\d{10}" dir="ltr" />
              </Field>
            ) : (
              <label className="flex items-center gap-2 self-end pb-2 text-sm">
                <input type="checkbox" name="ageEstimated" defaultChecked className="size-4" /> {f.ageEstimated}
              </label>
            )}
            <Field label={f.phone}>
              <Input name="phone" inputMode="tel" dir="ltr" />
            </Field>
          </div>
          <Field label={f.chiefComplaint}>
            <Input name="chiefComplaint" required minLength={3} data-testid="chief-complaint" />
          </Field>
          <Field label={f.mechanism}>
            <Input name="mechanism" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
            <Field label={f.priority}>
              <Select name="priority" defaultValue="P2" data-testid="patient-priority">
                {(["P1", "P2", "P3", "P4"] as const).map((p) => (
                  <option key={p} value={p}>
                    {t.enums.priority[p]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={f.notes}>
              <Input name="notes" />
            </Field>
          </div>
          <Button type="submit" size="lg" disabled={busy} data-testid="create-encounter">
            {busy ? <Loader2 className="animate-spin" /> : <UserPlus />} {f.create}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ───────────── Identify (Digital Identity) ─────────────

export function IdentifyDialog({ encounterId, integrationStatus }: { encounterId: string; integrationStatus: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const { open, setOpen } = useClose();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<null | { status: string; message?: string; matched?: boolean; health?: string; fullName?: string }>(null);
  const f = t.paramedic.identify;
  const usable = ["SIMULATED", "SANDBOX", "CONNECTED"].includes(integrationStatus);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setResult(null);
    const r = await api<{ status: string; message?: string; matched?: boolean; health?: string; fullName?: string }>(`/api/encounters/${encounterId}/identify`, { nationalId: String(fd.get("nationalId")), method: String(fd.get("method")) });
    setBusy(false);
    if (!r.ok) return toast.error(errorText(t, r));
    setResult(r.data);
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setResult(null);
      }}
    >
      <DialogTrigger asChild>
        <ActionTile icon={Fingerprint} label={t.paramedic.identifyPatient} data-testid="action-identify" />
      </DialogTrigger>
      <DialogContent title={f.title} description={usable ? f.simulatedNote : `Nafath: ${t.enums.integrationStatus[integrationStatus as keyof typeof t.enums.integrationStatus] ?? integrationStatus}`}>
        {!usable ? (
          <div className="rounded-lg border bg-muted p-4 text-sm">{t.common.notConnected}</div>
        ) : (
          <form onSubmit={submit} className="grid gap-4">
            <Field label={f.nationalId}>
              <Input name="nationalId" required inputMode="numeric" dir="ltr" placeholder="1XXXXXXXXX" data-testid="identify-nid" />
            </Field>
            <Field label={f.method}>
              <Select name="method" defaultValue="NATIONAL_ID">
                {(["NATIONAL_ID", "IQAMA", "BIOMETRIC_SIM"] as const).map((m) => (
                  <option key={m} value={m}>
                    {f.methods[m]}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" disabled={busy} data-testid="identify-submit">
              {busy ? <Loader2 className="animate-spin" /> : <Fingerprint />} {f.verify}
            </Button>
            {result ? (
              <div className={cn("rounded-lg border p-3 text-sm", result.status === "VERIFIED" ? "border-teal-200 bg-stable-soft" : "border-red-200 bg-critical-soft")} data-testid="identify-result">
                <div className="flex items-center gap-2 font-semibold">
                  {result.status === "VERIFIED" ? <CheckCircle2 className="size-4 text-stable" /> : <AlertTriangle className="size-4 text-critical" />}
                  {result.status === "VERIFIED" ? f.verified : f.failed}
                  {result.fullName ? <span className="ltr">· {result.fullName}</span> : null}
                </div>
                {result.status !== "VERIFIED" ? <div className="mt-1 text-xs">{f.reasons[result.message as keyof typeof f.reasons] ?? result.message}</div> : null}
                {result.matched ? <div className="mt-1 text-xs">{f.matched}</div> : null}
                {result.status === "VERIFIED" ? <div className="mt-1 text-xs">{result.health === "RETRIEVED" ? f.healthRetrieved : f.healthNotConnected}</div> : null}
              </div>
            ) : null}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ───────────── Vitals ─────────────

export function VitalsDialog({ encounterId }: { encounterId: string }) {
  const { t } = useI18n();
  const { enqueue } = useOutbox();
  const { open, setOpen } = useClose();
  const f = t.paramedic.vitalForm;
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const n = (k: string) => {
      const v = String(fd.get(k) ?? "").trim();
      return v === "" ? null : Number(v);
    };
    const now = new Date().toISOString();
    const vitals: Record<string, unknown>[] = [];
    const push = (type: string, value: number | null, value2?: number | null) => value != null && !Number.isNaN(value) && vitals.push({ type, value, value2: value2 ?? null, recordedAt: now });
    push("HEART_RATE", n("hr"));
    if (n("sys") != null) push("BLOOD_PRESSURE", n("sys"), n("dia"));
    push("SPO2", n("spo2"));
    push("RESPIRATORY_RATE", n("rr"));
    push("TEMPERATURE", n("temp"));
    push("GCS", n("gcs"));
    push("BLOOD_GLUCOSE", n("glu"));
    if (!vitals.length) return;
    enqueue(`${t.paramedic.addVital} (${vitals.length})`, `/api/encounters/${encounterId}/vitals`, { vitals: vitals.map((v) => ({ ...v, clientId: crypto.randomUUID() })) });
    setOpen(false);
  };
  const num = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <Field label={label}>
      <Input name={name} type="number" inputMode="decimal" className="h-12 text-lg tabular" dir="ltr" {...props} />
    </Field>
  );
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ActionTile icon={HeartPulse} label={t.paramedic.addVital} data-testid="action-vitals" />
      </DialogTrigger>
      <DialogContent title={f.title} description={f.hint} wide>
        <form onSubmit={submit} className="grid gap-4" data-testid="vitals-form">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {num("hr", `${t.enums.vital.HEART_RATE} (bpm)`, { min: 0, max: 300, "aria-label": "HR" } as never)}
            {num("sys", `${f.systolic} (mmHg)`, { min: 0, max: 300 })}
            {num("dia", `${f.diastolic} (mmHg)`, { min: 0, max: 200 })}
            {num("spo2", `${t.enums.vital.SPO2} (%)`, { min: 0, max: 100 })}
            {num("rr", `${t.enums.vital.RESPIRATORY_RATE} (/min)`, { min: 0, max: 80 })}
            {num("temp", `${t.enums.vital.TEMPERATURE} (°C)`, { min: 25, max: 45, step: 0.1 })}
            {num("gcs", `${t.enums.vital.GCS} (3–15)`, { min: 3, max: 15 })}
            {num("glu", `${t.enums.vital.BLOOD_GLUCOSE} (mg/dL)`, { min: 10, max: 900 })}
          </div>
          <Button type="submit" size="lg" data-testid="vitals-submit">
            <HeartPulse /> {f.add}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ───────────── Intervention ─────────────

const INTERVENTIONS = ["OXYGEN", "IV_ACCESS", "AIRWAY", "ECG", "CPR", "IMMOBILIZATION", "BLEEDING_CONTROL", "DEFIBRILLATION", "OTHER"] as const;

export function InterventionDialog({ encounterId }: { encounterId: string }) {
  const { t } = useI18n();
  const { enqueue } = useOutbox();
  const { open, setOpen } = useClose();
  const [type, setType] = useState<(typeof INTERVENTIONS)[number]>("OXYGEN");
  const f = t.paramedic.interventionForm;
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    enqueue(`${t.paramedic.addIntervention}: ${t.enums.intervention[type]}`, `/api/encounters/${encounterId}/interventions`, { type, notes: String(fd.get("notes") ?? "") || undefined, performedAt: new Date().toISOString() });
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ActionTile icon={Stethoscope} label={t.paramedic.addIntervention} data-testid="action-intervention" />
      </DialogTrigger>
      <DialogContent title={f.title}>
        <form onSubmit={submit} className="grid gap-4" data-testid="intervention-form">
          <div className="grid grid-cols-3 gap-2">
            {INTERVENTIONS.map((i) => (
              <button type="button" key={i} onClick={() => setType(i)} className={cn("rounded-lg border px-2 py-3 text-xs font-semibold", type === i ? "border-navy-900 bg-navy-900 text-white" : "bg-white hover:bg-muted")} data-testid={`intervention-${i}`}>
                {t.enums.intervention[i]}
              </button>
            ))}
          </div>
          <Field label={t.common.notes}>
            <Textarea name="notes" rows={2} />
          </Field>
          <Button type="submit" size="lg" data-testid="intervention-submit">
            <Stethoscope /> {f.add}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ───────────── Medication ─────────────

const COMMON_MEDS: [string, string, string][] = [
  ["Aspirin", "300 mg", "PO"],
  ["Nitroglycerin", "0.4 mg", "SL"],
  ["Salbutamol", "5 mg", "Nebulized"],
  ["Adrenaline", "1 mg", "IV"],
  ["Fentanyl", "50 mcg", "IV"],
  ["Morphine", "5 mg", "IV"],
  ["Tranexamic acid", "1 g", "IV"],
  ["Ondansetron", "4 mg", "IV"],
  ["Dextrose 10%", "250 ml", "IV"],
  ["Naloxone", "0.4 mg", "IV"],
  ["Midazolam", "5 mg", "IM"],
  ["Normal saline", "500 ml", "IV"],
];

export function MedicationDialog({ encounterId, allergies }: { encounterId: string; allergies: string[] }) {
  const { t } = useI18n();
  const { enqueue } = useOutbox();
  const { open, setOpen } = useClose();
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [route, setRoute] = useState("IV");
  const f = t.paramedic.medicationForm;
  const conflict = allergies.find((a) => name && name.toLowerCase().includes(a.toLowerCase().split(" ")[0]));
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    enqueue(`${t.paramedic.addMedication}: ${name} ${dose}`, `/api/encounters/${encounterId}/medications`, { name, dose, route, notes: String(fd.get("notes") ?? "") || undefined, administeredAt: new Date().toISOString() });
    setOpen(false);
    setName("");
    setDose("");
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ActionTile icon={Pill} label={t.paramedic.addMedication} data-testid="action-medication" />
      </DialogTrigger>
      <DialogContent title={f.title} wide>
        <form onSubmit={submit} className="grid gap-4" data-testid="medication-form">
          <div className="flex flex-wrap gap-1.5">
            {COMMON_MEDS.map(([n, d, r]) => (
              <button
                type="button"
                key={n}
                className="ltr rounded-full border bg-white px-3 py-1.5 text-xs font-medium hover:bg-muted"
                onClick={() => {
                  setName(n);
                  setDose(d);
                  setRoute(r);
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={f.name}>
              <Input value={name} onChange={(e) => setName(e.target.value)} required dir="ltr" data-testid="med-name" />
            </Field>
            <Field label={f.dose}>
              <Input value={dose} onChange={(e) => setDose(e.target.value)} required dir="ltr" data-testid="med-dose" />
            </Field>
            <Field label={f.route}>
              <Select value={route} onChange={(e) => setRoute(e.target.value)} dir="ltr">
                {["IV", "IM", "IO", "PO", "SL", "IN", "Nebulized", "SC", "PR"].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </Select>
            </Field>
          </div>
          {conflict ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-critical-soft p-3 text-sm font-semibold text-red-700">
              <AlertTriangle className="size-4" /> {f.allergyConflict}: {conflict}
            </div>
          ) : null}
          <Field label={t.common.notes}>
            <Input name="notes" />
          </Field>
          <Button type="submit" size="lg" data-testid="medication-submit">
            <Pill /> {f.add}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ───────────── Media ─────────────

export function MediaDialog({ encounterId }: { encounterId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const { open, setOpen } = useClose();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ url: string; video: boolean } | null>(null);
  const f = t.paramedic.mediaForm;
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    const r = await api(`/api/encounters/${encounterId}/media`, fd);
    setBusy(false);
    if (!r.ok) return toast.error(errorText(t, r));
    toast.success(t.common.saved);
    setPreview(null);
    setOpen(false);
    router.refresh();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ActionTile icon={Camera} label={t.paramedic.uploadImage} data-testid="action-media" />
      </DialogTrigger>
      <DialogContent title={f.title} description={f.limits}>
        <form onSubmit={submit} className="grid gap-4" data-testid="media-form">
          <Field label={f.file}>
            <Input
              type="file"
              name="file"
              required
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
              capture="environment"
              data-testid="media-file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setPreview(file ? { url: URL.createObjectURL(file), video: file.type.startsWith("video/") } : null);
              }}
            />
          </Field>
          {preview ? (
            preview.video ? (
              <video src={preview.url} controls className="max-h-56 w-full rounded-lg bg-black" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.url} alt="" className="max-h-56 w-full rounded-lg object-contain bg-muted" />
            )
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={f.category}>
              <Select name="category" defaultValue="SCENE">
                {(["INJURY", "WOUND", "BURN", "SCENE", "MEDICAL_DOCUMENT", "OTHER"] as const).map((c) => (
                  <option key={c} value={c}>
                    {t.enums.mediaCategory[c]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={f.caption}>
              <Input name="caption" />
            </Field>
          </div>
          <Button type="submit" disabled={busy} data-testid="media-submit">
            {busy ? <Loader2 className="animate-spin" /> : <Camera />} {f.upload}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ───────────── Note / Condition / Priority ─────────────

export function NoteDialog({ encounterId }: { encounterId: string }) {
  const { t } = useI18n();
  const { enqueue } = useOutbox();
  const { open, setOpen } = useClose();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ActionTile icon={NotebookPen} label={t.paramedic.recordNote} data-testid="action-note" />
      </DialogTrigger>
      <DialogContent title={t.paramedic.noteForm.title}>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const text = String(new FormData(e.currentTarget).get("text") ?? "").trim();
            if (!text) return;
            enqueue(t.paramedic.recordNote, `/api/encounters/${encounterId}/notes`, { text });
            setOpen(false);
          }}
        >
          <Field label={t.paramedic.noteForm.text}>
            <Textarea name="text" rows={5} required data-testid="note-text" />
          </Field>
          <Button type="submit" size="lg" data-testid="note-submit">
            <NotebookPen /> {t.paramedic.noteForm.add}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ConditionDialog({ encounterId, current }: { encounterId: string; current: string }) {
  const { t } = useI18n();
  const { enqueue } = useOutbox();
  const { open, setOpen } = useClose();
  const [trend, setTrend] = useState(current);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ActionTile icon={TrendingDown} label={t.paramedic.updateCondition} data-testid="action-condition" />
      </DialogTrigger>
      <DialogContent title={t.paramedic.conditionForm.title}>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const note = String(new FormData(e.currentTarget).get("note") ?? "").trim() || undefined;
            enqueue(`${t.paramedic.updateCondition}: ${t.enums.condition[trend as keyof typeof t.enums.condition]}`, `/api/encounters/${encounterId}/condition`, { trend, note });
            setOpen(false);
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            {(["STABLE", "IMPROVING", "DETERIORATING", "CRITICAL"] as const).map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setTrend(c)}
                className={cn(
                  "rounded-lg border px-3 py-4 text-sm font-semibold",
                  trend === c ? (c === "CRITICAL" || c === "DETERIORATING" ? "border-red-700 bg-critical text-white" : "border-navy-900 bg-navy-900 text-white") : "bg-white hover:bg-muted",
                )}
                data-testid={`condition-${c}`}
              >
                {t.enums.condition[c]}
              </button>
            ))}
          </div>
          <Field label={t.common.notes}>
            <Input name="note" />
          </Field>
          <Button type="submit" size="lg" data-testid="condition-submit">
            {t.paramedic.conditionForm.add}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PriorityDialog({ encounterId, current }: { encounterId: string; current: string }) {
  const { t } = useI18n();
  const { enqueue } = useOutbox();
  const { open, setOpen } = useClose();
  const [p, setP] = useState(current);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ActionTile icon={Flag} label={t.paramedic.changePriority} data-testid="action-priority" />
      </DialogTrigger>
      <DialogContent title={t.paramedic.priorityForm.title}>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const reason = String(new FormData(e.currentTarget).get("reason") ?? "").trim() || undefined;
            enqueue(`${t.paramedic.changePriority}: ${p}`, `/api/encounters/${encounterId}/priority`, { priority: p, reason });
            setOpen(false);
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            {(["P1", "P2", "P3", "P4"] as const).map((x) => (
              <button
                type="button"
                key={x}
                onClick={() => setP(x)}
                className={cn("rounded-lg border px-3 py-4 text-sm font-semibold", p === x ? (x === "P1" ? "bg-critical text-white" : x === "P2" ? "bg-warning text-white" : "bg-navy-900 text-white") : "bg-white hover:bg-muted")}
              >
                {t.enums.priority[x]}
              </button>
            ))}
          </div>
          <Field label={t.common.reason}>
            <Input name="reason" />
          </Field>
          <Button type="submit" size="lg">
            {t.paramedic.priorityForm.add}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ───────────── Pre-arrival alert ─────────────

export function PreAlertTile({ encounterId, hasDestination, sent, delivery }: { encounterId: string; hasDestination: boolean; sent: boolean; delivery: string | null }) {
  const { t } = useI18n();
  const { enqueue, items } = useOutbox();
  const pending = items.find((i) => i.url.endsWith(`/${encounterId}/prealert`) && i.status !== "DELIVERED");
  return (
    <ActionTile
      icon={BellRing}
      tone="critical"
      label={pending ? `${t.paramedic.sendPreAlert} · ${t.enums.delivery[pending.status]}` : sent ? `${t.paramedic.resendPreAlert}${delivery ? ` · ${t.enums.delivery[delivery as keyof typeof t.enums.delivery]}` : ""}` : t.paramedic.sendPreAlert}
      disabled={!hasDestination || !!pending}
      title={!hasDestination ? t.paramedic.selectDestinationFirst : undefined}
      onClick={() => enqueue(t.paramedic.sendPreAlert, `/api/encounters/${encounterId}/prealert`, {})}
      data-testid="action-prealert"
    />
  );
}

export function MonitorTile({ encounterId, running, integrationStatus }: { encounterId: string; running: boolean; integrationStatus: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [scenario, setScenario] = useState("STABLE");
  const [busy, setBusy] = useState(false);
  const usable = integrationStatus === "SIMULATED";
  const toggle = async () => {
    setBusy(true);
    const r = await api(`/api/encounters/${encounterId}/monitor`, { action: running ? "stop" : "start", scenario });
    setBusy(false);
    if (!r.ok) toast.error(errorText(t, r));
    router.refresh();
  };
  return (
    <div className={cn("flex min-h-[84px] flex-col justify-between gap-2 rounded-xl border p-3", running ? "border-violet-300 bg-ai-soft" : "bg-white")}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Activity className={cn("size-5", running ? "animate-pulse text-ai" : "text-navy-800")} /> {t.caseView.monitor}
        </span>
        {!usable ? <span className="text-[11px] text-muted-foreground">{t.common.notConnected}</span> : null}
      </div>
      <div className="grid gap-1.5">
        <Select value={scenario} onChange={(e) => setScenario(e.target.value)} className="h-8 text-xs" disabled={running || !usable} aria-label={t.paramedic.monitorScenario}>
          {(["STABLE", "DETERIORATING", "IMPROVING"] as const).map((s) => (
            <option key={s} value={s}>
              {t.paramedic.scenario[s]}
            </option>
          ))}
        </Select>
        <Button size="sm" variant={running ? "outline" : "ai"} onClick={toggle} disabled={busy || !usable} data-testid="monitor-toggle">
          {running ? t.paramedic.stopMonitor : t.paramedic.simulateMonitor}
        </Button>
      </div>
    </div>
  );
}
