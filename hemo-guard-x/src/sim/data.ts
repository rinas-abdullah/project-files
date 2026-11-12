import { ANTIGENS } from './rules'
import { rng, type Rng } from './rng'
import type { ABO, ComponentType, Donor, Facility, Rh, SupplyRequest, Unit, World } from './types'

// Synthetic dataset generator. Every facility, unit and donor here is fictional and generated
// from a seed. Frequencies are ILLUSTRATIVE, chosen so the simulation exercises realistic
// difficulty; they are not population statistics.

export const DEFAULT_SEED = 2026

export const FACILITIES: Facility[] = [
  { id: 'F1', name: { ar: 'مركز الإمداد المركزي', en: 'Central Supply Centre' }, kind: 'supply_center', region: { ar: 'المنطقة الوسطى', en: 'Central region' }, x: 0, y: 0, online: true, couriers: 3 },
  { id: 'F2', name: { ar: 'بنك دم المستشفى التخصصي', en: 'Specialist Hospital Blood Bank' }, kind: 'blood_bank', region: { ar: 'المنطقة الوسطى', en: 'Central region' }, x: 18, y: 9, online: true, couriers: 2 },
  { id: 'F3', name: { ar: 'مستشفى المدينة العام', en: 'City General Hospital' }, kind: 'hospital', region: { ar: 'المنطقة الوسطى', en: 'Central region' }, x: -12, y: 15, online: true, couriers: 1 },
  { id: 'F4', name: { ar: 'مستشفى الشمال', en: 'North Hospital' }, kind: 'hospital', region: { ar: 'المنطقة الشمالية', en: 'Northern region' }, x: 40, y: 170, online: true, couriers: 1 },
  { id: 'F5', name: { ar: 'بنك الدم الإقليمي الجنوبي', en: 'Southern Regional Blood Bank' }, kind: 'blood_bank', region: { ar: 'المنطقة الجنوبية', en: 'Southern region' }, x: 60, y: -260, online: true, couriers: 2 },
  { id: 'F6', name: { ar: 'مستشفى الجنوب الإقليمي', en: 'Southern Regional Hospital' }, kind: 'hospital', region: { ar: 'المنطقة الجنوبية', en: 'Southern region' }, x: 85, y: -290, online: true, couriers: 1 },
  { id: 'F7', name: { ar: 'نقطة طبية ميدانية — القطاع الجنوبي', en: 'Field Medical Point — Southern Sector' }, kind: 'field', region: { ar: 'القطاع الجنوبي', en: 'Southern sector' }, x: 140, y: -360, online: true, couriers: 0 },
  { id: 'F8', name: { ar: 'المختبر المرجعي للدم النادر', en: 'Rare Blood Reference Laboratory' }, kind: 'supply_center', region: { ar: 'المنطقة الغربية', en: 'Western region' }, x: -210, y: -40, online: true, couriers: 2 },
]

/** Illustrative probability that a typed unit/donor is negative for each antigen. */
const NEG_P: Record<string, number> = { K: 0.9, Fya: 0.35, Fyb: 0.3, Jka: 0.25, Jkb: 0.28, S: 0.45, s: 0.1, E: 0.7, c: 0.2 }
const ABO_W: [ABO, number][] = [['O', 0.47], ['A', 0.26], ['B', 0.2], ['AB', 0.07]]
const HLA_PROFILES = ['HLA-A2/B44', 'HLA-A24/B51', 'HLA-A1/B8', 'HLA-A11/B35']

function weighted<X>(r: Rng, items: [X, number][]): X {
  let x = r.next()
  for (const [v, w] of items) { if ((x -= w) <= 0) return v }
  return items[items.length - 1][0]
}

function typing(r: Rng): string[] {
  return ANTIGENS.filter((a) => r.chance(NEG_P[a]))
}

const STOCK: Record<string, Partial<Record<ComponentType, number>>> = {
  F1: { RBC: 70, PLT: 14, FFP: 30 },
  F2: { RBC: 34, PLT: 8, FFP: 14 },
  F3: { RBC: 16, PLT: 4, FFP: 8 },
  F4: { RBC: 14, PLT: 3, FFP: 6 },
  F5: { RBC: 50, PLT: 6, FFP: 12 },
  F6: { RBC: 18, PLT: 3, FFP: 6 },
  F7: { RBC: 4 },
  F8: { RBC: 16, PLT_HLA: 3 },
}

export function generateUnits(r: Rng): Unit[] {
  const units: Unit[] = []
  let n = 1000
  for (const f of FACILITIES) {
    for (const [comp, count] of Object.entries(STOCK[f.id] ?? {}) as [ComponentType, number][]) {
      for (let i = 0; i < count; i++) {
        const abo = weighted(r, ABO_W)
        const rh: Rh = r.chance(0.9) ? '+' : '-'
        // Reference lab and blood banks type more units for extended antigens.
        const typedP = f.id === 'F8' ? 0.95 : f.kind === 'blood_bank' || f.kind === 'supply_center' ? 0.6 : 0.15
        const isRbc = comp === 'RBC'
        const life = comp === 'RBC' ? r.int(48, 35 * 24) : comp === 'FFP' ? r.int(30 * 24, 300 * 24) : r.int(12, 5 * 24)
        units.push({
          id: `U-${n++}`,
          facilityId: f.id,
          component: comp,
          abo,
          rh,
          antigenNeg: isRbc && r.chance(typedP) ? typing(r) : null,
          hla: comp === 'PLT_HLA' ? HLA_PROFILES[i % HLA_PROFILES.length] : undefined,
          expiresAtMin: life * 60,
          reservedFor: null,
          verification: 'recorded',
          transportReady: f.couriers > 0,
          updatedAt: -r.int(5, 240),
          // ~10% of recorded units are not actually issuable (illustrative): already crossmatched
          // elsewhere, quarantined, or a stale record. Only confirmation reveals this.
          truthAvailable: !r.chance(0.1),
        })
      }
    }
  }
  // A small frozen rare inventory at the reference laboratory (synthetic).
  units.push({
    id: `U-${n++}`, facilityId: 'F8', component: 'RBC', abo: 'O', rh: '+', antigenNeg: ['K'], rare: 'Bombay',
    expiresAtMin: 3650 * 24 * 60, reservedFor: null, verification: 'recorded', transportReady: true, updatedAt: -1440, truthAvailable: true,
  })
  return units
}

export function generateDonors(r: Rng): Donor[] {
  const donors: Donor[] = []
  for (let i = 0; i < 48; i++) {
    const near = r.pick(FACILITIES.filter((f) => f.kind !== 'field'))
    const ready = r.next()
    donors.push({
      id: `RD-${String(i + 1).padStart(3, '0')}`,
      nearFacilityId: near.id,
      abo: weighted(r, ABO_W),
      rh: r.chance(0.85) ? '+' : '-',
      antigenNeg: typing(r),
      hla: i % 6 === 0 ? HLA_PROFILES[(i / 6) % HLA_PROFILES.length] : undefined,
      confirmation: r.chance(0.85) ? 'lab_confirmed' : 'pending',
      readiness: ready < 0.6 ? 'ready' : ready < 0.85 ? 'deferred' : 'unavailable',
      consent: r.chance(0.88) ? 'granted' : r.chance(0.5) ? 'pending' : 'withdrawn',
      daysSinceDonation: r.int(10, 400),
      eligibilityReview: r.chance(0.8) ? 'current' : 'due',
      truthResponds: r.chance(0.7),
    })
  }
  // Two lab-confirmed Bombay donors in the registry (synthetic).
  donors.push(
    { id: 'RD-B01', nearFacilityId: 'F8', abo: 'O', rh: '+', antigenNeg: ['K'], rare: 'Bombay', confirmation: 'lab_confirmed', readiness: 'ready', consent: 'granted', daysSinceDonation: 140, eligibilityReview: 'current', truthResponds: true },
    { id: 'RD-B02', nearFacilityId: 'F5', abo: 'O', rh: '+', antigenNeg: [], rare: 'Bombay', confirmation: 'lab_confirmed', readiness: 'deferred', consent: 'granted', daysSinceDonation: 40, eligibilityReview: 'current', truthResponds: true },
  )
  return donors
}

export const BASE_REQUESTS: SupplyRequest[] = [
  {
    id: 'REQ-1001', facilityId: 'F3', component: 'RBC', abo: 'A', rh: '+', antigenNeg: ['K', 'Fyb', 'Jkb'], quantity: 2,
    deadlineMin: 240, priority: 'urgent', info: { orderAuthorized: true, requirementDocumented: true, sampleReceived: true }, review: 'in_progress', createdAt: 0,
    label: { ar: 'مريض بأجسام مضادة متعددة — طلب وحدات سالبة لمستضدات محددة', en: 'Patient with multiple antibodies — antigen-negative units requested' },
  },
  {
    id: 'REQ-1002', facilityId: 'F4', component: 'PLT_HLA', abo: 'O', rh: '+', antigenNeg: [], hla: 'HLA-A2/B44', quantity: 1,
    deadlineMin: 36 * 60, priority: 'urgent', info: { orderAuthorized: true, requirementDocumented: false, sampleReceived: true }, review: 'pending', createdAt: 0,
    label: { ar: 'طلب صفائح مختارة وفق متطلبات مناعية', en: 'HLA-selected platelet request' },
  },
  {
    id: 'REQ-1003', facilityId: 'F6', component: 'RBC', abo: 'O', rh: '-', antigenNeg: [], quantity: 4,
    deadlineMin: 180, priority: 'routine', info: { orderAuthorized: true, requirementDocumented: true, sampleReceived: false }, review: 'pending', createdAt: 0,
    label: { ar: 'تعويض مخزون O− قبل جراحة مجدولة', en: 'O− top-up before a scheduled surgery' },
  },
]

export function generateWorld(seed = DEFAULT_SEED, requests: SupplyRequest[] = BASE_REQUESTS): World {
  const r = rng(seed)
  return {
    seed,
    now: 0,
    facilities: FACILITIES.map((f) => ({ ...f })),
    units: generateUnits(r),
    donors: generateDonors(r),
    requests: requests.map((q) => ({ ...q, antigenNeg: [...q.antigenNeg], info: { ...q.info } })),
    shipments: [],
    missions: [],
    routeDelay: {},
    audit: [{ id: 'A-0', at: 0, actor: 'system', kind: 'world', text: { ar: `إنشاء بيئة المحاكاة من البذرة ${seed}`, en: `Simulation environment generated from seed ${seed}` } }],
  }
}

export const facilityById = (w: World, id: string) => w.facilities.find((f) => f.id === id)!
