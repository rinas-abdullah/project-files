/** Vital sign definitions and classification (adult reference ranges, demo-grade). */

export type VitalTypeKey =
  | "HEART_RATE"
  | "BLOOD_PRESSURE"
  | "SPO2"
  | "RESPIRATORY_RATE"
  | "TEMPERATURE"
  | "GCS"
  | "BLOOD_GLUCOSE";

export type VitalStatusKey = "NORMAL" | "ABNORMAL" | "CRITICAL";

export const VITAL_DEFS: Record<VitalTypeKey, { unit: string; min: number; max: number; step: number }> = {
  HEART_RATE: { unit: "bpm", min: 0, max: 300, step: 1 },
  BLOOD_PRESSURE: { unit: "mmHg", min: 0, max: 300, step: 1 },
  SPO2: { unit: "%", min: 0, max: 100, step: 1 },
  RESPIRATORY_RATE: { unit: "/min", min: 0, max: 80, step: 1 },
  TEMPERATURE: { unit: "°C", min: 25, max: 45, step: 0.1 },
  GCS: { unit: "/15", min: 3, max: 15, step: 1 },
  BLOOD_GLUCOSE: { unit: "mg/dL", min: 10, max: 900, step: 1 },
};

export const VITAL_ORDER: VitalTypeKey[] = [
  "HEART_RATE",
  "BLOOD_PRESSURE",
  "SPO2",
  "RESPIRATORY_RATE",
  "TEMPERATURE",
  "GCS",
  "BLOOD_GLUCOSE",
];

export function classifyVital(type: VitalTypeKey, value: number, value2?: number | null): VitalStatusKey {
  switch (type) {
    case "HEART_RATE":
      if (value < 40 || value > 140) return "CRITICAL";
      if (value < 50 || value > 110) return "ABNORMAL";
      return "NORMAL";
    case "BLOOD_PRESSURE": {
      const sys = value;
      const dia = value2 ?? 0;
      if (sys < 90 || sys > 200 || dia > 120) return "CRITICAL";
      if (sys < 100 || sys > 160 || dia > 100) return "ABNORMAL";
      return "NORMAL";
    }
    case "SPO2":
      if (value < 90) return "CRITICAL";
      if (value < 94) return "ABNORMAL";
      return "NORMAL";
    case "RESPIRATORY_RATE":
      if (value < 8 || value > 30) return "CRITICAL";
      if (value < 12 || value > 22) return "ABNORMAL";
      return "NORMAL";
    case "TEMPERATURE":
      if (value < 35 || value > 39.5) return "CRITICAL";
      if (value < 36 || value > 38) return "ABNORMAL";
      return "NORMAL";
    case "GCS":
      if (value <= 8) return "CRITICAL";
      if (value < 15) return "ABNORMAL";
      return "NORMAL";
    case "BLOOD_GLUCOSE":
      if (value < 60 || value > 400) return "CRITICAL";
      if (value < 70 || value > 200) return "ABNORMAL";
      return "NORMAL";
  }
}

export function formatVital(type: VitalTypeKey, value: number, value2?: number | null): string {
  if (type === "BLOOD_PRESSURE") return `${Math.round(value)}/${Math.round(value2 ?? 0)}`;
  if (type === "TEMPERATURE") return value.toFixed(1);
  return String(Math.round(value));
}

export type VitalPoint = { type: VitalTypeKey; value: number; value2?: number | null; recordedAt: Date | string };

export function latestByType(points: VitalPoint[]): Partial<Record<VitalTypeKey, VitalPoint>> {
  const out: Partial<Record<VitalTypeKey, VitalPoint>> = {};
  for (const p of points) {
    const cur = out[p.type];
    if (!cur || new Date(p.recordedAt).getTime() >= new Date(cur.recordedAt).getTime()) out[p.type] = p;
  }
  return out;
}
