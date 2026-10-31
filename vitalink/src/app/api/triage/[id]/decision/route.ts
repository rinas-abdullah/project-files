import { route } from "@/lib/api";
import type { z } from "zod";
import { triageDecisionSchema } from "@/lib/validation/schemas";
import { decideTriage } from "@/lib/services/encounters";

export const POST = route<z.infer<typeof triageDecisionSchema>, { id: string }>({ permission: "triage:decide", schema: triageDecisionSchema }, async ({ user, params, body }) => {
  await decideTriage(user, params.id, body);
});
