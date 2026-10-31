import { route } from "@/lib/api";
import type { z } from "zod";
import { divertSchema } from "@/lib/validation/schemas";
import { changeDestination } from "@/lib/services/encounters";

export const POST = route<z.infer<typeof divertSchema>, { id: string }>({ permission: "destination:change", schema: divertSchema }, async ({ user, params, body }) => {
  return (await changeDestination(user, params.id, body), { ok: true });
});
