// Shared, typed data model for every NAJA module (inventory, RARE-LINK, HEMO-READY AI,
// rescue engine, transport, digital twin, evaluation). All records are synthetic.

/** Bilingual text. Arabic is primary; English is the secondary language. */
export type T = { ar: string; en: string }

export type ComponentType = 'RBC' | 'PLT' | 'PLT_HLA' | 'FFP'
export type ABO = 'O' | 'A' | 'B' | 'AB'
export type Rh = '+' | '-'
export type FacilityKind = 'hospital' | 'blood_bank' | 'supply_center' | 'field'

export interface Facility {
  id: string
  name: T
  kind: FacilityKind
  region: T
  /** Position on a synthetic plane, in km. */
  x: number
  y: number
  online: boolean
  /** Couriers available for dispatch at this facility. */
  couriers: number
}

/** What the record says about a unit. `confirmed` only after an explicit (simulated) confirmation. */
export type Verification = 'recorded' | 'confirmed' | 'unavailable'

export interface Unit {
  id: string
  facilityId: string
  component: ComponentType
  abo: ABO
  rh: Rh
  /** Antigens the unit is confirmed negative for. `null` = extended typing not recorded. */
  antigenNeg: string[] | null
  /** Rare phenotype label when applicable (e.g. Bombay). */
  rare?: string
  /** HLA profile code for HLA-selected platelets (synthetic). */
  hla?: string
  /** Hours until expiry, measured from simulation minute 0. */
  expiresAtMin: number
  reservedFor: string | null
  verification: Verification
  transportReady: boolean
  updatedAt: number
  /**
   * Hidden ground truth used only by the simulation (e.g. evaluation lab, confirmation actions):
   * whether the unit is actually available. The UI never shows this directly.
   */
  truthAvailable: boolean
}

export type DonorReadiness = 'ready' | 'deferred' | 'unavailable'
export type Consent = 'granted' | 'pending' | 'withdrawn'

export interface Donor {
  id: string
  /** Nearest facility, used as an approximate region. No personal data is stored. */
  nearFacilityId: string
  abo: ABO
  rh: Rh
  antigenNeg: string[]
  rare?: string
  hla?: string
  confirmation: 'lab_confirmed' | 'pending'
  readiness: DonorReadiness
  consent: Consent
  daysSinceDonation: number
  eligibilityReview: 'current' | 'due'
  /** Hidden simulation truth: whether this donor would answer a contact request. */
  truthResponds: boolean
}

export type Priority = 'critical' | 'urgent' | 'routine'
export type ReviewState = 'pending' | 'in_progress' | 'completed'

export interface RequestInfo {
  /** Authorized clinical order received. */
  orderAuthorized: boolean
  /** Antibody work-up / immunological requirement documented. */
  requirementDocumented: boolean
  /** Patient sample received by the specialist laboratory. */
  sampleReceived: boolean
}

export interface SupplyRequest {
  id: string
  facilityId: string
  component: ComponentType
  abo: ABO
  rh: Rh
  /** Antigens the authorized request requires the units to be negative for. */
  antigenNeg: string[]
  rare?: string
  hla?: string
  quantity: number
  /** Minutes from creation by which supply is required. */
  deadlineMin: number
  priority: Priority
  info: RequestInfo
  review: ReviewState
  createdAt: number
  label?: T
}

export type ShipmentState = 'planned' | 'in_transit' | 'delivered' | 'held_for_review'

export interface Reading { m: number; c: number }

export interface Shipment {
  id: string
  missionId?: string
  component: ComponentType
  fromId: string
  toId: string
  unitIds: string[]
  departAt: number
  etaAt: number
  state: ShipmentState
  sensor: 'connected' | 'lost'
  telemetry: Reading[]
  /** Seed for the simulated sensor stream, so telemetry is reproducible. */
  seed: number
  /** Simulation-injected anomaly (minutes after departure), if any. */
  anomalyAt?: number
  sensorLossAt?: number
  handovers: { at: number; who: T; ok: boolean }[]
  /** Specialist decision recorded after an excursion. Never set automatically. */
  specialistDecision?: 'released' | 'discarded'
}

/** The five operational readiness states from the NAJA specification, in order. */
export const STAGES = ['candidate', 'availability', 'review', 'transport', 'delivered'] as const
export type Stage = (typeof STAGES)[number]

export interface Mission {
  id: string
  requestId: string
  planId: string
  sourceId: string
  unitIds: string[]
  donorIds: string[]
  /** Completed stages. A stage can only complete after all previous ones. */
  done: Stage[]
  shipmentId?: string
  state: 'active' | 'blocked' | 'completed' | 'cancelled'
  createdAt: number
}

export type Actor = 'system' | 'human' | 'sim'

export interface AuditEvent {
  id: string
  at: number
  actor: Actor
  kind: string
  text: T
  ref?: string
}

export interface World {
  seed: number
  now: number
  facilities: Facility[]
  units: Unit[]
  donors: Donor[]
  requests: SupplyRequest[]
  shipments: Shipment[]
  missions: Mission[]
  /** Extra route minutes per source facility, set by disruption events. */
  routeDelay: Record<string, number>
  audit: AuditEvent[]
}
