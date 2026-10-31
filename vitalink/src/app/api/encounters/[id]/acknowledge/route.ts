import { route } from "@/lib/api";
import type { z } from "zod";
import { ackSchema } from "@/lib/validation/schemas";
import { acknowledge } from "@/lib/services/encounters";

export const POST = route<z.infer<typeof ackSchema>, { id: string }>({ permission: "case:acknowledge", schema: ackSchema }, async ({ user, params, body }) => {
  return (await acknowledge(user, params.id, body.note), { ok: true });
});
