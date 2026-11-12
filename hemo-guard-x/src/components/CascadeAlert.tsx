import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from '../lib/motion'

type Row = { id: string; km: number; state: '' | 'on' | 'done'; text: string }

const INITIAL: Row[] = [
  { id: 'RD-045', km: 14, state: '', text: 'بانتظار' },
  { id: 'RD-031', km: 18, state: '', text: 'بانتظار' },
  { id: 'RD-052', km: 27, state: '', text: 'احتياطي' },
]

const FINAL: Row[] = [
  { ...INITIAL[0], text: 'لم يرد خلال 10 د' },
  { ...INITIAL[1], state: 'done', text: 'قبل · أُحيل للفحص' },
  INITIAL[2],
]

/** Plays the cascade: nearest ready donor is alerted, does not answer, request moves to the next. */
export function CascadeAlert({ runToken }: { runToken: number }) {
  const reduce = usePrefersReducedMotion()
  const [rows, setRows] = useState<Row[]>(INITIAL)

  useEffect(() => {
    if (runToken === 0) return
    if (reduce) { setRows(FINAL); return }
    setRows(INITIAL)
    const t = [
      window.setTimeout(() => setRows((r) => r.map((x, i) => (i === 0 ? { ...x, state: 'on', text: 'تم الإرسال' } : x))), 500),
      window.setTimeout(() => setRows((r) => r.map((x, i) => (i === 0 ? { ...x, state: '', text: 'لم يرد خلال 10 د' } : i === 1 ? { ...x, state: 'on', text: 'تم الإرسال' } : x))), 2000),
      window.setTimeout(() => setRows(FINAL), 3400),
    ]
    return () => t.forEach(clearTimeout)
  }, [runToken, reduce])

  return (
    <div className="cas">
      {rows.map((r) => (
        <div key={r.id} className={r.state || undefined}>
          <span className="id">{r.id}</span><span>{r.km} كم</span><span className="st">{r.text}</span>
        </div>
      ))}
    </div>
  )
}
