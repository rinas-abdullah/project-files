import { facilityById } from './data'
import { applyDisruption, buildPlans, type Disruption, DISRUPTION_LABEL } from './planner'
import { nextStage, stageBlocker, STAGE_ACTOR, STAGE_LABEL } from './readiness'
import { evaluateShipment, simulateTelemetry } from './transport'
import { travelMin } from './planner'
import type { Actor, Mission, Shipment, Stage, T, World } from './types'

// Pure state transitions over the shared World. Every transition appends to the audit log.
// Clinical gates (review, release) can only be passed by an explicit human action.

export type Result = { world: World; error?: T }

function log(w: World, actor: Actor, kind: string, text: T, ref?: string): World {
  return { ...w, audit: [...w.audit, { id: `A-${w.audit.length}`, at: w.now, actor, kind, text, ref }] }
}

const err = (w: World, ar: string, en: string): Result => ({ world: w, error: { ar, en } })

/** Simulated confirmation call to a source facility. Reveals the hidden truth for the units. */
export function confirmAvailability(w: World, unitIds: string[]): Result {
  let ok = 0, bad = 0
  const units = w.units.map((u) => {
    if (!unitIds.includes(u.id)) return u
    if (u.truthAvailable) { ok++; return { ...u, verification: 'confirmed' as const, updatedAt: w.now } }
    bad++; return { ...u, verification: 'unavailable' as const, reservedFor: null, updatedAt: w.now }
  })
  let next = { ...w, units, now: w.now + 10 }
  next = log(next, 'human', 'confirm', { ar: `تأكيد توفر (محاكاة): ${ok} متاحة، ${bad} غير متاحة`, en: `Availability check (simulated): ${ok} available, ${bad} unavailable` }, unitIds.join(','))
  return { world: next }
}

export function reserveUnit(w: World, unitId: string, requestId: string): Result {
  const u = w.units.find((x) => x.id === unitId)
  if (!u) return err(w, 'الوحدة غير موجودة', 'Unit not found')
  if (u.reservedFor && u.reservedFor !== requestId) return err(w, 'الوحدة محجوزة لطلب آخر', 'Unit is reserved for another request')
  if (u.verification === 'unavailable') return err(w, 'الوحدة غير متاحة', 'Unit is unavailable')
  const next = { ...w, units: w.units.map((x) => (x.id === unitId ? { ...x, reservedFor: requestId, updatedAt: w.now } : x)) }
  return { world: log(next, 'human', 'reserve', { ar: `حجز (محاكاة) للوحدة ${unitId} للطلب ${requestId}`, en: `Simulated reservation of ${unitId} for ${requestId}` }, unitId) }
}

export function releaseUnit(w: World, unitId: string): Result {
  const u = w.units.find((x) => x.id === unitId)
  if (!u?.reservedFor) return err(w, 'الوحدة غير محجوزة', 'Unit is not reserved')
  const next = { ...w, units: w.units.map((x) => (x.id === unitId ? { ...x, reservedFor: null, updatedAt: w.now } : x)) }
  return { world: log(next, 'human', 'release', { ar: `إلغاء حجز الوحدة ${unitId}`, en: `Released reservation of ${unitId}` }, unitId) }
}

/** Simulated stock transfer between facilities (inventory rebalancing). */
export function transferUnits(w: World, unitIds: string[], toId: string): Result {
  const moving = w.units.filter((u) => unitIds.includes(u.id))
  if (!moving.length) return err(w, 'لم يتم اختيار وحدات', 'No units selected')
  if (moving.some((u) => u.reservedFor)) return err(w, 'لا يمكن نقل وحدة محجوزة', 'Reserved units cannot be transferred')
  const to = facilityById(w, toId)
  if (!to.online) return err(w, 'المنشأة المستلمة متوقفة', 'Receiving facility is offline')
  const next = { ...w, units: w.units.map((u) => (unitIds.includes(u.id) ? { ...u, facilityId: toId, verification: 'recorded' as const, updatedAt: w.now } : u)) }
  return { world: log(next, 'human', 'transfer', { ar: `نقل مخزون (محاكاة): ${moving.length} وحدة إلى ${to.name.ar}`, en: `Simulated stock transfer: ${moving.length} unit(s) to ${to.name.en}` }, unitIds.join(',')) }
}

export function completeInfo(w: World, requestId: string): Result {
  const next = { ...w, requests: w.requests.map((r) => (r.id === requestId ? { ...r, info: { orderAuthorized: true, requirementDocumented: true, sampleReceived: true } } : r)) }
  return { world: log(next, 'human', 'info', { ar: `استكمال بيانات الطلب ${requestId} من الجهة الطالبة`, en: `Request ${requestId} data completed by the requesting team` }, requestId) }
}

/** Records that the authorized specialist completed the review. Only a human can do this. */
export function recordReview(w: World, requestId: string): Result {
  const next = { ...w, requests: w.requests.map((r) => (r.id === requestId ? { ...r, review: 'completed' as const } : r)) }
  return { world: log(next, 'human', 'review', { ar: `سجّل المختص اكتمال مراجعة الطلب ${requestId}`, en: `Specialist recorded review complete for ${requestId}` }, requestId) }
}

export function startMission(w: World, requestId: string, planId?: string, noResponse: string[] = []): Result {
  const req = w.requests.find((r) => r.id === requestId)
  if (!req) return err(w, 'الطلب غير موجود', 'Request not found')
  if (w.missions.some((m) => m.requestId === requestId && (m.state === 'active' || m.state === 'blocked'))) return err(w, 'توجد مهمة نشطة لهذا الطلب', 'An active mission already exists for this request')
  const set = buildPlans(w, req, { noResponse })
  const plan = planId ? set.plans.find((p) => p.id === planId) : set.primary
  if (!plan) return err(w, 'لا يوجد مسار قابل للتنفيذ', 'No feasible pathway')
  if (!plan.feasible) return err(w, 'المسار المختار غير قابل للتنفيذ', 'Selected pathway is infeasible')
  const id = `M-${String(w.missions.length + 1).padStart(3, '0')}`
  const m: Mission = { id, requestId, planId: plan.id, sourceId: plan.sourceId, unitIds: plan.unitIds, donorIds: plan.donorIds, done: ['candidate'], state: 'active', createdAt: w.now }
  let next: World = { ...w, missions: [...w.missions, m], units: w.units.map((u) => (plan.unitIds.includes(u.id) ? { ...u, reservedFor: requestId } : u)) }
  next = log(next, 'system', 'mission', { ar: `بدء المهمة ${id}: ${STAGE_LABEL.candidate.ar} (${plan.sourceId === 'RARE-LINK' ? 'RARE-LINK' : facilityById(w, plan.sourceId).name.ar})`, en: `Mission ${id} started: ${STAGE_LABEL.candidate.en}` }, id)
  return { world: next }
}

/** Complete the next stage of a mission. Human stages require actor 'human'. */
export function completeStage(w: World, missionId: string, stage: Stage, actor: Actor): Result {
  const m = w.missions.find((x) => x.id === missionId)
  if (!m) return err(w, 'المهمة غير موجودة', 'Mission not found')
  if (nextStage(m) !== stage) return err(w, 'ليست المرحلة التالية', 'Not the next stage')
  if (STAGE_ACTOR[stage] === 'human' && actor !== 'human') return err(w, 'هذه المرحلة تتطلب إجراءً بشرياً مخولاً', 'This stage requires an authorized human action')
  let next = w
  if (stage === 'availability' && m.unitIds.length) {
    next = confirmAvailability(next, m.unitIds).world
    const lost = next.units.filter((u) => m.unitIds.includes(u.id) && u.verification === 'unavailable')
    if (lost.length) {
      next = { ...next, missions: next.missions.map((x) => (x.id === m.id ? { ...x, state: 'blocked' as const } : x)) }
      return { world: log(next, 'system', 'blocked', { ar: `المهمة ${m.id} متوقفة: ${lost.length} وحدة غير متاحة فعلياً — يلزم إعادة التخطيط`, en: `Mission ${m.id} blocked: ${lost.length} unit(s) not actually available — replanning required` }, m.id) }
    }
  }
  const blocker = stageBlocker(next, m, stage)
  if (blocker) return { world: w, error: blocker }
  let ship: Shipment | undefined
  if (stage === 'transport') {
    const req = next.requests.find((r) => r.id === m.requestId)!
    const src = m.sourceId === 'RARE-LINK' ? facilityById(next, req.facilityId) : facilityById(next, m.sourceId)
    const dest = facilityById(next, req.facilityId)
    const dur = src.id === dest.id ? 5 : travelMin(src, dest, next)
    ship = {
      id: `SHP-${3000 + next.shipments.length}`, missionId: m.id, component: req.component, fromId: src.id, toId: dest.id, unitIds: m.unitIds,
      departAt: next.now, etaAt: next.now + dur, state: 'in_transit', sensor: 'connected', telemetry: [], seed: next.seed + next.shipments.length * 31,
      handovers: [{ at: next.now, who: { ar: `إصدار من ${src.name.ar}`, en: `Issued by ${src.name.en}` }, ok: true }],
    }
    next = { ...next, shipments: [...next.shipments, ship] }
  }
  if (stage === 'delivered') {
    next = { ...next, shipments: next.shipments.map((s) => (s.id === m.shipmentId ? { ...s, state: 'delivered' as const, handovers: [...s.handovers, { at: next.now, who: { ar: 'استلام موثق لدى جهة الطلب', en: 'Documented receipt at requesting site' }, ok: true }] } : s)) }
  }
  next = {
    ...next,
    missions: next.missions.map((x) => (x.id === m.id ? { ...x, done: [...x.done, stage], shipmentId: ship?.id ?? x.shipmentId, state: stage === 'delivered' ? 'completed' : 'active' } : x)),
  }
  return { world: log(next, actor, 'stage', { ar: `${m.id}: ${STAGE_LABEL[stage].ar}`, en: `${m.id}: ${STAGE_LABEL[stage].en}` }, m.id) }
}

export function cancelMission(w: World, missionId: string): Result {
  const m = w.missions.find((x) => x.id === missionId)
  if (!m) return err(w, 'المهمة غير موجودة', 'Mission not found')
  const next = { ...w, missions: w.missions.map((x) => (x.id === missionId ? { ...x, state: 'cancelled' as const } : x)), units: w.units.map((u) => (m.unitIds.includes(u.id) && u.reservedFor === m.requestId ? { ...u, reservedFor: null } : u)) }
  return { world: log(next, 'human', 'cancel', { ar: `إلغاء المهمة ${missionId} للسماح بإعادة التخطيط`, en: `Mission ${missionId} cancelled to allow replanning` }, missionId) }
}

/** Refresh simulated telemetry for in-transit shipments up to `now`, and apply hold rules. */
function refreshShipments(w: World): World {
  let next = w
  const shipments = w.shipments.map((s) => {
    if (s.state !== 'in_transit' && s.state !== 'held_for_review') return s
    const elapsed = Math.min(w.now, s.etaAt) - s.departAt
    const telemetry = simulateTelemetry({ seed: s.seed, component: s.component, durationMin: Math.max(0, elapsed), anomalyAt: s.anomalyAt, sensorLossAt: s.sensorLossAt })
    const updated = { ...s, telemetry, sensor: s.sensorLossAt !== undefined && elapsed >= s.sensorLossAt ? ('lost' as const) : s.sensor }
    const ev = evaluateShipment(updated)
    if (ev.state === 'held_for_review' && s.state !== 'held_for_review') {
      next = log(next, 'system', 'excursion', { ar: `${s.id}: انحراف حراري — حجز الشحنة وطلب مراجعة مختص`, en: `${s.id}: temperature excursion — shipment held, specialist review requested` }, s.id)
      return { ...updated, state: 'held_for_review' as const }
    }
    return updated
  })
  return { ...next, shipments }
}

export function advanceTime(w: World, minutes: number): Result {
  const next = refreshShipments({ ...w, now: w.now + minutes })
  return { world: log(next, 'sim', 'time', { ar: `تقدم زمن المحاكاة ${minutes} دقيقة`, en: `Simulation clock advanced ${minutes} min` }) }
}

export function injectAnomaly(w: World, shipmentId: string): Result {
  const s = w.shipments.find((x) => x.id === shipmentId)
  if (!s || s.state !== 'in_transit') return err(w, 'لا توجد شحنة قيد النقل', 'No in-transit shipment')
  const at = Math.max(0, w.now - s.departAt)
  let next = { ...w, shipments: w.shipments.map((x) => (x.id === shipmentId ? { ...x, anomalyAt: at } : x)) }
  next = log(next, 'sim', 'inject', { ar: `حدث محاكاة: بدء انحراف حراري في ${shipmentId}`, en: `Simulation event: temperature anomaly starts in ${shipmentId}` }, shipmentId)
  return advanceTime(next, 30)
}

/** A specialist records a decision on a held shipment. The system never makes this decision. */
export function specialistDecision(w: World, shipmentId: string, decision: 'released' | 'discarded'): Result {
  const s = w.shipments.find((x) => x.id === shipmentId)
  if (!s || s.state !== 'held_for_review') return err(w, 'الشحنة ليست بانتظار مراجعة', 'Shipment is not awaiting review')
  let next: World = { ...w, shipments: w.shipments.map((x) => (x.id === shipmentId ? { ...x, specialistDecision: decision, state: decision === 'released' ? 'in_transit' : 'held_for_review' } : x)) }
  if (decision === 'discarded') {
    next = { ...next, units: next.units.map((u) => (s.unitIds.includes(u.id) ? { ...u, verification: 'unavailable', reservedFor: null } : u)), missions: next.missions.map((m) => (m.shipmentId === shipmentId ? { ...m, state: 'blocked' } : m)) }
  }
  return { world: log(next, 'human', 'decision', decision === 'released' ? { ar: `قرار مختص مسجل للشحنة ${shipmentId}: الإفراج`, en: `Specialist decision recorded for ${shipmentId}: released` } : { ar: `قرار مختص مسجل للشحنة ${shipmentId}: الاستبعاد — يلزم مسار بديل`, en: `Specialist decision recorded for ${shipmentId}: discarded — alternative pathway required` }, shipmentId) }
}

export function disrupt(w: World, d: Disruption): Result {
  const next = applyDisruption(w, d)
  return { world: log(next, 'sim', 'disruption', { ar: `حدث محاكاة: ${DISRUPTION_LABEL[d.type].ar}`, en: `Simulation event: ${DISRUPTION_LABEL[d.type].en}` }) }
}
