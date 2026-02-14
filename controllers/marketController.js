import { fetchTrader } from "../utils/traderAuth.js";

/**
 * Market Controller — proxies tradersaham.com market insight APIs
 */

// GET /api/market/foreign-flow?date=2026-02-13
export const getForeignFlowDaily = async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];

        const data = await fetchTrader(`/market-insight/foreign-flow?date=${date}`);

        // If upstream returns null or error, handle gracefully
        if (!data) {
            return res.status(502).json({ success: false, error: "Upstream API tidak merespons" });
        }

        res.json({ success: true, date, data });
    } catch (err) {
        console.error("Foreign flow daily error:", err.message);
        res.status(500).json({ success: false, error: "Gagal memuat data foreign flow daily" });
    }
};

// GET /api/market/foreign-flow-trends?type=accumulation&lookback_days=7
export const getForeignFlowTrends = async (req, res) => {
    try {
        const type = req.query.type || "accumulation";
        const lookback_days = req.query.lookback_days || 7;

        const data = await fetchTrader(`/market-insight/foreign-flow-trends?type=${type}&lookback_days=${lookback_days}`);

        if (!data) {
            return res.status(502).json({ success: false, error: "Upstream API tidak merespons" });
        }

        res.json({ success: true, type, lookback_days, data });
    } catch (err) {
        console.error("Foreign flow trends error:", err.message);
        res.status(500).json({ success: false, error: "Gagal memuat data foreign flow trends" });
    }
};
