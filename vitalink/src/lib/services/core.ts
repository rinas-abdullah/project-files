import "server-only";
import type {
  AlertSeverity,
  AlertType,
  ClinicalEventType,
  NotificationType,
  Prisma,
  RoleKey,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { publish, type LiveEvent } from "@/lib/realtime/bus";
import { completeness } from "@/lib/engines/completeness";
import type { CurrentUser } from "@/lib/session";
import { encounterScope } from "@/lib/scope";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message?: string) {
    super(message ?? code);
  }
}

/** A user or the system (simulator, geofence engine, monitors). */
export type Actor =
  | (Pick<CurrentUser, "id" | "name" | "email" | "role" | "organizationId" | "orgType" | "hospitalId" | "ambulanceId">)
  | { system: true; name: string };

export const isSystem = (a: Actor): a is { system: true; name: string } => "system" in a;
export const actorId = (a: Actor) => (isSystem(a) ? null : a.id);
export const actorName = (a: Actor) => a.name;
export const actorRole = (a: Actor): RoleKey | null => (isSystem(a) ? null : a.role);
export const auditActor = (a: Actor) =>
  isSystem(a) ? null : { id: a.id, email: a.email, role: a.role, organizationId: a.organizationId };

export const SYSTEM: Actor = { system: true, name: "VitaLink Engine" };

/** Load an encounter the actor is allowed to see, or throw 404 (never leak existence). */
export async function scopedEncounter(actor: Actor, id: string) {
  const where: Prisma.PatientEncounterWhereInput = isSystem(actor)
    ? { id }
    : { AND: [{ id }, encounterScope(actor)] };
  const enc = await prisma.patientEncounter.findFirst({
    where,
    include: { patient: true, mission: { include: { ambulance: true } }, destinationHospital: true },
  });
  if (!enc) throw new ApiError(404, "NOT_FOUND");
  return enc;
}

export async function timeline(
  encounterId: string,
  type: ClinicalEventType,
  actor: Actor,
  detail?: Record<string, unknown>,
  opts?: { clientId?: string; occurredAt?: Date },
) {
  return prisma.clinicalEvent.create({
    data: {
      encounterId,
      type,
      detail: (detail ?? undefined) as Prisma.InputJsonValue | undefined,
      actorId: actorId(actor),
      actorName: actorName(actor),
      actorRole: actorRole(actor),
      clientId: opts?.clientId,
      occurredAt: opts?.occurredAt,
    },
  });
}

/** Publish a realtime event to everyone concerned with this encounter. */
export async function emitEncounter(encounterId: string, t: string, d?: Record<string, unknown>) {
  const enc = await prisma.patientEncounter.findUnique({
    where: { id: encounterId },
    select: {
      destinationHospitalId: true,
      destinationHistory: { select: { fromHospitalId: true } },
      mission: { select: { ambulanceId: true, ambulance: { select: { organizationId: true } } } },
    },
  });
  if (!enc) return;
  const h = new Set<string>();
  if (enc.destinationHospitalId) h.add(enc.destinationHospitalId);
  enc.destinationHistory.forEach((x) => x.fromHospitalId && h.add(x.fromHospitalId));
  await publish({ t, e: encounterId, h: [...h], o: [enc.mission.ambulance.organizationId], a: enc.mission.ambulanceId, d });
}

export async function emit(ev: LiveEvent) {
  await publish(ev);
}

/** Recompute and persist the data-completeness score. */
export async function refreshCompleteness(encounterId: string) {
  const enc = await prisma.patientEncounter.findUnique({
    where: { id: encounterId },
    include: {
      patient: true,
      mission: true,
      vitals: { select: { type: true }, distinct: ["type"] },
      _count: { select: { interventions: true, medications: true } },
    },
  });
  if (!enc) return 0;
  const c = completeness({
    identityKnown: !enc.patient.isUnknown,
    chiefComplaint: enc.chiefComplaint,
    vitalTypes: enc.vitals.map((v) => v.type),
    interventions: enc._count.interventions,
    medications: enc._count.medications,
    etaKnown: enc.mission.etaSeconds != null || enc.arrivedAt != null,
    destinationSet: !!enc.destinationHospitalId,
    handoverCompleted: !!enc.handoverCompletedAt,
  });
  await prisma.patientEncounter.update({ where: { id: encounterId }, data: { completeness: c.score } });
  return c.score;
}

// ───────────── Notifications ─────────────

async function fanout(userIds: string[], n: { type: NotificationType; title: string; body: string; link?: string; encounterId?: string }) {
  if (!userIds.length) return 0;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, ...n })),
  });
  await publish({ t: "notify", d: { u: userIds } });
  return userIds.length;
}

const HOSPITAL_RECEIVERS: RoleKey[] = ["ED_ADMIN", "ED_NURSE", "ED_DOCTOR", "HOSPITAL_COORDINATOR"];

export async function notifyHospital(
  hospitalId: string,
  n: { type: NotificationType; title: string; body: string; link?: string; encounterId?: string },
) {
  const users = await prisma.user.findMany({
    where: { hospitalId, active: true, role: { in: HOSPITAL_RECEIVERS } },
    select: { id: true },
  });
  return fanout(users.map((u) => u.id), n);
}

/** Notify the EMS side of an encounter: the crew of the ambulance + dispatch/admin of the operator. */
export async function notifyEms(
  encounterId: string,
  n: { type: NotificationType; title: string; body: string; link?: string },
  opts: { crew?: boolean; dispatch?: boolean } = { crew: true, dispatch: true },
) {
  const enc = await prisma.patientEncounter.findUnique({
    where: { id: encounterId },
    select: { mission: { select: { ambulanceId: true, ambulance: { select: { organizationId: true } } } } },
  });
  if (!enc) return 0;
  const or: Prisma.UserWhereInput[] = [];
  if (opts.crew) or.push({ ambulanceId: enc.mission.ambulanceId });
  if (opts.dispatch) or.push({ organizationId: enc.mission.ambulance.organizationId, role: { in: ["EMS_DISPATCH", "EMS_ADMIN"] } });
  const users = await prisma.user.findMany({ where: { active: true, OR: or }, select: { id: true } });
  return fanout(users.map((u) => u.id), { ...n, encounterId });
}

export async function notifyRoles(roles: RoleKey[], organizationId: string | undefined, n: { type: NotificationType; title: string; body: string; link?: string }) {
  const users = await prisma.user.findMany({
    where: { active: true, role: { in: roles }, ...(organizationId ? { organizationId } : {}) },
    select: { id: true },
  });
  return fanout(users.map((u) => u.id), n);
}

// ───────────── Alerts ─────────────

export async function raiseAlert(a: {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  encounterId?: string;
  hospitalId?: string | null;
  ambulanceId?: string | null;
  dedupeKey?: string;
  data?: Record<string, unknown>;
}) {
  const payload = {
    type: a.type,
    severity: a.severity,
    message: a.message,
    encounterId: a.encounterId,
    hospitalId: a.hospitalId ?? undefined,
    ambulanceId: a.ambulanceId ?? undefined,
    data: (a.data ?? undefined) as Prisma.InputJsonValue | undefined,
  };
  let created = true;
  if (a.dedupeKey) {
    const existing = await prisma.alert.findUnique({ where: { dedupeKey: a.dedupeKey } });
    if (existing) {
      created = false;
      if (existing.status === "RESOLVED") {
        // Re-open a previously resolved alert if the condition re-occurs
        await prisma.alert.update({ where: { id: existing.id }, data: { ...payload, status: "OPEN", resolvedAt: null, createdAt: new Date() } });
        created = true;
      } else {
        await prisma.alert.update({ where: { id: existing.id }, data: { message: a.message, data: payload.data } });
      }
    } else {
      await prisma.alert.create({ data: { ...payload, dedupeKey: a.dedupeKey } });
    }
  } else {
    await prisma.alert.create({ data: payload });
  }
  await publish({ t: "alert", e: a.encounterId, h: a.hospitalId ? [a.hospitalId] : undefined, a: a.ambulanceId ?? undefined, d: { type: a.type } });
  return created;
}

export async function resolveAlerts(where: Prisma.AlertWhereInput) {
  await prisma.alert.updateMany({ where: { ...where, status: { not: "RESOLVED" } }, data: { status: "RESOLVED", resolvedAt: new Date() } });
}

export function patientLabel(p: { isUnknown: boolean; temporaryId: string | null; fullName: string | null }) {
  return p.isUnknown ? p.temporaryId ?? "UNKNOWN" : p.fullName ?? p.temporaryId ?? "—";
}
