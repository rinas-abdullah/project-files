import { route } from "@/lib/api";
import type { z } from "zod";
import { prisma } from "@/lib/db";
import { positionSchema } from "@/lib/validation/schemas";
import { ApiError, emit } from "@/lib/services/core";
import { applyPosition } from "@/lib/services/movement";

/** GPS position updates from the ambulance device. */
export const POST = route<z.infer<typeof positionSchema>, { id: string }>({ permission: "case:create", schema: positionSchema, rate: [240, 60_000] }, async ({ user, params, body }) => {
  if (user.ambulanceId !== params.id) throw new ApiError(404, "NOT_FOUND");
  const mission = await prisma.ambulanceMission.findFirst({ where: { ambulanceId: params.id, status: "TRANSPORTING" } });
  if (mission) await applyPosition(mission.id, { lat: body.lat, lng: body.lng }, { speedKmh: body.speedKmh });
  else {
    const amb = await prisma.ambulance.update({ where: { id: params.id }, data: { lat: body.lat, lng: body.lng, lastPositionAt: new Date(), speedKmh: body.speedKmh ?? 0 } });
    await emit({ t: "position", a: amb.id, o: [amb.organizationId] });
  }
});
