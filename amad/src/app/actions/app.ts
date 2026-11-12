"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { requireActor } from "@/server/auth/session";
import { startSession } from "@/server/services/simulation";
import { markNotificationsRead } from "@/server/services/dashboard";

export async function startSessionAction(form: FormData) {
  const actor = await requireActor();
  const scenarioId = String(form.get("scenarioId") ?? "");
  const s = await startSession(actor, scenarioId);
  redirect(`/app/sessions/${s.id}`);
}

export async function markAllReadAction() {
  const actor = await requireActor();
  await markNotificationsRead(actor);
  // Next 16: refresh the client router so the nav unread badge updates.
  refresh();
}
