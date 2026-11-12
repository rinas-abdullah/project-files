import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { executeCommand, getSessionForActor, sessionView, startSession } from "@/server/services/simulation";
import { submitInvestigation } from "@/server/services/assessment";
import { commandCenter, teamOverview } from "@/server/services/dashboard";
import { groundTruth } from "@/domain/engine/simulation";
import type { SimState } from "@/domain/engine/types";
import { addMember, newOrgAdmin, oracleCommands } from "../support/actors";
import { resetDb } from "../support/db";
import type { Actor } from "@/server/auth/rbac";

beforeEach(resetDb);

async function scenarioId(key: string) {
  return (await db.scenario.findFirstOrThrow({ where: { key } })).id;
}

async function playToForensics(actor: Actor, sessionId: string) {
  for (let i = 0; i < 15; i++) {
    const v = await sessionView(actor, sessionId);
    if (v.session.phase !== "SIMULATION") return v;
    for (const c of oracleCommands(v.def, v.state)) {
      const s = await db.simulationSession.findUniqueOrThrow({ where: { id: sessionId } });
      if (s.phase !== "SIMULATION") break;
      await executeCommand(actor, sessionId, c);
    }
  }
  return sessionView(actor, sessionId);
}

describe("five-stage learning loop (service layer, real PostgreSQL)", () => {
  it("simulation → containment → forensics → readiness → next recommendation, all persisted", async () => {
    const admin = await newOrgAdmin("Loop Org");
    const trainee = await addMember(admin, "TRAINEE");

    // New learner: Command Center has no fabricated scores, only a computed starting point.
    const before = await commandCenter(trainee);
    expect(before.latest).toBeNull();
    expect(before.history).toEqual([]);
    expect(before.starter?.scenario.key).toBe("web-shell-portal");

    const session = await startSession(trainee, await scenarioId("web-shell-portal"));
    const first = await sessionView(trainee, session.id);
    expect(first.adversary[0]).toMatchObject({ nodeId: "upload", approved: true });
    expect(first.events.length).toBeGreaterThan(0);

    // Investigate first: evidence surfaced live is persisted immediately.
    await executeCommand(trainee, session.id, "logs web-01");
    expect(await db.evidenceRecord.count({ where: { sessionId: session.id, acquiredVia: "LIVE" } })).toBeGreaterThan(0);

    const afterContain = await playToForensics(trainee, session.id);
    expect(afterContain.session.phase).toBe("FORENSICS");
    expect(afterContain.session.outcome).toBe("CONTAINED");
    const actions = await db.defenderAction.findMany({ where: { sessionId: session.id } });
    expect(actions.length).toBeGreaterThanOrEqual(3);
    expect(actions.every((a) => a.latencyMs >= 0)).toBe(true);

    // Forensics: submit an investigation built from the session's ground truth.
    const state = afterContain.state as SimState;
    const truth = groundTruth(afterContain.def, state);
    const evidenceKeys = afterContain.evidence.filter((e) => truth.maliciousEvidenceKeys.includes(e.key)).map((e) => e.key);
    const result = await submitInvestigation(trainee, session.id, {
      entryAsset: truth.entryAsset,
      entryTechnique: truth.entryTechnique,
      affectedAssets: truth.compromisedAssets,
      compromisedIdentities: truth.compromisedIdentities,
      sequence: truth.sequence,
      evidenceKeys,
      summary: "استغل المهاجم ثغرة رفع الملفات ثم زرع ملف ويب خبيث وتم احتواؤه.",
    });
    expect(result.investigation.total).toBeGreaterThan(0.8);
    expect(result.readiness.overall).toBeGreaterThan(0);

    const persisted = await db.readinessScore.findUniqueOrThrow({ where: { sessionId: session.id } });
    expect(persisted.overall).toBe(result.readiness.overall);
    expect((persisted.evidence as Record<string, unknown>).speed).toBeTruthy();
    expect(await db.behavioralProfile.count({ where: { userId: trainee.userId } })).toBeGreaterThan(0);
    expect((await db.simulationSession.findUniqueOrThrow({ where: { id: session.id } })).phase).toBe("COMPLETED");

    // Loop closes: a persisted recommendation, which is not the scenario just completed.
    const rec = await db.trainingRecommendation.findFirstOrThrow({ where: { userId: trainee.userId, status: "OPEN" }, include: { scenario: true } });
    expect(rec.sourceSessionId).toBe(session.id);
    expect(rec.scenario.key).not.toBe("web-shell-portal");
    expect((rec.rationale as { reasonsAr: string[] }).reasonsAr.length).toBeGreaterThan(0);
    expect(await db.notification.count({ where: { userId: trainee.userId } })).toBe(2);

    const after = await commandCenter(trainee);
    expect(after.latest?.overall).toBe(result.readiness.overall);
    expect(after.openRec?.id).toBe(rec.id);

    // The next session's adversary is calibrated by the updated profile.
    const next = await startSession(trainee, rec.scenarioId);
    const nextState = (await db.simulationSession.findUniqueOrThrow({ where: { id: next.id } })).state as unknown as SimState;
    expect(nextState.profile.overall).toBeCloseTo(result.readiness.overall / 100);
    expect((await db.trainingRecommendation.findUniqueOrThrow({ where: { id: rec.id } })).status).toBe("STARTED");

    // Results cannot be resubmitted.
    await expect(submitInvestigation(trainee, session.id, { entryAsset: "x", entryTechnique: "y", affectedAssets: [], compromisedIdentities: [], sequence: [], evidenceKeys: [], summary: "x".repeat(25) })).rejects.toMatchObject({ status: 409 });
  });

  it("rejects investigation before the live phase ends and invalid commands", async () => {
    const admin = await newOrgAdmin();
    const s = await startSession(admin, await scenarioId("spear-phish-finance"));
    await expect(submitInvestigation(admin, s.id, { entryAsset: "a", entryTechnique: "b", affectedAssets: [], compromisedIdentities: [], sequence: [], evidenceKeys: [], summary: "x".repeat(25) })).rejects.toMatchObject({ message: "not-in-forensics" });
    await expect(executeCommand(admin, s.id, "rm -rf /")).rejects.toMatchObject({ status: 400 });
    await expect(executeCommand(admin, s.id, "x".repeat(500))).rejects.toMatchObject({ status: 400 });
  });

  it("serialises concurrent commands with optimistic locking (no lost updates)", async () => {
    const admin = await newOrgAdmin();
    const s = await startSession(admin, await scenarioId("spear-phish-finance"));
    const results = await Promise.allSettled(["logs mail-gw", "ps ws-fin-07", "netstat ws-fin-07", "logs dc-01"].map((c) => executeCommand(admin, s.id, c)));
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const conflicts = results.filter((r) => r.status === "rejected" && (r.reason as { status?: number }).status === 409).length;
    expect(ok + conflicts).toBe(4);
    expect(await db.defenderAction.count({ where: { sessionId: s.id } })).toBe(ok);
    const row = await db.simulationSession.findUniqueOrThrow({ where: { id: s.id } });
    expect(row.revision).toBe(ok);
  });
});

describe("authorization and tenant isolation", () => {
  it("auditors are read-only and trainees cannot see team data", async () => {
    const admin = await newOrgAdmin();
    const auditor = await addMember(admin, "AUDITOR");
    const trainee = await addMember(admin, "TRAINEE");
    await expect(startSession(auditor, await scenarioId("web-shell-portal"))).rejects.toMatchObject({ status: 403 });
    await expect(teamOverview(trainee)).rejects.toMatchObject({ status: 403 });
    const team = await teamOverview(auditor);
    expect(team.rows.map((r) => r.userId).sort()).toEqual([admin.userId, auditor.userId, trainee.userId].sort());
  });

  it("another organization cannot read or act on a session; team viewers can read but not act", async () => {
    const adminA = await newOrgAdmin("Org A");
    const traineeA = await addMember(adminA, "TRAINEE");
    const instructorA = await addMember(adminA, "INSTRUCTOR");
    const adminB = await newOrgAdmin("Org B");
    const s = await startSession(traineeA, await scenarioId("web-shell-portal"));

    await expect(getSessionForActor(adminB, s.id)).rejects.toMatchObject({ status: 404 });
    await expect(sessionView(adminB, s.id)).rejects.toMatchObject({ status: 404 });
    await expect(executeCommand(adminB, s.id, "wait")).rejects.toMatchObject({ status: 404 });

    const v = await sessionView(instructorA, s.id);
    expect(v.isOwner).toBe(false);
    await expect(executeCommand(instructorA, s.id, "wait")).rejects.toMatchObject({ status: 404 });

    const otherTrainee = await addMember(adminA, "TRAINEE");
    await expect(sessionView(otherTrainee, s.id)).rejects.toMatchObject({ status: 404 });

    const teamB = await teamOverview(adminB);
    expect(teamB.rows.map((r) => r.userId)).toEqual([adminB.userId]);
  });

  it("org-private scenarios are not visible to other organizations", async () => {
    const a = await newOrgAdmin("Org A");
    const b = await newOrgAdmin("Org B");
    const base = await db.scenario.findFirstOrThrow({ where: { key: "web-shell-portal" } });
    const priv = await db.scenario.create({
      data: { key: "private-a", titleAr: "خاص", titleEn: "Private", briefingAr: "-", difficulty: 1, status: "PUBLISHED", definition: base.definition as object, attackRefs: [], orgId: a.orgId },
    });
    await expect(startSession(b, priv.id)).rejects.toMatchObject({ status: 404 });
    await expect(startSession(a, priv.id)).resolves.toBeTruthy();
  });
});
