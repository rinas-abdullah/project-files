import { useEffect, useState, type RefObject } from 'react'

export function usePrefersReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)'
  const [reduce, setReduce] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setReduce(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduce
}

/** Runs `cb` once the element first scrolls into view. */
export function useInViewOnce<T extends Element>(ref: RefObject<T>, cb: () => void, threshold = 0.35) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let done = false
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !done) { done = true; cb(); io.disconnect() }
    }, { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [])
}

export function clock(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
