import "server-only";
import { z } from "zod";
import { db } from "../db";
import { audit } from "../audit";
import { ConflictError, requirePermission, ValidationError, type Actor } from "../auth/rbac";
import { definitionOf, getSessionForActor } from "./simulation";
import { groundTruth } from "@/domain/engine/simulation";
import type { SimState } from "@/domain/engine/types";
import { InvestigationSubmissionSchema, scoreInvestigation } from "@/domain/forensics/scoring";
import { computeReadiness, updateLevel } from "@/domain/readiness/scoring";
import { rankScenarios, type CandidateScenario } from "@/domain/recommend/engine";
import type { Prisma } from "@/generated/prisma/client";

/** Ranks published scenarios for the actor from their persisted profile and history. */
export async function computeRecommendations(actor: Pick<Actor, "userId" | "orgId">, tx: Prisma.TransactionClient = db) {
  const [scenarios, profile, recentScores, recentSessions, competencies] = await Promise.all([
    tx.scenario.findMany({ where: { status: "PUBLISHED", OR: [{ orgId: null }, { orgId: actor.orgId }] }, include: { competencies: { include: { competency: true } } } }),
    tx.behavioralProfile.findMany({ where: { userId: actor.userId, orgId: actor.orgId } }),
    tx.readinessScore.findMany({ where: { userId: actor.userId, orgId: actor.orgId }, orderBy: { createdAt: "desc" }, take: 3, select: { overall: true } }),
    tx.simulationSession.findMany({ where: { userId: actor.userId, orgId: actor.orgId, phase: "COMPLETED" }, orderBy: { completedAt: "desc" }, take: 5, include: { scenario: { select: { key: true } } } }),
    tx.competency.findMany(),
  ]);
  const candidates: CandidateScenario[] = scenarios.map((s) => ({
    id: s.id,
    key: s.key,
    titleAr: s.titleAr,
    difficulty: s.difficulty,
    competencies: Object.fromEntries(s.competencies.map((c) => [c.competency.key, c.weight])),
  }));
  const ranked = rankScenarios(candidates, {
    overallReadiness: recentScores.length ? recentScores.reduce((a, r) => a + r.overall, 0) / recentScores.length : null,
    levels: Object.fromEntries(profile.map((p) => [p.competencyKey, p.level])),
    recentScenarioKeys: recentSessions.map((s) => s.scenario.key),
    competencyNames: Object.fromEntries(competencies.map((c) => [c.key, c.nameAr])),
  });
  return ranked.map((r) => ({ ...r, scenario: scenarios.find((s) => s.id === r.scenarioId)! }));
}

export async function submitInvestigation(actor: Actor, sessionId: string, input: unknown) {
  requirePermission(actor, "simulation:run");
  const parsed = InvestigationSubmissionSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError("invalid-input", z.flattenError(parsed.error).fieldErrors as Record<string, string[]>);
  const session = await getSessionForActor(actor, sessionId, { write: true });
  if (session.phase !== "FORENSICS") throw new ConflictError(session.phase === "COMPLETED" ? "already-submitted" : "not-in-forensics");
  const def = definitionOf(session.scenario);
  const state = session.state as unknown as SimState;
  const [evidence, actions] = await Promise.all([
    db.evidenceRecord.findMany({ where: { sessionId }, select: { key: true } }),
    db.defenderAction.findMany({ where: { sessionId }, orderBy: { seq: "asc" } }),
  ]);
  const truth = groundTruth(def, state);
  const investigation = scoreInvestigation(parsed.data, truth, evidence.map((e) => e.key));
  const compromised = truth.compromisedAssets;
  const readiness = computeReadiness({
    outcome: state.outcome ?? "timeout",
    endMinute: state.minute,
    timeBudget: def.timeBudget,
    objective: state.adversary.objective,
    actions: actions.map((a) => ({ kind: a.kind, competency: a.competency, effective: a.effective, disruptive: a.disruptive, productive: a.productive, valid: a.valid })),
    hintsUsed: state.hintsUsed,
    falseContainmentClaims: state.falseContainmentClaims,
    compromisedAssets: compromised.length,
    imagedCompromisedAssets: compromised.filter((a) => state.assets[a]?.imaged).length,
    investigation,
  });

  const result = await db.$transaction(async (tx) => {
    const moved = await tx.simulationSession.updateMany({ where: { id: sessionId, phase: "FORENSICS" }, data: { phase: "COMPLETED", completedAt: new Date() } });
    if (moved.count !== 1) throw new ConflictError("already-submitted");
    await tx.investigationReport.create({
      data: { sessionId, submission: parsed.data as Prisma.InputJsonValue, score: investigation as unknown as Prisma.InputJsonValue, total: investigation.total },
    });
    const score = await tx.readinessScore.create({
      data: {
        sessionId,
        userId: actor.userId,
        orgId: actor.orgId,
        overall: readiness.overall,
        speed: readiness.speed.score,
        accuracy: readiness.accuracy.score,
        independence: readiness.independence.score,
        completeness: readiness.completeness.score,
        evidence: { speed: readiness.speed, accuracy: readiness.accuracy, independence: readiness.independence, completeness: readiness.completeness, competencies: readiness.competencies } as unknown as Prisma.InputJsonValue,
        methodologyVersion: readiness.methodologyVersion,
      },
    });
    for (const [key, c] of Object.entries(readiness.competencies)) {
      const prev = await tx.behavioralProfile.findUnique({ where: { userId_orgId_competencyKey: { userId: actor.userId, orgId: actor.orgId, competencyKey: key } } });
      const level = updateLevel(prev?.level ?? null, prev?.samples ?? 0, c.score);
      await tx.behavioralProfile.upsert({
        where: { userId_orgId_competencyKey: { userId: actor.userId, orgId: actor.orgId, competencyKey: key } },
        create: { userId: actor.userId, orgId: actor.orgId, competencyKey: key, level, samples: 1 },
        update: { level, samples: { increment: 1 } },
      });
    }
    // Close the loop: the updated profile drives the next recommendation.
    await tx.trainingRecommendation.updateMany({ where: { userId: actor.userId, orgId: actor.orgId, status: "OPEN" }, data: { status: "DISMISSED" } });
    const ranked = await computeRecommendations(actor, tx);
    const top = ranked[0];
    let recommendationId: string | null = null;
    if (top) {
      const rec = await tx.trainingRecommendation.create({
        data: {
          userId: actor.userId,
          orgId: actor.orgId,
          scenarioId: top.scenarioId,
          sourceSessionId: sessionId,
          score: top.score,
          targetDifficulty: top.targetDifficulty,
          focusCompetencies: top.focusCompetencies,
          rationale: { reasonsAr: top.reasonsAr, components: top.components, alternatives: ranked.slice(1, 3).map((r) => ({ key: r.scenarioKey, score: r.score })) },
        },
      });
      recommendationId = rec.id;
    }
    await tx.notification.createMany({
      data: [
        { userId: actor.userId, orgId: actor.orgId, kind: "readiness.report", title: "تقرير الجاهزية جاهز", body: `${session.scenario.titleAr}: مؤشر الجاهزية ${readiness.overall.toFixed(1)}`, href: `/app/sessions/${sessionId}` },
        ...(top ? [{ userId: actor.userId, orgId: actor.orgId, kind: "recommendation.new", title: "تدريب مقترح جديد", body: top.scenario.titleAr, href: "/app" }] : []),
      ],
    });
    await audit({ action: "simulation.completed", orgId: actor.orgId, userId: actor.userId, targetType: "simulation", targetId: sessionId, meta: { overall: readiness.overall, investigation: investigation.total } }, tx);
    return { readinessId: score.id, recommendationId };
  });
  return { investigation, readiness, ...result };
}
