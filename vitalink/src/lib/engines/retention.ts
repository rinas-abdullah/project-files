/**
 * Data retention policy for patient identifiers and media.
 *
 * After an encounter is closed, the platform keeps what is needed for operations
 * and quality review (timings, priority, vitals, destination) and removes what
 * identifies the pilgrim. Windows are configurable so the operating authority
 * can set them in its data-sharing agreement; the defaults are conservative.
 */
export const RETENTION_ENGINE_VERSION = "retention-1.0";

export const CLOSED_STATUSES = ["COMPLETED", "CANCELLED", "DIVERTED"] as const;

export type RetentionPolicy = {
  /** Days after closure before photos/videos are deleted. */
  mediaDays: number;
  /** Days after closure before name, National ID, phone, free text and fetched health profile are removed. */
  identifierDays: number;
  /** Days before audit events are deleted (kept longest, for accountability). */
  auditDays: number;
};

export const DEFAULT_POLICY: RetentionPolicy = { mediaDays: 30, identifierDays: 30, auditDays: 365 };

function days(value: string | undefined, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : fallback;
}

export function policyFromEnv(env: Record<string, string | undefined>): RetentionPolicy {
  return {
    mediaDays: days(env.RETENTION_MEDIA_DAYS, DEFAULT_POLICY.mediaDays),
    identifierDays: days(env.RETENTION_IDENTIFIER_DAYS, DEFAULT_POLICY.identifierDays),
    auditDays: days(env.RETENTION_AUDIT_DAYS, DEFAULT_POLICY.auditDays),
  };
}

export function cutoff(now: Date, d: number) {
  return new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
}

/** An encounter is eligible only once it is closed and its closure is older than the window. Open cases are never touched. */
export function isEligible(enc: { status: string; closedAt: Date | null }, now: Date, d: number) {
  if (!(CLOSED_STATUSES as readonly string[]).includes(enc.status)) return false;
  if (!enc.closedAt) return false;
  return enc.closedAt <= cutoff(now, d);
}
