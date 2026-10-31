import "server-only";
import type { IntegrationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export const INTEGRATION_KEYS = ["NAFATH", "NPHIES", "HIS", "EPCR", "MEDICAL_MONITOR", "ROUTING"] as const;
export type IntegrationKey = (typeof INTEGRATION_KEYS)[number];

export class IntegrationUnavailableError extends Error {
  constructor(public key: IntegrationKey, public status: IntegrationStatus | "MISSING") {
    super(`Integration ${key} is not connected (status: ${status})`);
  }
}

export async function integrationStatus(key: IntegrationKey): Promise<IntegrationStatus | "MISSING"> {
  const row = await prisma.integration.findUnique({ where: { key } });
  return row?.status ?? "MISSING";
}

/** Usable = a simulated adapter is enabled, or a live adapter is connected/sandboxed. */
export function isUsable(s: IntegrationStatus | "MISSING") {
  return s === "SIMULATED" || s === "SANDBOX" || s === "CONNECTED";
}

export async function recordIntegrationResult(key: IntegrationKey, error?: string) {
  await prisma.integration.update({
    where: { key },
    data: { lastCheckedAt: new Date(), lastError: error ?? null },
  });
}
