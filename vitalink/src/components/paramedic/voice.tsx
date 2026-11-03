"use client";
import { useRef, useState } from "react";
import { Mic, MicOff, Send } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { parseVoice, type VoiceVitals } from "@/lib/engines/voice";
import { cn } from "@/lib/utils";
import { ActionTile } from "./actions";
import { useOutbox } from "./outbox";

// Minimal typing for the Web Speech API (not in TypeScript's DOM lib).
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<RecognitionResult> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Key = keyof VoiceVitals;
const FIELDS: { key: Key; vital: string; unit: string; step?: string }[] = [
  { key: "temp", vital: "TEMPERATURE", unit: "°C", step: "0.1" },
  { key: "hr", vital: "HEART_RATE", unit: "bpm" },
  { key: "spo2", vital: "SPO2", unit: "%" },
  { key: "sys", vital: "SYSTOLIC", unit: "mmHg" },
  { key: "dia", vital: "DIASTOLIC", unit: "mmHg" },
  { key: "rr", vital: "RESPIRATORY_RATE", unit: "/min" },
  { key: "gcs", vital: "GCS", unit: "3–15" },
  { key: "glu", vital: "BLOOD_GLUCOSE", unit: "mg/dL" },
];

/**
 * Voice documentation: dictation → parsed vitals → paramedic review → confirm.
 * The paramedic stays the decision maker: parsed values only pre-fill the form.
 */
export function VoiceDialog({ encounterId }: { encounterId: string }) {
  const { t, locale } = useI18n();
  const v = t.paramedic.voice;
  const { enqueue } = useOutbox();
  const [open, setOpen] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [fields, setFields] = useState<Partial<Record<Key, string>>>({});
  const [fromVoice, setFromVoice] = useState<Set<Key>>(new Set());
  const [saveNote, setSaveNote] = useState(true);
  const rec = useRef<Recognition | null>(null);
  const supported = typeof window !== "undefined" && recognitionCtor() !== null;

  const applyTranscript = (text: string) => {
    setTranscript(text);
    const parsed = parseVoice(text);
    const keys = Object.keys(parsed) as Key[];
    if (!keys.length) return;
    setFields((f) => ({ ...f, ...Object.fromEntries(keys.map((k) => [k, String(parsed[k])])) }));
    setFromVoice((s) => new Set([...s, ...keys]));
  };

  const stop = () => {
    rec.current?.stop();
    setListening(false);
  };

  const start = () => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = locale === "ar" ? "ar-SA" : "en-US";
    r.continuous = true;
    r.interimResults = true;
    let base = transcript ? `${transcript} ` : "";
    r.onresult = (e) => {
      let finalText = "";
      let pending = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else pending += res[0].transcript;
      }
      if (finalText) {
        base = `${base}${finalText.trim()} `;
        applyTranscript(base.trim());
      }
      setInterim(pending);
    };
    r.onerror = (e) => {
      if (e.error !== "no-speech" && e.error !== "aborted") toast.error(`${v.error}: ${e.error}`);
      setListening(false);
    };
    r.onend = () => {
      setListening(false);
      setInterim("");
    };
    rec.current = r;
    r.start();
    setListening(true);
  };

  const reset = () => {
    stop();
    setTranscript("");
    setInterim("");
    setFields({});
    setFromVoice(new Set());
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    stop();
    const n = (k: Key) => {
      const s = (fields[k] ?? "").trim();
      return s === "" || Number.isNaN(Number(s)) ? null : Number(s);
    };
    const now = new Date().toISOString();
    const vitals: Record<string, unknown>[] = [];
    const push = (type: string, value: number | null, value2?: number | null) => value != null && vitals.push({ type, value, value2: value2 ?? null, recordedAt: now, clientId: crypto.randomUUID() });
    push("TEMPERATURE", n("temp"));
    push("HEART_RATE", n("hr"));
    push("SPO2", n("spo2"));
    if (n("sys") != null) push("BLOOD_PRESSURE", n("sys"), n("dia"));
    push("RESPIRATORY_RATE", n("rr"));
    push("GCS", n("gcs"));
    push("BLOOD_GLUCOSE", n("glu"));
    const text = transcript.trim();
    if (!vitals.length && !(saveNote && text)) {
      toast.message(v.nothing);
      return;
    }
    if (vitals.length) enqueue(`${v.action}: ${t.paramedic.addVital} (${vitals.length})`, `/api/encounters/${encounterId}/vitals`, { vitals });
    if (saveNote && text) enqueue(`${v.action}: ${t.paramedic.recordNote}`, `/api/encounters/${encounterId}/notes`, { text: `[${v.notePrefix}] ${text}` });
    reset();
    setOpen(false);
  };

  const label = (f: (typeof FIELDS)[number]) =>
    f.vital === "SYSTOLIC" ? t.paramedic.vitalForm.systolic : f.vital === "DIASTOLIC" ? t.paramedic.vitalForm.diastolic : t.enums.vital[f.vital as keyof typeof t.enums.vital];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) stop();
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        <ActionTile icon={Mic} label={v.action} data-testid="action-voice" />
      </DialogTrigger>
      <DialogContent title={v.title} description={v.hint} wide>
        <form onSubmit={submit} className="grid gap-4" data-testid="voice-form">
          <div className="flex flex-col items-center gap-2 py-1">
            {supported ? (
              <button
                type="button"
                onClick={listening ? stop : start}
                className={cn("flex size-20 items-center justify-center rounded-full text-white shadow-lg transition active:scale-95", listening ? "bg-critical shadow-red-900/20" : "bg-navy-900 shadow-navy-900/25 hover:bg-navy-800")}
                aria-label={listening ? v.stop : v.start}
                data-testid="voice-mic"
              >
                {listening ? <MicOff className="size-8" /> : <Mic className="size-8" />}
              </button>
            ) : (
              <p className="text-center text-sm text-warning" data-testid="voice-unsupported">
                {v.unsupported}
              </p>
            )}
            <div className="flex h-6 items-center gap-[3px]" aria-hidden>
              {Array.from({ length: 28 }, (_, i) => (
                <span
                  key={i}
                  className={cn("w-[3px] rounded-full", listening ? "animate-pulse bg-navy-800" : "bg-border")}
                  style={{ height: `${[30, 55, 80, 45, 100, 60, 35, 70][i % 8]}%`, animationDelay: `${(i % 7) * 90}ms` }}
                />
              ))}
            </div>
            <span className={cn("text-sm font-semibold", listening ? "text-critical" : "text-muted-foreground")}>{listening ? v.listening : supported ? v.start : ""}</span>
          </div>
          <Field label={v.transcript} hint={v.privacy}>
            <Textarea rows={3} value={interim ? `${transcript} ${interim}`.trim() : transcript} onChange={(e) => applyTranscript(e.target.value)} readOnly={listening} data-testid="voice-transcript" />
          </Field>
          <div>
            <div className="mb-2 text-sm font-semibold">{v.extracted}</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {FIELDS.map((f) => (
                <Field key={f.key} label={`${label(f)} (${f.unit})`}>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step={f.step ?? "1"}
                    dir="ltr"
                    value={fields[f.key] ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFields((s) => ({ ...s, [f.key]: val }));
                      setFromVoice((s) => {
                        const next = new Set(s);
                        next.delete(f.key);
                        return next;
                      });
                    }}
                    className={cn("h-12 text-lg tabular", fromVoice.has(f.key) && "border-info bg-info/5 ring-1 ring-info")}
                    title={fromVoice.has(f.key) ? v.fromVoice : undefined}
                    data-testid={`voice-field-${f.key}`}
                  />
                </Field>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4" checked={saveNote} onChange={(e) => setSaveNote(e.target.checked)} /> {v.saveNote}
          </label>
          <Button type="submit" size="lg" data-testid="voice-submit">
            <Send /> {v.confirm}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
