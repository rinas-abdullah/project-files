/** Geographic helpers, ETA engine and route simulation (pure, unit-tested). */

export type LatLng = { lat: number; lng: number };

const R = 6371000;
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function bearing(a: LatLng, b: LatLng): number {
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function pathLength(points: LatLng[], from = 0): number {
  let d = 0;
  for (let i = Math.max(0, from); i < points.length - 1; i++) d += haversineMeters(points[i], points[i + 1]);
  return d;
}

// ───────────── Route providers ─────────────

export type RouteResult = {
  provider: string;
  points: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
};

/** Architecture hook: plug OSRM / Google / HERE / Mapbox here once credentials exist. */
export interface RouteProvider {
  readonly name: string;
  route(from: LatLng, to: LatLng, opts?: { emergency?: boolean }): Promise<RouteResult>;
}

/** Road-distance correction applied to straight-line distance in urban Jeddah. */
export const ROAD_FACTOR = 1.32;
/** Average emergency driving speed (lights & sirens), urban. */
export const EMERGENCY_SPEED_KMH = 58;
export const NORMAL_SPEED_KMH = 42;

/**
 * Builds a deterministic, road-like simulated route: an L-shaped Manhattan path
 * with a gentle jitter, densified to ~150 m steps so the ambulance moves smoothly.
 */
export function simulateRoute(from: LatLng, to: LatLng, stepMeters = 150): LatLng[] {
  const corner: LatLng = { lat: from.lat, lng: to.lng };
  const mid1: LatLng = { lat: (from.lat + corner.lat) / 2 + (to.lat - from.lat) * 0.08, lng: (from.lng + corner.lng) / 2 };
  const mid2: LatLng = { lat: (corner.lat + to.lat) / 2, lng: (corner.lng + to.lng) / 2 - (to.lng - from.lng) * 0.06 };
  const anchors = [from, mid1, corner, mid2, to];
  const out: LatLng[] = [from];
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];
    const seg = haversineMeters(a, b);
    const n = Math.max(1, Math.round(seg / stepMeters));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      out.push({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t });
    }
  }
  return out;
}

export class GeoEstimateRouteProvider implements RouteProvider {
  readonly name = "geo-estimate";
  async route(from: LatLng, to: LatLng, opts?: { emergency?: boolean }): Promise<RouteResult> {
    const points = simulateRoute(from, to);
    const distanceMeters = Math.round(pathLength(points));
    return {
      provider: this.name,
      points,
      distanceMeters,
      durationSeconds: estimateSeconds(distanceMeters, opts?.emergency ?? true),
    };
  }
}

/** ETA from remaining road distance. Includes a small fixed overhead for junctions / hospital entry. */
export function estimateSeconds(roadMeters: number, emergency = true): number {
  const kmh = emergency ? EMERGENCY_SPEED_KMH : NORMAL_SPEED_KMH;
  const base = roadMeters / ((kmh * 1000) / 3600);
  const overhead = roadMeters > 200 ? 45 : 0;
  return Math.max(0, Math.round(base + overhead));
}

/** Straight-line ETA estimate used when no route exists yet (e.g. for ranking hospitals). */
export function quickEtaSeconds(from: LatLng, to: LatLng, emergency = true): { distanceMeters: number; etaSeconds: number } {
  const distanceMeters = Math.round(haversineMeters(from, to) * ROAD_FACTOR);
  return { distanceMeters, etaSeconds: estimateSeconds(distanceMeters, emergency) };
}

/** Remaining ETA along a route, from a route index. */
export function remainingAlongRoute(points: LatLng[], index: number, emergency = true) {
  const distanceMeters = Math.round(pathLength(points, index));
  return { distanceMeters, etaSeconds: estimateSeconds(distanceMeters, emergency) };
}

// ───────────── Geofencing ─────────────

export type Phase = "EN_ROUTE" | "APPROACHING" | "ARRIVING" | "ARRIVED";

export type GeofenceConfig = { approachRadiusM: number; geofenceRadiusM: number; arrivalRadiusM: number };

const PHASE_ORDER: Phase[] = ["EN_ROUTE", "APPROACHING", "ARRIVING", "ARRIVED"];

/**
 * Phase from distance to the hospital. Phases never move backwards during a
 * transport (GPS jitter must not flip ARRIVING back to APPROACHING).
 */
export function geofencePhase(distanceMeters: number, cfg: GeofenceConfig, current: Phase = "EN_ROUTE"): Phase {
  let next: Phase = "EN_ROUTE";
  if (distanceMeters <= cfg.arrivalRadiusM) next = "ARRIVED";
  else if (distanceMeters <= cfg.geofenceRadiusM) next = "ARRIVING";
  else if (distanceMeters <= cfg.approachRadiusM) next = "APPROACHING";
  return PHASE_ORDER.indexOf(next) > PHASE_ORDER.indexOf(current) ? next : current;
}
