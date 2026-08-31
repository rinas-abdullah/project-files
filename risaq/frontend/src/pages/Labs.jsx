import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/client.js";

const CATEGORY_LABEL = {
  phishing: { label: "تصيّد إلكتروني", color: "text-risaq-accent" },
  malware: { label: "برمجيات خبيثة", color: "text-risaq-danger" },
  network: { label: "دفاع الشبكة", color: "text-risaq-primary" },
};

export default function Labs() {
  const [labs, setLabs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch("/labs")
      .then((data) => setLabs(data.labs))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">المختبرات السيبرانية</h1>
        <p className="text-risaq-muted text-sm mt-1">اختر مختبراً وابدأ تدريباً عملياً على سيناريوهات واقعية</p>
      </div>

      {error && <div className="text-risaq-danger text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {labs.map((lab) => {
          const cat = CATEGORY_LABEL[lab.category] || { label: lab.category, color: "text-risaq-muted" };
          return (
            <Link
              key={lab.id}
              to={`/labs/${lab.slug}`}
              className="card p-6 flex flex-col gap-3 hover:border-risaq-primary/50 hover:shadow-glow transition"
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${cat.color}`}>{cat.label}</span>
                <span className="text-xs text-risaq-muted">صعوبة {lab.difficulty}/5</span>
              </div>
              <h3 className="font-bold text-lg leading-snug">{lab.titleAr}</h3>
              <p className="text-sm text-risaq-muted flex-1">{lab.descriptionAr}</p>
              <div className="flex items-center justify-between text-xs text-risaq-muted pt-3 border-t border-risaq-border">
                <span>⏱️ {Math.round(lab.timeLimitSeconds / 60)} دقائق</span>
                <span>🧩 {lab.itemCount} سيناريوهات</span>
              </div>
              <div className="text-sm font-bold">
                {lab.bestScore !== null ? (
                  <span className="text-risaq-primary2">أفضل نتيجة: {lab.bestScore}%</span>
                ) : (
                  <span className="text-risaq-accent">ابدأ الآن ←</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
