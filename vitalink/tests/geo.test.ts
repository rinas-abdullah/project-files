import { describe, expect, it } from "vitest";
import { geofencePhase, haversineMeters, remainingAlongRoute, simulateRoute, quickEtaSeconds } from "@/lib/engines/geo";
import { completeness } from "@/lib/engines/completeness";
import { classifyVital } from "@/lib/engines/vitals";

describe("ETA engine & geofencing", () => {
  const a = { lat: 21.595, lng: 39.15 };
  const b = { lat: 21.5433, lng: 39.1728 };

  it("computes plausible distances", () => {
    const d = haversineMeters(a, b);
    expect(d).toBeGreaterThan(5500);
    expect(d).toBeLessThan(7000);
  });

  it("simulated route ends at destination and ETA decreases along it", () => {
    const route = simulateRoute(a, b);
    expect(route[0]).toEqual(a);
    expect(haversineMeters(route[route.length - 1], b)).toBeLessThan(1);
    const start = remainingAlongRoute(route, 0);
    const mid = remainingAlongRoute(route, Math.floor(route.length / 2));
    const end = remainingAlongRoute(route, route.length - 1);
    expect(start.etaSeconds).toBeGreaterThan(mid.etaSeconds);
    expect(end.etaSeconds).toBe(0);
    expect(quickEtaSeconds(a, b).etaSeconds).toBeGreaterThan(300);
  });

  it("geofence phases advance and never go backwards", () => {
    const cfg = { approachRadiusM: 3000, geofenceRadiusM: 600, arrivalRadiusM: 80 };
    expect(geofencePhase(5000, cfg)).toBe("EN_ROUTE");
    expect(geofencePhase(2500, cfg)).toBe("APPROACHING");
    expect(geofencePhase(500, cfg, "APPROACHING")).toBe("ARRIVING");
    expect(geofencePhase(50, cfg, "ARRIVING")).toBe("ARRIVED");
    expect(geofencePhase(900, cfg, "ARRIVING")).toBe("ARRIVING"); // GPS jitter
  });
});

describe("data completeness & vitals", () => {
  it("scores 8 equally-weighted elements", () => {
    const c = completeness({ identityKnown: true, chiefComplaint: "Chest pain", vitalTypes: ["HEART_RATE", "BLOOD_PRESSURE", "SPO2"], interventions: 1, medications: 0, etaKnown: true, destinationSet: true, handoverCompleted: false });
    expect(c.score).toBe(75);
    expect(c.items.medications).toBe(false);
  });
  it("classifies vitals", () => {
    expect(classifyVital("SPO2", 86)).toBe("CRITICAL");
    expect(classifyVital("SPO2", 93)).toBe("ABNORMAL");
    expect(classifyVital("BLOOD_PRESSURE", 85, 50)).toBe("CRITICAL");
    expect(classifyVital("HEART_RATE", 75)).toBe("NORMAL");
    expect(classifyVital("GCS", 7)).toBe("CRITICAL");
  });
});
