import { useId } from 'react'

// NAJA mark: a blood drop formed by one folded ribbon (red, with a green base) around an
// open counter. Redrawn as SVG from the identity board. The counter takes the surface colour
// via --logo-counter so the mark sits correctly on dark or cream backgrounds.
export function Logo({ size = 22 }: { size?: number }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg width={Math.round(size * 0.77)} height={size} viewBox="0 0 100 130" aria-hidden="true" className="logo-mark">
      <defs>
        <clipPath id={`d${id}`}><path d="M50 2C60 18 90 50 90 88A40 40 0 0 1 10 88C10 50 40 18 50 2Z" /></clipPath>
        <linearGradient id={`r${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d9374a" /><stop offset=".6" stopColor="#C6283A" /><stop offset="1" stopColor="#a51f30" />
        </linearGradient>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="1" y2=".4">
          <stop offset="0" stopColor="#b82235" /><stop offset=".6" stopColor="#e2505f" /><stop offset="1" stopColor="#c22b3d" />
        </linearGradient>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#176657" /><stop offset="1" stopColor="#0B3D36" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#d${id})`}>
        <rect width="100" height="130" fill={`url(#r${id})`} />
        <path d="M0 66C6 96 34 116 82 134L0 134Z" fill={`url(#g${id})`} />
        <path d="M22 98C40 84 62 74 74 64L102 66V134H86C60 124 40 112 22 98Z" fill={`url(#s${id})`} />
        <path d="M58 30C65 25 74 36 81 52C79 57 77 61 74 64C74 53 68 42 58 30Z" fill="#7d1524" opacity=".85" />
      </g>
      <path d="M58 30C68 42 76 54 74 64C62 74 40 84 22 98C19 74 38 50 58 30Z" fill="var(--logo-counter, #07110f)" />
    </svg>
  )
}

/** Mark + Arabic/Latin wordmark, as on the identity board. */
export function Wordmark({ size = 26 }: { size?: number }) {
  return (
    <span className="wm">
      <Logo size={Math.round(size * 1.3)} />
      <span className="wm-t" style={{ fontSize: size * 0.8 }}>
        <b>نَجا</b>
        <i className="lat">NAJA</i>
      </span>
    </span>
  )
}
