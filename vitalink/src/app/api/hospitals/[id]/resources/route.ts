import { route } from "@/lib/api";
import type { z } from "zod";
import { resourceSchema } from "@/lib/validation/schemas";
import { updateResource } from "@/lib/services/encounters";

export const POST = route<z.infer<typeof resourceSchema>, { id: string }>({ permission: "hospital:resources", schema: resourceSchema }, async ({ user, params, body }) => {
  await updateResource(user, params.id, body);
});
