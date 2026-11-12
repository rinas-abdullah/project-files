import type { InvestigationScore } from "../forensics/scoring";

/**
 * Behavioral Readiness scoring — methodology v1 (documented in
 * docs/READINESS_METHODOLOGY.md). Deterministic and fully explainable: every
 * dimension stores the inputs and formula used to compute it.
 *
 * These scores describe performance inside AMAD simulations. They are NOT
 * validated predictors of real-world incident performance.
 */
export const METHODOLOGY_VERSION = "readiness-v1";

export interface ActionRecord {
  kind: string;
  competency: string | null;
  effective: boolean;
  disruptive: boolean;
  productive: boolean;
  valid: boolean;
}

export interface ReadinessInputs {
  outcome: "contained" | "breached" | "timeout";
  endMinute: number;
  timeBudget: number;
  objective: number; // 0..100 adversary objective progress at end
  actions: ActionRecord[];
  hintsUsed: number;
  falseContainmentClaims: number;
  compromisedAssets: number;
  imagedCompromisedAssets: number;
  investigation: InvestigationScore;
}

export interface Dimension {
  score: number; // 0..1
  formula: string;
  inputs: Record<string, number | string | boolean>;
}

export interface ReadinessResult {
  overall: number; // 0..100
  speed: Dimension;
  accuracy: Dimension;
  independence: Dimension;
  completeness: Dimension;
  competencies: Record<string, { score: number; observations: number }>;
  methodologyVersion: string;
}

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const r3 = (n: number) => Math.round(n * 1000) / 1000;

export function computeReadiness(i: ReadinessInputs): ReadinessResult {
  const contained = i.outcome === "contained";
  const timeFactor = clamp(1 - i.endMinute / i.timeBudget);
  const objFactor = clamp(1 - i.objective / 100);
  const speedScore = contained ? 0.6 * timeFactor + 0.4 * objFactor : 0.25 * objFactor;

  const containment = i.actions.filter((a) => a.valid && (a.effective || a.disruptive) && a.kind !== "contain");
  const effective = containment.filter((a) => a.effective).length;
  const actionPrecision = containment.length === 0 ? 0 : effective / containment.length;
  const accuracyScore = clamp(0.6 * actionPrecision + 0.4 * i.investigation.total - 0.1 * i.falseContainmentClaims);

  const independenceScore = clamp(1 - 0.2 * i.hintsUsed);

  const preservation = i.compromisedAssets === 0 ? 1 : i.imagedCompromisedAssets / i.compromisedAssets;
  const reconstruction = (i.investigation.assets + i.investigation.identities + i.investigation.sequence) / 3;
  const completenessScore = clamp(0.4 * (contained ? 1 : 0) + 0.3 * preservation + 0.3 * reconstruction);

  const overall = Math.round(((speedScore + accuracyScore + independenceScore + completenessScore) / 4) * 1000) / 10;

  return {
    overall,
    speed: {
      score: r3(speedScore),
      formula: contained ? "0.6 × (1 − زمن الاحتواء ÷ الميزانية) + 0.4 × (1 − تقدم الخصم)" : "0.25 × (1 − تقدم الخصم) — لم يتحقق الاحتواء",
      inputs: { outcome: i.outcome, endMinute: i.endMinute, timeBudget: i.timeBudget, adversaryObjective: i.objective },
    },
    accuracy: {
      score: r3(accuracyScore),
      formula: "0.6 × دقة إجراءات الاحتواء + 0.4 × درجة التحقيق − 0.1 × إعلانات احتواء خاطئة",
      inputs: { effectiveActions: effective, containmentActions: containment.length, investigationTotal: i.investigation.total, falseContainmentClaims: i.falseContainmentClaims },
    },
    independence: {
      score: r3(independenceScore),
      formula: "1 − 0.2 × عدد التلميحات",
      inputs: { hintsUsed: i.hintsUsed },
    },
    completeness: {
      score: r3(completenessScore),
      formula: "0.4 × تحقق الاحتواء + 0.3 × نسبة حفظ الأدلة + 0.3 × اكتمال إعادة البناء",
      inputs: { contained, compromisedAssets: i.compromisedAssets, imagedCompromisedAssets: i.imagedCompromisedAssets, reconstruction: r3(reconstruction) },
    },
    competencies: competencyScores(i, preservation),
    methodologyVersion: METHODOLOGY_VERSION,
  };
}

function competencyScores(i: ReadinessInputs, preservation: number): ReadinessResult["competencies"] {
  const out: ReadinessResult["competencies"] = {};
  const investigative = new Set(["logs", "ps", "netstat"]);
  const byComp = new Map<string, ActionRecord[]>();
  for (const a of i.actions) {
    if (!a.valid || !a.competency || a.kind === "contain") continue;
    byComp.set(a.competency, [...(byComp.get(a.competency) ?? []), a]);
  }
  for (const [comp, acts] of byComp) {
    if (comp === "evidence-handling") continue;
    const inv = acts.filter((a) => investigative.has(a.kind));
    const con = acts.filter((a) => !investigative.has(a.kind) && (a.effective || a.disruptive));
    const parts: number[] = [];
    // Investigation quality: share of queries that surfaced adversary evidence (at least half is considered full marks).
    if (inv.length) parts.push(clamp((inv.filter((a) => a.productive).length / inv.length) * 2));
    if (con.length) parts.push(con.filter((a) => a.effective).length / con.length);
    if (parts.length) out[comp] = { score: r3(parts.reduce((s, x) => s + x, 0) / parts.length), observations: acts.length };
  }
  if (i.compromisedAssets > 0) out["evidence-handling"] = { score: r3(preservation), observations: i.compromisedAssets };
  const claims = i.actions.filter((a) => a.kind === "contain" && a.valid).length;
  if (claims > 0) out["incident-coordination"] = { score: r3(clamp((i.outcome === "contained" ? 1 : 0.2) - 0.25 * i.falseContainmentClaims)), observations: claims };
  out["incident-reconstruction"] = { score: r3(i.investigation.total), observations: 1 };
  return out;
}

/** Exponential moving average used to update a learner's behavioral profile. */
export function updateLevel(previous: number | null, samples: number, observed: number): number {
  if (previous === null || samples === 0) return r3(observed);
  const alpha = 0.4;
  return r3(previous * (1 - alpha) + observed * alpha);
}
