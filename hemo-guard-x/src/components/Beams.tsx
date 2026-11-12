import { MODULES } from '../data/content'
import { Spot } from './Spot'

const PATHS = [
  { d: 'M830 80 C 700 80, 620 220, 490 220', dur: '3s', begin: '0s' },
  { d: 'M830 360 C 700 360, 620 220, 490 220', dur: '3.4s', begin: '.6s' },
  { d: 'M150 220 C 260 220, 380 220, 490 220', dur: '2.8s', begin: '1.1s' },
]

// Node positions match the path endpoints in the 980×440 viewBox.
const POS = [
  { right: 0, top: 80, transform: 'translate(0,-50%)' },
  { right: 0, top: 360, transform: 'translate(0,-50%)' },
  { left: 0, top: 220, transform: 'translate(0,-50%)' },
]

export function Beams() {
  return (
    <section className="s" id="system" style={{ paddingTop: 40 }}>
      <div className="wrap">
        <div className="head">
          <span className="tag">المنظومة</span>
          <h2>ثلاث وحدات، لوحة قيادة واحدة</h2>
          <p>كل وحدة تحل جزءاً من السلسلة، وتلتقي بياناتها في لوحة واحدة لمسؤول الإمداد وبنك الدم.</p>
        </div>
        <div className="beams">
          <svg className="paths" viewBox="0 0 980 440" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="bg1" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="980" y2="0">
                <stop offset="0" stopColor="#e11d48" stopOpacity="0" /><stop offset=".5" stopColor="#fb7185" /><stop offset="1" stopColor="#e11d48" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="2">
              {PATHS.map((p) => <path key={p.d} d={p.d} />)}
            </g>
            <g fill="none" stroke="url(#bg1)" strokeWidth="2.5" strokeLinecap="round">
              {PATHS.map((p) => (
                <path key={p.d} d={p.d} strokeDasharray="90 600">
                  <animate attributeName="stroke-dashoffset" from="690" to="0" dur={p.dur} begin={p.begin} repeatCount="indefinite" />
                </path>
              ))}
            </g>
          </svg>
          {MODULES.map((m, i) => (
            <div className="node" key={m.code} style={{ ...POS[i], top: POS[i].top }}>
              <Spot className="box"><b>{m.code}</b><h3>{m.title}</h3><p>{m.text}</p></Spot>
            </div>
          ))}
          <div className="node hub" style={{ left: '50%', top: 220 }}>
            <div className="box"><b>HEMO-GUARD X</b><h3>لوحة القيادة الموحدة</h3><p>رؤية واحدة للمخزون والوحدات النادرة والتنبيهات وسجل التدقيق.</p></div>
          </div>
        </div>
      </div>
    </section>
  )
}
