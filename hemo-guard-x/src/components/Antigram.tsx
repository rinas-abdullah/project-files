import { useEffect, useRef, useState } from 'react'
import { ANTIGENS, DONORS, isCompatible, statusLabel } from '../data/antigram'
import { usePrefersReducedMotion } from '../lib/motion'

type Props = { need: number[]; runToken: number; onReplay: () => void }

type RowState = '' | 'out' | 'match'

/**
 * Antigram matching animation: scans each required-negative antigen column in turn,
 * greys out donors positive for it, then drops donors who are not ready.
 */
export function Antigram({ need, runToken, onReplay }: Props) {
  const reduce = usePrefersReducedMotion()
  const finalRows = (): RowState[] => DONORS.map((d) => (isCompatible(d, need) && d.status === 'ready' ? 'match' : 'out'))
  const finalHits = () => new Set(need)

  const [rows, setRows] = useState<RowState[]>(finalRows)
  const [hitCols, setHitCols] = useState<Set<number>>(finalHits)
  const [scanCol, setScanCol] = useState<number | null>(null)
  const timers = useRef<number[]>([])

  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (reduce || runToken === 0) { setRows(finalRows()); setHitCols(finalHits()); setScanCol(null); return }

    setRows(DONORS.map(() => ''))
    setHitCols(new Set())
    const step = 800
    need.forEach((ci, k) => {
      timers.current.push(window.setTimeout(() => {
        setScanCol(ci)
        setHitCols((prev) => new Set(prev).add(ci))
        setRows((prev) => prev.map((r, i) => (DONORS[i].phenotype[ci] === '1' ? 'out' : r)))
      }, 400 + k * step))
    })
    timers.current.push(window.setTimeout(() => {
      setScanCol(null)
      setRows((prev) => prev.map((r, i) => (r === '' && DONORS[i].status !== 'ready' ? 'out' : r)))
    }, 400 + need.length * step))
    timers.current.push(window.setTimeout(() => setRows(finalRows()), 800 + need.length * step))
    return () => timers.current.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runToken, need, reduce])

  const compatible = DONORS.filter((d) => isCompatible(d, need))
  const ready = compatible.filter((d) => d.status === 'ready')
  let lastSystem = ''

  return (
    <>
      <div className="ag-wrap">
        <table className="ag">
          <colgroup>
            <col />
            {ANTIGENS.map((_, i) => <col key={i} className={scanCol === i ? 'scan' : undefined} />)}
            <col />
          </colgroup>
          <thead>
            <tr>
              <th className="sys" />
              {ANTIGENS.map((a, i) => {
                const show = a.system !== lastSystem
                lastSystem = a.system
                return <th key={i} className="sys">{show ? a.system : ''}</th>
              })}
              <th className="sys" />
            </tr>
            <tr>
              <th style={{ textAlign: 'left', padding: '0 12px' }}>Donor</th>
              {ANTIGENS.map((a, i) => <th key={i} className={need.includes(i) ? 'req' : undefined}>{a.label}</th>)}
              <th style={{ direction: 'rtl', textAlign: 'right', padding: '0 12px', fontFamily: 'var(--font)', fontWeight: 400, fontSize: 12 }}>الحالة</th>
            </tr>
          </thead>
          <tbody>
            <tr className="need">
              <td className="id">Patient</td>
              {ANTIGENS.map((_, i) => <td key={i} className="v">{need.includes(i) ? '0' : ''}</td>)}
              <td className="st">يحتاج سالباً</td>
            </tr>
            {DONORS.map((d, ri) => (
              <tr key={d.id} className={rows[ri] || undefined}>
                <td className="id">{d.id}</td>
                {ANTIGENS.map((_, i) => {
                  const pos = d.phenotype[i] === '1'
                  const hit = pos && need.includes(i) && hitCols.has(i)
                  return <td key={i} className={`v ${pos ? '' : 'neg'} ${hit ? 'hit' : ''}`}>{pos ? '+' : '0'}</td>
                })}
                <td className="st">{statusLabel(d)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ag-foot">
        <span>يطابق {compatible.length} من {DONORS.length}، و<b>{ready.length} منهم جاهزون الآن</b></span>
        <button className="ghost" type="button" onClick={onReplay}>أعد المطابقة</button>
      </div>
    </>
  )
}
