import { fetchTrader } from "../utils/traderAuth.js";

/**
 * Broker Controller — proxies tradersaham.com broker analytics API
 */

// GET /api/brokers/list  — all broker codes
export const getBrokerList = async (_req, res) => {
    try {
        const data = await fetchTrader("/brokers");
        res.json({ success: true, data: data || [] });
    } catch (err) {
        console.error("Broker list error:", err.message);
        res.status(500).json({ success: false, error: "Gagal memuat daftar broker" });
    }
};

// GET /api/brokers/flow-trends?broker=AK&days=7&type=accumulation&limit=10
export const getBrokerFlowTrends = async (req, res) => {
    try {
        const broker = req.query.broker || "AK";
        const days = req.query.days || 7;
        const type = req.query.type || "accumulation";
        const limit = req.query.limit || 10;

        const data = await fetchTrader(
            `/market-insight/broker-flow-trends?broker_codes=${broker}&lookback_days=${days}&type=${type}&limit=${limit}`
        );

        if (!data) {
            return res.status(502).json({ success: false, error: "Upstream API tidak merespons" });
        }

        res.json({ success: true, broker, type, data });
    } catch (err) {
        console.error("Broker flow error:", err.message);
        res.status(500).json({ success: false, error: "Gagal memuat data flow broker" });
    }
};

// GET /api/brokers/data-availability
export const getBrokerDataAvailability = async (_req, res) => {
    try {
        const data = await fetchTrader("/analytics/broker-data-availability");
        res.json({ success: true, data: data || {} });
    } catch (err) {
        console.error("Broker availability error:", err.message);
        res.status(500).json({ success: false, error: "Gagal memuat data availability" });
    }
};

// GET /api/brokers/trading-days?days=7
export const getTradingDays = async (req, res) => {
    try {
        const days = req.query.days || 7;
        const data = await fetchTrader(`/analytics/broker-scanner/trading-days?days=${days}`);
        res.json({ success: true, data: data || {} });
    } catch (err) {
        console.error("Trading days error:", err.message);
        res.status(500).json({ success: false, error: "Gagal memuat trading days" });
    }
};

// GET /api/brokers/broksum?stock_code=AADI&start_date=...&end_date=...
export const getBroksum = async (req, res) => {
    try {
        const { stock_code, start_date, end_date } = req.query;

        if (!stock_code || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                error: "Missing required params: stock_code, start_date, end_date",
            });
        }

        const path = `/analytics/broksum?stock_code=${stock_code}&start_date=${start_date}&end_date=${end_date}&analyze=true`;
        const data = await fetchTrader(path);

        if (!data) {
            return res.status(502).json({
                success: false,
                error: "Upstream API tidak merespons or returned error",
            });
        }

        // Transform data
        let brokers = [];
        if (data.top_buyers || data.top_sellers) {
            const buyers = data.top_buyers || [];
            const sellers = data.top_sellers || [];

            const mapBroker = (b) => {
                const net_lot = parseInt(b.net_lot || 0);
                const total_lot = parseInt(b.total_lot || 0);
                const net_val = parseFloat(b.net_value || 0);
                const total_val = parseFloat(b.total_value || 0);

                const buy_lot = (total_lot + net_lot) / 2;
                const sell_lot = (total_lot - net_lot) / 2;
                const buy_val = (total_val + net_val) / 2;
                const sell_val = (total_val - net_val) / 2;

                return {
                    code: b.broker_code || b.code,
                    status: b.status || '',
                    buy_vol: buy_lot,
                    sell_vol: sell_lot,
                    buy_val: buy_val,
                    sell_val: sell_val,
                    net_vol: net_lot,
                    net_val: net_val,
                    avg_buy: parseFloat(b.avg_buy_price || 0),
                    avg_sell: parseFloat(b.avg_sell_price || 0),
                };
            };

            brokers = [...buyers.map(mapBroker), ...sellers.map(mapBroker)];
        }

        // Generate Infographic
        const activeBrokers = brokers.filter(b => b.code);
        const sortedByAvgBuy = [...activeBrokers].filter(b => b.net_vol > 0).sort((a, b) => b.avg_buy - a.avg_buy);
        const sortedByAvgSell = [...activeBrokers].filter(b => b.net_vol < 0).sort((a, b) => a.avg_sell - b.avg_sell);

        const aggressiveHaka = sortedByAvgBuy.slice(0, 3).map(b => ({ code: b.code, avg: b.avg_buy, val: b.net_val }));
        const aggressiveHaki = sortedByAvgSell.slice(0, 3).map(b => ({ code: b.code, avg: b.avg_sell, val: b.net_val }));

        const smartAccumulation = activeBrokers
            .filter(b => b.net_vol > 0 && (b.status.includes('Bandar') || b.status.includes('Whale')))
            .sort((a, b) => b.net_val - a.net_val)
            .slice(0, 3)
            .map(b => ({ code: b.code, status: b.status, val: b.net_val, avg: b.avg_buy }));

        const panicSelling = activeBrokers
            .filter(b => b.net_vol < 0 && b.status.includes('Retail'))
            .sort((a, b) => a.net_val - b.net_val)
            .slice(0, 3)
            .map(b => ({ code: b.code, status: b.status, val: b.net_val, avg: b.avg_sell }));

        const analysisData = {
            action: data.action,
            bandar_avg_pl: data.bandar_avg_pl,
            retail_avg_pl: data.retail_avg_pl,
            foreign_flow: data.foreign_flow,
            top_accumulator: data.top_accumulator,
            top_distributor: data.top_distributor,
            infographic: {
                aggressive_haka: aggressiveHaka,
                aggressive_haki: aggressiveHaki,
                smart_accumulation: smartAccumulation,
                panic_selling: panicSelling
            },
            ...data.quant
        };

        res.json({
            success: true,
            data: {
                brokers,
                analysis: JSON.stringify(analysisData, null, 2)
            }
        });
    } catch (err) {
        console.error("Broksum error:", err.message);
        res.status(500).json({ success: false, error: "Gagal memuat data broksum" });
    }
};

// GET /api/brokers/intelligence?limit=20&page=1&sort_by=net_value&mode=accum&lookback_days=7&broker_status=Bandar,Whale
export const getBrokerIntelligence = async (req, res) => {
    try {
        const {
            limit = 20,
            page = 1,
            sort_by = "net_value",
            mode = "accum",
            lookback_days = 7,
            broker_status = "Bandar,Whale",
        } = req.query;

        const qs = new URLSearchParams({ limit, page, sort_by, mode, lookback_days, broker_status }).toString();
        const data = await fetchTrader(`/market-insight/broker-intelligence?${qs}`);

        if (!data) {
            return res.status(502).json({ success: false, error: "Upstream API tidak merespons" });
        }

        res.json({ success: true, data });
    } catch (err) {
        console.error("Broker intelligence error:", err.message);
        res.status(500).json({ success: false, error: "Gagal memuat data broker intelligence" });
    }
};
