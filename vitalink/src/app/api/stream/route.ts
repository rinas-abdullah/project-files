import { getCurrentUser } from "@/lib/session";
import { subscribe, type LiveEvent } from "@/lib/realtime/bus";
import { ensureSimulationLoop } from "@/lib/services/simulation";

/** Server-Sent Events: pushes scoped live events to the browser. */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  ensureSimulationLoop();

  const visible = (ev: LiveEvent): boolean => {
    if (ev.t === "notify") return Array.isArray(ev.d?.u) ? (ev.d!.u as string[]).includes(user.id) : ev.a ? ev.a === user.ambulanceId : false;
    if (user.orgType === "PLATFORM") return true;
    if (user.orgType === "EMS") {
      if (user.role === "PARAMEDIC") return ev.a === user.ambulanceId || ev.t === "resource";
      return !ev.o || ev.o.includes(user.organizationId) || ev.t === "resource" || ev.t === "alert";
    }
    // hospital users
    if (ev.t === "resource") return true;
    return !!user.hospitalId && !!ev.h?.includes(user.hospitalId);
  };

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let ping: ReturnType<typeof setInterval> | null = null;
  const stream = new ReadableStream({
    async start(controller) {
      const send = (ev: LiveEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(ev)}\n\n`));
        } catch {
          /* closed */
        }
      };
      send({ t: "ping" });
      unsubscribe = await subscribe((ev) => {
        if (visible(ev)) send(ev);
      });
      ping = setInterval(() => send({ t: "ping" }), 20_000);
      req.signal.addEventListener("abort", () => {
        unsubscribe?.();
        if (ping) clearInterval(ping);
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      unsubscribe?.();
      if (ping) clearInterval(ping);
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
