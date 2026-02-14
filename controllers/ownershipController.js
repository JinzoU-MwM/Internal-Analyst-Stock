/**
 * Ownership Controller — uses tradersaham.com API for rich IDX ownership data
 */

const TRADER_BASE = "https://api.tradersaham.com/api";

// Helper: fetch JSON from tradersaham with error handling
async function fetchTrader(path) {
    try {
        const res = await fetch(`${TRADER_BASE}${path}`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

// Strip .JK suffix for tradersaham (uses plain ticker)
function cleanTicker(ticker) {
    return (ticker || "").replace(/\.JK$/i, "").toUpperCase();
}

export const getOwnershipData = async (req, res) => {
    try {
        const rawTicker = req.query.ticker || req.params.ticker || "BBCA";
        const ticker = cleanTicker(rawTicker);

        // Fetch all endpoints in parallel
        const [profileData, currentData, countsData, ownershipData, balanceData] =
            await Promise.all([
                fetchTrader(`/shareholders/profile/${ticker}`),
                fetchTrader(`/shareholders/current?stock_code=${ticker}`),
                fetchTrader(`/shareholders/counts/${ticker}`),
                fetchTrader(`/ownership/stock/${ticker}?limit=12&v=7`),
                fetchTrader(`/balancepos/stock/${ticker}?limit=1&v=7`),
            ]);

        // ── 1. Major shareholders (from profile) ──
        const shareholders = (profileData?.shareholders || []).map((s) => ({
            name: s.shareholder_name,
            percentage: parseFloat(s.ownership_percentage) || 0,
            share_value: s.share_value || null,
            badges: s.badges || [],
            is_insider: s.is_insider || false,
        }));

        // ── 2. Current holders (from KSEI data) ──
        const currentHolders = (currentData?.data || []).map((h) => ({
            name: h.shareholder_name,
            shares: parseInt(h.total_shares) || 0,
            percentage: parseFloat(h.total_ownership) || 0,
            broker: h.broker_codes || null,
            account_holder: h.account_holder || null,
            date: h.date_collected || null,
        }));

        // ── 3. Executives (from profile) ──
        const executives = (profileData?.executives || []).map((e) => ({
            name: e.name,
            position: e.position,
            type: e.position_type,
        }));

        // ── 4. Balance position (investor breakdown: foreign/local/institutional/retail) ──
        const balance = balanceData?.data?.[0] || null;
        const investorBreakdown = balance
            ? {
                foreign_pct: parseFloat(balance.foreign_pct) || 0,
                local_pct: parseFloat(balance.local_pct) || 0,
                institutional_pct: parseFloat(balance.institutional_pct) || 0,
                retail_pct: parseFloat(balance.retail_pct) || 0,
                foreign_total: parseInt(balance.foreign_total) || 0,
                local_total: parseInt(balance.local_total) || 0,
                total_securities: parseInt(balance.total_securities) || 0,
                date: balance.date || null,
                // Detailed breakdown
                local_detail: {
                    insurance: parseInt(balance.local_is) || 0,
                    corporate: parseInt(balance.local_cp) || 0,
                    pension_fund: parseInt(balance.local_pf) || 0,
                    investment_bank: parseInt(balance.local_ib) || 0,
                    mutual_fund: parseInt(balance.local_mf) || 0,
                    individual: parseInt(balance.local_id) || 0,
                    securities: parseInt(balance.local_sc) || 0,
                    foundation: parseInt(balance.local_fd) || 0,
                    others: parseInt(balance.local_ot) || 0,
                },
                foreign_detail: {
                    insurance: parseInt(balance.foreign_is) || 0,
                    corporate: parseInt(balance.foreign_cp) || 0,
                    pension_fund: parseInt(balance.foreign_pf) || 0,
                    investment_bank: parseInt(balance.foreign_ib) || 0,
                    mutual_fund: parseInt(balance.foreign_mf) || 0,
                    individual: parseInt(balance.foreign_id) || 0,
                    securities: parseInt(balance.foreign_sc) || 0,
                    foundation: parseInt(balance.foreign_fd) || 0,
                    others: parseInt(balance.foreign_ot) || 0,
                },
            }
            : null;

        // ── 5. Ownership history (12-month trend) ──
        const ownershipHistory = (ownershipData?.data || []).map((d) => ({
            date: d.date,
            price: parseFloat(d.price) || 0,
            foreign_total: parseInt(d.foreign_total) || 0,
            local_total: parseInt(d.local_total) || 0,
            total_securities: parseInt(d.total_securities) || 0,
            foreign_pct:
                parseInt(d.total_securities) > 0
                    ? ((parseInt(d.foreign_total) / parseInt(d.total_securities)) * 100).toFixed(2)
                    : "0",
            local_pct:
                parseInt(d.total_securities) > 0
                    ? ((parseInt(d.local_total) / parseInt(d.total_securities)) * 100).toFixed(2)
                    : "0",
        }));

        // ── 6. Shareholder count history ──
        const shareholderCounts = (countsData?.history || []).map((h) => ({
            date: h.report_date,
            count: h.total_shareholders,
        }));

        // ── 7. Stats ──
        const stats = {
            total_securities: balance ? parseInt(balance.total_securities) || 0 : null,
            shareholder_count:
                shareholderCounts.length > 0
                    ? shareholderCounts[shareholderCounts.length - 1].count
                    : null,
            date_collected: currentData?.date_collected || null,
        };

        res.json({
            success: true,
            ticker,
            shareholders,
            current_holders: currentHolders,
            executives,
            investor_breakdown: investorBreakdown,
            ownership_history: ownershipHistory,
            shareholder_counts: shareholderCounts,
            stats,
        });
    } catch (err) {
        console.error("Ownership fetch error:", err.message);
        res.status(500).json({
            success: false,
            error: "Gagal mengambil data ownership",
        });
    }
};
