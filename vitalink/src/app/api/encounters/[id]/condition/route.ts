import { route } from "@/lib/api";
import type { z } from "zod";
import { conditionSchema } from "@/lib/validation/schemas";
import { updateCondition } from "@/lib/services/encounters";

export const POST = route<z.infer<typeof conditionSchema>, { id: string }>({ permission: "case:clinical_write", schema: conditionSchema }, async ({ user, params, body }) => {
  return (await updateCondition(user, params.id, body), { ok: true });
});
