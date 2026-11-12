import { useRef, type PointerEvent } from 'react'
import { usePrefersReducedMotion } from '../lib/motion'

/** Example rare-blood passport with a 3D tilt and a sheen that follows the pointer. */
export function PassportCard() {
  const card = useRef<HTMLDivElement>(null)
  const reduce = usePrefersReducedMotion()

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce || !card.current) return
    const r = card.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    card.current.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`
    card.current.style.setProperty('--sh', `${x * 120}%`)
  }
  const onLeave = () => {
    if (!card.current) return
    card.current.style.transform = ''
    card.current.style.setProperty('--sh', '-60%')
  }

  return (
    <div className="tilt" onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="pcard" ref={card} role="img" aria-label="مثال لجواز دم نادر: O سالب، خالٍ من K وFyb وJkb، جاهز">
        <div className="r"><span>جواز الدم النادر · مثال</span><span className="mono">RD-031</span></div>
        <div>
          <div className="abo">O−</div>
          <div className="ph">K− · Fy(a+b−) · Jk(a+b−)</div>
        </div>
        <div className="r"><span className="ok"><i />جاهز للتبرع</span><span>مؤكد مخبرياً</span></div>
      </div>
    </div>
  )
}
