import { describe, expect, it } from "vitest";
import { applyCommand, containmentGaps, groundTruth, parseCommand, startSimulation, type StepResult } from "@/domain/engine/simulation";
import { validateProposal } from "@/domain/engine/guardian";
import { getScenarioDefinition, SCENARIOS } from "@/domain/scenarios/catalog";
import type { LearnerProfile, ScenarioDefinition, SimState } from "@/domain/engine/types";

const novice: LearnerProfile = { overall: null, competencies: {} };
const def = (k: string) => getScenarioDefinition(k)!;

function run(d: ScenarioDefinition, seed: number, commands: string[], profile = novice) {
  let r: StepResult = startSimulation(d, seed, profile);
  const log: StepResult[] = [r];
  for (const c of commands) {
    if (r.state.phase !== "simulation") break;
    const next = applyCommand(d, r.state, c);
    if ("error" in next) throw new Error(`${c}: ${next.error}`);
    r = next;
    log.push(r);
  }
  return { final: r.state, log };
}

describe("command parser (safe console)", () => {
  it("accepts only whitelisted grammar", () => {
    expect(parseCommand("isolate ws-fin-07")).toEqual({ kind: "isolate", args: ["ws-fin-07"] });
    expect(parseCommand("rm -rf /")).toEqual({ error: "invalid-characters" });
    expect(parseCommand("curl http://example.com")).toEqual({ error: "invalid-characters" });
    expect(parseCommand("bash")).toEqual({ error: "unknown-command" });
    expect(parseCommand("isolate")).toEqual({ error: "wrong-arguments" });
    expect(parseCommand("logs a; reboot")).toEqual({ error: "invalid-characters" });
  });
});

describe("scenario catalog integrity", () => {
  it.each(SCENARIOS.map((s) => [s.key, s] as const))("%s: every reference resolves inside the twin", (_k, s) => {
    const assetIds = new Set(s.assets.map((a) => a.id));
    const nodeIds = new Set(s.nodes.map((n) => n.id));
    expect(nodeIds.has(s.entryNode)).toBe(true);
    for (const n of s.nodes) {
      expect(assetIds.has(n.target)).toBe(true);
      for (const e of n.evidence) expect(assetIds.has(e.asset)).toBe(true);
      for (const p of n.preconditions) {
        if ("node" in p) expect(nodeIds.has(p.node)).toBe(true);
        if ("nodes" in p) p.nodes.forEach((x) => expect(nodeIds.has(x)).toBe(true));
        if ("asset" in p) expect(assetIds.has(p.asset)).toBe(true);
      }
    }
    // Only the entry node may have no preconditions.
    expect(s.nodes.filter((n) => n.preconditions.length === 0).map((n) => n.id)).toEqual([s.entryNode]);
  });
});

describe("simulation engine", () => {
  it("is deterministic for the same seed and command sequence", () => {
    const cmds = ["logs mail-gw", "netstat ws-fin-07", "wait", "ps ws-fin-07"];
    const a = run(def("spear-phish-finance"), 42, cmds);
    const b = run(def("spear-phish-finance"), 42, cmds);
    expect(a.final).toEqual(b.final);
    expect(a.log.flatMap((l) => l.events)).toEqual(b.log.flatMap((l) => l.events));
  });

  it("adversary executes its entry move at start and the guardian approves it", () => {
    const r = startSimulation(def("spear-phish-finance"), 7, novice);
    expect(r.state.adversary.done).toEqual(["phish"]);
    expect(r.adversaryTurns[0]).toMatchObject({ nodeId: "phish", approved: true, technique: "T1566.001" });
    expect(r.state.assets["ws-fin-07"].compromised).toBe(true);
  });

  it("an undefended adversary reaches its objective (breach) or the clock runs out", () => {
    const { final } = run(def("web-shell-portal"), 1, Array(20).fill("wait"));
    expect(final.phase).toBe("forensics");
    expect(final.outcome).toBe("breached");
    expect(final.adversary.objective).toBeGreaterThanOrEqual(100);
  });

  it("investigation costs simulated time and surfaces evidence", () => {
    const s = startSimulation(def("web-shell-portal"), 3, novice);
    const r = applyCommand(def("web-shell-portal"), s.state, "logs web-01");
    if ("error" in r) throw new Error();
    expect(r.state.minute).toBe(3);
    expect(r.state.discovered).toContain("upload:upload");
    expect(r.assessment?.productive).toBe(true);
  });

  it("rejects a false containment claim and counts it", () => {
    const s = startSimulation(def("web-shell-portal"), 3, novice);
    const r = applyCommand(def("web-shell-portal"), s.state, "contain");
    if ("error" in r) throw new Error();
    expect(r.state.phase).toBe("simulation");
    expect(r.state.falseContainmentClaims).toBe(1);
  });

  it("a correct response contains the web-shell incident", () => {
    const { final } = run(def("web-shell-portal"), 3, ["logs web-01", "block 194.26.29.113", "isolate web-01", "image web-01", "contain"]);
    expect(final.outcome).toBe("contained");
    expect(final.phase).toBe("forensics");
    expect(containmentGaps(def("web-shell-portal"), final)).toEqual([]);
  });

  it("adapts: isolating the phished workstation after credential theft triggers VPN re-entry", () => {
    const d = def("spear-phish-finance");
    // Let the adversary reach credential theft, then isolate the host.
    let r = startSimulation(d, 11, novice);
    let guard = 0;
    while (!r.state.adversary.done.includes("lsass") && guard++ < 30) {
      const n = applyCommand(d, r.state, "wait");
      if ("error" in n) throw new Error(n.error);
      r = n;
    }
    expect(r.state.adversary.done).toContain("lsass");
    expect(r.state.adversary.done).not.toContain("smb-lateral");
    const iso = applyCommand(d, r.state, "isolate ws-fin-07");
    if ("error" in iso) throw new Error();
    let s: SimState = iso.state;
    expect(iso.assessment?.effective).toBe(true);
    for (let i = 0; i < 6 && !s.adversary.done.includes("vpn-reentry"); i++) {
      const n = applyCommand(d, s, "wait");
      if ("error" in n) throw new Error();
      s = n.state;
    }
    expect(s.adversary.done).toContain("vpn-reentry");
    expect(s.adversary.done).not.toContain("smb-lateral");
    expect(s.assets["fs-01"].compromised).toBe(true);
  });

  it("adapts: blocking the primary exfil channel diverts to the cloud path", () => {
    const d = def("spear-phish-finance");
    let tested = 0;
    for (let seed = 1; seed <= 30 && tested === 0; seed++) {
      let r = startSimulation(d, seed, novice);
      let guard = 0;
      while (!r.state.adversary.done.includes("stage") && r.state.phase === "simulation" && guard++ < 40) {
        const n = applyCommand(d, r.state, "wait");
        if ("error" in n) throw new Error(n.error);
        r = n;
      }
      // Need a run where staging happened but primary exfil has not yet.
      if (r.state.phase !== "simulation" || r.state.adversary.done.includes("exfil")) continue;
      const b = applyCommand(d, r.state, "block 45.137.22.9");
      if ("error" in b) throw new Error();
      let s = b.state;
      for (let i = 0; i < 8 && s.phase === "simulation"; i++) {
        const n = applyCommand(d, s, "wait");
        if ("error" in n) throw new Error();
        s = n.state;
      }
      expect(s.adversary.done).toContain("exfil-cloud");
      expect(s.adversary.done).not.toContain("exfil");
      tested++;
    }
    expect(tested).toBe(1);
  });

  it("stronger learner profiles face a faster adversary", () => {
    const d = def("spear-phish-finance");
    const weak = startSimulation(d, 9, { overall: 0.1, competencies: {} });
    const strong = startSimulation(d, 9, { overall: 0.95, competencies: {} });
    expect(strong.state.adversary.nextActionAt).toBeLessThan(weak.state.adversary.nextActionAt);
  });

  it("credits pre-emptive blocks of adversary infrastructure but not of unrelated IPs", () => {
    const d = def("web-shell-portal");
    const s0 = startSimulation(d, 3, novice).state;
    expect(s0.adversary.c2).toEqual([]); // C2 not yet established
    const pre = applyCommand(d, s0, "block 194.26.29.113");
    if ("error" in pre) throw new Error();
    expect(pre.assessment).toMatchObject({ effective: true, disruptive: false });
    expect(pre.events.some((e) => e.kind === "adversary.disrupted")).toBe(false);
    const unrelated = applyCommand(d, s0, "block 8.8.8.8");
    if ("error" in unrelated) throw new Error();
    expect(unrelated.assessment).toMatchObject({ effective: false, disruptive: false });
  });

  it("ground truth reflects what actually happened in the session", () => {
    const { final } = run(def("web-shell-portal"), 3, ["logs web-01", "block 194.26.29.113", "isolate web-01", "contain"]);
    const t = groundTruth(def("web-shell-portal"), final);
    expect(t.entryAsset).toBe("web-01");
    expect(t.entryTechnique).toBe("T1190");
    expect(t.compromisedAssets).toEqual(["web-01"]);
    expect(t.sequence[0]).toBe("T1190");
  });
});

describe("guardian", () => {
  const d = def("spear-phish-finance");
  const s = startSimulation(d, 1, novice).state;

  it("rejects nodes outside the approved graph", () => {
    expect(validateProposal(d, s, { nodeId: "rm-rf-real-host", rationale: "", considered: [] })).toEqual({ approved: false, reason: "node-not-in-approved-graph" });
  });
  it("rejects replays of executed nodes", () => {
    expect(validateProposal(d, s, { nodeId: "phish", rationale: "", considered: [] }).reason).toBe("node-already-executed");
  });
  it("rejects nodes whose preconditions do not hold", () => {
    expect(validateProposal(d, s, { nodeId: "exfil", rationale: "", considered: [] }).reason).toMatch(/^precondition-failed/);
  });
  it("rejects anything once the live phase is over", () => {
    expect(validateProposal(d, { ...s, phase: "forensics" }, { nodeId: "beacon", rationale: "", considered: [] }).reason).toBe("simulation-not-live");
  });
  it("rejects effects that touch assets outside the twin", () => {
    const tampered: ScenarioDefinition = { ...d, nodes: d.nodes.map((n) => (n.id === "beacon" ? { ...n, effects: [{ type: "compromise-asset", asset: "prod-db-real" }] } : n)) };
    expect(validateProposal(tampered, s, { nodeId: "beacon", rationale: "", considered: [] }).reason).toBe("effect-asset-outside-twin");
  });
});
