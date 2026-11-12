import type { AdversaryNode, AdversaryProposal, GuardianVerdict, Precondition, ScenarioDefinition, SimState } from "./types";

/**
 * Guardian — the safety and validity gate between any adversary planner
 * (deterministic today, AI-backed later) and the simulation.
 *
 * A proposal is approved only if ALL of these hold:
 *  1. It references a node that exists in the scenario's approved action graph.
 *  2. The node has not already been executed (no replay loops).
 *  3. Every precondition holds in the current simulated state.
 *  4. Every effect is one of the whitelisted simulation-only effect types and
 *     only references assets / identities that exist in the scenario twin.
 *  5. The simulation is still in the live phase.
 *
 * The guardian never executes anything; it returns a verdict that the engine
 * records as an event, approved or not.
 */

const ALLOWED_EFFECTS = new Set(["compromise-asset", "compromise-identity", "establish-c2", "spawn-process", "objective-progress"]);

export function preconditionHolds(p: Precondition, state: SimState): boolean {
  switch (p.type) {
    case "node-done":
      return state.adversary.done.includes(p.node);
    case "any-node-done":
      return p.nodes.some((n) => state.adversary.done.includes(n));
    case "asset-reachable":
      return !!state.assets[p.asset] && !state.assets[p.asset].isolated;
    case "identity-active":
      return !!state.identities[p.identity] && !state.identities[p.identity].disabled;
    case "c2-open":
      return state.adversary.c2.some((c) => c.ip === p.c2Ip) && !state.blockedIps.includes(p.c2Ip) && hasLiveC2(state, p.c2Ip);
    case "asset-compromised":
      return !!state.assets[p.asset]?.compromised;
    case "not-node-done":
      return p.nodes.every((n) => !state.adversary.done.includes(n));
    case "asset-isolated":
      return !!state.assets[p.asset]?.isolated;
    case "c2-blocked":
      return state.blockedIps.includes(p.c2Ip);
  }
}

/** A C2 channel is live only if its implant asset is not isolated and its IP is not blocked. */
export function hasLiveC2(state: SimState, ip?: string): boolean {
  return state.adversary.c2.some(
    (c) => (ip === undefined || c.ip === ip) && !state.blockedIps.includes(c.ip) && !state.assets[c.asset]?.isolated,
  );
}

export function nodeEligible(node: AdversaryNode, state: SimState): boolean {
  return !state.adversary.done.includes(node.id) && node.preconditions.every((p) => preconditionHolds(p, state));
}

export function validateProposal(def: ScenarioDefinition, state: SimState, proposal: AdversaryProposal): GuardianVerdict {
  if (state.phase !== "simulation") return { approved: false, reason: "simulation-not-live" };
  const node = def.nodes.find((n) => n.id === proposal.nodeId);
  if (!node) return { approved: false, reason: "node-not-in-approved-graph" };
  if (state.adversary.done.includes(node.id)) return { approved: false, reason: "node-already-executed" };
  if (!def.assets.some((a) => a.id === node.target)) return { approved: false, reason: "target-outside-twin" };
  for (const e of node.effects) {
    if (!ALLOWED_EFFECTS.has(e.type)) return { approved: false, reason: `effect-not-allowed:${e.type}` };
    if ("asset" in e && !def.assets.some((a) => a.id === e.asset)) return { approved: false, reason: "effect-asset-outside-twin" };
    if (e.type === "compromise-identity" && !def.identities.some((i) => i.id === e.identity))
      return { approved: false, reason: "effect-identity-outside-twin" };
    if (e.type === "objective-progress" && (e.amount < 0 || e.amount > 100)) return { approved: false, reason: "objective-out-of-range" };
  }
  const failed = node.preconditions.find((p) => !preconditionHolds(p, state));
  if (failed) return { approved: false, reason: `precondition-failed:${failed.type}` };
  return { approved: true, reason: "approved" };
}
