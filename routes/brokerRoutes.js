import express from "express";
import {
    getBrokerList,
    getBrokerFlowTrends,
    getBrokerDataAvailability,
    getTradingDays,
    getBroksum,
    getBrokerIntelligence,
} from "../controllers/brokerController.js";

const router = express.Router();

router.get("/list", getBrokerList);
router.get("/flow-trends", getBrokerFlowTrends);
router.get("/data-availability", getBrokerDataAvailability);
router.get("/trading-days", getTradingDays);
router.get("/broksum", getBroksum);
router.get("/intelligence", getBrokerIntelligence);

export default router;
