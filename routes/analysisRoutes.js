import { Router } from "express";
import {
    createAnalysis,
    getAnalysisByTicker,
    deleteAnalysis,
} from "../controllers/analysisController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

// POST /api/analysis — create a new analysis (authenticated users only)
router.post("/", protect, createAnalysis);

// To restrict to admin only, chain authorize after protect:
// router.post("/", protect, authorize("admin"), createAnalysis);

// GET /api/analysis/:ticker — get all analyses for a ticker (public)
router.get("/:ticker", getAnalysisByTicker);

// DELETE /api/analysis/:id — delete an analysis (authenticated users only)
router.delete("/:id", protect, deleteAnalysis);

export default router;
