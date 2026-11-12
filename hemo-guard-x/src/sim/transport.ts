import { DEFAULT_RULES } from './rules'
import { rng } from './rng'
import type { ComponentType, Reading, Shipment, T } from './types'

// HEMO-GUARD transport monitoring. All telemetry is SIMULATED: there is no physical sensor.
// Technology disclosure: deterministic threshold rules over a seeded random walk.

export const SIMULATED_SENSOR_NOTE: T = { ar: 'قراءات محاكاة — لا يوجد اتصال بجهاز فعلي', en: 'Simulated readings — no physical device connected' }

export interface TelemetryOpts {
  seed: number
  component: ComponentType
  durationMin: number
  /** Inject an excursion starting at this minute (simulation event). */
  anomalyAt?: number
  /** Minute at which the sensor drops (readings stop). */
  sensorLossAt?: number
  stepMin?: number
}

export function simulateTelemetry(o: TelemetryOpts): Reading[] {
  const r = rng(o.seed)
  const [lo, hi] = DEFAULT_RULES[o.component].transport
  const mid = (lo + hi) / 2, span = (hi - lo) / 2
  const step = o.stepMin ?? 5
  const out: Reading[] = []
  let c = mid + r.normal(0, span * 0.15)
  for (let m = 0; m <= o.durationMin; m += step) {
    if (o.sensorLossAt !== undefined && m >= o.sensorLossAt) break
    const anomaly = o.anomalyAt !== undefined && m >= o.anomalyAt && m < o.anomalyAt + 45
    const target = anomaly ? hi + span * 0.6 + 1.5 : mid
    c += (target - c) * (anomaly ? 0.35 : 0.2) + r.normal(0, span * 0.06)
    out.push({ m, c: +c.toFixed(1) })
  }
  return out
}

export interface Excursion { from: number; to: number; peak: number; minutes: number }

/** Contiguous periods outside the transport range for the component. */
export function excursions(readings: Reading[], component: ComponentType, stepMin = 5): Excursion[] {
  const [lo, hi] = DEFAULT_RULES[component].transport
  const out: Excursion[] = []
  let cur: Excursion | null = null
  for (const x of readings) {
    const bad = x.c < lo || x.c > hi
    if (bad) {
      if (!cur) cur = { from: x.m, to: x.m, peak: x.c, minutes: 0 }
      cur.to = x.m
      cur.peak = Math.abs(x.c - (lo + hi) / 2) > Math.abs(cur.peak - (lo + hi) / 2) ? x.c : cur.peak
      cur.minutes = cur.to - cur.from + stepMin
    } else if (cur) { out.push(cur); cur = null }
  }
  if (cur) out.push(cur)
  return out
}

/**
 * Status after evaluating telemetry. An excursion ALWAYS results in a hold for specialist review;
 * the system never marks a component as acceptable after an excursion.
 */
export function evaluateShipment(s: Shipment): { state: Shipment['state']; excursions: Excursion[]; note: T } {
  const ex = excursions(s.telemetry, s.component)
  if (s.specialistDecision) {
    return { state: s.state, excursions: ex, note: s.specialistDecision === 'released' ? { ar: 'قرار مختص مسجل: إفراج', en: 'Specialist decision recorded: released' } : { ar: 'قرار مختص مسجل: استبعاد', en: 'Specialist decision recorded: discarded' } }
  }
  if (ex.length) return { state: 'held_for_review', excursions: ex, note: { ar: 'خارج نطاق النقل — محجوزة لمراجعة مختص، ولا تُعتبر صالحة تلقائياً', en: 'Outside transport range — held for specialist review, not considered acceptable automatically' } }
  if (s.sensor === 'lost') return { state: s.state, excursions: ex, note: { ar: 'انقطاع الحساس — السجل غير مكتمل ويحتاج مراجعة', en: 'Sensor lost — record incomplete, review needed' } }
  return { state: s.state, excursions: ex, note: { ar: 'ضمن نطاق النقل المحدد في قواعد المحاكاة', en: 'Within the transport range set in the simulation rules' } }
}
