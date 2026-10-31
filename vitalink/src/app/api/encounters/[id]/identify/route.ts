import { route } from "@/lib/api";
import type { z } from "zod";
import { identifySchema } from "@/lib/validation/schemas";
import { identifyPatient } from "@/lib/services/encounters";

export const POST = route<z.infer<typeof identifySchema>, { id: string }>({ permission: "identity:verify", schema: identifySchema }, async ({ user, params, body }) => {
  return identifyPatient(user, params.id, body);
});
