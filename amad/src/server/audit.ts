import "server-only";
import { db } from "./db";
import type { Prisma } from "@/generated/prisma/client";

export interface AuditEntry {
  action: string;
  orgId?: string | null;
  userId?: string | null;
  targetType?: string;
  targetId?: string;
  ip?: string | null;
  meta?: Prisma.InputJsonValue;
}

export async function audit(entry: AuditEntry, tx: Prisma.TransactionClient = db) {
  await tx.auditLog.create({
    data: {
      action: entry.action,
      orgId: entry.orgId ?? null,
      userId: entry.userId ?? null,
      targetType: entry.targetType,
      targetId: entry.targetId,
      ip: entry.ip ?? null,
      meta: entry.meta,
    },
  });
}
