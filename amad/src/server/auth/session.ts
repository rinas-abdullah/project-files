import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { resolveSession, SESSION_TTL_MS, type RequestMeta } from "./service";
import type { Actor } from "./rbac";

export const SESSION_COOKIE = "amad_session";

export async function requestMeta(): Promise<RequestMeta> {
  const h = await headers();
  // NOTE: x-forwarded-for is only trustworthy behind a proxy that overwrites it (documented in SECURITY.md).
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  return { ip, userAgent: h.get("user-agent") };
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function sessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

/** Current actor for this request (deduplicated per render). */
export const getActor = cache(async (): Promise<Actor | null> => resolveSession(await sessionToken()));

export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect("/login");
  return actor;
}
