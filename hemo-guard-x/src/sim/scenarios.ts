import { advanceTime, cancelMission, completeInfo, completeStage, recordReview, startMission } from './actions'
import { facilityById, generateWorld } from './data'
import { applyDisruption, buildPlans, explainChange, type Plan, type PlanSet } from './planner'
import { assess, type Assessment } from './readiness'
import { rng } from './rng'
import { DEFAULT_RULES, COMPONENT } from './rules'
import { evaluateShipment, excursions, simulateTelemetry, type Excursion } from './transport'
import type { ABO, AuditEvent, ComponentType, Reading, Rh, SupplyRequest, T, World } from './types'

// NAJA Digital Twin scenarios. Every scenario is FICTIONAL, uses synthetic data only, and is not
// connected to any real military, government or medical institution. Results are reproducible:
// the same inputs and seed always produce the same output.

export type FieldDef =
  | { key: string; label: T; type: 'number'; min: number; max: number; step?: number; unit?: T }
  | { key: string; label: T; type: 'select'; options: { value: string; label: T }[] }
  | { key: string; label: T; type: 'toggle' }
  | { key: string; label: T; type: 'antigens' }

export type Inputs = Record<string, string | number | boolean | string[]>

export interface ScenarioResult {
  title: T
  inputs: Inputs
  seed: number
  world: World
  events: AuditEvent[]
  assumptions: T[]
  /** Headline outcome of the run, stated without claiming real-world results. */
  outcome: T
  before?: PlanSet
  after?: PlanSet
  changes?: { plan: Plan; note: T }[]
  assessment?: Assessment
  telemetry?: { readings: Reading[]; excursions: Excursion[]; component: ComponentType; note: T }
  table?: { head: T[]; rows: (string | number | T)[][] }
  uncovered?: { request: SupplyRequest; reason: T }[]
}

export interface Scenario {
  id: string
  code: string
  title: T
  desc: T
  fictional: T
  fields: FieldDef[]
  defaults: Inputs
  run: (inputs: Inputs) => ScenarioResult
}

const FICTION: T = { ar: 'سيناريو افتراضي بالكامل، غير مرتبط بأي جهة عسكرية أو طبية حقيقية، ويستخدم بيانات اصطناعية.', en: 'Entirely fictional scenario, not connected to any real military or medical institution, using synthetic data.' }
const SEED: FieldDef = { key: 'seed', label: { ar: 'بذرة المحاكاة', en: 'Simulation seed' }, type: 'number', min: 1, max: 99999 }
const groups = (['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as const).map((g) => ({ value: g, label: { ar: g.replace('-', '−'), en: g.replace('-', '−') } }))
const parseGroup = (g: string): [ABO, Rh] => [g.slice(0, -1) as ABO, g.endsWith('-') ? '-' : '+']

/** Runs a mission through all five stages, with the human roles SCRIPTED for the simulation. */
function scriptedMission(w: World, reqId: string, planId: string | undefined): World {
  let x = startMission(w, reqId, planId).world
  const m = () => x.missions.find((mm) => mm.requestId === reqId && mm.state !== 'cancelled')
  if (!m()) return x
  const req = x.requests.find((r) => r.id === reqId)!
  if (Object.values(req.info).some((v) => !v)) x = completeInfo(x, reqId).world
  x = completeStage(x, m()!.id, 'availability', 'human').world
  // Rescue: if confirmation reveals unavailable units, cancel and replan on the updated state (max 2 retries).
  for (let attempt = 0; attempt < 2 && m()?.state === 'blocked'; attempt++) {
    x = cancelMission(x, m()!.id).world
    const next = buildPlans(x, req).primary
    x = { ...x, audit: [...x.audit, { id: `A-r${x.audit.length}`, at: x.now, actor: 'system', kind: 'replan', text: next ? { ar: `إعادة التخطيط: الانتقال إلى المسار البديل (${next.timeMin} دقيقة مقدرة)`, en: `Replanning: switching to the backup pathway (${next.timeMin} min est.)` } : { ar: 'إعادة التخطيط: لا يوجد مسار بديل قابل للتنفيذ', en: 'Replanning: no feasible backup pathway' } }] }
    if (!next) return x
    x = startMission(x, reqId, next.id).world
    x = completeStage(x, m()!.id, 'availability', 'human').world
  }
  if (!m() || m()!.state === 'blocked') return x
  x = recordReview(x, reqId).world
  x = completeStage(x, m()!.id, 'review', 'human').world
  x = completeStage(x, m()!.id, 'transport', 'human').world
  const ship = x.shipments.find((s) => s.id === m()!.shipmentId)
  if (ship) x = advanceTime(x, ship.etaAt - x.now).world
  const r = completeStage(x, m()!.id, 'delivered', 'human')
  return r.error ? x : r.world
}

const SCRIPT_NOTE: T = { ar: 'الأدوار البشرية (التأكيد، المراجعة، الاعتماد) مُمثلة آلياً في هذه المحاكاة فقط، وتُسجل في السجل كإجراءات بشرية. في الواقع تبقى صلاحية المختصين.', en: 'Human roles (confirmation, review, authorization) are scripted in this simulation only and logged as human actions. In reality they remain with authorized professionals.' }

// ---------------------------------------------------------------- 01 Southern Border
const southern: Scenario = {
  id: 'southern-border', code: '01',
  title: { ar: 'مهمة إنقاذ — الحد الجنوبي', en: 'Southern Border Emergency' },
  desc: { ar: 'سيناريو افتراضي لرجل أمن يتعرض لإصابة خلال مهمة ميدانية، ويصدر الفريق الطبي طلبًا عاجلًا لوحدات دم ذات متطلبات توافق خاصة. تختبر المحاكاة قدرة الشبكة على تحديد خيارات الإمداد، والتأكد من جاهزيتها، وإعادة التخطيط عند تعطل أحد المسارات.', en: 'A fictional scenario in which a security officer is injured during a field mission and the medical team issues an urgent request for blood units with special compatibility requirements. The simulation tests whether the network can identify supply options, verify their readiness, and replan when a pathway fails.' },
  fictional: { ar: `${FICTION.ar} يواصل الفريق الطبي العلاج الإسعافي بشكل مستقل عن محاكاة الإمداد.`, en: `${FICTION.en} The clinical team continues emergency treatment independently of the supply simulation.` },
  fields: [
    SEED,
    { key: 'group', label: { ar: 'الفصيلة في الطلب', en: 'Requested group' }, type: 'select', options: groups },
    { key: 'antigens', label: { ar: 'مستضدات يجب أن تكون سالبة', en: 'Required antigen-negative' }, type: 'antigens' },
    { key: 'quantity', label: { ar: 'عدد الوحدات', en: 'Units' }, type: 'number', min: 1, max: 6 },
    { key: 'deadline', label: { ar: 'المهلة', en: 'Deadline' }, type: 'number', min: 60, max: 720, step: 30, unit: { ar: 'دقيقة', en: 'min' } },
    { key: 'disruption', label: { ar: 'حدث تعطل', en: 'Disruption' }, type: 'select', options: [
      { value: 'none', label: { ar: 'بدون', en: 'None' } },
      { value: 'unit_unavailable', label: { ar: 'وحدة المسار الأساسي تصبح غير متاحة', en: 'Primary unit becomes unavailable' } },
      { value: 'transport_delay', label: { ar: 'تأخر النقل على المسار الأساسي', en: 'Transport delay on primary route' } },
      { value: 'facility_down', label: { ar: 'تعطل جهة الإمداد الأساسية', en: 'Primary source facility interruption' } },
    ] },
    { key: 'delay', label: { ar: 'مقدار التأخير', en: 'Delay amount' }, type: 'number', min: 15, max: 300, step: 15, unit: { ar: 'دقيقة', en: 'min' } },
  ],
  defaults: { seed: 2026, group: 'O+', antigens: ['K', 'Fyb'], quantity: 2, deadline: 360, disruption: 'unit_unavailable', delay: 120 },
  run(inp) {
    const [abo, rh] = parseGroup(String(inp.group))
    const req: SupplyRequest = {
      id: 'REQ-SB01', facilityId: 'F7', component: 'RBC', abo, rh, antigenNeg: inp.antigens as string[], quantity: Number(inp.quantity),
      deadlineMin: Number(inp.deadline), priority: 'critical', info: { orderAuthorized: true, requirementDocumented: true, sampleReceived: true }, review: 'in_progress', createdAt: 0,
      label: { ar: 'طلب عاجل من نقطة طبية ميدانية (افتراضي)', en: 'Urgent request from a field medical point (fictional)' },
    }
    let w = generateWorld(Number(inp.seed), [req])
    const before = buildPlans(w, req)
    w = { ...w, audit: [...w.audit, { id: 'A-s1', at: 0, actor: 'system', kind: 'request', text: { ar: `استقبال طلب معتمد: ${req.quantity} وحدة ${String(inp.group).replace('-', '−')} مع متطلبات مستضدات، مهلة ${req.deadlineMin} دقيقة`, en: `Authorized request received: ${req.quantity} × ${inp.group} with antigen requirements, ${req.deadlineMin} min deadline` } }, { id: 'A-s2', at: 0, actor: 'system', kind: 'plans', text: { ar: `${before.plans.length} خيارات إمداد، منها ${before.plans.filter((p) => p.feasible).length} قابلة للتنفيذ`, en: `${before.plans.length} supply options, ${before.plans.filter((p) => p.feasible).length} feasible` } }] }
    let after: PlanSet | undefined
    let changes: { plan: Plan; note: T }[] | undefined
    const d = String(inp.disruption)
    if (d !== 'none' && before.primary) {
      const p = before.primary
      w = d === 'unit_unavailable' && p.unitIds[0] ? applyDisruption(w, { type: 'unit_unavailable', unitId: p.unitIds[0] })
        : d === 'transport_delay' ? applyDisruption(w, { type: 'transport_delay', facilityId: p.sourceId, minutes: Number(inp.delay) })
        : d === 'facility_down' && p.kind === 'inventory' ? applyDisruption(w, { type: 'facility_down', facilityId: p.sourceId }) : w
      after = buildPlans(w, req)
      changes = before.plans.slice(0, 6).map((bp) => ({ plan: bp, note: explainChange(bp, after!.plans.find((x) => x.id === bp.id)) }))
      w = { ...w, audit: [...w.audit, { id: 'A-s3', at: 0, actor: 'sim', kind: 'disruption', text: { ar: `حدث تعطل على المسار الأساسي — إعادة حساب الخيارات (${after.plans.filter((x) => x.feasible).length} قابلة للتنفيذ)`, en: `Disruption on primary pathway — options recalculated (${after.plans.filter((x) => x.feasible).length} feasible)` } }] }
    }
    const chosen = (after ?? before).primary
    const final = chosen ? scriptedMission(w, req.id, chosen.id) : w
    const mission = [...final.missions].reverse().find((mm) => mm.state !== 'cancelled')
    const outcome: T = !chosen || !mission ? { ar: 'لا يوجد مسار قابل للتنفيذ ضمن القيود بعد إعادة التخطيط — الطلب غير مغطى في المحاكاة ويلزم التصعيد', en: 'No feasible pathway within constraints after replanning — request uncovered in simulation; escalation required' }
      : mission?.state === 'completed' ? { ar: `اكتمل مسار الإمداد في المحاكاة من ${chosen.sourceId === 'RARE-LINK' ? 'شبكة المتبرعين' : facilityById(final, chosen.sourceId).name.ar} خلال ${final.now} دقيقة محاكاة`, en: `Supply pathway completed in simulation from ${chosen.sourceId === 'RARE-LINK' ? 'the donor network' : facilityById(final, chosen.sourceId).name.en} in ${final.now} simulated min` }
      : { ar: 'توقف المسار أثناء التنفيذ (وحدة غير متاحة فعلياً عند التأكيد) — يلزم إعادة التخطيط', en: 'Pathway stopped during execution (unit not actually available on confirmation) — replanning required' }
    return { title: this.title, inputs: inp, seed: Number(inp.seed), world: final, events: final.audit, before, after, changes, assessment: assess(w, req), outcome,
      assumptions: [SCRIPT_NOTE, { ar: 'سرعة نقل بري ثابتة 80 كم/س، وزمن تسليم إضافي 20 دقيقة في النقطة الميدانية', en: 'Fixed 80 km/h ground transport; 20 min extra handover at the field point' }, { ar: 'الفرز تشغيلي أولي (ABO/Rh ومستضدات مسجلة) وليس اعتماد توافق سريري', en: 'Operational pre-screen only (ABO/Rh and recorded antigens), not clinical compatibility approval' }] }
  },
}

// ---------------------------------------------------------------- 02 Specialist platelets
const platelets: Scenario = {
  id: 'specialist-platelets', code: '02',
  title: { ar: 'طلب صفائح دموية متخصصة', en: 'Specialist Platelet Request' },
  desc: { ar: 'سيناريو افتراضي لطلب معتمد لصفائح مختارة بناءً على متطلبات مناعية موثقة، مع اختبار اكتمال المعلومات وتوفر المنتج ووقت التجهيز ومسار النقل.', en: 'A fictional authorized request for selected platelets based on documented immunological requirements, testing information completeness, product availability, preparation time and transport.' },
  fictional: FICTION,
  fields: [
    SEED,
    { key: 'hla', label: { ar: 'ملف HLA المطلوب (اصطناعي)', en: 'Required HLA profile (synthetic)' }, type: 'select', options: ['HLA-A2/B44', 'HLA-A24/B51', 'HLA-A1/B8', 'HLA-A11/B35', 'HLA-A3/B7'].map((v) => ({ value: v, label: { ar: v, en: v } })) },
    { key: 'deadlineH', label: { ar: 'المهلة', en: 'Deadline' }, type: 'number', min: 6, max: 120, step: 6, unit: { ar: 'ساعة', en: 'h' } },
    { key: 'documented', label: { ar: 'المتطلب المناعي موثق', en: 'Immunological requirement documented' }, type: 'toggle' },
    { key: 'script', label: { ar: 'تمثيل الأدوار البشرية آلياً', en: 'Script the human roles' }, type: 'toggle' },
  ],
  defaults: { seed: 2026, hla: 'HLA-A2/B44', deadlineH: 48, documented: false, script: true },
  run(inp) {
    const req: SupplyRequest = {
      id: 'REQ-PL02', facilityId: 'F4', component: 'PLT_HLA', abo: 'O', rh: '+', antigenNeg: [], hla: String(inp.hla), quantity: 1,
      deadlineMin: Number(inp.deadlineH) * 60, priority: 'urgent', info: { orderAuthorized: true, requirementDocumented: Boolean(inp.documented), sampleReceived: true }, review: 'pending', createdAt: 0,
      label: { ar: 'صفائح مختارة وفق متطلبات مناعية (افتراضي)', en: 'Selected platelets per immunological requirement (fictional)' },
    }
    let w = generateWorld(Number(inp.seed), [req])
    const before = buildPlans(w, req)
    const a = assess(w, req)
    w = { ...w, audit: [...w.audit, { id: 'A-p1', at: 0, actor: 'system', kind: 'gaps', text: { ar: `فحص الفجوات: ${a.gaps.length} فجوة`, en: `Gap check: ${a.gaps.length} gap(s)` } }] }
    let final = w
    if (inp.script && before.primary) {
      if (!inp.documented) {
        final = { ...final, audit: [...final.audit, { id: 'A-p2', at: 0, actor: 'system', kind: 'hold', text: { ar: 'إيقاف: لا يمكن اعتماد المسار قبل توثيق المتطلب المناعي', en: 'Hold: the pathway cannot be approved before the immunological requirement is documented' } }] }
      } else final = scriptedMission(w, req.id, before.primary.id)
    }
    const m = [...final.missions].reverse().find((mm) => mm.state !== 'cancelled')
    const outcome: T = !before.primary ? { ar: 'لا يوجد منتج أو متبرع مطابق ضمن المهلة في المحاكاة — يلزم التصعيد لمختبر مرجعي', en: 'No matching product or donor within the deadline in simulation — escalation to a reference laboratory required' }
      : !inp.documented ? { ar: 'المسار متاح لكنه مشروط: المتطلب المناعي غير موثق', en: 'Pathway available but conditional: immunological requirement not documented' }
      : m?.state === 'completed' ? { ar: `اكتمل المسار في المحاكاة خلال ${Math.round(final.now / 60)} ساعة محاكاة`, en: `Pathway completed in simulation in ${Math.round(final.now / 60)} simulated hours` }
      : { ar: 'مسار مقترح بانتظار الإجراءات البشرية', en: 'Proposed pathway awaiting human actions' }
    return { title: this.title, inputs: inp, seed: Number(inp.seed), world: final, events: final.audit, before, assessment: assess(final, final.requests[0]), outcome,
      assumptions: [{ ar: 'تجهيز صفائح مختارة يحتاج وقتاً أطول؛ يذكر الدليل الكندي أن الحصول على أول منتج مختار قد يتأخر عدة أيام لأن اختيار المتبرعين والتواصل معهم يستغرق وقتاً', en: 'Selected platelets take longer to prepare; the Canadian guide notes the first selected product is often delayed several days because selecting and contacting donors takes time' }, { ar: 'ملفات HLA اصطناعية لأغراض العرض فقط', en: 'HLA profiles are synthetic, for demonstration only' }, SCRIPT_NOTE] }
  },
}

// ---------------------------------------------------------------- 03 Inventory shortage
const shortage: Scenario = {
  id: 'inventory-shortage', code: '03',
  title: { ar: 'نقص مخزون متوقع', en: 'Inventory Shortage' },
  desc: { ar: 'يحاكي النموذج ارتفاع الطلب ويقيّم إجراءات التخفيف الممكنة.', en: 'The model simulates rising demand and evaluates possible mitigation actions.' },
  fictional: FICTION,
  fields: [
    SEED,
    { key: 'group', label: { ar: 'الفصيلة المراقبة', en: 'Monitored group' }, type: 'select', options: groups },
    { key: 'multiplier', label: { ar: 'مضاعف الطلب', en: 'Demand multiplier' }, type: 'number', min: 1, max: 5, step: 0.5 },
    { key: 'horizon', label: { ar: 'أفق التوقع', en: 'Horizon' }, type: 'number', min: 12, max: 96, step: 12, unit: { ar: 'ساعة', en: 'h' } },
  ],
  defaults: { seed: 2026, group: 'O-', multiplier: 2.5, horizon: 48 },
  run(inp) {
    const [abo, rh] = parseGroup(String(inp.group))
    const w = generateWorld(Number(inp.seed), [])
    const r = rng(Number(inp.seed) + 7)
    const H = Number(inp.horizon), mult = Number(inp.multiplier)
    const rows = w.facilities.filter((f) => f.kind !== 'field').map((f) => {
      const stock = w.units.filter((u) => u.facilityId === f.id && u.component === 'RBC' && u.abo === abo && u.rh === rh && u.verification !== 'unavailable').length
      const baseDaily = Math.max(0.3, stock * 0.12) // illustrative baseline usage per day
      const expected = +(baseDaily * (H / 24) * mult * (0.85 + r.next() * 0.3)).toFixed(1)
      const par = Math.max(2, Math.round(stock * 0.4))
      const projected = +(stock - expected).toFixed(1)
      return { f, stock, expected, projected, par, risk: projected < 0 ? 'high' : projected < par ? 'mid' : 'low' }
    })
    const donors = rows.filter((x) => x.projected - x.par > 1).sort((a, b) => b.projected - a.projected)
    const needers = rows.filter((x) => x.risk !== 'low').sort((a, b) => a.projected - b.projected)
    const mitigation: T[] = []
    for (const n of needers) {
      const need = Math.ceil(n.par - n.projected)
      const d = donors.find((x) => x.projected - x.par >= need)
      if (d) { d.projected -= need; mitigation.push({ ar: `نقل ${need} وحدة من ${d.f.name.ar} إلى ${n.f.name.ar} (يتطلب موافقة الجهتين)`, en: `Transfer ${need} unit(s) from ${d.f.name.en} to ${n.f.name.en} (requires both sites' approval)` }) }
      else mitigation.push({ ar: `لا يوجد فائض كافٍ لتغطية ${n.f.name.ar}: النظر في استدعاء متبرعين مؤهلين وتأجيل الإجراءات غير العاجلة بقرار المختصين`, en: `No sufficient surplus for ${n.f.name.en}: consider recalling eligible donors and deferring non-urgent procedures per specialists` })
    }
    const label = { high: { ar: 'مرتفع', en: 'High' }, mid: { ar: 'متوسط', en: 'Medium' }, low: { ar: 'منخفض', en: 'Low' } }
    const events: AuditEvent[] = [
      ...w.audit,
      { id: 'A-i1', at: 0, actor: 'system', kind: 'forecast', text: { ar: `إسقاط استهلاك ${String(inp.group).replace('-', '−')} لمدة ${H} ساعة بمضاعف ${mult}`, en: `Projected ${inp.group} usage over ${H} h at ×${mult}` } },
      ...mitigation.map((m, i) => ({ id: `A-i${i + 2}`, at: 0, actor: 'system' as const, kind: 'mitigation', text: m })),
    ]
    return { title: this.title, inputs: inp, seed: Number(inp.seed), world: w, events,
      outcome: { ar: `${needers.length} منشأة في خطر نقص ضمن الأفق، و${mitigation.length} إجراء تخفيف مقترح`, en: `${needers.length} facility(ies) at shortage risk within the horizon; ${mitigation.length} mitigation action(s) proposed` },
      table: { head: [{ ar: 'المنشأة', en: 'Facility' }, { ar: 'المخزون', en: 'Stock' }, { ar: 'الاستهلاك المتوقع', en: 'Expected use' }, { ar: 'الحد الأدنى', en: 'Par' }, { ar: 'المتوقع بعد الأفق', en: 'Projected' }, { ar: 'الخطر', en: 'Risk' }],
        rows: rows.map((x) => [x.f.name, x.stock, x.expected, x.par, +(x.stock - x.expected).toFixed(1), label[x.risk as 'high']]) },
      assumptions: [{ ar: 'الاستهلاك الأساسي = 12% من المخزون يومياً مع تذبذب ±15% (قيمة توضيحية)', en: 'Baseline usage = 12% of stock per day with ±15% variation (illustrative)' }, { ar: 'الحد الأدنى = 40% من المخزون الحالي', en: 'Par level = 40% of current stock' }, { ar: 'تقنية: إسقاط إحصائي بسيط وقواعد تخصيص، وليس نموذج تعلم آلي مدرب', en: 'Technology: simple statistical projection and allocation rules, not a trained ML model' }],
    }
  },
}

// ---------------------------------------------------------------- 04 Cold chain incident
const coldChain: Scenario = {
  id: 'cold-chain', code: '04',
  title: { ar: 'انحراف حراري أثناء النقل', en: 'Cold Chain Incident' },
  desc: { ar: 'يكتشف النظام انحرافاً حرارياً محاكى، ويسجله، ويطلب مراجعة مختص.', en: 'The system detects a simulated anomaly, records it, and requests specialist review.' },
  fictional: FICTION,
  fields: [
    SEED,
    { key: 'component', label: { ar: 'المكوّن', en: 'Component' }, type: 'select', options: (['RBC', 'PLT', 'FFP'] as ComponentType[]).map((c) => ({ value: c, label: COMPONENT[c].name })) },
    { key: 'duration', label: { ar: 'مدة النقل', en: 'Transit duration' }, type: 'number', min: 60, max: 600, step: 30, unit: { ar: 'دقيقة', en: 'min' } },
    { key: 'anomalyAt', label: { ar: 'بدء الانحراف بعد (0 = بدون)', en: 'Anomaly starts at (0 = none)' }, type: 'number', min: 0, max: 600, step: 15, unit: { ar: 'دقيقة', en: 'min' } },
    { key: 'sensorLoss', label: { ar: 'انقطاع الحساس في منتصف الرحلة', en: 'Sensor drops mid-trip' }, type: 'toggle' },
  ],
  defaults: { seed: 2026, component: 'RBC', duration: 240, anomalyAt: 90, sensorLoss: false },
  run(inp) {
    const comp = String(inp.component) as ComponentType
    const dur = Number(inp.duration), at = Number(inp.anomalyAt)
    const readings = simulateTelemetry({ seed: Number(inp.seed), component: comp, durationMin: dur, anomalyAt: at > 0 ? at : undefined, sensorLossAt: inp.sensorLoss ? Math.round(dur / 2) : undefined })
    const ex = excursions(readings, comp)
    const w = generateWorld(Number(inp.seed), [])
    const ship = { id: 'SHP-CC04', component: comp, fromId: 'F1', toId: 'F6', unitIds: [], departAt: 0, etaAt: dur, state: 'in_transit' as const, sensor: inp.sensorLoss ? 'lost' as const : 'connected' as const, telemetry: readings, seed: Number(inp.seed), handovers: [] }
    const ev = evaluateShipment(ship)
    const [lo, hi] = DEFAULT_RULES[comp].transport
    const events: AuditEvent[] = [
      ...w.audit,
      { id: 'A-c1', at: 0, actor: 'system', kind: 'depart', text: { ar: `مغادرة الشحنة SHP-CC04 (${COMPONENT[comp].name.ar})، نطاق النقل ${lo}…${hi}°م`, en: `SHP-CC04 departs (${COMPONENT[comp].name.en}), transport range ${lo}…${hi} °C` } },
      ...ex.map((e, i) => ({ id: `A-c${i + 2}`, at: e.from, actor: 'system' as const, kind: 'excursion', text: { ar: `انحراف من الدقيقة ${e.from} إلى ${e.to} (ذروة ${e.peak}°م) — حجز وطلب مراجعة مختص`, en: `Excursion from min ${e.from} to ${e.to} (peak ${e.peak} °C) — held, specialist review requested` } })),
      ...(inp.sensorLoss ? [{ id: 'A-cl', at: Math.round(dur / 2), actor: 'system' as const, kind: 'sensor', text: { ar: 'انقطاع اتصال الحساس — السجل غير مكتمل', en: 'Sensor connection lost — record incomplete' } }] : []),
    ]
    return { title: this.title, inputs: inp, seed: Number(inp.seed), world: w, events, outcome: ev.note,
      telemetry: { readings, excursions: ex, component: comp, note: ev.note },
      assumptions: [{ ar: 'نطاقات الحرارة قيم توضيحية في قواعد المحاكاة، ويحددها المختصون في التطبيق الفعلي', en: 'Temperature ranges are illustrative rule values; specialists set them in real use' }, { ar: 'نطاق التخزين يختلف عن نطاق النقل ويُعرض كل منهما منفصلاً', en: 'Storage and transport ranges differ and are shown separately' }, { ar: 'النظام لا يعتبر المنتج صالحاً تلقائياً بعد أي انحراف', en: 'The system never considers a product acceptable automatically after an excursion' }] }
  },
}

// ---------------------------------------------------------------- 05 Network disruption
const network: Scenario = {
  id: 'network-disruption', code: '05',
  title: { ar: 'تعطل مركز إمداد', en: 'Supply Network Disruption' },
  desc: { ar: 'يعيد النظام حساب الخطط المتاحة ويحدد الطلبات غير المغطاة.', en: 'The system recalculates available plans and identifies uncovered requests.' },
  fictional: FICTION,
  fields: [
    SEED,
    { key: 'facility', label: { ar: 'المنشأة المتعطلة', en: 'Facility down' }, type: 'select', options: ['F1', 'F2', 'F5', 'F8'].map((id) => ({ value: id, label: generateWorld(1, []).facilities.find((f) => f.id === id)!.name })) },
    { key: 'requests', label: { ar: 'عدد الطلبات المتزامنة', en: 'Concurrent requests' }, type: 'number', min: 3, max: 12 },
    { key: 'delay', label: { ar: 'تأخير إضافي على كل الطرق', en: 'Extra delay on all routes' }, type: 'number', min: 0, max: 180, step: 15, unit: { ar: 'دقيقة', en: 'min' } },
  ],
  defaults: { seed: 2026, facility: 'F1', requests: 8, delay: 0 },
  run(inp) {
    const r = rng(Number(inp.seed) + 99)
    const sites = ['F3', 'F4', 'F6', 'F7', 'F2']
    const reqs: SupplyRequest[] = Array.from({ length: Number(inp.requests) }, (_, i) => {
      const special = r.chance(0.35)
      return {
        id: `REQ-N${String(i + 1).padStart(2, '0')}`, facilityId: r.pick(sites), component: 'RBC', abo: r.pick(['O', 'A', 'B'] as ABO[]), rh: r.chance(0.8) ? '+' : '-',
        antigenNeg: special ? [r.pick(['K', 'Fyb', 'Jkb', 'E'])] : [], quantity: r.int(1, 4), deadlineMin: r.pick([120, 180, 240, 360]), priority: r.pick(['critical', 'urgent', 'routine'] as const),
        info: { orderAuthorized: true, requirementDocumented: true, sampleReceived: true }, review: 'in_progress', createdAt: 0,
      }
    })
    let w = generateWorld(Number(inp.seed), reqs)
    const beforeCovered = reqs.map((q) => buildPlans(w, q).primary !== null)
    w = applyDisruption(w, { type: 'facility_down', facilityId: String(inp.facility) })
    if (Number(inp.delay)) for (const f of w.facilities) w = applyDisruption(w, { type: 'transport_delay', facilityId: f.id, minutes: Number(inp.delay) })
    const after = reqs.map((q) => ({ q, set: buildPlans(w, q) }))
    const uncovered = after.filter((x) => !x.set.primary).map((x) => {
      const best = x.set.plans[0]
      return { request: x.q, reason: best ? { ar: best.violations.map((v) => v.text.ar).join('؛ '), en: best.violations.map((v) => v.text.en).join('; ') } : { ar: 'لا توجد وحدات مطابقة في أي منشأة متاحة', en: 'No matching units at any available facility' } }
    })
    const down = facilityById(w, String(inp.facility))
    const events: AuditEvent[] = [
      ...w.audit,
      { id: 'A-n1', at: 0, actor: 'sim', kind: 'disruption', text: { ar: `حدث محاكاة: تعطل ${down.name.ar}`, en: `Simulation event: ${down.name.en} down` } },
      ...after.map((x, i) => ({ id: `A-n${i + 2}`, at: 0, actor: 'system' as const, kind: 'replan', text: x.set.primary ? { ar: `${x.q.id}: مسار بديل من ${x.set.primary.sourceId === 'RARE-LINK' ? 'شبكة المتبرعين' : facilityById(w, x.set.primary.sourceId).name.ar} (${x.set.primary.timeMin} د)`, en: `${x.q.id}: alternative via ${x.set.primary.sourceId === 'RARE-LINK' ? 'donor network' : facilityById(w, x.set.primary.sourceId).name.en} (${x.set.primary.timeMin} min)` } : { ar: `${x.q.id}: غير مغطى`, en: `${x.q.id}: uncovered` } })),
    ]
    return { title: this.title, inputs: inp, seed: Number(inp.seed), world: w, events, uncovered,
      outcome: { ar: `قبل التعطل: ${beforeCovered.filter(Boolean).length}/${reqs.length} طلبات مغطاة. بعده: ${reqs.length - uncovered.length}/${reqs.length}`, en: `Before disruption: ${beforeCovered.filter(Boolean).length}/${reqs.length} requests covered. After: ${reqs.length - uncovered.length}/${reqs.length}` },
      table: { head: [{ ar: 'الطلب', en: 'Request' }, { ar: 'الجهة', en: 'Site' }, { ar: 'المتطلبات', en: 'Requirements' }, { ar: 'قبل', en: 'Before' }, { ar: 'بعد', en: 'After' }],
        rows: after.map((x, i) => [x.q.id, facilityById(w, x.q.facilityId).name, `${x.q.quantity}× ${x.q.abo}${x.q.rh === '-' ? '−' : '+'}${x.q.antigenNeg.length ? ' ' + x.q.antigenNeg.join(',') + '−' : ''} · ${x.q.deadlineMin}′`, beforeCovered[i] ? { ar: 'مغطى', en: 'Covered' } : { ar: 'غير مغطى', en: 'Uncovered' }, x.set.primary ? { ar: `مغطى (${x.set.primary.timeMin}′)`, en: `Covered (${x.set.primary.timeMin}′)` } : { ar: 'غير مغطى', en: 'Uncovered' }]) },
      assumptions: [{ ar: 'الطلبات المتزامنة مولدة من البذرة ولا تتنافس على نفس الوحدات في هذا التقييم المبسط', en: 'Concurrent requests are generated from the seed and do not compete for the same units in this simplified assessment' }, { ar: 'التأخير الإضافي يُطبق على كل المسارات', en: 'Extra delay applies to all routes' }] }
  },
}

export const SCENARIOS: Scenario[] = [southern, platelets, shortage, coldChain, network]
