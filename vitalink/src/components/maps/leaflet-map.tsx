"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Fragment, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from "react-leaflet";

export type MapHospital = { id: string; name: string; lat: number; lng: number; geofenceRadiusM?: number; approachRadiusM?: number; highlight?: boolean; label?: string };
export type MapAmbulance = { id: string; callSign: string; lat: number; lng: number; status: string; heading?: number; route?: { lat: number; lng: number }[] | null; etaLabel?: string; highlight?: boolean; priority?: string | null };
export type MapIncident = { id: string; lat: number; lng: number; label: string };

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE: "#0d9488",
  DISPATCHED: "#d97706",
  ON_SCENE: "#2563eb",
  TRANSPORTING: "#dc2626",
  AT_HOSPITAL: "#0b1a33",
  OUT_OF_SERVICE: "#94a3b8",
};

function ambulanceIcon(a: MapAmbulance) {
  const color = STATUS_COLOR[a.status] ?? "#0b1a33";
  const ring = a.highlight ? "box-shadow:0 0 0 4px rgba(220,38,38,.25);" : "";
  return L.divIcon({
    className: "vl-marker",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    html: `<div style="width:34px;height:34px;border-radius:10px;background:${color};display:flex;align-items:center;justify-content:center;border:2px solid #fff;${ring}box-shadow:0 2px 6px rgba(0,0,0,.25)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10H6"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14"/><path d="M8 8v4"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
    </div><div style="position:absolute;top:34px;left:50%;transform:translateX(-50%);white-space:nowrap;font:600 10px/1.2 system-ui;background:#0b1a33;color:#fff;padding:1px 5px;border-radius:4px">${a.callSign}${a.etaLabel ? " · " + a.etaLabel : ""}</div>`,
  });
}

function hospitalIcon(h: MapHospital) {
  return L.divIcon({
    className: "vl-marker",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="width:30px;height:30px;border-radius:8px;background:${h.highlight ? "#dc2626" : "#0b1a33"};color:#fff;display:flex;align-items:center;justify-content:center;font:800 15px system-ui;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25)">H</div><div style="position:absolute;top:31px;left:50%;transform:translateX(-50%);white-space:nowrap;font:600 10px/1.2 system-ui;background:#fff;color:#0b1a33;padding:1px 5px;border-radius:4px;border:1px solid #e1e6ee">${h.label ?? h.name}</div>`,
  });
}

const incidentIcon = L.divIcon({
  className: "vl-marker",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html: `<div style="width:22px;height:22px;transform:rotate(45deg);background:#f59e0b;border:2px solid #fff;border-radius:4px;box-shadow:0 2px 5px rgba(0,0,0,.3)"></div>`,
});

function FitOnce({ points }: { points: [number, number][] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || points.length === 0) return;
    done.current = true;
    if (points.length === 1) map.setView(points[0], 13);
    else map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 14 });
  }, [map, points]);
  return null;
}

export default function LeafletMap({
  hospitals = [],
  ambulances = [],
  incidents = [],
  showGeofence = false,
  fitTo = "all",
  className,
}: {
  hospitals?: MapHospital[];
  ambulances?: MapAmbulance[];
  incidents?: MapIncident[];
  showGeofence?: boolean;
  fitTo?: "all" | "highlight";
  className?: string;
}) {
  const fitPoints = useMemo(() => {
    const pts: [number, number][] = [];
    const hs = fitTo === "highlight" ? hospitals.filter((h) => h.highlight) : hospitals;
    const as = fitTo === "highlight" ? ambulances.filter((a) => a.highlight) : ambulances;
    hs.forEach((h) => pts.push([h.lat, h.lng]));
    as.forEach((a) => pts.push([a.lat, a.lng]));
    if (!pts.length) hospitals.forEach((h) => pts.push([h.lat, h.lng]));
    return pts;
  }, [hospitals, ambulances, fitTo]);

  return (
    <MapContainer center={[21.55, 39.18]} zoom={12} scrollWheelZoom className={className} style={{ background: "#dfe6ee" }} attributionControl>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitOnce points={fitPoints} />
      {hospitals.map((h) => (
        <Fragment key={h.id}>
          {showGeofence && h.geofenceRadiusM ? <Circle center={[h.lat, h.lng]} radius={h.geofenceRadiusM} pathOptions={{ color: "#dc2626", weight: 1.5, fillOpacity: 0.06, dashArray: "4 4" }} /> : null}
          {showGeofence && h.approachRadiusM && h.highlight ? <Circle center={[h.lat, h.lng]} radius={h.approachRadiusM} pathOptions={{ color: "#2563eb", weight: 1, fillOpacity: 0.02, dashArray: "2 6" }} /> : null}
          <Marker position={[h.lat, h.lng]} icon={hospitalIcon(h)}>
            <Popup>{h.name}</Popup>
          </Marker>
        </Fragment>
      ))}
      {ambulances.map((a) => (
        <Fragment key={a.id}>
          {a.route && a.route.length > 1 ? <Polyline positions={a.route.map((p) => [p.lat, p.lng] as [number, number])} pathOptions={{ color: a.highlight ? "#dc2626" : "#1b3461", weight: a.highlight ? 5 : 3, opacity: 0.75 }} /> : null}
          <Marker position={[a.lat, a.lng]} icon={ambulanceIcon(a)} zIndexOffset={a.highlight ? 1000 : 500}>
            <Popup>
              <strong>{a.callSign}</strong>
              {a.etaLabel ? ` · ${a.etaLabel}` : ""}
            </Popup>
          </Marker>
        </Fragment>
      ))}
      {incidents.map((i) => (
        <Marker key={i.id} position={[i.lat, i.lng]} icon={incidentIcon}>
          <Popup>{i.label}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
