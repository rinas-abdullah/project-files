"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Camera, CameraOff, CheckCircle2, Loader2, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { api, errorText } from "@/lib/client-api";
import { extractCardId } from "@/lib/engines/nusuk";
import { cn } from "@/lib/utils";
import { ActionTile } from "./actions";

type Detector = { detect(src: HTMLVideoElement): Promise<{ rawValue: string }[]> };
type DetectorCtor = new (o: { formats: string[] }) => Detector;
type Result = { status: string; message?: string; matched?: boolean; health?: string; fullName?: string };

/** Nusuk card scan → ID number → identity verification (simulated adapter). */
export function NusukScanDialog({ encounterId, integrationStatus }: { encounterId: string; integrationStatus: string }) {
  const { t } = useI18n();
  const n = t.paramedic.nusuk;
  const f = t.paramedic.identify;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [id, setId] = useState("");
  const [fromCard, setFromCard] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const usable = ["SIMULATED", "SANDBOX", "CONNECTED"].includes(integrationStatus);
  const cameraOk = typeof window !== "undefined" && "BarcodeDetector" in window && !!navigator.mediaDevices?.getUserMedia;

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((tr) => tr.stop());
    stream.current = null;
    setScanning(false);
  };
  useEffect(() => stop, []);

  const start = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      stream.current = s;
      if (video.current) {
        video.current.srcObject = s;
        await video.current.play();
      }
      setScanning(true);
      const Ctor = (window as unknown as { BarcodeDetector: DetectorCtor }).BarcodeDetector;
      const det = new Ctor({ formats: ["qr_code"] });
      timer.current = setInterval(async () => {
        if (!video.current) return;
        const codes = await det.detect(video.current).catch(() => []);
        const found = codes.map((c) => extractCardId(c.rawValue)).find(Boolean);
        if (found) {
          setId(found);
          setFromCard(true);
          stop();
        }
      }, 350);
    } catch {
      toast.error(n.noCamera);
      stop();
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    const nid = extractCardId(id) ?? id.replace(/\D/g, "");
    setBusy(true);
    setResult(null);
    const r = await api<Result>(`/api/encounters/${encounterId}/identify`, { nationalId: nid, method: "NUSUK_CARD" });
    setBusy(false);
    if (!r.ok) return toast.error(errorText(t, r));
    setResult(r.data);
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          stop();
          setResult(null);
          setId("");
          setFromCard(false);
        }
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        <ActionTile icon={ScanLine} label={n.action} data-testid="action-nusuk" />
      </DialogTrigger>
      <DialogContent title={n.title} description={n.hint}>
        {!usable ? (
          <div className="rounded-lg border bg-muted p-4 text-sm">{t.common.notConnected}</div>
        ) : (
          <form onSubmit={verify} className="grid gap-4" data-testid="nusuk-form">
            <div className="relative overflow-hidden rounded-2xl bg-navy-950">
              <video ref={video} muted playsInline className={cn("aspect-[4/3] w-full object-cover", !scanning && "hidden")} />
              {!scanning ? (
                <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 text-white/80">
                  <ScanLine className="size-14" strokeWidth={1.4} />
                  <span className="max-w-64 text-center text-xs">{cameraOk ? n.hint : n.noCamera}</span>
                </div>
              ) : (
                <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-dashed border-white/80">
                  <span className="absolute inset-x-0 bottom-2 text-center text-xs font-semibold text-white">{n.scanning}</span>
                </div>
              )}
            </div>
            {cameraOk ? (
              <Button type="button" variant={scanning ? "outline" : "default"} onClick={scanning ? stop : start} data-testid="nusuk-camera">
                {scanning ? <CameraOff /> : <Camera />} {scanning ? n.stopCamera : n.camera}
              </Button>
            ) : null}
            <Field label={fromCard ? `${n.manual} · ${n.detected}` : n.manual}>
              <Input
                value={id}
                onChange={(e) => {
                  setId(e.target.value);
                  setFromCard(false);
                }}
                inputMode="numeric"
                dir="ltr"
                placeholder="1XXXXXXXXX"
                required
                className={cn(fromCard && "border-info ring-1 ring-info")}
                data-testid="nusuk-id"
              />
            </Field>
            <Button type="submit" size="lg" disabled={busy} data-testid="nusuk-verify">
              {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} {n.verify}
            </Button>
            {result ? (
              <div className={cn("rounded-lg border p-3 text-sm", result.status === "VERIFIED" ? "border-teal-200 bg-stable-soft" : "border-red-200 bg-critical-soft")} data-testid="nusuk-result">
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
            <p className="text-[11px] text-muted-foreground">{n.simulated}</p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
