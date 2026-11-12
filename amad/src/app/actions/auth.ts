"use server";

import { redirect } from "next/navigation";
import { login, register, revokeOtherSessions, revokeSession } from "@/server/auth/service";
import { clearSessionCookie, requestMeta, requireActor, sessionToken, setSessionCookie } from "@/server/auth/session";

export type AuthFormState = { error?: string; fields?: Record<string, string[]>; values?: Record<string, string> } | undefined;

const MESSAGES: Record<string, string> = {
  "invalid-credentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "rate-limited": "محاولات كثيرة غير ناجحة. انتظر 15 دقيقة ثم حاول مرة أخرى.",
  "email-taken": "هذا البريد مسجّل مسبقًا.",
  "invalid-input": "تحقق من الحقول المطلوبة.",
};

function safeNext(next: FormDataEntryValue | null) {
  const v = typeof next === "string" ? next : "";
  return v.startsWith("/app") && !v.startsWith("//") ? v : "/app";
}

export async function loginAction(_: AuthFormState, form: FormData): Promise<AuthFormState> {
  const values = { email: String(form.get("email") ?? "") };
  let token: string;
  try {
    ({ token } = await login({ email: form.get("email"), password: form.get("password") }, await requestMeta()));
  } catch (e) {
    const err = e as { message: string; fields?: Record<string, string[]> };
    if (!(err.message in MESSAGES)) throw e;
    return { error: MESSAGES[err.message], fields: err.fields, values };
  }
  await setSessionCookie(token);
  redirect(safeNext(form.get("next")));
}

export async function registerAction(_: AuthFormState, form: FormData): Promise<AuthFormState> {
  const values = { name: String(form.get("name") ?? ""), email: String(form.get("email") ?? ""), orgName: String(form.get("orgName") ?? ""), orgKind: String(form.get("orgKind") ?? "") };
  let token: string;
  try {
    ({ token } = await register({ ...values, password: form.get("password") }, await requestMeta()));
  } catch (e) {
    const err = e as { message: string; fields?: Record<string, string[]> };
    if (!(err.message in MESSAGES)) throw e;
    return { error: MESSAGES[err.message], fields: err.fields, values };
  }
  await setSessionCookie(token);
  redirect("/app");
}

export async function logoutAction() {
  const token = await sessionToken();
  if (token) await revokeSession(token, await requestMeta());
  await clearSessionCookie();
  redirect("/login");
}

export async function revokeOtherSessionsAction() {
  const actor = await requireActor();
  await revokeOtherSessions(actor, await requestMeta());
  redirect("/app/account?revoked=1");
}
