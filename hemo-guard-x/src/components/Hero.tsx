import { useState, type FormEvent } from 'react'
import { ShaderCanvas } from './ShaderCanvas'
import { HeroPreview } from './HeroPreview'

const EXAMPLES = ['K−  Fy(b−)  Jk(b−)', 'K−  Jk(b−)', 'Fy(b−)']

type Props = { onSearch: (query: string) => void }

export function Hero({ onSearch }: Props) {
  const [query, setQuery] = useState(EXAMPLES[0])
  const submit = (e: FormEvent) => { e.preventDefault(); onSearch(query) }

  return (
    <section className="hero">
      <ShaderCanvas />
      <div className="grain" aria-hidden="true" />
      <div className="wrap hero-in">
        <h1>الدم النادر يُعرف مكانه قبل أن تحتاجه</h1>
        <p className="sub">
          منظومة تربط سجلاً للمتبرعين بأنماط نادرة مؤكدة مخبرياً بمخزون بنوك الدم وبنقل مراقَب حرارياً، فيصل بنك الدم إلى الوحدة المطابقة في دقائق بدل نداء عام.
        </p>

        <form className="ask" role="search" aria-label="جرّب مطابقة نمط نادر" onSubmit={submit}>
          <div className="ask-in">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11z" /></svg>
            <label htmlFor="ask-in" className="sr-only">النمط المطلوب</label>
            <input id="ask-in" dir="ltr" autoComplete="off" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button type="submit">ابحث عن متبرع
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
            </button>
          </div>
          <div className="ask-hint">
            جرّب:
            {EXAMPLES.map((q) => <button key={q} type="button" onClick={() => setQuery(q)}>{q.replace(/\s+/g, ' ')}</button>)}
          </div>
        </form>

      </div>
      <div className="wrap hero-pv"><HeroPreview /></div>
    </section>
  )
}
