import { nextRandom } from "./rng";
import { nodeEligible } from "./guardian";
import type { AdversaryNode, AdversaryProposal, ScenarioDefinition, SimState } from "./types";

/**
 * Deterministic adaptive adversary planner.
 *
 * This is the fallback planner required by the spec (and currently the only
 * planner — an LLM planner is a documented future integration that would plug
 * into the same `AdversaryPlanner` interface and still pass through the
 * guardian). Decisions depend on:
 *  - the learner profile (stronger learners face a stealthier, faster adversary),
 *  - scenario difficulty,
 *  - current simulated state (only eligible graph nodes are considered),
 *  - defender disruption (after being blocked, alternative "adaptive" paths are preferred),
 *  - a seeded RNG for reproducible tie-breaking.
 */
export interface AdversaryPlanner {
  propose(def: ScenarioDefinition, state: SimState): { proposal: AdversaryProposal | null; rngState: number };
}

const TACTIC_PROGRESS: Record<string, number> = {
  "initial-access": 1.0,
  execution: 0.55,
  persistence: 0.5,
  "privilege-escalation": 0.6,
  "credential-access": 0.65,
  discovery: 0.4,
  "lateral-movement": 0.7,
  "command-and-control": 0.75,
  collection: 0.6,
  exfiltration: 0.9,
  impact: 0.9,
};

export function learnerSkill(state: SimState): number {
  return state.profile.overall ?? 0.5;
}

export function scoreCandidate(node: AdversaryNode, state: SimState, def: ScenarioDefinition, jitter: number): number {
  const skill = learnerSkill(state);
  const progress = TACTIC_PROGRESS[node.tactic] ?? 0.5;
  const objective = node.effects.reduce((s, e) => (e.type === "objective-progress" ? s + e.amount / 100 : s), 0);
  // Stronger defenders: adversary values stealth. Weaker defenders: noisier, more obvious moves.
  const stealth = skill * (1 - node.noise) * 0.8 + (1 - skill) * node.noise * 0.25;
  const adaptBonus = node.adaptive ? (state.adversary.blocks > 0 ? 0.6 : -0.4) : 0;
  const difficultyPush = (def.difficulty / 5) * objective;
  return progress + objective + stealth + adaptBonus + difficultyPush + jitter * 0.15;
}

export const deterministicPlanner: AdversaryPlanner = {
  propose(def, state) {
    let rng = state.rngState;
    const eligible = def.nodes.filter((n) => nodeEligible(n, state));
    if (eligible.length === 0) return { proposal: null, rngState: rng };
    const considered = eligible.map((n) => {
      const r = nextRandom(rng);
      rng = r.state;
      return { nodeId: n.id, score: Math.round(scoreCandidate(n, state, def, r.value) * 1000) / 1000 };
    });
    considered.sort((a, b) => b.score - a.score || a.nodeId.localeCompare(b.nodeId));
    const chosen = def.nodes.find((n) => n.id === considered[0].nodeId)!;
    return { proposal: { nodeId: chosen.id, rationale: explain(chosen, state, considered.length), considered }, rngState: rng };
  },
};

function explain(node: AdversaryNode, state: SimState, options: number): string {
  const skill = learnerSkill(state);
  const parts: string[] = [];
  if (node.adaptive && state.adversary.blocks > 0) parts.push("تم تعطيل المسار الأساسي، فاختار الخصم مسارًا بديلًا");
  if (skill >= 0.65 && node.noise <= 0.4) parts.push("ملف المتدرب قوي، لذا فُضّلت حركة منخفضة الضجيج");
  else if (skill < 0.45 && node.noise >= 0.6) parts.push("ملف المتدرب في بدايته، لذا اختيرت حركة أوضح أثرًا");
  parts.push(options === 1 ? "الحركة الوحيدة المؤهلة حاليًا في مخطط الهجوم المعتمد" : `الأعلى تقييمًا بين ${options} حركات مؤهلة في مخطط الهجوم المعتمد`);
  return parts.join(" · ");
}

/** Minutes until the adversary's next move: faster against stronger learners and on harder scenarios. */
export function adversaryGap(def: ScenarioDefinition, state: SimState): number {
  const skill = learnerSkill(state);
  return Math.max(1, Math.round((8 - def.difficulty) * (1.25 - skill * 0.75)));
}
