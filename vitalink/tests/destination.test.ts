import { describe, expect, it } from "vitest";
import { rankHospitals, type HospitalCandidate } from "@/lib/engines/destination";

const base = (over: Partial<HospitalCandidate>): HospitalCandidate => ({
  id: "x",
  name: "X",
  lat: 21.55,
  lng: 39.18,
  edCapacity: 30,
  capabilities: {},
  resources: { ED_CAPACITY: "AVAILABLE", AVAILABLE_BEDS: "AVAILABLE", SPECIALISTS: "AVAILABLE" },
  load: { incoming: 0, activeEd: 10, criticalIncoming: 0, avgHandoverMin: 12 },
  ...over,
});

describe("Smart destination (decision support)", () => {
  const origin = { lat: 21.55, lng: 39.18 };

  it("prefers a hospital with the required capability over a closer one without it", () => {
    const near = base({ id: "near", name: "Near", lat: 21.552, lng: 39.181 });
    const far = base({ id: "cath", name: "Cath", lat: 21.58, lng: 39.2, capabilities: { CATH_LAB: true, CARDIOLOGY: true }, resources: { ...base({}).resources, CATH_LAB: "AVAILABLE" } });
    const r = rankHospitals({ origin, priority: "P1", requiredCapabilities: ["CATH_LAB", "CARDIOLOGY"], hospitals: [near, far] });
    expect(r[0].hospitalId).toBe("cath");
    expect(r[1].reasons.some((x) => x.code === "MISSING_CAPABILITY")).toBe(true);
  });

  it("penalises unavailable resources and high load", () => {
    const ok = base({ id: "ok", capabilities: { CT: true }, resources: { ...base({}).resources, CT_STATUS: "AVAILABLE" } });
    const down = base({ id: "down", capabilities: { CT: true }, resources: { ...base({}).resources, CT_STATUS: "UNAVAILABLE" }, load: { incoming: 6, activeEd: 29, criticalIncoming: 3, avgHandoverMin: 30 } });
    const r = rankHospitals({ origin, priority: "P2", requiredCapabilities: ["CT"], hospitals: [down, ok] });
    expect(r[0].hospitalId).toBe("ok");
    expect(r.find((x) => x.hospitalId === "down")!.reasons.map((x) => x.code)).toEqual(expect.arrayContaining(["RESOURCE_UNAVAILABLE", "HIGH_LOAD"]));
  });

  it("returns bounded scores, ETA and alternatives for every hospital", () => {
    const r = rankHospitals({ origin, priority: "P3", requiredCapabilities: [], hospitals: [base({ id: "a" }), base({ id: "b", lat: 21.6 })] });
    expect(r).toHaveLength(2);
    r.forEach((h) => {
      expect(h.score).toBeGreaterThanOrEqual(0);
      expect(h.score).toBeLessThanOrEqual(100);
      expect(h.etaSeconds).toBeGreaterThanOrEqual(0);
    });
  });
});
