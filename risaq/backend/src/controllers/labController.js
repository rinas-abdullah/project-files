import { Lab } from "../models/Lab.js";
import { Attempt } from "../models/Attempt.js";
import { User } from "../models/User.js";
import { scoreAttempt } from "../utils/scoring.js";
import { computePoints, evaluateBadges } from "../utils/gamification.js";
import { BADGE_BY_CODE } from "../data/badges.js";

// The list view omits answer keys (correctOptionId / correctIocIds /
// explanations) so a trainee can't read the solution from the network tab.
function stripAnswers(lab) {
  const obj = lab.toObject();
  obj.items = obj.items.map(({ correctOptionId, correctIocIds, explanationAr, explanation, ...rest }) => rest);
  return obj;
}

export async function listLabs(req, res) {
  const labs = await Lab.find().sort({ order: 1 });
  const attempts = await Attempt.find({ user: req.userId }).select("lab score").lean();

  const bestScoreByLab = new Map();
  for (const a of attempts) {
    const key = a.lab.toString();
    bestScoreByLab.set(key, Math.max(bestScoreByLab.get(key) || 0, a.score));
  }

  res.json({
    labs: labs.map((lab) => ({
      id: lab._id,
      slug: lab.slug,
      titleAr: lab.titleAr,
      title: lab.title,
      descriptionAr: lab.descriptionAr,
      description: lab.description,
      category: lab.category,
      difficulty: lab.difficulty,
      dimensions: lab.dimensions,
      timeLimitSeconds: lab.timeLimitSeconds,
      itemCount: lab.items.length,
      bestScore: bestScoreByLab.get(lab._id.toString()) ?? null,
    })),
  });
}

export async function getLab(req, res) {
  const lab = await Lab.findOne({ slug: req.params.slug });
  if (!lab) return res.status(404).json({ error: "المختبر غير موجود" });
  res.json({ lab: stripAnswers(lab) });
}

export async function submitLab(req, res) {
  const lab = await Lab.findOne({ slug: req.params.slug });
  if (!lab) return res.status(404).json({ error: "المختبر غير موجود" });

  const { startedAt, submissions } = req.body;
  if (!startedAt || !Array.isArray(submissions)) {
    return res.status(400).json({ error: "بيانات الإرسال غير مكتملة" });
  }

  const started = new Date(startedAt);
  const finished = new Date();
  const timeTakenSeconds = Math.max(1, Math.round((finished - started) / 1000));

  const { itemResults, score } = scoreAttempt(lab, submissions);

  const previousAttemptsCount = await Attempt.countDocuments({ user: req.userId, lab: lab._id });
  const pointsAwarded = computePoints({
    score,
    timeTakenSeconds,
    timeLimitSeconds: lab.timeLimitSeconds,
    isFirstAttemptForLab: previousAttemptsCount === 0,
  });

  const user = await User.findById(req.userId);
  const attempt = await Attempt.create({
    user: user._id,
    lab: lab._id,
    startedAt: started,
    finishedAt: finished,
    timeTakenSeconds,
    itemResults,
    score,
    pointsAwarded,
  });

  const newBadges = await evaluateBadges({
    user,
    attempt,
    timeLimitSeconds: lab.timeLimitSeconds,
    attemptCountForLab: previousAttemptsCount + 1,
  });

  user.points += pointsAwarded;
  for (const code of newBadges) user.badges.push({ code });
  await user.save();

  attempt.badgesAwarded = newBadges;
  await attempt.save();

  res.json({
    result: {
      score,
      pointsAwarded,
      timeTakenSeconds,
      itemResults: itemResults.map((r, i) => ({
        ...r,
        correctOptionId: lab.items[i].correctOptionId,
        correctIocIds: lab.items[i].correctIocIds,
        explanationAr: lab.items[i].explanationAr,
        explanation: lab.items[i].explanation,
      })),
      newBadges: newBadges.map((code) => BADGE_BY_CODE[code]),
      totalPoints: user.points,
    },
  });
}
