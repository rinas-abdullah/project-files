"use client";

import { motion } from "framer-motion";
import { FlaskConical, Gauge, Droplets, AlertTriangle } from "lucide-react";

const PRESSURE_ROWS = [
  { target: "5", slipperAvg: "982.0", slipperDiff: "18", shoeAvg: "995.0", shoeDiff: "2" },
  { target: "10", slipperAvg: "994.3", slipperDiff: "1", shoeAvg: "999.7", shoeDiff: "1" },
  { target: "15", slipperAvg: "998.7", slipperDiff: "1", shoeAvg: "1001.0", shoeDiff: "0" },
  { target: "20", slipperAvg: "998.3", slipperDiff: "1", shoeAvg: "1002.7", shoeDiff: "1" },
  { target: "25", slipperAvg: "1001.3", slipperDiff: "2", shoeAvg: "1002.3", shoeDiff: "1" },
];

const CLIMATE_ROWS = [
  { time: "قبل اللبس", shoeTemp: "27.6", shoeHum: "76.6", slipperTemp: "29.3", slipperHum: "69.1" },
  { time: "0", shoeTemp: "27.6", shoeHum: "78.0", slipperTemp: "28.7", slipperHum: "75.0" },
  { time: "5", shoeTemp: "30.2", shoeHum: "84.2", slipperTemp: "28.9", slipperHum: "84.0" },
  { time: "10", shoeTemp: "31.2", shoeHum: "86.0", slipperTemp: "29.4", slipperHum: "85.2" },
  { time: "15", shoeTemp: "31.7", shoeHum: "89.2", slipperTemp: "30.1", slipperHum: "86.0" },
  { time: "20", shoeTemp: "32.5", shoeHum: "91.0", slipperTemp: "30.1", slipperHum: "88.3" },
];

export default function PrototypeResults() {
  return (
    <section id="prototype-results" className="relative w-full py-24 px-6 md:px-12 bg-transparent overflow-hidden font-sans">
      <div className="w-full max-w-5xl mx-auto z-10">

        {/* Title */}
        <div className="flex flex-col items-center justify-center text-center mb-12 select-none">
          <span className="text-xs font-semibold tracking-wider text-primary-blue uppercase mb-3 flex items-center gap-2 font-sans unified-english">
            <FlaskConical className="w-4 h-4" />
            FIRST PROTOTYPE & EARLY TEST RESULTS
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-arabic leading-tight unified-typography">
            النموذج الأولي ونتائج الاختبارات
          </h2>
          <h3 className="text-xl sm:text-2xl font-light text-primary-blue mt-2 font-sans unified-english">
            Prototype & Early Test Results
          </h3>
          <p className="text-muted-text text-sm md:text-base mt-4 max-w-2xl font-light leading-relaxed font-arabic">
            بنى الفريق نموذجاً أولياً باستخدام لوحة Arduino UNO، مع مستشعر ضغط مثبّت على لباد الحذاء، ومستشعر للحرارة والرطوبة، وأُجريت الاختبارات على نوعين من الأحذية.
          </p>
        </div>

        {/* Caveat box */}
        <div dir="rtl" className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-5 mb-12 text-right">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 font-arabic leading-relaxed">
            <span className="font-bold">ملاحظة:</span> هذه اختبارات أولية لإثبات المفهوم في ظروف منزلية فقط، وليست تحققاً سريرياً. نتائج التجربتين الثانية والثالثة غير مدرجة هنا.
          </p>
        </div>

        {/* Experiment 1 */}
        <div dir="rtl" className="mb-14">
          <div className="flex items-center gap-2 justify-end mb-3">
            <h4 className="text-lg font-bold text-slate-800 font-arabic">التجربة 1: الحذاء مقابل الشبشب — قراءة الضغط عند أوزان مختلفة</h4>
            <Gauge className="w-5 h-5 text-primary-blue" />
          </div>
          <p className="text-sm text-muted-text font-arabic leading-relaxed mb-5 text-right">
            وُضعت أوزان مستهدفة من 5 إلى 25 كغم، وسُجلت ثلاث قراءات لكل وزن على نوعين من الأحذية، وقورنت بميزان مرجعي.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm text-right" dir="rtl">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="p-3 font-semibold whitespace-nowrap">الوزن المستهدف (كغم)</th>
                  <th className="p-3 font-semibold whitespace-nowrap">متوسط القراءة — الشبشب</th>
                  <th className="p-3 font-semibold whitespace-nowrap">الفرق بين القراءات — الشبشب</th>
                  <th className="p-3 font-semibold whitespace-nowrap">متوسط القراءة — الحذاء</th>
                  <th className="p-3 font-semibold whitespace-nowrap">الفرق بين القراءات — الحذاء</th>
                </tr>
              </thead>
              <tbody>
                {PRESSURE_ROWS.map((r, i) => (
                  <tr key={r.target} className={i % 2 ? "bg-slate-50" : "bg-white"}>
                    <td className="p-3 font-bold text-slate-800">{r.target}</td>
                    <td className="p-3 text-slate-600">{r.slipperAvg}</td>
                    <td className="p-3 text-slate-600">{r.slipperDiff}</td>
                    <td className="p-3 text-slate-600">{r.shoeAvg}</td>
                    <td className="p-3 text-slate-600">{r.shoeDiff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-5 space-y-2 text-right" dir="rtl">
            <li className="text-sm text-slate-600 font-arabic leading-relaxed"><span className="font-bold text-slate-800">تكرار عالٍ: </span>الفرق بين القراءات المتكررة لم يتجاوز وحدتين في 9 من 10 قياسات.</li>
            <li className="text-sm text-slate-600 font-arabic leading-relaxed"><span className="font-bold text-slate-800">ثبات أفضل في الحذاء: </span>عند 5 كغم كان الفرق بين القراءات وحدتين في الحذاء مقابل 18 وحدة في الشبشب.</li>
            <li className="text-sm text-slate-600 font-arabic leading-relaxed"><span className="font-bold text-slate-800">تشبّع مبكر: </span>ارتفع متوسط القراءة بين 5 و25 كغم بنحو 2% فقط، ومعظم الارتفاع حدث قبل 10 كغم — أي أن المستشعر الحالي لا يميّز جيداً بين الأحمال الأعلى.</li>
          </ul>
        </div>

        {/* Experiment 4 */}
        <div dir="rtl">
          <div className="flex items-center gap-2 justify-end mb-3">
            <h4 className="text-lg font-bold text-slate-800 font-arabic">التجربة 4: الرطوبة والحرارة داخل الحذاء على مدى 20 دقيقة</h4>
            <Droplets className="w-5 h-5 text-primary-blue" />
          </div>
          <p className="text-sm text-muted-text font-arabic leading-relaxed mb-5 text-right">
            وُضع حساس الرطوبة والحرارة تحت مقدمة القدم مع جوارب طبيعية وحركة طبيعية، وقورن الحذاء بالشبشب على مدى 20 دقيقة.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm text-right" dir="rtl">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="p-3 font-semibold whitespace-nowrap">الوقت (دقيقة)</th>
                  <th className="p-3 font-semibold whitespace-nowrap">حرارة الحذاء °م</th>
                  <th className="p-3 font-semibold whitespace-nowrap">رطوبة الحذاء %</th>
                  <th className="p-3 font-semibold whitespace-nowrap">حرارة الشبشب °م</th>
                  <th className="p-3 font-semibold whitespace-nowrap">رطوبة الشبشب %</th>
                </tr>
              </thead>
              <tbody>
                {CLIMATE_ROWS.map((r, i) => (
                  <tr key={r.time} className={i % 2 ? "bg-slate-50" : "bg-white"}>
                    <td className="p-3 font-bold text-slate-800 whitespace-nowrap">{r.time}</td>
                    <td className="p-3 text-slate-600">{r.shoeTemp}</td>
                    <td className="p-3 text-slate-600">{r.shoeHum}</td>
                    <td className="p-3 text-slate-600">{r.slipperTemp}</td>
                    <td className="p-3 text-slate-600">{r.slipperHum}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-5 space-y-2 text-right" dir="rtl">
            <li className="text-sm text-slate-600 font-arabic leading-relaxed"><span className="font-bold text-slate-800">داخل الحذاء: </span>ارتفعت الحرارة 4.9 درجات (من 27.6 إلى 32.5°م) والرطوبة 13 نقطة (من 78% إلى 91%) خلال 20 دقيقة.</li>
            <li className="text-sm text-slate-600 font-arabic leading-relaxed"><span className="font-bold text-slate-800">داخل الشبشب: </span>كان ارتفاع الحرارة أقل (1.4 درجة، من 28.7 إلى 30.1°م)، وارتفعت الرطوبة من 75% إلى 88.3%.</li>
            <li className="text-sm text-slate-600 font-arabic leading-relaxed"><span className="font-bold text-slate-800">الخلاصة: </span>بيئة الحذاء المغلق رطبة ودافئة بشكل ملحوظ، ما يؤكد أهمية عزل الإلكترونيات والتوصيلات عن الرطوبة والعرق.</li>
          </ul>
        </div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-14 rounded-2xl border border-primary-blue/15 bg-primary-blue/5 p-6 text-right"
          dir="rtl"
        >
          <p className="text-sm text-slate-700 font-arabic leading-relaxed">
            <span className="font-bold text-primary-blue">الخلاصة: </span>
            النموذج الأولي يعمل ويقيس الضغط والحرارة والرطوبة بقراءات متكررة ثابتة. حددت هذه الاختبارات أولويات المرحلة التالية: مستشعرات ضغط بمدى أوسع، ونموذج معايرة لتقدير الحمل بالكيلوغرام، وحماية أفضل للإلكترونيات من الرطوبة والعرق، وتفعيل كشف التشبّع ضمن Dithar Self-Check.
          </p>
        </motion.div>

      </div>
    </section>
  );
}
