import { route } from "@/lib/api";
import type { z } from "zod";
import { monitorSchema } from "@/lib/validation/schemas";
import { ApiError, scopedEncounter } from "@/lib/services/core";
import { audit } from "@/lib/audit";
import { startMonitor, stopMonitor } from "@/lib/services/simulation";

export const POST = route<z.infer<typeof monitorSchema>, { id: string }>({ permission: ["case:clinical_write", "demo:run"], schema: monitorSchema }, async ({ user, params, body }) => {
  await scopedEncounter(user, params.id);
  if (body.action === "start") {
    try {
      await startMonitor(params.id, body.scenario ?? "STABLE");
    } catch (e) {
      throw new ApiError(503, "INTEGRATION_NOT_CONNECTED", (e as Error).message);
    }
  } else stopMonitor(params.id);
  await audit({ id: user.id, email: user.email, role: user.role, organizationId: user.organizationId }, `monitor.${body.action}`, "PatientEncounter", params.id, undefined, { scenario: body.scenario });
});
