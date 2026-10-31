import { route } from "@/lib/api";
import type { z } from "zod";
import { prisma } from "@/lib/db";
import { integrationSchema } from "@/lib/validation/schemas";
import { ApiError } from "@/lib/services/core";
import { audit } from "@/lib/audit";

/** Live credentials required before an integration can be put in a live mode. */
const LIVE_ENV: Record<string, string[]> = {
  NAFATH: ["NAFATH_API_URL", "NAFATH_CLIENT_ID", "NAFATH_CLIENT_SECRET"],
  NPHIES: ["NPHIES_API_URL", "NPHIES_CLIENT_ID"],
  HIS: ["HIS_HL7_ENDPOINT"],
  EPCR: ["EPCR_API_URL"],
  MEDICAL_MONITOR: ["MONITOR_GATEWAY_URL"],
  ROUTING: ["ROUTING_OSRM_URL"],
};

export const POST = route<z.infer<typeof integrationSchema>, { key: string }>({ permission: "integrations:manage", schema: integrationSchema }, async ({ user, params, body }) => {
  const row = await prisma.integration.findUnique({ where: { key: params.key } });
  if (!row) throw new ApiError(404, "NOT_FOUND");
  if (body.status === "CONNECTED" || body.status === "SANDBOX") {
    const missing = (LIVE_ENV[row.key] ?? []).filter((k) => !process.env[k]);
    if (missing.length) throw new ApiError(409, "CREDENTIALS_MISSING", `Missing: ${missing.join(", ")}`);
    if (row.key !== "ROUTING") throw new ApiError(409, "CREDENTIALS_MISSING", "Live adapter requires official onboarding");
  }
  await prisma.integration.update({ where: { key: row.key }, data: { status: body.status, lastCheckedAt: new Date(), lastError: null } });
  await audit({ id: user.id, email: user.email, role: user.role, organizationId: user.organizationId }, "integration.status_changed", "Integration", row.id, { status: row.status }, { status: body.status });
});
