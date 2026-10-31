import { route } from "@/lib/api";
import type { z } from "zod";
import { cancelSchema } from "@/lib/validation/schemas";
import { cancelEncounter } from "@/lib/services/encounters";

export const POST = route<z.infer<typeof cancelSchema>, { id: string }>({ permission: "case:clinical_write", schema: cancelSchema }, async ({ user, params, body }) => {
  return (await cancelEncounter(user, params.id, body.reason), { ok: true });
});
