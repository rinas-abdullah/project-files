import "server-only";
import { randomInt } from "node:crypto";
import { db } from "../db";
import { audit } from "../audit";
import { can, ConflictError, NotFoundError, requirePermission, ValidationError, type Actor } from "../auth/rbac";
import { applyCommand, forensicEvidence, startSimulation, type AdversaryTurn, type StepResult } from "@/domain/engine/simulation";
import type { LearnerProfile, ScenarioDefinition, SimEvent, SimState } from "@/domain/engine/types";
import type { Prisma } from "@/generated/prisma/client";

export function definitionOf(row: { definition: unknown }): ScenarioDefinition {
  const d = row.definition as ScenarioDefinition;
  if (!d || typeof d !== "object" || !Array.isArray(d.nodes) || !Array.isArray(d.assets)) throw new Error("invalid scenario definition");
  return d;
}

/** Published scenarios visible to the actor's organization (global catalog + org-private). */
export async function listScenarios(actor: Actor) {
  return db.scenario.findMany({
    where: { status: "PUBLISHED", OR: [{ orgId: null }, { orgId: actor.orgId }] },
    include: { competencies: { include: { competency: true } } },
    orderBy: [{ difficulty: "asc" }, { titleAr: "asc" }],
  });
}

export async function learnerProfile(userId: string, orgId: string): Promise<LearnerProfile> {
  const [rows, recent] = await Promise.all([
    db.behavioralProfile.findMany({ where: { userId, orgId } }),
    db.readinessScore.findMany({ where: { userId, orgId }, orderBy: { createdAt: "desc" }, take: 3, select: { overall: true } }),
  ]);
  return {
    overall: recent.length ? recent.reduce((s, r) => s + r.overall, 0) / recent.length / 100 : null,
    competencies: Object.fromEntries(rows.map((r) => [r.competencyKey, r.level])),
  };
}

function eventRows(sessionId: string, events: SimEvent[]): Prisma.SimulationEventCreateManyInput[] {
  return events.map((e) => ({ sessionId, seq: e.seq, simMinute: e.minute, actor: e.actor, kind: e.kind, message: e.messageAr, data: e.data as Prisma.InputJsonValue }));
}

async function nextAdversarySeq(tx: Prisma.TransactionClient, sessionId: string) {
  const last = await tx.adversaryAction.findFirst({ where: { sessionId }, orderBy: { seq: "desc" }, select: { seq: true } });
  return (last?.seq ?? 0) + 1;
}

function adversaryRows(sessionId: string, start: number, turns: AdversaryTurn[]): Prisma.AdversaryActionCreateManyInput[] {
  return turns.map((t, i) => ({
    sessionId,
    seq: start + i,
    nodeId: t.nodeId,
    technique: t.technique,
    tactic: t.tactic,
    target: t.target,
    simMinute: t.minute,
    rationale: t.rationale,
    approved: t.approved,
    guardianReason: t.guardianReason,
    considered: t.considered as Prisma.InputJsonValue,
  }));
}

function evidenceRows(sessionId: string, state: SimState, onlyKeys?: Set<string>): Prisma.EvidenceRecordCreateManyInput[] {
  return forensicEvidence(state)
    .filter((e) => !onlyKeys || onlyKeys.has(e.key))
    .map((e) => ({
      sessionId,
      key: e.key,
      asset: e.asset,
      source: e.source,
      content: e.line,
      simMinute: e.minute,
      acquiredVia: state.discovered.includes(e.key) ? "LIVE" : "IMAGE",
    }));
}

export async function startSession(actor: Actor, scenarioId: string) {
  requirePermission(actor, "simulation:run");
  const scenario = await db.scenario.findFirst({ where: { id: scenarioId, status: "PUBLISHED", OR: [{ orgId: null }, { orgId: actor.orgId }] } });
  if (!scenario) throw new NotFoundError("scenario");
  const def = definitionOf(scenario);
  const profile = await learnerProfile(actor.userId, actor.orgId);
  const seed = randomInt(1, 2 ** 31 - 1);
  const result = startSimulation(def, seed, profile);

  const session = await db.$transaction(async (tx) => {
    const s = await tx.simulationSession.create({
      data: {
        userId: actor.userId,
        orgId: actor.orgId,
        scenarioId: scenario.id,
        seed,
        state: result.state as unknown as Prisma.InputJsonValue,
        simMinute: result.state.minute,
      },
    });
    await tx.simulationEvent.createMany({ data: eventRows(s.id, result.events) });
    await tx.adversaryAction.createMany({ data: adversaryRows(s.id, 1, result.adversaryTurns) });
    await tx.trainingRecommendation.updateMany({
      where: { userId: actor.userId, orgId: actor.orgId, scenarioId: scenario.id, status: "OPEN" },
      data: { status: "STARTED" },
    });
    await audit({ action: "simulation.start", orgId: actor.orgId, userId: actor.userId, targetType: "simulation", targetId: s.id, meta: { scenario: scenario.key, seed } }, tx);
    return s;
  });
  return session;
}

/**
 * Loads a session within the actor's tenant. Owners can always read their own;
 * team viewers (instructor/manager/admin/auditor) can read any session in their org.
 * Sessions of other organizations are indistinguishable from non-existent ones.
 */
export async function getSessionForActor(actor: Actor, sessionId: string, opts: { write?: boolean } = {}) {
  const session = await db.simulationSession.findFirst({
    where: { id: sessionId, orgId: actor.orgId },
    include: { scenario: true, user: { select: { name: true } } },
  });
  if (!session) throw new NotFoundError("session");
  const own = session.userId === actor.userId;
  if (opts.write && !own) throw new NotFoundError("session");
  if (!own && !can(actor, "team:view")) throw new NotFoundError("session");
  return session;
}

export async function sessionView(actor: Actor, sessionId: string) {
  const session = await getSessionForActor(actor, sessionId);
  const [events, adversary, evidence, actions, report, readiness] = await Promise.all([
    db.simulationEvent.findMany({ where: { sessionId }, orderBy: { seq: "asc" } }),
    db.adversaryAction.findMany({ where: { sessionId }, orderBy: { seq: "asc" } }),
    db.evidenceRecord.findMany({ where: { sessionId }, orderBy: [{ simMinute: "asc" }, { key: "asc" }] }),
    db.defenderAction.findMany({ where: { sessionId }, orderBy: { seq: "asc" } }),
    db.investigationReport.findUnique({ where: { sessionId } }),
    db.readinessScore.findUnique({ where: { sessionId } }),
  ]);
  return { session, def: definitionOf(session.scenario), state: session.state as unknown as SimState, events, adversary, evidence, actions, report, readiness, isOwner: session.userId === actor.userId };
}

export type SessionView = Awaited<ReturnType<typeof sessionView>>;

export async function executeCommand(actor: Actor, sessionId: string, command: unknown) {
  requirePermission(actor, "simulation:run");
  if (typeof command !== "string" || command.length === 0 || command.length > 120) throw new ValidationError("invalid-command");
  const session = await getSessionForActor(actor, sessionId, { write: true });
  if (session.phase !== "SIMULATION") throw new ConflictError("simulation-ended");
  const def = definitionOf(session.scenario);
  const prev = session.state as unknown as SimState;
  const result = applyCommand(def, prev, command);
  if ("error" in result) throw new ValidationError(result.error);
  const now = new Date();
  const latencyMs = Math.min(2_147_000_000, now.getTime() - session.lastActionAt.getTime());
  await persistStep(actor, session.id, session.revision, prev, result, command, latencyMs, now);
  return result;
}

async function persistStep(actor: Actor, sessionId: string, revision: number, prev: SimState, r: StepResult, command: string, latencyMs: number, now: Date) {
  const s = r.state;
  const ended = s.phase !== "simulation";
  const newlyDiscovered = new Set(s.discovered.filter((k) => !prev.discovered.includes(k)));
  await db.$transaction(async (tx) => {
    // Optimistic concurrency: reject if another request advanced the session first.
    const updated = await tx.simulationSession.updateMany({
      where: { id: sessionId, revision, phase: "SIMULATION" },
      data: {
        state: s as unknown as Prisma.InputJsonValue,
        simMinute: s.minute,
        hintsUsed: s.hintsUsed,
        revision: { increment: 1 },
        lastActionAt: now,
        ...(ended ? { phase: "FORENSICS", outcome: s.outcome!.toUpperCase() as "CONTAINED" | "BREACHED" | "TIMEOUT", containedAt: now } : {}),
      },
    });
    if (updated.count !== 1) throw new ConflictError("concurrent-update");
    const lastDef = await tx.defenderAction.findFirst({ where: { sessionId }, orderBy: { seq: "desc" }, select: { seq: true } });
    const a = r.assessment;
    const parsedKind = command.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
    await tx.defenderAction.create({
      data: {
        sessionId,
        seq: (lastDef?.seq ?? 0) + 1,
        command: command.trim().slice(0, 120),
        kind: a?.kind ?? parsedKind,
        target: a?.target ?? null,
        simMinute: prev.minute,
        latencyMs,
        valid: a !== null,
        effective: a?.effective ?? false,
        disruptive: a?.disruptive ?? false,
        productive: a?.productive ?? false,
        competency: a?.competency ?? null,
        output: r.output,
      },
    });
    await tx.simulationEvent.createMany({ data: eventRows(sessionId, r.events) });
    if (r.adversaryTurns.length) await tx.adversaryAction.createMany({ data: adversaryRows(sessionId, await nextAdversarySeq(tx, sessionId), r.adversaryTurns) });
    // Persist evidence surfaced live; on transition to forensics also persist imaged evidence.
    const rows = ended ? evidenceRows(sessionId, s) : evidenceRows(sessionId, s, newlyDiscovered);
    if (rows.length) await tx.evidenceRecord.createMany({ data: rows, skipDuplicates: true });
    if (ended) {
      await audit({ action: "simulation.live_phase_ended", orgId: actor.orgId, userId: actor.userId, targetType: "simulation", targetId: sessionId, meta: { outcome: s.outcome, minute: s.minute } }, tx);
    }
  });
}
