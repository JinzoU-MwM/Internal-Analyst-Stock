import { fetchTrader } from "../utils/traderAuth.js";
import { getGroupTickers, getSystemGroupNames } from "../utils/conglomerates.js";

/**
 * GET /api/konglomerat?group=Prajogo%20Pangestu
 * Fetches screener data for a specific group of stocks.
 */
export const getKonglomeratData = async (req, res) => {
    try {
        const { group } = req.query;

        // Validation
        if (!group) {
            return res.status(400).json({
                success: false,
                error: "Group parameter is required",
                groups: getSystemGroupNames()
            });
        }

        const tickers = getGroupTickers(group);
        if (tickers.length === 0) {
            return res.status(404).json({
                success: false,
                error: `Group "${group}" not found or empty`,
                groups: getSystemGroupNames()
            });
        }

        const codes = tickers.join(",");
        // v=2 is important as per user's curl
        const path = `/analytics/screener/all-stocks?codes=${codes}&limit=100&v=2`;

        let data;
        try {
            data = await fetchTrader(path);
        } catch (e) {
            return res.status(502).json({ success: false, error: "Upstream API Error: " + e.message });
        }

        if (!data) {
            return res.status(502).json({ success: false, error: "Upstream API error (Empty Response)" });
        }

        // Normalize data to array
        let stocks = [];
        if (Array.isArray(data)) {
            stocks = data;
        } else if (data && Array.isArray(data.data)) {
            stocks = data.data;
        }

        res.json({
            success: true,
            group,
            count: stocks.length,
            data: stocks
        });

    } catch (err) {
        console.error("Konglomerat API error:", err.message);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};

/**
 * GET /api/konglomerat/list
 * Returns list of available groups
 */
export const getKonglomeratList = (req, res) => {
    res.json({
        success: true,
        groups: getSystemGroupNames()
    });
};
