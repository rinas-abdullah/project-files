import "server-only";
import type { ArrivalPhase, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { bearing, geofencePhase, haversineMeters, remainingAlongRoute, type LatLng } from "@/lib/engines/geo";
import { getRouteProvider } from "@/lib/integrations/routing";
import { getHisAdapter } from "@/lib/integrations/his";
import { IntegrationUnavailableError, recordIntegrationResult } from "@/lib/integrations/registry";
import { emit, emitEncounter, notifyHospital, patientLabel, raiseAlert, refreshCompleteness, resolveAlerts, SYSTEM, timeline } from "./core";

/** ETA Engine: compute a route from the ambulance's GPS to the destination hospital. */
export async function planRoute(missionId: string, hospitalId: string) {
  const mission = await prisma.ambulanceMission.findUniqueOrThrow({ where: { id: missionId }, include: { ambulance: true } });
  const hospital = await prisma.hospital.findUniqueOrThrow({ where: { id: hospitalId } });
  const provider = await getRouteProvider();
  const route = await provider.route({ lat: mission.ambulance.lat, lng: mission.ambulance.lng }, { lat: hospital.lat, lng: hospital.lng }, { emergency: true });
  await prisma.ambulanceMission.update({
    where: { id: missionId },
    data: {
      routeJson: route.points as unknown as Prisma.InputJsonValue,
      routeIndex: 0,
      routeProvider: route.provider,
      etaSeconds: route.durationSeconds,
      distanceMeters: route.distanceMeters,
      etaUpdatedAt: new Date(),
      arrivalPhase: "EN_ROUTE",
    },
  });
  return route;
}

async function activeEncountersOf(missionId: string) {
  return prisma.patientEncounter.findMany({
    where: { missionId, status: { notIn: ["COMPLETED", "CANCELLED", "ARRIVED", "HANDOVER"] } },
    include: { patient: true, destinationHospital: true },
  });
}

/**
 * Apply a new ambulance position (from GPS or the route simulator), update ETA
 * and evaluate the hospital geofence.
 */
export async function applyPosition(missionId: string, pos: LatLng, opts: { routeIndex?: number; speedKmh?: number } = {}) {
  const mission = await prisma.ambulanceMission.findUniqueOrThrow({ where: { id: missionId }, include: { ambulance: true } });
  const encounters = await activeEncountersOf(missionId);
  const dest = encounters.find((e) => e.destinationHospital)?.destinationHospital ?? null;
  const points = (mission.routeJson as LatLng[] | null) ?? null;

  let routeIndex = opts.routeIndex ?? mission.routeIndex;
  if (opts.routeIndex == null && points?.length) {
    // Snap a raw GPS fix to the nearest route vertex ahead of the current index.
    let best = routeIndex;
    let bestD = Infinity;
    for (let i = routeIndex; i < points.length; i++) {
      const d = haversineMeters(pos, points[i]);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    routeIndex = best;
  }
  const remaining = points?.length ? remainingAlongRoute(points, routeIndex) : dest ? { distanceMeters: Math.round(haversineMeters(pos, dest) * 1.32), etaSeconds: 0 } : null;
  if (remaining && !points?.length && dest) remaining.etaSeconds = Math.round(remaining.distanceMeters / (58 / 3.6));

  const heading = bearing({ lat: mission.ambulance.lat, lng: mission.ambulance.lng }, pos);
  await prisma.$transaction([
    prisma.ambulance.update({
      where: { id: mission.ambulanceId },
      data: { lat: pos.lat, lng: pos.lng, heading: Number.isFinite(heading) ? heading : mission.ambulance.heading, speedKmh: opts.speedKmh ?? mission.ambulance.speedKmh, lastPositionAt: new Date() },
    }),
    prisma.ambulanceMission.update({
      where: { id: missionId },
      data: { routeIndex, etaSeconds: remaining?.etaSeconds ?? mission.etaSeconds, distanceMeters: remaining?.distanceMeters ?? mission.distanceMeters, etaUpdatedAt: new Date() },
    }),
  ]);

  if (dest) {
    const distanceToHospital = haversineMeters(pos, dest);
    const phase = geofencePhase(distanceToHospital, dest, mission.arrivalPhase as ArrivalPhase);
    if (phase !== mission.arrivalPhase) await onPhaseChange(missionId, phase);
    if (remaining && remaining.etaSeconds <= 300 && phase !== "ARRIVED") {
      for (const e of encounters.filter((x) => x.preAlertSentAt)) {
        await raiseAlert({
          type: "ETA_UNDER_5",
          severity: "INFO",
          message: `${e.code} · ${patientLabel(e.patient)} · ETA ${Math.max(1, Math.round(remaining.etaSeconds / 60))} min`,
          encounterId: e.id,
          hospitalId: dest.id,
          ambulanceId: mission.ambulanceId,
          dedupeKey: `ETA5:${e.id}:${dest.id}`,
        });
      }
    }
  }
  await emit({
    t: "position",
    a: mission.ambulanceId,
    o: [mission.ambulance.organizationId],
    h: dest ? [dest.id] : undefined,
    d: { lat: pos.lat, lng: pos.lng, eta: remaining?.etaSeconds ?? null },
  });
}

/** Geofence transitions: EN_ROUTE → APPROACHING → ARRIVING → ARRIVED. */
async function onPhaseChange(missionId: string, phase: ArrivalPhase) {
  await prisma.ambulanceMission.update({ where: { id: missionId }, data: { arrivalPhase: phase } });
  const encounters = await activeEncountersOf(missionId);
  const now = new Date();
  for (const e of encounters) {
    if (phase === "APPROACHING" || phase === "ARRIVING") {
      if (!e.approachingAt) {
        await prisma.patientEncounter.update({
          where: { id: e.id },
          data: { approachingAt: now, ...(e.preAlertSentAt && e.status !== "DIVERTED" ? { status: "APPROACHING" } : {}) },
        });
        await timeline(e.id, "APPROACHING", SYSTEM, { hospital: e.destinationHospital?.name });
      }
    }
    if (phase === "ARRIVING" && !e.geofenceEnteredAt) {
      await prisma.patientEncounter.update({ where: { id: e.id }, data: { geofenceEnteredAt: now } });
      await timeline(e.id, "GEOFENCE_ENTERED", SYSTEM, { hospital: e.destinationHospital?.name });
      await raiseAlert({
        type: "GEOFENCE_ENTERED",
        severity: e.priority === "P1" ? "CRITICAL" : "WARNING",
        message: `${e.code} · ${patientLabel(e.patient)} · ${e.priority} · ARRIVING`,
        encounterId: e.id,
        hospitalId: e.destinationHospitalId,
        dedupeKey: `GEOFENCE:${e.id}:${e.destinationHospitalId}`,
      });
      if (e.destinationHospitalId)
        await notifyHospital(e.destinationHospitalId, { type: "ARRIVAL", title: "AMBULANCE_ARRIVING", body: `${e.code} · ${patientLabel(e.patient)} · ${e.priority}`, link: `/cases/${e.id}`, encounterId: e.id });
      await runAutoRegistration(e.id);
    }
    await emitEncounter(e.id, "phase", { phase });
  }
  if (phase === "ARRIVED") await markArrived(missionId);
}

/**
 * Auto-registration workflow:
 * identity known + destination + encounter data complete + geofence entry
 *   → PRE_REGISTRATION_READY → REGISTRATION_SENT → CONFIRMED / FAILED (Mock HIS).
 */
export async function runAutoRegistration(encounterId: string) {
  const e = await prisma.patientEncounter.findUniqueOrThrow({
    where: { id: encounterId },
    include: { patient: true, destinationHospital: true, vitals: { select: { type: true }, distinct: ["type"] } },
  });
  if (["REGISTRATION_SENT", "REGISTRATION_CONFIRMED"].includes(e.registrationStatus)) return;
  const dataComplete = !!e.chiefComplaint && e.vitals.length >= 2;
  if (e.patient.isUnknown || !e.destinationHospital || !dataComplete) {
    await timeline(encounterId, "REGISTRATION_UPDATED", SYSTEM, {
      status: "NOT_STARTED",
      reason: e.patient.isUnknown ? "IDENTITY_UNKNOWN" : !e.destinationHospital ? "NO_DESTINATION" : "INCOMPLETE_DATA",
    });
    return;
  }
  await prisma.patientEncounter.update({ where: { id: encounterId }, data: { registrationStatus: "PRE_REGISTRATION_READY" } });
  await timeline(encounterId, "REGISTRATION_UPDATED", SYSTEM, { status: "PRE_REGISTRATION_READY" });
  let his;
  try {
    his = await getHisAdapter();
  } catch (err) {
    if (err instanceof IntegrationUnavailableError) {
      await prisma.patientEncounter.update({ where: { id: encounterId }, data: { registrationStatus: "REGISTRATION_FAILED" } });
      await timeline(encounterId, "REGISTRATION_UPDATED", SYSTEM, { status: "REGISTRATION_FAILED", reason: "HIS_NOT_CONNECTED" });
      return;
    }
    throw err;
  }
  await prisma.patientEncounter.update({ where: { id: encounterId }, data: { registrationStatus: "REGISTRATION_SENT" } });
  await timeline(encounterId, "REGISTRATION_UPDATED", SYSTEM, { status: "REGISTRATION_SENT", system: his.name });
  const res = await his.preRegister({
    encounterCode: e.code,
    hospitalCode: e.destinationHospital.code,
    patientName: e.patient.fullName ?? "",
    sex: e.patient.sex,
    age: e.patient.age,
    nationalIdLast4: e.patient.nationalIdLast4,
    chiefComplaint: e.chiefComplaint,
    priority: e.priority,
  });
  await recordIntegrationResult("HIS", res.status === "REGISTRATION_FAILED" ? res.message : undefined);
  await prisma.patientEncounter.update({ where: { id: encounterId }, data: { registrationStatus: res.status, registrationRef: res.reference ?? null } });
  await timeline(encounterId, "REGISTRATION_UPDATED", SYSTEM, { status: res.status, reference: res.reference, message: res.message });
}

export async function markArrived(missionId: string) {
  const mission = await prisma.ambulanceMission.findUniqueOrThrow({ where: { id: missionId }, include: { ambulance: true } });
  const encounters = await activeEncountersOf(missionId);
  const dest = encounters.find((e) => e.destinationHospital)?.destinationHospital;
  const now = new Date();
  await prisma.$transaction([
    prisma.ambulanceMission.update({
      where: { id: missionId },
      data: { status: "ARRIVED", arrivedAt: mission.arrivedAt ?? now, arrivalPhase: "ARRIVED", etaSeconds: 0, distanceMeters: 0, etaUpdatedAt: now },
    }),
    prisma.ambulance.update({
      where: { id: mission.ambulanceId },
      data: { status: "AT_HOSPITAL", speedKmh: 0, ...(dest ? { lat: dest.lat, lng: dest.lng } : {}), lastPositionAt: now },
    }),
  ]);
  for (const e of encounters) {
    if (!e.geofenceEnteredAt) await runAutoRegistration(e.id);
    await prisma.patientEncounter.update({ where: { id: e.id }, data: { status: "ARRIVED", arrivedAt: now, approachingAt: e.approachingAt ?? now, geofenceEnteredAt: e.geofenceEnteredAt ?? now } });
    await timeline(e.id, "ARRIVED", SYSTEM, { hospital: e.destinationHospital?.name });
    await resolveAlerts({ encounterId: e.id, type: { in: ["ETA_UNDER_5", "GEOFENCE_ENTERED", "NO_HOSPITAL_ACK"] } });
    if (e.destinationHospitalId)
      await notifyHospital(e.destinationHospitalId, { type: "ARRIVAL", title: "AMBULANCE_ARRIVED", body: `${e.code} · ${patientLabel(e.patient)} · ${mission.ambulance.callSign}`, link: `/cases/${e.id}`, encounterId: e.id });
    await refreshCompleteness(e.id);
    await emitEncounter(e.id, "arrived");
  }
  await emit({ t: "mission", a: mission.ambulanceId, o: [mission.ambulance.organizationId] });
}

/** Advance a transporting ambulance N vertices along its planned route. */
export async function stepAlongRoute(missionId: string, steps = 1) {
  const mission = await prisma.ambulanceMission.findUnique({ where: { id: missionId } });
  if (!mission || mission.status !== "TRANSPORTING") return { done: true };
  const points = (mission.routeJson as LatLng[] | null) ?? [];
  if (!points.length) return { done: true };
  const idx = Math.min(points.length - 1, mission.routeIndex + steps);
  await applyPosition(missionId, points[idx], { routeIndex: idx, speedKmh: 45 + Math.round(Math.random() * 25) });
  const after = await prisma.ambulanceMission.findUnique({ where: { id: missionId } });
  if (idx >= points.length - 1 && after?.status === "TRANSPORTING") {
    await onPhaseChange(missionId, "ARRIVED");
    return { done: true };
  }
  return { done: after?.status !== "TRANSPORTING" };
}

/** Jump to just inside the hospital geofence (demo control). */
export async function jumpToGeofence(missionId: string) {
  const mission = await prisma.ambulanceMission.findUniqueOrThrow({ where: { id: missionId } });
  const encounters = await activeEncountersOf(missionId);
  const dest = encounters.find((e) => e.destinationHospital)?.destinationHospital;
  const points = (mission.routeJson as LatLng[] | null) ?? [];
  if (!dest || !points.length) return;
  let idx = mission.routeIndex;
  for (let i = mission.routeIndex; i < points.length; i++) {
    idx = i;
    if (haversineMeters(points[i], dest) <= dest.geofenceRadiusM * 0.9) break;
  }
  await applyPosition(missionId, points[idx], { routeIndex: idx, speedKmh: 25 });
}

/** Periodic operational sweep: missing acknowledgments and long handovers. */
export async function operationalSweep() {
  const ackTimeoutMin = Number(process.env.ACK_TIMEOUT_MIN ?? 3);
  const handoverLimitMin = Number(process.env.HANDOVER_LIMIT_MIN ?? 20);
  const noAck = await prisma.patientEncounter.findMany({
    where: { status: { in: ["PRE_ALERT_SENT", "DIVERTED"] }, acknowledgedAt: null, preAlertSentAt: { lte: new Date(Date.now() - ackTimeoutMin * 60_000) } },
    include: { patient: true, mission: true },
  });
  for (const e of noAck) {
    const mins = Math.round((Date.now() - e.preAlertSentAt!.getTime()) / 60000);
    await raiseAlert({
      type: "NO_HOSPITAL_ACK",
      severity: e.priority === "P1" ? "CRITICAL" : "WARNING",
      message: `${e.code} · ${patientLabel(e.patient)} · ${mins} min`,
      encounterId: e.id,
      hospitalId: e.destinationHospitalId,
      ambulanceId: e.mission.ambulanceId,
      dedupeKey: `NOACK:${e.id}:${e.destinationHospitalId}`,
    });
  }
  const longHandover = await prisma.patientEncounter.findMany({
    where: { status: { in: ["ARRIVED", "HANDOVER"] }, arrivedAt: { lte: new Date(Date.now() - handoverLimitMin * 60_000) } },
    include: { patient: true, mission: true },
  });
  for (const e of longHandover) {
    await raiseAlert({
      type: "LONG_HANDOVER",
      severity: "WARNING",
      message: `${e.code} · ${patientLabel(e.patient)} · ${Math.round((Date.now() - e.arrivedAt!.getTime()) / 60000)} min`,
      encounterId: e.id,
      hospitalId: e.destinationHospitalId,
      ambulanceId: e.mission.ambulanceId,
      dedupeKey: `LONGHO:${e.id}`,
    });
  }
  return { noAck: noAck.length, longHandover: longHandover.length };
}

export { refreshCompleteness };
