"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudOff, RefreshCw, Wifi, WifiLow, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/components/i18n-provider";
import { useLive } from "@/components/live-provider";
import { Badge } from "@/components/ui/badge";
import { cn, uid } from "@/lib/utils";
import { formatTime } from "@/lib/i18n/format";

/**
 * Offline-first outbox for the ambulance app.
 * Clinical events are stored locally (localStorage) and delivered in order
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
};

const OutboxCtx = createContext<Ctx | null>(null);
export const useOutbox = () => {
  const c = useContext(OutboxCtx);
  if (!c) throw new Error("OutboxProvider missing");
  return c;
};

function load(key: string): OutboxItem[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]");
  } catch {
    return [];
  }
}

export function OutboxProvider({ storageKey, children }: { storageKey: string; children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useI18n();
  const { connected } = useLive();
  const [items, setItems] = useState<OutboxItem[]>([]);
  const [simulateOffline, setSim] = useState(false);
  const [online, setOnline] = useState(true);
  const [lastFailAt, setLastFailAt] = useState(0);
  const busy = useRef(false);
  const itemsRef = useRef<OutboxItem[]>([]);

  useEffect(() => {
    const loaded = load(storageKey).map((i) => (i.status === "PENDING" || i.status === "RETRYING" ? { ...i, nextAt: 0 } : i));
    itemsRef.current = loaded;
    setItems(loaded);
    try {
      setSim(localStorage.getItem(`${storageKey}:offline`) === "1");
    } catch {}
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [storageKey]);

  const persist = useCallback(
    (next: OutboxItem[]) => {
      const trimmed = [...next.filter((i) => i.status !== "DELIVERED"), ...next.filter((i) => i.status === "DELIVERED").slice(-15)];
      itemsRef.current = trimmed;
      setItems(trimmed);
      try {
        localStorage.setItem(storageKey, JSON.stringify(trimmed));
      } catch {}
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

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 5000);
    return () => clearInterval(id);
  }, []);
  const connection: Connection = useMemo(() => {
    void tick;
    if (offline) return "OFFLINE";
    if (!connected || Date.now() - lastFailAt < 30000 || items.some((i) => i.status === "RETRYING")) return "DEGRADED";
    return "ONLINE";
  }, [offline, connected, lastFailAt, items, tick]);

  return <OutboxCtx.Provider value={{ items, connection, simulateOffline, setSimulateOffline, enqueue, retry, clearDelivered }}>{children}</OutboxCtx.Provider>;
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
  const { items, simulateOffline, setSimulateOffline, retry } = useOutbox();
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
