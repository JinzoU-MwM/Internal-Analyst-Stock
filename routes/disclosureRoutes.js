import express from "express";
import { getDisclosures } from "../controllers/disclosureController.js";
import { cacheMiddleware } from "../utils/cache.js";

const router = express.Router();

// GET /api/disclosures/:category  (others | dividends | rups)
router.get("/:category", cacheMiddleware(600), getDisclosures); // 10min

export default router;
