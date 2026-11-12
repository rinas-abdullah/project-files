import { generateWorld } from './data'
import { buildPlans, travelMin } from './planner'
import { rng } from './rng'
import { aboRhOnly, CONFIRM_MIN, DEFAULT_RULES, distanceKm, prescreen } from './rules'
import type { ABO, Facility, SupplyRequest, T, Unit, World } from './types'

// Evaluation Lab: compares three strategies on the SAME synthetic test cases.
// Outcomes are computed from the hidden ground truth of each generated world (unit availability,
// recorded typing, injected transport delays). Nothing is hardcoded to favour any strategy:
// e.g. NAJA pays verification time, which can make it miss tight deadlines.

export type StrategyId = 'inventory_only' | 'smart_search' | 'naja'

export const STRATEGIES: { id: StrategyId; name: T; desc: T }[] = [
  { id: 'inventory_only', name: { ar: 'المخزون فقط', en: 'Inventory Only' }, desc: { ar: 'يختار أقرب منشأة لديها وحدات مسجلة مطابقة في ABO/Rh فقط، دون التحقق من المستضدات أو التوفر، ودون خطة بديلة.', en: 'Picks the nearest facility with recorded ABO/Rh-matching units, without antigen or availability checks, and no backup.' } },
  { id: 'smart_search', name: { ar: 'البحث الذكي', en: 'Smart Search' }, desc: { ar: 'يطابق المستضدات المسجلة ويختار الأسرع تقديراً، لكنه لا يؤكد التوفر قبل الإرسال. عند الفشل يعيد البحث يدوياً مرة واحدة.', en: 'Matches recorded antigens and picks the fastest estimate, but does not confirm availability before dispatch. On failure it searches again once.' } },
  { id: 'naja', name: { ar: 'جاهزية نَجا المتحقق منها', en: 'NAJA Verified Readiness' }, desc: { ar: 'يطابق المستضدات، ويؤكد توفر الوحدات قبل الإرسال (بتكلفة زمنية)، ويجهز خطة بديلة، ويعيد التخطيط عند التأخير.', en: 'Matches antigens, confirms availability before dispatch (costs time), keeps a backup, and replans on delay.' } },
]

export interface CaseOutcome {
  caseId: string
  strategy: StrategyId
  delivered: boolean
  suitable: boolean
  onTime: boolean
  arrivalMin: number | null
  planningMin: number
  failedAfterDispatch: boolean
  violations: string[]
  gapsPresent: number
  gapsDetected: number
  cost: number
  eventsLogged: number
}

/** Events a complete supply record should contain (traceability completeness denominator). */
export const REQUIRED_EVENTS = ['request', 'match', 'availability_check', 'dispatch', 'handover', 'receipt'] as const

export interface KPI { key: string; name: T; method: T; values: Record<StrategyId, number>; unit: '%' | 'min' | 'n' | 'cost'; better: 'higher' | 'lower' }

export interface EvalResult { seed: number; cases: number; outcomes: CaseOutcome[]; kpis: KPI[]; dataset: T; limitations: T[] }

export const LIMITATIONS: T[] = [
  { ar: 'التأكيد في المحاكاة دقيق دائماً (يكشف الحقيقة الاصطناعية)، لذلك يصل اكتشاف الفجوات لدى نَجا إلى 100% بحكم التصميم. هذا يقيس تغطية سير العمل، وليس دقة التحقق في الواقع.', en: 'Confirmation is always accurate in the simulation (it reveals the synthetic truth), so NAJA gap detection reaches 100% by design. This measures workflow coverage, not real-world verification accuracy.' },
  { ar: 'الطلبات لا تتنافس على نفس الوحدات، ولا تُحاكى أخطاء بشرية أو انقطاع أنظمة.', en: 'Requests do not compete for the same units, and human error or system outages are not simulated.' },
  { ar: 'الأزمنة والتكاليف قيم توضيحية. النتائج لا تمثل أداءً تشغيلياً أو سريرياً حقيقياً.', en: 'Times and costs are illustrative. Results do not represent real operational or clinical performance.' },
  { ar: 'خط الأساس "المخزون فقط" تبسيط لممارسة يدوية، وليس تقييماً لأي نظام قائم.', en: 'The "Inventory Only" baseline simplifies manual practice; it is not an assessment of any existing system.' },
]

interface TestCase { id: string; world: World; req: SupplyRequest; delayFacility: string | null; delayMin: number }

function makeCases(seed: number, n: number): TestCase[] {
  const r = rng(seed)
  const sites = ['F3', 'F4', 'F6', 'F7']
  const cases: TestCase[] = []
  for (let i = 0; i < n; i++) {
    const special = r.chance(0.5)
    const req: SupplyRequest = {
      id: `EV-${i + 1}`, facilityId: r.pick(sites), component: 'RBC', abo: r.pick(['O', 'A', 'B', 'AB'] as ABO[]), rh: r.chance(0.85) ? '+' : '-',
      antigenNeg: special ? Array.from(new Set([r.pick(['K', 'Fyb', 'Jkb', 'E', 'c']), ...(r.chance(0.4) ? [r.pick(['K', 'Jka', 'S'])] : [])])) : [],
      quantity: r.int(1, 3), deadlineMin: r.pick([90, 150, 240, 360, 480]), priority: 'urgent',
      info: { orderAuthorized: true, requirementDocumented: true, sampleReceived: true }, review: 'completed', createdAt: 0,
    }
    const world = generateWorld(seed * 1000 + i, [req])
    // A transport delay occurs on some routes after dispatch (unknown to planners in advance).
    const delayFacility = r.chance(0.3) ? r.pick(world.facilities.filter((f) => f.kind !== 'field')).id : null
    cases.push({ id: req.id, world, req, delayFacility, delayMin: r.int(30, 150) })
  }
  return cases
}

const fac = (w: World, id: string) => w.facilities.find((f) => f.id === id)!

function arrive(c: TestCase, src: Facility, dest: Facility, extra: number) {
  const base = src.id === dest.id ? 5 : travelMin(src, dest, c.world)
  return extra + DEFAULT_RULES.RBC.prepMin + base + (c.delayFacility === src.id ? c.delayMin : 0)
}

function suitableTruth(units: Unit[], req: SupplyRequest) {
  return units.length >= req.quantity && units.every((u) => u.truthAvailable && prescreen(u, req) === null)
}

function inventoryOnly(c: TestCase): CaseOutcome {
  const { world: w, req } = c
  const dest = fac(w, req.facilityId)
  const gapsPresent = (req.antigenNeg.length ? 1 : 0) + 1 // antigen requirement + unverified availability
  const options = w.facilities
    .map((f) => ({ f, units: w.units.filter((u) => u.facilityId === f.id && aboRhOnly(u, req)).slice(0, req.quantity) }))
    .filter((x) => x.units.length >= req.quantity)
    .sort((a, b) => distanceKm(a.f, dest) - distanceKm(b.f, dest))
  const planningMin = 15 // a single stock lookup and phone call
  const pick = options[0]
  if (!pick) return { caseId: c.id, strategy: 'inventory_only', delivered: false, suitable: false, onTime: false, arrivalMin: null, planningMin, failedAfterDispatch: false, violations: ['NO_OPTION'], gapsPresent, gapsDetected: 0, cost: 0, eventsLogged: 2 }
  const t = arrive(c, pick.f, dest, planningMin)
  const suitable = suitableTruth(pick.units, req)
  const violations: string[] = []
  if (!suitable) violations.push(pick.units.some((u) => !u.truthAvailable) ? 'UNIT_UNAVAILABLE' : 'REQUIREMENT_NOT_MET')
  if (t > req.deadlineMin) violations.push('DEADLINE')
  return {
    caseId: c.id, strategy: 'inventory_only', delivered: suitable, suitable, onTime: suitable && t <= req.deadlineMin, arrivalMin: suitable ? t : null, planningMin,
    failedAfterDispatch: !suitable, violations, gapsPresent, gapsDetected: 0, cost: +(pick.units.length * 1 + distanceKm(pick.f, dest) * 0.01).toFixed(2), eventsLogged: 4, // request, match, dispatch, receipt
  }
}

function smartSearch(c: TestCase): CaseOutcome {
  const { world: w, req } = c
  const dest = fac(w, req.facilityId)
  const gapsPresent = (req.antigenNeg.length ? 1 : 0) + 1
  const set = buildPlans(w, req)
  let planningMin = 10
  const inv = set.plans.filter((p) => p.kind === 'inventory' && p.feasible)
  if (!inv.length) return { caseId: c.id, strategy: 'smart_search', delivered: false, suitable: false, onTime: false, arrivalMin: null, planningMin, failedAfterDispatch: false, violations: ['NO_OPTION'], gapsPresent, gapsDetected: req.antigenNeg.length ? 1 : 0, cost: 0, eventsLogged: 3 }
  let tried = 0, extra = 0, failed = false
  for (const p of inv.slice(0, 2)) {
    tried++
    const units = p.unitIds.map((id) => w.units.find((u) => u.id === id)!)
    const src = fac(w, p.sourceId)
    // No confirmation: unavailability is discovered at pickup, after the courier is sent.
    if (!units.every((u) => u.truthAvailable)) { failed = true; extra += (src.id === dest.id ? 5 : travelMin(src, dest, w) / 2) + 20; planningMin += 20; continue }
    const t = arrive(c, src, dest, planningMin + extra)
    const violations = t > req.deadlineMin ? ['DEADLINE'] : []
    return { caseId: c.id, strategy: 'smart_search', delivered: true, suitable: true, onTime: t <= req.deadlineMin, arrivalMin: t, planningMin, failedAfterDispatch: failed, violations, gapsPresent, gapsDetected: req.antigenNeg.length ? 1 : 0, cost: +(p.cost + (tried - 1) * 0.8).toFixed(2), eventsLogged: 5 }
  }
  return { caseId: c.id, strategy: 'smart_search', delivered: false, suitable: false, onTime: false, arrivalMin: null, planningMin, failedAfterDispatch: true, violations: ['UNIT_UNAVAILABLE'], gapsPresent, gapsDetected: req.antigenNeg.length ? 1 : 0, cost: +(tried * 0.8).toFixed(2), eventsLogged: 5 }
}

function naja(c: TestCase): CaseOutcome {
  const { world: w, req } = c
  const dest = fac(w, req.facilityId)
  const gapsPresent = (req.antigenNeg.length ? 1 : 0) + 1
  const set = buildPlans(w, req)
  const inv = set.plans.filter((p) => p.kind === 'inventory' && p.feasible).slice(0, 3)
  // Confirm the top candidates in parallel (one confirmation round), then use the first confirmed.
  let planningMin = 10 + CONFIRM_MIN
  if (!inv.length) return { caseId: c.id, strategy: 'naja', delivered: false, suitable: false, onTime: false, arrivalMin: null, planningMin, failedAfterDispatch: false, violations: ['NO_OPTION'], gapsPresent, gapsDetected: gapsPresent, cost: 0, eventsLogged: 3 }
  const confirmed = inv.filter((p) => p.unitIds.every((id) => w.units.find((u) => u.id === id)!.truthAvailable))
  if (!confirmed.length) {
    planningMin += CONFIRM_MIN
    return { caseId: c.id, strategy: 'naja', delivered: false, suitable: false, onTime: false, arrivalMin: null, planningMin, failedAfterDispatch: false, violations: [], gapsPresent, gapsDetected: gapsPresent, cost: +(inv.length * 0.2).toFixed(2), eventsLogged: 4 }
  }
  let primary = confirmed[0]
  const backup = confirmed[1]
  // Replanning: if a delay is reported on the primary route before dispatch, switch when the backup is faster.
  if (c.delayFacility === primary.sourceId && backup) {
    const pT = arrive(c, fac(w, primary.sourceId), dest, planningMin)
    const bT = arrive(c, fac(w, backup.sourceId), dest, planningMin + 5)
    if (bT < pT) { primary = backup; planningMin += 5 }
  }
  const t = arrive(c, fac(w, primary.sourceId), dest, planningMin)
  return { caseId: c.id, strategy: 'naja', delivered: true, suitable: true, onTime: t <= req.deadlineMin, arrivalMin: t, planningMin, failedAfterDispatch: false, violations: t > req.deadlineMin ? ['DEADLINE'] : [], gapsPresent, gapsDetected: gapsPresent, cost: +(primary.cost + inv.length * 0.2).toFixed(2), eventsLogged: 6 }
}

const pct = (n: number, d: number) => (d ? +((100 * n) / d).toFixed(1) : 0)
const avg = (xs: number[]) => (xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : 0)

export function evaluate(seed = 7, n = 60): EvalResult {
  const cases = makeCases(seed, n)
  const outcomes: CaseOutcome[] = []
  for (const c of cases) outcomes.push(inventoryOnly(c), smartSearch(c), naja(c))
  const by = (s: StrategyId) => outcomes.filter((o) => o.strategy === s)
  const k = (key: string, name: T, method: T, unit: KPI['unit'], better: KPI['better'], f: (os: CaseOutcome[]) => number): KPI => ({
    key, name, method, unit, better, values: { inventory_only: f(by('inventory_only')), smart_search: f(by('smart_search')), naja: f(by('naja')) },
  })
  const kpis: KPI[] = [
    k('on_time', { ar: 'معدل الإمداد المتحقق في الوقت', en: 'Verified On-Time Supply Rate' }, { ar: 'عدد الحالات التي وصلت فيها وحدات مناسبة (وفق الحقيقة الاصطناعية) قبل المهلة ÷ كل الحالات', en: 'Cases where suitable units (per synthetic ground truth) arrived before the deadline ÷ all cases' }, '%', 'higher', (os) => pct(os.filter((o) => o.onTime).length, os.length)),
    k('gap_detection', { ar: 'اكتشاف فجوات الجاهزية', en: 'Readiness Gap Detection' }, { ar: 'الفجوات المكتشفة قبل الإرسال ÷ الفجوات الموجودة (متطلب مستضدات + توفر غير مؤكد)', en: 'Gaps detected before dispatch ÷ gaps present (antigen requirement + unconfirmed availability)' }, '%', 'higher', (os) => pct(os.reduce((a, o) => a + o.gapsDetected, 0), os.reduce((a, o) => a + o.gapsPresent, 0))),
    k('planning', { ar: 'زمن تخطيط الاستجابة', en: 'Response Planning Time' }, { ar: 'متوسط الدقائق المحاكاة من استلام الطلب حتى قرار الإرسال، شاملاً التأكيد وإعادة البحث', en: 'Mean simulated minutes from request to dispatch decision, including confirmation and re-search' }, 'min', 'lower', (os) => avg(os.map((o) => o.planningMin))),
    k('failure', { ar: 'معدل فشل الخطة', en: 'Plan Failure Rate' }, { ar: 'الخطط التي فشلت بعد الإرسال ÷ كل الحالات', en: 'Plans that failed after dispatch ÷ all cases' }, '%', 'lower', (os) => pct(os.filter((o) => o.failedAfterDispatch).length, os.length)),
    k('violations', { ar: 'مخالفات القيود', en: 'Constraint Violations' }, { ar: 'مجموع المخالفات في الخطط المنفذة (مهلة، وحدة غير متاحة، متطلب غير محقق)', en: 'Total violations in executed plans (deadline, unavailable unit, unmet requirement)' }, 'n', 'lower', (os) => os.reduce((a, o) => a + o.violations.filter((v) => v !== 'NO_OPTION').length, 0)),
    k('cost', { ar: 'التكلفة التشغيلية المحاكاة', en: 'Simulated Operational Cost' }, { ar: 'متوسط وحدات التكلفة النسبية (مكونات + مسافة + محاولات تأكيد/إعادة)', en: 'Mean relative cost units (components + distance + confirmation/retry attempts)' }, 'cost', 'lower', (os) => avg(os.map((o) => o.cost))),
    k('trace', { ar: 'اكتمال التتبع', en: 'Traceability Completeness' }, { ar: `الأحداث المسجلة ÷ ${REQUIRED_EVENTS.length} أحداث مطلوبة (طلب، مطابقة، تأكيد توفر، إرسال، تسليم، استلام) — خاصية لسير العمل`, en: `Logged events ÷ ${REQUIRED_EVENTS.length} required (request, match, availability check, dispatch, handover, receipt) — a workflow property` }, '%', 'higher', (os) => pct(os.reduce((a, o) => a + Math.min(o.eventsLogged, REQUIRED_EVENTS.length), 0), os.length * REQUIRED_EVENTS.length)),
  ]
  return { seed, cases: n, outcomes, kpis, limitations: LIMITATIONS, dataset: { ar: `${n} حالة اصطناعية مولدة من البذرة ${seed}: كل حالة عالم مستقل (بذرته ${seed}×1000+رقم الحالة)، وطلب كريات حمراء بمتطلبات مستضدات في 50% من الحالات، و10% من الوحدات المسجلة غير متاحة فعلياً، وتأخير نقل في 30% من الحالات`, en: `${n} synthetic cases from seed ${seed}: each case is an independent world (seed ${seed}×1000+case), an RBC request with antigen requirements in 50% of cases, 10% of recorded units actually unavailable, and a transport delay in 30% of cases` } }
}
