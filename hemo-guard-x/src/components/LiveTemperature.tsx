import { useEffect, useRef, useState } from 'react'
import { seed } from '../data/scenarios'
import { usePrefersReducedMotion } from '../lib/motion'

const N = 90

/** Simulated container temperature with a periodic excursion and a brief offline window. */
function sample(i: number): number {
  const spike = i % 160 > 110 && i % 160 < 122 ? Math.sin(((i % 160) - 110) / 12 * Math.PI) * 3.6 : 0
  return 4.6 + Math.sin(i / 9) * 0.6 + Math.sin(i / 3.1) * 0.15 + (seed(i) - 0.5) * 0.2 + spike
}

export function LiveTemperature() {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduce = usePrefersReducedMotion()
  const [now, setNow] = useState(4.6)
  const [online, setOnline] = useState(true)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const cx = cv.getContext('2d')!
    const pts = Array.from({ length: N }, (_, i) => sample(i))
    let idx = N

    const size = () => {
      const d = window.devicePixelRatio || 1
      cv.width = cv.clientWidth * d; cv.height = cv.clientHeight * d
      cx.setTransform(d, 0, 0, d, 0, 0)
    }
    const draw = () => {
      const w = cv.clientWidth, h = cv.clientHeight
      const y = (v: number) => h - 8 - (v / 11) * (h - 16)
      cx.clearRect(0, 0, w, h)
      cx.fillStyle = 'rgba(96,165,250,.06)'
      cx.fillRect(0, y(8), w, y(2) - y(8))
      cx.setLineDash([4, 6]); cx.strokeStyle = 'rgba(255,255,255,.12)'
      for (const v of [2, 8]) { cx.beginPath(); cx.moveTo(0, y(v)); cx.lineTo(w, y(v)); cx.stroke() }
      cx.setLineDash([])
      const step = w / (N - 1)
      const g = cx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, 'rgba(225,29,72,.35)'); g.addColorStop(1, 'rgba(225,29,72,0)')
      cx.beginPath(); cx.moveTo(0, h); pts.forEach((v, i) => cx.lineTo(i * step, y(v))); cx.lineTo(w, h); cx.fillStyle = g; cx.fill()
      cx.beginPath(); pts.forEach((v, i) => (i ? cx.lineTo(i * step, y(v)) : cx.moveTo(0, y(v))))
      cx.strokeStyle = '#fb7185'; cx.lineWidth = 2; cx.shadowColor = '#e11d48'; cx.shadowBlur = 10; cx.stroke(); cx.shadowBlur = 0
      const last = pts[N - 1]
      cx.beginPath(); cx.arc(w - 3, y(last), 4, 0, 7); cx.fillStyle = last > 8 ? '#e11d48' : '#fafafa'; cx.fill()
      setNow(last)
      setOnline(!(idx % 160 > 40 && idx % 160 < 60))
    }

    size(); draw()
    const onResize = () => { size(); draw() }
    window.addEventListener('resize', onResize)
    const timer = reduce ? 0 : window.setInterval(() => { pts.shift(); pts.push(sample(idx++)); draw() }, 350)
    return () => { window.removeEventListener('resize', onResize); clearInterval(timer) }
  }, [reduce])

  return (
    <>
      <canvas id="tcan" ref={ref} aria-hidden="true" />
      <div className="t-row">
        <span>الآن <b className="lat" style={{ color: now > 8 ? '#fb7185' : undefined }}>{now.toFixed(1)} °C</b></span>
        <span>النطاق <b className="lat">2–8 °C</b></span>
        <span>الاتصال <b>{online ? 'متصل' : 'منقطع · تخزين محلي'}</b></span>
      </div>
    </>
  )
}
