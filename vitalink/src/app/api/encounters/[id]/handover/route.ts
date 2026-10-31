import { route } from "@/lib/api";
import type { z } from "zod";
import { can } from "@/lib/rbac";
import { handoverSchema } from "@/lib/validation/schemas";
import { ApiError } from "@/lib/services/core";
import { acceptHandover, completeHandover, startHandover } from "@/lib/services/encounters";

export const POST = route<z.infer<typeof handoverSchema>, { id: string }>({ permission: ["handover:start", "handover:receive"], schema: handoverSchema }, async ({ user, params, body }) => {
  if (body.action === "start") {
    if (!can(user.role, "handover:start") && !can(user.role, "handover:receive")) throw new ApiError(403, "FORBIDDEN");
    await startHandover(user, params.id);
  } else {
    if (!can(user.role, "handover:receive")) throw new ApiError(403, "FORBIDDEN");
    if (body.action === "accept") await acceptHandover(user, params.id);
    else await completeHandover(user, params.id, body.notes);
  }
});
