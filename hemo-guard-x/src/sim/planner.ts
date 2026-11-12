import { facilityById } from './data'
import { CONFIRM_MIN, DEFAULT_RULES, FIELD_HANDOVER_MIN, SPEED_KMH, distanceKm, prescreen } from './rules'
import type { Donor, Facility, SupplyRequest, T, Unit, World } from './types'

// Plan generation and feasibility (deterministic rules + a simple ranked search).
// Technology disclosure: rule-based constraint checking and ranking. No trained model.

export type ViolationCode =
  | 'DEADLINE' | 'QUANTITY' | 'FACILITY_OFFLINE' | 'NO_TRANSPORT' | 'TRANSIT_LIMIT'
  | 'EXPIRY' | 'DONOR_NO_RESPONSE' | 'NO_DONOR' | 'COLD_CHAIN_HOLD'

export interface Violation { code: ViolationCode; text: T }
export interface Step { label: T; min: number }

export interface Leg { sourceId: string; unitIds: string[]; timeMin: number }

export interface Plan {
  id: string
  /** `split`: units from two or more sources, moved in parallel. */
  kind: 'inventory' | 'split' | 'donor'
  sourceId: string
  legs?: Leg[]
  unitIds: string[]
  donorIds: string[]
  steps: Step[]
  timeMin: number
  /** Relative simulated cost (unitless). */
  cost: number
  distanceKm: number
  feasible: boolean
  violations: Violation[]
  /** Human confirmations still required before this plan can be relied on. */
  pending: T[]
  risks: T[]
}

const v = (code: ViolationCode, ar: string, en: string): Violation => ({ code, text: { ar, en } })

/** Minutes already elapsed since the request was created (counts against the deadline). */
export const elapsed = (w: World, req: SupplyRequest) => Math.max(0, w.now - req.createdAt)

export function travelMin(from: Facility, to: Facility, w: World): number {
  const d = distanceKm(from, to)
  const base = d === 0 ? 5 : Math.round((d / SPEED_KMH) * 60) + 10
  return base + (to.kind === 'field' ? FIELD_HANDOVER_MIN : 0) + (w.routeDelay[from.id] ?? 0)
}

/** Units at a facility that pass the pre-screen and are free, ordered first-expiry-first. */
export function candidateUnits(w: World, req: SupplyRequest, facilityId: string): Unit[] {
  return w.units
    .filter((u) => u.facilityId === facilityId && u.verification !== 'unavailable' && (!u.reservedFor || u.reservedFor === req.id))
    .filter((u) => prescreen(u, req) === null)
    .filter((u) => !w.shipments.some((s) => s.state === 'held_for_review' && s.unitIds.includes(u.id)))
    .sort((a, b) => a.expiresAtMin - b.expiresAtMin)
}

function inventoryPlan(w: World, req: SupplyRequest, src: Facility, dest: Facility): Plan | null {
  const units = candidateUnits(w, req, src.id)
  if (!units.length) return null
  const rule = DEFAULT_RULES[req.component]
  const chosen = units.slice(0, req.quantity)
  const unconfirmed = chosen.filter((u) => u.verification !== 'confirmed')
  const steps: Step[] = []
  if (unconfirmed.length) steps.push({ label: { ar: 'تأكيد توفر الوحدات لدى جهة الإمداد', en: 'Confirm unit availability at source' }, min: CONFIRM_MIN })
  steps.push({ label: { ar: 'تجهيز وإصدار الوحدات', en: 'Prepare and issue units' }, min: rule.prepMin })
  const tMin = src.id === dest.id ? 5 : travelMin(src, dest, w)
  steps.push({ label: src.id === dest.id ? { ar: 'تسليم داخلي', en: 'Internal handover' } : { ar: 'النقل إلى جهة الطلب', en: 'Transport to requesting site' }, min: tMin })
  const timeMin = steps.reduce((s, x) => s + x.min, 0)
  const dist = distanceKm(src, dest)

  const violations: Violation[] = []
  if (!src.online) violations.push(v('FACILITY_OFFLINE', `جهة الإمداد ${src.name.ar} متوقفة عن العمل`, `${src.name.en} is offline`))
  if (chosen.length < req.quantity) violations.push(v('QUANTITY', `المتاح ${chosen.length} من ${req.quantity} وحدات مطلوبة`, `Only ${chosen.length} of ${req.quantity} units available`))
  if (src.id !== dest.id && src.couriers <= 0) violations.push(v('NO_TRANSPORT', 'لا توجد وسيلة نقل متاحة لدى جهة الإمداد', 'No courier available at source'))
  if (timeMin + elapsed(w, req) > req.deadlineMin) violations.push(v('DEADLINE', `الوقت المقدر ${timeMin} دقيقة يتجاوز المهلة ${req.deadlineMin} دقيقة`, `Estimated ${timeMin} min exceeds the ${req.deadlineMin} min deadline`))
  if (tMin > rule.maxTransitMin) violations.push(v('TRANSIT_LIMIT', 'مدة النقل تتجاوز الحد المسموح لهذا المكوّن في قواعد المحاكاة', 'Transit exceeds the component limit in the rule set'))
  if (chosen.some((u) => u.expiresAtMin < w.now + timeMin)) violations.push(v('EXPIRY', 'إحدى الوحدات تنتهي صلاحيتها قبل الوصول', 'A unit expires before arrival'))

  const pending: T[] = []
  if (unconfirmed.length) pending.push({ ar: `تأكيد توفر ${unconfirmed.length} وحدة لدى ${src.name.ar}`, en: `Confirm availability of ${unconfirmed.length} unit(s) at ${src.name.en}` })
  pending.push({ ar: 'اعتماد التوافق والصرف من مختص نقل الدم', en: 'Compatibility and release authorization by a transfusion specialist' })
  const risks: T[] = []
  if (unconfirmed.length) risks.push({ ar: 'الوحدات مسجلة ولم يُتحقق من توفرها بعد', en: 'Units are recorded but not yet confirmed' })
  if (w.routeDelay[src.id]) risks.push({ ar: `تأخير نقل مسجل على هذا المسار (+${w.routeDelay[src.id]} دقيقة)`, en: `Transport delay on this route (+${w.routeDelay[src.id]} min)` })
  if (timeMin + elapsed(w, req) > req.deadlineMin * 0.8 && timeMin + elapsed(w, req) <= req.deadlineMin) risks.push({ ar: 'هامش زمني ضيق قبل المهلة', en: 'Narrow margin before the deadline' })

  return {
    id: `P-${req.id}-${src.id}`, kind: 'inventory', sourceId: src.id, unitIds: chosen.map((u) => u.id), donorIds: [],
    steps, timeMin, cost: +(rule.cost * chosen.length + dist * 0.01 + (unconfirmed.length ? 0.2 : 0)).toFixed(2), distanceKm: dist,
    feasible: violations.length === 0, violations, pending, risks,
  }
}

/** Donors who pass the operational screen for a request. Personal data is never involved. */
export function eligibleDonors(w: World, req: SupplyRequest): Donor[] {
  return w.donors.filter((d) =>
    d.confirmation === 'lab_confirmed' && d.consent === 'granted' && d.readiness === 'ready' && d.eligibilityReview === 'current' &&
    (req.rare ? d.rare === req.rare : !d.rare) &&
    (req.hla ? d.hla === req.hla : true) &&
    req.antigenNeg.every((a) => d.antigenNeg.includes(a)) &&
    (req.component !== 'RBC' || ((d.abo === 'O' || d.abo === req.abo || req.abo === 'AB') && !(d.rh === '+' && req.rh === '-'))),
  )
}

/** Donor-recall plan via RARE-LINK. Collection and processing times are illustrative. */
function donorPlan(w: World, req: SupplyRequest, dest: Facility, noResponse: Set<string>): Plan | null {
  if (req.component === 'FFP' || req.component === 'PLT') return null
  const all = eligibleDonors(w, req)
  if (!all.length) {
    if (!req.rare && !req.hla && !req.antigenNeg.length) return null
    return {
      id: `P-${req.id}-donor`, kind: 'donor', sourceId: 'RARE-LINK', unitIds: [], donorIds: [], steps: [], timeMin: 0, cost: 0, distanceKm: 0,
      feasible: false, violations: [v('NO_DONOR', 'لا يوجد متبرع مؤكد ومتاح يطابق المتطلبات في السجل', 'No confirmed, available donor matches the requirement')], pending: [], risks: [],
    }
  }
  const responders = all.filter((d) => !noResponse.has(d.id))
  const donors = responders.slice(0, Math.max(1, req.quantity))
  const center = facilityById(w, donors[0]?.nearFacilityId ?? all[0].nearFacilityId)
  const isHla = req.component === 'PLT_HLA'
  const steps: Step[] = [
    { label: { ar: 'تواصل متدرج مع المتبرعين المؤهلين', en: 'Cascade contact with eligible donors' }, min: 30 },
    { label: { ar: 'وصول المتبرع وفحص الأهلية', en: 'Donor arrival and eligibility check' }, min: 60 },
    { label: isHla ? { ar: 'جمع بالفصادة وفحوص المنتج', en: 'Apheresis collection and product testing' } : { ar: 'جمع الوحدة وفحوصها ومعالجتها', en: 'Collection, testing and processing' }, min: isHla ? 24 * 60 : 6 * 60 },
    { label: { ar: 'النقل إلى جهة الطلب', en: 'Transport to requesting site' }, min: travelMin(center, dest, w) },
  ]
  const timeMin = steps.reduce((s, x) => s + x.min, 0)
  const violations: Violation[] = []
  if (!responders.length) violations.push(v('DONOR_NO_RESPONSE', 'لم يستجب أي من المتبرعين المؤهلين', 'None of the eligible donors responded'))
  if (timeMin + elapsed(w, req) > req.deadlineMin) violations.push(v('DEADLINE', `مسار المتبرع يحتاج ${timeMin} دقيقة ويتجاوز المهلة`, `Donor pathway needs ${timeMin} min, beyond the deadline`))
  if (!center.online) violations.push(v('FACILITY_OFFLINE', `مركز الجمع ${center.name.ar} متوقف`, `Collection centre ${center.name.en} is offline`))
  return {
    id: `P-${req.id}-donor`, kind: 'donor', sourceId: center.id, unitIds: [], donorIds: donors.map((d) => d.id), steps, timeMin,
    cost: +(DEFAULT_RULES[req.component].cost * req.quantity + 3).toFixed(2), distanceKm: distanceKm(center, dest),
    feasible: violations.length === 0, violations,
    pending: [{ ar: 'موافقة المتبرع وفحص الأهلية', en: 'Donor consent and eligibility check' }, { ar: 'اعتماد المنتج والصرف من مختص', en: 'Product and release authorization by a specialist' }],
    risks: [{ ar: 'الاستجابة غير مضمونة وتعتمد على المتبرع', en: 'Response is not guaranteed and depends on the donor' }],
  }
}

/** Combine the fastest partial sources to reach the quantity; legs travel in parallel. */
function splitPlan(req: SupplyRequest, partial: Plan[], used: number): Plan | null {
  const usable = partial.filter((p) => p.kind === 'inventory' && p.violations.every((v) => v.code === 'QUANTITY')).sort((a, b) => a.timeMin - b.timeMin)
  const legs: Leg[] = []
  let have = 0
  for (const p of usable) {
    if (have >= req.quantity) break
    const take = p.unitIds.slice(0, req.quantity - have)
    legs.push({ sourceId: p.sourceId, unitIds: take, timeMin: p.timeMin })
    have += take.length
  }
  if (legs.length < 2) return null
  const timeMin = Math.max(...legs.map((l) => l.timeMin))
  const violations: Violation[] = []
  if (have < req.quantity) violations.push(v('QUANTITY', `مجموع المتاح من ${legs.length} جهات ${have} من ${req.quantity}`, `${legs.length} sources together hold ${have} of ${req.quantity}`))
  if (timeMin + used > req.deadlineMin) violations.push(v('DEADLINE', `أبطأ مسار يحتاج ${timeMin} دقيقة ويتجاوز المهلة`, `Slowest leg needs ${timeMin} min, beyond the deadline`))
  const src = usable.filter((p) => legs.some((l) => l.sourceId === p.sourceId))
  return {
    id: `P-${req.id}-split-${legs.map((l) => l.sourceId).join('')}`, kind: 'split', sourceId: legs[0].sourceId, legs,
    unitIds: legs.flatMap((l) => l.unitIds), donorIds: [],
    steps: [{ label: { ar: `تنسيق ${legs.length} جهات إمداد بالتوازي`, en: `Coordinate ${legs.length} sources in parallel` }, min: 5 }, ...legs.map((l) => ({ label: { ar: `مسار ${l.sourceId}: ${l.unitIds.length} وحدة`, en: `Leg ${l.sourceId}: ${l.unitIds.length} unit(s)` }, min: l.timeMin }))],
    timeMin: timeMin + 5, cost: +(src.reduce((a, p) => a + p.cost, 0) + 0.5).toFixed(2), distanceKm: Math.max(...src.map((p) => p.distanceKm)),
    feasible: violations.length === 0 && timeMin + 5 + used <= req.deadlineMin, violations: timeMin + 5 + used > req.deadlineMin && !violations.some((x) => x.code === 'DEADLINE') ? [...violations, v('DEADLINE', 'يتجاوز المهلة بعد التنسيق', 'Exceeds deadline after coordination')] : violations,
    pending: [{ ar: `تأكيد التوفر لدى ${legs.length} جهات`, en: `Confirm availability at ${legs.length} sources` }, ...src[0].pending.slice(-1)],
    risks: [{ ar: 'تعدد المسارات يزيد نقاط التسليم ومخاطر التأخير', en: 'Multiple legs add handover points and delay risk' }, ...src.flatMap((p) => p.risks).slice(0, 2)],
  }
}

export interface PlanSet { plans: Plan[]; primary: Plan | null; backup: Plan | null }

/** Generate, check and rank every supply option for a request. */
export function buildPlans(w: World, req: SupplyRequest, opts: { noResponse?: string[] } = {}): PlanSet {
  const dest = facilityById(w, req.facilityId)
  const plans: Plan[] = []
  for (const f of w.facilities) {
    const p = inventoryPlan(w, req, f, dest)
    if (p) plans.push(p)
  }
  const sp = splitPlan(req, plans, elapsed(w, req))
  if (sp) plans.push(sp)
  const dp = donorPlan(w, req, dest, new Set(opts.noResponse ?? []))
  if (dp) plans.push(dp)
  plans.sort((a, b) => Number(b.feasible) - Number(a.feasible) || a.timeMin - b.timeMin || a.cost - b.cost)
  const feasible = plans.filter((p) => p.feasible)
  return { plans, primary: feasible[0] ?? null, backup: feasible[1] ?? null }
}

// ---------- Rescue engine: disruption events that change the world and force replanning ----------

export type Disruption =
  | { type: 'unit_unavailable'; unitId: string }
  | { type: 'transport_delay'; facilityId: string; minutes: number }
  | { type: 'cold_chain'; shipmentId: string }
  | { type: 'facility_down'; facilityId: string }
  | { type: 'missing_verification'; unitIds: string[] }
  | { type: 'donor_no_response'; donorIds: string[] }

export const DISRUPTION_LABEL: Record<Disruption['type'], T> = {
  unit_unavailable: { ar: 'الوحدة أصبحت غير متاحة', en: 'Unit becomes unavailable' },
  transport_delay: { ar: 'تأخر النقل', en: 'Transport delay' },
  cold_chain: { ar: 'انحراف في سلسلة التبريد', en: 'Cold-chain anomaly' },
  facility_down: { ar: 'تعطل منشأة', en: 'Facility interruption' },
  missing_verification: { ar: 'تحقق مفقود', en: 'Missing verification' },
  donor_no_response: { ar: 'عدم استجابة المتبرع', en: 'Donor non-response' },
}

/** Returns a new world with the disruption applied (pure). */
export function applyDisruption(w: World, d: Disruption): World {
  const next: World = { ...w, units: w.units.map((u) => ({ ...u })), facilities: w.facilities.map((f) => ({ ...f })), shipments: w.shipments.map((s) => ({ ...s })), routeDelay: { ...w.routeDelay } }
  switch (d.type) {
    case 'unit_unavailable': {
      const u = next.units.find((x) => x.id === d.unitId); if (u) { u.verification = 'unavailable'; u.reservedFor = null }
      break
    }
    case 'transport_delay': next.routeDelay[d.facilityId] = (next.routeDelay[d.facilityId] ?? 0) + d.minutes; break
    case 'cold_chain': {
      const s = next.shipments.find((x) => x.id === d.shipmentId); if (s) s.state = 'held_for_review'
      break
    }
    case 'facility_down': { const f = next.facilities.find((x) => x.id === d.facilityId); if (f) f.online = false; break }
    case 'missing_verification': for (const id of d.unitIds) { const u = next.units.find((x) => x.id === id); if (u) u.verification = 'recorded' } break
    case 'donor_no_response': break // handled through buildPlans({ noResponse })
  }
  return next
}

/** Compare a plan before and after a disruption and explain what changed. */
export function explainChange(before: Plan, after: Plan | undefined): T {
  if (!after) return { ar: 'لم يعد هذا المسار ضمن الخيارات', en: 'This option is no longer available' }
  if (before.feasible && !after.feasible) {
    return { ar: `أصبح غير قابل للتنفيذ: ${after.violations.map((x) => x.text.ar).join('؛ ')}`, en: `Now infeasible: ${after.violations.map((x) => x.text.en).join('; ')}` }
  }
  if (after.timeMin !== before.timeMin) return { ar: `تغيّر الوقت المقدر من ${before.timeMin} إلى ${after.timeMin} دقيقة`, en: `Estimated time changed from ${before.timeMin} to ${after.timeMin} min` }
  return { ar: 'لا تغيير', en: 'No change' }
}
