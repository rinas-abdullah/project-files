import { route } from "@/lib/api";
import type { z } from "zod";
import { selectDestinationSchema } from "@/lib/validation/schemas";
import { selectDestination } from "@/lib/services/encounters";

export const POST = route<z.infer<typeof selectDestinationSchema>, { id: string }>({ permission: "destination:select_initial", schema: selectDestinationSchema }, async ({ user, params, body }) => {
  return (await selectDestination(user, params.id, body), { ok: true });
});
