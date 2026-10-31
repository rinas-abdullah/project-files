import { route } from "@/lib/api";
import { createMissionSchema } from "@/lib/validation/schemas";
import { createMission } from "@/lib/services/encounters";

export const POST = route({ permission: ["case:create", "dispatch:manage"], schema: createMissionSchema }, async ({ user, body }) => {
  const r = await createMission(user, body);
  return { incidentId: r.incident.id, missionId: r.mission.id, code: r.mission.code };
});
