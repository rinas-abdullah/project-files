"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type LiveEvent = { t: string; e?: string; h?: string[]; o?: string[]; a?: string; d?: Record<string, unknown>; ts?: number };
type Listener = (e: LiveEvent) => void;
type Ctx = { connected: boolean; lastEventAt: number | null; subscribe: (l: Listener) => () => void };

const LiveContext = createContext<Ctx>({ connected: false, lastEventAt: null, subscribe: () => () => {} });

/** Single SSE connection per tab; components subscribe to scoped live events. */
export function LiveProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [lastEventAt, setLast] = useState<number | null>(null);
  const listeners = useRef(new Set<Listener>());

  useEffect(() => {
    let es: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let closed = false;
    const connect = () => {
      es = new EventSource("/api/stream");
      es.onopen = () => setConnected(true);
      es.onmessage = (msg) => {
        try {
          const ev = JSON.parse(msg.data) as LiveEvent;
          if (ev.t === "ping") return;
          setLast(Date.now());
          listeners.current.forEach((l) => l(ev));
        } catch {
          /* ignore */
        }
      };
      es.onerror = () => {
        setConnected(false);
        es?.close();
        if (!closed) retry = setTimeout(connect, 3000);
      };
    };
    connect();
    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      es?.close();
    };
  }, []);

  const subscribe = useCallback((l: Listener) => {
    listeners.current.add(l);
    return () => {
      listeners.current.delete(l);
    };
  }, []);

  return <LiveContext.Provider value={{ connected, lastEventAt, subscribe }}>{children}</LiveContext.Provider>;
}

export function useLive() {
  return useContext(LiveContext);
}

/** Re-render server data (router.refresh) when relevant live events arrive — no full page reload. */
export function LiveRefresh({ encounterId, types, minIntervalMs = 1200 }: { encounterId?: string; types?: string[]; minIntervalMs?: number }) {
  const router = useRouter();
  const { subscribe } = useLive();
  const last = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return subscribe((ev) => {
      if (ev.t === "notify") return;
      if (types && !types.includes(ev.t)) return;
      if (encounterId && ev.e && ev.e !== encounterId && ev.t !== "position") return;
      const now = Date.now();
      const wait = Math.max(0, last.current + minIntervalMs - now);
      if (timer.current) return;
      timer.current = setTimeout(() => {
        timer.current = null;
        last.current = Date.now();
        router.refresh();
      }, wait + 150);
    });
  }, [subscribe, router, encounterId, types, minIntervalMs]);
  return null;
}
