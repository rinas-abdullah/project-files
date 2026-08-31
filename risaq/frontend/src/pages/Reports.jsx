import React, { useEffect, useState } from "react";
import { apiFetch } from "../api/client.js";
import ScoreRing from "../components/ScoreRing.jsx";

function DimensionBar({ dim }) {
  const color = !dim.attempted ? "bg-risaq-border" : dim.score >= 75 ? "bg-risaq-primary2" : dim.score >= 50 ? "bg-risaq-warning" : "bg-risaq-danger";
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="font-medium">{dim.nameAr}</span>
        <span className="text-risaq-muted">{dim.attempted ? `${dim.score}%` : "لا توجد بيانات"}</span>
      </div>
      <div className="w-full h-2.5 bg-risaq-bg/60 border border-risaq-border rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${dim.attempted ? dim.score : 0}%` }} />
      </div>
    </div>
  );
}

export default function Reports() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch("/reports/me")
      .then(setReport)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="text-risaq-danger text-sm">{error}</div>;
  if (!report) return <div className="text-risaq-muted text-sm">جارِ تحميل التقرير...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">تقرير الجاهزية السيبرانية</h1>
        <p className="text-risaq-muted text-sm mt-1">تحليل متعدد الأبعاد لأدائك عبر جميع المختبرات</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 flex flex-col items-center justify-center">
          <ScoreRing value={report.overall} size={150} label="Overall Readiness" />
          <p className="text-xs text-risaq-muted mt-4 text-center">
            محسوبة من {report.totalAttempts} محاولة عبر الأبعاد المُختبرة فعلياً
          </p>
        </div>

        <div className="card p-6 lg:col-span-2 space-y-4">
          <h2 className="font-bold">الأبعاد الثمانية للجاهزية</h2>
          <div className="space-y-4">
            {report.breakdown.map((dim) => (
              <DimensionBar key={dim.key} dim={dim} />
            ))}
          </div>
        </div>
      </div>

      {report.recommendations.length > 0 && (
        <div className="card p-6">
          <h2 className="font-bold mb-3">التوصيات</h2>
          <div className="space-y-2">
            {report.recommendations.map((r) => (
              <div key={r.dimension} className="flex items-center gap-2 text-sm bg-risaq-danger/10 border border-risaq-danger/20 rounded-xl px-4 py-2.5">
                <span>⚠️</span>
                ركّز تدريبك القادم على: <span className="font-bold">{r.dimension}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-6">
        <h2 className="font-bold mb-4">سجلّ المحاولات</h2>
        {report.history.length === 0 ? (
          <p className="text-sm text-risaq-muted">لم تُكمل أي مختبر بعد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-risaq-muted border-b border-risaq-border">
                  <th className="pb-2 font-medium">المختبر</th>
                  <th className="pb-2 font-medium">التاريخ</th>
                  <th className="pb-2 font-medium">الوقت المستغرق</th>
                  <th className="pb-2 font-medium">النقاط</th>
                  <th className="pb-2 font-medium">الدرجة</th>
                </tr>
              </thead>
              <tbody>
                {[...report.history].reverse().map((h, i) => (
                  <tr key={i} className="border-b border-risaq-border/50 last:border-0">
                    <td className="py-2.5">{h.labTitleAr}</td>
                    <td className="py-2.5 text-risaq-muted">{new Date(h.date).toLocaleDateString("ar-SA")}</td>
                    <td className="py-2.5 text-risaq-muted">{Math.round(h.timeTakenSeconds / 60)} د</td>
                    <td className="py-2.5 text-risaq-accent">+{h.pointsAwarded}</td>
                    <td className="py-2.5 font-bold text-risaq-primary2">{h.score}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
