import express from "express";
import { getOwnershipData } from "../controllers/ownershipController.js";
import { cacheMiddleware } from "../utils/cache.js";

const router = express.Router();

// Support both /api/ownership?ticker=BBCA and /api/ownership/BBCA
router.get("/", cacheMiddleware(900), getOwnershipData);         // 15min
router.get("/:ticker", cacheMiddleware(900), getOwnershipData);  // 15min

export default router;
