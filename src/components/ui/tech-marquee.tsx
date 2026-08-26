"use client";
import { Marquee } from "@/components/ui/marquee";

const techItems = [
  { label: "Pressure Sensing", sublabel: "14-Zone Array" },
  { label: "Thermal Mapping", sublabel: "Infrared Grid" },
  { label: "IMU Motion", sublabel: "6-DOF Tracking" },
  { label: "BLE 5.0", sublabel: "Encrypted Sync" },
  { label: "Edge AI", sublabel: "On-Device Inference" },
  { label: "Energy Harvesting", sublabel: "Piezoelectric" },
  { label: "Cloud Analytics", sublabel: "Real-time Pipeline" },
  { label: "Digital Twin", sublabel: "Patient Model" },
  { label: "FDA-Class II", sublabel: "Medical Grade" },
  { label: "ISO 13485", sublabel: "Quality System" },
];

export function TechMarquee() {
  return (
    <div className="relative w-full overflow-hidden py-6 bg-linear-to-r from-transparent via-white/50 to-transparent border-y border-black/5">
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-linear-to-r from-white to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-linear-to-l from-white to-transparent z-10" />
      <Marquee pauseOnHover className="[--duration:30s]">
        {techItems.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 mx-6 px-5 py-2.5 rounded-full bg-white border border-black/5 shadow-sm hover:border-primary-blue/20 hover:shadow-md transition-all duration-300 cursor-default"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary-blue/40" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-dark-text font-sans leading-none">{item.label}</span>
              <span className="text-[10px] text-muted-text font-sans leading-none mt-0.5">{item.sublabel}</span>
            </div>
          </div>
        ))}
      </Marquee>
    </div>
  );
}
