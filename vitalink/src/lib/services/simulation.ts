import "server-only";
import { prisma } from "@/lib/db";
import { nextMonitorState, readingsFromState, type MonitorScenario, type MonitorState } from "@/lib/integrations/monitor";
import { integrationStatus } from "@/lib/integrations/registry";
import { addVitals } from "./encounters";
import { operationalSweep, stepAlongRoute } from "./movement";

/**
 * Demo simulation engine (in-process).
 *  - Drives: move transporting ambulances along their simulated route.
 *  - Monitors: Mock medical monitor streaming vitals for an encounter.
 *  - Ops loop: periodic alert sweep (no acknowledgment, long handover).
 */
type Drive = { missionId: string; stepsPerTick: number };
type Monitor = { encounterId: string; scenario: MonitorScenario; state: MonitorState; everyTicks: number };

type SimState = {
  started: boolean;
  timer: NodeJS.Timeout | null;
  tick: number;
  drives: Map<string, Drive>;
  monitors: Map<string, Monitor>;
  busy: boolean;
};

const g = globalThis as unknown as { __vlSim?: SimState };
const sim: SimState = (g.__vlSim ??= { started: false, timer: null, tick: 0, drives: new Map(), monitors: new Map(), busy: false });

const TICK_MS = Number(process.env.SIM_TICK_MS ?? 2000);

async function tick() {
  if (sim.busy) return;
  sim.busy = true;
  sim.tick++;
  try {
    for (const d of [...sim.drives.values()]) {
      try {
        const r = await stepAlongRoute(d.missionId, d.stepsPerTick);
        if (r.done) sim.drives.delete(d.missionId);
      } catch (e) {
        console.error("[sim] drive", e);
        sim.drives.delete(d.missionId);
      }
    }
    for (const m of [...sim.monitors.values()]) {
      if (sim.tick % m.everyTicks !== 0) continue;
      try {
        const enc = await prisma.patientEncounter.findUnique({ where: { id: m.encounterId }, select: { status: true } });
        if (!enc || ["COMPLETED", "CANCELLED"].includes(enc.status)) {
          sim.monitors.delete(m.encounterId);
          continue;
        }
        m.state = nextMonitorState(m.state, m.scenario);
        await addVitals({ system: true, name: "Mock Medical Monitor" }, m.encounterId, readingsFromState(m.state), "MONITOR");
      } catch (e) {
        console.error("[sim] monitor", e);
        sim.monitors.delete(m.encounterId);
      }
    }
    if (sim.tick % 10 === 0) await operationalSweep();
  } finally {
    sim.busy = false;
  }
}

export function ensureSimulationLoop() {
  if (sim.started) return;
  sim.started = true;
  sim.timer = setInterval(() => void tick(), TICK_MS);
  sim.timer.unref?.();
}

export function startDrive(missionId: string, stepsPerTick = 2) {
  ensureSimulationLoop();
  sim.drives.set(missionId, { missionId, stepsPerTick: Math.max(1, Math.min(10, stepsPerTick)) });
}
export function stopDrive(missionId: string) {
  sim.drives.delete(missionId);
}

export async function startMonitor(encounterId: string, scenario: MonitorScenario = "STABLE") {
  const status = await integrationStatus("MEDICAL_MONITOR");
  if (status !== "SIMULATED") throw new Error(`MEDICAL_MONITOR_${status}`);
  ensureSimulationLoop();
  const last = await prisma.vitalSign.findMany({ where: { encounterId }, orderBy: { recordedAt: "desc" }, take: 20 });
  const lv = (t: string) => last.find((v) => v.type === t);
  const state: MonitorState = {
    hr: lv("HEART_RATE")?.value ?? 96,
    sys: lv("BLOOD_PRESSURE")?.value ?? 128,
    dia: lv("BLOOD_PRESSURE")?.value2 ?? 80,
    spo2: lv("SPO2")?.value ?? 97,
    rr: lv("RESPIRATORY_RATE")?.value ?? 18,
    tick: 0,
  };
  sim.monitors.set(encounterId, { encounterId, scenario, state, everyTicks: 2 });
}
export function stopMonitor(encounterId: string) {
  sim.monitors.delete(encounterId);
}

export function simulationStatus() {
  return {
    running: sim.started,
    tick: sim.tick,
    tickMs: TICK_MS,
    drives: [...sim.drives.keys()],
    monitors: [...sim.monitors.values()].map((m) => ({ encounterId: m.encounterId, scenario: m.scenario })),
  };
}
