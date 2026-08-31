import { Router } from "express";
import { listLabs, getLab, submitLab } from "../controllers/labController.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(listLabs));
router.get("/:slug", asyncHandler(getLab));
router.post("/:slug/submit", asyncHandler(submitLab));

export default router;
