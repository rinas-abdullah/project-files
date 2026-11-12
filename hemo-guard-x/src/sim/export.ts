// CSV / JSON export helpers. Exports always carry a synthetic-data notice.

export const EXPORT_NOTICE = 'NAJA research prototype — synthetic data only — not for clinical use'

export function toCSV(head: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [`# ${EXPORT_NOTICE}`, head.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n')
}

export function toJSON(data: unknown): string {
  return JSON.stringify({ notice: EXPORT_NOTICE, generatedAt: new Date().toISOString(), data }, null, 2)
}

export function download(filename: string, content: string, type = 'text/plain') {
  const blob = new Blob([type.includes('csv') ? '﻿' + content : content], { type: `${type};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
