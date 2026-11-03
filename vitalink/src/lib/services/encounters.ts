import "server-only";
import { randomBytes } from "node:crypto";
import type {
  ConditionTrend,
  IncidentType,
  InterventionType,
  MediaCategory,
  Prisma,
  Priority,
  PrepItem,
  ReadinessStatus,
  Sex,
  VitalSource,
  VitalType,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { encrypt, last4, lookupHash } from "@/lib/crypto";
import { audit } from "@/lib/audit";
import { classifyVital, VITAL_DEFS, type VitalTypeKey } from "@/lib/engines/vitals";
import { assessTriage, requiredCapabilities, type PriorityKey } from "@/lib/engines/triage";
import { rankHospitals, freshStatus, RESOURCE_STALE_MINUTES, DESTINATION_ENGINE_VERSION, type HospitalCandidate, type ResourceStatusKey } from "@/lib/engines/destination";
import { getIdentityAdapter, type IdentityMethod } from "@/lib/integrations/identity";
import { getHealthRecordAdapter } from "@/lib/integrations/health-record";
import { IntegrationUnavailableError, recordIntegrationResult } from "@/lib/integrations/registry";
import {
  ApiError,
  SYSTEM,
  actorId,
  actorName,
  auditActor,
  emit,
  emitEncounter,
  isSystem,
  notifyEms,
  notifyHospital,
  notifyRoles,
  patientLabel,
  raiseAlert,
  refreshCompleteness,
  resolveAlerts,
  scopedEncounter,
  timeline,
  type Actor,
} from "./core";
import { planRoute } from "./movement";

const ACTIVE_STATUSES = ["CREATED", "ACTIVE", "PRE_ALERT_SENT", "ACKNOWLEDGED", "PREPARING", "APPROACHING", "ARRIVED", "HANDOVER", "DIVERTED"] as const;
export const OPEN_ENCOUNTER_STATUSES = [...ACTIVE_STATUSES];

function shortId(n = 4) {
  return randomBytes(8).toString("hex").toUpperCase().slice(0, n);
}
function datePart(d = new Date()) {
  return `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}
export const newCode = (prefix: string) => `${prefix}-${datePart()}-${shortId(5)}`;

function requireUserActor(actor: Actor) {
  if (isSystem(actor)) throw new ApiError(403, "FORBIDDEN");
  return actor;
}

/** Encounters that are finished can no longer receive clinical documentation. */
function assertOpen(status: string) {
  if (status === "COMPLETED" || status === "CANCELLED") throw new ApiError(409, "ENCOUNTER_CLOSED");
}

// ───────────────────────────── Missions & encounters ─────────────────────────────

export async function createMission(
  actor: Actor,
  input: { incidentType: IncidentType; address: string; description?: string; lat?: number; lng?: number; ambulanceId?: string; incidentId?: string; isMassCasualty?: boolean },
) {
  const user = requireUserActor(actor);
  const ambulanceId = user.role === "PARAMEDIC" ? user.ambulanceId : input.ambulanceId;
  if (!ambulanceId) throw new ApiError(400, "NO_AMBULANCE");
  const ambulance = await prisma.ambulance.findUnique({ where: { id: ambulanceId } });
  if (!ambulance) throw new ApiError(404, "NOT_FOUND");
  if (user.orgType === "EMS" && ambulance.organizationId !== user.organizationId) throw new ApiError(404, "NOT_FOUND");
  if (ambulance.status !== "AVAILABLE") throw new ApiError(409, "AMBULANCE_BUSY");

  const selfStarted = user.role === "PARAMEDIC";
  const lat = input.lat ?? ambulance.lat;
  const lng = input.lng ?? ambulance.lng;

  const result = await prisma.$transaction(async (tx) => {
    const incident = input.incidentId
      ? await tx.incident.findFirstOrThrow({ where: { id: input.incidentId, organizationId: ambulance.organizationId, status: "OPEN" } })
      : await tx.incident.create({
          data: {
            code: newCode("INC"),
            organizationId: ambulance.organizationId,
            type: input.incidentType,
            address: input.address,
            description: input.description,
            lat,
            lng,
            isMassCasualty: input.isMassCasualty ?? input.incidentType === "MASS_CASUALTY",
            createdById: user.id,
          },
        });
    const mission = await tx.ambulanceMission.create({
      data: {
        code: newCode("MSN"),
        incidentId: incident.id,
        ambulanceId,
        status: selfStarted ? "ON_SCENE" : "DISPATCHED",
        onSceneAt: selfStarted ? new Date() : null,
        leadUserId: selfStarted ? user.id : null,
      },
    });
    await tx.ambulance.update({
      where: { id: ambulanceId },
      data: { status: selfStarted ? "ON_SCENE" : "DISPATCHED", ...(selfStarted ? { lat, lng } : {}) },
    });
    return { incident, mission };
  });
  await audit(auditActor(actor), "mission.created", "AmbulanceMission", result.mission.id, undefined, {
    incident: result.incident.code,
    ambulance: ambulance.callSign,
  });
  await emit({ t: "mission", o: [ambulance.organizationId], a: ambulanceId });
  if (!selfStarted) {
    await prisma.user
      .findMany({ where: { ambulanceId, active: true }, select: { id: true } })
      .then((crew) =>
        crew.length
          ? prisma.notification.createMany({
              data: crew.map((c) => ({ userId: c.id, type: "NEW_CASE" as const, title: "MISSION_ASSIGNED", body: `${result.incident.code} · ${input.address}`, link: "/paramedic" })),
            })
          : null,
      );
    await emit({ t: "notify", a: ambulanceId });
  }
  return result;
}

export async function markOnScene(actor: Actor, missionId: string) {
  const user = requireUserActor(actor);
  const mission = await prisma.ambulanceMission.findUnique({ where: { id: missionId }, include: { incident: true, ambulance: true } });
  if (!mission || (user.role === "PARAMEDIC" && mission.ambulanceId !== user.ambulanceId)) throw new ApiError(404, "NOT_FOUND");
  if (mission.status !== "DISPATCHED") throw new ApiError(409, "INVALID_STATE");
  await prisma.$transaction([
    prisma.ambulanceMission.update({ where: { id: missionId }, data: { status: "ON_SCENE", onSceneAt: new Date(), leadUserId: user.id } }),
    prisma.ambulance.update({
      where: { id: mission.ambulanceId },
      data: { status: "ON_SCENE", lat: mission.incident.lat, lng: mission.incident.lng, lastPositionAt: new Date(), speedKmh: 0 },
    }),
  ]);
  await audit(auditActor(actor), "mission.on_scene", "AmbulanceMission", missionId);
  await emit({ t: "mission", o: [mission.ambulance.organizationId], a: mission.ambulanceId });
}

async function nextUnknownId(sex: Sex) {
  const prefix = `UNKNOWN-${sex === "UNKNOWN" ? "PATIENT" : sex}-`;
  const rows = await prisma.$queryRaw<{ n: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING("temporaryId" FROM '([0-9]+)$') AS INTEGER)) AS n FROM "Patient" WHERE "temporaryId" LIKE 'UNKNOWN-%'`;
  const n = (rows[0]?.n ?? 480) + 1;
  return `${prefix}${String(n).padStart(5, "0")}`;
}

export type CreateEncounterInput = {
  missionId: string;
  isUnknown: boolean;
  fullName?: string;
  temporaryName?: string;
  age?: number;
  ageEstimated?: boolean;
  sex: Sex;
  nationalId?: string;
  phone?: string;
  chiefComplaint: string;
  mechanism?: string;
  priority: Priority;
  notes?: string;
};

export async function createEncounter(actor: Actor, input: CreateEncounterInput) {
  const user = requireUserActor(actor);
  const mission = await prisma.ambulanceMission.findUnique({ where: { id: input.missionId }, include: { ambulance: true } });
  if (!mission) throw new ApiError(404, "NOT_FOUND");
  if (user.role === "PARAMEDIC" && mission.ambulanceId !== user.ambulanceId) throw new ApiError(404, "NOT_FOUND");
  if (["COMPLETED", "CANCELLED"].includes(mission.status)) throw new ApiError(409, "MISSION_CLOSED");

  const isUnknown = input.isUnknown || !input.fullName?.trim();
  const temporaryId = isUnknown ? await nextUnknownId(input.sex) : null;
  const nid = input.nationalId?.replace(/\D/g, "") || undefined;

  // If a national ID is supplied and already known, re-use that patient record.
  let patientId: string | null = null;
  if (nid) {
    const existing = await prisma.patient.findUnique({ where: { nationalIdHash: lookupHash(nid) } });
    if (existing) patientId = existing.id;
  }

  const enc = await prisma.$transaction(async (tx) => {
    if (!patientId) {
      const p = await tx.patient.create({
        data: {
          isUnknown,
          temporaryId: temporaryId ?? (input.temporaryName ? `TMP-${shortId(6)}` : null),
          fullName: isUnknown ? (input.temporaryName?.trim() || null) : input.fullName!.trim(),
          sex: input.sex,
          age: input.age,
          ageEstimated: input.ageEstimated ?? isUnknown,
          nationalIdEnc: nid ? encrypt(nid) : null,
          nationalIdHash: nid ? lookupHash(nid) : null,
          nationalIdLast4: nid ? last4(nid) : null,
          phoneEnc: input.phone ? encrypt(input.phone) : null,
          phoneLast4: input.phone ? last4(input.phone) : null,
        },
      });
      patientId = p.id;
    }
    const e = await tx.patientEncounter.create({
      data: {
        code: newCode("ENC"),
        patientId: patientId!,
        missionId: mission.id,
        incidentId: mission.incidentId,
        status: "ACTIVE",
        priority: input.priority,
        chiefComplaint: input.chiefComplaint.trim(),
        mechanism: input.mechanism?.trim() || null,
        notes: input.notes?.trim() || null,
        createdById: user.id,
      },
    });
    if (mission.status === "DISPATCHED") {
      await tx.ambulanceMission.update({ where: { id: mission.id }, data: { status: "ON_SCENE", onSceneAt: new Date() } });
      await tx.ambulance.update({ where: { id: mission.ambulanceId }, data: { status: "ON_SCENE" } });
    }
    return e;
  });

  await timeline(enc.id, "CASE_CREATED", actor, {
    code: enc.code,
    priority: input.priority,
    unknown: isUnknown,
    temporaryId,
    ambulance: mission.ambulance.callSign,
  });
  await refreshCompleteness(enc.id);
  await audit(auditActor(actor), "encounter.created", "PatientEncounter", enc.id, undefined, {
    code: enc.code,
    unknown: isUnknown,
    temporaryId,
    priority: input.priority,
  });
  await emitEncounter(enc.id, "encounter");
  return enc;
}

// ───────────────────────────── Identity & health record ─────────────────────────────

export async function identifyPatient(actor: Actor, encounterId: string, input: { nationalId: string; method: IdentityMethod }) {
  const enc = await scopedEncounter(actor, encounterId);
  assertOpen(enc.status);
  const nid = input.nationalId.replace(/\D/g, "");
  const before = { patientId: enc.patientId, isUnknown: enc.patient.isUnknown, temporaryId: enc.patient.temporaryId };

  let adapter;
  try {
    adapter = await getIdentityAdapter();
  } catch (e) {
    if (e instanceof IntegrationUnavailableError) throw new ApiError(503, "INTEGRATION_NOT_CONNECTED", e.message);
    throw e;
  }
  const result = await adapter.verify({ nationalId: nid, method: input.method, requestedBy: actorName(actor) });
  await recordIntegrationResult("NAFATH", result.status === "FAILED" ? result.message : undefined);

  if (result.status === "FAILED") {
    await prisma.patientIdentity.create({
      data: { patientId: enc.patientId, provider: result.provider, method: input.method, status: "FAILED", confidence: 0, message: result.message, performedById: actorId(actor) },
    });
    await audit(auditActor(actor), "identity.verification_failed", "Patient", enc.patientId, undefined, { reason: result.message, last4: last4(nid) });
    await emitEncounter(encounterId, "identity");
    return { status: "FAILED" as const, message: result.message };
  }

  const hash = lookupHash(nid);
  const existing = await prisma.patient.findUnique({ where: { nationalIdHash: hash } });
  let patientId = enc.patientId;
  let matched = false;
  if (existing && existing.id !== enc.patientId) {
    // Temporary emergency identity matched to an existing patient record.
    matched = true;
    patientId = existing.id;
    await prisma.$transaction([
      prisma.patientEncounter.update({ where: { id: encounterId }, data: { patientId: existing.id } }),
      prisma.patient.update({ where: { id: enc.patientId }, data: { mergedIntoId: existing.id } }),
      prisma.patient.update({
        where: { id: existing.id },
        data: { isUnknown: false, fullName: result.fullName ?? existing.fullName, sex: result.sex ?? existing.sex, age: existing.age ?? result.age, ageEstimated: false },
      }),
    ]);
  } else {
    await prisma.patient.update({
      where: { id: enc.patientId },
      data: {
        isUnknown: false,
        fullName: result.fullName,
        sex: result.sex ?? enc.patient.sex,
        age: result.age ?? enc.patient.age,
        ageEstimated: false,
        nationalIdEnc: encrypt(nid),
        nationalIdHash: hash,
        nationalIdLast4: last4(nid),
      },
    });
  }
  await prisma.patientIdentity.create({
    data: {
      patientId,
      provider: result.provider,
      method: input.method,
      status: "VERIFIED",
      confidence: result.confidence,
      externalRef: result.externalRef,
      message: result.message,
      performedById: actorId(actor),
    },
  });
  await timeline(encounterId, matched ? "IDENTITY_MATCHED" : "IDENTITY_DETECTED", actor, {
    provider: result.provider,
    method: input.method,
    temporaryId: enc.patient.temporaryId,
    last4: last4(nid),
    confidence: result.confidence,
  });
  await audit(auditActor(actor), "identity.updated", "Patient", patientId, before, {
    patientId,
    isUnknown: false,
    matched,
    provider: result.provider,
    last4: last4(nid),
  });

  // Health record retrieval (only when the integration is usable).
  let health: "RETRIEVED" | "NOT_CONNECTED" = "NOT_CONNECTED";
  try {
    const hr = await getHealthRecordAdapter();
    const profile = await hr.fetchProfile({ nationalId: nid });
    const data = {
      source: profile.source,
      bloodType: profile.bloodType,
      allergies: profile.allergies,
      chronicConditions: profile.chronicConditions,
      medicalAlerts: profile.medicalAlerts,
      medicationHistory: profile.medicationHistory,
      criticalDiagnoses: profile.criticalDiagnoses,
      fetchedAt: new Date(),
    };
    await prisma.healthProfile.upsert({ where: { patientId }, create: { patientId, ...data }, update: data });
    await recordIntegrationResult("NPHIES");
    await timeline(encounterId, "HEALTH_RECORD_RETRIEVED", SYSTEM, {
      source: profile.source,
      allergies: profile.allergies.length,
      alerts: profile.medicalAlerts.length,
    });
    health = "RETRIEVED";
  } catch (e) {
    if (!(e instanceof IntegrationUnavailableError)) throw e;
  }

  await refreshCompleteness(encounterId);
  await emitEncounter(encounterId, "identity");
  return { status: "VERIFIED" as const, matched, health, fullName: result.fullName };
}

// ───────────────────────────── Clinical documentation ─────────────────────────────

export type VitalInput = { type: VitalType; value: number; value2?: number | null; recordedAt?: string | Date; clientId?: string };

export async function addVitals(actor: Actor, encounterId: string, vitals: VitalInput[], source: VitalSource = "MANUAL") {
  const enc = await scopedEncounter(actor, encounterId);
  assertOpen(enc.status);
  const created = [];
  for (const v of vitals) {
    const def = VITAL_DEFS[v.type as VitalTypeKey];
    if (v.value < def.min || v.value > def.max) throw new ApiError(422, "VITAL_OUT_OF_RANGE", `${v.type} out of range`);
    if (v.type === "BLOOD_PRESSURE" && (v.value2 == null || v.value2 <= 0 || v.value2 >= v.value)) throw new ApiError(422, "INVALID_BP");
    if (v.clientId) {
      const dup = await prisma.vitalSign.findUnique({ where: { clientId: v.clientId } });
      if (dup) {
        created.push(dup);
        continue;
      }
    }
    created.push(
      await prisma.vitalSign.create({
        data: {
          encounterId,
          clientId: v.clientId,
          type: v.type,
          value: v.value,
          value2: v.type === "BLOOD_PRESSURE" ? v.value2 : null,
          unit: def.unit,
          recordedAt: v.recordedAt ? new Date(v.recordedAt) : new Date(),
          source,
          status: classifyVital(v.type as VitalTypeKey, v.value, v.value2),
          recordedById: actorId(actor),
        },
      }),
    );
  }
  if (source === "MANUAL") {
    await timeline(encounterId, "VITALS_RECORDED", actor, {
      count: created.length,
      values: created.map((v) => ({ type: v.type, value: v.value, value2: v.value2, status: v.status })),
    });
    await audit(auditActor(actor), "vital.added", "PatientEncounter", encounterId, undefined, { count: created.length });
  }
  await evaluateVitalAlerts(encounterId);
  await refreshCompleteness(encounterId);
  await emitEncounter(encounterId, "vital", {
    latest: created.map((v) => ({ type: v.type, value: v.value, value2: v.value2, status: v.status })),
  });
  return created;
}

/** Alert Engine — vital-sign rules evaluated after every new reading. */
export async function evaluateVitalAlerts(encounterId: string) {
  const enc = await prisma.patientEncounter.findUnique({
    where: { id: encounterId },
    include: { mission: true, patient: true },
  });
  if (!enc) return;
  const since = new Date(Date.now() - 45 * 60_000);
  const vitals = await prisma.vitalSign.findMany({
    where: { encounterId, recordedAt: { gte: since }, type: { in: ["SPO2", "BLOOD_PRESSURE", "HEART_RATE", "GCS"] } },
    orderBy: { recordedAt: "asc" },
  });
  const series = (t: VitalType) => vitals.filter((v) => v.type === t);
  const last = <T,>(a: T[]) => a[a.length - 1];
  const label = patientLabel(enc.patient);
  const base = { encounterId, hospitalId: enc.destinationHospitalId, ambulanceId: enc.mission.ambulanceId };

  const spo2 = last(series("SPO2"));
  if (spo2 && spo2.value < 90) {
    await raiseAlert({ ...base, type: "LOW_SPO2", severity: "CRITICAL", message: `${label} · SpO2 ${spo2.value}%`, dedupeKey: `LOW_SPO2:${encounterId}`, data: { value: spo2.value } });
  } else if (spo2 && spo2.value >= 92) {
    await resolveAlerts({ dedupeKey: `LOW_SPO2:${encounterId}` });
  }

  const bp = series("BLOOD_PRESSURE");
  if (bp.length >= 2) {
    const window = bp.slice(-6);
    const drop = Math.max(...window.map((v) => v.value)) - last(window).value;
    if (drop >= 20 || last(window).value < 90) {
      await raiseAlert({ ...base, type: "FALLING_BP", severity: last(window).value < 90 ? "CRITICAL" : "WARNING", message: `${label} · SBP ${last(window).value} (−${Math.round(drop)})`, dedupeKey: `FALLING_BP:${encounterId}`, data: { value: last(window).value, drop } });
    }
  }
  const hr = last(series("HEART_RATE"));
  if (hr && (hr.value > 140 || hr.value < 40)) {
    await raiseAlert({ ...base, type: "ABNORMAL_HEART_RATE", severity: "CRITICAL", message: `${label} · HR ${hr.value}`, dedupeKey: `HR:${encounterId}` });
  }
  const gcs = series("GCS");
  const criticalCount = [spo2 && spo2.value < 88, bp.length && last(bp).value < 90, hr && (hr.value > 140 || hr.value < 40), gcs.length && last(gcs).value <= 8].filter(Boolean).length;
  if (criticalCount >= 2) {
    const created = await raiseAlert({ ...base, type: "CRITICAL_DETERIORATION", severity: "CRITICAL", message: `${label} · ${criticalCount} critical parameters`, dedupeKey: `DETERIORATION:${encounterId}` });
    if (created && enc.destinationHospitalId) {
      await notifyHospital(enc.destinationHospitalId, { type: "CRITICAL_UPDATE", title: "CRITICAL_DETERIORATION", body: `${enc.code} · ${label}`, link: `/cases/${encounterId}`, encounterId });
    }
    if (enc.conditionTrend !== "CRITICAL" && enc.conditionTrend !== "DETERIORATING") {
      await prisma.patientEncounter.update({ where: { id: encounterId }, data: { conditionTrend: "DETERIORATING" } });
      await timeline(encounterId, "CONDITION_CHANGED", SYSTEM, { from: enc.conditionTrend, to: "DETERIORATING", auto: true });
    }
  }
}

export async function addIntervention(actor: Actor, encounterId: string, input: { type: InterventionType; performedAt?: string; notes?: string; clientId?: string }) {
  const enc = await scopedEncounter(actor, encounterId);
  assertOpen(enc.status);
  if (input.clientId) {
    const dup = await prisma.intervention.findUnique({ where: { clientId: input.clientId } });
    if (dup) return dup;
  }
  const row = await prisma.intervention.create({
    data: {
      encounterId,
      clientId: input.clientId,
      type: input.type,
      performedAt: input.performedAt ? new Date(input.performedAt) : new Date(),
      performedById: actorId(actor),
      performedBy: actorName(actor),
      notes: input.notes,
    },
  });
  await timeline(encounterId, "INTERVENTION_PERFORMED", actor, { type: input.type, notes: input.notes });
  await audit(auditActor(actor), "intervention.added", "PatientEncounter", encounterId, undefined, { type: input.type });
  await refreshCompleteness(encounterId);
  await emitEncounter(encounterId, "intervention");
  return row;
}

export async function addMedication(
  actor: Actor,
  encounterId: string,
  input: { name: string; dose: string; route: string; administeredAt?: string; notes?: string; clientId?: string },
) {
  const enc = await scopedEncounter(actor, encounterId);
  assertOpen(enc.status);
  if (input.clientId) {
    const dup = await prisma.medication.findUnique({ where: { clientId: input.clientId } });
    if (dup) return dup;
  }
  const row = await prisma.medication.create({
    data: {
      encounterId,
      clientId: input.clientId,
      name: input.name,
      dose: input.dose,
      route: input.route,
      administeredAt: input.administeredAt ? new Date(input.administeredAt) : new Date(),
      administeredById: actorId(actor),
      administeredBy: actorName(actor),
      notes: input.notes,
    },
  });
  // Allergy cross-check against the retrieved health profile.
  const profile = await prisma.healthProfile.findUnique({ where: { patientId: enc.patientId } });
  const allergies = (profile?.allergies as string[] | undefined) ?? [];
  const conflict = allergies.find((a) => input.name.toLowerCase().includes(a.toLowerCase().split(" ")[0]));
  await timeline(encounterId, "MEDICATION_GIVEN", actor, { name: input.name, dose: input.dose, route: input.route, allergyConflict: conflict ?? null });
  if (conflict) {
    await raiseAlert({
      type: "CRITICAL_DETERIORATION",
      severity: "CRITICAL",
      message: `${enc.code} · ${input.name} — documented allergy: ${conflict}`,
      encounterId,
      hospitalId: enc.destinationHospitalId,
      ambulanceId: enc.mission.ambulanceId,
      dedupeKey: `ALLERGY:${encounterId}:${input.name.toLowerCase()}`,
    });
  }
  await audit(auditActor(actor), "medication.added", "PatientEncounter", encounterId, undefined, { name: input.name, dose: input.dose });
  await refreshCompleteness(encounterId);
  await emitEncounter(encounterId, "medication");
  return { ...row, allergyConflict: conflict ?? null };
}

export async function addNote(actor: Actor, encounterId: string, input: { text: string; clientId?: string }) {
  const enc = await scopedEncounter(actor, encounterId);
  assertOpen(enc.status);
  if (input.clientId) {
    const dup = await prisma.clinicalEvent.findUnique({ where: { clientId: input.clientId } });
    if (dup) return dup;
  }
  const ev = await timeline(encounterId, "CLINICAL_NOTE", actor, { text: input.text }, { clientId: input.clientId });
  await audit(auditActor(actor), "note.added", "PatientEncounter", encounterId);
  await emitEncounter(encounterId, "note");
  return ev;
}

export async function updateCondition(actor: Actor, encounterId: string, input: { trend: ConditionTrend; note?: string; clientId?: string }) {
  const enc = await scopedEncounter(actor, encounterId);
  assertOpen(enc.status);
  if (enc.conditionTrend === input.trend && !input.note) return enc;
  await prisma.patientEncounter.update({ where: { id: encounterId }, data: { conditionTrend: input.trend } });
  await timeline(encounterId, "CONDITION_CHANGED", actor, { from: enc.conditionTrend, to: input.trend, note: input.note }, { clientId: input.clientId });
  await audit(auditActor(actor), "condition.changed", "PatientEncounter", encounterId, { trend: enc.conditionTrend }, { trend: input.trend });
  if (input.trend === "DETERIORATING" || input.trend === "CRITICAL") {
    await raiseAlert({
      type: "CRITICAL_DETERIORATION",
      severity: input.trend === "CRITICAL" ? "CRITICAL" : "WARNING",
      message: `${enc.code} · ${patientLabel(enc.patient)} · ${input.trend}`,
      encounterId,
      hospitalId: enc.destinationHospitalId,
      ambulanceId: enc.mission.ambulanceId,
      dedupeKey: `CONDITION:${encounterId}`,
    });
    if (enc.destinationHospitalId)
      await notifyHospital(enc.destinationHospitalId, { type: "CRITICAL_UPDATE", title: "CONDITION_CHANGED", body: `${enc.code} · ${input.trend}`, link: `/cases/${encounterId}`, encounterId });
  }
  await emitEncounter(encounterId, "condition");
}

export async function changePriority(actor: Actor, encounterId: string, input: { priority: Priority; reason?: string }) {
  const enc = await scopedEncounter(actor, encounterId);
  assertOpen(enc.status);
  if (enc.priority === input.priority) return;
  await prisma.patientEncounter.update({ where: { id: encounterId }, data: { priority: input.priority } });
  await timeline(encounterId, "PRIORITY_CHANGED", actor, { from: enc.priority, to: input.priority, reason: input.reason });
  await audit(auditActor(actor), "priority.changed", "PatientEncounter", encounterId, { priority: enc.priority }, { priority: input.priority, reason: input.reason });
  if (enc.destinationHospitalId)
    await notifyHospital(enc.destinationHospitalId, { type: "CRITICAL_UPDATE", title: "PRIORITY_CHANGED", body: `${enc.code} · ${enc.priority} → ${input.priority}`, link: `/cases/${encounterId}`, encounterId });
  await emitEncounter(encounterId, "priority", { priority: input.priority });
}

export async function cancelEncounter(actor: Actor, encounterId: string, reason: string) {
  const enc = await scopedEncounter(actor, encounterId);
  assertOpen(enc.status);
  await prisma.patientEncounter.update({ where: { id: encounterId }, data: { status: "CANCELLED", closedAt: new Date() } });
  await timeline(encounterId, "CASE_CANCELLED", actor, { reason });
  await resolveAlerts({ encounterId });
  await audit(auditActor(actor), "encounter.cancelled", "PatientEncounter", encounterId, { status: enc.status }, { status: "CANCELLED", reason });
  await emitEncounter(encounterId, "encounter");
}

// ───────────────────────────── Media ─────────────────────────────

export async function recordMedia(
  actor: Actor,
  encounterId: string,
  m: { kind: "IMAGE" | "VIDEO"; category: MediaCategory; mimeType: string; sizeBytes: number; storageKey: string; originalName?: string; caption?: string },
) {
  const row = await prisma.mediaAttachment.create({
    data: { encounterId, ...m, uploadedById: actorId(actor), uploadedBy: actorName(actor) },
  });
  await timeline(encounterId, "PHOTO_UPLOADED", actor, { kind: m.kind, category: m.category, mediaId: row.id });
  await audit(auditActor(actor), "media.uploaded", "MediaAttachment", row.id, undefined, { encounterId, category: m.category, kind: m.kind });
  await emitEncounter(encounterId, "media");
  return row;
}

// ───────────────────────────── AI-assisted triage ─────────────────────────────

export async function runTriage(actor: Actor, encounterId: string) {
  const enc = await scopedEncounter(actor, encounterId);
  assertOpen(enc.status);
  const [vitals, conditionChanges] = await Promise.all([
    prisma.vitalSign.findMany({ where: { encounterId }, orderBy: { recordedAt: "asc" } }),
    prisma.clinicalEvent.count({ where: { encounterId, type: "CONDITION_CHANGED" } }),
  ]);
  const result = assessTriage({
    vitals: vitals.map((v) => ({ type: v.type as VitalTypeKey, value: v.value, value2: v.value2, recordedAt: v.recordedAt })),
    age: enc.patient.age,
    chiefComplaint: enc.chiefComplaint,
    mechanism: enc.mechanism,
    conditionTrend: enc.conditionTrend,
    conditionChanges,
  });
  const row = await prisma.triageAssessment.create({
    data: {
      encounterId,
      suggestedPriority: result.suggestedPriority,
      riskScore: result.riskScore,
      confidence: result.confidence,
      factors: result.factors,
      missingData: result.missingData,
      inputs: { vitals: vitals.length, age: enc.patient.age, chiefComplaint: enc.chiefComplaint, mechanism: enc.mechanism, conditionTrend: enc.conditionTrend, conditionChanges, currentPriority: enc.priority },
      engineVersion: result.engineVersion,
    },
  });
  await timeline(encounterId, "TRIAGE_ASSESSED", actor, { suggested: result.suggestedPriority, risk: result.riskScore, confidence: result.confidence, current: enc.priority });
  if (result.suggestedPriority !== enc.priority) {
    await raiseAlert({
      type: "TRIAGE_PRIORITY_CHANGED",
      severity: result.suggestedPriority < enc.priority ? "WARNING" : "INFO",
      message: `${enc.code} · ${enc.priority} → ${result.suggestedPriority} (AI-assisted, pending confirmation)`,
      encounterId,
      hospitalId: enc.destinationHospitalId,
      ambulanceId: enc.mission.ambulanceId,
      dedupeKey: `TRIAGE:${row.id}`,
    });
  }
  await audit(auditActor(actor), "triage.assessed", "TriageAssessment", row.id, undefined, { suggested: result.suggestedPriority, risk: result.riskScore });
  await emitEncounter(encounterId, "triage");
  return row;
}

export async function decideTriage(actor: Actor, assessmentId: string, input: { decision: "CONFIRM" | "OVERRIDE"; priority?: Priority; reason?: string }) {
  const user = requireUserActor(actor);
  const a = await prisma.triageAssessment.findUnique({ where: { id: assessmentId } });
  if (!a) throw new ApiError(404, "NOT_FOUND");
  const enc = await scopedEncounter(actor, a.encounterId);
  assertOpen(enc.status);
  if (a.decision !== "PENDING") throw new ApiError(409, "ALREADY_DECIDED");
  if (input.decision === "OVERRIDE" && (!input.priority || !input.reason || input.reason.trim().length < 5))
    throw new ApiError(422, "OVERRIDE_REASON_REQUIRED");
  const finalPriority = input.decision === "CONFIRM" ? a.suggestedPriority : input.priority!;
  await prisma.triageAssessment.update({
    where: { id: assessmentId },
    data: {
      decision: input.decision === "CONFIRM" ? "CONFIRMED" : "OVERRIDDEN",
      finalPriority,
      overrideReason: input.decision === "OVERRIDE" ? input.reason!.trim() : null,
      decidedById: user.id,
      decidedByName: user.name,
      decidedAt: new Date(),
    },
  });
  await timeline(a.encounterId, "TRIAGE_DECIDED", actor, { decision: input.decision, suggested: a.suggestedPriority, final: finalPriority, reason: input.reason });
  await audit(auditActor(actor), "triage.changed", "TriageAssessment", assessmentId, { priority: enc.priority, decision: "PENDING" }, { priority: finalPriority, decision: input.decision, reason: input.reason });
  await resolveAlerts({ dedupeKey: `TRIAGE:${assessmentId}` });
  if (finalPriority !== enc.priority) {
    await prisma.patientEncounter.update({ where: { id: a.encounterId }, data: { priority: finalPriority } });
    await timeline(a.encounterId, "PRIORITY_CHANGED", actor, { from: enc.priority, to: finalPriority, via: "triage" });
    if (enc.destinationHospitalId)
      await notifyHospital(enc.destinationHospitalId, { type: "CRITICAL_UPDATE", title: "PRIORITY_CHANGED", body: `${enc.code} · ${enc.priority} → ${finalPriority}`, link: `/cases/${a.encounterId}`, encounterId: a.encounterId });
  }
  await emitEncounter(a.encounterId, "triage");
}

// ───────────────────────────── Hospital load & smart destination ─────────────────────────────

export async function hospitalLoads(): Promise<Record<string, { incoming: number; activeEd: number; criticalIncoming: number; avgHandoverMin: number | null }>> {
  const hospitals = await prisma.hospital.findMany({ select: { id: true } });
  const out: Record<string, { incoming: number; activeEd: number; criticalIncoming: number; avgHandoverMin: number | null }> = {};
  const since = new Date(Date.now() - 30 * 86400_000);
  const [incoming, critical, atEd, handovers] = await Promise.all([
    prisma.patientEncounter.groupBy({ by: ["destinationHospitalId"], where: { status: { in: ["PRE_ALERT_SENT", "ACKNOWLEDGED", "PREPARING", "APPROACHING", "DIVERTED"] } }, _count: true }),
    prisma.patientEncounter.groupBy({ by: ["destinationHospitalId"], where: { priority: "P1", status: { in: ["PRE_ALERT_SENT", "ACKNOWLEDGED", "PREPARING", "APPROACHING", "DIVERTED"] } }, _count: true }),
    prisma.patientEncounter.groupBy({ by: ["destinationHospitalId"], where: { status: { in: ["ARRIVED", "HANDOVER"] } }, _count: true }),
    prisma.handover.findMany({ where: { completedAt: { not: null }, startedAt: { gte: since } }, select: { hospitalId: true, startedAt: true, completedAt: true } }),
  ]);
  const occupancy = await prisma.hospitalResource.findMany({ where: { type: "ED_CAPACITY" } });
  for (const h of hospitals) {
    const hs = handovers.filter((x) => x.hospitalId === h.id);
    const occ = occupancy.find((o) => o.hospitalId === h.id);
    const edOccupied = occ?.total != null && occ.available != null ? occ.total - occ.available : 0;
    out[h.id] = {
      incoming: incoming.find((x) => x.destinationHospitalId === h.id)?._count ?? 0,
      criticalIncoming: critical.find((x) => x.destinationHospitalId === h.id)?._count ?? 0,
      activeEd: edOccupied + (atEd.find((x) => x.destinationHospitalId === h.id)?._count ?? 0),
      avgHandoverMin: hs.length ? Math.round((hs.reduce((s, x) => s + (x.completedAt!.getTime() - x.startedAt.getTime()), 0) / hs.length / 60000) * 10) / 10 : null,
    };
  }
  return out;
}

export async function hospitalCandidates(): Promise<HospitalCandidate[]> {
  const [hospitals, loads] = await Promise.all([
    prisma.hospital.findMany({ where: { active: true }, include: { capabilities: true, resources: true } }),
    hospitalLoads(),
  ]);
  const now = new Date();
  const staleMinutes = Number(process.env.RESOURCE_STALE_MINUTES) || RESOURCE_STALE_MINUTES;
  return hospitals.map((h) => ({
    id: h.id,
    name: h.name,
    lat: h.lat,
    lng: h.lng,
    edCapacity: h.edCapacity,
    capabilities: Object.fromEntries(h.capabilities.map((c) => [c.capability, c.available])),
    resources: Object.fromEntries(h.resources.map((r) => [r.type, freshStatus(r.status as ResourceStatusKey, r.updatedAt, now, staleMinutes)])),
    load: loads[h.id],
  }));
}

export async function recommendDestination(actor: Actor, encounterId: string) {
  const enc = await scopedEncounter(actor, encounterId);
  assertOpen(enc.status);
  const required = requiredCapabilities({ chiefComplaint: enc.chiefComplaint, mechanism: enc.mechanism, age: enc.patient.age, priority: enc.priority as PriorityKey });
  const ranking = rankHospitals({
    origin: { lat: enc.mission.ambulance.lat, lng: enc.mission.ambulance.lng },
    priority: enc.priority as PriorityKey,
    requiredCapabilities: required,
    hospitals: await hospitalCandidates(),
  });
  const top = ranking[0];
  await prisma.destinationRecommendation.updateMany({ where: { encounterId, status: "PENDING" }, data: { status: "SUPERSEDED" } });
  const rec = await prisma.destinationRecommendation.create({
    data: {
      encounterId,
      recommendedHospitalId: top.hospitalId,
      score: top.score,
      requiredCapabilities: required,
      ranking: ranking as unknown as Prisma.InputJsonValue,
      engineVersion: DESTINATION_ENGINE_VERSION,
      requestedById: actorId(actor),
      requestedByName: actorName(actor),
    },
  });
  await timeline(encounterId, "DESTINATION_RECOMMENDED", actor, { hospital: top.name, score: top.score, required });
  await audit(auditActor(actor), "destination.recommended", "DestinationRecommendation", rec.id, undefined, { hospital: top.name, score: top.score });
  // A recommendation that differs from an already-notified destination needs dispatch approval.
  if (enc.destinationHospitalId && enc.destinationHospitalId !== top.hospitalId) {
    await notifyEms(encounterId, { type: "DESTINATION_RECOMMENDATION", title: "DESTINATION_RECOMMENDATION", body: `${enc.code} → ${top.name} (${top.score}%)`, link: `/dispatch?rec=${rec.id}` }, { dispatch: true, crew: false });
  }
  await emitEncounter(encounterId, "recommendation");
  return rec;
}

/** Initial destination selection by the crew (before the hospital has been notified). */
export async function selectDestination(actor: Actor, encounterId: string, input: { hospitalId: string; recommendationId?: string }) {
  const enc = await scopedEncounter(actor, encounterId);
  assertOpen(enc.status);
  if (enc.destinationHospitalId && enc.preAlertSentAt) throw new ApiError(409, "DESTINATION_LOCKED_REQUIRES_DISPATCH");
  const hospital = await prisma.hospital.findUnique({ where: { id: input.hospitalId } });
  if (!hospital) throw new ApiError(404, "NOT_FOUND");
  await prisma.$transaction([
    prisma.destination.updateMany({ where: { encounterId, active: true }, data: { active: false, endedAt: new Date() } }),
    prisma.destination.create({ data: { encounterId, hospitalId: hospital.id, source: input.recommendationId ? "RECOMMENDATION" : "MANUAL", selectedById: actorId(actor) } }),
    prisma.patientEncounter.update({ where: { id: encounterId }, data: { destinationHospitalId: hospital.id } }),
  ]);
  if (input.recommendationId) {
    await prisma.destinationRecommendation.updateMany({
      where: { id: input.recommendationId, encounterId, status: "PENDING" },
      data: { status: hospital.id ? "APPROVED" : "REJECTED", decidedById: actorId(actor), decidedByName: actorName(actor), decidedAt: new Date(), decisionNote: "Initial destination selected by crew" },
    });
  }
  await planRoute(enc.missionId, hospital.id);
  await timeline(encounterId, "DESTINATION_SELECTED", actor, { hospital: hospital.name, source: input.recommendationId ? "RECOMMENDATION" : "MANUAL" });
  await audit(auditActor(actor), "destination.selected", "PatientEncounter", encounterId, { hospitalId: enc.destinationHospitalId }, { hospitalId: hospital.id });
  await refreshCompleteness(encounterId);
  await emitEncounter(encounterId, "destination");
}

/** Destination change (diversion) — EMS Dispatch / authorized users only. */
export async function changeDestination(actor: Actor, encounterId: string, input: { hospitalId: string; reason: string; recommendationId?: string }) {
  const user = requireUserActor(actor);
  const enc = await scopedEncounter(actor, encounterId);
  assertOpen(enc.status);
  if (["ARRIVED", "HANDOVER"].includes(enc.status)) throw new ApiError(409, "ALREADY_ARRIVED");
  if (enc.destinationHospitalId === input.hospitalId) throw new ApiError(409, "SAME_DESTINATION");
  const to = await prisma.hospital.findUnique({ where: { id: input.hospitalId } });
  if (!to) throw new ApiError(404, "NOT_FOUND");
  const fromId = enc.destinationHospitalId;
  const notified = !!enc.preAlertSentAt;

  await prisma.$transaction([
    prisma.destination.updateMany({ where: { encounterId, active: true }, data: { active: false, endedAt: new Date() } }),
    prisma.destination.create({ data: { encounterId, hospitalId: to.id, source: "DIVERSION", selectedById: user.id } }),
    prisma.destinationHistory.create({
      data: { encounterId, fromHospitalId: fromId, toHospitalId: to.id, reason: input.reason, changedById: user.id, changedByName: user.name, changedByRole: user.role },
    }),
    prisma.patientEncounter.update({
      where: { id: encounterId },
      data: {
        destinationHospitalId: to.id,
        readinessStatus: "NOT_STARTED",
        status: notified ? "DIVERTED" : enc.status,
        acknowledgedAt: null,
        approachingAt: null,
        geofenceEnteredAt: null,
        registrationStatus: "NOT_STARTED",
        registrationRef: null,
      },
    }),
  ]);
  if (input.recommendationId) {
    await prisma.destinationRecommendation.update({
      where: { id: input.recommendationId },
      data: { status: "APPROVED", decidedById: user.id, decidedByName: user.name, decidedAt: new Date(), decisionNote: input.reason },
    });
  }
  await planRoute(enc.missionId, to.id);
  await timeline(encounterId, "DESTINATION_CHANGED", actor, { from: enc.destinationHospital?.name ?? null, to: to.name, reason: input.reason });
  await audit(auditActor(actor), "destination.changed", "PatientEncounter", encounterId, { hospitalId: fromId }, { hospitalId: to.id, reason: input.reason });
  await raiseAlert({
    type: "DESTINATION_CHANGE",
    severity: "WARNING",
    message: `${enc.code} · ${enc.destinationHospital?.name ?? "—"} → ${to.name}`,
    encounterId,
    hospitalId: to.id,
    ambulanceId: enc.mission.ambulanceId,
  });
  await resolveAlerts({ encounterId, type: { in: ["NO_HOSPITAL_ACK", "ETA_UNDER_5", "GEOFENCE_ENTERED"] } });
  if (fromId) {
    await notifyHospital(fromId, { type: "DESTINATION_CHANGED", title: "CASE_DIVERTED", body: `${enc.code} → ${to.name}`, link: `/cases/${encounterId}`, encounterId });
  }
  if (notified) {
    await notifyHospital(to.id, { type: "NEW_CASE", title: "DIVERTED_CASE_INCOMING", body: `${enc.code} · ${enc.priority} · ${enc.chiefComplaint}`, link: `/cases/${encounterId}`, encounterId });
  }
  await notifyEms(encounterId, { type: "DESTINATION_CHANGED", title: "DESTINATION_CHANGED", body: `${enc.code} → ${to.name}`, link: `/paramedic/${encounterId}` }, { crew: true, dispatch: false });
  await refreshCompleteness(encounterId);
  await emitEncounter(encounterId, "destination");
}

export async function decideRecommendation(actor: Actor, recommendationId: string, input: { approve: boolean; note?: string }) {
  const user = requireUserActor(actor);
  const rec = await prisma.destinationRecommendation.findUnique({ where: { id: recommendationId }, include: { recommendedHospital: true } });
  if (!rec) throw new ApiError(404, "NOT_FOUND");
  const enc = await scopedEncounter(actor, rec.encounterId);
  if (rec.status !== "PENDING") throw new ApiError(409, "ALREADY_DECIDED");
  if (!input.approve) {
    await prisma.destinationRecommendation.update({ where: { id: rec.id }, data: { status: "REJECTED", decidedById: user.id, decidedByName: user.name, decidedAt: new Date(), decisionNote: input.note } });
    await audit(auditActor(actor), "destination.recommendation_rejected", "DestinationRecommendation", rec.id, undefined, { note: input.note });
    await emitEncounter(rec.encounterId, "recommendation");
    return;
  }
  if (!enc.destinationHospitalId || !enc.preAlertSentAt) {
    await selectDestination(actor, rec.encounterId, { hospitalId: rec.recommendedHospitalId, recommendationId: rec.id });
  } else if (enc.destinationHospitalId !== rec.recommendedHospitalId) {
    await changeDestination(actor, rec.encounterId, {
      hospitalId: rec.recommendedHospitalId,
      reason: input.note?.trim() || `Smart Destination recommendation approved (score ${Math.round(rec.score)}%)`,
      recommendationId: rec.id,
    });
  } else {
    await prisma.destinationRecommendation.update({ where: { id: rec.id }, data: { status: "APPROVED", decidedById: user.id, decidedByName: user.name, decidedAt: new Date(), decisionNote: input.note } });
    await emitEncounter(rec.encounterId, "recommendation");
  }
}

// ───────────────────────────── Pre-arrival alert ─────────────────────────────

export async function sendPreAlert(actor: Actor, encounterId: string) {
  const enc = await scopedEncounter(actor, encounterId);
  assertOpen(enc.status);
  if (!enc.destinationHospitalId) throw new ApiError(409, "NO_DESTINATION");
  const first = !enc.preAlertSentAt;
  await prisma.patientEncounter.update({
    where: { id: encounterId },
    data: {
      status: ["CREATED", "ACTIVE"].includes(enc.status) ? "PRE_ALERT_SENT" : enc.status,
      preAlertSentAt: enc.preAlertSentAt ?? new Date(),
      preAlertDelivery: "PENDING",
    },
  });
  let delivered = 0;
  try {
    delivered = await notifyHospital(enc.destinationHospitalId, {
      type: enc.priority === "P1" ? "CRITICAL_UPDATE" : "NEW_CASE",
      title: first ? "PRE_ARRIVAL_ALERT" : "PRE_ARRIVAL_UPDATE",
      body: `${enc.code} · ${enc.priority} · ${patientLabel(enc.patient)} · ${enc.chiefComplaint}`,
      link: `/cases/${encounterId}`,
      encounterId,
    });
  } catch {
    delivered = -1;
  }
  const delivery = delivered > 0 ? "DELIVERED" : "FAILED";
  await prisma.patientEncounter.update({ where: { id: encounterId }, data: { preAlertDelivery: delivery } });
  // Mission departs scene towards hospital.
  if (["DISPATCHED", "ON_SCENE"].includes(enc.mission.status)) {
    await prisma.$transaction([
      prisma.ambulanceMission.update({ where: { id: enc.missionId }, data: { status: "TRANSPORTING", departedAt: new Date() } }),
      prisma.ambulance.update({ where: { id: enc.mission.ambulanceId }, data: { status: "TRANSPORTING" } }),
    ]);
  }
  if (!enc.mission.routeJson) await planRoute(enc.missionId, enc.destinationHospitalId);
  await timeline(encounterId, "HOSPITAL_NOTIFIED", actor, { hospital: enc.destinationHospital?.name, delivery, recipients: delivered, first });
  await audit(auditActor(actor), "prealert.sent", "PatientEncounter", encounterId, undefined, { hospitalId: enc.destinationHospitalId, delivery });
  await refreshCompleteness(encounterId);
  await emitEncounter(encounterId, "prealert");
  if (delivery === "FAILED") throw new ApiError(502, "DELIVERY_FAILED");
  return { delivery, recipients: delivered };
}

// ───────────────────────────── Hospital side ─────────────────────────────

function requireHospitalOf(actor: Actor, hospitalId: string | null) {
  const user = requireUserActor(actor);
  if (user.orgType === "PLATFORM") return user;
  if (!hospitalId || user.hospitalId !== hospitalId) throw new ApiError(403, "NOT_DESTINATION_HOSPITAL");
  return user;
}

export async function acknowledge(actor: Actor, encounterId: string, note?: string) {
  const enc = await scopedEncounter(actor, encounterId);
  const user = requireHospitalOf(actor, enc.destinationHospitalId);
  assertOpen(enc.status);
  if (!enc.preAlertSentAt) throw new ApiError(409, "NOT_NOTIFIED");
  await prisma.acknowledgment.create({
    data: { encounterId, hospitalId: enc.destinationHospitalId!, userId: user.id, userName: user.name, role: user.role, note },
  });
  const advance = ["PRE_ALERT_SENT", "DIVERTED", "ACTIVE", "CREATED"].includes(enc.status);
  await prisma.patientEncounter.update({
    where: { id: encounterId },
    data: {
      acknowledgedAt: enc.acknowledgedAt ?? new Date(),
      status: advance ? "ACKNOWLEDGED" : enc.status,
      readinessStatus: enc.readinessStatus === "NOT_STARTED" ? "REVIEWING" : enc.readinessStatus,
    },
  });
  await timeline(encounterId, "HOSPITAL_ACKNOWLEDGED", actor, { hospital: enc.destinationHospital?.name, role: user.role, note });
  await audit(auditActor(actor), "hospital.acknowledged", "PatientEncounter", encounterId, { acknowledgedAt: enc.acknowledgedAt }, { by: user.name, role: user.role });
  await resolveAlerts({ encounterId, type: "NO_HOSPITAL_ACK" });
  await notifyEms(encounterId, { type: "HOSPITAL_ACK", title: "HOSPITAL_ACK", body: `${enc.code} · ${enc.destinationHospital?.name} · ${user.name}`, link: `/paramedic/${encounterId}` });
  await emitEncounter(encounterId, "ack");
}

export async function setPreparation(actor: Actor, encounterId: string, item: PrepItem, done: boolean) {
  const enc = await scopedEncounter(actor, encounterId);
  const user = requireHospitalOf(actor, enc.destinationHospitalId);
  assertOpen(enc.status);
  await prisma.hospitalPreparation.upsert({
    where: { encounterId_hospitalId_item: { encounterId, hospitalId: enc.destinationHospitalId!, item } },
    create: { encounterId, hospitalId: enc.destinationHospitalId!, item, done, updatedById: user.id, updatedByName: user.name },
    update: { done, updatedById: user.id, updatedByName: user.name },
  });
  const data: Prisma.PatientEncounterUpdateInput = {};
  if (done && ["NOT_STARTED", "REVIEWING"].includes(enc.readinessStatus)) data.readinessStatus = "PREPARING";
  if (done && enc.status === "ACKNOWLEDGED") data.status = "PREPARING";
  if (Object.keys(data).length) await prisma.patientEncounter.update({ where: { id: encounterId }, data });
  await timeline(encounterId, "PREPARATION_UPDATED", actor, { item, done });
  await audit(auditActor(actor), "preparation.updated", "PatientEncounter", encounterId, undefined, { item, done });
  await emitEncounter(encounterId, "preparation");
}

export async function setReadiness(actor: Actor, encounterId: string, readiness: ReadinessStatus, note?: string) {
  const enc = await scopedEncounter(actor, encounterId);
  requireHospitalOf(actor, enc.destinationHospitalId);
  assertOpen(enc.status);
  await prisma.patientEncounter.update({
    where: { id: encounterId },
    data: {
      readinessStatus: readiness,
      ...(enc.status === "ACKNOWLEDGED" && ["PREPARING", "READY", "LIMITED", "RESOURCE_CONSTRAINT"].includes(readiness) ? { status: "PREPARING" } : {}),
    },
  });
  await timeline(encounterId, "READINESS_CHANGED", actor, { from: enc.readinessStatus, to: readiness, note });
  await audit(auditActor(actor), "readiness.changed", "PatientEncounter", encounterId, { readiness: enc.readinessStatus }, { readiness, note });
  if (readiness === "RESOURCE_CONSTRAINT" || readiness === "LIMITED") {
    await raiseAlert({
      type: "RESOURCE_UNAVAILABLE",
      severity: readiness === "RESOURCE_CONSTRAINT" ? "CRITICAL" : "WARNING",
      message: `${enc.code} · ${enc.destinationHospital?.name} · ${readiness}${note ? ` — ${note}` : ""}`,
      encounterId,
      hospitalId: enc.destinationHospitalId,
      ambulanceId: enc.mission.ambulanceId,
      dedupeKey: `READINESS:${encounterId}`,
    });
    await notifyEms(encounterId, { type: "RESOURCE_STATUS_CHANGE", title: "READINESS_CONSTRAINT", body: `${enc.code} · ${enc.destinationHospital?.name} · ${readiness}`, link: `/dispatch` });
  } else {
    await resolveAlerts({ dedupeKey: `READINESS:${encounterId}` });
  }
  await emitEncounter(encounterId, "readiness", { readiness });
}

// ───────────────────────────── Handover & release ─────────────────────────────

export async function buildHandoverSummary(encounterId: string) {
  const enc = await prisma.patientEncounter.findUniqueOrThrow({
    where: { id: encounterId },
    include: {
      patient: { include: { healthProfile: true } },
      vitals: { orderBy: { recordedAt: "desc" } },
      interventions: { orderBy: { performedAt: "asc" } },
      medications: { orderBy: { administeredAt: "asc" } },
      events: { where: { type: { in: ["CONDITION_CHANGED", "PRIORITY_CHANGED"] } }, orderBy: { occurredAt: "asc" } },
      mission: { include: { ambulance: true } },
    },
  });
  const latest: Record<string, { value: number; value2: number | null; status: string; at: string }> = {};
  for (const v of enc.vitals) if (!latest[v.type]) latest[v.type] = { value: v.value, value2: v.value2, status: v.status, at: v.recordedAt.toISOString() };
  return {
    patient: {
      label: patientLabel(enc.patient),
      unknown: enc.patient.isUnknown,
      temporaryId: enc.patient.temporaryId,
      age: enc.patient.age,
      sex: enc.patient.sex,
      nationalIdLast4: enc.patient.nationalIdLast4,
    },
    chiefComplaint: enc.chiefComplaint,
    mechanism: enc.mechanism,
    priority: enc.priority,
    conditionTrend: enc.conditionTrend,
    ambulance: enc.mission.ambulance.callSign,
    latestVitals: latest,
    interventions: enc.interventions.map((i) => ({ type: i.type, at: i.performedAt.toISOString(), by: i.performedBy, notes: i.notes })),
    medications: enc.medications.map((m) => ({ name: m.name, dose: m.dose, route: m.route, at: m.administeredAt.toISOString(), by: m.administeredBy })),
    allergies: (enc.patient.healthProfile?.allergies as string[] | undefined) ?? null,
    conditionChanges: enc.events.map((e) => ({ type: e.type, at: e.occurredAt.toISOString(), detail: e.detail })),
    generatedAt: new Date().toISOString(),
  };
}

export async function startHandover(actor: Actor, encounterId: string) {
  const enc = await scopedEncounter(actor, encounterId);
  if (enc.status !== "ARRIVED") throw new ApiError(409, "NOT_ARRIVED");
  const user = requireUserActor(actor);
  const summary = await buildHandoverSummary(encounterId);
  await prisma.$transaction([
    prisma.handover.create({
      data: { encounterId, hospitalId: enc.destinationHospitalId!, summary: summary as unknown as Prisma.InputJsonValue, startedById: user.id, startedByName: user.name },
    }),
    prisma.patientEncounter.update({ where: { id: encounterId }, data: { status: "HANDOVER", handoverStartedAt: new Date() } }),
    prisma.ambulanceMission.update({ where: { id: enc.missionId }, data: { status: "HANDOVER", handoverAt: new Date() } }),
  ]);
  await timeline(encounterId, "HANDOVER_STARTED", actor);
  await audit(auditActor(actor), "handover.started", "PatientEncounter", encounterId);
  await notifyHospital(enc.destinationHospitalId!, { type: "ARRIVAL", title: "HANDOVER_STARTED", body: `${enc.code} · ${patientLabel(enc.patient)}`, link: `/cases/${encounterId}`, encounterId });
  await emitEncounter(encounterId, "handover");
}

export async function acceptHandover(actor: Actor, encounterId: string) {
  const enc = await scopedEncounter(actor, encounterId);
  const user = requireHospitalOf(actor, enc.destinationHospitalId);
  const h = await prisma.handover.findUnique({ where: { encounterId } });
  if (!h || h.status !== "STARTED") throw new ApiError(409, "INVALID_STATE");
  await prisma.handover.update({ where: { encounterId }, data: { status: "ACCEPTED", acceptedAt: new Date(), acceptedById: user.id, acceptedByName: user.name } });
  await timeline(encounterId, "HANDOVER_ACCEPTED", actor);
  await audit(auditActor(actor), "handover.accepted", "PatientEncounter", encounterId);
  await emitEncounter(encounterId, "handover");
}

export async function completeHandover(actor: Actor, encounterId: string, notes?: string) {
  const enc = await scopedEncounter(actor, encounterId);
  const user = requireHospitalOf(actor, enc.destinationHospitalId);
  const h = await prisma.handover.findUnique({ where: { encounterId } });
  if (!h || h.status !== "ACCEPTED") throw new ApiError(409, "INVALID_STATE");
  const now = new Date();
  await prisma.$transaction([
    prisma.handover.update({ where: { encounterId }, data: { status: "COMPLETED", completedAt: now, completedById: user.id, completedByName: user.name, receivingNotes: notes } }),
    prisma.patientEncounter.update({ where: { id: encounterId }, data: { status: "COMPLETED", handoverCompletedAt: now, closedAt: now } }),
  ]);
  const remaining = await prisma.patientEncounter.count({ where: { missionId: enc.missionId, status: { notIn: ["COMPLETED", "CANCELLED"] } } });
  if (remaining === 0) await prisma.ambulanceMission.update({ where: { id: enc.missionId }, data: { status: "COMPLETED" } });
  await timeline(encounterId, "HANDOVER_COMPLETED", actor, { notes, durationMin: Math.round((now.getTime() - h.startedAt.getTime()) / 6000) / 10 });
  await audit(auditActor(actor), "handover.completed", "PatientEncounter", encounterId, { status: enc.status }, { status: "COMPLETED", by: user.name });
  await resolveAlerts({ encounterId });
  await refreshCompleteness(encounterId);
  await notifyEms(encounterId, { type: "HANDOVER_COMPLETE", title: "HANDOVER_COMPLETE", body: `${enc.code} · ${enc.destinationHospital?.name}`, link: `/paramedic` });
  await emitEncounter(encounterId, "handover");
}

export async function releaseAmbulance(actor: Actor, missionId: string) {
  const user = requireUserActor(actor);
  const mission = await prisma.ambulanceMission.findUnique({ where: { id: missionId }, include: { ambulance: true, encounters: true } });
  if (!mission) throw new ApiError(404, "NOT_FOUND");
  if (user.role === "PARAMEDIC" && mission.ambulanceId !== user.ambulanceId) throw new ApiError(404, "NOT_FOUND");
  if (user.orgType === "EMS" && mission.ambulance.organizationId !== user.organizationId) throw new ApiError(404, "NOT_FOUND");
  if (mission.encounters.some((e) => !["COMPLETED", "CANCELLED"].includes(e.status))) throw new ApiError(409, "OPEN_ENCOUNTERS");
  if (mission.releasedAt) throw new ApiError(409, "ALREADY_RELEASED");
  const now = new Date();
  await prisma.$transaction([
    prisma.ambulanceMission.update({ where: { id: missionId }, data: { status: mission.status === "CANCELLED" ? "CANCELLED" : "COMPLETED", releasedAt: now, availableAt: now } }),
    prisma.ambulance.update({ where: { id: mission.ambulanceId }, data: { status: "AVAILABLE", speedKmh: 0 } }),
  ]);
  for (const e of mission.encounters) await timeline(e.id, "AMBULANCE_RELEASED", actor, { ambulance: mission.ambulance.callSign });
  const open = await prisma.ambulanceMission.count({ where: { incidentId: mission.incidentId, releasedAt: null } });
  if (open === 0) await prisma.incident.update({ where: { id: mission.incidentId }, data: { status: "CLOSED", closedAt: now } });
  await audit(auditActor(actor), "ambulance.released", "AmbulanceMission", missionId, { status: mission.ambulance.status }, { status: "AVAILABLE" });
  await emit({ t: "mission", o: [mission.ambulance.organizationId], a: mission.ambulanceId });
  for (const e of mission.encounters) await emitEncounter(e.id, "released");
}

export async function updateResource(
  actor: Actor,
  hospitalId: string,
  input: { type: import("@prisma/client").ResourceType; status: import("@prisma/client").ResourceStatus; available?: number | null; total?: number | null; note?: string | null },
) {
  const user = requireHospitalOf(actor, hospitalId);
  const before = await prisma.hospitalResource.findUnique({ where: { hospitalId_type: { hospitalId, type: input.type } } });
  const row = await prisma.hospitalResource.upsert({
    where: { hospitalId_type: { hospitalId, type: input.type } },
    create: { hospitalId, type: input.type, status: input.status, available: input.available, total: input.total, note: input.note, updatedById: user.id },
    update: { status: input.status, available: input.available, total: input.total, note: input.note, updatedById: user.id },
  });
  await audit(auditActor(actor), "resource.updated", "HospitalResource", row.id, before, row);
  const hospital = await prisma.hospital.findUniqueOrThrow({ where: { id: hospitalId } });
  if (before?.status !== input.status) {
    if (input.status === "UNAVAILABLE") {
      await raiseAlert({ type: "RESOURCE_UNAVAILABLE", severity: "WARNING", message: `${hospital.name} · ${input.type} UNAVAILABLE`, hospitalId, dedupeKey: `RES:${hospitalId}:${input.type}` });
    } else {
      await resolveAlerts({ dedupeKey: `RES:${hospitalId}:${input.type}` });
    }
    await notifyRoles(["EMS_DISPATCH", "EMS_ADMIN"], undefined, { type: "RESOURCE_STATUS_CHANGE", title: "RESOURCE_STATUS_CHANGE", body: `${hospital.name} · ${input.type} · ${input.status}`, link: "/command" });
  }
  await emit({ t: "resource", h: [hospitalId], d: { type: input.type, status: input.status } });
  return row;
}

export async function updateCapability(actor: Actor, hospitalId: string, capability: import("@prisma/client").CapabilityType, available: boolean) {
  requireHospitalOf(actor, hospitalId);
  const row = await prisma.hospitalCapability.upsert({
    where: { hospitalId_capability: { hospitalId, capability } },
    create: { hospitalId, capability, available },
    update: { available },
  });
  await audit(auditActor(actor), "capability.updated", "HospitalCapability", row.id, undefined, { capability, available });
  await emit({ t: "resource", h: [hospitalId] });
}

export { ACTIVE_STATUSES };
