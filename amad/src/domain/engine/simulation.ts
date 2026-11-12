import { adversaryGap, deterministicPlanner, type AdversaryPlanner } from "./adversary";
import { hasLiveC2, validateProposal } from "./guardian";
import { seedFrom } from "./rng";
import { nextRandom } from "./rng";
import type { AdversaryNode, LearnerProfile, ScenarioDefinition, SimEvent, SimState } from "./types";

/**
 * AMAD simulation engine. Pure and deterministic:
 *   state' = f(definition, state, command)
 * The console accepts a fixed grammar of defensive commands only. Nothing is
 * ever passed to a shell or network; unknown input is rejected.
 */

export const SIM_CLOCK_START = { h: 9, m: 0 };

export function clock(minute: number): string {
  const total = SIM_CLOCK_START.h * 60 + SIM_CLOCK_START.m + minute;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export type CommandKind =
  | "help"
  | "logs"
  | "ps"
  | "netstat"
  | "isolate"
  | "release"
  | "disable"
  | "block"
  | "kill"
  | "image"
  | "hint"
  | "wait"
  | "contain";

/** Cost in simulated minutes. Investigation is never free: the adversary keeps moving. */
export const COMMAND_COST: Record<CommandKind, number> = {
  help: 0,
  logs: 3,
  ps: 2,
  netstat: 2,
  isolate: 1,
  release: 1,
  disable: 1,
  block: 1,
  kill: 1,
  image: 4,
  hint: 0,
  wait: 3,
  contain: 1,
};

/** Which competency each command exercises — used by readiness scoring. */
export const COMMAND_COMPETENCY: Record<CommandKind, string | null> = {
  help: null,
  logs: "log-analysis",
  ps: "endpoint-investigation",
  netstat: "network-analysis",
  isolate: "endpoint-containment",
  release: "endpoint-containment",
  disable: "identity-response",
  block: "network-analysis",
  kill: "endpoint-containment",
  image: "evidence-handling",
  hint: null,
  wait: null,
  contain: "incident-coordination",
};

export interface ParsedCommand {
  kind: CommandKind;
  args: string[];
}

export const COMMAND_HELP: { usage: string; descAr: string }[] = [
  { usage: "logs <asset>", descAr: "قراءة سجلات المصادقة والتطبيقات على الأصل" },
  { usage: "ps <asset>", descAr: "عرض العمليات الجارية وتنبيهات EDR على الأصل" },
  { usage: "netstat <asset>", descAr: "عرض الاتصالات الشبكية وسجلات DNS للأصل" },
  { usage: "isolate <asset>", descAr: "عزل الأصل عن الشبكة" },
  { usage: "release <asset>", descAr: "إعادة الأصل المعزول إلى الشبكة" },
  { usage: "disable <identity>", descAr: "تعطيل حساب مستخدم" },
  { usage: "block <ip>", descAr: "حظر عنوان IP في جدار الحماية" },
  { usage: "kill <asset> <pid>", descAr: "إنهاء عملية على الأصل" },
  { usage: "image <asset>", descAr: "أخذ نسخة جنائية (ذاكرة + قرص) لحفظ الأدلة" },
  { usage: "wait", descAr: "المراقبة لمدة 3 دقائق" },
  { usage: "hint", descAr: "طلب تلميح (يؤثر على مؤشر الاستقلالية)" },
  { usage: "contain", descAr: "إعلان احتواء الحادثة" },
];

const ARITY: Record<CommandKind, number> = {
  help: 0, logs: 1, ps: 1, netstat: 1, isolate: 1, release: 1, disable: 1, block: 1, kill: 2, image: 1, hint: 0, wait: 0, contain: 0,
};

export function parseCommand(raw: string): ParsedCommand | { error: string } {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return { error: "empty" };
  if (trimmed.length > 120) return { error: "too-long" };
  if (!/^[a-z0-9 .\-_]+$/.test(trimmed)) return { error: "invalid-characters" };
  const [head, ...args] = trimmed.split(/\s+/);
  if (!(head in COMMAND_COST)) return { error: "unknown-command" };
  const kind = head as CommandKind;
  if (args.length !== ARITY[kind]) return { error: "wrong-arguments" };
  return { kind, args };
}

export function createInitialState(def: ScenarioDefinition, seed: number, profile: LearnerProfile): SimState {
  const assets: SimState["assets"] = {};
  for (const a of def.assets) {
    assets[a.id] = {
      compromised: false,
      isolated: false,
      imaged: false,
      processes: a.baselineProcesses.map((name, i) => ({ name, pid: 1000 + i * 37 + a.ip.length, malicious: false })),
    };
  }
  const identities: SimState["identities"] = {};
  for (const i of def.identities) identities[i.id] = { compromised: false, disabled: false };
  const state: SimState = {
    scenarioKey: def.key,
    seed: seedFrom(seed),
    rngState: seedFrom(seed),
    minute: 0,
    phase: "simulation",
    outcome: null,
    assets,
    identities,
    blockedIps: [],
    adversary: { done: [], blocks: 0, nextActionAt: 0, objective: 0, c2: [] },
    discovered: [],
    emitted: def.backgroundEvidence.map((e) => ({ key: `bg:${e.key}`, asset: e.asset, source: e.source, line: e.line.replaceAll("{t}", clock(0)), minute: 0, node: null })),
    hintsUsed: 0,
    falseContainmentClaims: 0,
    profile,
    seq: 0,
  };
  return state;
}

export interface StepResult {
  state: SimState;
  events: SimEvent[];
  output: string[];
  /** Adversary turns that happened during this step (approved and rejected). */
  adversaryTurns: AdversaryTurn[];
  /** Classification used for accuracy / disruption metrics. */
  assessment: ActionAssessment | null;
}

export interface AdversaryTurn {
  nodeId: string;
  technique: string;
  tactic: string;
  target: string;
  minute: number;
  rationale: string;
  approved: boolean;
  guardianReason: string;
  considered: { nodeId: string; score: number }[];
}

export interface ActionAssessment {
  kind: CommandKind;
  target: string | null;
  /** Containment action against a genuinely malicious entity. */
  effective: boolean;
  /** Containment action against a clean entity (operational disruption). */
  disruptive: boolean;
  /** Investigation that surfaced new evidence. */
  productive: boolean;
  competency: string | null;
}

function clone(s: SimState): SimState {
  return structuredClone(s);
}

function event(state: SimState, actor: SimEvent["actor"], kind: string, messageAr: string, data: Record<string, unknown> = {}): SimEvent {
  state.seq += 1;
  return { seq: state.seq, minute: state.minute, actor, kind, messageAr, data };
}

/** Starts a session: the adversary performs its entry move at T+0. */
export function startSimulation(def: ScenarioDefinition, seed: number, profile: LearnerProfile, planner: AdversaryPlanner = deterministicPlanner): StepResult {
  const state = createInitialState(def, seed, profile);
  const events: SimEvent[] = [event(state, "system", "session.started", `بدأت المحاكاة: ${def.titleAr}`, { seed: state.seed })];
  const turns: AdversaryTurn[] = [];
  runAdversary(def, state, events, turns, planner);
  return { state, events, output: [], adversaryTurns: turns, assessment: null };
}

export function applyCommand(def: ScenarioDefinition, prev: SimState, raw: string, planner: AdversaryPlanner = deterministicPlanner): StepResult | { error: string } {
  if (prev.phase !== "simulation") return { error: "simulation-ended" };
  const parsed = parseCommand(raw);
  if ("error" in parsed) return parsed;
  const state = clone(prev);
  const events: SimEvent[] = [];
  const output: string[] = [];
  const turns: AdversaryTurn[] = [];
  const { kind, args } = parsed;
  const assessment: ActionAssessment = { kind, target: args[0] ?? null, effective: false, disruptive: false, productive: false, competency: COMMAND_COMPETENCY[kind] };

  const asset = (id: string) => def.assets.find((a) => a.id === id);
  const requireAsset = (id: string) => {
    if (!asset(id)) {
      output.push(`خطأ: الأصل "${id}" غير موجود في البيئة. الأصول المتاحة: ${def.assets.map((a) => a.id).join(", ")}`);
      return false;
    }
    return true;
  };

  let disrupted = false; // the adversary noticed something
  let valid = true;

  switch (kind) {
    case "help":
      for (const h of COMMAND_HELP) output.push(`${h.usage.padEnd(22)} ${h.descAr}`);
      output.push(`الأصول: ${def.assets.map((a) => a.id).join(", ")}`);
      output.push(`الهويات: ${def.identities.map((i) => i.id).join(", ")}`);
      break;
    case "logs":
    case "ps":
    case "netstat": {
      if (!requireAsset(args[0])) { valid = false; break; }
      const sources = kind === "logs" ? ["auth.log", "web.log", "mail"] : kind === "ps" ? ["process", "edr"] : ["netflow", "dns"];
      const found = state.emitted.filter((e) => e.asset === args[0] && sources.includes(e.source));
      if (kind === "ps") {
        output.push(`PID    PROCESS (${args[0]})`);
        for (const p of state.assets[args[0]].processes) output.push(`${String(p.pid).padEnd(6)} ${p.name}`);
      }
      if (found.length === 0) output.push("لا توجد سجلات ذات صلة على هذا الأصل حتى الآن.");
      for (const e of found) {
        output.push(`[${e.source}] ${e.line}`);
        if (!state.discovered.includes(e.key)) {
          state.discovered.push(e.key);
          if (e.node) assessment.productive = true;
        }
      }
      break;
    }
    case "isolate": {
      if (!requireAsset(args[0])) { valid = false; break; }
      const a = state.assets[args[0]];
      if (a.isolated) { output.push("الأصل معزول بالفعل."); break; }
      a.isolated = true;
      output.push(`تم عزل ${args[0]} عن الشبكة.`);
      if (a.compromised) { assessment.effective = true; disrupted = true; } else assessment.disruptive = true;
      break;
    }
    case "release": {
      if (!requireAsset(args[0])) { valid = false; break; }
      const a = state.assets[args[0]];
      if (!a.isolated) { output.push("الأصل غير معزول."); break; }
      a.isolated = false;
      output.push(`أُعيد ${args[0]} إلى الشبكة.`);
      if (a.compromised) assessment.disruptive = true; // releasing a compromised host is a decision error
      break;
    }
    case "disable": {
      const ident = state.identities[args[0]];
      if (!ident) { output.push(`خطأ: الهوية "${args[0]}" غير موجودة. الهويات: ${def.identities.map((i) => i.id).join(", ")}`); valid = false; break; }
      if (ident.disabled) { output.push("الحساب معطّل بالفعل."); break; }
      ident.disabled = true;
      output.push(`تم تعطيل الحساب ${args[0]}.`);
      if (ident.compromised) { assessment.effective = true; disrupted = true; } else assessment.disruptive = true;
      break;
    }
    case "block": {
      const ip = args[0];
      if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) { output.push("خطأ: صيغة عنوان IP غير صحيحة."); valid = false; break; }
      if (def.assets.some((a) => a.ip === ip)) { output.push("خطأ: لا يمكن حظر عنوان داخلي لأصل في البيئة؛ استخدم isolate."); valid = false; break; }
      if (state.blockedIps.includes(ip)) { output.push("العنوان محظور بالفعل."); break; }
      state.blockedIps.push(ip);
      output.push(`أُضيفت قاعدة حظر لـ ${ip} في جدار الحماية.`);
      // Credit any block of the scenario's adversary infrastructure (pre-emptive blocks included);
      // the adversary only "notices" when a channel it is actively using is cut.
      if (adversaryIps(def).has(ip)) assessment.effective = true;
      if (state.adversary.c2.some((c) => c.ip === ip)) disrupted = true;
      break;
    }
    case "kill": {
      if (!requireAsset(args[0])) { valid = false; break; }
      const pid = Number(args[1]);
      const procs = state.assets[args[0]].processes;
      const idx = procs.findIndex((p) => p.pid === pid);
      if (idx < 0) { output.push(`لا توجد عملية بالمعرّف ${args[1]} على ${args[0]}.`); valid = false; break; }
      const [p] = procs.splice(idx, 1);
      output.push(`تم إنهاء ${p.name} (${pid}).`);
      if (p.malicious) { assessment.effective = true; disrupted = true; } else assessment.disruptive = true;
      break;
    }
    case "image": {
      if (!requireAsset(args[0])) { valid = false; break; }
      const a = state.assets[args[0]];
      if (a.imaged) { output.push("تم أخذ نسخة جنائية لهذا الأصل مسبقًا."); break; }
      a.imaged = true;
      output.push(`تم أخذ نسخة جنائية من ${args[0]} وحفظها مع سلسلة الحيازة.`);
      if (a.compromised) assessment.productive = true;
      break;
    }
    case "hint": {
      const hint = def.hintsAr[Math.min(state.hintsUsed, def.hintsAr.length - 1)];
      state.hintsUsed += 1;
      output.push(`تلميح: ${hint}`);
      break;
    }
    case "wait":
      output.push("مراقبة...");
      break;
    case "contain": {
      const gaps = containmentGaps(def, state);
      if (gaps.length === 0) {
        state.outcome = "contained";
        state.phase = "forensics";
        output.push("تم التحقق من الاحتواء: لا توجد قنوات تحكم نشطة ولا أصول أو حسابات مخترقة غير معالجة.");
        assessment.effective = true;
      } else {
        state.falseContainmentClaims += 1;
        output.push(`لم يتحقق الاحتواء بعد: ما زالت هناك ${gaps.length} نقطة نشاط معادٍ غير معالجة.`);
        assessment.disruptive = true;
      }
      break;
    }
  }

  events.push(
    event(state, "defender", "defender.command", `${raw.trim()}`, { kind, args, valid, effective: assessment.effective, disruptive: assessment.disruptive }),
  );

  if (!valid) {
    // Invalid input costs no simulated time.
    return { state, events, output, adversaryTurns: turns, assessment: null };
  }

  if (disrupted) {
    state.adversary.blocks += 1;
    state.adversary.nextActionAt = Math.min(state.adversary.nextActionAt, state.minute + COMMAND_COST[kind] + 1);
    events.push(event(state, "adversary", "adversary.disrupted", "رصد الخصم تعطّل جزء من نشاطه وبدأ يعيد التخطيط", { blocks: state.adversary.blocks }));
  }

  if (state.phase === "simulation") {
    state.minute += COMMAND_COST[kind];
    runAdversary(def, state, events, turns, planner);
  } else {
    state.minute += COMMAND_COST[kind];
    events.push(event(state, "system", "session.contained", "تم احتواء الحادثة — الانتقال إلى مرحلة التحقيق الجنائي", {}));
  }
  return { state, events, output, adversaryTurns: turns, assessment };
}

/** External IPs the adversary can use in this scenario (from the approved graph). */
export function adversaryIps(def: ScenarioDefinition): Set<string> {
  const ips = new Set<string>();
  for (const n of def.nodes) {
    for (const e of n.effects) if (e.type === "establish-c2") ips.add(e.c2Ip);
    for (const p of n.preconditions) if (p.type === "c2-open" || p.type === "c2-blocked") ips.add(p.c2Ip);
  }
  return ips;
}

/** Entities that still keep the adversary in the environment. Empty array = contained. */
export function containmentGaps(def: ScenarioDefinition, state: SimState): string[] {
  const gaps: string[] = [];
  for (const c of state.adversary.c2) {
    if (!state.blockedIps.includes(c.ip) && !state.assets[c.asset].isolated) gaps.push(`c2:${c.ip}@${c.asset}`);
  }
  for (const [id, a] of Object.entries(state.assets)) {
    if (!a.compromised || a.isolated) continue;
    if (a.processes.some((p) => p.malicious)) gaps.push(`asset:${id}`);
  }
  for (const [id, i] of Object.entries(state.identities)) {
    if (i.compromised && !i.disabled) gaps.push(`identity:${id}`);
  }
  return gaps;
}

function runAdversary(def: ScenarioDefinition, state: SimState, events: SimEvent[], turns: AdversaryTurn[], planner: AdversaryPlanner) {
  let guard = 0;
  while (state.phase === "simulation" && state.adversary.nextActionAt <= state.minute && guard++ < 10) {
    const { proposal, rngState } = planner.propose(def, state);
    state.rngState = rngState;
    if (!proposal) {
      state.adversary.nextActionAt = state.minute + 5;
      events.push(event(state, "adversary", "adversary.stalled", "لا يملك الخصم مسارًا متاحًا حاليًا — ينتظر فرصة", {}));
      break;
    }
    const verdict = validateProposal(def, state, proposal);
    const node = def.nodes.find((n) => n.id === proposal.nodeId);
    turns.push({
      nodeId: proposal.nodeId,
      technique: node?.technique ?? "unknown",
      tactic: node?.tactic ?? "unknown",
      target: node?.target ?? "unknown",
      minute: state.minute,
      rationale: proposal.rationale,
      approved: verdict.approved,
      guardianReason: verdict.reason,
      considered: proposal.considered,
    });
    events.push(event(state, "guardian", verdict.approved ? "guardian.approved" : "guardian.rejected", verdict.approved ? `الحارس اعتمد الحركة ${proposal.nodeId}` : `الحارس رفض الحركة ${proposal.nodeId}: ${verdict.reason}`, { nodeId: proposal.nodeId, reason: verdict.reason }));
    if (!verdict.approved || !node) {
      state.adversary.nextActionAt = state.minute + 2;
      break;
    }
    applyNode(def, state, node, events);
    state.adversary.nextActionAt = state.minute + node.duration + adversaryGap(def, state);
    if (state.adversary.objective >= def.objectiveThreshold) {
      state.phase = "forensics";
      state.outcome = "breached";
      events.push(event(state, "system", "session.breached", "حقق الخصم هدفه داخل المحاكاة — الانتقال إلى التحقيق الجنائي", { objective: state.adversary.objective }));
    }
  }
  if (state.phase === "simulation" && state.minute >= def.timeBudget) {
    state.phase = "forensics";
    state.outcome = "timeout";
    events.push(event(state, "system", "session.timeout", "انتهى الوقت المخصص للاستجابة — الانتقال إلى التحقيق الجنائي", {}));
  }
}

function applyNode(def: ScenarioDefinition, state: SimState, node: AdversaryNode, events: SimEvent[]) {
  state.adversary.done.push(node.id);
  for (const e of node.effects) {
    switch (e.type) {
      case "compromise-asset":
        state.assets[e.asset].compromised = true;
        break;
      case "compromise-identity":
        state.identities[e.identity].compromised = true;
        break;
      case "establish-c2":
        if (!state.adversary.c2.some((c) => c.ip === e.c2Ip && c.asset === e.asset)) state.adversary.c2.push({ ip: e.c2Ip, asset: e.asset });
        break;
      case "spawn-process":
        state.assets[e.asset].processes.push({ name: e.process, pid: e.pid, malicious: true });
        break;
      case "objective-progress":
        // Progress toward the objective requires a live C2 path out of the environment.
        if (hasLiveC2(state)) state.adversary.objective = Math.min(100, state.adversary.objective + e.amount);
        break;
    }
  }
  for (const t of node.evidence) {
    state.emitted.push({ key: `${node.id}:${t.key}`, asset: t.asset, source: t.source, line: t.line.replaceAll("{t}", clock(state.minute)), minute: state.minute, node: node.id });
  }
  events.push(event(state, "adversary", "adversary.move", `${node.techniqueName} (${node.technique}) على ${node.target}`, { nodeId: node.id, technique: node.technique, tactic: node.tactic, target: node.target }));
  // Noisy moves may raise a SIEM alert visible to the defender.
  const r = nextRandom(state.rngState);
  state.rngState = r.state;
  if (r.value < node.noise) {
    const a = def.assets.find((x) => x.id === node.target)!;
    events.push(event(state, "system", "siem.alert", `تنبيه SIEM: نشاط غير اعتيادي على ${a.name} (${a.id})`, { asset: a.id, severity: node.noise >= 0.7 ? "high" : "medium" }));
  }
}

/** Evidence available to the forensics phase: what was surfaced live, plus everything on imaged assets. */
export function forensicEvidence(state: SimState) {
  return state.emitted.filter((e) => state.discovered.includes(e.key) || state.assets[e.asset]?.imaged);
}

/** Ground truth about what the adversary actually did in this session. */
export function groundTruth(def: ScenarioDefinition, state: SimState) {
  const executed = state.adversary.done.map((id) => def.nodes.find((n) => n.id === id)!);
  const entry = executed[0];
  return {
    entryAsset: entry?.target ?? null,
    entryTechnique: entry?.technique ?? null,
    sequence: executed.map((n) => n.technique),
    compromisedAssets: Object.entries(state.assets).filter(([, a]) => a.compromised).map(([id]) => id),
    compromisedIdentities: Object.entries(state.identities).filter(([, i]) => i.compromised).map(([id]) => id),
    entryEvidenceKeys: state.emitted.filter((e) => e.node === entry?.id).map((e) => e.key),
    maliciousEvidenceKeys: state.emitted.filter((e) => e.node !== null).map((e) => e.key),
  };
}
