import Link from "next/link";
import { ButtonLink, Wordmark } from "@/components/ui";
import { getActor } from "@/server/auth/session";

const STAGES = [
  { n: "01", title: "خصم ذكي متكيّف", en: "Adaptive AI Adversary", body: "خصم يخطط حركته التالية بناءً على مستواك وقراراتك وحالة البيئة، ويغيّر مساره حين تُغلق طريقه. كل حركة تمر على «الحارس» قبل تنفيذها داخل المحاكاة." },
  { n: "02", title: "محاكاة دفاعية تحت الضغط", en: "Live Defensive Simulation", body: "وحدة تحكم دفاعية آمنة وتوأم سيبراني لمنظمة افتراضية. كل فحص يستهلك وقتًا، والخصم لا يتوقف أثناء تفكيرك." },
  { n: "03", title: "تحقيق جنائي رقمي", en: "Digital Forensics Investigation", body: "بعد الاحتواء تعيد بناء الحادثة من الأدلة التي جمعتها فعلًا: نقطة الدخول، الأصول والحسابات المخترقة، وتسلسل الهجوم." },
  { n: "04", title: "قياس سلوكي للجاهزية", en: "Behavioral Readiness Measurement", body: "السرعة والدقة والاستقلالية والاكتمال تُحسب على الخادم بمعادلات معلنة، مع حفظ كل مدخل استُخدم في الحساب." },
  { n: "05", title: "من الحادثة إلى السيناريو", en: "Incident-to-Scenario Conversion", body: "نتائجك وفجوات كفاءاتك تحدد التدريب التالي ومستوى الخصم فيه. تحويل استخبارات التهديدات إلى سيناريوهات جديدة هو المرحلة التالية في خارطة الطريق." },
];

const NOW = [
  ["يعمل الآن", "حلقة تدريب كاملة: محاكاة حية ← احتواء ← تحقيق جنائي ← قياس جاهزية ← توصية بالتدريب التالي، محفوظة بالكامل على الخادم."],
  ["يعمل الآن", "خصم متكيّف حتمي قابل لإعادة الإنتاج ببذرة، مع حارس يتحقق من كل حركة ويُسجّل سبب اختيارها."],
  ["يعمل الآن", "حسابات ومنظمات وأدوار بصلاحيات مطبّقة على الخادم وعزل كامل لبيانات كل منظمة، وسجل تدقيق."],
  ["قيد التطوير", "خط استخبارات التهديدات الحية، ومولّد السيناريوهات بالذكاء الاصطناعي، وتحليل «ماذا لو؟»، وبوابات المؤسسات والجامعات."],
];

export default async function Home() {
  const actor = await getActor();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-line/70 bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="text-fg"><Wordmark /></Link>
          <nav aria-label="أقسام الموقع" className="hidden gap-6 text-sm text-silver md:flex">
            <a href="#about" className="hover:text-fg">عن أَمَد</a>
            <a href="#loop" className="hover:text-fg">كيف يعمل</a>
            <a href="#technology" className="hover:text-fg">التقنية</a>
            <a href="#status" className="hover:text-fg">حالة المنصة</a>
          </nav>
          <div className="flex items-center gap-2">
            {actor ? (
              <ButtonLink href="/app">مركز القيادة</ButtonLink>
            ) : (
              <>
                <ButtonLink href="/login" variant="ghost">دخول</ButtonLink>
                <ButtonLink href="/register">ابدأ التدريب</ButtonLink>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pt-24">
          <div>
            <p className="ltr text-start text-xs tracking-[0.25em] text-lime">ADAPTIVE CYBER READINESS &amp; INTELLIGENCE PLATFORM</p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">نحو جاهزية تسبق التهديد.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-silver">
              أَمَد منصة تدريب وقياس للجاهزية السيبرانية: تواجه فيها خصمًا يتكيّف معك، وتستجيب تحت ضغط الوقت، ثم تحقق فيما حدث، فتحصل على قياس سلوكي يحدد تدريبك التالي.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={actor ? "/app" : "/register"}>{actor ? "متابعة التدريب" : "أنشئ حسابًا وابدأ"}</ButtonLink>
              <ButtonLink href="#loop" variant="secondary">كيف تعمل الحلقة</ButtonLink>
            </div>
          </div>
          <LoopDiagram />
        </section>

        <section id="about" className="border-t border-line bg-surface/40">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-3">
            <div>
              <p className="text-xs text-lime">المشكلة</p>
              <p className="mt-3 text-silver">معظم التدريب السيبراني يتبع نصًا ثابتًا. المهاجم الحقيقي لا يفعل ذلك: يغيّر طريقه حين يُغلق، ويستغل كل دقيقة تأخير.</p>
            </div>
            <div>
              <p className="text-xs text-lime">الحل</p>
              <p className="mt-3 text-silver">حلقة واحدة متصلة: خصم متكيّف، استجابة حية، تحقيق جنائي، وقياس شفاف — ونتيجة كل جلسة تغذي الجلسة التالية.</p>
            </div>
            <div>
              <p className="text-xs text-lime">الرؤية</p>
              <p className="mt-3 text-silver">أن تقيس المنظمات جاهزية فرقها بسلوك فعلي داخل بيئة آمنة، لا بعدد الدورات المكتملة. أَمَد هو الاسم الجديد لمشروع «رصد» بالفكرة نفسها.</p>
            </div>
          </div>
        </section>

        <section id="loop" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-2xl font-semibold">خمس مراحل، حلقة تعلّم واحدة</h2>
          <p className="mt-2 max-w-2xl text-silver">الخصم يتكيّف مع المدافع، والمدافع يستجيب تحت الضغط، والنظام يقيّم قراراته، والنتائج تحدد التدريب التالي.</p>
          <ol className="mt-10 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-5">
            {STAGES.map((s) => (
              <li key={s.n} className="flex flex-col gap-3 bg-surface p-5">
                <span className="ltr text-start font-mono text-xs text-lime">{s.n}</span>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="ltr text-start text-[11px] text-subtle">{s.en}</p>
                <p className="text-sm leading-6 text-silver">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="technology" className="border-t border-line bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-2xl font-semibold">التقنية</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {[
                ["مخطط هجوم معتمد + حارس", "الخصم لا ينفّذ أوامر حقيقية أبدًا. يقترح حركة من مخطط هجوم مراجَع ومربوط بإطار MITRE ATT&CK، ويرفض الحارس أي حركة خارج المخطط أو لا تتحقق شروطها أو تمس أصولًا خارج البيئة الافتراضية."],
                ["محاكاة حتمية قابلة لإعادة الإنتاج", "كل جلسة تبدأ ببذرة محفوظة؛ نفس البذرة ونفس القرارات تعطي النتيجة نفسها. هذا أساس التحليل المقارن «ماذا لو؟» في المرحلة القادمة."],
                ["توأم سيبراني اصطناعي", "أصول وهويات وسجلات اصطناعية بالكامل لمنظمة افتراضية. لا يتصل التوأم بأي بنية تحتية حقيقية."],
                ["قياس شفاف", "معادلات الجاهزية معلنة، ومدخلاتها محفوظة مع كل نتيجة، ويمكن للمتدرب رؤية كيف حُسب كل بُعد."],
              ].map(([t, b]) => (
                <div key={t} className="rounded-lg border border-line bg-surface p-6">
                  <h3 className="font-semibold">{t}</h3>
                  <p className="mt-2 text-sm leading-6 text-silver">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="status" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="text-2xl font-semibold">حالة المنصة بصراحة</h2>
          <ul className="mt-8 flex flex-col divide-y divide-line rounded-lg border border-line">
            {NOW.map(([tag, body]) => (
              <li key={body} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:gap-6">
                <span className={tag === "يعمل الآن" ? "shrink-0 text-sm text-lime" : "shrink-0 text-sm text-warn"}>{tag}</span>
                <span className="text-sm text-silver">{body}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-xs text-subtle sm:px-6">
          <Wordmark size="sm" />
          <p>كل المنظمات والأشخاص والعناوين داخل السيناريوهات افتراضية.</p>
        </div>
      </footer>
    </div>
  );
}

function LoopDiagram() {
  const labels = ["الخصم المتكيّف", "الاستجابة الحية", "التحقيق الجنائي", "قياس الجاهزية", "التدريب التالي"];
  const c = 170;
  const r = 118;
  const pts = labels.map((_, i) => {
    const a = (Math.PI * 2 * i) / labels.length - Math.PI / 2;
    return { x: c + Math.cos(a) * r, y: c + Math.sin(a) * r };
  });
  return (
    <figure className="mx-auto w-full max-w-md">
      <svg viewBox="0 0 340 340" className="h-auto w-full" role="img" aria-label="مخطط حلقة التعلم ذات المراحل الخمس">
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--amad-lime)" />
          </marker>
        </defs>
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--amad-border)" />
        {pts.map((p, i) => {
          const q = pts[(i + 1) % pts.length];
          const mx = (p.x + q.x) / 2;
          const my = (p.y + q.y) / 2;
          const k = 1.18;
          return <path key={i} d={`M${p.x},${p.y} Q${c + (mx - c) * k},${c + (my - c) * k} ${q.x},${q.y}`} fill="none" stroke="var(--amad-lime)" strokeOpacity="0.55" strokeWidth="1.5" markerEnd="url(#arr)" />;
        })}
        {pts.map((p, i) => (
          <g key={labels[i]}>
            <circle cx={p.x} cy={p.y} r="26" fill="var(--amad-surface-2)" stroke="var(--amad-border-strong)" />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="12" fontFamily="var(--font-mono)" fill="var(--amad-lime)">{`0${i + 1}`}</text>
            <text x={p.x} y={p.y + (p.y > c ? 44 : -36)} textAnchor="middle" fontSize="11.5" fill="var(--amad-silver)">{labels[i]}</text>
          </g>
        ))}
        <text x={c} y={c - 4} textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--amad-text)">أَمَد</text>
        <text x={c} y={c + 14} textAnchor="middle" fontSize="9" letterSpacing="2" fill="var(--amad-subtle)">LEARNING LOOP</text>
      </svg>
    </figure>
  );
}
