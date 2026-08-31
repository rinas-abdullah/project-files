import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import StatCard from "../components/StatCard.jsx";
import ScoreRing from "../components/ScoreRing.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [labs, setLabs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([apiFetch("/reports/me"), apiFetch("/labs")])
      .then(([reportData, labsData]) => {
        setReport(reportData);
        setLabs(labsData.labs);
      })
      .catch((err) => setError(err.message));
  }, []);

  const completedCount = labs.filter((l) => l.bestScore !== null).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">أهلاً، {user?.name?.split(" ")[0]} 👋</h1>
        <p className="text-risaq-muted text-sm mt-1">هذا ملخص جاهزيتك السيبرانية الحالية</p>
      </div>

      {error && <div className="text-risaq-danger text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon="🎯" label="نقاط الخبرة" value={user?.points ?? 0} />
        <StatCard icon="🏆" label="الشارات المكتسبة" value={user?.badges?.length ?? 0} accent="text-risaq-accent" />
        <StatCard icon="🧪" label="مختبرات مكتملة" value={`${completedCount} / ${labs.length}`} accent="text-risaq-primary2" />
        <StatCard icon="📈" label="محاولات مسجّلة" value={report?.totalAttempts ?? 0} accent="text-risaq-warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 flex flex-col items-center justify-center">
          <h2 className="font-bold mb-4 self-start">الجاهزية السيبرانية الإجمالية</h2>
          <ScoreRing value={report?.overall ?? 0} size={160} label="Overall Readiness" />
          {report?.recommendations?.length > 0 && (
            <div className="mt-6 w-full space-y-2">
              <div className="text-xs font-bold text-risaq-muted">أولويات التدريب المقترحة:</div>
              {report.recommendations.map((r) => (
                <div key={r.dimension} className="text-xs bg-risaq-danger/10 text-risaq-danger border border-risaq-danger/20 rounded-lg px-3 py-1.5">
                  {r.dimension}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">مختبراتك</h2>
            <Link to="/labs" className="text-xs text-risaq-primary hover:underline">
              عرض الكل ←
            </Link>
          </div>
          <div className="space-y-3">
            {labs.slice(0, 4).map((lab) => (
              <Link
                key={lab.id}
                to={`/labs/${lab.slug}`}
                className="flex items-center justify-between bg-risaq-panel2 border border-risaq-border rounded-xl px-4 py-3 hover:border-risaq-primary/40 transition"
              >
                <div>
                  <div className="font-semibold text-sm">{lab.titleAr}</div>
                  <div className="text-xs text-risaq-muted mt-0.5">
                    {lab.itemCount} سيناريوهات · صعوبة {lab.difficulty}/5
                  </div>
                </div>
                <div className="text-sm font-bold">
                  {lab.bestScore !== null ? (
                    <span className="text-risaq-primary2">{lab.bestScore}%</span>
                  ) : (
                    <span className="text-risaq-muted text-xs">لم يبدأ</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {report?.history?.length > 0 && (
        <div className="card p-6">
          <h2 className="font-bold mb-4">النشاط الأخير</h2>
          <div className="space-y-2">
            {[...report.history]
              .reverse()
              .slice(0, 5)
              .map((h, i) => (
                <div key={i} className="flex items-center justify-between text-sm border-b border-risaq-border/60 pb-2 last:border-0">
                  <span className="text-risaq-text">{h.labTitleAr}</span>
                  <span className="text-risaq-muted text-xs">
                    {new Date(h.date).toLocaleDateString("ar-SA")} · +{h.pointsAwarded} نقطة
                  </span>
                  <span className="font-bold text-risaq-primary2">{h.score}%</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
