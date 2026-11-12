import { describe, expect, it } from "vitest";
import { f1, lcsLength, scoreInvestigation, type GroundTruth } from "@/domain/forensics/scoring";
import { computeReadiness, updateLevel, type ReadinessInputs } from "@/domain/readiness/scoring";
import { rankScenarios, targetDifficulty, type CandidateScenario } from "@/domain/recommend/engine";

const truth: GroundTruth = {
  entryAsset: "web-01",
  entryTechnique: "T1190",
  sequence: ["T1190", "T1505.003", "T1552.001"],
  compromisedAssets: ["web-01"],
  compromisedIdentities: ["svc-web"],
  entryEvidenceKeys: ["upload:upload"],
  maliciousEvidenceKeys: ["upload:upload", "webshell:cmd", "config-creds:read"],
};

describe("investigation scoring", () => {
  it("f1 and lcs helpers", () => {
    expect(f1([], [])).toBe(1);
    expect(f1(["a"], [])).toBe(0);
    expect(f1(["a", "b"], ["a"])).toBeCloseTo(2 / 3);
    expect(lcsLength(["a", "b", "c"], ["a", "c"])).toBe(2);
  });

  it("perfect submission scores 1", () => {
    const s = scoreInvestigation(
      { entryAsset: "web-01", entryTechnique: "T1190", affectedAssets: ["web-01"], compromisedIdentities: ["svc-web"], sequence: truth.sequence, evidenceKeys: ["upload:upload", "webshell:cmd"], summary: "x".repeat(30) },
      truth,
      ["upload:upload", "webshell:cmd", "bg:normal"],
    );
    expect(s.total).toBe(1);
  });

  it("cannot cite evidence that was never available to the investigator", () => {
    const s = scoreInvestigation(
      { entryAsset: "web-01", entryTechnique: "T1190", affectedAssets: ["web-01"], compromisedIdentities: ["svc-web"], sequence: truth.sequence, evidenceKeys: ["upload:upload"], summary: "x".repeat(30) },
      truth,
      ["bg:normal"],
    );
    expect(s.evidence).toBe(0);
    expect(s.detail.citedTotal).toBe(0);
  });

  it("decoy evidence lowers evidence precision", () => {
    const s = scoreInvestigation(
      { entryAsset: "db-01", entryTechnique: "T1190", affectedAssets: ["web-01", "db-01"], compromisedIdentities: [], sequence: ["T1190"], evidenceKeys: ["bg:normal", "webshell:cmd"], summary: "x".repeat(30) },
      truth,
      ["bg:normal", "webshell:cmd", "upload:upload"],
    );
    expect(s.entry).toBe(0.5);
    expect(s.evidence).toBeCloseTo(0.3);
    expect(s.detail.wrongAssets).toEqual(["db-01"]);
    expect(s.detail.missedIdentities).toEqual(["svc-web"]);
  });
});

const baseInv = { entry: 1, assets: 1, identities: 1, sequence: 1, evidence: 1, total: 1, detail: {} as never };

function inputs(over: Partial<ReadinessInputs> = {}): ReadinessInputs {
  return {
    outcome: "contained",
    endMinute: 15,
    timeBudget: 60,
    objective: 0,
    actions: [
      { kind: "logs", competency: "log-analysis", effective: false, disruptive: false, productive: true, valid: true },
      { kind: "isolate", competency: "endpoint-containment", effective: true, disruptive: false, productive: false, valid: true },
      { kind: "contain", competency: "incident-coordination", effective: true, disruptive: false, productive: false, valid: true },
    ],
    hintsUsed: 0,
    falseContainmentClaims: 0,
    compromisedAssets: 1,
    imagedCompromisedAssets: 1,
    investigation: baseInv,
    ...over,
  };
}

describe("readiness scoring", () => {
  it("rewards fast, accurate, independent, complete responses", () => {
    const r = computeReadiness(inputs());
    expect(r.speed.score).toBeCloseTo(0.6 * 0.75 + 0.4);
    expect(r.accuracy.score).toBe(1);
    expect(r.independence.score).toBe(1);
    expect(r.completeness.score).toBe(1);
    expect(r.overall).toBeGreaterThan(90);
    expect(r.competencies["log-analysis"].score).toBe(1);
    expect(r.competencies["incident-coordination"].score).toBe(1);
  });

  it("penalises hints, disruption, false claims and breach", () => {
    const r = computeReadiness(
      inputs({
        outcome: "breached",
        objective: 100,
        hintsUsed: 3,
        falseContainmentClaims: 2,
        imagedCompromisedAssets: 0,
        actions: [{ kind: "isolate", competency: "endpoint-containment", effective: false, disruptive: true, productive: false, valid: true }],
        investigation: { ...baseInv, total: 0.4, assets: 0.5, identities: 0, sequence: 0.3 },
      }),
    );
    expect(r.speed.score).toBe(0);
    expect(r.independence.score).toBeCloseTo(0.4);
    expect(r.accuracy.score).toBeCloseTo(0);
    expect(r.overall).toBeLessThan(25);
    expect(r.competencies["endpoint-containment"].score).toBe(0);
  });

  it("stores formula and inputs for every dimension", () => {
    const r = computeReadiness(inputs());
    for (const d of [r.speed, r.accuracy, r.independence, r.completeness]) {
      expect(d.formula.length).toBeGreaterThan(5);
      expect(Object.keys(d.inputs).length).toBeGreaterThan(0);
    }
  });

  it("profile update is an EMA after the first sample", () => {
    expect(updateLevel(null, 0, 0.8)).toBe(0.8);
    expect(updateLevel(0.5, 1, 1)).toBeCloseTo(0.7);
  });
});

describe("recommendations", () => {
  const cands: CandidateScenario[] = [
    { id: "1", key: "easy-net", titleAr: "", difficulty: 1, competencies: { "network-analysis": 1 } },
    { id: "2", key: "mid-id", titleAr: "", difficulty: 3, competencies: { "identity-response": 1 } },
    { id: "3", key: "mid-net", titleAr: "", difficulty: 3, competencies: { "network-analysis": 1 } },
  ];
  const names = { "network-analysis": "شبكة", "identity-response": "هويات" };

  it("new learners start at difficulty 1", () => {
    expect(targetDifficulty(null)).toBe(1);
    expect(rankScenarios(cands, { overallReadiness: null, levels: {}, recentScenarioKeys: [], competencyNames: names })[0].scenarioKey).toBe("easy-net");
  });

  it("targets the weakest competency at the right difficulty and explains why", () => {
    const r = rankScenarios(cands, { overallReadiness: 55, levels: { "network-analysis": 0.9, "identity-response": 0.2 }, recentScenarioKeys: [], competencyNames: names });
    expect(r[0].scenarioKey).toBe("mid-id");
    expect(r[0].targetDifficulty).toBe(3);
    expect(r[0].focusCompetencies).toEqual(["identity-response"]);
    expect(r[0].reasonsAr.join(" ")).toContain("20٪");
  });

  it("penalises the scenario just completed", () => {
    const r = rankScenarios(cands, { overallReadiness: 55, levels: { "network-analysis": 0.2, "identity-response": 0.2 }, recentScenarioKeys: ["mid-net"], competencyNames: names });
    expect(r[0].scenarioKey).toBe("mid-id");
  });
});
