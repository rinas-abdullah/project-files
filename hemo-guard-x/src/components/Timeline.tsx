import { useEffect, useRef, useState } from 'react'
import { FLOW } from '../data/content'
import { usePrefersReducedMotion } from '../lib/motion'

/** Emergency chain-of-custody log; the red rail fills as the reader scrolls. */
export function Timeline() {
  const reduce = usePrefersReducedMotion()
  const tl = useRef<HTMLDivElement>(null)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])
  const [progress, setProgress] = useState(reduce ? 100 : 0)
  const [lit, setLit] = useState<boolean[]>(FLOW.map(() => reduce))

  useEffect(() => {
    if (reduce) { setProgress(100); setLit(FLOW.map(() => true)); return }
    const update = () => {
      const el = tl.current
      if (!el) return
      const r = el.getBoundingClientRect(), vh = window.innerHeight
      setProgress(Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height)) * 100)
      setLit(stepRefs.current.map((s) => !!s && s.getBoundingClientRect().top < vh * 0.6))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [reduce])

  return (
    <section className="s" id="flow">
      <div className="wrap">
        <div className="head">
          <span className="tag">سيناريو طوارئ</span>
          <h2>مصاب في موقع ميداني يحتاج نمطاً نادراً</h2>
          <p>السجل كما يظهر في المنصة. التوقيتات أهداف تقيسها تجربة المحاكاة.</p>
        </div>
        <div className="tl" ref={tl}>
          <div className="tl-fill" style={{ ['--p' as string]: `${progress}%` }} />
          {FLOW.map((s, i) => (
            <div className={`step ${lit[i] ? 'lit' : ''}`} key={s.t} ref={(el) => { stepRefs.current[i] = el }}>
              <span className="dot">{String(i + 1).padStart(2, '0')}</span>
              <div><span className="t">{s.t}</span><span className="w">{s.who}</span><h3>{s.title}</h3><p>{s.text}</p></div>
            </div>
          ))}
        </div>
        <p className="limit">المنظومة لا تقرر صلاحية الدم ولا تعتمد متبرعاً تلقائياً. أي تشغيل على دم حقيقي يتطلب موافقات المنشأة واللجان.</p>
      </div>
    </section>
  )
}
