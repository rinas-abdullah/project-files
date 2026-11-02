import { describe, expect, it } from "vitest";
import { assessTriage, requiredCapabilities, type TriageVital } from "@/lib/engines/triage";

const now = new Date("2026-10-31T12:00:00Z");
const v = (type: TriageVital["type"], value: number, minAgo = 1, value2?: number): TriageVital => ({ type, value, value2, recordedAt: new Date(now.getTime() - minAgo * 60000) });

describe("AI-assisted triage (rule-based demo engine)", () => {
  it("flags a critically unwell patient as P1 with explainable factors", () => {
    const r = assessTriage({
      now,
      age: 70,
      chiefComplaint: "Shortness of breath",
      vitals: [v("SPO2", 95, 20), v("SPO2", 85), v("BLOOD_PRESSURE", 130, 20, 80), v("BLOOD_PRESSURE", 88, 1, 55), v("HEART_RATE", 135), v("RESPIRATORY_RATE", 28), v("GCS", 12)],
    });
    expect(r.suggestedPriority).toBe("P1");
    const codes = r.factors.map((f) => f.code);
    expect(codes).toEqual(expect.arrayContaining(["SPO2_CRITICAL", "SBP_CRITICAL", "FALLING_BP", "FALLING_SPO2", "GCS_REDUCED"]));
    expect(r.riskScore).toBeGreaterThan(80);
    expect(r.missingData).toEqual([]);
  });

  it("keeps a well patient at low priority", () => {
    const r = assessTriage({ now, age: 30, chiefComplaint: "Minor laceration to hand", vitals: [v("HEART_RATE", 80), v("BLOOD_PRESSURE", 122, 1, 78), v("SPO2", 99), v("RESPIRATORY_RATE", 16), v("GCS", 15)] });
    expect(["P3", "P4"]).toContain(r.suggestedPriority);
    expect(r.riskScore).toBeLessThan(30);
  });

  it("treats stroke signs as at least P2 (time-critical pathway)", () => {
    const r = assessTriage({ now, age: 55, chiefComplaint: "Facial droop and slurred speech", vitals: [v("HEART_RATE", 84), v("BLOOD_PRESSURE", 150, 1, 90), v("SPO2", 97), v("RESPIRATORY_RATE", 16), v("GCS", 15)] });
    expect(["P1", "P2"]).toContain(r.suggestedPriority);
    expect(r.factors.some((f) => f.code === "STROKE_SIGNS")).toBe(true);
  });

  it("reports missing data and lowers confidence", () => {
    const full = assessTriage({ now, age: 40, chiefComplaint: "Abdominal pain", vitals: [v("HEART_RATE", 90), v("BLOOD_PRESSURE", 120, 1, 80), v("SPO2", 98), v("RESPIRATORY_RATE", 18), v("GCS", 15)] });
    const sparse = assessTriage({ now, chiefComplaint: "", vitals: [v("HEART_RATE", 90)] });
    expect(sparse.missingData).toEqual(expect.arrayContaining(["BLOOD_PRESSURE", "SPO2", "AGE", "CHIEF_COMPLAINT"]));
    expect(sparse.confidence).toBeLessThan(full.confidence);
  });

  it("derives required capabilities from complaint and mechanism", () => {
    expect(requiredCapabilities({ chiefComplaint: "Chest pain, STEMI suspected" })).toEqual(expect.arrayContaining(["CATH_LAB", "CARDIOLOGY"]));
    expect(requiredCapabilities({ chiefComplaint: "Multiple injuries", mechanism: "high-speed collision" })).toEqual(expect.arrayContaining(["TRAUMA_CENTER", "CT"]));
    expect(requiredCapabilities({ chiefComplaint: "Burns to arms" })).toContain("BURN_UNIT");
    expect(requiredCapabilities({ chiefComplaint: "Fever", age: 6 })).toContain("PEDIATRIC");
  });
});
