import { useRef } from 'react'
import { Spot } from './Spot'
import { Antigram } from './Antigram'
import { PassportCard } from './PassportCard'
import { LiveTemperature } from './LiveTemperature'
import { CascadeAlert } from './CascadeAlert'
import { ReadinessRing } from './ReadinessRing'
import { useInViewOnce } from '../lib/motion'

type Props = { need: number[]; runToken: number; onRun: () => void }

export function Features({ need, runToken, onRun }: Props) {
  const agRef = useRef<HTMLDivElement>(null)
  useInViewOnce(agRef, onRun) // first time the bento is seen, play the match

  return (
    <section className="s" id="features">
      <div className="wrap">
        <div className="head">
          <span className="tag">RARE-LINK</span>
          <h2>من نداء عام إلى متبرع محدد</h2>
          <p>كل ما يحتاجه بنك الدم ليصل إلى النمط النادر، في شاشة واحدة.</p>
        </div>
        <div className="bento">
          <Spot className="c-pad b-ag">
            <div ref={agRef}>
              <h3 className="c-title">مطابقة الأنماط المناعية</h3>
              <p className="c-text">جدول الأنماط (Antigram) الذي يعمل عليه مختص نقل الدم، قابل للبحث عبر المنشآت. بيانات توضيحية.</p>
              <Antigram need={need} runToken={runToken} onReplay={onRun} />
            </div>
          </Spot>

          <Spot className="c-pad b-pass">
            <h3 className="c-title">جواز الدم النادر</h3>
            <p className="c-text">نمط موسع موثق من بنك دم معتمد، وحالة جاهزية محدثة.</p>
            <PassportCard />
            <div className="states">
              <div><i style={{ background: 'var(--ok)' }} />جاهز: يستقبل الطلبات العاجلة</div>
              <div><i style={{ background: 'var(--warn)' }} />فترة انتظار: تذكير عند عودة الأهلية</div>
              <div><i style={{ background: 'var(--mute)' }} />مسافر: مستبعد مؤقتاً من التنبيه</div>
            </div>
          </Spot>

          <Spot className="c-pad b-temp">
            <h3 className="c-title">نقل مراقَب حرارياً</h3>
            <p className="c-text">الحاوية تسجل الحرارة كل لحظة وتحفظ السجل عند انقطاع الاتصال.</p>
            <LiveTemperature />
          </Spot>

          <Spot className="c-pad b-cas">
            <h3 className="c-title">تنبيه متدرج</h3>
            <p className="c-text">يصل الطلب للأقرب الجاهز، ثم ينتقل تلقائياً للتالي إن لم يرد.</p>
            <CascadeAlert runToken={runToken} />
          </Spot>

          <Spot className="c-pad b-rbri">
            <h3 className="c-title">مؤشر جاهزية الدم النادر</h3>
            <ReadinessRing />
          </Spot>

          <Spot className="c-pad b-gov">
            <h3 className="c-title">القرار للمختص</h3>
            <p className="c-text">المنظومة تبحث وتنبّه وتوصي. التوافق الموسع والاعتماد والصرف يقررها مختص نقل الدم، ولا يُعتمد متبرع قبل الفحص.</p>
          </Spot>

          <Spot className="c-pad b-wat">
            <h3 className="c-title">يكمل وتين ولا ينافسه</h3>
            <p className="c-text">وتين يربط المتبرعين بالطلبات حسب المدينة والفصيلة. RARE-LINK يضيف الأنماط النادرة المؤكدة والجاهزية والنقل الموثق.</p>
          </Spot>
        </div>
      </div>
    </section>
  )
}
