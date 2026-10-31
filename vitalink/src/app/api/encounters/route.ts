import { route } from "@/lib/api";
import { createEncounterSchema } from "@/lib/validation/schemas";
import { createEncounter } from "@/lib/services/encounters";

export const POST = route({ permission: "case:create", schema: createEncounterSchema }, async ({ user, body }) => {
  const enc = await createEncounter(user, body);
  return { id: enc.id, code: enc.code };
});
