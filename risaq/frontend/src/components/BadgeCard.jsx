import React from "react";

export default function BadgeCard({ badge, earned, earnedAt }) {
  return (
    <div
      className={`card p-5 flex flex-col items-center text-center gap-2 transition ${
        earned ? "border-risaq-primary/40 shadow-glow" : "opacity-40 grayscale"
      }`}
    >
      <div className="text-4xl">{badge.icon}</div>
      <div className="font-bold text-sm">{badge.nameAr}</div>
      <div className="text-xs text-risaq-muted">{badge.descriptionAr}</div>
      {earned && earnedAt && (
        <div className="text-[10px] text-risaq-primary mt-1">
          حصلت عليها في {new Date(earnedAt).toLocaleDateString("ar-SA")}
        </div>
      )}
    </div>
  );
}
