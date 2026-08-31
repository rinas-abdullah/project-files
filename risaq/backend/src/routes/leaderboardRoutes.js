import { Router } from "express";
import { getLeaderboard } from "../controllers/leaderboardController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(getLeaderboard));

export default router;
