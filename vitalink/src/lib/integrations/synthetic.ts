/** Deterministic synthetic data helpers for SIMULATED adapters (no real people). */
export function seeded(input: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = h >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const pick = <T,>(rnd: () => number, arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];

export const MALE_FIRST = ["Faisal", "Omar", "Khalid", "Yousef", "Abdullah", "Saad", "Turki", "Majed", "Nawaf", "Hamad", "Ziyad", "Rakan"];
export const FEMALE_FIRST = ["Noura", "Sara", "Reem", "Hessa", "Lama", "Dana", "Joud", "Maha", "Ghada", "Hind", "Rahaf", "Layan"];
export const FAMILY = ["Al-Harbi", "Al-Ghamdi", "Al-Zahrani", "Al-Qahtani", "Al-Shehri", "Al-Otaibi", "Al-Maliki", "Al-Subaie", "Al-Juhani", "Al-Amri", "Bakr", "Hamdan"];
