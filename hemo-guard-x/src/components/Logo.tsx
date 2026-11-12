import markUrl from '../assets/naja-mark.png'

// Official NAJA logo, used exactly as supplied (src/assets/naja-logo-original.png), only
// trimmed to its visible bounds. Do not recolour or redraw it.

/** The ribbon-drop mark on its own. `size` is its height in px. */
export function Logo({ size = 22 }: { size?: number }) {
  return <img className="logo-mark" src={markUrl} alt="" width={Math.round(size * 0.65)} height={size} />
}

/** Brand mark used across the site: the drop only, without the نَجا/NAJA name (per the owner's choice). */
export function Wordmark({ size = 26 }: { size?: number }) {
  const h = Math.round(size * 1.35)
  return <img className="wm" src={markUrl} alt="نَجا NAJA" width={Math.round(h * 0.65)} height={h} />
}
