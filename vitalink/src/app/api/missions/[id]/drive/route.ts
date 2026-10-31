import { route } from "@/lib/api";
import { prisma } from "@/lib/db";
import { driveSchema } from "@/lib/validation/schemas";
import { ApiError } from "@/lib/services/core";
import { audit } from "@/lib/audit";
import { jumpToGeofence, markArrived, stepAlongRoute } from "@/lib/services/movement";
import { startDrive, stopDrive } from "@/lib/services/simulation";

/** Transport simulation controls (route-based movement). Available to the crew and demo operators. */
export const POST = route<import("zod").infer<typeof driveSchema>, { id: string }>({ permission: ["case:create", "demo:run"], schema: driveSchema }, async ({ user, params, body }) => {
  const mission = await prisma.ambulanceMission.findUnique({ where: { id: params.id }, include: { ambulance: true } });
  if (!mission) throw new ApiError(404, "NOT_FOUND");
  if (user.role === "PARAMEDIC" && mission.ambulanceId !== user.ambulanceId) throw new ApiError(404, "NOT_FOUND");
  if (user.orgType === "EMS" && mission.ambulance.organizationId !== user.organizationId) throw new ApiError(404, "NOT_FOUND");
  if (body.action !== "stop" && mission.status !== "TRANSPORTING") throw new ApiError(409, "INVALID_STATE");
  if (body.action === "start") startDrive(mission.id, body.steps ?? 2);
  if (body.action === "stop") stopDrive(mission.id);
  if (body.action === "step") await stepAlongRoute(mission.id, body.steps ?? 3);
  if (body.action === "geofence") await jumpToGeofence(mission.id);
  if (body.action === "arrive") {
    stopDrive(mission.id);
    await markArrived(mission.id);
  }
  await audit({ id: user.id, email: user.email, role: user.role, organizationId: user.organizationId }, `simulation.drive_${body.action}`, "AmbulanceMission", mission.id);
});
