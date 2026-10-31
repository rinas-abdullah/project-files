/**
 * AI-Assisted Triage — DEMO decision support.
 *
 * A transparent, rule-based scoring engine (NEWS2-inspired early-warning
 * thresholds + complaint / mechanism modifiers + trend detection).
 * It is NOT a certified medical device and NOT a trained ML model.
 * Every output requires clinical confirmation or override by the paramedic.
 */
import type { VitalTypeKey } from "./vitals";

export const TRIAGE_ENGINE_VERSION = "vitalink-rules-1.3 (demo)";

export type PriorityKey = "P1" | "P2" | "P3" | "P4";

export type TriageVital = { type: VitalTypeKey; value: number; value2?: number | null; recordedAt: Date | string };

export type TriageInput = {
  vitals: TriageVital[];
  age?: number | null;
  chiefComplaint?: string | null;
  mechanism?: string | null;
  conditionTrend?: "STABLE" | "IMPROVING" | "DETERIORATING" | "CRITICAL" | null;
  conditionChanges?: number;
  now?: Date;
};

export type TriageFactor = { code: string; points: number; detail: string };

export type TriageResult = {
  suggestedPriority: PriorityKey;
  riskScore: number;
  confidence: number;
  totalPoints: number;
  factors: TriageFactor[];
  missingData: string[];
  engineVersion: string;
};

const STROKE_RX = /(stroke|facial droop|slurred|aphasia|hemipar|one[- ]sided weakness|weakness (left|right)|سكت|جلط)/i;
const CARDIAC_RX = /(chest pain|stemi|cardiac|angina|palpitation|myocard|ألم.*صدر|قلب)/i;
const ARREST_RX = /(cardiac arrest|unresponsive|unconscious|not breathing|غائب عن الوعي|فاقد الوعي)/i;
const SEIZURE_RX = /(seizure|convuls|تشنج)/i;
const BURN_RX = /(burn|حرق|حروق)/i;
const RESP_RX = /(shortness of breath|dyspn|asthma|respiratory distress|ضيق.*تنفس)/i;
const HIGH_ENERGY_RX =
  /(high[- ]speed|rollover|ejection|ejected|pedestrian|motorcycle|fall from height|fall >|penetrating|stab|gunshot|entrapment|head[- ]on|تصادم|دهس|سقوط من)/i;

function sorted(vitals: TriageVital[], type: VitalTypeKey) {
  return vitals
    .filter((v) => v.type === type)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
}

export function assessTriage(input: TriageInput): TriageResult {
  const factors: TriageFactor[] = [];
  const add = (code: string, points: number, detail: string) => factors.push({ code, points, detail });
  const now = input.now ?? new Date();

  const series = {
    hr: sorted(input.vitals, "HEART_RATE"),
    bp: sorted(input.vitals, "BLOOD_PRESSURE"),
    spo2: sorted(input.vitals, "SPO2"),
    rr: sorted(input.vitals, "RESPIRATORY_RATE"),
    gcs: sorted(input.vitals, "GCS"),
    temp: sorted(input.vitals, "TEMPERATURE"),
    glu: sorted(input.vitals, "BLOOD_GLUCOSE"),
  };
  const last = <T>(arr: T[]) => (arr.length ? arr[arr.length - 1] : undefined);
  const first = <T>(arr: T[]) => (arr.length ? arr[0] : undefined);

  let maxSingle = 0;
  const single = (code: string, pts: number, detail: string) => {
    if (pts > 0) add(code, pts, detail);
    maxSingle = Math.max(maxSingle, pts);
  };

  const spo2 = last(series.spo2)?.value;
  if (spo2 != null) {
    if (spo2 < 88) single("SPO2_CRITICAL", 3, `SpO2 ${spo2}% (< 88%)`);
    else if (spo2 < 92) single("SPO2_LOW", 2, `SpO2 ${spo2}% below 92% threshold`);
    else if (spo2 < 94) single("SPO2_BORDERLINE", 1, `SpO2 ${spo2}%`);
  }
  const sbp = last(series.bp)?.value;
  if (sbp != null) {
    if (sbp <= 90) single("SBP_CRITICAL", 3, `Systolic BP ${sbp} mmHg (≤ 90)`);
    else if (sbp <= 100) single("SBP_LOW", 2, `Systolic BP ${sbp} mmHg`);
    else if (sbp <= 110) single("SBP_BORDERLINE", 1, `Systolic BP ${sbp} mmHg`);
    else if (sbp >= 220) single("SBP_VERY_HIGH", 3, `Systolic BP ${sbp} mmHg (≥ 220)`);
    else if (sbp >= 180) single("SBP_HIGH", 1, `Systolic BP ${sbp} mmHg`);
  }
  const hr = last(series.hr)?.value;
  if (hr != null) {
    if (hr <= 40 || hr >= 131) single("HR_CRITICAL", 3, `Heart rate ${hr} bpm`);
    else if (hr >= 111) single("HR_HIGH", 2, `Heart rate ${hr} bpm`);
    else if (hr <= 50 || hr >= 91) single("HR_ABNORMAL", 1, `Heart rate ${hr} bpm`);
  }
  const rr = last(series.rr)?.value;
  if (rr != null) {
    if (rr <= 8 || rr >= 25) single("RR_CRITICAL", 3, `Respiratory rate ${rr}/min`);
    else if (rr >= 21) single("RR_HIGH", 2, `Respiratory rate ${rr}/min`);
    else if (rr <= 11) single("RR_LOW", 1, `Respiratory rate ${rr}/min`);
  }
  const gcs = last(series.gcs)?.value;
  if (gcs != null) {
    if (gcs <= 8) single("GCS_CRITICAL", 3, `GCS ${gcs} — reduced consciousness`);
    else if (gcs <= 13) single("GCS_REDUCED", 2, `GCS ${gcs} — reduced consciousness`);
    else if (gcs === 14) single("GCS_MILD", 1, `GCS ${gcs}`);
  }
  const temp = last(series.temp)?.value;
  if (temp != null) {
    if (temp <= 35) single("TEMP_LOW", 3, `Temperature ${temp}°C`);
    else if (temp >= 39.1) single("TEMP_HIGH", 2, `Temperature ${temp}°C`);
    else if (temp <= 36 || temp >= 38.1) single("TEMP_ABNORMAL", 1, `Temperature ${temp}°C`);
  }
  const glu = last(series.glu)?.value;
  if (glu != null && (glu < 60 || glu > 400)) single("GLUCOSE_CRITICAL", 2, `Blood glucose ${glu} mg/dL`);

  // Trends (first vs latest reading)
  const trend = (arr: TriageVital[]) => {
    const f = first(arr);
    const l = last(arr);
    return f && l && f !== l ? l.value - f.value : 0;
  };
  if (trend(series.bp) <= -20) add("FALLING_BP", 2, `Systolic BP fell ${Math.abs(trend(series.bp))} mmHg`);
  if (trend(series.spo2) <= -4) add("FALLING_SPO2", 2, `SpO2 fell ${Math.abs(trend(series.spo2))} points`);
  if (trend(series.gcs) <= -2) add("FALLING_GCS", 2, `GCS dropped ${Math.abs(trend(series.gcs))} points`);
  if (trend(series.hr) >= 25) add("RISING_HR", 1, `Heart rate rose ${trend(series.hr)} bpm`);

  const complaint = `${input.chiefComplaint ?? ""}`;
  const mechanism = `${input.mechanism ?? ""}`;
  const text = `${complaint} ${mechanism}`;
  const arrest = ARREST_RX.test(text);
  const stroke = STROKE_RX.test(text);
  const cardiac = CARDIAC_RX.test(text);
  if (arrest) add("UNRESPONSIVE", 3, "Unresponsive / possible arrest reported");
  if (stroke) add("STROKE_SIGNS", 3, "Stroke signs reported — time-critical pathway");
  if (cardiac) add("CARDIAC_COMPLAINT", 2, "High-risk cardiac complaint");
  if (SEIZURE_RX.test(text)) add("SEIZURE", 1, "Seizure reported");
  if (BURN_RX.test(text)) add("BURN", 1, "Burn injury");
  if (RESP_RX.test(text)) add("RESPIRATORY_COMPLAINT", 1, "Respiratory complaint");
  const highEnergy = HIGH_ENERGY_RX.test(mechanism) || HIGH_ENERGY_RX.test(complaint);
  if (highEnergy) add("HIGH_ENERGY_MECHANISM", 2, "High-energy injury mechanism");

  if (input.age != null) {
    if (input.age >= 65) add("AGE_OLDER", 1, `Age ${input.age}`);
    else if (input.age < 2) add("AGE_INFANT", 1, `Age ${input.age}`);
  }
  if (input.conditionTrend === "CRITICAL") add("CONDITION_CRITICAL", 3, "Condition reported critical");
  else if (input.conditionTrend === "DETERIORATING") add("CONDITION_DETERIORATING", 2, "Condition deteriorating");

  const total = factors.reduce((s, f) => s + f.points, 0);
  let priority: PriorityKey = total >= 10 ? "P1" : total >= 5 ? "P2" : total >= 2 ? "P3" : "P4";
  const raise = (min: PriorityKey) => {
    if (Number(priority.slice(1)) > Number(min.slice(1))) priority = min;
  };
  if (maxSingle >= 3) raise("P2");
  if (stroke || cardiac || highEnergy) raise("P2");
  if ((arrest && (gcs == null || gcs <= 8)) || (stroke && total >= 6) || (maxSingle >= 3 && total >= 8)) raise("P1");

  // Missing data & confidence
  const missing: string[] = [];
  if (hr == null) missing.push("HEART_RATE");
  if (sbp == null) missing.push("BLOOD_PRESSURE");
  if (spo2 == null) missing.push("SPO2");
  if (rr == null) missing.push("RESPIRATORY_RATE");
  if (gcs == null) missing.push("GCS");
  if (input.age == null) missing.push("AGE");
  if (!complaint.trim()) missing.push("CHIEF_COMPLAINT");
  const required = 7;
  const present = required - missing.length;
  const newest = input.vitals.reduce((m, v) => Math.max(m, new Date(v.recordedAt).getTime()), 0);
  const staleMin = newest ? (now.getTime() - newest) / 60000 : Infinity;
  let confidence = 50 + Math.round((40 * present) / required);
  if (staleMin > 15) confidence -= 10;
  if (input.vitals.length >= 10) confidence += 4;
  confidence = Math.max(20, Math.min(92, confidence));

  const riskScore = Math.min(100, Math.round(100 * (1 - Math.exp(-total / 7))));

  return {
    suggestedPriority: priority,
    riskScore,
    confidence,
    totalPoints: total,
    factors: factors.sort((a, b) => b.points - a.points),
    missingData: missing,
    engineVersion: TRIAGE_ENGINE_VERSION,
  };
}

/** Which capabilities a case likely needs, from complaint/mechanism/triage. */
export function requiredCapabilities(input: { chiefComplaint?: string | null; mechanism?: string | null; age?: number | null; priority?: PriorityKey }) {
  const text = `${input.chiefComplaint ?? ""} ${input.mechanism ?? ""}`;
  const req = new Set<string>();
  if (STROKE_RX.test(text)) ["STROKE", "CT", "NEUROLOGY"].forEach((c) => req.add(c));
  if (CARDIAC_RX.test(text) || ARREST_RX.test(text)) ["CATH_LAB", "CARDIOLOGY"].forEach((c) => req.add(c));
  if (HIGH_ENERGY_RX.test(text) || /(trauma|fracture|bleed|collision|crash|accident|حادث|نزيف|كسر)/i.test(text))
    ["TRAUMA_CENTER", "CT", "OPERATING_ROOM", "BLOOD_BANK"].forEach((c) => req.add(c));
  if (BURN_RX.test(text)) req.add("BURN_UNIT");
  if (/(isolation|infectious|tb|measles|عزل)/i.test(text)) req.add("ISOLATION");
  if (input.age != null && input.age < 14) req.add("PEDIATRIC");
  if (input.priority === "P1") req.add("ICU");
  return [...req];
}
