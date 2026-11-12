import { useEffect, useState } from 'react'
import { DECK_URL } from '../data/content'
import { Logo } from './Logo'

const LINKS = [
  ['#features', 'المنصة'],
  ['#system', 'الوحدات'],
  ['#flow', 'سيناريو الطوارئ'],
  ['#ops', 'لوحة التشغيل'],
  ['#evidence', 'الأدلة'],
]

// Jump to the hero donor search and focus it (also bound to ⌘K / Ctrl+K).
function focusSearch() {
  const input = document.getElementById('ask-in') as HTMLInputElement | null
  if (!input) return
  window.scrollTo({ top: 0, behavior: 'smooth' })
  input.focus({ preventScroll: true })
  input.select()
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [mac, setMac] = useState(true)

  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent))
    const onScroll = () => setScrolled(window.scrollY > 12)
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); focusSearch() }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('keydown', onKey) }
  }, [])

  return (
    <header className={`nav${scrolled ? ' is-scrolled' : ''}`}>
      <nav className="nav-in" aria-label="التنقل">
        <a className="brand" href="#top"><Logo size={22} /><span>HEMO-GUARD X</span></a>
        <div className="links">
          {LINKS.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
        </div>
        <div className="nav-end">
          <button type="button" className="nav-search" onClick={focusSearch} aria-label="ابحث عن متبرع">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <span>بحث</span>
            <kbd className="lat">{mac ? '⌘K' : 'Ctrl K'}</kbd>
          </button>
          <a className="cta" href={DECK_URL}>العرض التقديمي</a>
        </div>
      </nav>
    </header>
  )
}
