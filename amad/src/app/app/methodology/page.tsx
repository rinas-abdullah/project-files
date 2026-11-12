import type { Metadata } from "next";
import { Card, CardHeader } from "@/components/ui";
import { INVESTIGATION_WEIGHTS } from "@/domain/forensics/scoring";
import { METHODOLOGY_VERSION } from "@/domain/readiness/scoring";
import { RECOMMENDATION_WEIGHTS } from "@/domain/recommend/engine";

export const metadata: Metadata = { title: "منهجية القياس" };

const DIMS = [
  ["السرعة", "إذا احتُويت الحادثة: 0.6 × (1 − زمن الاحتواء ÷ الوقت المخصص) + 0.4 × (1 − تقدّم الخصم نحو هدفه). وإذا لم تُحتوَ: 0.25 × (1 − تقدّم الخصم)."],
  ["الدقة", "0.6 × نسبة إجراءات الاحتواء التي أصابت كيانًا معاديًا فعلًا (من بين كل إجراءات العزل والتعطيل والحظر والإنهاء) + 0.4 × درجة التحقيق الجنائي − 0.1 عن كل إعلان احتواء خاطئ."],
  ["الاستقلالية", "1 − 0.2 × عدد التلميحات المطلوبة."],
  ["الاكتمال", "0.4 × (تحقق الاحتواء) + 0.3 × نسبة الأصول المخترقة التي أُخذت لها نسخة جنائية + 0.3 × متوسط دقة الأصول والحسابات والتسلسل في التحقيق."],
] as const;

export default function MethodologyPage() {
  const iw = INVESTIGATION_WEIGHTS;
  const rw = RECOMMENDATION_WEIGHTS;
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">منهجية قياس الجاهزية</h1>
        <p className="mt-1 text-sm text-silver">الإصدار <span className="ltr font-mono">{METHODOLOGY_VERSION}</span>. كل الحسابات تتم على الخادم، وتُحفظ مدخلاتها ومعادلاتها مع كل نتيجة.</p>
      </header>
      <Card className="border-warn/40">
        <p className="p-5 text-sm text-warn">
          هذه الدرجات تصف الأداء داخل محاكاة أَمَد. لم تُتحقق علميًا بعد كمؤشر تنبؤي للأداء في حوادث حقيقية، ولا تُستخدم كشهادة أو تقييم وظيفي.
        </p>
      </Card>
      <Card>
        <CardHeader title="مؤشر الجاهزية العام" subtitle="متوسط الأبعاد الأربعة × 100" />
        <dl className="divide-y divide-line">
          {DIMS.map(([n, f]) => (
            <div key={n} className="grid gap-1 px-5 py-4 sm:grid-cols-[140px_1fr]">
              <dt className="font-medium">{n}</dt>
              <dd className="text-sm text-silver">{f}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <Card>
        <CardHeader title="درجة التحقيق الجنائي" />
        <ul className="flex flex-col gap-2 p-5 text-sm text-silver">
          <li>نقطة الدخول ({iw.entry * 100}٪): نصفها للأصل الصحيح ونصفها للتقنية الصحيحة.</li>
          <li>الأصول المخترقة ({iw.assets * 100}٪) والحسابات المخترقة ({iw.identities * 100}٪): مقياس F1 مقابل ما حدث فعلًا في جلستك.</li>
          <li>تسلسل الهجوم ({iw.sequence * 100}٪): أطول تسلسل مشترك بين ترتيبك والترتيب الفعلي.</li>
          <li>الأدلة ({iw.evidence * 100}٪): 0.6 × نسبة الأدلة المستشهد بها المرتبطة بنشاط الخصم + 0.4 إن شملت دليل نقطة الدخول. لا يُقبل الاستشهاد إلا بأدلة حصلت عليها فعلًا.</li>
        </ul>
      </Card>
      <Card>
        <CardHeader title="الملف السلوكي والكفاءات" />
        <div className="flex flex-col gap-2 p-5 text-sm text-silver">
          <p>كل أمر دفاعي مرتبط بكفاءة. أوامر الفحص تُقاس بنسبة ما كشف أدلة معادية، وأوامر الاحتواء بنسبة ما أصاب كيانًا معاديًا. حفظ الأدلة يُقاس بنسبة الأصول المخترقة المنسوخة جنائيًا، وإعادة البناء بدرجة التحقيق.</p>
          <p>يُحدَّث مستوى كل كفاءة بمتوسط متحرك أُسّي (وزن 0.4 للقياس الجديد بعد القياس الأول).</p>
        </div>
      </Card>
      <Card>
        <CardHeader title="الخصم المتكيّف والتوصيات" />
        <div className="flex flex-col gap-2 p-5 text-sm text-silver">
          <p>يتلقى الخصم ملفك (متوسط آخر ثلاث نتائج): كلما ارتفع مستواك صار الخصم أسرع ويفضّل الحركات منخفضة الضجيج. عند تعطيل مساره يفضّل المسارات البديلة المعتمدة. كل حركة يقترحها يجب أن يعتمدها الحارس قبل تطبيقها.</p>
          <p>ترتيب السيناريو التالي = {rw.gap} × فجوة الكفاءات + {rw.difficultyFit} × ملاءمة الصعوبة + {rw.novelty} × الجِدّة (خصم على التكرار القريب). لا تدخل استخبارات التهديدات في الترتيب بعد لأن خط جمعها لم يُبنَ.</p>
        </div>
      </Card>
    </div>
  );
}
