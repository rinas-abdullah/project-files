import { route } from "@/lib/api";
import type { z } from "zod";
import { prisma } from "@/lib/db";
import { alertActionSchema } from "@/lib/validation/schemas";
import { ApiError } from "@/lib/services/core";
import { audit } from "@/lib/audit";
import { publish } from "@/lib/realtime/bus";
import { alertScope } from "@/lib/queries";

export const POST = route<z.infer<typeof alertActionSchema>, { id: string }>({ permission: "alerts:manage", schema: alertActionSchema }, async ({ user, params, body }) => {
  const alert = await prisma.alert.findFirst({ where: { AND: [{ id: params.id }, alertScope(user)] } });
  if (!alert) throw new ApiError(404, "NOT_FOUND");
  const data = body.action === "acknowledge" ? { status: "ACKNOWLEDGED" as const, acknowledgedAt: new Date(), acknowledgedById: user.id } : { status: "RESOLVED" as const, resolvedAt: new Date(), acknowledgedAt: alert.acknowledgedAt ?? new Date(), acknowledgedById: alert.acknowledgedById ?? user.id };
  await prisma.alert.update({ where: { id: alert.id }, data });
  await audit({ id: user.id, email: user.email, role: user.role, organizationId: user.organizationId }, `alert.${body.action}`, "Alert", alert.id, { status: alert.status }, { status: data.status });
  await publish({ t: "alert", e: alert.encounterId ?? undefined, h: alert.hospitalId ? [alert.hospitalId] : undefined, a: alert.ambulanceId ?? undefined });
});
