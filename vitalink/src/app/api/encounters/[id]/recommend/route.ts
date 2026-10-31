import { route } from "@/lib/api";
import { recommendDestination } from "@/lib/services/encounters";

export const POST = route<unknown, { id: string }>({ permission: "destination:recommend" }, async ({ user, params }) => {
  const r = await recommendDestination(user, params.id);
  return { id: r.id, recommendedHospitalId: r.recommendedHospitalId, score: r.score };
});
