import express from "express";
import { getForeignFlowDaily, getForeignFlowTrends } from "../controllers/marketController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/foreign-flow", protect, getForeignFlowDaily);
router.get("/foreign-flow-trends", protect, getForeignFlowTrends);

export default router;
