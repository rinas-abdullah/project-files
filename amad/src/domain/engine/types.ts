/**
 * AMAD simulation domain types.
 *
 * Everything here is pure data. Nothing in the engine performs I/O, executes
 * commands, or reaches real systems — every "action" is a transition over this
 * in-memory model of a synthetic organisation (the Cyber Twin).
 */

export type AssetKind = "workstation" | "server" | "domain-controller" | "firewall" | "database" | "vpn" | "web";

export interface TwinAsset {
  id: string;
  name: string;
  kind: AssetKind;
  ip: string;
  /** 1 (low) .. 5 (business critical) */
  criticality: number;
  /** Asset ids this asset can reach on the simulated network. */
  links: string[];
  /** Synthetic processes visible to `ps` before compromise. */
  baselineProcesses: string[];
}

export interface TwinIdentity {
  id: string;
  displayName: string;
  privileged: boolean;
}

export type Tactic =
  | "initial-access"
  | "execution"
  | "persistence"
  | "privilege-escalation"
  | "credential-access"
  | "discovery"
  | "lateral-movement"
  | "command-and-control"
  | "collection"
  | "exfiltration"
  | "impact";

/** Effects an adversary node may have on the twin. These are the ONLY effects the guardian allows. */
export type AdversaryEffect =
  | { type: "compromise-asset"; asset: string }
  | { type: "compromise-identity"; identity: string }
  | { type: "establish-c2"; asset: string; c2Ip: string }
  | { type: "spawn-process"; asset: string; process: string; pid: number }
  | { type: "objective-progress"; amount: number };

export type Precondition =
  | { type: "node-done"; node: string }
  | { type: "any-node-done"; nodes: string[] }
  | { type: "asset-reachable"; asset: string } // asset not isolated
  | { type: "identity-active"; identity: string }
  | { type: "c2-open"; c2Ip: string }
  | { type: "asset-compromised"; asset: string }
  | { type: "not-node-done"; nodes: string[] }
  | { type: "asset-isolated"; asset: string }
  | { type: "c2-blocked"; c2Ip: string };

export interface EvidenceTemplate {
  /** Stable key within the node, combined with the session to build an evidence id. */
  key: string;
  asset: string;
  source: "auth.log" | "process" | "netflow" | "edr" | "mail" | "web.log" | "dns";
  /** Synthetic log line; `{t}` is replaced by the simulated timestamp. */
  line: string;
}

export interface AdversaryNode {
  id: string;
  technique: string; // ATT&CK technique id, e.g. T1566.001
  techniqueName: string;
  tactic: Tactic;
  target: string; // asset id
  /** Every precondition must hold for the node to be eligible. */
  preconditions: Precondition[];
  effects: AdversaryEffect[];
  evidence: EvidenceTemplate[];
  /** 0..1 — how much telemetry this move produces (low = stealthy). */
  noise: number;
  /** Simulated minutes the move takes. */
  duration: number;
  /** Marks the alternative path used when a primary path is blocked. */
  adaptive?: boolean;
  /** Short human readable description (Arabic). */
  descriptionAr: string;
}

export interface ScenarioDefinition {
  key: string;
  titleAr: string;
  titleEn: string;
  briefingAr: string;
  objectivesAr: string[];
  organizationAr: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Simulated minutes the defender has before the adversary is assumed to finish regardless. */
  timeBudget: number;
  /** Objective progress (0..100) at which the adversary has achieved its goal. */
  objectiveThreshold: number;
  assets: TwinAsset[];
  identities: TwinIdentity[];
  nodes: AdversaryNode[];
  /** Node used as the first move. */
  entryNode: string;
  /** Competency keys and weights this scenario trains. */
  competencies: Record<string, number>;
  attackRefs: string[];
  /** Background / decoy evidence present on assets regardless of attacker behaviour. */
  backgroundEvidence: EvidenceTemplate[];
  hintsAr: string[];
}

// ---------------------------------------------------------------- state

export interface AssetState {
  compromised: boolean;
  isolated: boolean;
  /** Evidence collected (forensic image taken) before any destructive action. */
  imaged: boolean;
  processes: { name: string; pid: number; malicious: boolean }[];
}

export interface AdversaryMemory {
  /** Ids of nodes executed. */
  done: string[];
  /** Times the adversary was blocked by a defender action, used by the planner. */
  blocks: number;
  /** Simulated minute at which the adversary may act next. */
  nextActionAt: number;
  objective: number;
  c2: { ip: string; asset: string }[];
}

export type Phase = "simulation" | "forensics" | "completed";
export type Outcome = "contained" | "breached" | "timeout" | null;

export interface SimState {
  scenarioKey: string;
  seed: number;
  rngState: number;
  minute: number;
  phase: Phase;
  outcome: Outcome;
  assets: Record<string, AssetState>;
  identities: Record<string, { compromised: boolean; disabled: boolean }>;
  blockedIps: string[];
  adversary: AdversaryMemory;
  /** Evidence keys the defender has surfaced through investigation. */
  discovered: string[];
  /** Every evidence key that exists (emitted by background or adversary). */
  emitted: { key: string; asset: string; source: string; line: string; minute: number; node: string | null }[];
  hintsUsed: number;
  falseContainmentClaims: number;
  /** Learner profile snapshot used by the adversary planner (0..1 per competency). */
  profile: LearnerProfile;
  seq: number;
}

export interface LearnerProfile {
  /** Overall readiness 0..1, or null for a learner with no history. */
  overall: number | null;
  competencies: Record<string, number>;
}

// ---------------------------------------------------------------- events

export type Actor = "defender" | "adversary" | "guardian" | "system";

export interface SimEvent {
  seq: number;
  minute: number;
  actor: Actor;
  kind: string;
  /** Arabic, human readable summary rendered in the timeline. */
  messageAr: string;
  data: Record<string, unknown>;
}

export interface AdversaryProposal {
  nodeId: string;
  rationale: string;
  /** Scores of all candidates considered, for explainability. */
  considered: { nodeId: string; score: number }[];
}

export interface GuardianVerdict {
  approved: boolean;
  reason: string;
}
