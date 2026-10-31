import { route } from "@/lib/api";
import type { z } from "zod";
import { interventionSchema } from "@/lib/validation/schemas";
import { addIntervention } from "@/lib/services/encounters";

export const POST = route<z.infer<typeof interventionSchema>, { id: string }>({ permission: "case:clinical_write", schema: interventionSchema }, async ({ user, params, body }) => {
  return addIntervention(user, params.id, body);
});
