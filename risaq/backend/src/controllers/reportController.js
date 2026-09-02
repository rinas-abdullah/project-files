import { Attempt } from "../models/Attempt.js";
import { Lab } from "../models/Lab.js";

// All eight readiness dimensions from the platform spec. A dimension only
// gets a real score once the trainee has attempted a lab tagged with it —
// the rest are reported as "not attempted" rather than a misleading 0.
const ALL_DIMENSIONS = [
  { key: "threatDetection", nameAr: "اكتشاف التهديدات", name: "Threat Detection" },
  { key: "incidentResponse", nameAr: "الاستجابة للحوادث", name: "Incident Response" },
  { key: "networkDefense", nameAr: "الدفاع عن الشبكة", name: "Network Defense" },
  { key: "decisionMaking", nameAr: "اتخاذ القرارات", name: "Decision Making" },
  { key: "analysisSkills", nameAr: "مهارات التحليل", name: "Analysis Skills" },
  { key: "pressurePerformance", nameAr: "الأداء تحت الضغط", name: "Performance Under Pressure" },
  { key: "riskAssessment", nameAr: "تقييم المخاطر", name: "Risk Assessment" },
  { key: "timeManagement", nameAr: "إدارة الوقت", name: "Time Management" },
];

export async function getMyReport(req, res) {
  const attempts = await Attempt.find({ user: req.userId }).populate("lab").sort({ createdAt: 1 }).lean();

  const scoresByDimension = new Map();
  for (const attempt of attempts) {
    const lab = attempt.lab;
    if (!lab) continue;
    for (const dim of lab.dimensions || []) {
      if (!scoresByDimension.has(dim)) scoresByDimension.set(dim, []);
      scoresByDimension.get(dim).push(attempt.score);
    }
  }

  const breakdown = ALL_DIMENSIONS.map((dim) => {
    const scores = scoresByDimension.get(dim.key);
    const value = scores?.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    return { ...dim, score: value, attempted: Boolean(scores?.length) };
  });

  const attemptedScores = breakdown.filter((d) => d.attempted).map((d) => d.score);
  const overall = attemptedScores.length
    ? Math.round(attemptedScores.reduce((a, b) => a + b, 0) / attemptedScores.length)
    : 0;

  // Only recommend dimensions that genuinely need work — a dimension the
  // trainee has already mastered (>=80%) shouldn't show up as a priority
  // just for being the lowest of an all-high set.
  const weakest = [...breakdown]
    .filter((d) => d.attempted && d.score < 80)
    .sort((a, b) => a.score - b.score)
    .slice(0, 2);

  const history = attempts.map((a) => ({
    date: a.createdAt,
    labSlug: a.lab?.slug,
    labTitleAr: a.lab?.titleAr,
    labTitle: a.lab?.title,
    score: a.score,
    pointsAwarded: a.pointsAwarded,
    timeTakenSeconds: a.timeTakenSeconds,
  }));

  res.json({
    overall,
    breakdown,
    recommendations: weakest.map((d) => ({ dimension: d.nameAr, dimensionEn: d.name })),
    history,
    totalAttempts: attempts.length,
  });
}
