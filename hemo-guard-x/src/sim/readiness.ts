import { facilityById } from './data'
import { buildPlans, type Plan, type PlanSet } from './planner'
import { STAGES, type Mission, type Stage, type SupplyRequest, type T, type World } from './types'

// HEMO-READY AI readiness assessment. Technology disclosure: deterministic rules over the
// shared synthetic state. No trained model and no language model are used here.
// Deliberately no single "readiness %": the result is a set of checks and a named state.

export type CheckState = 'ok' | 'pending' | 'missing' | 'conflict' | 'na'

export interface Check { key: string; label: T; state: CheckState; detail: T }

export interface Gap { severity: 'high' | 'medium' | 'low'; kind: 'missing' | 'conflict'; text: T }

export interface Action {
  text: T
  /** Who must act. Clinical actions are always human. */
  owner: 'human' | 'system'
  /** Estimated minutes to resolve (illustrative). */
  etaMin: number
  /** Feasibility rank inputs, shown with the action. */
  feasibility: 'high' | 'medium' | 'low'
  why: T
}

export type Overall = 'not_ready' | 'conditional' | 'awaiting_human' | 'complete'

export const OVERALL_LABEL: Record<Overall, T> = {
  not_ready: { ar: 'غير جاهز — لا يوجد مسار قابل للتنفيذ', en: 'Not ready — no feasible pathway' },
  conditional: { ar: 'جاهزية مشروطة — توجد نواقص يجب استكمالها', en: 'Conditional — gaps must be closed' },
  awaiting_human: { ar: 'مسار جاهز تشغيلياً — بانتظار الاعتماد البشري', en: 'Pathway ready — awaiting human authorization' },
  complete: { ar: 'اكتمل الاعتماد والتسليم', en: 'Authorization and delivery complete' },
}

export interface Assessment {
  request: SupplyRequest
  plans: PlanSet
  checks: Check[]
  gaps: Gap[]
  actions: Action[]
  overall: Overall
  /** Data, assumptions, constraints and human review requirements for the explainability panel. */
  explain: { reason: T; data: T[]; assumptions: T[]; constraints: T[]; human: T[] }
}

export function missionFor(w: World, requestId: string): Mission | undefined {
  return w.missions.find((m) => m.requestId === requestId && m.state !== 'cancelled')
}

export function assess(w: World, req: SupplyRequest, noResponse: string[] = []): Assessment {
  const plans = buildPlans(w, req, { noResponse })
  const mission = missionFor(w, req.id)
  const plan: Plan | null = (mission && plans.plans.find((p) => p.id === mission.planId)) || plans.primary
  const ship = mission?.shipmentId ? w.shipments.find((s) => s.id === mission.shipmentId) : undefined
  const missingInfo = (Object.entries(req.info) as [keyof SupplyRequest['info'], boolean][]).filter(([, ok]) => !ok).map(([k]) => k)

  const infoLabel: Record<string, T> = {
    orderAuthorized: { ar: 'الطلب المعتمد من جهة مخولة', en: 'Authorized clinical order' },
    requirementDocumented: { ar: 'توثيق المتطلبات المناعية', en: 'Documented immunological requirement' },
    sampleReceived: { ar: 'استلام العينة في المختبر المختص', en: 'Sample received by specialist lab' },
  }

  const unitsConfirmed = (plan && plan.kind !== 'donor') && plan.unitIds.length > 0 && plan.unitIds.every((id) => w.units.find((u) => u.id === id)?.verification === 'confirmed')
  const checks: Check[] = [
    {
      key: 'info', label: { ar: 'اكتمال معلومات الطلب', en: 'Request information completeness' },
      state: missingInfo.length ? 'missing' : 'ok',
      detail: missingInfo.length ? { ar: `ناقص: ${missingInfo.map((k) => infoLabel[k].ar).join('، ')}`, en: `Missing: ${missingInfo.map((k) => infoLabel[k].en).join(', ')}` } : { ar: 'كل الحقول المطلوبة مكتملة', en: 'All required fields complete' },
    },
    {
      key: 'inventory', label: { ar: 'التحقق من المخزون', en: 'Inventory verification' },
      state: !plan ? 'missing' : plan.kind === 'donor' ? 'na' : unitsConfirmed ? 'ok' : 'pending',
      detail: !plan ? { ar: 'لا توجد وحدات مرشحة قابلة للتنفيذ', en: 'No feasible candidate units' }
        : plan.kind === 'donor' ? { ar: 'المسار يعتمد على متبرع وليس على مخزون', en: 'Pathway relies on a donor, not stock' }
        : unitsConfirmed ? { ar: 'تم تأكيد توفر الوحدات المرشحة', en: 'Candidate units confirmed available' }
        : { ar: 'الوحدات المرشحة مسجلة ولم يُؤكد توفرها لدى جهة الإمداد', en: 'Candidate units are recorded but not confirmed at the source' },
    },
    {
      key: 'review', label: { ar: 'حالة المراجعة المختصة', en: 'Specialist review state' },
      state: req.review === 'completed' ? 'ok' : 'pending',
      detail: req.review === 'completed' ? { ar: 'اكتملت مراجعة المختبر المختص', en: 'Specialist lab review completed' } : { ar: 'الطلب يحتاج إلى استكمال مراجعة المختبر المختص قبل اعتماد مسار الإمداد', en: 'Specialist lab review must be completed before the pathway is approved' },
    },
    {
      key: 'logistics', label: { ar: 'التحقق اللوجستي', en: 'Logistics verification' },
      state: ship?.state === 'held_for_review' ? 'conflict' : mission?.done.includes('transport') ? 'ok' : plan ? 'pending' : 'missing',
      detail: ship?.state === 'held_for_review' ? { ar: 'الشحنة محجوزة بعد انحراف حراري بانتظار قرار مختص', en: 'Shipment held after a temperature excursion, awaiting specialist decision' }
        : mission?.done.includes('transport') ? { ar: 'تم تأكيد جاهزية النقل', en: 'Transport readiness confirmed' }
        : plan ? { ar: `النقل غير مؤكد بعد (${plan.timeMin} دقيقة مقدرة)`, en: `Transport not yet confirmed (${plan.timeMin} min estimated)` } : { ar: 'لا يوجد مسار نقل', en: 'No transport route' },
    },
  ]

  const gaps: Gap[] = []
  for (const k of missingInfo) gaps.push({ severity: 'high', kind: 'missing', text: { ar: `لم يُستكمل: ${infoLabel[k].ar}`, en: `Not completed: ${infoLabel[k].en}` } })
  if ((plan && plan.kind !== 'donor') && !unitsConfirmed) gaps.push({ severity: 'high', kind: 'missing', text: { ar: 'لم يتم تأكيد توفر الوحدة المرشحة لدى جهة الإمداد', en: 'Candidate unit availability not confirmed at the source' } })
  if (req.review !== 'completed') gaps.push({ severity: 'high', kind: 'missing', text: { ar: 'الطلب يحتاج إلى استكمال مراجعة المختبر المختص قبل اعتماد مسار الإمداد', en: 'Specialist laboratory review must be completed before approving the pathway' } })
  if (!plans.primary) gaps.push({ severity: 'high', kind: 'conflict', text: { ar: 'لا يوجد مسار إمداد يحقق القيود الحالية', en: 'No supply pathway satisfies current constraints' } })
  if (ship?.state === 'held_for_review') gaps.push({ severity: 'high', kind: 'conflict', text: { ar: 'سجل حراري خارج النطاق للشحنة — لا يُعتبر المنتج صالحاً تلقائياً', en: 'Shipment temperature out of range — product is not considered acceptable automatically' } })
  const typedMissing = w.units.filter((u) => u.component === req.component && req.antigenNeg.length > 0 && u.antigenNeg === null).length
  if (typedMissing) gaps.push({ severity: 'low', kind: 'missing', text: { ar: `${typedMissing} وحدة من نفس المكوّن بدون تنميط موسع مسجل، فلا يمكن ترشيحها`, en: `${typedMissing} units of this component lack recorded extended typing and cannot be shortlisted` } })

  const actions: Action[] = []
  if (missingInfo.length) actions.push({ owner: 'human', etaMin: 15, feasibility: 'high', text: { ar: 'استكمال بيانات الطلب من الجهة الطالبة', en: 'Complete the request data with the requesting team' }, why: { ar: 'لا يمكن تقييم المسار دون بيانات مكتملة', en: 'The pathway cannot be assessed without complete data' } })
  if ((plan && plan.kind !== 'donor') && !unitsConfirmed) actions.push({ owner: 'human', etaMin: 10, feasibility: 'high', text: { ar: `التواصل مع ${facilityById(w, plan.sourceId).name.ar} لتأكيد توفر الوحدات المرشحة`, en: `Contact ${facilityById(w, plan.sourceId).name.en} to confirm candidate units` }, why: { ar: 'الوحدة المسجلة ليست بالضرورة متاحة', en: 'A recorded unit is not necessarily available' } })
  if (plans.backup) actions.push({ owner: 'human', etaMin: 10, feasibility: 'medium', text: { ar: `التواصل مع مركز إمداد بديل (${facilityById(w, plans.backup.sourceId === 'RARE-LINK' ? req.facilityId : plans.backup.sourceId).name.ar}) لتأكيد وجود وحدة مرشحة ضمن المهلة`, en: `Contact an alternative source (${facilityById(w, plans.backup.sourceId === 'RARE-LINK' ? req.facilityId : plans.backup.sourceId).name.en}) to confirm a candidate within the deadline` }, why: { ar: 'تجهيز خطة بديلة قبل تعطل المسار الأساسي', en: 'Prepare a backup before the primary path fails' } })
  if (req.review !== 'completed') actions.push({ owner: 'human', etaMin: 60, feasibility: 'medium', text: { ar: 'متابعة استكمال المراجعة المختصة', en: 'Follow up the specialist review' }, why: { ar: 'الاعتماد السريري صلاحية المختص فقط', en: 'Clinical authorization belongs to the specialist only' } })
  if (!plans.primary && (req.rare || req.hla || req.antigenNeg.length)) actions.push({ owner: 'human', etaMin: 120, feasibility: 'low', text: { ar: 'تصعيد الطلب عبر RARE-LINK والتواصل مع شبكات الدم النادر وفق الضوابط', en: 'Escalate through RARE-LINK and contact rare blood networks per protocol' }, why: { ar: 'لا يوجد مسار محلي قابل للتنفيذ', en: 'No feasible local pathway' } })
  const rank = { high: 0, medium: 1, low: 2 }
  actions.sort((a, b) => rank[a.feasibility] - rank[b.feasibility] || a.etaMin - b.etaMin)

  const overall: Overall = mission?.state === 'completed' ? 'complete' : !plans.primary && !mission ? 'not_ready' : gaps.some((g) => g.severity === 'high') ? 'conditional' : 'awaiting_human'

  const dest = facilityById(w, req.facilityId)
  return {
    request: req, plans, checks, gaps, actions, overall,
    explain: {
      reason: plan ? { ar: `المسار المقترح من ${plan.sourceId === 'RARE-LINK' ? 'شبكة المتبرعين' : facilityById(w, plan.sourceId).name.ar} لأنه الأسرع بين ${plans.plans.filter((p) => p.feasible).length} خيارات قابلة للتنفيذ (${plan.timeMin} دقيقة مقدرة)`, en: `Proposed from ${plan.sourceId === 'RARE-LINK' ? 'the donor network' : facilityById(w, plan.sourceId).name.en}: fastest of ${plans.plans.filter((p) => p.feasible).length} feasible options (${plan.timeMin} min est.)` } : { ar: 'لا توجد توصية: لا يوجد خيار يحقق القيود', en: 'No recommendation: no option satisfies the constraints' },
      data: [
        { ar: `سجلات المخزون الاصطناعية لـ ${w.facilities.length} منشآت`, en: `Synthetic inventory records for ${w.facilities.length} facilities` },
        { ar: 'حالة التحقق المسجلة لكل وحدة', en: 'Recorded verification state per unit' },
        { ar: `المسافات ومسار النقل إلى ${dest.name.ar}`, en: `Distances and route to ${dest.name.en}` },
        { ar: 'سجل المتبرعين الاصطناعي (بدون بيانات شخصية)', en: 'Synthetic donor registry (no personal data)' },
      ],
      assumptions: [
        { ar: 'سرعة نقل ثابتة 80 كم/س وزمن تجهيز افتراضي لكل مكوّن', en: 'Fixed 80 km/h transport speed and default preparation time per component' },
        { ar: 'تأكيد التوفر يستغرق 10 دقائق لكل جهة', en: 'Availability confirmation takes 10 minutes per source' },
        { ar: 'قيم توضيحية قابلة للضبط من مختصين، وليست إرشادات سريرية', en: 'Illustrative values configurable by specialists, not clinical guidance' },
      ],
      constraints: [
        { ar: `المهلة: ${req.deadlineMin} دقيقة`, en: `Deadline: ${req.deadlineMin} min` },
        { ar: `الكمية: ${req.quantity}`, en: `Quantity: ${req.quantity}` },
        { ar: 'توفر النقل وحالة تشغيل المنشآت وصلاحية الوحدات', en: 'Courier availability, facility status and unit expiry' },
      ],
      human: [
        { ar: 'تأكيد التوفر من جهة الإمداد', en: 'Availability confirmation by the source' },
        { ar: 'المراجعة المختصة واعتماد التوافق', en: 'Specialist review and compatibility authorization' },
        { ar: 'اعتماد الصرف والتسليم', en: 'Release and delivery authorization' },
      ],
    },
  }
}

// ---------- Mission workflow with enforced human gates ----------

export const STAGE_LABEL: Record<Stage, T> = {
  candidate: { ar: 'تم العثور على مورد مرشح', en: 'Candidate source found' },
  availability: { ar: 'تم تأكيد توفر المورد', en: 'Source availability confirmed' },
  review: { ar: 'المراجعة الطبية', en: 'Medical review' },
  transport: { ar: 'تم تأكيد جاهزية النقل', en: 'Transport readiness confirmed' },
  delivered: { ar: 'اكتمل الاعتماد والتسليم', en: 'Authorization and delivery complete' },
}

/** Who may complete each stage. Only the first is automatic. */
export const STAGE_ACTOR: Record<Stage, 'system' | 'human'> = {
  candidate: 'system', availability: 'human', review: 'human', transport: 'human', delivered: 'human',
}

export function nextStage(m: Mission): Stage | null {
  return STAGES.find((s) => !m.done.includes(s)) ?? null
}

/** Why a stage cannot be completed yet, or null if it can. */
export function stageBlocker(w: World, m: Mission, stage: Stage): T | null {
  const idx = STAGES.indexOf(stage)
  if (STAGES.slice(0, idx).some((s) => !m.done.includes(s))) return { ar: 'يجب إكمال المراحل السابقة أولاً', en: 'Previous stages must be completed first' }
  const req = w.requests.find((r) => r.id === m.requestId)!
  if (stage === 'review' && req.review !== 'completed') return { ar: 'لم يسجل المختص اكتمال المراجعة بعد', en: 'The specialist has not recorded the review as complete' }
  if (stage === 'delivered') {
    const s = m.shipmentId ? w.shipments.find((x) => x.id === m.shipmentId) : undefined
    if (!s) return { ar: 'لا توجد شحنة مرتبطة', en: 'No linked shipment' }
    if (s.state === 'held_for_review' && s.specialistDecision !== 'released') return { ar: 'الشحنة محجوزة بعد انحراف حراري — يلزم قرار مختص', en: 'Shipment held after excursion — specialist decision required' }
    if (s.specialistDecision === 'discarded') return { ar: 'قرر المختص استبعاد الشحنة — يلزم مسار بديل', en: 'Specialist discarded the shipment — an alternative pathway is required' }
  }
  return null
}
