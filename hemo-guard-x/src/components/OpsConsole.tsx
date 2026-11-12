import { useMemo, useState } from 'react'
import { GROUPS, SCENARIOS, SITES, seed, type Risk, type ScenarioKey, type SiteKey } from '../data/scenarios'
import { clock } from '../lib/motion'

const RISK: Record<Risk, [string, string]> = { low: ['rk-low', 'منخفض'], mid: ['rk-mid', 'متوسط'], high: ['rk-high', 'مرتفع'] }
const KEYS = Object.keys(SCENARIOS) as ScenarioKey[]
type Decision = null | 'approved' | 'rejected'

export function OpsConsole() {
  const [key, setKey] = useState<ScenarioKey>('normal')
  const [decision, setDecision] = useState<Decision>(null)
  const [log, setLog] = useState<[string, string][]>([
    [clock(), SCENARIOS.normal.log],
    ['08:14', 'SHP-2211 غادرت SITE-C في الحاوية HG-07'],
    ['08:00', 'بداية المناوبة ومزامنة المواقع الثلاثة'],
  ])
  const sc = SCENARIOS[key]
  const addLog = (t: string) => setLog((l) => [[clock(), t] as [string, string], ...l].slice(0, 12))

  const choose = (k: ScenarioKey) => { setKey(k); setDecision(null); addLog(SCENARIOS[k].log) }

  // Approving the surge redistribution visibly moves 4 O− units from A to B.
  const stock = (k: SiteKey) => {
    const s = (sc.stockOverride[k] ?? SITES[k].stock).slice()
    if (key === 'surge' && decision === 'approved') { if (k === 'A') s[0] -= 4; if (k === 'B') s[0] += 4 }
    return s
  }
  const risk = (k: SiteKey): Risk => (key === 'surge' && decision === 'approved' && k === 'B' ? 'mid' : sc.risk[k])

  const temps = useMemo(() => Array.from({ length: 72 }, (_, i) => {
    let v = 4.5 + Math.sin(i / 8) * 0.5 + (seed(i + 3) - 0.5) * 0.3
    if (sc.excursion && i > 40 && i < 52) v += Math.sin((i - 40) / 12 * Math.PI) * 5.1
    return v
  }), [sc.excursion])
  const W = 640, H = 150
  const y = (v: number) => H - 12 - (v / 12) * (H - 24)
  const x = (i: number) => 26 + (i * (W - 36)) / 71
  const pts = temps.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const inRange = Math.round((temps.filter((v) => v >= 2 && v <= 8).length / temps.length) * 100)

  const rec = sc.recommendation

  return (
    <section className="s" id="ops">
      <div className="wrap">
        <div className="head">
          <span className="tag">عرض حي</span>
          <h2>لوحة التشغيل</h2>
          <p>ثلاثة مواقع افتراضية ببيانات اصطناعية. اختر حالة لترى كيف تتغير الأرقام والتنبيهات والتوصية.</p>
        </div>
        <div className="console">
          <div className="c-bar">
            <div className="dots" aria-hidden="true"><i /><i /><i /></div>
            <div className="tabs" role="group" aria-label="الحالة">
              {KEYS.map((k) => (
                <button key={k} type="button" aria-pressed={k === key} onClick={() => choose(k)}>{SCENARIOS[k].label}</button>
              ))}
            </div>
            <span className="synthetic">بيانات اصطناعية</span>
          </div>

          <div className="c-body">
            <div className="c-main">
              <div className="pane">
                <h3><span>المخزون القابل للاستخدام</span><span>الأحمر دون حد الأمان</span></h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="inv">
                    <thead><tr>{GROUPS.map((g) => <th key={g}>{g}</th>)}<th>Total</th><th style={{ fontFamily: 'var(--font)', direction: 'rtl' }}>الخطر</th><th /></tr></thead>
                    <tbody>
                      {(Object.keys(SITES) as SiteKey[]).map((k) => {
                        const s = stock(k), [rkClass, rkText] = RISK[risk(k)]
                        return (
                          <tr key={k}>
                            {s.map((v, i) => <td key={i} className={v < SITES[k].par[i] ? 'low' : undefined}>{v}</td>)}
                            <td className="tot">{s.reduce((a, b) => a + b, 0)}</td>
                            <td className={`rk ${rkClass}`}>{rkText}</td>
                            <td className="site">{SITES[k].name}<small>{SITES[k].code}</small></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="pane">
                <h3><span>حرارة الشحنة <span className="mono">SHP-2211</span></span>
                  <span style={{ color: sc.excursion ? '#e35d6e' : '#34d399' }}>{sc.excursion ? 'الوحدات في حجر إلكتروني' : 'ضمن النطاق'}</span></h3>
                <svg id="tchart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="منحنى حرارة الشحنة">
                  <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#C6283A" stopOpacity=".35" /><stop offset="1" stopColor="#C6283A" stopOpacity="0" /></linearGradient></defs>
                  <rect x="26" y={y(8)} width={W - 36} height={y(2) - y(8)} fill="rgba(96,165,250,.06)" />
                  {[2, 8].map((v) => (
                    <g key={v}>
                      <line x1="26" x2={W - 10} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,.12)" strokeDasharray="3 5" />
                      <text x="20" y={y(v) + 4} textAnchor="end" fontSize="11" fill="#75847e" fontFamily="Geist Mono, monospace">{v}°</text>
                    </g>
                  ))}
                  <polygon fill="url(#tg)" points={`26,${H - 12} ${pts} ${x(71)},${H - 12}`} />
                  <polyline fill="none" stroke="#e35d6e" strokeWidth="2" vectorEffect="non-scaling-stroke" points={pts} />
                  {temps.map((v, i) => (v > 8 ? <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="#C6283A" /> : null))}
                </svg>
                <div className="t-row">
                  <span>الأدنى <b className="lat">{Math.min(...temps).toFixed(1)} °C</b></span>
                  <span>الأعلى <b className="lat">{Math.max(...temps).toFixed(1)} °C</b></span>
                  <span>ضمن النطاق <b className="lat">{inRange}%</b></span>
                  <span>الوصول <b className="lat">{sc.eta}</b></span>
                </div>
              </div>
            </div>

            <div>
              <div className="pane">
                <h3><span>التنبيهات</span><span>{sc.alerts.length} نشطة</span></h3>
                <ul className="alerts">
                  {sc.alerts.map((a) => (
                    <li key={a.title} className={a.level}><i /><div><b>{a.title}</b><small>{a.detail}</small></div><time>{a.time}</time></li>
                  ))}
                </ul>
              </div>
              <div className="pane rec">
                {!rec ? (
                  <><h3><span>التوصية</span></h3><p className="none">لا توصية الآن. المخزون فوق حد الأمان في المواقع الثلاثة، والشحنة ضمن النطاق.</p></>
                ) : (
                  <>
                    <h3><span>توصية تنتظر قرار المسؤول</span></h3>
                    <p className="route">نقل {rec.what} من <span className="mono">{rec.from}</span> إلى <span className="mono">{rec.to}</span></p>
                    <p><b>السبب.</b> {rec.why}</p>
                    <div className="conf"><span>الثقة</span><span className="meter"><i style={{ width: `${rec.confidence}%` }} /></span><span className="mono">{rec.confidence}%</span></div>
                    <p><b>القيود.</b> {rec.limits}</p>
                    <div className="acts">
                      <button type="button" className="btn-w" disabled={!!decision} onClick={() => { setDecision('approved'); addLog(`اعتماد توصية ${rec.from} إلى ${rec.to}`) }}>اعتماد</button>
                      <button type="button" className="ghost" disabled={!!decision} onClick={() => { setDecision('rejected'); addLog(`رفض توصية ${rec.from} إلى ${rec.to}`) }}>رفض</button>
                    </div>
                    <p className="human">
                      {decision === 'approved' ? 'اعتُمدت وسُجلت باسم المسؤول. التنفيذ بعد تحقق بنك الدم.' : decision === 'rejected' ? 'رُفضت وسُجل القرار.' : 'لا يُنفذ شيء قبل الاعتماد.'}
                    </p>
                  </>
                )}
              </div>
              <div className="pane">
                <h3><span>سجل التدقيق</span></h3>
                <div className="audit">{log.map(([t, m], i) => <div key={i}><span>{t}</span><span>{m}</span></div>)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
