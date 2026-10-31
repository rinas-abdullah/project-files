import { route } from "@/lib/api";
import type { z } from "zod";
import { noteSchema } from "@/lib/validation/schemas";
import { addNote } from "@/lib/services/encounters";

export const POST = route<z.infer<typeof noteSchema>, { id: string }>({ permission: "case:clinical_write", schema: noteSchema }, async ({ user, params, body }) => {
  return addNote(user, params.id, body);
});
