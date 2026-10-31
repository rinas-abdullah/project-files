import { route } from "@/lib/api";
import type { z } from "zod";
import { recommendationDecisionSchema } from "@/lib/validation/schemas";
import { decideRecommendation } from "@/lib/services/encounters";

export const POST = route<z.infer<typeof recommendationDecisionSchema>, { id: string }>({ permission: "recommendation:approve", schema: recommendationDecisionSchema }, async ({ user, params, body }) => {
  await decideRecommendation(user, params.id, body);
});
