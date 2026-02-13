import { Router } from "express";
import { generateInsight, generateFundamentalInsight } from "../controllers/aiController.js";

const router = Router();

// POST /api/ai-insight — generate AI market/technical insight
router.post("/", generateInsight);

// POST /api/ai-insight/fundamental — generate AI fundamental insight
router.post("/fundamental", generateFundamentalInsight);

export default router;
