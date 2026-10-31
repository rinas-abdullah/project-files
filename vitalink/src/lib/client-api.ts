"use client";
import { toast } from "sonner";
import type { Dict } from "@/lib/i18n/en";

export type ApiResult<T = unknown> = { ok: true; data: T } | { ok: false; status: number; error: string; message?: string };

export async function api<T = unknown>(url: string, body?: unknown, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: body instanceof FormData || body !== undefined ? "POST" : init?.method ?? "GET",
      headers: body instanceof FormData || body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
      ...init,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, status: res.status, error: json.error ?? "INTERNAL", message: json.message ?? json.issues?.map((i: { message: string }) => i.message).join(", ") };
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, status: 0, error: "NETWORK" };
  }
}

export function errorText(t: Dict, r: { error: string; message?: string }) {
  const base = (t.errors as Record<string, string>)[r.error] ?? t.common.error;
  return r.error === "VALIDATION" && r.message ? `${base}: ${r.message}` : base;
}

export function toastResult(t: Dict, r: ApiResult, success?: string) {
  if (r.ok) {
    if (success) toast.success(success);
  } else toast.error(errorText(t, r));
  return r.ok;
}
