import "server-only";
import { prisma } from "@/lib/db";
import type { CurrentUser } from "@/lib/session";
import { encounterScope } from "@/lib/scope";
import { completeness } from "@/lib/engines/completeness";
import { can } from "@/lib/rbac";
import { simulationStatus } from "@/lib/services/simulation";
import { audit } from "@/lib/audit";

const g = globalThis as unknown as { __vlViewed?: Map<string, number> };
const viewed = (g.__vlViewed ??= new Map());

/** Full, serialized case for the case view / paramedic workspace (tenant-scoped). */
export async function getCaseDetail(user: CurrentUser, id: string) {
  const e = await prisma.patientEncounter.findFirst({
    where: { AND: [{ id }, encounterScope(user)] },
    include: {
      patient: { include: { healthProfile: true, identities: { orderBy: { createdAt: "desc" }, take: 5 } } },
      mission: { include: { ambulance: true, incident: true } },
      destinationHospital: true,
      vitals: { orderBy: { recordedAt: "asc" } },
      events: { orderBy: { occurredAt: "desc" }, take: 200 },
      interventions: { orderBy: { performedAt: "desc" } },
      medications: { orderBy: { administeredAt: "desc" } },
      media: { orderBy: { createdAt: "desc" } },
      preparations: true,
      acknowledgments: { orderBy: { acknowledgedAt: "asc" }, include: { hospital: { select: { name: true } } } },
      triage: { orderBy: { createdAt: "desc" }, take: 10 },
      recommendations: { orderBy: { createdAt: "desc" }, take: 1, include: { recommendedHospital: { select: { name: true } } } },
      destinationHistory: { orderBy: { changedAt: "desc" }, include: { fromHospital: { select: { id: true, name: true } }, toHospital: { select: { id: true, name: true } } } },
      handover: true,
      alerts: { where: { status: { not: "RESOLVED" } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!e) return null;

  // Audit "Patient viewed" (de-duplicated per user/case for 10 min so live refreshes don't flood the log)
  const k = `${user.id}:${e.id}`;
  if ((viewed.get(k) ?? 0) < Date.now() - 10 * 60_000) {
    viewed.set(k, Date.now());
    await audit({ id: user.id, email: user.email, role: user.role, organizationId: user.organizationId }, "patient.viewed", "PatientEncounter", e.id);
  }

  const canHealth = can(user.role, "health:read");
  const latest: Record<string, { value: number; value2: number | null; status: string; at: string; source: string }> = {};
  for (const v of e.vitals) latest[v.type] = { value: v.value, value2: v.value2, status: v.status, at: v.recordedAt.toISOString(), source: v.source };
  const verified = e.patient.identities.some((i) => i.status === "VERIFIED");
  const comp = completeness({
    identityKnown: !e.patient.isUnknown,
    chiefComplaint: e.chiefComplaint,
    vitalTypes: Object.keys(latest),
    interventions: e.interventions.length,
    medications: e.medications.length,
    etaKnown: e.mission.etaSeconds != null || !!e.arrivedAt,
    destinationSet: !!e.destinationHospitalId,
    handoverCompleted: !!e.handoverCompletedAt,
  });
  const route = e.mission.status === "TRANSPORTING" && e.mission.routeJson ? (e.mission.routeJson as { lat: number; lng: number }[]).slice(e.mission.routeIndex) : null;
  const sim = simulationStatus();
  const [integrations, hospitals] = await Promise.all([
    prisma.integration.findMany({ select: { key: true, status: true } }),
    prisma.hospital.findMany({ select: { id: true, name: true, nameAr: true, lat: true, lng: true, geofenceRadiusM: true, approachRadiusM: true }, orderBy: { name: "asc" } }),
  ]);
  const divertedAway = user.orgType === "HOSPITAL" && !!user.hospitalId && e.destinationHospitalId !== user.hospitalId;
  const iso = (d: Date | null | undefined) => d?.toISOString() ?? null;

  return {
    id: e.id,
    code: e.code,
    status: e.status,
    priority: e.priority,
    conditionTrend: e.conditionTrend,
    chiefComplaint: e.chiefComplaint,
    mechanism: e.mechanism,
    notes: e.notes,
    createdAt: e.createdAt.toISOString(),
    readiness: e.readinessStatus,
    registration: { status: e.registrationStatus, ref: e.registrationRef },
    preAlertSentAt: iso(e.preAlertSentAt),
    preAlertDelivery: e.preAlertDelivery,
    acknowledgedAt: iso(e.acknowledgedAt),
    approachingAt: iso(e.approachingAt),
    geofenceEnteredAt: iso(e.geofenceEnteredAt),
    arrivedAt: iso(e.arrivedAt),
    handoverStartedAt: iso(e.handoverStartedAt),
    handoverCompletedAt: iso(e.handoverCompletedAt),
    completeness: comp,
    divertedAway,
    patient: {
      id: e.patient.id,
      label: e.patient.isUnknown ? e.patient.temporaryId ?? "UNKNOWN" : e.patient.fullName ?? "—",
      isUnknown: e.patient.isUnknown,
      temporaryId: e.patient.temporaryId,
      fullName: e.patient.fullName,
      age: e.patient.age,
      ageEstimated: e.patient.ageEstimated,
      sex: e.patient.sex,
      nationalIdLast4: e.patient.nationalIdLast4,
      phoneLast4: e.patient.phoneLast4,
      verified,
      identities: e.patient.identities.map((i) => ({ id: i.id, provider: i.provider, method: i.method, status: i.status, confidence: i.confidence, ref: i.externalRef, message: i.message, at: i.createdAt.toISOString() })),
      health:
        canHealth && e.patient.healthProfile
          ? {
              source: e.patient.healthProfile.source,
              bloodType: e.patient.healthProfile.bloodType,
              allergies: e.patient.healthProfile.allergies as string[],
              chronicConditions: e.patient.healthProfile.chronicConditions as string[],
              medicalAlerts: e.patient.healthProfile.medicalAlerts as string[],
              medicationHistory: e.patient.healthProfile.medicationHistory as { name: string; dose: string }[],
              criticalDiagnoses: e.patient.healthProfile.criticalDiagnoses as string[],
              fetchedAt: e.patient.healthProfile.fetchedAt.toISOString(),
            }
          : null,
    },
    mission: {
      id: e.mission.id,
      code: e.mission.code,
      status: e.mission.status,
      phase: e.mission.arrivalPhase,
      etaSeconds: e.mission.etaSeconds,
      distanceMeters: e.mission.distanceMeters,
      etaUpdatedAt: iso(e.mission.etaUpdatedAt),
      routeProvider: e.mission.routeProvider,
      dispatchedAt: iso(e.mission.dispatchedAt),
      onSceneAt: iso(e.mission.onSceneAt),
      departedAt: iso(e.mission.departedAt),
      releasedAt: iso(e.mission.releasedAt),
      driving: sim.drives.includes(e.mission.id),
      route,
      incident: { id: e.mission.incident.id, code: e.mission.incident.code, type: e.mission.incident.type, address: e.mission.incident.address, lat: e.mission.incident.lat, lng: e.mission.incident.lng },
      ambulance: { id: e.mission.ambulance.id, callSign: e.mission.ambulance.callSign, status: e.mission.ambulance.status, lat: e.mission.ambulance.lat, lng: e.mission.ambulance.lng, heading: e.mission.ambulance.heading, speedKmh: e.mission.ambulance.speedKmh, unitType: e.mission.ambulance.unitType },
    },
    destination: e.destinationHospital ? { id: e.destinationHospital.id, name: e.destinationHospital.name, nameAr: e.destinationHospital.nameAr, lat: e.destinationHospital.lat, lng: e.destinationHospital.lng, geofenceRadiusM: e.destinationHospital.geofenceRadiusM, approachRadiusM: e.destinationHospital.approachRadiusM } : null,
    hospitals,
    vitals: e.vitals.map((v) => ({ id: v.id, type: v.type, value: v.value, value2: v.value2, unit: v.unit, at: v.recordedAt.toISOString(), source: v.source, status: v.status })),
    latest,
    events: e.events.map((x) => ({ id: x.id, type: x.type, at: x.occurredAt.toISOString(), actor: x.actorName, role: x.actorRole, detail: x.detail as Record<string, unknown> | null })),
    interventions: e.interventions.map((i) => ({ id: i.id, type: i.type, at: i.performedAt.toISOString(), by: i.performedBy, notes: i.notes })),
    medications: e.medications.map((m) => ({ id: m.id, name: m.name, dose: m.dose, route: m.route, at: m.administeredAt.toISOString(), by: m.administeredBy, notes: m.notes })),
    media: can(user.role, "media:read") ? e.media.map((m) => ({ id: m.id, kind: m.kind, category: m.category, caption: m.caption, at: m.createdAt.toISOString(), by: m.uploadedBy, size: m.sizeBytes })) : [],
    preparations: e.preparations.filter((p) => p.hospitalId === e.destinationHospitalId).map((p) => ({ item: p.item, done: p.done, by: p.updatedByName, at: p.updatedAt.toISOString() })),
    acknowledgments: e.acknowledgments.map((a) => ({ id: a.id, hospital: a.hospital.name, by: a.userName, role: a.role, at: a.acknowledgedAt.toISOString(), note: a.note })),
    triage: e.triage.map((a) => ({
      id: a.id,
      suggested: a.suggestedPriority,
      risk: a.riskScore,
      confidence: a.confidence,
      factors: a.factors as { code: string; points: number; detail: string }[],
      missing: a.missingData as string[],
      engine: a.engineVersion,
      decision: a.decision,
      finalPriority: a.finalPriority,
      overrideReason: a.overrideReason,
      decidedBy: a.decidedByName,
      decidedAt: iso(a.decidedAt),
      at: a.createdAt.toISOString(),
    })),
    recommendation: e.recommendations[0]
      ? {
          id: e.recommendations[0].id,
          status: e.recommendations[0].status,
          hospitalId: e.recommendations[0].recommendedHospitalId,
          hospital: e.recommendations[0].recommendedHospital.name,
          score: e.recommendations[0].score,
          required: e.recommendations[0].requiredCapabilities as string[],
          ranking: e.recommendations[0].ranking as unknown as { hospitalId: string; name: string; score: number; etaSeconds: number; distanceMeters: number; breakdown: Record<string, number>; reasons: { code: string; params?: Record<string, string | number>; positive: boolean }[] }[],
          engine: e.recommendations[0].engineVersion,
          requestedBy: e.recommendations[0].requestedByName,
          decidedBy: e.recommendations[0].decidedByName,
          decisionNote: e.recommendations[0].decisionNote,
          at: e.recommendations[0].createdAt.toISOString(),
        }
      : null,
    destinationHistory: e.destinationHistory.map((h) => ({ id: h.id, from: h.fromHospital?.name ?? null, fromId: h.fromHospitalId, to: h.toHospital.name, reason: h.reason, by: h.changedByName, role: h.changedByRole, at: h.changedAt.toISOString() })),
    handover: e.handover
      ? {
          status: e.handover.status,
          summary: e.handover.summary as Record<string, unknown>,
          startedAt: e.handover.startedAt.toISOString(),
          startedBy: e.handover.startedByName,
          acceptedAt: iso(e.handover.acceptedAt),
          acceptedBy: e.handover.acceptedByName,
          completedAt: iso(e.handover.completedAt),
          completedBy: e.handover.completedByName,
          notes: e.handover.receivingNotes,
        }
      : null,
    alerts: e.alerts.map((a) => ({ id: a.id, type: a.type, severity: a.severity, status: a.status, message: a.message, at: a.createdAt.toISOString() })),
    integrations: Object.fromEntries(integrations.map((i) => [i.key, i.status])) as Record<string, string>,
    monitorRunning: sim.monitors.some((m) => m.encounterId === e.id),
  };
}

export type CaseDetail = NonNullable<Awaited<ReturnType<typeof getCaseDetail>>>;
