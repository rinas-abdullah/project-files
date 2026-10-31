/**
 * Medical monitor integration.
 * MedicalMonitorAdapter is the contract a real device gateway (e.g. Corpuls,
 * ZOLL, Philips via HL7/IEEE 11073 bridge) would implement. MockMonitor
 * generates physiologically-plausible readings for the demo.
 */
import type { VitalTypeKey } from "@/lib/engines/vitals";

export type MonitorReading = { type: VitalTypeKey; value: number; value2?: number };

export interface MedicalMonitorAdapter {
  readonly name: string;
  /** Pull the next set of readings for a connected monitor. */
  read(deviceId: string): Promise<MonitorReading[]>;
}

export type MonitorScenario = "STABLE" | "DETERIORATING" | "IMPROVING";

export type MonitorState = { hr: number; sys: number; dia: number; spo2: number; rr: number; tick: number };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function nextMonitorState(s: MonitorState, scenario: MonitorScenario, rnd: () => number = Math.random): MonitorState {
  const j = (amp: number) => (rnd() - 0.5) * 2 * amp;
  const drift = scenario === "DETERIORATING" ? 1 : scenario === "IMPROVING" ? -1 : 0;
  return {
    hr: clamp(s.hr + drift * 2.2 + j(2.5), 35, 185),
    sys: clamp(s.sys - drift * 2.6 + j(3), 60, 220),
    dia: clamp(s.dia - drift * 1.4 + j(2), 35, 130),
    spo2: clamp(s.spo2 - drift * 0.7 + j(0.6), 70, 100),
    rr: clamp(s.rr + drift * 0.5 + j(0.8), 6, 40),
    tick: s.tick + 1,
  };
}

export function readingsFromState(s: MonitorState): MonitorReading[] {
  return [
    { type: "HEART_RATE", value: Math.round(s.hr) },
    { type: "BLOOD_PRESSURE", value: Math.round(s.sys), value2: Math.round(s.dia) },
    { type: "SPO2", value: Math.round(s.spo2) },
    { type: "RESPIRATORY_RATE", value: Math.round(s.rr) },
  ];
}

export class MockMonitor implements MedicalMonitorAdapter {
  readonly name = "Mock multiparameter monitor";
  private states = new Map<string, MonitorState>();
  constructor(private scenario: MonitorScenario = "STABLE") {}
  async read(deviceId: string) {
    const cur = this.states.get(deviceId) ?? { hr: 92, sys: 128, dia: 80, spo2: 97, rr: 18, tick: 0 };
    const next = nextMonitorState(cur, this.scenario);
    this.states.set(deviceId, next);
    return readingsFromState(next);
  }
}
