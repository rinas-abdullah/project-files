import markUrl from '../assets/naja-mark.png'
import wordUrl from '../assets/naja-wordmark-cream.png'

// NAJA identity artwork, cut from the official logo file (src/assets).
// The wordmark is the cream version for dark backgrounds; naja-wordmark-green.png is kept for light ones.

/** The ribbon-drop mark on its own. `size` is its height in px. */
export function Logo({ size = 22 }: { size?: number }) {
  return <img className="logo-mark" src={markUrl} alt="" width={Math.round(size * 0.65)} height={size} />
}

/** Mark + نَجا/NAJA wordmark, laid out as on the identity board. `size` is roughly the cap height. */
export function Wordmark({ size = 26 }: { size?: number }) {
  const h = Math.round(size * 1.35)
  return (
    <span className="wm" role="img" aria-label="نَجا NAJA" style={{ gap: Math.round(h * 0.16) }}>
      <Logo size={h} />
      <img className="wm-word" src={wordUrl} alt="" width={Math.round(h * 0.89)} height={Math.round(h * 0.87)} />
    </span>
  )
}
