import { DECK_URL } from '../data/content'
import { Logo } from './Logo'

const LINKS = [
  ['#features', 'المنصة'],
  ['#system', 'الوحدات'],
  ['#flow', 'سيناريو الطوارئ'],
  ['#ops', 'لوحة التشغيل'],
  ['#evidence', 'الأدلة'],
]

export function Nav() {
  return (
    <nav className="nav" aria-label="التنقل">
      <a className="brand" href="#top"><Logo size={22} /><span>HEMO-GUARD X</span></a>
      <div className="links">
        {LINKS.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
      </div>
      <a className="cta" href={DECK_URL}>العرض التقديمي</a>
    </nav>
  )
}
