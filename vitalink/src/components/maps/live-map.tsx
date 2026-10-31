"use client";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import type { MapAmbulance, MapHospital, MapIncident } from "./leaflet-map";

const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-muted" />,
});

export type { MapAmbulance, MapHospital, MapIncident };

export function LiveMap({ className, ...props }: { className?: string; hospitals?: MapHospital[]; ambulances?: MapAmbulance[]; incidents?: MapIncident[]; showGeofence?: boolean; fitTo?: "all" | "highlight" }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl border", className)} data-testid="live-map">
      <LeafletMap className="h-full w-full" {...props} />
    </div>
  );
}
