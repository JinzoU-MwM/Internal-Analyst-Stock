import express from "express";
import {
    getBrokerList,
    getBrokerFlowTrends,
    getBrokerDataAvailability,
    getTradingDays,
    getBroksum,
    getBrokerIntelligence,
    getSmartMoneyAccumulation,
} from "../controllers/brokerController.js";
import { cacheMiddleware } from "../utils/cache.js";

const router = express.Router();

router.get("/list", cacheMiddleware(1800), getBrokerList);                // 30min — rarely changes
router.get("/flow-trends", cacheMiddleware(300), getBrokerFlowTrends);    // 5min — market data
router.get("/data-availability", cacheMiddleware(1800), getBrokerDataAvailability); // 30min
router.get("/trading-days", cacheMiddleware(600), getTradingDays);        // 10min
router.get("/broksum", cacheMiddleware(300), getBroksum);                 // 5min
router.get("/intelligence", cacheMiddleware(300), getBrokerIntelligence); // 5min
router.get("/smart-money", cacheMiddleware(300), getSmartMoneyAccumulation); // 5min

export default router;
