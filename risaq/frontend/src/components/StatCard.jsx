import React from "react";

export default function StatCard({ icon, label, value, accent = "text-risaq-primary" }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`text-3xl ${accent}`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-risaq-muted mt-0.5">{label}</div>
      </div>
    </div>
  );
}
