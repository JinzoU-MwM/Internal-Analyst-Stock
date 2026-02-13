import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

/**
 * Normalize a ticker for the Indonesian market.
 * Appends .JK if no exchange suffix is present.
 */
function normalizeTicker(raw) {
    let t = raw.toUpperCase().trim();
    if (!t.includes(".")) t += ".JK";
    return t;
}

/**
 * GET /api/stocks/:ticker/fundamental
 *
 * Fetches fundamental data via Yahoo Finance quoteSummary.
 * Modules: summaryDetail, financialData, defaultKeyStatistics, assetProfile
 *
 * Returns a clean JSON object with professional fundamental metrics.
 */
/**
 * Fetch fundamental data (internal helper for controller & AI).
 */
export const getFundamentalStatsData = async (tickerRaw) => {
    const ticker = normalizeTicker(tickerRaw);

    const result = await yahooFinance.quoteSummary(ticker, {
        modules: [
            "summaryDetail",
            "financialData",
            "defaultKeyStatistics",
            "assetProfile",
        ],
    });

    const summary = result.summaryDetail ?? {};
    const financial = result.financialData ?? {};
    const keyStats = result.defaultKeyStatistics ?? {};
    const profile = result.assetProfile ?? {};

    // Check currency and convert if USD
    let currency = financial.financialCurrency || summary.currency || "IDR";
    let rate = 1;

    if (currency === "USD") {
        try {
            const quote = await yahooFinance.quote("USDIDR=X");
            if (quote && quote.regularMarketPrice) {
                rate = quote.regularMarketPrice;
                currency = "IDR"; // Converted
            }
        } catch (err) {
            console.error("[StockController] Failed to fetch USDIDR rate:", err.message);
            // Fallback: keep as USD if rate fails
        }
    }

    const convert = (val) => (val && rate !== 1 ? val * rate : val);

    return {
        ticker,

        // ── Company Profile ─────────────────────────────
        currency,
        sector: profile.sector ?? null,
        industry: profile.industry ?? null,
        longBusinessSummary: profile.longBusinessSummary ?? null,
        website: profile.website ?? null,
        fullTimeEmployees: profile.fullTimeEmployees ?? null,

        // ── Valuation ───────────────────────────────────
        marketCap: convert(summary.marketCap ?? null),
        enterpriseValue: convert(keyStats.enterpriseValue ?? null),
        peRatio: summary.trailingPE ?? null,
        forwardPE: summary.forwardPE ?? null,
        pbRatio: keyStats.priceToBook ?? null,
        pegRatio: keyStats.pegRatio ?? (summary.trailingPE && financial.earningsGrowth ? summary.trailingPE / (financial.earningsGrowth * 100) : null),

        // ── Profitability ───────────────────────────────
        roe: financial.returnOnEquity ?? null,
        roa: financial.returnOnAssets ?? null,
        profitMargin: keyStats.profitMargins ?? null,
        operatingMargin: financial.operatingMargins ?? null,
        grossMargin: financial.grossMargins ?? null,

        // ── Dividend ────────────────────────────────────
        dividendYield: summary.dividendYield ?? null,
        dividendRate: convert(summary.dividendRate ?? null),
        payoutRatio: summary.payoutRatio ?? null,

        // ── Financial Health ─────────────────────────────
        totalRevenue: convert(financial.totalRevenue ?? null),
        revenueGrowth: financial.revenueGrowth ?? null,
        earningsGrowth: financial.earningsGrowth ?? null,
        totalDebt: convert(financial.totalDebt ?? null),
        totalCash: convert(financial.totalCash ?? null),
        debtToEquity: financial.debtToEquity ?? null,
        currentRatio: financial.currentRatio ?? null,

        // ── Price Targets ───────────────────────────────
        currentPrice: convert(financial.currentPrice ?? null),
        targetHighPrice: convert(financial.targetHighPrice ?? null),
        targetLowPrice: convert(financial.targetLowPrice ?? null),
        targetMeanPrice: convert(financial.targetMeanPrice ?? null),
        recommendation: financial.recommendationKey ?? null,
        numberOfAnalysts: financial.numberOfAnalystOpinions ?? null,

        // ── Trading Info ────────────────────────────────
        fiftyTwoWeekHigh: convert(summary.fiftyTwoWeekHigh ?? null),
        fiftyTwoWeekLow: convert(summary.fiftyTwoWeekLow ?? null),
        fiftyDayAverage: convert(summary.fiftyDayAverage ?? null),
        twoHundredDayAverage: convert(summary.twoHundredDayAverage ?? null),
        beta: summary.beta ?? null,
        volume: summary.volume ?? null,
        averageVolume: summary.averageVolume ?? null,
    };
};

/**
 * GET /api/stocks/:ticker/fundamental
 */
export const getFundamentalStats = async (req, res) => {
    try {
        const data = await getFundamentalStatsData(req.params.ticker);
        return res.json({
            success: true,
            ticker: data.ticker,
            data,
        });
    } catch (error) {
        console.error(`[StockController] ${error.message}`);

        const status = error.message.includes("No fundamentals data")
            ? 404
            : 500;

        return res.status(status).json({
            success: false,
            error: `Failed to fetch fundamental data for "${req.params.ticker}": ${error.message}`,
        });
    }
};
