import "server-only";
import { db } from "../db";
import { audit } from "../audit";
import { requirePermission, type Actor } from "../auth/rbac";
import { computeRecommendations } from "./assessment";

/** Every number on the Command Center is derived from the actor's persisted data. */
export async function commandCenter(actor: Actor) {
  const where = { userId: actor.userId, orgId: actor.orgId };
  const [scores, profile, competencies, active, openRec, recentEvents, reports, completed] = await Promise.all([
    db.readinessScore.findMany({ where, orderBy: { createdAt: "asc" }, include: { session: { include: { scenario: { select: { titleAr: true } } } } } }),
    db.behavioralProfile.findMany({ where, orderBy: { level: "asc" } }),
    db.competency.findMany(),
    db.simulationSession.findMany({ where: { ...where, phase: { in: ["SIMULATION", "FORENSICS"] } }, orderBy: { startedAt: "desc" }, include: { scenario: { select: { titleAr: true, difficulty: true } } } }),
    db.trainingRecommendation.findFirst({ where: { ...where, status: "OPEN" }, orderBy: { createdAt: "desc" }, include: { scenario: true } }),
    db.simulationEvent.findMany({
      where: { session: where, kind: { in: ["session.started", "session.contained", "session.breached", "session.timeout", "siem.alert"] } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { session: { select: { id: true, scenario: { select: { titleAr: true } } } } },
    }),
    db.investigationReport.findMany({ where: { session: where }, select: { total: true } }),
    db.simulationSession.findMany({ where: { ...where, phase: "COMPLETED" }, select: { outcome: true, simMinute: true } }),
  ]);
  const names = Object.fromEntries(competencies.map((c) => [c.key, c.nameAr]));
  const latest = scores.at(-1) ?? null;
  const contained = completed.filter((c) => c.outcome === "CONTAINED");
  // New learners get a computed starting point (not persisted, labelled as such in the UI).
  const starter = openRec ? null : (await computeRecommendations(actor))[0] ?? null;
  return {
    latest,
    history: scores.map((s) => ({ id: s.sessionId, at: s.createdAt, overall: s.overall, title: s.session.scenario.titleAr })),
    dimensionsAvg: scores.length
      ? {
          speed: avg(scores.map((s) => s.speed)),
          accuracy: avg(scores.map((s) => s.accuracy)),
          independence: avg(scores.map((s) => s.independence)),
          completeness: avg(scores.map((s) => s.completeness)),
        }
      : null,
    profile: profile.map((p) => ({ key: p.competencyKey, name: names[p.competencyKey] ?? p.competencyKey, level: p.level, samples: p.samples })),
    active,
    openRec,
    starter,
    recentEvents,
    investigationAccuracy: reports.length ? avg(reports.map((r) => r.total)) : null,
    investigations: reports.length,
    containment: { completed: completed.length, contained: contained.length, avgMinute: contained.length ? avg(contained.map((c) => c.simMinute)) : null },
  };
}

function avg(xs: number[]) {
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

/** Team readiness aggregation (tenant-scoped). */
export async function teamOverview(actor: Actor) {
  requirePermission(actor, "team:view");
  const members = await db.membership.findMany({ where: { orgId: actor.orgId }, include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "asc" } });
  const scores = await db.readinessScore.findMany({ where: { orgId: actor.orgId }, orderBy: { createdAt: "desc" } });
  const profiles = await db.behavioralProfile.findMany({ where: { orgId: actor.orgId } });
  const competencies = await db.competency.findMany();
  await audit({ action: "team.view", orgId: actor.orgId, userId: actor.userId });
  const rows = members.map((m) => {
    const mine = scores.filter((s) => s.userId === m.userId);
    return {
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      sessions: mine.length,
      latest: mine[0]?.overall ?? null,
      average: mine.length ? avg(mine.map((s) => s.overall)) : null,
    };
  });
  const teamCompetencies = competencies
    .map((c) => {
      const ps = profiles.filter((p) => p.competencyKey === c.key);
      return { key: c.key, name: c.nameAr, average: ps.length ? avg(ps.map((p) => p.level)) : null, learners: ps.length };
    })
    .filter((c) => c.average !== null)
    .sort((a, b) => a.average! - b.average!);
  return { rows, teamCompetencies, teamAverage: scores.length ? avg(scores.map((s) => s.overall)) : null };
}

export async function listNotifications(actor: Actor) {
  return db.notification.findMany({ where: { userId: actor.userId, orgId: actor.orgId }, orderBy: { createdAt: "desc" }, take: 50 });
}

export async function unreadCount(actor: Actor) {
  return db.notification.count({ where: { userId: actor.userId, orgId: actor.orgId, readAt: null } });
}

export async function markNotificationsRead(actor: Actor, ids?: string[]) {
  return db.notification.updateMany({
    where: { userId: actor.userId, orgId: actor.orgId, readAt: null, ...(ids ? { id: { in: ids } } : {}) },
    data: { readAt: new Date() },
  });
}

export async function sessionHistory(actor: Actor) {
  return db.simulationSession.findMany({
    where: { userId: actor.userId, orgId: actor.orgId },
    orderBy: { startedAt: "desc" },
    take: 50,
    include: { scenario: { select: { titleAr: true, difficulty: true } }, readiness: { select: { overall: true } } },
  });
}

export async function auditTrail(actor: Actor) {
  requirePermission(actor, "audit:view");
  return db.auditLog.findMany({ where: { orgId: actor.orgId }, orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { name: true } } } });
}
