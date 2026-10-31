import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { CurrentUser } from "@/lib/session";
import { encounterScope } from "@/lib/scope";
import { median, mean } from "@/lib/engines/stats";
import { hospitalLoads } from "@/lib/services/encounters";

export const OPEN_STATUSES = ["CREATED", "ACTIVE", "PRE_ALERT_SENT", "ACKNOWLEDGED", "PREPARING", "APPROACHING", "ARRIVED", "HANDOVER", "DIVERTED"] as const;
export const INCOMING_STATUSES = ["PRE_ALERT_SENT", "ACKNOWLEDGED", "PREPARING", "APPROACHING", "DIVERTED"] as const;

export function alertScope(user: CurrentUser): Prisma.AlertWhereInput {
  if (user.orgType === "PLATFORM") return {};
  if (user.orgType === "EMS") {
    if (user.role === "PARAMEDIC") return { ambulanceId: user.ambulanceId ?? "__none__" };
    return { OR: [{ ambulance: { organizationId: user.organizationId } }, { encounter: { mission: { ambulance: { organizationId: user.organizationId } } } }, { encounterId: null, hospitalId: { not: null } }] };
  }
  return { hospitalId: user.hospitalId ?? "__none__" };
}

/** Encounter card include: everything an ED/command card needs. */
export const cardInclude = {
  patient: true,
  destinationHospital: { select: { id: true, name: true, nameAr: true, code: true, lat: true, lng: true } },
  mission: { include: { ambulance: true, incident: { select: { type: true, address: true, code: true } } } },
  vitals: { orderBy: { recordedAt: "desc" as const }, take: 30 },
  acknowledgments: { orderBy: { acknowledgedAt: "desc" as const }, take: 1 },
  destinationHistory: { orderBy: { changedAt: "desc" as const }, take: 1, include: { fromHospital: { select: { name: true } }, toHospital: { select: { name: true } } } },
  alerts: { where: { status: { not: "RESOLVED" as const } }, select: { id: true, type: true, severity: true } },
} satisfies Prisma.PatientEncounterInclude;

export type CardEncounter = Prisma.PatientEncounterGetPayload<{ include: typeof cardInclude }>;

/** Serialize a card encounter for client components (dates → ISO strings, latest vitals by type). */
export function toCard(e: CardEncounter) {
  const latest: Record<string, { value: number; value2: number | null; status: string; at: string }> = {};
  for (const v of e.vitals) if (!latest[v.type]) latest[v.type] = { value: v.value, value2: v.value2, status: v.status, at: v.recordedAt.toISOString() };
  return {
    id: e.id,
    code: e.code,
    status: e.status,
    priority: e.priority,
    conditionTrend: e.conditionTrend,
    chiefComplaint: e.chiefComplaint,
    patientLabel: e.patient.isUnknown ? e.patient.temporaryId ?? "UNKNOWN" : e.patient.fullName ?? "—",
    isUnknown: e.patient.isUnknown,
    temporaryId: e.patient.temporaryId,
    age: e.patient.age,
    ageEstimated: e.patient.ageEstimated,
    sex: e.patient.sex,
    ambulance: e.mission.ambulance.callSign,
    ambulanceId: e.mission.ambulanceId,
    ambulanceLat: e.mission.ambulance.lat,
    ambulanceLng: e.mission.ambulance.lng,
    missionStatus: e.mission.status,
    etaSeconds: e.mission.etaSeconds,
    distanceMeters: e.mission.distanceMeters,
    arrivalPhase: e.mission.arrivalPhase,
    destination: e.destinationHospital ? { id: e.destinationHospital.id, name: e.destinationHospital.name, nameAr: e.destinationHospital.nameAr } : null,
    readiness: e.readinessStatus,
    acknowledgedAt: e.acknowledgedAt?.toISOString() ?? null,
    acknowledgedBy: e.acknowledgments[0] ? { name: e.acknowledgments[0].userName, role: e.acknowledgments[0].role } : null,
    preAlertSentAt: e.preAlertSentAt?.toISOString() ?? null,
    arrivedAt: e.arrivedAt?.toISOString() ?? null,
    lastDiversion: e.destinationHistory[0]
      ? { from: e.destinationHistory[0].fromHospital?.name ?? null, fromId: e.destinationHistory[0].fromHospitalId, to: e.destinationHistory[0].toHospital.name, at: e.destinationHistory[0].changedAt.toISOString(), reason: e.destinationHistory[0].reason }
      : null,
    latest,
    openAlerts: e.alerts.length,
    criticalAlerts: e.alerts.filter((a) => a.severity === "CRITICAL").length,
    completeness: e.completeness,
    updatedAt: e.updatedAt.toISOString(),
  };
}
export type Card = ReturnType<typeof toCard>;

export async function scopedEncounters(user: CurrentUser, where: Prisma.PatientEncounterWhereInput, take = 200) {
  const rows = await prisma.patientEncounter.findMany({
    where: { AND: [encounterScope(user), where] },
    include: cardInclude,
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    take,
  });
  return rows;
}

export async function openAlerts(user: CurrentUser, take = 30) {
  return prisma.alert.findMany({
    where: { AND: [alertScope(user), { status: { not: "RESOLVED" } }] },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    take,
    include: { encounter: { select: { id: true, code: true } }, hospital: { select: { name: true } }, ambulance: { select: { callSign: true } } },
  });
}

export async function mapHospitals() {
  const hs = await prisma.hospital.findMany({ include: { resources: true } });
  return hs.map((h) => ({ id: h.id, name: h.name, nameAr: h.nameAr, code: h.code, lat: h.lat, lng: h.lng, geofenceRadiusM: h.geofenceRadiusM, approachRadiusM: h.approachRadiusM }));
}

export async function mapAmbulances(where: Prisma.AmbulanceWhereInput = {}) {
  const ambs = await prisma.ambulance.findMany({
    where,
    orderBy: { callSign: "asc" },
    include: { missions: { where: { releasedAt: null, status: { notIn: ["CANCELLED"] } }, orderBy: { dispatchedAt: "desc" }, take: 1 } },
  });
  return ambs.map((a) => {
    const m = a.missions[0];
    return {
      id: a.id,
      callSign: a.callSign,
      status: a.status,
      lat: a.lat,
      lng: a.lng,
      heading: a.heading,
      baseName: a.baseName,
      unitType: a.unitType,
      missionId: m?.id ?? null,
      etaSeconds: m?.status === "TRANSPORTING" ? m.etaSeconds : null,
      route: m?.status === "TRANSPORTING" && m.routeJson ? ((m.routeJson as { lat: number; lng: number }[]).slice(m.routeIndex)) : null,
    };
  });
}

/** Command-center KPIs, all computed from the database. */
export async function commandKpis(user: CurrentUser) {
  const scope = encounterScope(user);
  const since = new Date(Date.now() - 7 * 86400_000);
  const [activeAmb, active, critical, transporting, recent] = await Promise.all([
    prisma.ambulance.count({ where: { status: { notIn: ["AVAILABLE", "OUT_OF_SERVICE"] }, ...(user.orgType === "EMS" ? { organizationId: user.organizationId } : {}) } }),
    prisma.patientEncounter.count({ where: { AND: [scope, { status: { in: [...OPEN_STATUSES] } }] } }),
    prisma.patientEncounter.count({ where: { AND: [scope, { status: { in: [...OPEN_STATUSES] }, priority: "P1" }] } }),
    prisma.ambulanceMission.findMany({ where: { status: "TRANSPORTING", etaSeconds: { not: null } }, select: { etaSeconds: true } }),
    prisma.patientEncounter.findMany({
      where: { AND: [scope, { createdAt: { gte: since } }] },
      select: { preAlertSentAt: true, acknowledgedAt: true, arrivedAt: true, handoverCompletedAt: true, handoverStartedAt: true },
    }),
  ]);
  const ackMin = recent.filter((r) => r.preAlertSentAt && r.acknowledgedAt).map((r) => (r.acknowledgedAt!.getTime() - r.preAlertSentAt!.getTime()) / 60000);
  const hoMin = recent.filter((r) => r.arrivedAt && r.handoverCompletedAt).map((r) => (r.handoverCompletedAt!.getTime() - r.arrivedAt!.getTime()) / 60000);
  return {
    activeAmbulances: activeAmb,
    activeCases: active,
    criticalCases: critical,
    avgEtaMin: transporting.length ? (mean(transporting.map((m) => m.etaSeconds! / 60)) ?? null) : null,
    medianAckMin: median(ackMin),
    medianHandoverMin: median(hoMin),
  };
}

export async function hospitalLoadTable() {
  const [hospitals, loads] = await Promise.all([prisma.hospital.findMany({ include: { resources: true }, orderBy: { name: "asc" } }), hospitalLoads()]);
  return hospitals.map((h) => ({
    id: h.id,
    name: h.name,
    nameAr: h.nameAr,
    code: h.code,
    edCapacity: h.edCapacity,
    load: loads[h.id],
    occupancyPct: Math.round(((loads[h.id].activeEd + loads[h.id].incoming) / Math.max(1, h.edCapacity)) * 100),
    constrained: h.resources.filter((r) => r.status === "UNAVAILABLE" || r.status === "LIMITED").map((r) => ({ type: r.type, status: r.status })),
  }));
}

export function toAlertRow(a: Awaited<ReturnType<typeof openAlerts>>[number]) {
  return {
    id: a.id,
    type: a.type,
    severity: a.severity,
    status: a.status,
    message: a.message,
    createdAt: a.createdAt.toISOString(),
    encounterId: a.encounter?.id ?? null,
    encounterCode: a.encounter?.code ?? null,
    hospital: a.hospital?.name ?? null,
    ambulance: a.ambulance?.callSign ?? null,
  };
}
