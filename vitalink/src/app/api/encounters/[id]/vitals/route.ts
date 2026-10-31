import { route } from "@/lib/api";
import type { z } from "zod";
import { vitalsSchema } from "@/lib/validation/schemas";
import { addVitals } from "@/lib/services/encounters";

export const POST = route<z.infer<typeof vitalsSchema>, { id: string }>({ permission: "case:clinical_write", schema: vitalsSchema }, async ({ user, params, body }) => {
  return { count: (await addVitals(user, params.id, body.vitals)).length };
});
