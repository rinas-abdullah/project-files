// Illustrative antigen typing data. Synthetic, for demonstration only.
// Each donor phenotype string has one char per antigen in ANTIGENS order: '1' = positive, '0' = negative.

export type Antigen = { system: string; label: string; key: string }

export const ANTIGENS: Antigen[] = [
  { system: 'Rh', label: 'D', key: 'D' },
  { system: 'Rh', label: 'C', key: 'C' },
  { system: 'Rh', label: 'E', key: 'E' },
  { system: 'Rh', label: 'c', key: 'c' },
  { system: 'Rh', label: 'e', key: 'e' },
  { system: 'Kell', label: 'K', key: 'K' },
  { system: 'Kell', label: 'k', key: 'k' },
  { system: 'Duffy', label: 'Fyᵃ', key: 'Fy(a' },
  { system: 'Duffy', label: 'Fyᵇ', key: 'Fy(b' },
  { system: 'Kidd', label: 'Jkᵃ', key: 'Jk(a' },
  { system: 'Kidd', label: 'Jkᵇ', key: 'Jk(b' },
  { system: 'MNS', label: 'S', key: 'S' },
  { system: 'MNS', label: 's', key: 's' },
]

export type Readiness = 'ready' | 'waiting' | 'travelling'

export type Donor = { id: string; status: Readiness; distanceKm?: number; phenotype: string }

export const DONORS: Donor[] = [
  { id: 'RD-007', status: 'ready', distanceKm: 9, phenotype: '1101101110111' },
  { id: 'RD-014', status: 'travelling', phenotype: '0101100101011' },
  { id: 'RD-019', status: 'ready', distanceKm: 22, phenotype: '1100111101010' },
  { id: 'RD-022', status: 'waiting', phenotype: '0111001101010' },
  { id: 'RD-031', status: 'ready', distanceKm: 18, phenotype: '0101101101010' },
  { id: 'RD-038', status: 'ready', distanceKm: 31, phenotype: '1110101111001' },
  { id: 'RD-045', status: 'ready', distanceKm: 14, phenotype: '1100101101011' },
  { id: 'RD-052', status: 'ready', distanceKm: 27, phenotype: '0111001110111' },
]

/** Default request: patient with antibodies to K, Fy(b), Jk(b). Indexes into ANTIGENS. */
export const DEFAULT_NEED = [5, 8, 10]

export function statusLabel(d: Donor): string {
  if (d.status === 'ready') return `جاهز · ${d.distanceKm} كم`
  if (d.status === 'waiting') return 'فترة انتظار'
  return 'مسافر'
}

export function isCompatible(d: Donor, need: number[]): boolean {
  return need.every((i) => d.phenotype[i] === '0')
}

/** Parses a request like "K−  Fy(b−)  Jk(b−)" into antigen indexes that must be negative. */
export function parseRequest(q: string): number[] {
  const out: number[] = []
  const re = /(Fy\((?:a|b)|Jk\((?:a|b)|\b[KCEceSs])\s*\)?\s*[−-]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(q))) {
    const idx = ANTIGENS.findIndex((a) => a.key === m![1])
    if (idx > -1 && !out.includes(idx)) out.push(idx)
  }
  return out
}
