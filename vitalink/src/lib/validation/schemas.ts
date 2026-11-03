import { z } from "zod";

const id = z.string().min(1).max(64);
const text = (max: number) => z.string().trim().max(max);
const clientId = z.string().min(8).max(80).optional();

export const PRIORITY = z.enum(["P1", "P2", "P3", "P4"]);
export const SEX = z.enum(["MALE", "FEMALE", "UNKNOWN"]);
export const INCIDENT_TYPE = z.enum(["TRAFFIC_ACCIDENT", "MEDICAL_EMERGENCY", "CARDIAC", "STROKE", "TRAUMA", "FIRE", "MASS_CASUALTY", "OTHER"]);
export const VITAL_TYPE = z.enum(["HEART_RATE", "BLOOD_PRESSURE", "SPO2", "RESPIRATORY_RATE", "TEMPERATURE", "GCS", "BLOOD_GLUCOSE"]);
export const INTERVENTION_TYPE = z.enum(["OXYGEN", "IV_ACCESS", "AIRWAY", "ECG", "CPR", "IMMOBILIZATION", "BLEEDING_CONTROL", "DEFIBRILLATION", "OTHER"]);
export const MEDIA_CATEGORY = z.enum(["INJURY", "WOUND", "BURN", "SCENE", "MEDICAL_DOCUMENT", "OTHER"]);
export const CONDITION = z.enum(["STABLE", "IMPROVING", "DETERIORATING", "CRITICAL"]);
export const READINESS = z.enum(["NOT_STARTED", "REVIEWING", "PREPARING", "READY", "LIMITED", "RESOURCE_CONSTRAINT"]);
export const PREP_ITEM = z.enum(["TEAM_NOTIFIED", "BED_PREPARING", "TRAUMA_TEAM_ACTIVATED", "STROKE_TEAM_ACTIVATED", "CATH_LAB_ALERTED", "ISOLATION_REQUIRED", "SPECIALIST_REQUESTED", "BLOOD_BANK_ALERTED", "CT_PREPARATION", "OR_PREPARATION"]);
export const RESOURCE_TYPE = z.enum(["ED_CAPACITY", "AVAILABLE_BEDS", "ICU_BEDS", "TRAUMA_BAY", "CT_STATUS", "CATH_LAB", "OR_STATUS", "SPECIALISTS"]);
export const RESOURCE_STATUS = z.enum(["AVAILABLE", "LIMITED", "UNAVAILABLE", "UNKNOWN"]);
export const CAPABILITY = z.enum(["TRAUMA_CENTER", "STROKE", "CATH_LAB", "ICU", "PEDIATRIC", "BURN_UNIT", "CT", "MRI", "OPERATING_ROOM", "BLOOD_BANK", "ISOLATION", "CARDIOLOGY", "NEUROLOGY"]);
export const lat = z.number().min(-90).max(90);
export const lng = z.number().min(-180).max(180);

export const createMissionSchema = z.object({
  incidentType: INCIDENT_TYPE,
  address: text(200).min(2),
  description: text(1000).optional(),
  lat: lat.optional(),
  lng: lng.optional(),
  ambulanceId: id.optional(),
  incidentId: id.optional(),
  isMassCasualty: z.boolean().optional(),
});

export const createEncounterSchema = z
  .object({
    missionId: id,
    isUnknown: z.boolean(),
    fullName: text(120).optional(),
    temporaryName: text(120).optional(),
    age: z.number().int().min(0).max(120).optional(),
    ageEstimated: z.boolean().optional(),
    sex: SEX,
    nationalId: z.string().trim().regex(/^\d{10}$/, "National ID must be 10 digits").optional().or(z.literal("").transform(() => undefined)),
    phone: z.string().trim().regex(/^\+?\d{8,15}$/, "Invalid phone").optional().or(z.literal("").transform(() => undefined)),
    chiefComplaint: text(300).min(3),
    mechanism: text(300).optional(),
    priority: PRIORITY,
    notes: text(2000).optional(),
  })
  .refine((v) => v.isUnknown || (v.fullName && v.fullName.length >= 2), { message: "Name required when identity is known", path: ["fullName"] });

export const identifySchema = z.object({ nationalId: z.string().trim().min(5).max(20), method: z.enum(["NATIONAL_ID", "IQAMA", "BIOMETRIC_SIM", "NUSUK_CARD"]) });

export const vitalsSchema = z.object({
  vitals: z
    .array(
      z.object({
        type: VITAL_TYPE,
        value: z.number().finite(),
        value2: z.number().finite().nullable().optional(),
        recordedAt: z.string().datetime().optional(),
        clientId,
      }),
    )
    .min(1)
    .max(20),
});

export const interventionSchema = z.object({ type: INTERVENTION_TYPE, performedAt: z.string().datetime().optional(), notes: text(1000).optional(), clientId });
export const medicationSchema = z.object({ name: text(120).min(2), dose: text(60).min(1), route: text(40).min(1), administeredAt: z.string().datetime().optional(), notes: text(1000).optional(), clientId });
export const noteSchema = z.object({ text: text(4000).min(1), clientId });
export const conditionSchema = z.object({ trend: CONDITION, note: text(1000).optional(), clientId });
export const prioritySchema = z.object({ priority: PRIORITY, reason: text(500).optional(), clientId });
export const triageDecisionSchema = z.object({ decision: z.enum(["CONFIRM", "OVERRIDE"]), priority: PRIORITY.optional(), reason: text(500).optional() });
export const selectDestinationSchema = z.object({ hospitalId: id, recommendationId: id.optional() });
export const divertSchema = z.object({ hospitalId: id, reason: text(500).min(5), recommendationId: id.optional() });
export const recommendationDecisionSchema = z.object({ approve: z.boolean(), note: text(500).optional() });
export const ackSchema = z.object({ note: text(500).optional() });
export const preparationSchema = z.object({ item: PREP_ITEM, done: z.boolean() });
export const readinessSchema = z.object({ readiness: READINESS, note: text(500).optional() });
export const handoverSchema = z.object({ action: z.enum(["start", "accept", "complete"]), notes: text(2000).optional() });
export const monitorSchema = z.object({ action: z.enum(["start", "stop"]), scenario: z.enum(["STABLE", "DETERIORATING", "IMPROVING"]).optional() });
export const driveSchema = z.object({ action: z.enum(["start", "stop", "step", "geofence", "arrive"]), steps: z.number().int().min(1).max(50).optional() });
export const positionSchema = z.object({ lat, lng, speedKmh: z.number().min(0).max(250).optional() });
export const resourceSchema = z.object({ type: RESOURCE_TYPE, status: RESOURCE_STATUS, available: z.number().int().min(0).max(1000).nullable().optional(), total: z.number().int().min(0).max(1000).nullable().optional(), note: text(300).nullable().optional() });
export const capabilitySchema = z.object({ capability: CAPABILITY, available: z.boolean() });
export const alertActionSchema = z.object({ action: z.enum(["acknowledge", "resolve"]) });
export const cancelSchema = z.object({ reason: text(500).min(3) });
export const integrationSchema = z.object({ status: z.enum(["CONNECTED", "SANDBOX", "SIMULATED", "NOT_CONNECTED", "NOT_CONFIGURED"]) });
export const notificationsSchema = z.object({ all: z.boolean().optional(), ids: z.array(id).max(200).optional() });
