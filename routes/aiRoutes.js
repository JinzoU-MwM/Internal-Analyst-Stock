import { Router } from "express";
import { protect, requirePremium } from "../middleware/auth.js";
import { generateInsight, generateFundamentalInsight, generateTechnicalInsight } from "../controllers/aiController.js";

const router = Router();

// All AI insight endpoints require premium subscription
// POST /api/ai-insight — generate AI market/technical insight
router.post("/", protect, requirePremium, generateInsight);

// POST /api/ai-insight/fundamental — generate AI fundamental insight
router.post("/fundamental", protect, requirePremium, generateFundamentalInsight);

// POST /api/ai-insight/technical — generate AI technical analysis insight
router.post("/technical", protect, requirePremium, generateTechnicalInsight);

export default router;
