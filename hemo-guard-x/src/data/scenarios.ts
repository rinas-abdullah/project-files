// Synthetic operations data for three hypothetical sites. Not real inventory.

export const GROUPS = ['O−', 'O+', 'A−', 'A+', 'B−', 'B+', 'AB−', 'AB+'] as const

export type SiteKey = 'A' | 'B' | 'C'
export type Risk = 'low' | 'mid' | 'high'

export const SITES: Record<SiteKey, { name: string; code: string; stock: number[]; par: number[] }> = {
  A: { name: 'مستشفى عسكري', code: 'SITE-A', stock: [14, 38, 6, 30, 4, 18, 2, 9], par: [8, 20, 4, 16, 3, 10, 2, 5] },
  B: { name: 'نقطة طبية ميدانية', code: 'SITE-B', stock: [6, 12, 2, 9, 1, 5, 1, 3], par: [5, 8, 2, 6, 1, 3, 1, 2] },
  C: { name: 'مركز إمداد', code: 'SITE-C', stock: [22, 54, 9, 41, 7, 26, 3, 12], par: [10, 24, 5, 18, 3, 12, 2, 6] },
}

export type AlertLevel = 'crit' | 'warn' | 'info'
export type OpsAlert = { level: AlertLevel; title: string; detail: string; time: string }
export type Recommendation = { from: string; to: string; what: string; why: string; confidence: number; limits: string }

export type ScenarioKey = 'normal' | 'surge' | 'excursion' | 'rare'

export type Scenario = {
  label: string
  stockOverride: Partial<Record<SiteKey, number[]>>
  risk: Record<SiteKey, Risk>
  excursion: boolean
  eta: string
  alerts: OpsAlert[]
  recommendation: Recommendation | null
  log: string
}

export const SCENARIOS: Record<ScenarioKey, Scenario> = {
  normal: {
    label: 'يوم اعتيادي',
    stockOverride: {},
    risk: { A: 'low', B: 'low', C: 'low' },
    excursion: false,
    eta: '02:10',
    alerts: [{ level: 'info', title: 'قرب انتهاء صلاحية', detail: '3 وحدات A+ في SITE-A خلال 72 ساعة', time: '09:12' }],
    recommendation: null,
    log: 'عرض: يوم اعتيادي',
  },
  surge: {
    label: 'ارتفاع الطلب',
    stockOverride: { B: [2, 7, 2, 6, 1, 4, 1, 2] },
    risk: { A: 'low', B: 'high', C: 'mid' },
    excursion: false,
    eta: '02:10',
    alerts: [
      { level: 'crit', title: 'خطر نقص مرتفع', detail: 'SITE-B: مخزون O− دون حد الأمان والطلب ثلاثة أضعاف المعتاد', time: '10:41' },
      { level: 'warn', title: 'استهلاك غير معتاد', detail: 'SITE-B: 14 وحدة في 6 ساعات، والمتوسط 5 يومياً', time: '10:38' },
    ],
    recommendation: {
      from: 'SITE-A', to: 'SITE-B', what: '4 وحدات O− كريات حمراء مركزة',
      why: 'قد ينفد O− في SITE-B خلال 9 ساعات تقريباً، وزمن الإمداد من مركز الإمداد 14 ساعة. لدى SITE-A فائض فوق حد الأمان.',
      confidence: 72, limits: 'توافق ABO/Rh، وحالة الاعتماد، والصلاحية المتبقية، وموافقة بنك الدم.',
    },
    log: 'عرض: ارتفاع الطلب في SITE-B',
  },
  excursion: {
    label: 'انحراف حراري',
    stockOverride: { B: [4, 10, 2, 8, 1, 4, 1, 3] },
    risk: { A: 'low', B: 'mid', C: 'low' },
    excursion: true,
    eta: '+03:30',
    alerts: [
      { level: 'crit', title: 'انحراف حراري', detail: 'SHP-2211 سجلت 9.4 °C لمدة 18 دقيقة، ووحداتها قيد المراجعة', time: '11:06' },
      { level: 'warn', title: 'تأخر تسليم', detail: 'SHP-2211 متأخرة ثلاث ساعات ونصفاً', time: '11:02' },
      { level: 'info', title: 'مزامنة بعد انقطاع', detail: '22 حدثاً حُفظت محلياً ثم زُامنت', time: '10:55' },
    ],
    recommendation: {
      from: 'SITE-C', to: 'SITE-B', what: 'شحنة بديلة: 3 وحدات O+ ووحدتان O−',
      why: 'وحدات SHP-2211 لا تُحتسب ضمن المخزون القابل للاستخدام حتى يقرر بنك الدم.',
      confidence: 64, limits: 'المنظومة لا تحكم بصلاحية الوحدات المتأثرة.',
    },
    log: 'عرض: انحراف حراري في SHP-2211',
  },
  rare: {
    label: 'طلب نمط نادر',
    stockOverride: {},
    risk: { A: 'low', B: 'mid', C: 'low' },
    excursion: false,
    eta: '01:40',
    alerts: [
      { level: 'crit', title: 'طلب نمط نادر', detail: 'SITE-B: مصاب يحتاج دماً خالياً من K وFyb وJkb ولا وحدة مطابقة في الموقع', time: '12:20' },
      { level: 'warn', title: 'تنبيه متدرج', detail: 'RD-045 (الأقرب) لم يرد خلال 10 دقائق، فانتقل الطلب إلى RD-031', time: '12:31' },
      { level: 'info', title: 'جاهزية الدم النادر', detail: 'SITE-C: وحدتان مطابقتان مبدئياً بانتظار تحقق بنك الدم', time: '12:22' },
    ],
    recommendation: {
      from: 'SITE-C', to: 'SITE-B', what: 'وحدتان من النمط المطلوب، وإحالة RD-031 للفحص',
      why: 'وجد RARE-LINK وحدتين معتمدتين في مركز الإمداد ومتبرعاً جاهزاً على بعد 18 كم. الوحدتان تُنقلان في حاوية مراقبة.',
      confidence: 68, limits: 'التوافق الموسع والاعتماد والصرف يقررها مختص نقل الدم.',
    },
    log: 'عرض: طلب نمط نادر في SITE-B',
  },
}

/** Deterministic pseudo-random in [0,1). */
export function seed(i: number): number {
  const x = Math.sin(i * 12.9898) * 43758.5453
  return x - Math.floor(x)
}
