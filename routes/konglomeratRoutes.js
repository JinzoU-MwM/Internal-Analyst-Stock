import express from "express";
import { protect } from "../middleware/auth.js";
import { getKonglomeratData, getKonglomeratList } from "../controllers/konglomeratController.js";
import { cacheMiddleware } from "../utils/cache.js";

const router = express.Router();

router.use(protect); // Protect all routes

router.get("/", cacheMiddleware(600), getKonglomeratData);    // 10min — group data
router.get("/list", cacheMiddleware(1800), getKonglomeratList); // 30min — list rarely changes

export default router;
