import { describe, expect, it } from 'vitest'
import { completeStage, confirmAvailability, injectAnomaly, recordReview, specialistDecision, startMission, advanceTime } from '../actions'
import { BASE_REQUESTS, generateWorld } from '../data'
import { evaluate } from '../evaluation'
import { applyDisruption, buildPlans } from '../planner'
import { assess, missionFor } from '../readiness'
import { rng } from '../rng'
import { prescreen } from '../rules'
import { SCENARIOS } from '../scenarios'
import { evaluateShipment, excursions, simulateTelemetry } from '../transport'
import type { SupplyRequest, Unit } from '../types'

const req = (over: Partial<SupplyRequest> = {}): SupplyRequest => ({
  id: 'T-1', facilityId: 'F3', component: 'RBC', abo: 'A', rh: '+', antigenNeg: [], quantity: 1, deadlineMin: 600, priority: 'urgent',
  info: { orderAuthorized: true, requirementDocumented: true, sampleReceived: true }, review: 'in_progress', createdAt: 0, ...over,
})
const unit = (over: Partial<Unit> = {}): Unit => ({
  id: 'U', facilityId: 'F1', component: 'RBC', abo: 'O', rh: '-', antigenNeg: ['K'], expiresAtMin: 1e6, reservedFor: null, verification: 'recorded', transportReady: true, updatedAt: 0, truthAvailable: true, ...over,
})

describe('rng & data', () => {
  it('is reproducible from a seed', () => {
    const a = rng(42), b = rng(42)
    expect(Array.from({ length: 5 }, a.next)).toEqual(Array.from({ length: 5 }, b.next))
    expect(JSON.stringify(generateWorld(9).units)).toBe(JSON.stringify(generateWorld(9).units))
    expect(JSON.stringify(generateWorld(9).units)).not.toBe(JSON.stringify(generateWorld(10).units))
  })
})

describe('operational pre-screen', () => {
  it('applies ABO/Rh rules for red cells', () => {
    expect(prescreen(unit({ abo: 'O', rh: '-' }), req({ abo: 'AB', rh: '+' }))).toBeNull()
    expect(prescreen(unit({ abo: 'A', rh: '+' }), req({ abo: 'O', rh: '+' }))).toBe('abo')
    expect(prescreen(unit({ abo: 'O', rh: '+' }), req({ abo: 'O', rh: '-' }))).toBe('rh')
  })
  it('rejects units without recorded extended typing when antigens are required', () => {
    expect(prescreen(unit({ antigenNeg: null }), req({ antigenNeg: ['K'] }))).toBe('antigen_unknown')
    expect(prescreen(unit({ antigenNeg: ['K'] }), req({ antigenNeg: ['K', 'Fyb'] }))).toBe('antigen')
    expect(prescreen(unit({ antigenNeg: ['K', 'Fyb'] }), req({ antigenNeg: ['K', 'Fyb'] }))).toBeNull()
  })
})

describe('planner & rescue engine', () => {
  it('flags the exact constraint when the deadline cannot be met', () => {
    const w = generateWorld(1, [])
    const set = buildPlans(w, req({ facilityId: 'F7', deadlineMin: 30 }))
    expect(set.primary).toBeNull()
    expect(set.plans.every((p) => p.violations.some((v) => v.code === 'DEADLINE'))).toBe(true)
  })
  it('recalculates when the primary source goes down', () => {
    const w = generateWorld(1, [])
    const r = req({ facilityId: 'F6', abo: 'O', rh: '+', quantity: 2 })
    const before = buildPlans(w, r)
    expect(before.primary).not.toBeNull()
    const w2 = applyDisruption(w, { type: 'facility_down', facilityId: before.primary!.sourceId })
    const after = buildPlans(w2, r)
    const same = after.plans.find((p) => p.id === before.primary!.id)!
    expect(same.feasible).toBe(false)
    expect(same.violations.map((v) => v.code)).toContain('FACILITY_OFFLINE')
    expect(after.primary?.id).not.toBe(before.primary!.id)
  })
  it('adds transport delay to the affected route only', () => {
    const w = generateWorld(1, [])
    const r = req({ facilityId: 'F6', abo: 'O', rh: '+' })
    const p = buildPlans(w, r).plans.find((x) => x.kind === 'inventory' && x.sourceId !== r.facilityId)!
    const after = buildPlans(applyDisruption(w, { type: 'transport_delay', facilityId: p.sourceId, minutes: 90 }), r)
    expect(after.plans.find((x) => x.id === p.id)!.timeMin).toBe(p.timeMin + 90)
  })
})

describe('inventory state affects readiness', () => {
  it('reports an unconfirmed candidate as a gap, and clears it after confirmation', () => {
    const w = generateWorld(3)
    const r = w.requests.find((x) => x.id === 'REQ-1003')!
    const a = assess(w, r)
    expect(a.gaps.some((g) => g.text.en.includes('not confirmed'))).toBe(true)
    expect(a.overall).not.toBe('awaiting_human')
    const plan = a.plans.primary!
    const w2 = confirmAvailability(w, plan.unitIds).world
    const allOk = w2.units.filter((u) => plan.unitIds.includes(u.id)).every((u) => u.verification === 'confirmed')
    const a2 = assess(w2, r)
    if (allOk) expect(a2.checks.find((c) => c.key === 'inventory')!.state).toBe('ok')
    else expect(a2.plans.primary?.id === plan.id).toBe(false)
  })
})

describe('human gates are enforced', () => {
  it('blocks review and release without a human action', () => {
    let w = generateWorld(DEFAULT_SEED_FOR_TEST)
    w = startMission(w, 'REQ-1001').world
    const m = missionFor(w, 'REQ-1001')!
    expect(completeStage(w, m.id, 'availability', 'system').error).toBeTruthy()
    w = completeStage(w, m.id, 'availability', 'human').world
    if (missionFor(w, 'REQ-1001')!.state === 'blocked') return
    expect(completeStage(w, m.id, 'review', 'human').error?.en).toMatch(/specialist/i)
    w = recordReview(w, 'REQ-1001').world
    expect(completeStage(w, m.id, 'review', 'human').error).toBeUndefined()
    expect(completeStage(w, m.id, 'delivered', 'human').error?.en).toMatch(/next stage/i)
  })
})

describe('transport events affect the request', () => {
  it('holds a shipment after an excursion and never auto-clears it', () => {
    const readings = simulateTelemetry({ seed: 5, component: 'RBC', durationMin: 200, anomalyAt: 60 })
    expect(excursions(readings, 'RBC').length).toBeGreaterThan(0)
    const clean = simulateTelemetry({ seed: 5, component: 'RBC', durationMin: 200 })
    expect(excursions(clean, 'RBC')).toHaveLength(0)

    let w = generateWorld(DEFAULT_SEED_FOR_TEST)
    w = recordReview(w, 'REQ-1001').world
    w = startMission(w, 'REQ-1001').world
    const id = missionFor(w, 'REQ-1001')!.id
    w = completeStage(w, id, 'availability', 'human').world
    if (missionFor(w, 'REQ-1001')!.state === 'blocked') return
    w = completeStage(w, id, 'review', 'human').world
    w = completeStage(w, id, 'transport', 'human').world
    const shipId = missionFor(w, 'REQ-1001')!.shipmentId!
    w = injectAnomaly(w, shipId).world
    const s = w.shipments.find((x) => x.id === shipId)!
    expect(s.state).toBe('held_for_review')
    expect(evaluateShipment(s).state).toBe('held_for_review')
    w = advanceTime(w, 600).world
    expect(w.shipments.find((x) => x.id === shipId)!.state).toBe('held_for_review')
    expect(completeStage(w, id, 'delivered', 'human').error?.en).toMatch(/specialist/i)
    const w2 = specialistDecision(w, shipId, 'discarded').world
    expect(missionFor(w2, 'REQ-1001')!.state).toBe('blocked')
    expect(assess(w, w.requests.find((r) => r.id === 'REQ-1001')!).checks.find((c) => c.key === 'logistics')!.state).toBe('conflict')
  })
})

describe('digital twin scenarios', () => {
  for (const sc of SCENARIOS) {
    it(`${sc.code} ${sc.title.en} runs and is reproducible`, () => {
      const a = sc.run(sc.defaults), b = sc.run(sc.defaults)
      expect(JSON.stringify(a.events)).toBe(JSON.stringify(b.events))
      expect(JSON.stringify(a.outcome)).toBe(JSON.stringify(b.outcome))
      expect(a.events.length).toBeGreaterThan(1)
      expect(a.assumptions.length).toBeGreaterThan(0)
    })
  }
  it('Southern Border runs end-to-end and replans after the disruption', () => {
    const sc = SCENARIOS[0]
    const res = sc.run(sc.defaults)
    expect(res.after).toBeDefined()
    expect(res.after!.primary?.id).not.toBe(res.before!.primary?.id)
    const kinds = res.events.map((e) => e.kind)
    expect(kinds).toContain('mission')
    const last = res.world.missions[res.world.missions.length - 1]
    // Either a pathway completes, or every replanning attempt is logged and the outcome says so.
    if (last.state === 'cancelled') expect(res.outcome.en).toMatch(/after replanning/)
    else expect(['completed', 'blocked']).toContain(last.state)
    if (last.state === 'completed') expect(res.events.filter((e) => e.kind === 'stage' && e.ref === last.id)).toHaveLength(4)
  })
  it('Specialist platelets is held until the requirement is documented, then runs end-to-end', () => {
    const sc = SCENARIOS[1]
    const held = sc.run({ ...sc.defaults, documented: false })
    expect(held.world.missions).toHaveLength(0)
    expect(held.events.some((e) => e.kind === 'hold')).toBe(true)
    const ok = sc.run({ ...sc.defaults, documented: true })
    expect(ok.world.missions.length).toBeGreaterThan(0)
    expect(['completed', 'blocked']).toContain(ok.world.missions[ok.world.missions.length - 1].state)
  })
  it('inputs change results', () => {
    const sc = SCENARIOS[0]
    const tight = sc.run({ ...sc.defaults, deadline: 60, disruption: 'none' })
    expect(tight.before!.primary).toBeNull()
  })
})

describe('evaluation lab', () => {
  it('is reproducible and does not hardcode a winner', () => {
    const a = evaluate(11, 40), b = evaluate(11, 40)
    expect(JSON.stringify(a.kpis)).toBe(JSON.stringify(b.kpis))
    const planning = a.kpis.find((k) => k.key === 'planning')!
    // NAJA pays verification time, so it is NOT the fastest planner.
    expect(planning.values.naja).toBeGreaterThan(planning.values.inventory_only)
    const c = evaluate(12, 40)
    expect(JSON.stringify(c.kpis)).not.toBe(JSON.stringify(a.kpis))
  })
})

const DEFAULT_SEED_FOR_TEST = 2026
void BASE_REQUESTS
