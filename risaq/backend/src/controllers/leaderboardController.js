import { User } from "../models/User.js";

export async function getLeaderboard(req, res) {
  const users = await User.find().sort({ points: -1 }).limit(20).select("name points badges");
  res.json({
    leaderboard: users.map((u, i) => ({
      rank: i + 1,
      name: u.name,
      points: u.points,
      badgeCount: u.badges.length,
    })),
  });
}
