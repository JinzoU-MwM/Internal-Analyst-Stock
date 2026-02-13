import { Router } from "express";
import { getHistoricalData } from "../services/stockService.js";
import { getFundamentalStats } from "../controllers/stockController.js";
import { cacheMiddleware } from "../utils/cache.js";

const router = Router();

/**
 * GET /api/stocks/:ticker/fundamental
 * Fetch fundamental analysis data (PE, PB, ROE, dividends, etc.)
 *
 * Cached for 15 minutes — fundamental data changes infrequently.
 * ⚠ Must be registered BEFORE /:ticker to avoid being caught by the wildcard.
 */
router.get("/:ticker/fundamental", cacheMiddleware(900), getFundamentalStats);

/**
 * GET /api/stocks/:ticker
 *
 * Query params (optional):
 *   period1 – start date ISO string  (default: 1 year ago)
 *   period2 – end date ISO string    (default: today)
 *
 * Cached for 5 minutes — intraday data changes, but we don't need real-time.
 */
router.get("/:ticker", cacheMiddleware(300), async (req, res) => {
    try {
        let { ticker } = req.params;

        // Auto-append .JK for Indonesian stocks
        ticker = ticker.toUpperCase();
        if (!ticker.includes(".")) {
            ticker += ".JK";
        }

        // Default to the last 1 year of data
        const now = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);

        const period1 = req.query.period1 || oneYearAgo.toISOString().split("T")[0];
        const period2 = req.query.period2 || now.toISOString().split("T")[0];

        const data = await getHistoricalData(ticker, period1, period2);

        return res.json({
            success: true,
            ticker: ticker.toUpperCase(),
            period: { from: period1, to: period2 },
            count: data.length,
            data,
        });
    } catch (error) {
        console.error(`[StockRoutes] ${error.message}`);

        const status = error.message.includes("No data found") ? 404 : 500;

        return res.status(status).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
