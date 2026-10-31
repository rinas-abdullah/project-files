import { route } from "@/lib/api";
import type { z } from "zod";
import { prioritySchema } from "@/lib/validation/schemas";
import { changePriority } from "@/lib/services/encounters";

export const POST = route<z.infer<typeof prioritySchema>, { id: string }>({ permission: "case:clinical_write", schema: prioritySchema }, async ({ user, params, body }) => {
  return (await changePriority(user, params.id, body), { ok: true });
});
