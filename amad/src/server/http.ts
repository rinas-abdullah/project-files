import "server-only";
import { NextResponse } from "next/server";
import { getActor } from "./auth/session";

/** Rejects cross-origin state-changing requests (defence in depth on top of SameSite=Lax cookies). */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Maps service errors to safe JSON responses without leaking internals. */
export function errorResponse(err: unknown) {
  const e = err as { status?: number; message?: string; fields?: Record<string, string[]> };
  if (e && typeof e.status === "number" && e.status >= 400 && e.status < 500) {
    return NextResponse.json({ error: e.message, fields: e.fields }, { status: e.status });
  }
  console.error("[amad] unhandled error", err);
  return NextResponse.json({ error: "internal-error" }, { status: 500 });
}

export async function withActor(request: Request, fn: (actor: NonNullable<Awaited<ReturnType<typeof getActor>>>) => Promise<Response>) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "bad-origin" }, { status: 403 });
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  try {
    return await fn(actor);
  } catch (err) {
    return errorResponse(err);
  }
}
