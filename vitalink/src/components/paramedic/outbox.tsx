"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { CloudOff, RefreshCw, Wifi, WifiLow, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/components/i18n-provider";
import { useLive } from "@/components/live-provider";
import { Badge } from "@/components/ui/badge";
import { cn, uid } from "@/lib/utils";
import { formatTime } from "@/lib/i18n/format";
import { forgetOutboxKey, getOutboxKey, seal, unseal } from "@/lib/outbox-crypto";

/**
 * Offline-first outbox for the ambulance app.
 * Clinical events are stored locally (localStorage, AES-GCM encrypted with a
 * per-user key that lives only in tab memory) and delivered in order
 * with exponential backoff. Every item carries a clientId so the server
 * de-duplicates retries. Status is never shown as delivered until the server confirms.
 */
export type OutboxStatus = "PENDING" | "RETRYING" | "FAILED" | "DELIVERED";
export type OutboxItem = { id: string; label: string; url: string; body: Record<string, unknown>; status: OutboxStatus; attempts: number; createdAt: number; nextAt: number; error?: string; deliveredAt?: number };
export type Connection = "ONLINE" | "DEGRADED" | "OFFLINE";

type Ctx = {
  items: OutboxItem[];
  connection: Connection;
  simulateOffline: boolean;
  setSimulateOffline: (v: boolean) => void;
  enqueue: (label: string, url: string, body: Record<string, unknown>) => OutboxItem;
  retry: (id: string) => void;
  clearDelivered: () => void;
  sealed: boolean;
};

const OutboxCtx = createContext<Ctx | null>(null);
export const useOutbox = () => {
  const c = useContext(OutboxCtx);
  if (!c) throw new Error("OutboxProvider missing");
  return c;
};

/** Reads and decrypts the stored outbox. `sealed` means data exists but no key is available yet (offline, new tab). */
async function load(storageKey: string): Promise<{ items: OutboxItem[]; sealed: boolean }> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(storageKey);
  } catch {}
  if (!raw) return { items: [], sealed: false };
  const key = await getOutboxKey();
  if (!key) return { items: [], sealed: true };
  try {
    return { items: JSON.parse(await unseal(key, raw)), sealed: false };
  } catch {
    return { items: [], sealed: true };
  }
}

/** Delivered items keep only their label and timestamps: no clinical payload stays on the device. */
const strip = (i: OutboxItem): OutboxItem => (i.status === "DELIVERED" ? { ...i, body: {} } : i);

/** A tablet left unattended signs itself out; queued data stays encrypted and resumes after sign-in. */
export const IDLE_LOCK_MS = 20 * 60 * 1000;

function useIdleLock() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const lock = () => {
      forgetOutboxKey();
      void signOut({ callbackUrl: "/login?reason=idle" });
    };
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(lock, IDLE_LOCK_MS);
    };
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, []);
}

export function OutboxProvider({ storageKey, children }: { storageKey: string; children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useI18n();
  useIdleLock();
  const { connected } = useLive();
  const [items, setItems] = useState<OutboxItem[]>([]);
  const [simulateOffline, setSim] = useState(false);
  const [online, setOnline] = useState(true);
  const [lastFailAt, setLastFailAt] = useState(0);
  const busy = useRef(false);
  const itemsRef = useRef<OutboxItem[]>([]);

  const sealedRef = useRef(false);
  const [sealed, setSealed] = useState(false);
  const writeChain = useRef<Promise<void>>(Promise.resolve());

  const hydrate = useCallback(async () => {
    const res = await load(storageKey);
    sealedRef.current = res.sealed;
    setSealed(res.sealed);
    if (res.sealed) return;
    const loaded = res.items.map((i) => (i.status === "PENDING" || i.status === "RETRYING" ? { ...i, nextAt: 0 } : i));
    // Merge anything queued while the store was sealed.
    const ids = new Set(loaded.map((i) => i.id));
    const merged = [...loaded, ...itemsRef.current.filter((i) => !ids.has(i.id))];
    itemsRef.current = merged;
    setItems(merged);
    const key = await getOutboxKey();
    if (key) {
      try {
        localStorage.setItem(storageKey, await seal(key, JSON.stringify(merged.map(strip))));
      } catch {}
    }
  }, [storageKey]);

  useEffect(() => {
    // Hydration-safe: localStorage only exists in the browser, so the persisted outbox is restored after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void hydrate();
    try {
      setSim(localStorage.getItem(`${storageKey}:offline`) === "1");
    } catch {}
    setOnline(navigator.onLine);
    const on = () => {
      setOnline(true);
      if (sealedRef.current) void hydrate();
    };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [storageKey, hydrate]);

  const persist = useCallback(
    (next: OutboxItem[]) => {
      const trimmed = [...next.filter((i) => i.status !== "DELIVERED"), ...next.filter((i) => i.status === "DELIVERED").slice(-15)].map(strip);
      itemsRef.current = trimmed;
      setItems(trimmed);
      // Never overwrite a sealed store we could not read; the items stay in memory until the key is back.
      if (sealedRef.current) return;
      writeChain.current = writeChain.current.then(async () => {
        const key = await getOutboxKey();
        if (!key) return;
        try {
          localStorage.setItem(storageKey, await seal(key, JSON.stringify(itemsRef.current)));
        } catch {}
      });
    },
    [storageKey],
  );

  const offline = !online || simulateOffline;

  const processOne = useCallback(async () => {
    if (busy.current || offline) return;
    const now = Date.now();
    const item = itemsRef.current.find((i) => (i.status === "PENDING" || i.status === "RETRYING") && i.nextAt <= now);
    if (!item) return;
    busy.current = true;
    const started = performance.now();
    let outcome: Partial<OutboxItem>;
    try {
      const res = await fetch(item.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item.body) });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        outcome = { status: "DELIVERED", deliveredAt: Date.now(), error: undefined };
        if (performance.now() - started > 2500) setLastFailAt(Date.now());
      } else if (res.status >= 500 || res.status === 429 || res.status === 401) {
        const attempts = item.attempts + 1;
        outcome = { status: attempts >= 8 ? "FAILED" : "RETRYING", attempts, nextAt: Date.now() + Math.min(30000, 1000 * 2 ** attempts), error: json.error ?? `HTTP_${res.status}` };
        setLastFailAt(Date.now());
      } else {
        outcome = { status: "FAILED", attempts: item.attempts + 1, error: json.error ?? `HTTP_${res.status}` };
      }
    } catch {
      const attempts = item.attempts + 1;
      outcome = { status: "RETRYING", attempts, nextAt: Date.now() + Math.min(30000, 1000 * 2 ** attempts), error: "NETWORK" };
      setLastFailAt(Date.now());
    }
    persist(itemsRef.current.map((i) => (i.id === item.id ? { ...i, ...outcome } : i)));
    busy.current = false;
    if (outcome.status === "DELIVERED") router.refresh();
    if (outcome.status === "FAILED") toast.error(`${item.label}: ${(t.errors as Record<string, string>)[outcome.error ?? ""] ?? outcome.error}`);
  }, [offline, persist, router, t]);

  useEffect(() => {
    const id = setInterval(() => void processOne(), 700);
    return () => clearInterval(id);
  }, [processOne]);

  const enqueue = useCallback(
    (label: string, url: string, body: Record<string, unknown>) => {
      const item: OutboxItem = { id: uid(), label, url, body: { ...body, clientId: (body.clientId as string) ?? uid() }, status: "PENDING", attempts: 0, createdAt: Date.now(), nextAt: 0 };
      persist([...itemsRef.current, item]);
      if (offline) toast.message(t.paramedic.queuedOffline);
      setTimeout(() => void processOne(), 10);
      return item;
    },
    [persist, offline, t, processOne],
  );

  const retry = useCallback((id: string) => persist(itemsRef.current.map((i) => (i.id === id ? { ...i, status: "PENDING", nextAt: 0 } : i))), [persist]);
  const clearDelivered = useCallback(() => persist(itemsRef.current.filter((i) => i.status !== "DELIVERED")), [persist]);
  const setSimulateOffline = useCallback(
    (v: boolean) => {
      setSim(v);
      try {
        localStorage.setItem(`${storageKey}:offline`, v ? "1" : "0");
      } catch {}
    },
    [storageKey],
  );

  const [now, setNow] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);
  const connection: Connection = useMemo(() => {
    if (offline) return "OFFLINE";
    if (!connected || Math.max(now, lastFailAt) - lastFailAt < 30000 && lastFailAt > 0 || items.some((i) => i.status === "RETRYING")) return "DEGRADED";
    return "ONLINE";
  }, [offline, connected, lastFailAt, items, now]);

  return <OutboxCtx.Provider value={{ items, connection, simulateOffline, setSimulateOffline, enqueue, retry, clearDelivered, sealed }}>{children}</OutboxCtx.Provider>;
}

export function ConnectionBadge() {
  const { connection } = useOutbox();
  const { t } = useI18n();
  const Icon = connection === "ONLINE" ? Wifi : connection === "DEGRADED" ? WifiLow : CloudOff;
  return (
    <Badge variant={connection === "ONLINE" ? "stable" : connection === "DEGRADED" ? "warning" : "criticalSolid"} className="gap-1.5 px-2.5 py-1 text-xs" data-testid="connection-status">
      <Icon className="size-3.5" /> {t.enums.connection[connection]}
    </Badge>
  );
}

export function OutboxPanel() {
  const { items, simulateOffline, setSimulateOffline, retry, sealed } = useOutbox();
  const { t, locale } = useI18n();
  const pending = items.filter((i) => i.status !== "DELIVERED");
  const shown = [...items].reverse().slice(0, 8);
  return (
    <div className="rounded-xl border bg-card p-4" data-testid="outbox">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">
          {t.paramedic.outbox}
          {pending.length ? <span className="ms-2 rounded-full bg-warning px-1.5 text-[11px] text-white">{pending.length}</span> : null}
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" className="size-4 accent-red-600" checked={simulateOffline} onChange={(e) => setSimulateOffline(e.target.checked)} data-testid="simulate-offline" />
          {t.paramedic.simulateOffline}
        </label>
      </div>
      {sealed ? (
        <p className="mt-2 rounded-md bg-warning/10 px-2 py-1 text-xs text-warning" data-testid="outbox-sealed">
          {t.paramedic.outboxSealed}
        </p>
      ) : null}
      <ul className="mt-3 space-y-1.5">
        {shown.length === 0 ? <li className="text-xs text-muted-foreground">{t.paramedic.outboxEmpty}</li> : null}
        {shown.map((i) => (
          <li key={i.id} className="flex items-center justify-between gap-2 text-xs" data-testid="outbox-item" data-status={i.status}>
            <span className="flex min-w-0 items-center gap-1.5">
              {i.status === "DELIVERED" ? <CheckCircle2 className="size-3.5 shrink-0 text-stable" /> : i.status === "FAILED" ? <XCircle className="size-3.5 shrink-0 text-critical" /> : i.status === "RETRYING" ? <RefreshCw className="size-3.5 shrink-0 animate-spin text-warning" /> : <Clock className="size-3.5 shrink-0 text-muted-foreground" />}
              <span className="truncate">{i.label}</span>
              <span className="text-muted-foreground tabular">{formatTime(i.createdAt ? new Date(i.createdAt) : null, locale)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className={cn("font-semibold", i.status === "DELIVERED" ? "text-stable" : i.status === "FAILED" ? "text-critical" : i.status === "RETRYING" ? "text-warning" : "text-muted-foreground")}>{t.enums.delivery[i.status]}</span>
              {i.status === "FAILED" ? (
                <button className="text-info underline" onClick={() => retry(i.id)}>
                  {t.common.retry}
                </button>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
