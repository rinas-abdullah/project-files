import "server-only";
import { Client } from "pg";
import { prisma } from "@/lib/db";

/**
 * Realtime event bus backed by PostgreSQL LISTEN/NOTIFY.
 * Every mutation publishes a small event; the SSE endpoint (/api/stream)
 * fans events out to connected browsers, filtered by tenant scope.
 * Using Postgres means events also cross process boundaries
 * (multiple Next.js workers, background jobs, the seed/simulator scripts).
 */
export type LiveEvent = {
  t: string; // event type, e.g. "vital", "encounter", "position"
  e?: string; // encounter id
  h?: string[]; // hospital ids concerned
  o?: string[]; // EMS organization ids concerned
  a?: string; // ambulance id
  d?: Record<string, unknown>; // small payload
  ts?: number;
};

const CHANNEL = "vitalink_events";
type Listener = (ev: LiveEvent) => void;

const g = globalThis as unknown as {
  __vlBus?: { client: Client | null; connecting: Promise<void> | null; listeners: Set<Listener> };
};
const state = (g.__vlBus ??= { client: null, connecting: null, listeners: new Set() });

async function ensureListening() {
  if (state.client) return;
  if (state.connecting) return state.connecting;
  state.connecting = (async () => {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    client.on("notification", (msg) => {
      if (!msg.payload) return;
      try {
        const ev = JSON.parse(msg.payload) as LiveEvent;
        for (const l of state.listeners) l(ev);
      } catch {
        /* ignore malformed */
      }
    });
    client.on("error", () => {
      state.client = null;
      state.connecting = null;
    });
    await client.connect();
    await client.query(`LISTEN ${CHANNEL}`);
    state.client = client;
  })();
  try {
    await state.connecting;
  } finally {
    state.connecting = null;
  }
}

export async function subscribe(listener: Listener): Promise<() => void> {
  await ensureListening();
  state.listeners.add(listener);
  return () => state.listeners.delete(listener);
}

export async function publish(ev: LiveEvent) {
  const payload = JSON.stringify({ ...ev, ts: Date.now() });
  try {
    await prisma.$executeRaw`SELECT pg_notify(${CHANNEL}, ${payload})`;
  } catch (err) {
    console.error("[bus] publish failed", err);
  }
}
