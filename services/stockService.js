import YahooFinance from "yahoo-finance2";
const yahooFinance = new YahooFinance();

/**
 * Fetch historical OHLCV data for a given ticker symbol.
 *
 * @param {string}  ticker  – Yahoo Finance ticker (e.g. "BBRI.JK")
 * @param {string}  period1 – Start date  (ISO string, e.g. "2025-01-01")
 * @param {string}  period2 – End date    (ISO string, e.g. "2026-01-01")
 * @returns {Promise<Array<{date, open, high, low, close, volume}>>}
 */
export const getHistoricalData = async (ticker, period1, period2) => {
    try {
        const result = await yahooFinance.chart(ticker, {
            period1,
            period2,
            interval: "1d",
        });

        // result.quotes contains the OHLCV candles
        const quotes = result.quotes ?? [];

        return quotes.map((q) => ({
            date: q.date,
            open: q.open,
            high: q.high,
            low: q.low,
            close: q.close,
            volume: q.volume,
        }));
    } catch (error) {
        throw new Error(
            `Failed to fetch historical data for "${ticker}": ${error.message}`
        );
    }
};
