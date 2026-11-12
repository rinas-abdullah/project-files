/**
 * Adaptive training recommendation engine (v1). Explainable ranking of the
 * next scenario from:
 *   - competency gaps in the learner's behavioral profile,
 *   - fit between scenario difficulty and current readiness,
 *   - repetition of recently completed scenarios.
 * Threat-intelligence relevance is not an input yet: the intelligence pipeline
 * is a later phase (see AMAD_IMPLEMENTATION_STATUS.md).
 */

export interface CandidateScenario {
  id: string;
  key: string;
  titleAr: string;
  difficulty: number;
  competencies: Record<string, number>;
}

export interface RecommendationInput {
  overallReadiness: number | null; // 0..100, null if no history
  levels: Record<string, number>; // competency -> 0..1
  recentScenarioKeys: string[]; // most recent first, completed sessions
  competencyNames: Record<string, string>;
}

export interface Recommendation {
  scenarioId: string;
  scenarioKey: string;
  score: number;
  targetDifficulty: number;
  focusCompetencies: string[];
  reasonsAr: string[];
  components: { gap: number; difficultyFit: number; novelty: number };
}

export const RECOMMENDATION_WEIGHTS = { gap: 0.5, difficultyFit: 0.3, novelty: 0.2 } as const;
const UNKNOWN_LEVEL = 0.5;

export function targetDifficulty(overall: number | null): number {
  if (overall === null) return 1;
  return Math.min(5, Math.max(1, 1 + Math.round((overall / 100) * 4)));
}

export function rankScenarios(candidates: CandidateScenario[], input: RecommendationInput): Recommendation[] {
  const target = targetDifficulty(input.overallReadiness);
  const ranked = candidates.map((c) => {
    const entries = Object.entries(c.competencies);
    const totalW = entries.reduce((s, [, w]) => s + w, 0) || 1;
    const gaps = entries.map(([k, w]) => ({ k, w, gap: 1 - (input.levels[k] ?? UNKNOWN_LEVEL) }));
    const gap = gaps.reduce((s, g) => s + g.w * g.gap, 0) / totalW;
    const difficultyFit = 1 - Math.abs(c.difficulty - target) / 4;
    const reps = input.recentScenarioKeys.slice(0, 5).filter((k) => k === c.key).length;
    const justDone = input.recentScenarioKeys[0] === c.key;
    const novelty = Math.max(0, 1 - 0.3 * reps - (justDone ? 0.3 : 0));
    const w = RECOMMENDATION_WEIGHTS;
    const score = w.gap * gap + w.difficultyFit * difficultyFit + w.novelty * novelty;
    const focus = [...gaps].sort((a, b) => b.gap * b.w - a.gap * a.w).slice(0, 2).map((g) => g.k);
    const reasonsAr: string[] = [];
    const name = (k: string) => input.competencyNames[k] ?? k;
    for (const k of focus) {
      const lvl = input.levels[k];
      reasonsAr.push(lvl === undefined ? `يدرّب كفاءة لم تُقَس لديك بعد: ${name(k)}` : `يستهدف كفاءة مستواها الحالي ${Math.round(lvl * 100)}٪: ${name(k)}`);
    }
    reasonsAr.push(
      c.difficulty === target
        ? `مستوى الصعوبة (${c.difficulty}) يطابق مستوى جاهزيتك الحالي`
        : `مستوى الصعوبة ${c.difficulty} مقابل المستوى المستهدف ${target}`,
    );
    if (reps > 0) reasonsAr.push(`أكملت هذا السيناريو ${reps} مرة مؤخرًا — خُفِّضت أولويته`);
    else reasonsAr.push("لم تتدرب على هذا السيناريو مؤخرًا");
    return {
      scenarioId: c.id,
      scenarioKey: c.key,
      score: Math.round(score * 1000) / 1000,
      targetDifficulty: target,
      focusCompetencies: focus,
      reasonsAr,
      components: { gap: Math.round(gap * 1000) / 1000, difficultyFit: Math.round(difficultyFit * 1000) / 1000, novelty: Math.round(novelty * 1000) / 1000 },
    };
  });
  return ranked.sort((a, b) => b.score - a.score || a.scenarioKey.localeCompare(b.scenarioKey));
}
