import type { HTMLAttributes, PointerEvent } from 'react'

/** Card with a cursor-following spotlight glow and border (see .spot in global.css). */
export function Spot({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  return (
    <div className={`spot ${className}`} onPointerMove={onMove} {...rest}>
      {children}
    </div>
  )
}
