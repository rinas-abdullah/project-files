import { route } from "@/lib/api";
import type { z } from "zod";
import { capabilitySchema } from "@/lib/validation/schemas";
import { updateCapability } from "@/lib/services/encounters";

export const POST = route<z.infer<typeof capabilitySchema>, { id: string }>({ permission: "hospital:capabilities", schema: capabilitySchema }, async ({ user, params, body }) => {
  await updateCapability(user, params.id, body.capability, body.available);
});
