export function fmt(template: string, params?: Record<string, string | number>) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => (params[k] != null ? String(params[k]) : `{${k}}`));
}

export function formatDateTime(d: Date | string | null | undefined, locale: string, opts?: Intl.DateTimeFormatOptions) {
  if (!d) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Riyadh",
    ...opts,
  }).format(new Date(d));
}

export function formatTime(d: Date | string | null | undefined, locale: string) {
  if (!d) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Riyadh",
  }).format(new Date(d));
}

export function formatEta(seconds: number | null | undefined, minLabel: string) {
  if (seconds == null) return "—";
  if (seconds <= 0) return `0 ${minLabel}`;
  return `${Math.max(1, Math.round(seconds / 60))} ${minLabel}`;
}

export function formatKm(meters: number | null | undefined, kmLabel: string) {
  if (meters == null) return "—";
  return `${(meters / 1000).toFixed(1)} ${kmLabel}`;
}

export function formatMin(min: number | null | undefined, minLabel: string) {
  if (min == null || !Number.isFinite(min)) return "—";
  return `${Math.round(min * 10) / 10} ${minLabel}`;
}
