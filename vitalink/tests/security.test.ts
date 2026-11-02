import { describe, expect, it } from "vitest";
import { can, homeFor, ROLE_PERMISSIONS } from "@/lib/rbac";
import { encounterScope } from "@/lib/scope";
import { decrypt, encrypt, lookupHash, maskId } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";

describe("RBAC", () => {
  it("separates EMS, hospital and analytics duties", () => {
    expect(can("PARAMEDIC", "case:clinical_write")).toBe(true);
    expect(can("PARAMEDIC", "destination:change")).toBe(false);
    expect(can("EMS_DISPATCH", "destination:change")).toBe(true);
    expect(can("ED_NURSE", "case:acknowledge")).toBe(true);
    expect(can("ED_NURSE", "case:clinical_write")).toBe(false);
    expect(can("OPERATIONS_ANALYST", "analytics:read")).toBe(true);
    expect(can("OPERATIONS_ANALYST", "case:acknowledge")).toBe(false);
    expect(can("AUDITOR", "audit:read")).toBe(true);
    expect(can("AUDITOR", "demo:run")).toBe(false);
    expect(ROLE_PERMISSIONS.SUPER_ADMIN.length).toBeGreaterThan(20);
  });
  it("routes each role to its dashboard", () => {
    expect(homeFor("PARAMEDIC")).toBe("/paramedic");
    expect(homeFor("ED_DOCTOR")).toBe("/ed");
    expect(homeFor("EMS_DISPATCH")).toBe("/dispatch");
    expect(homeFor("OPERATIONS_ANALYST")).toBe("/analytics");
  });
});

describe("tenant isolation", () => {
  it("scopes hospital users to their own (and diverted-away) cases", () => {
    const w = encounterScope({ role: "ED_NURSE", orgType: "HOSPITAL", organizationId: "o", hospitalId: "H1", ambulanceId: null });
    expect(JSON.stringify(w)).toContain("H1");
    expect(JSON.stringify(w)).toContain("destinationHistory");
  });
  it("scopes paramedics to their ambulance and EMS staff to their operator", () => {
    expect(encounterScope({ role: "PARAMEDIC", orgType: "EMS", organizationId: "E", hospitalId: null, ambulanceId: "A1" })).toEqual({ mission: { ambulanceId: "A1" } });
    expect(encounterScope({ role: "EMS_DISPATCH", orgType: "EMS", organizationId: "E", hospitalId: null, ambulanceId: null })).toEqual({ mission: { ambulance: { organizationId: "E" } } });
    expect(encounterScope({ role: "ED_NURSE", orgType: "HOSPITAL", organizationId: "o", hospitalId: null, ambulanceId: null }).OR).toBeDefined();
  });
});

describe("sensitive data", () => {
  it("encrypts national IDs with AES-GCM and masks them", () => {
    const c = encrypt("1098765432");
    expect(c).not.toContain("1098765432");
    expect(decrypt(c)).toBe("1098765432");
    expect(encrypt("1098765432")).not.toBe(c); // random IV
    expect(lookupHash("1098765432")).toBe(lookupHash("1098765432"));
    expect(maskId("5432")).toBe("••••••5432");
  });
  it("rate limits", () => {
    const key = `t-${Math.random()}`;
    for (let i = 0; i < 3; i++) expect(rateLimit(key, 3, 60000).ok).toBe(true);
    expect(rateLimit(key, 3, 60000).ok).toBe(false);
  });
});
