import "server-only";
import { GeoEstimateRouteProvider, estimateSeconds, type LatLng, type RouteProvider, type RouteResult } from "@/lib/engines/geo";
import { integrationStatus } from "./registry";

/**
 * OSRM-compatible route provider. Enabled only when ROUTING_OSRM_URL is set and
 * the ROUTING integration is CONNECTED/SANDBOX. Falls back to the geographic estimate.
 */
export class OsrmRouteProvider implements RouteProvider {
  readonly name = "osrm";
  constructor(private baseUrl: string) {}
  async route(from: LatLng, to: LatLng, opts?: { emergency?: boolean }): Promise<RouteResult> {
    const url = `${this.baseUrl.replace(/\/$/, "")}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const json = (await res.json()) as { routes?: { distance: number; geometry: { coordinates: [number, number][] } }[] };
    const r = json.routes?.[0];
    if (!r) throw new Error("OSRM: no route");
    const points = r.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
    return { provider: this.name, points, distanceMeters: Math.round(r.distance), durationSeconds: estimateSeconds(r.distance, opts?.emergency ?? true) };
  }
}

export async function getRouteProvider(): Promise<RouteProvider> {
  const status = await integrationStatus("ROUTING");
  if ((status === "CONNECTED" || status === "SANDBOX") && process.env.ROUTING_OSRM_URL) {
    const osrm = new OsrmRouteProvider(process.env.ROUTING_OSRM_URL);
    const fallback = new GeoEstimateRouteProvider();
    return {
      name: "osrm+fallback",
      async route(from, to, opts) {
        try {
          return await osrm.route(from, to, opts);
        } catch {
          return fallback.route(from, to, opts);
        }
      },
    };
  }
  return new GeoEstimateRouteProvider();
}
