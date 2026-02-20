import { Router } from "express";
import YahooFinance from "yahoo-finance2";
import {
    SMA,
    EMA,
    RSI,
    MACD,
    BollingerBands,
    ATR,
    ADX,
    Stochastic,
    WilliamsR,
    CCI,
    OBV,
    MFI,
} from "technicalindicators";

const router = Router();

// Helper to format date for lightweight-charts (YYYY-MM-DD)
const formatDate = (date) => {
    if (!date) return null;
    if (typeof date === "string") {
        return date.split("T")[0];
    }
    if (date instanceof Date) {
        return date.toISOString().split("T")[0];
    }
    return String(date).split("T")[0];
};

/**
 * Generate detailed technical analysis with signals and recommendations.
 */
function generateAnalysis(df, ticker) {
    if (df.length < 50) return { error: "Insufficient data for analysis" };

    const latest = df[df.length - 1];
    const prev = df[df.length - 2];
    const price = latest.close;

    const analysis = {
        ticker,
        timestamp: new Date().toISOString(),
        price: Math.round(price * 100) / 100,
        signals: {},
        summary: {},
        recommendations: [],
    };

    // ═══════════════════════════════════════════════════════════════
    // TREND ANALYSIS
    // ═══════════════════════════════════════════════════════════════
    const trendSignals = [];
    let trendScore = 0;

    const sma20 = latest.sma20;
    const sma50 = latest.sma50;
    const sma200 = latest.sma200;

    if (sma20) {
        if (price > sma20) {
            trendSignals.push(`Price above SMA-20 (${sma20.toFixed(2)}) — Short-term bullish`);
            trendScore += 1;
        } else {
            trendSignals.push(`Price below SMA-20 (${sma20.toFixed(2)}) — Short-term bearish`);
            trendScore -= 1;
        }
    }

    if (sma50) {
        if (price > sma50) {
            trendSignals.push(`Price above SMA-50 (${sma50.toFixed(2)}) — Medium-term bullish`);
            trendScore += 1;
        } else {
            trendSignals.push(`Price below SMA-50 (${sma50.toFixed(2)}) — Medium-term bearish`);
            trendScore -= 1;
        }
    }

    if (sma200) {
        if (price > sma200) {
            trendSignals.push(`Price above SMA-200 (${sma200.toFixed(2)}) — Long-term uptrend`);
            trendScore += 2;
        } else {
            trendSignals.push(`Price below SMA-200 (${sma200.toFixed(2)}) — Long-term downtrend`);
            trendScore -= 2;
        }
    }

    // Golden/Death Cross
    if (sma50 && sma200 && prev.sma50 && prev.sma200) {
        if (sma50 > sma200 && prev.sma50 <= prev.sma200) {
            trendSignals.push("⚠️ GOLDEN CROSS detected — Strong bullish signal");
            trendScore += 3;
        } else if (sma50 < sma200 && prev.sma50 >= prev.sma200) {
            trendSignals.push("⚠️ DEATH CROSS detected — Strong bearish signal");
            trendScore -= 3;
        }
    }

    analysis.signals.trend = {
        score: trendScore,
        signals: trendSignals,
        direction: trendScore > 0 ? "bullish" : trendScore < 0 ? "bearish" : "neutral",
    };

    // ═══════════════════════════════════════════════════════════════
    // MOMENTUM ANALYSIS
    // ═══════════════════════════════════════════════════════════════
    const momentumSignals = [];
    let momentumScore = 0;

    const rsi = latest.rsi;
    const prevRsi = prev.rsi;

    if (rsi != null) {
        if (rsi > 70) {
            momentumSignals.push(`RSI (${rsi.toFixed(1)}) — OVERBOUGHT zone, potential reversal`);
            momentumScore -= 2;
        } else if (rsi < 30) {
            momentumSignals.push(`RSI (${rsi.toFixed(1)}) — OVERSOLD zone, potential bounce`);
            momentumScore += 2;
        } else if (rsi > 60) {
            momentumSignals.push(`RSI (${rsi.toFixed(1)}) — Bullish momentum`);
            momentumScore += 1;
        } else if (rsi < 40) {
            momentumSignals.push(`RSI (${rsi.toFixed(1)}) — Bearish momentum`);
            momentumScore -= 1;
        } else {
            momentumSignals.push(`RSI (${rsi.toFixed(1)}) — Neutral zone`);
        }

        // RSI Divergence
        if (prevRsi != null) {
            if (price > prev.close && rsi < prevRsi) {
                momentumSignals.push("⚠️ Bearish RSI divergence detected");
                momentumScore -= 1;
            } else if (price < prev.close && rsi > prevRsi) {
                momentumSignals.push("⚠️ Bullish RSI divergence detected");
                momentumScore += 1;
            }
        }
    }

    // MACD Analysis
    const macd = latest.macd;
    const macdSignal = latest.macdSignal;
    const macdHist = latest.macdHist;
    const prevMacdHist = prev.macdHist;

    if (macd != null && macdSignal != null) {
        if (macd > macdSignal) {
            momentumSignals.push("MACD above signal line — Bullish");
            momentumScore += 1;
        } else {
            momentumSignals.push("MACD below signal line — Bearish");
            momentumScore -= 1;
        }

        // MACD Crossover
        if (prevMacdHist != null && macdHist != null) {
            if (prevMacdHist < 0 && macdHist > 0) {
                momentumSignals.push("⚠️ BULLISH MACD crossover — Buy signal");
                momentumScore += 2;
            } else if (prevMacdHist > 0 && macdHist < 0) {
                momentumSignals.push("⚠️ BEARISH MACD crossover — Sell signal");
                momentumScore -= 2;
            }
        }
    }

    analysis.signals.momentum = {
        score: momentumScore,
        signals: momentumSignals,
        direction: momentumScore > 0 ? "bullish" : momentumScore < 0 ? "bearish" : "neutral",
    };

    // ═══════════════════════════════════════════════════════════════
    // VOLATILITY ANALYSIS
    // ═══════════════════════════════════════════════════════════════
    const volatilitySignals = [];
    let volatilityScore = 0;

    const bbUpper = latest.bbUpper;
    const bbLower = latest.bbLower;

    if (bbUpper != null && bbLower != null) {
        const bbRange = bbUpper - bbLower;
        const bbPosition = (price - bbLower) / bbRange;

        if (price > bbUpper) {
            volatilitySignals.push("Price above upper Bollinger Band — Overextended");
            volatilityScore -= 1;
        } else if (price < bbLower) {
            volatilitySignals.push("Price below lower Bollinger Band — Oversold");
            volatilityScore += 1;
        } else {
            volatilitySignals.push(`Price within Bollinger Bands (${(bbPosition * 100).toFixed(0)}% position)`);
        }
    }

    // ATR Analysis
    const atr = latest.atr;
    if (atr != null) {
        const atrPct = (atr / price) * 100;
        if (atrPct > 3) {
            volatilitySignals.push(`High volatility — ATR ${atrPct.toFixed(2)}% of price`);
        } else if (atrPct < 1) {
            volatilitySignals.push(`Low volatility — ATR ${atrPct.toFixed(2)}% of price`);
        } else {
            volatilitySignals.push(`Normal volatility — ATR ${atrPct.toFixed(2)}% of price`);
        }
    }

    analysis.signals.volatility = {
        score: volatilityScore,
        signals: volatilitySignals,
        direction: volatilityScore < 0 ? "high_volatility" : volatilityScore > 0 ? "low_volatility" : "normal",
    };

    // ═══════════════════════════════════════════════════════════════
    // VOLUME ANALYSIS
    // ═══════════════════════════════════════════════════════════════
    const volumeSignals = [];
    let volumeScore = 0;

    const volume = latest.volume;
    const avgVolume = df.slice(-20).reduce((sum, d) => sum + (d.volume || 0), 0) / 20;

    if (avgVolume > 0) {
        const volRatio = volume / avgVolume;

        if (volRatio > 2) {
            volumeSignals.push(`Volume ${volRatio.toFixed(1)}x average — Unusually high activity`);
            volumeScore += 2;
        } else if (volRatio > 1.5) {
            volumeSignals.push(`Volume ${volRatio.toFixed(1)}x average — Above normal`);
            volumeScore += 1;
        } else if (volRatio < 0.5) {
            volumeSignals.push(`Volume ${volRatio.toFixed(1)}x average — Low activity`);
            volumeScore -= 1;
        } else {
            volumeSignals.push(`Volume ${volRatio.toFixed(1)}x average — Normal`);
        }

        // Volume + Price action
        const priceChange = price - prev.close;
        if (priceChange > 0 && volRatio > 1.2) {
            volumeSignals.push("Rising price with high volume — Bullish confirmation");
            volumeScore += 1;
        } else if (priceChange < 0 && volRatio > 1.2) {
            volumeSignals.push("Falling price with high volume — Bearish confirmation");
            volumeScore -= 1;
        }
    }

    analysis.signals.volume = {
        score: volumeScore,
        signals: volumeSignals,
        direction: volumeScore > 0 ? "bullish" : volumeScore < 0 ? "bearish" : "neutral",
    };

    // ═══════════════════════════════════════════════════════════════
    // TREND STRENGTH (ADX)
    // ═══════════════════════════════════════════════════════════════
    const adx = latest.adx;
    const adxSignals = [];
    let adxScore = 0;

    if (adx != null) {
        if (adx > 40) {
            adxSignals.push(`ADX (${adx.toFixed(1)}) — Very strong trend`);
            adxScore += 2;
        } else if (adx > 25) {
            adxSignals.push(`ADX (${adx.toFixed(1)}) — Strong trend`);
            adxScore += 1;
        } else if (adx > 20) {
            adxSignals.push(`ADX (${adx.toFixed(1)}) — Developing trend`);
        } else {
            adxSignals.push(`ADX (${adx.toFixed(1)}) — Weak/no trend (ranging)`);
            adxScore -= 1;
        }
    }

    analysis.signals.trend_strength = {
        score: adxScore,
        signals: adxSignals,
        direction: adxScore > 1 ? "strong" : adxScore < 0 ? "weak" : "moderate",
    };

    // ═══════════════════════════════════════════════════════════════
    // OVERALL SUMMARY & RECOMMENDATIONS
    // ═══════════════════════════════════════════════════════════════
    const totalScore = (trendScore + momentumScore + volumeScore) / 3;

    let overall, action;
    if (totalScore >= 2) {
        overall = "STRONG BULLISH";
        action = "BUY";
    } else if (totalScore >= 1) {
        overall = "BULLISH";
        action = "BUY / HOLD";
    } else if (totalScore >= 0.5) {
        overall = "SLIGHTLY BULLISH";
        action = "HOLD / ACCUMULATE";
    } else if (totalScore <= -2) {
        overall = "STRONG BEARISH";
        action = "SELL";
    } else if (totalScore <= -1) {
        overall = "BEARISH";
        action = "SELL / AVOID";
    } else if (totalScore <= -0.5) {
        overall = "SLIGHTLY BEARISH";
        action = "HOLD / REDUCE";
    } else {
        overall = "NEUTRAL";
        action = "HOLD / WAIT";
    }

    analysis.summary = {
        overall,
        action,
        score: Math.round(totalScore * 100) / 100,
        confidence: Math.abs(totalScore) > 1.5 ? "high" : Math.abs(totalScore) > 0.5 ? "medium" : "low",
    };

    // Generate recommendations
    if (action.includes("SELL")) {
        analysis.recommendations.push({
            type: "warning",
            text: `Consider reducing positions or setting tight stop-losses for ${ticker}`,
        });
    } else if (action.includes("BUY")) {
        analysis.recommendations.push({
            type: "opportunity",
            text: `${ticker} shows bullish signals — consider accumulating on pullbacks`,
        });
    }

    if (bbLower != null && sma20 != null) {
        analysis.recommendations.push({
            type: "info",
            text: `Entry zone: ${Math.round(bbLower)} - ${Math.round(sma20)}`,
        });
    }

    if (bbUpper != null) {
        analysis.recommendations.push({
            type: "info",
            text: `Resistance zone: ${Math.round(bbUpper)} - ${Math.round(bbUpper * 1.02)}`,
        });
    }

    if (atr != null) {
        const stopLoss = price - atr * 2;
        analysis.recommendations.push({
            type: "risk",
            text: `Suggested stop-loss: ${Math.round(stopLoss)} (2x ATR below current price)`,
        });
    }

    return analysis;
}

/**
 * GET /api/ta?ticker=BBRI
 * Technical Analysis endpoint with comprehensive indicators and signals.
 */
router.get("/", async (req, res) => {
    try {
        let { ticker } = req.query;

        if (!ticker) {
            return res.status(400).json({ success: false, error: "Ticker parameter required" });
        }

        ticker = ticker.toUpperCase();
        if (!ticker.includes(".")) {
            ticker += ".JK";
        }

        // Fetch 1 year of historical data
        const yahooFinance = new YahooFinance();
        const end = new Date();
        const start = new Date();
        start.setFullYear(start.getFullYear() - 1);

        const result = await yahooFinance.chart(ticker, {
            period1: start.toISOString().split("T")[0],
            period2: end.toISOString().split("T")[0],
            interval: "1d",
        });

        const quotes = result.quotes || [];
        if (quotes.length === 0) {
            return res.status(404).json({ success: false, error: `No data found for ${ticker}` });
        }

        // Build OHLCV arrays for indicators
        const closes = quotes.map((q) => q.close).filter((v) => v != null);
        const highs = quotes.map((q) => q.high).filter((v) => v != null);
        const lows = quotes.map((q) => q.low).filter((v) => v != null);
        const volumes = quotes.map((q) => q.volume).filter((v) => v != null);

        // Calculate indicators
        const sma20 = SMA.calculate({ period: 20, values: closes });
        const sma50 = SMA.calculate({ period: 50, values: closes });
        const sma200 = SMA.calculate({ period: 200, values: closes });
        const ema12 = EMA.calculate({ period: 12, values: closes });
        const ema26 = EMA.calculate({ period: 26, values: closes });
        const rsi = RSI.calculate({ period: 14, values: closes });
        const atr = ATR.calculate({ period: 14, high: highs, low: lows, close: closes });
        const adx = ADX.calculate({ period: 14, high: highs, low: lows, close: closes });

        // MACD
        const macd = MACD.calculate({
            values: closes,
            fastPeriod: 12,
            slowPeriod: 26,
            signalPeriod: 9,
            SimpleMAOscillator: false,
            SimpleMASignal: false,
        });

        // Bollinger Bands
        const bb = BollingerBands.calculate({
            period: 20,
            values: closes,
            stdDev: 2,
        });

        // Build enriched data array
        const offsetSMA20 = closes.length - sma20.length;
        const offsetSMA50 = closes.length - sma50.length;
        const offsetSMA200 = closes.length - sma200.length;
        const offsetEMA12 = closes.length - ema12.length;
        const offsetEMA26 = closes.length - ema26.length;
        const offsetRSI = closes.length - rsi.length;
        const offsetATR = closes.length - atr.length;
        const offsetADX = closes.length - adx.length;
        const offsetMACD = closes.length - macd.length;
        const offsetBB = closes.length - bb.length;

        const df = quotes.map((q, i) => {
            const idx = i;
            return {
                date: q.date,
                open: q.open,
                high: q.high,
                low: q.low,
                close: q.close,
                volume: q.volume,
                sma20: idx >= offsetSMA20 ? sma20[idx - offsetSMA20] : null,
                sma50: idx >= offsetSMA50 ? sma50[idx - offsetSMA50] : null,
                sma200: idx >= offsetSMA200 ? sma200[idx - offsetSMA200] : null,
                ema12: idx >= offsetEMA12 ? ema12[idx - offsetEMA12] : null,
                ema26: idx >= offsetEMA26 ? ema26[idx - offsetEMA26] : null,
                rsi: idx >= offsetRSI ? rsi[idx - offsetRSI] : null,
                atr: idx >= offsetATR ? atr[idx - offsetATR] : null,
                adx: idx >= offsetADX ? adx[idx - offsetADX]?.adx : null,
                macd: idx >= offsetMACD ? macd[idx - offsetMACD]?.MACD : null,
                macdSignal: idx >= offsetMACD ? macd[idx - offsetMACD]?.signal : null,
                macdHist: idx >= offsetMACD ? macd[idx - offsetMACD]?.histogram : null,
                bbUpper: idx >= offsetBB ? bb[idx - offsetBB]?.upper : null,
                bbMiddle: idx >= offsetBB ? bb[idx - offsetBB]?.middle : null,
                bbLower: idx >= offsetBB ? bb[idx - offsetBB]?.lower : null,
            };
        });

        // Prepare OHLCV for chart
        const ohlcv = df.map((d) => ({
            time: formatDate(d.date),
            open: Math.round(d.open * 100) / 100,
            high: Math.round(d.high * 100) / 100,
            low: Math.round(d.low * 100) / 100,
            close: Math.round(d.close * 100) / 100,
            volume: d.volume || 0,
        }));

        // Prepare indicators for chart
        const indicators = {
            sma: df.map((d) => ({
                time: formatDate(d.date),
                sma_20: d.sma20 ? Math.round(d.sma20 * 100) / 100 : null,
                sma_50: d.sma50 ? Math.round(d.sma50 * 100) / 100 : null,
                sma_200: d.sma200 ? Math.round(d.sma200 * 100) / 100 : null,
            })),
            ema: df.map((d) => ({
                time: formatDate(d.date),
                ema_12: d.ema12 ? Math.round(d.ema12 * 100) / 100 : null,
                ema_26: d.ema26 ? Math.round(d.ema26 * 100) / 100 : null,
            })),
            bb: df.map((d) => ({
                time: formatDate(d.date),
                upper: d.bbUpper ? Math.round(d.bbUpper * 100) / 100 : null,
                middle: d.bbMiddle ? Math.round(d.bbMiddle * 100) / 100 : null,
                lower: d.bbLower ? Math.round(d.bbLower * 100) / 100 : null,
            })),
            rsi: df.map((d) => ({
                time: formatDate(d.date),
                value: d.rsi ? Math.round(d.rsi * 100) / 100 : null,
            })),
            macd: df.map((d) => ({
                time: formatDate(d.date),
                macd: d.macd ? Math.round(d.macd * 10000) / 10000 : null,
                signal: d.macdSignal ? Math.round(d.macdSignal * 10000) / 10000 : null,
                histogram: d.macdHist ? Math.round(d.macdHist * 10000) / 10000 : null,
            })),
        };

        // Latest values summary
        const latest = df[df.length - 1];
        const prev = df[df.length - 2];
        const latestSummary = {
            price: Math.round(latest.close * 100) / 100,
            change: Math.round((latest.close - prev.close) * 100) / 100,
            change_pct: Math.round(((latest.close - prev.close) / prev.close) * 100 * 100) / 100,
            volume: latest.volume || 0,
            sma_20: latest.sma20 ? Math.round(latest.sma20 * 100) / 100 : null,
            sma_50: latest.sma50 ? Math.round(latest.sma50 * 100) / 100 : null,
            sma_200: latest.sma200 ? Math.round(latest.sma200 * 100) / 100 : null,
            rsi: latest.rsi ? Math.round(latest.rsi * 100) / 100 : null,
            macd: latest.macd ? Math.round(latest.macd * 10000) / 10000 : null,
            macd_signal: latest.macdSignal ? Math.round(latest.macdSignal * 10000) / 10000 : null,
            bb_upper: latest.bbUpper ? Math.round(latest.bbUpper * 100) / 100 : null,
            bb_lower: latest.bbLower ? Math.round(latest.bbLower * 100) / 100 : null,
            atr: latest.atr ? Math.round(latest.atr * 100) / 100 : null,
            adx: latest.adx ? Math.round(latest.adx * 100) / 100 : null,
        };

        // Generate analysis
        const analysis = generateAnalysis(df, ticker);

        res.json({
            success: true,
            ticker,
            count: ohlcv.length,
            data: ohlcv,
            indicators,
            latest: latestSummary,
            analysis,
        });
    } catch (error) {
        console.error("[TA] Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
