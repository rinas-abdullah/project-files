/** Clinical data completeness per encounter (8 equally-weighted elements). */
export type CompletenessInput = {
  identityKnown: boolean;
  chiefComplaint: string | null | undefined;
  vitalTypes: string[];
  interventions: number;
  medications: number;
  etaKnown: boolean;
  destinationSet: boolean;
  handoverCompleted: boolean;
};

export const COMPLETENESS_ITEMS = [
  "identity",
  "chiefComplaint",
  "vitals",
  "interventions",
  "medications",
  "eta",
  "destination",
  "handover",
] as const;

export type CompletenessItem = (typeof COMPLETENESS_ITEMS)[number];

export function completeness(i: CompletenessInput): { score: number; items: Record<CompletenessItem, boolean> } {
  const coreVitals = ["HEART_RATE", "BLOOD_PRESSURE", "SPO2"];
  const items: Record<CompletenessItem, boolean> = {
    identity: i.identityKnown,
    chiefComplaint: !!i.chiefComplaint && i.chiefComplaint.trim().length >= 3,
    vitals: coreVitals.every((v) => i.vitalTypes.includes(v)),
    interventions: i.interventions > 0,
    medications: i.medications > 0,
    eta: i.etaKnown,
    destination: i.destinationSet,
    handover: i.handoverCompleted,
  };
  const done = Object.values(items).filter(Boolean).length;
  return { score: Math.round((done / COMPLETENESS_ITEMS.length) * 100), items };
}
