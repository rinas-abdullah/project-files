import { route } from "@/lib/api";
import { runTriage } from "@/lib/services/encounters";

export const POST = route<unknown, { id: string }>({ permission: "triage:run" }, async ({ user, params }) => {
  const a = await runTriage(user, params.id);
  return { id: a.id, suggestedPriority: a.suggestedPriority, riskScore: a.riskScore, confidence: a.confidence };
});
