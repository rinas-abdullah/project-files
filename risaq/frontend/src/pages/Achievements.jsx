import React from "react";
import { useAuth } from "../context/AuthContext.jsx";
import BadgeCard from "../components/BadgeCard.jsx";

// Mirrors backend/src/data/badges.js so locked badges can be shown too
// (the API only returns badges the user has already earned).
const BADGE_CATALOG = [
  { code: "first_detection", icon: "🥉", nameAr: "اكتشافك الأول", descriptionAr: "أنهيت أول مختبر بنجاح" },
  {
    code: "speed_detector",
    icon: "🥈",
    nameAr: "اكتشاف سريع",
    descriptionAr: "أنهيت مختبراً بأقل من نصف الوقت المحدد وبدرجة 70% فأعلى",
  },
  {
    code: "quick_thinker",
    icon: "⚡",
    nameAr: "تفكير سريع",
    descriptionAr: "أنهيت مختبراً في أقل من 3 دقائق بدرجة 80% فأعلى",
  },
  {
    code: "analyst_pro",
    icon: "🥇",
    nameAr: "محلل متقدم",
    descriptionAr: "متوسط درجاتك 90% فأعلى على 3 محاولات فأكثر",
  },
  { code: "security_expert", icon: "💎", nameAr: "خبير أمان", descriptionAr: "حصلت على جميع الشارات الأخرى" },
];

export default function Achievements() {
  const { user } = useAuth();
  const earnedByCode = new Map((user?.badges || []).map((b) => [b.code, b]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">الإنجازات والشارات</h1>
        <p className="text-risaq-muted text-sm mt-1">
          حصلت على {earnedByCode.size} من {BADGE_CATALOG.length} شارة
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {BADGE_CATALOG.map((badge) => {
          const earned = earnedByCode.get(badge.code);
          return <BadgeCard key={badge.code} badge={badge} earned={Boolean(earned)} earnedAt={earned?.earnedAt} />;
        })}
      </div>
    </div>
  );
}
