import { Wordmark } from './Logo'

// A framed, non-interactive glimpse of the platform under the hero headline.
// Every value here is synthetic and labelled as such.

type Req = { rank: number; phenotype: string; site: string; state: 'ok' | 'warn' | 'mute'; status: string; note: string }

const REQUESTS: Req[] = [
  { rank: 1, phenotype: 'K− Fy(b−) Jk(b−)', site: 'SITE-A', state: 'ok', status: 'متبرعان جاهزان', note: 'أقرب متبرع على بعد 14 كم' },
  { rank: 2, phenotype: 'Fy(b−)', site: 'SITE-B', state: 'warn', status: 'تنبيه متدرج', note: 'بانتظار رد المتبرع الثاني' },
  { rank: 3, phenotype: 'Bombay (Oh)', site: 'SITE-C', state: 'mute', status: 'بحث موسَّع', note: 'لا مطابقة داخل المنطقة بعد' },
]

const NAV = [
  { label: 'الرئيسية', active: true },
  { label: 'RARE-LINK', lat: true },
  { label: 'HEMO-SUPPLY', lat: true },
  { label: 'HEMO-GUARD', lat: true },
  { label: 'التنبيهات', count: 3 },
]

const STATS = [
  { value: '3', label: 'وحدات في لوحة واحدة' },
  { value: '2–8 °C', label: 'مراقبة مستمرة للنقل', lat: true },
  { value: '< 30 min', label: 'مستهدف الوصول لمتبرع جاهز', lat: true },
]

export function HeroPreview() {
  return (
    <div className="pv" aria-label="معاينة توضيحية للمنصة ببيانات اصطناعية" role="img">
      <div className="pv-app" aria-hidden="true">
        <aside className="pv-side">
          <div className="pv-brand"><Wordmark size={22} /></div>
          <div className="pv-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
            <span>ابحث عن نمط</span>
            <kbd className="lat">⌘K</kbd>
          </div>
          <nav className="pv-nav">
            {NAV.map((n) => (
              <span key={n.label} className={n.active ? 'on' : undefined}>
                <i />
                <em className={n.lat ? 'lat' : undefined}>{n.label}</em>
                {n.count ? <b className="lat">{n.count}</b> : null}
              </span>
            ))}
          </nav>
        </aside>

        <div className="pv-main">
          <div className="pv-head">
            <div>
              <h3>طلبات اليوم <span className="pv-synth">بيانات اصطناعية</span></h3>
              <p>أحدث طلبات الأنماط النادرة في ثلاثة مواقع افتراضية</p>
            </div>
            <span className="pv-all">عرض الكل ‹</span>
          </div>

          <div className="pv-cards">
            {REQUESTS.map((r) => (
              <div className="pv-card" key={r.rank}>
                <span className="pv-rank lat">{r.rank}</span>
                <div className="pv-card-in">
                  <div className="pv-card-top">
                    <span className="mono pv-site">{r.site}</span>
                    <span className={`pv-pill ${r.state}`}>{r.status}</span>
                  </div>
                  <div className="mono pv-pheno">{r.phenotype}</div>
                  <div className="pv-note">{r.note}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="pv-stats">
            {STATS.map((s) => (
              <div key={s.label}>
                <b className={s.lat ? 'lat' : undefined}>{s.value}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
