import { route } from "@/lib/api";
import type { z } from "zod";
import { readinessSchema } from "@/lib/validation/schemas";
import { setReadiness } from "@/lib/services/encounters";

export const POST = route<z.infer<typeof readinessSchema>, { id: string }>({ permission: "case:prepare", schema: readinessSchema }, async ({ user, params, body }) => {
  return (await setReadiness(user, params.id, body.readiness, body.note), { ok: true });
});
