import { Router } from "express";
import { getMyReport } from "../controllers/reportController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/me", requireAuth, asyncHandler(getMyReport));

export default router;
