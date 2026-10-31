import { route } from "@/lib/api";
import type { z } from "zod";
import { medicationSchema } from "@/lib/validation/schemas";
import { addMedication } from "@/lib/services/encounters";

export const POST = route<z.infer<typeof medicationSchema>, { id: string }>({ permission: "case:clinical_write", schema: medicationSchema }, async ({ user, params, body }) => {
  return addMedication(user, params.id, body);
});
