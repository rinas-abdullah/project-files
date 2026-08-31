import React, { useEffect, useState } from "react";
import { apiFetch } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Leaderboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch("/leaderboard")
      .then((data) => setRows(data.leaderboard))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">لوحة المتصدرين</h1>
        <p className="text-risaq-muted text-sm mt-1">أعلى 20 متدرباً حسب نقاط الخبرة</p>
      </div>

      {error && <div className="text-risaq-danger text-sm">{error}</div>}

      <div className="card overflow-hidden">
        {rows.map((row) => (
          <div
            key={row.rank}
            className={`flex items-center justify-between px-5 py-3.5 border-b border-risaq-border/60 last:border-0 ${
              row.name === user?.name ? "bg-risaq-primary/5" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="w-6 text-center font-bold text-risaq-muted">
                {row.rank <= 3 ? ["🥇", "🥈", "🥉"][row.rank - 1] : row.rank}
              </span>
              <span className="font-semibold text-sm">{row.name}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-risaq-muted">
              <span>{row.badgeCount} شارة</span>
              <span className="font-bold text-risaq-primary2 text-sm">{row.points} نقطة</span>
            </div>
          </div>
        ))}
        {rows.length === 0 && !error && <div className="p-6 text-center text-risaq-muted text-sm">لا توجد بيانات بعد</div>}
      </div>
    </div>
  );
}
