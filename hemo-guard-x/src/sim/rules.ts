import type { ABO, ComponentType, Rh, SupplyRequest, T, Unit } from './types'

// Deterministic rules. Values here are ILLUSTRATIVE simulation defaults, not clinical guidance.
// In a real deployment they must be configured and approved by authorized professionals.

export const ANTIGENS = ['K', 'Fya', 'Fyb', 'Jka', 'Jkb', 'S', 's', 'E', 'c'] as const

export function antigenLabel(a: string): string {
  const map: Record<string, string> = { Fya: 'Fy(a−)', Fyb: 'Fy(b−)', Jka: 'Jk(a−)', Jkb: 'Jk(b−)' }
  return map[a] ?? `${a}−`
}

export const COMPONENT: Record<ComponentType, { name: T; short: string }> = {
  RBC: { name: { ar: 'كريات دم حمراء', en: 'Red cells' }, short: 'RBC' },
  PLT: { name: { ar: 'صفائح دموية', en: 'Platelets' }, short: 'PLT' },
  PLT_HLA: { name: { ar: 'صفائح مختارة (HLA)', en: 'HLA-selected platelets' }, short: 'PLT-HLA' },
  FFP: { name: { ar: 'بلازما طازجة مجمدة', en: 'Fresh frozen plasma' }, short: 'FFP' },
}

export interface ComponentRule {
  /** Storage range °C (at the blood bank). */
  storage: [number, number]
  /** Transport range °C (in the container). Kept separate from storage on purpose. */
  transport: [number, number]
  /** Maximum transit time allowed by the simulation rule set, minutes. */
  maxTransitMin: number
  /** Preparation / issue time before dispatch, minutes. */
  prepMin: number
  /** Relative simulated cost per unit (unitless). */
  cost: number
}

/**
 * Illustrative, configurable defaults. Platelets are stored and moved at room temperature;
 * red cells cold; plasma frozen. Exact limits vary by jurisdiction and must be set by specialists.
 */
export const DEFAULT_RULES: Record<ComponentType, ComponentRule> = {
  RBC: { storage: [2, 6], transport: [1, 10], maxTransitMin: 24 * 60, prepMin: 20, cost: 1 },
  PLT: { storage: [20, 24], transport: [20, 24], maxTransitMin: 24 * 60, prepMin: 25, cost: 2.5 },
  PLT_HLA: { storage: [20, 24], transport: [20, 24], maxTransitMin: 24 * 60, prepMin: 40, cost: 4 },
  FFP: { storage: [-40, -25], transport: [-40, -18], maxTransitMin: 12 * 60, prepMin: 35, cost: 0.6 },
}

const RBC_ABO: Record<ABO, ABO[]> = { O: ['O', 'A', 'B', 'AB'], A: ['A', 'AB'], B: ['B', 'AB'], AB: ['AB'] }
const PLASMA_ABO: Record<ABO, ABO[]> = { AB: ['O', 'A', 'B', 'AB'], A: ['A', 'O'], B: ['B', 'O'], O: ['O'] }

/** Reason a unit fails the operational pre-screen, or null when it passes. */
export type ScreenFail = 'component' | 'abo' | 'rh' | 'antigen_unknown' | 'antigen' | 'rare' | 'hla' | null

/**
 * Operational PRE-SCREEN only. It narrows candidate units for coordination purposes.
 * It is NOT a clinical compatibility decision: ABO/Rh plus recorded antigens never equal
 * final patient compatibility, which requires specialist testing and authorization.
 */
export function prescreen(unit: Unit, req: SupplyRequest): ScreenFail {
  if (unit.component !== req.component) return 'component'
  if (req.component === 'RBC') {
    if (!RBC_ABO[unit.abo].includes(req.abo)) return 'abo'
    if (unit.rh === '+' && req.rh === '-') return 'rh'
  }
  if (req.component === 'FFP' && !PLASMA_ABO[unit.abo].includes(req.abo)) return 'abo'
  if (req.rare && unit.rare !== req.rare) return 'rare'
  if (req.hla && unit.hla !== req.hla) return 'hla'
  if (req.antigenNeg.length) {
    if (!unit.antigenNeg) return 'antigen_unknown'
    if (!req.antigenNeg.every((a) => unit.antigenNeg!.includes(a))) return 'antigen'
  }
  return null
}

/** ABO/Rh-only screen used by the "inventory only" baseline in the evaluation lab. */
export function aboRhOnly(unit: Unit, req: SupplyRequest): boolean {
  if (unit.component !== req.component) return false
  if (req.component === 'RBC') return RBC_ABO[unit.abo].includes(req.abo) && !(unit.rh === '+' && req.rh === '-')
  if (req.component === 'FFP') return PLASMA_ABO[unit.abo].includes(req.abo)
  return true
}

export const GROUP = (abo: ABO, rh: Rh) => `${abo}${rh === '+' ? '+' : '−'}`

/** Ground speed for road transport in the synthetic network, km/h. */
export const SPEED_KMH = 80
/** Extra handover time at a field medical point, minutes. */
export const FIELD_HANDOVER_MIN = 20
/** Time to confirm availability with a source facility (call + record check), minutes. */
export const CONFIRM_MIN = 10

export function distanceKm(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.round(Math.hypot(a.x - b.x, a.y - b.y))
}
