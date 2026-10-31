import { z } from "zod";
import { route } from "@/lib/api";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { ApiError, emit, scopedEncounter, type Actor } from "@/lib/services/core";
import {
  acknowledge,
  acceptHandover,
  addVitals,
  completeHandover,
  identifyPatient,
  recommendDestination,
  recordMedia,
  releaseAmbulance,
  runTriage,
  startHandover,
  updateCondition,
  updateResource,
} from "@/lib/services/encounters";
import { jumpToGeofence, markArrived, stepAlongRoute } from "@/lib/services/movement";
import { startDrive, startMonitor, stopDrive, stopMonitor } from "@/lib/services/simulation";
import { storeMedia } from "@/lib/media";
import { sceneImage } from "@/lib/png";

const schema = z.object({
  action: z.enum(["move", "drive_start", "drive_stop", "delay", "vital", "condition", "upload_image", "identify", "ack", "resource", "triage", "destination", "geofence", "arrive", "handover", "release", "monitor_start", "monitor_stop"]),
  encounterId: z.string().min(1),
  steps: z.number().int().min(1).max(50).optional(),
  minutes: z.number().int().min(1).max(30).optional(),
  trend: z.enum(["STABLE", "IMPROVING", "DETERIORATING", "CRITICAL"]).optional(),
  resourceType: z.enum(["CT_STATUS", "CATH_LAB", "OR_STATUS", "ICU_BEDS", "TRAUMA_BAY", "AVAILABLE_BEDS", "ED_CAPACITY", "SPECIALISTS"]).optional(),
});

/** Act as the destination hospital's staff for demo-only hospital-side actions. */
async function hospitalActor(hospitalId: string): Promise<Actor> {
  const u = await prisma.user.findFirst({ where: { hospitalId, active: true, role: { in: ["ED_NURSE", "ED_ADMIN", "ED_DOCTOR"] } }, include: { organization: true }, orderBy: { role: "desc" } });
  if (!u) throw new ApiError(409, "INVALID_STATE", "No hospital user");
  return { id: u.id, name: u.name, email: u.email, role: u.role, organizationId: u.organizationId, orgType: u.organization.type, hospitalId: u.hospitalId, ambulanceId: null };
}

/** Demo Simulation Panel — every action runs through the same services as the real UI and is audited. */
export const POST = route<z.infer<typeof schema>>({ permission: "demo:run", schema }, async ({ user, body }) => {
  const enc = await scopedEncounter(user, body.encounterId);
  const missionId = enc.missionId;
  const hosp = enc.destinationHospitalId;
  const needHosp = () => {
    if (!hosp) throw new ApiError(409, "NO_DESTINATION");
    return hosp;
  };
  let result: unknown = { ok: true };
  switch (body.action) {
    case "move":
      result = await stepAlongRoute(missionId, body.steps ?? 5);
      break;
    case "drive_start":
      startDrive(missionId, body.steps ?? 2);
      break;
    case "drive_stop":
      stopDrive(missionId);
      break;
    case "delay": {
      const m = await prisma.ambulanceMission.update({ where: { id: missionId }, data: { etaSeconds: { increment: (body.minutes ?? 3) * 60 }, etaUpdatedAt: new Date() }, include: { ambulance: true } });
      await emit({ t: "position", a: m.ambulanceId, o: [m.ambulance.organizationId], h: hosp ? [hosp] : undefined, d: { eta: m.etaSeconds } });
      result = { etaSeconds: m.etaSeconds };
      break;
    }
    case "vital": {
      const last = await prisma.vitalSign.findMany({ where: { encounterId: enc.id }, orderBy: { recordedAt: "desc" }, take: 20 });
      const lv = (t: string, d: number) => last.find((v) => v.type === t)?.value ?? d;
      const j = (n: number) => Math.round(n + (Math.random() - 0.5) * 6);
      const sys = j(lv("BLOOD_PRESSURE", 125));
      await addVitals({ system: true, name: "Demo Simulation" }, enc.id, [
        { type: "HEART_RATE", value: j(lv("HEART_RATE", 95)) },
        { type: "BLOOD_PRESSURE", value: sys, value2: Math.min(sys - 20, j(last.find((v) => v.type === "BLOOD_PRESSURE")?.value2 ?? 80)) },
        { type: "SPO2", value: Math.min(100, Math.max(70, j(lv("SPO2", 96)))) },
        { type: "RESPIRATORY_RATE", value: Math.max(6, j(lv("RESPIRATORY_RATE", 18))) },
      ], "SIMULATED");
      break;
    }
    case "condition":
      await updateCondition(user, enc.id, { trend: body.trend ?? "DETERIORATING", note: "Demo simulation" });
      break;
    case "upload_image": {
      const img = sceneImage(Math.floor(Math.random() * 5));
      const key = await storeMedia(enc.id, img, "png");
      await recordMedia(user, enc.id, { kind: "IMAGE", category: "SCENE", mimeType: "image/png", sizeBytes: img.length, storageKey: key, originalName: "demo-scene.png", caption: "Synthetic demo scene image" });
      break;
    }
    case "identify":
      result = await identifyPatient(user, enc.id, { nationalId: `1${Math.floor(1e8 + Math.random() * 8.9e8)}`, method: "NATIONAL_ID" });
      break;
    case "ack":
      await acknowledge(await hospitalActor(needHosp()), enc.id, "Demo simulation");
      break;
    case "resource": {
      const h = needHosp();
      const type = body.resourceType ?? "CT_STATUS";
      const cur = await prisma.hospitalResource.findUnique({ where: { hospitalId_type: { hospitalId: h, type } } });
      await updateResource(await hospitalActor(h), h, { type, status: cur?.status === "UNAVAILABLE" ? "AVAILABLE" : "UNAVAILABLE", available: cur?.available, total: cur?.total, note: "Demo simulation" });
      break;
    }
    case "triage":
      result = await runTriage(user, enc.id);
      break;
    case "destination":
      result = await recommendDestination(user, enc.id);
      break;
    case "geofence":
      await jumpToGeofence(missionId);
      break;
    case "arrive":
      stopDrive(missionId);
      await markArrived(missionId);
      break;
    case "handover": {
      const actor = await hospitalActor(needHosp());
      const fresh = await prisma.patientEncounter.findUniqueOrThrow({ where: { id: enc.id }, include: { handover: true } });
      if (fresh.status === "ARRIVED") await startHandover(user, enc.id);
      const h = await prisma.handover.findUnique({ where: { encounterId: enc.id } });
      if (h?.status === "STARTED") await acceptHandover(actor, enc.id);
      const h2 = await prisma.handover.findUnique({ where: { encounterId: enc.id } });
      if (h2?.status === "ACCEPTED") await completeHandover(actor, enc.id, "Demo simulation");
      break;
    }
    case "release":
      await releaseAmbulance(user, missionId);
      break;
    case "monitor_start":
      await startMonitor(enc.id, (body.trend as "DETERIORATING") === "DETERIORATING" || !body.trend ? "DETERIORATING" : body.trend === "IMPROVING" ? "IMPROVING" : "STABLE");
      break;
    case "monitor_stop":
      stopMonitor(enc.id);
      break;
  }
  await audit({ id: user.id, email: user.email, role: user.role, organizationId: user.organizationId }, `demo.${body.action}`, "PatientEncounter", enc.id, undefined, { encounterId: enc.id });
  return result;
});
