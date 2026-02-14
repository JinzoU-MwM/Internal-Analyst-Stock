import express from "express";
import { getForeignFlowDaily, getForeignFlowTrends } from "../controllers/marketController.js";
import { protect } from "../middleware/auth.js";
import { cacheMiddleware } from "../utils/cache.js";

const router = express.Router();

router.get("/foreign-flow", protect, cacheMiddleware(300), getForeignFlowDaily);       // 5min
router.get("/foreign-flow-trends", protect, cacheMiddleware(300), getForeignFlowTrends); // 5min

export default router;
