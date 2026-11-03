/**
 * Smart Destination — DEMO decision support.
 * Ranks receiving hospitals using distance/ETA, capabilities, live resource
 * availability, current emergency load, required specialty and priority.
 * Output must be approved by EMS Dispatch / an authorized user before a
 * destination change takes effect.
 */
import { quickEtaSeconds, type LatLng } from "./geo";
import type { PriorityKey } from "./triage";

export const DESTINATION_ENGINE_VERSION = "vitalink-dest-1.2 (demo)";

export type ResourceStatusKey = "AVAILABLE" | "LIMITED" | "UNAVAILABLE" | "UNKNOWN";

export type HospitalLoad = {
  incoming: number;
  activeEd: number;
  criticalIncoming: number;
  avgHandoverMin: number | null;
};

export type HospitalCandidate = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  edCapacity: number;
  capabilities: Record<string, boolean>;
  resources: Record<string, ResourceStatusKey>;
  load: HospitalLoad;
};

export type Reason = { code: string; params?: Record<string, string | number>; positive: boolean };

export type RankedHospital = {
  hospitalId: string;
  name: string;
  score: number;
  etaSeconds: number;
  distanceMeters: number;
  breakdown: { capability: number; eta: number; resources: number; load: number; penalty: number };
  reasons: Reason[];
};

const CAP_TO_RESOURCE: Record<string, string> = {
  CT: "CT_STATUS",
  CATH_LAB: "CATH_LAB",
  OPERATING_ROOM: "OR_STATUS",
  ICU: "ICU_BEDS",
  TRAUMA_CENTER: "TRAUMA_BAY",
};

/** Resource statuses older than this are treated as UNKNOWN: a "bed available" from hours ago must not attract critical patients. */
export const RESOURCE_STALE_MINUTES = 240;

/**
 * Freshness guard for manually reported resources. AVAILABLE/LIMITED decay to UNKNOWN when stale;
 * UNAVAILABLE is kept, because assuming a resource came back is the unsafe direction.
 */
export function freshStatus(status: ResourceStatusKey, updatedAt: Date, now: Date = new Date(), maxMinutes = RESOURCE_STALE_MINUTES): ResourceStatusKey {
  if (status === "UNAVAILABLE" || status === "UNKNOWN") return status;
  return now.getTime() - updatedAt.getTime() > maxMinutes * 60_000 ? "UNKNOWN" : status;
}

const resScore = (s: ResourceStatusKey | undefined): number =>
  s === "AVAILABLE" ? 1 : s === "LIMITED" ? 0.5 : s === "UNAVAILABLE" ? 0 : 0.4;

export function rankHospitals(params: {
  origin: LatLng;
  priority: PriorityKey;
  requiredCapabilities: string[];
  hospitals: HospitalCandidate[];
}): RankedHospital[] {
  const { origin, priority, requiredCapabilities: req, hospitals } = params;
  const etaWeight = priority === "P1" ? 34 : priority === "P2" ? 30 : 24;
  const capWeight = 35;
  const resWeight = 20;
  const loadWeight = 100 - etaWeight - capWeight - resWeight;

  const ranked = hospitals.map((h): RankedHospital => {
    const reasons: Reason[] = [];
    const { distanceMeters, etaSeconds } = quickEtaSeconds(origin, h);
    const etaMin = etaSeconds / 60;

    // Capabilities
    const matched = req.filter((c) => h.capabilities[c]);
    const missing = req.filter((c) => !h.capabilities[c]);
    const capability = req.length ? (capWeight * matched.length) / req.length : capWeight;
    matched.forEach((c) => reasons.push({ code: "CAPABILITY", params: { cap: c }, positive: true }));
    missing.forEach((c) => reasons.push({ code: "MISSING_CAPABILITY", params: { cap: c }, positive: false }));

    // ETA
    const eta = etaWeight * Math.max(0, Math.min(1, 1 - (etaMin - 4) / 26));
    reasons.unshift({ code: "ETA", params: { min: Math.max(1, Math.round(etaMin)) }, positive: etaMin <= 12 });

    // Resources relevant to this case
    const relevant = new Set(["ED_CAPACITY", "AVAILABLE_BEDS", "SPECIALISTS"]);
    req.forEach((c) => CAP_TO_RESOURCE[c] && relevant.add(CAP_TO_RESOURCE[c]));
    const scores = [...relevant].map((r) => resScore(h.resources[r]));
    const resources = (resWeight * scores.reduce((a, b) => a + b, 0)) / scores.length;
    for (const r of relevant) {
      const s = h.resources[r];
      if (s === "AVAILABLE" && r !== "ED_CAPACITY" && r !== "AVAILABLE_BEDS" && r !== "SPECIALISTS")
        reasons.push({ code: "RESOURCE_AVAILABLE", params: { res: r }, positive: true });
      if (s === "UNAVAILABLE") reasons.push({ code: "RESOURCE_UNAVAILABLE", params: { res: r }, positive: false });
      if (s === "LIMITED") reasons.push({ code: "RESOURCE_LIMITED", params: { res: r }, positive: false });
      if (s === "UNKNOWN" && r !== "ED_CAPACITY" && r !== "AVAILABLE_BEDS" && r !== "SPECIALISTS")
        reasons.push({ code: "RESOURCE_UNKNOWN", params: { res: r }, positive: false });
    }

    // Load
    const ratio = (h.load.activeEd + h.load.incoming * 1.5 + h.load.criticalIncoming * 2) / Math.max(1, h.edCapacity);
    const load = loadWeight * (1 - Math.max(0, Math.min(1, ratio)));
    if (ratio < 0.5) reasons.push({ code: "LOW_LOAD", params: { pct: Math.round(ratio * 100) }, positive: true });
    else if (ratio > 0.85) reasons.push({ code: "HIGH_LOAD", params: { pct: Math.round(ratio * 100) }, positive: false });

    // Hard penalties: a missing required capability is a serious mismatch for time-critical pathways.
    let penalty = missing.length * 8;
    for (const c of req) {
      const r = CAP_TO_RESOURCE[c];
      if (r && h.capabilities[c] && h.resources[r] === "UNAVAILABLE") penalty += 6;
    }

    const score = Math.max(0, Math.min(100, Math.round(capability + eta + resources + load - penalty)));
    return {
      hospitalId: h.id,
      name: h.name,
      score,
      etaSeconds,
      distanceMeters,
      breakdown: {
        capability: Math.round(capability),
        eta: Math.round(eta),
        resources: Math.round(resources),
        load: Math.round(load),
        penalty: Math.round(penalty),
      },
      reasons,
    };
  });

  return ranked.sort((a, b) => b.score - a.score || a.etaSeconds - b.etaSeconds);
}
