/**
 * Fixed-window in-memory rate limiter. Suitable for a single-node deployment;
 * swap for Redis/Upstash when running multiple instances.
 */
type Bucket = { count: number; resetAt: number };
const g = globalThis as unknown as { __vlRate?: Map<string, Bucket> };
const buckets = (g.__vlRate ??= new Map());

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  b.count += 1;
  if (b.count > limit) return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  return { ok: true, retryAfter: 0 };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}
