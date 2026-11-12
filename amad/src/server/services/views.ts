import "server-only";
import type { SessionView } from "./simulation";
import { clock, COMMAND_HELP } from "@/domain/engine/simulation";

/**
 * Projections of a session for the browser. During the live phase the defender
 * gets "fog of war": only what they could actually observe (alerts, evidence they
 * surfaced, effects of their own actions). Ground truth is only revealed after
 * the investigation is submitted.
 */

const TACTIC_AR: Record<string, string> = {
  "initial-access": "الوصول الأولي",
  execution: "التنفيذ",
  persistence: "الاستمرارية",
  "privilege-escalation": "رفع الصلاحيات",
  "credential-access": "سرقة بيانات الاعتماد",
  discovery: "الاستكشاف",
  "lateral-movement": "التنقل الجانبي",
  "command-and-control": "التحكم والسيطرة",
  collection: "جمع البيانات",
  exfiltration: "تسريب البيانات",
  impact: "التأثير",
};
export { TACTIC_AR };

export function scenarioPublic(v: SessionView) {
  const d = v.def;
  return {
    key: d.key,
    titleAr: d.titleAr,
    briefingAr: d.briefingAr,
    objectivesAr: d.objectivesAr,
    organizationAr: d.organizationAr,
    difficulty: d.difficulty,
    timeBudget: d.timeBudget,
    assets: d.assets.map((a) => ({ id: a.id, name: a.name, kind: a.kind, ip: a.ip, criticality: a.criticality, links: a.links })),
    identities: d.identities.map((i) => ({ id: i.id, displayName: i.displayName, privileged: i.privileged })),
    hintsAvailable: d.hintsAr.length,
  };
}

export function arenaView(v: SessionView) {
  const s = v.state;
  const visibleEvents = v.events.filter((e) => e.actor === "defender" || e.actor === "system" || e.kind === "adversary.disrupted");
  const alerts = v.events.filter((e) => e.kind === "siem.alert");
  const alertCount: Record<string, number> = {};
  for (const e of alerts) {
    const asset = (e.data as { asset?: string }).asset;
    if (asset) alertCount[asset] = (alertCount[asset] ?? 0) + 1;
  }
  const evidenceCount: Record<string, number> = {};
  for (const e of v.evidence) evidenceCount[e.asset] = (evidenceCount[e.asset] ?? 0) + 1;
  // Estimated threat stage: latest tactic among adversary activity the defender has actually surfaced.
  const discoveredNodes = v.evidence
    .map((e) => e.key.split(":")[0])
    .filter((n) => n !== "bg")
    .map((n) => v.def.nodes.find((x) => x.id === n))
    .filter((n): n is NonNullable<typeof n> => !!n);
  const latestNode = discoveredNodes.sort((a, b) => s.adversary.done.indexOf(b.id) - s.adversary.done.indexOf(a.id))[0];
  return {
    scenario: scenarioPublic(v),
    minute: s.minute,
    clock: clock(s.minute),
    hintsUsed: s.hintsUsed,
    falseClaims: s.falseContainmentClaims,
    blockedIps: s.blockedIps,
    assets: Object.fromEntries(Object.entries(s.assets).map(([id, a]) => [id, { isolated: a.isolated, imaged: a.imaged, alerts: alertCount[id] ?? 0, evidence: evidenceCount[id] ?? 0 }])),
    identities: Object.fromEntries(Object.entries(s.identities).map(([id, i]) => [id, { disabled: i.disabled }])),
    console: v.actions.map((a) => ({ seq: a.seq, command: a.command, output: a.output, minute: a.simMinute, valid: a.valid })),
    timeline: visibleEvents.map((e) => ({ seq: e.seq, minute: e.simMinute, clock: clock(e.simMinute), actor: e.actor, kind: e.kind, message: e.message })),
    alerts: alerts.slice(-6).reverse().map((e) => ({ seq: e.seq, clock: clock(e.simMinute), message: e.message, severity: (e.data as { severity?: string }).severity ?? "medium" })),
    threatStage: latestNode ? { tactic: TACTIC_AR[latestNode.tactic] ?? latestNode.tactic, technique: latestNode.technique, name: latestNode.techniqueName } : null,
    adversaryDisruptions: v.events.filter((e) => e.kind === "adversary.disrupted").length,
    help: COMMAND_HELP,
    canAct: v.isOwner,
  };
}

export function forensicsView(v: SessionView) {
  const techniques = v.def.attackRefs.map((t) => {
    const n = v.def.nodes.find((x) => x.technique === t);
    return { id: t, name: n?.techniqueName ?? t };
  });
  return {
    ...arenaView(v),
    outcome: v.session.outcome,
    evidence: v.evidence.map((e) => ({ key: e.key, asset: e.asset, source: e.source, content: e.content, clock: clock(e.simMinute), via: e.acquiredVia })),
    techniques,
  };
}

export type ArenaData = ReturnType<typeof arenaView>;
export type ForensicsData = ReturnType<typeof forensicsView>;
