import { MARQUEE } from '../data/content'

export function Marquee() {
  const items = [...MARQUEE, ...MARQUEE] // duplicated for a seamless loop
  return (
    <div className="marq" aria-hidden="true">
      <div className="marq-track">
        {items.map((t, i) => <span key={i}><i />{t}</span>)}
      </div>
    </div>
  )
}
