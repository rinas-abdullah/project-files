import { route } from "@/lib/api";
import type { z } from "zod";
import { preparationSchema } from "@/lib/validation/schemas";
import { setPreparation } from "@/lib/services/encounters";

export const POST = route<z.infer<typeof preparationSchema>, { id: string }>({ permission: "case:prepare", schema: preparationSchema }, async ({ user, params, body }) => {
  return (await setPreparation(user, params.id, body.item, body.done), { ok: true });
});
