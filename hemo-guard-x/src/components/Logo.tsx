export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.13} viewBox="0 0 30 34" aria-hidden="true">
      <path d="M15 1.5 L27.5 6.2 V15.5 C27.5 24.5 21.8 29.6 15 32.5 C8.2 29.6 2.5 24.5 2.5 15.5 V6.2 Z" fill="none" stroke="#fafafa" strokeWidth="2.2" />
      <path d="M15 10 C15 10 9.5 16.4 9.5 20 a5.5 5.5 0 0 0 11 0 C20.5 16.4 15 10 15 10 Z" fill="#e11d48" />
    </svg>
  )
}
