import { useRef, useState } from 'react'
import { useInViewOnce } from '../lib/motion'

const CIRC = 264 // 2πr for r=42

/** Rare Blood Readiness Index (example value for one site). */
export function ReadinessRing({ value = 72 }: { value?: number }) {
  const ref = useRef<SVGSVGElement>(null)
  const [shown, setShown] = useState(false)
  useInViewOnce(ref, () => setShown(true), 0.5)

  return (
    <div className="ring">
      <svg ref={ref} viewBox="0 0 100 100" aria-hidden="true">
        <defs><linearGradient id="rg"><stop offset="0" stopColor="#e11d48" /><stop offset="1" stopColor="#fb7185" /></linearGradient></defs>
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="8" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="url(#rg)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={CIRC} strokeDashoffset={shown ? CIRC * (1 - value / 100) : CIRC}
          transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 1.4s ease' }} />
      </svg>
      <div><b className="lat">{value}</b><span>مثال لموقع: وحدات نادرة معتمدة، ومتبرعون جاهزون، وزمن الوصول</span></div>
    </div>
  )
}
