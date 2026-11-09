/** RAM monogram — an R drawn as a plan line with a single cyan datum square. */
export function Monogram({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect x="0.5" y="0.5" width="63" height="63" fill="none" stroke="currentColor" strokeOpacity="0.35" />
      <path d="M18 46V18h14a8 8 0 0 1 0 16H18m14 0 12 12" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="square" />
      <rect x="42" y="16" width="6" height="6" className="fill-cyan" />
    </svg>
  );
}
