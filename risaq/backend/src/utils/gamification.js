import { Attempt } from "../models/Attempt.js";
import { BADGE_CATALOG } from "../data/badges.js";

const OTHER_BADGE_CODES = BADGE_CATALOG.filter((b) => b.code !== "security_expert").map((b) => b.code);

export function computePoints({ score, timeTakenSeconds, timeLimitSeconds, isFirstAttemptForLab }) {
  let points = Math.round(score); // base: 1 point per readiness percent
  if (isFirstAttemptForLab) points += 20;
  if (timeTakenSeconds <= timeLimitSeconds * 0.5 && score >= 70) points += 20;
  return points;
}

// Evaluates which new badges a user just unlocked, given the attempt that
// was just recorded and their full attempt history (including it).
export async function evaluateBadges({ user, attempt, timeLimitSeconds, attemptCountForLab }) {
  const alreadyEarned = new Set(user.badges.map((b) => b.code));
  const newlyEarned = [];

  const award = (code) => {
    if (!alreadyEarned.has(code)) {
      newlyEarned.push(code);
      alreadyEarned.add(code);
    }
  };

  if (attempt.score >= 50) award("first_detection");

  if (attempt.timeTakenSeconds <= timeLimitSeconds * 0.5 && attempt.score >= 70) {
    award("speed_detector");
  }

  if (attempt.timeTakenSeconds <= 180 && attempt.score >= 80) {
    award("quick_thinker");
  }

  const allAttempts = await Attempt.find({ user: user._id }).select("score").lean();
  if (allAttempts.length >= 3) {
    const avg = allAttempts.reduce((sum, a) => sum + a.score, 0) / allAttempts.length;
    if (avg >= 90) award("analyst_pro");
  }

  if (OTHER_BADGE_CODES.every((code) => alreadyEarned.has(code))) {
    award("security_expert");
  }

  return newlyEarned;
}
