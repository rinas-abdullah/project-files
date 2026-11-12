/**
 * Deterministic PRNG (mulberry32). The full generator state is a single uint32
 * stored in the simulation state, so any session can be replayed exactly from
 * its seed and its ordered defender actions (required for reproducibility and
 * the later "What If?" counterfactual analysis).
 */
export function nextRandom(state: number): { value: number; state: number } {
  let t = (state + 0x6d2b79f5) >>> 0;
  const newState = t;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, state: newState };
}

export function seedFrom(input: number): number {
  return input >>> 0;
}
