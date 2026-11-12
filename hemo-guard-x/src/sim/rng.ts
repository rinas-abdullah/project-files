// Small deterministic PRNG so every simulation and evaluation run is reproducible from its seed.

export type Rng = {
  next: () => number
  int: (min: number, max: number) => number
  pick: <X>(xs: readonly X[]) => X
  chance: (p: number) => boolean
  normal: (mean: number, sd: number) => number
}

/** mulberry32 */
export function rng(seed: number): Rng {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (xs) => xs[Math.floor(next() * xs.length)],
    chance: (p) => next() < p,
    normal: (mean, sd) => {
      const u = Math.max(next(), 1e-9), v = next()
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    },
  }
}
