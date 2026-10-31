export function median(values: number[]): number | null {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}
export function mean(values: number[]): number | null {
  const v = values.filter((x) => Number.isFinite(x));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}
export function minutesBetween(a: Date | string | null | undefined, b: Date | string | null | undefined): number | null {
  if (!a || !b) return null;
  return (new Date(b).getTime() - new Date(a).getTime()) / 60000;
}
export function pct(n: number, d: number): number {
  return d ? Math.round((n / d) * 1000) / 10 : 0;
}
export function round1(n: number | null | undefined): number | null {
  return n == null ? null : Math.round(n * 10) / 10;
}
