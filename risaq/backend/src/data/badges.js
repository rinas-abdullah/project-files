// Static badge catalog. Kept in code rather than the database since the MVP
// has a small, fixed set of achievements — the earned records (code +
// timestamp) live on the User document.
export const BADGE_CATALOG = [
  {
    code: "first_detection",
    icon: "🥉",
    nameAr: "اكتشافك الأول",
    name: "First Detection",
    descriptionAr: "أنهيت أول مختبر بنجاح",
  },
  {
    code: "speed_detector",
    icon: "🥈",
    nameAr: "اكتشاف سريع",
    name: "Speed Detector",
    descriptionAr: "أنهيت مختبراً بأقل من نصف الوقت المحدد وبدرجة 70% فأعلى",
  },
  {
    code: "quick_thinker",
    icon: "⚡",
    nameAr: "تفكير سريع",
    name: "Quick Thinker",
    descriptionAr: "أنهيت مختبراً في أقل من 3 دقائق بدرجة 80% فأعلى",
  },
  {
    code: "analyst_pro",
    icon: "🥇",
    nameAr: "محلل متقدم",
    name: "Analyst Pro",
    descriptionAr: "متوسط درجاتك 90% فأعلى على 3 محاولات فأكثر",
  },
  {
    code: "security_expert",
    icon: "💎",
    nameAr: "خبير أمان",
    name: "Security Expert",
    descriptionAr: "حصلت على جميع الشارات الأخرى",
  },
];

export const BADGE_BY_CODE = Object.fromEntries(BADGE_CATALOG.map((b) => [b.code, b]));
