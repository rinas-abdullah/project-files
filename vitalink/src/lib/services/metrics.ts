import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { CurrentUser } from "@/lib/session";
import { encounterScope } from "@/lib/scope";
import { mean, median, minutesBetween, pct, round1 } from "@/lib/engines/stats";

/** Analytics engine — every KPI is computed from database records (no hard-coded numbers). */
export async function loadEncounters(user: CurrentUser, from: Date, to: Date, extra: Prisma.PatientEncounterWhereInput = {}) {
  return prisma.patientEncounter.findMany({
    where: { AND: [encounterScope(user), { createdAt: { gte: from, lt: to } }, extra] },
    include: {
      patient: { select: { isUnknown: true } },
      mission: { include: { ambulance: { select: { id: true, callSign: true } }, incident: { select: { type: true } } } },
      destinationHospital: { select: { id: true, name: true, nameAr: true } },
      triage: { orderBy: { createdAt: "desc" }, take: 1 },
      recommendations: { orderBy: { createdAt: "desc" }, take: 1, include: { recommendedHospital: { select: { name: true } } } },
      destinationHistory: { select: { fromHospitalId: true, reason: true } },
      vitals: { select: { type: true }, distinct: ["type"] },
      _count: { select: { interventions: true, medications: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}
type Enc = Awaited<ReturnType<typeof loadEncounters>>[number];

const p90 = (v: number[]) => {
  const s = v.filter(Number.isFinite).sort((a, b) => a - b);
  return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * 0.9))] : null;
};
const nn = (v: (number | null)[]) => v.filter((x): x is number => x != null && x >= 0);

export const transportMin = (e: Enc) => minutesBetween(e.mission.departedAt, e.arrivedAt ?? e.mission.arrivedAt);
export const ackMin = (e: Enc) => minutesBetween(e.preAlertSentAt, e.acknowledgedAt);
export const arrivalToHandoverMin = (e: Enc) => minutesBetween(e.arrivedAt, e.handoverCompletedAt);
export const handoverDurationMin = (e: Enc) => minutesBetween(e.handoverStartedAt, e.handoverCompletedAt);
export const rtsMin = (e: Enc) => minutesBetween(e.handoverCompletedAt, e.mission.releasedAt);

export function elementFlags(e: Enc) {
  const types = e.vitals.map((v) => v.type);
  return {
    identity: !e.patient.isUnknown,
    chiefComplaint: e.chiefComplaint.trim().length >= 3,
    vitals: ["HEART_RATE", "BLOOD_PRESSURE", "SPO2"].every((v) => types.includes(v as never)),
    interventions: e._count.interventions > 0,
    medications: e._count.medications > 0,
    eta: e.mission.etaSeconds != null || !!e.arrivedAt,
    destination: !!e.destinationHospitalId,
    handover: !!e.handoverCompletedAt,
  };
}

export function overview(list: Enc[], from: Date, to: Date) {
  const days: { day: string; cases: number; critical: number }[] = [];
  for (let d = new Date(from); d < to; d = new Date(d.getTime() + 86400_000)) {
    const key = d.toISOString().slice(0, 10);
    const dayList = list.filter((e) => e.createdAt.toISOString().slice(0, 10) === key);
    days.push({ day: key.slice(5), cases: dayList.length, critical: dayList.filter((e) => e.priority === "P1").length });
  }
  const byPriority = (["P1", "P2", "P3", "P4"] as const).map((p) => ({ key: p, value: list.filter((e) => e.priority === p).length }));
  const types = [...new Set(list.map((e) => e.mission.incident.type))];
  const byType = types.map((ty) => ({ key: ty, value: list.filter((e) => e.mission.incident.type === ty).length })).sort((a, b) => b.value - a.value);
  const byHour = Array.from({ length: 24 }, (_, h) => ({ key: String(h).padStart(2, "0"), value: list.filter((e) => (e.createdAt.getUTCHours() + 3) % 24 === h).length }));
  return {
    cases: list.length,
    critical: list.filter((e) => e.priority === "P1").length,
    avgTransportMin: round1(mean(nn(list.map(transportMin)))),
    avgAckMin: round1(mean(nn(list.map(ackMin)))),
    avgHandoverMin: round1(mean(nn(list.map(arrivalToHandoverMin)))),
    avgRtsMin: round1(mean(nn(list.map(rtsMin)))),
    destinationChanges: list.filter((e) => e.destinationHistory.length > 0).length,
    resourceConstraints: list.filter((e) => e.readinessStatus === "LIMITED" || e.readinessStatus === "RESOURCE_CONSTRAINT").length,
    avgCompleteness: round1(mean(list.map((e) => e.completeness))),
    days,
    byPriority,
    byType,
    byHour,
  };
}

export function hospitalTable(list: Enc[], hospitals: { id: string; name: string; nameAr: string }[]) {
  return hospitals.map((h) => {
    const l = list.filter((e) => e.destinationHospitalId === h.id);
    return {
      id: h.id,
      name: h.name,
      nameAr: h.nameAr,
      incoming: l.length,
      avgAckMin: round1(mean(nn(l.map(ackMin)))),
      avgHandoverMin: round1(mean(nn(l.map(arrivalToHandoverMin)))),
      constraints: l.filter((e) => e.readinessStatus === "LIMITED" || e.readinessStatus === "RESOURCE_CONSTRAINT").length,
      diversions: list.filter((e) => e.destinationHistory.some((d) => d.fromHospitalId === h.id)).length,
      critical: l.filter((e) => e.priority === "P1").length,
      ackRate: pct(l.filter((e) => e.acknowledgedAt).length, l.filter((e) => e.preAlertSentAt).length),
    };
  });
}

export function ambulanceTable(list: Enc[]) {
  const ids = [...new Map(list.map((e) => [e.mission.ambulance.id, e.mission.ambulance.callSign])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  return ids.map(([id, callSign]) => {
    const l = list.filter((e) => e.mission.ambulance.id === id);
    return {
      id,
      callSign,
      cases: l.length,
      avgTransportMin: round1(mean(nn(l.map(transportMin)))),
      avgHandoverMin: round1(mean(nn(l.map(arrivalToHandoverMin)))),
      avgRtsMin: round1(mean(nn(l.map(rtsMin)))),
      completeness: round1(mean(l.map((e) => e.completeness))),
    };
  });
}

export function responseStages(list: Enc[]) {
  const stages: [string, (e: Enc) => number | null][] = [
    ["dispatchToScene", (e) => minutesBetween(e.mission.dispatchedAt, e.mission.onSceneAt)],
    ["sceneTime", (e) => minutesBetween(e.mission.onSceneAt, e.mission.departedAt)],
    ["transport", transportMin],
    ["prealertToAck", ackMin],
    ["arrivalToHandover", arrivalToHandoverMin],
    ["handoverDuration", handoverDurationMin],
    ["returnToService", rtsMin],
  ];
  return stages.map(([key, fn]) => {
    const v = nn(list.map(fn));
    return { key, n: v.length, median: round1(median(v)), p90: round1(p90(v)), mean: round1(mean(v)) };
  });
}

export function completenessBreakdown(list: Enc[]) {
  const flags = list.map(elementFlags);
  const keys = Object.keys(flags[0] ?? elementFlags({ patient: { isUnknown: true }, chiefComplaint: "", vitals: [], _count: { interventions: 0, medications: 0 }, mission: { etaSeconds: null }, arrivedAt: null, destinationHospitalId: null, handoverCompletedAt: null } as unknown as Enc)) as (keyof ReturnType<typeof elementFlags>)[];
  return {
    elements: keys.map((k) => ({ key: k, rate: pct(flags.filter((f) => f[k]).length, flags.length) })),
    distribution: [0, 25, 50, 75, 100].map((lo, i, arr) => ({ key: i === arr.length - 1 ? "100" : `${lo}-${arr[i + 1] - 1}`, value: list.filter((e) => (i === arr.length - 1 ? e.completeness === 100 : e.completeness >= lo && e.completeness < arr[i + 1])).length })),
    avg: round1(mean(list.map((e) => e.completeness))),
  };
}

export function triageStats(list: Enc[]) {
  const a = list.map((e) => e.triage[0]).filter(Boolean);
  const decided = a.filter((x) => x.decision !== "PENDING");
  const confirmed = decided.filter((x) => x.decision === "CONFIRMED").length;
  const overridden = decided.filter((x) => x.decision === "OVERRIDDEN");
  const num = (p: string | null) => (p ? Number(p.slice(1)) : 0);
  const matrix = (["P1", "P2", "P3", "P4"] as const).map((s) => ({
    suggested: s,
    ...Object.fromEntries((["P1", "P2", "P3", "P4"] as const).map((f) => [f, decided.filter((x) => x.suggestedPriority === s && x.finalPriority === f).length])),
  })) as { suggested: string; P1: number; P2: number; P3: number; P4: number }[];
  return {
    assessments: a.length,
    coverage: pct(a.length, list.length),
    confirmed,
    overridden: overridden.length,
    agreement: pct(confirmed, decided.length),
    avgConfidence: round1(mean(a.map((x) => x.confidence))),
    avgRisk: round1(mean(a.map((x) => x.riskScore))),
    upTriage: overridden.filter((x) => num(x.finalPriority) < num(x.suggestedPriority)).length,
    downTriage: overridden.filter((x) => num(x.finalPriority) > num(x.suggestedPriority)).length,
    matrix,
    reasons: overridden.map((x) => x.overrideReason).filter(Boolean).slice(0, 8) as string[],
  };
}

export function destinationStats(list: Enc[]) {
  const recs = list.map((e) => e.recommendations[0]).filter(Boolean);
  const decided = recs.filter((r) => r.status === "APPROVED" || r.status === "REJECTED");
  const top = new Map<string, number>();
  recs.forEach((r) => top.set(r.recommendedHospital.name, (top.get(r.recommendedHospital.name) ?? 0) + 1));
  const reasons = new Map<string, number>();
  list.flatMap((e) => e.destinationHistory).forEach((d) => reasons.set(d.reason, (reasons.get(d.reason) ?? 0) + 1));
  const followed = list.filter((e) => e.recommendations[0] && e.destinationHospitalId === e.recommendations[0].recommendedHospitalId).length;
  return {
    recommendations: recs.length,
    approvedRate: pct(decided.filter((r) => r.status === "APPROVED").length, decided.length),
    followedRate: pct(followed, recs.length),
    avgScore: round1(mean(recs.map((r) => r.score))),
    diversions: list.filter((e) => e.destinationHistory.length).length,
    diversionRate: pct(list.filter((e) => e.destinationHistory.length).length, list.length),
    top: [...top.entries()].map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value),
    reasons: [...reasons.entries()].map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value),
  };
}

export async function qualityStats(user: CurrentUser, list: Enc[], from: Date, to: Date) {
  const alertWhere: Prisma.AlertWhereInput = { severity: "CRITICAL", createdAt: { gte: from, lt: to }, acknowledgedAt: { not: null } };
  const critAlerts = await prisma.alert.findMany({ where: user.orgType === "HOSPITAL" ? { ...alertWhere, hospitalId: user.hospitalId } : alertWhere, select: { createdAt: true, acknowledgedAt: true } });
  const pre = list.filter((e) => e.preAlertSentAt);
  return {
    documentation: round1(mean(list.map((e) => e.completeness))) ?? 0,
    preArrivalRate: pct(pre.length, list.length),
    ackRate: pct(pre.filter((e) => e.acknowledgedAt).length, pre.length),
    handoverCompletionRate: pct(list.filter((e) => e.handoverCompletedAt).length, list.filter((e) => e.arrivedAt).length),
    criticalAlertResponseMin: round1(median(critAlerts.map((a) => (a.acknowledgedAt!.getTime() - a.createdAt.getTime()) / 60000))),
    diversionRate: pct(list.filter((e) => e.destinationHistory.length).length, list.length),
  };
}

export async function resourceStats(from: Date, to: Date) {
  const [hospitals, events] = await Promise.all([
    prisma.hospital.findMany({ include: { resources: true }, orderBy: { name: "asc" } }),
    prisma.alert.findMany({ where: { type: "RESOURCE_UNAVAILABLE", createdAt: { gte: from, lt: to } }, select: { hospitalId: true } }),
  ]);
  return hospitals.map((h) => ({
    id: h.id,
    name: h.name,
    nameAr: h.nameAr,
    resources: Object.fromEntries(h.resources.map((r) => [r.type, { status: r.status, available: r.available, total: r.total }])) as Record<string, { status: string; available: number | null; total: number | null }>,
    constraintEvents: events.filter((e) => e.hospitalId === h.id).length,
  }));
}

export async function usageStats(from: Date, to: Date) {
  const [logins, events] = await Promise.all([
    prisma.auditEvent.findMany({ where: { action: "auth.login", createdAt: { gte: from, lt: to } }, select: { userId: true } }),
    prisma.clinicalEvent.count({ where: { occurredAt: { gte: from, lt: to } } }),
  ]);
  return { logins: logins.length, activeUsers: new Set(logins.map((l) => l.userId)).size, events };
}

export function weekStart(d: Date) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay(); // Sunday-start week (KSA)
  x.setUTCDate(x.getUTCDate() - day);
  return x;
}

export async function weeklyReport(user: CurrentUser, start: Date) {
  const end = new Date(start.getTime() + 7 * 86400_000);
  const prevStart = new Date(start.getTime() - 7 * 86400_000);
  const [cur, prev, uCur, uPrev] = await Promise.all([loadEncounters(user, start, end), loadEncounters(user, prevStart, start), usageStats(start, end), usageStats(prevStart, start)]);
  const [qCur, qPrev] = await Promise.all([qualityStats(user, cur, start, end), qualityStats(user, prev, prevStart, start)]);
  const o = overview(cur, start, end);
  const op = overview(prev, prevStart, start);
  const rows: { key: string; cur: number | null; prev: number | null; unit: "" | "min" | "%" }[] = [
    { key: "cases", cur: o.cases, prev: op.cases, unit: "" },
    { key: "avgEta", cur: o.avgTransportMin, prev: op.avgTransportMin, unit: "min" },
    { key: "avgAck", cur: o.avgAckMin, prev: op.avgAckMin, unit: "min" },
    { key: "avgHandover", cur: o.avgHandoverMin, prev: op.avgHandoverMin, unit: "min" },
    { key: "returnToService", cur: o.avgRtsMin, prev: op.avgRtsMin, unit: "min" },
    { key: "criticalCases", cur: o.critical, prev: op.critical, unit: "" },
    { key: "destinationChanges", cur: o.destinationChanges, prev: op.destinationChanges, unit: "" },
    { key: "resourceConstraints", cur: o.resourceConstraints, prev: op.resourceConstraints, unit: "" },
    { key: "preArrivalRate", cur: qCur.preArrivalRate, prev: qPrev.preArrivalRate, unit: "%" },
    { key: "ackRate", cur: qCur.ackRate, prev: qPrev.ackRate, unit: "%" },
    { key: "documentationCompleteness", cur: qCur.documentation, prev: qPrev.documentation, unit: "%" },
    { key: "activeUsers", cur: uCur.activeUsers, prev: uPrev.activeUsers, unit: "" },
    { key: "logins", cur: uCur.logins, prev: uPrev.logins, unit: "" },
    { key: "eventsRecorded", cur: uCur.events, prev: uPrev.events, unit: "" },
  ];
  return { start, end, rows, days: o.days, hospitals: hospitalTable(cur, await prisma.hospital.findMany({ select: { id: true, name: true, nameAr: true }, orderBy: { name: "asc" } })) };
}
