import "server-only";
import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type Actor = { id: string; email: string; role: Prisma.AuditEventCreateInput["role"]; organizationId: string } | null;

export async function audit(
  actor: Actor,
  action: string,
  entityType: string,
  entityId: string | null,
  before?: unknown,
  after?: unknown,
) {
  let ip: string | null = null;
  let ua: string | null = null;
  try {
    const h = await headers();
    ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    ua = h.get("user-agent")?.slice(0, 250) ?? null;
  } catch {
    // outside a request (simulation ticks / seed)
  }
  await prisma.auditEvent.create({
    data: {
      userId: actor?.id ?? null,
      userEmail: actor?.email ?? "system",
      role: actor?.role ?? null,
      orgId: actor?.organizationId ?? null,
      action,
      entityType,
      entityId,
      before: before === undefined ? undefined : (JSON.parse(JSON.stringify(before)) as Prisma.InputJsonValue),
      after: after === undefined ? undefined : (JSON.parse(JSON.stringify(after)) as Prisma.InputJsonValue),
      ip,
      userAgent: ua,
    },
  });
}
