import { describe, expect, it } from "vitest";
import { DEFAULT_POLICY, isEligible, policyFromEnv } from "@/lib/engines/retention";

const now = new Date("2026-11-03T12:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

describe("retention policy", () => {
  it("never touches open encounters, whatever their age", () => {
    expect(isEligible({ status: "PRE_ALERT_SENT", closedAt: daysAgo(400) }, now, 30)).toBe(false);
    expect(isEligible({ status: "COMPLETED", closedAt: null }, now, 30)).toBe(false);
  });
  it("removes identifiers only after the window has passed", () => {
    expect(isEligible({ status: "COMPLETED", closedAt: daysAgo(29) }, now, 30)).toBe(false);
    expect(isEligible({ status: "COMPLETED", closedAt: daysAgo(31) }, now, 30)).toBe(true);
    expect(isEligible({ status: "CANCELLED", closedAt: daysAgo(31) }, now, 30)).toBe(true);
  });
  it("reads windows from env and rejects invalid values", () => {
    expect(policyFromEnv({ RETENTION_MEDIA_DAYS: "7" }).mediaDays).toBe(7);
    expect(policyFromEnv({ RETENTION_MEDIA_DAYS: "0" }).mediaDays).toBe(DEFAULT_POLICY.mediaDays);
    expect(policyFromEnv({ RETENTION_AUDIT_DAYS: "abc" }).auditDays).toBe(DEFAULT_POLICY.auditDays);
  });
});

import { freshStatus } from "@/lib/engines/destination";

describe("resource freshness", () => {
  const t0 = new Date("2026-11-03T12:00:00Z");
  const ago = (min: number) => new Date(t0.getTime() - min * 60000);
  it("decays an old AVAILABLE to UNKNOWN", () => {
    expect(freshStatus("AVAILABLE", ago(30), t0)).toBe("AVAILABLE");
    expect(freshStatus("AVAILABLE", ago(300), t0)).toBe("UNKNOWN");
    expect(freshStatus("LIMITED", ago(300), t0)).toBe("UNKNOWN");
  });
  it("never assumes an unavailable resource came back", () => {
    expect(freshStatus("UNAVAILABLE", ago(10000), t0)).toBe("UNAVAILABLE");
  });
});
