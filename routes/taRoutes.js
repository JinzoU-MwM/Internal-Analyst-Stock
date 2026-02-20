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
 * Generate detailed technical analysis with signals and recommendations (Indonesian).
 */
function generateAnalysis(df, ticker) {
    if (df.length < 50) return { error: "Data tidak cukup untuk analisis" };

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
    // ANALISIS TREND
    // ═══════════════════════════════════════════════════════════════
    const trendSignals = [];
    let trendScore = 0;

    const sma20 = latest.sma20;
    const sma50 = latest.sma50;
    const sma200 = latest.sma200;

    if (sma20) {
        if (price > sma20) {
            trendSignals.push(`Harga di atas SMA-20 (${sma20.toFixed(2)}) — Bullish jangka pendek`);
            trendScore += 1;
        } else {
            trendSignals.push(`Harga di bawah SMA-20 (${sma20.toFixed(2)}) — Bearish jangka pendek`);
            trendScore -= 1;
        }
    }

    if (sma50) {
        if (price > sma50) {
            trendSignals.push(`Harga di atas SMA-50 (${sma50.toFixed(2)}) — Bullish jangka menengah`);
            trendScore += 1;
        } else {
            trendSignals.push(`Harga di bawah SMA-50 (${sma50.toFixed(2)}) — Bearish jangka menengah`);
            trendScore -= 1;
        }
    }

    if (sma200) {
        if (price > sma200) {
            trendSignals.push(`Harga di atas SMA-200 (${sma200.toFixed(2)}) — Uptrend jangka panjang`);
            trendScore += 2;
        } else {
            trendSignals.push(`Harga di bawah SMA-200 (${sma200.toFixed(2)}) — Downtrend jangka panjang`);
            trendScore -= 2;
        }
    }

    // Golden/Death Cross
    if (sma50 && sma200 && prev.sma50 && prev.sma200) {
        if (sma50 > sma200 && prev.sma50 <= prev.sma200) {
            trendSignals.push("⚠️ GOLDEN CROSS terdeteksi — Sinyal bullish kuat");
            trendScore += 3;
        } else if (sma50 < sma200 && prev.sma50 >= prev.sma200) {
            trendSignals.push("⚠️ DEATH CROSS terdeteksi — Sinyal bearish kuat");
            trendScore -= 3;
        }
    }

    analysis.signals.trend = {
        score: trendScore,
        signals: trendSignals,
        direction: trendScore > 0 ? "bullish" : trendScore < 0 ? "bearish" : "netral",
    };

    // ═══════════════════════════════════════════════════════════════
    // ANALISIS MOMENTUM
    // ═══════════════════════════════════════════════════════════════
    const momentumSignals = [];
    let momentumScore = 0;

    const rsi = latest.rsi;
    const prevRsi = prev.rsi;

    if (rsi != null) {
        if (rsi > 70) {
            momentumSignals.push(`RSI (${rsi.toFixed(1)}) — Zona OVERBOUGHT, potensi reversal`);
            momentumScore -= 2;
        } else if (rsi < 30) {
            momentumSignals.push(`RSI (${rsi.toFixed(1)}) — Zona OVERSOLD, potensi bounce`);
            momentumScore += 2;
        } else if (rsi > 60) {
            momentumSignals.push(`RSI (${rsi.toFixed(1)}) — Momentum bullish`);
            momentumScore += 1;
        } else if (rsi < 40) {
            momentumSignals.push(`RSI (${rsi.toFixed(1)}) — Momentum bearish`);
            momentumScore -= 1;
        } else {
            momentumSignals.push(`RSI (${rsi.toFixed(1)}) — Zona netral`);
        }

        // RSI Divergence
        if (prevRsi != null) {
            if (price > prev.close && rsi < prevRsi) {
                momentumSignals.push("⚠️ Divergence bearish RSI terdeteksi");
                momentumScore -= 1;
            } else if (price < prev.close && rsi > prevRsi) {
                momentumSignals.push("⚠️ Divergence bullish RSI terdeteksi");
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
            momentumSignals.push("MACD di atas signal line — Bullish");
            momentumScore += 1;
        } else {
            momentumSignals.push("MACD di bawah signal line — Bearish");
            momentumScore -= 1;
        }

        // MACD Crossover
        if (prevMacdHist != null && macdHist != null) {
            if (prevMacdHist < 0 && macdHist > 0) {
                momentumSignals.push("⚠️ Crossover MACD BULLISH — Sinyal beli");
                momentumScore += 2;
            } else if (prevMacdHist > 0 && macdHist < 0) {
                momentumSignals.push("⚠️ Crossover MACD BEARISH — Sinyal jual");
                momentumScore -= 2;
            }
        }
    }

    analysis.signals.momentum = {
        score: momentumScore,
        signals: momentumSignals,
        direction: momentumScore > 0 ? "bullish" : momentumScore < 0 ? "bearish" : "netral",
    };

    // ═══════════════════════════════════════════════════════════════
    // ANALISIS VOLATILITAS
    // ═══════════════════════════════════════════════════════════════
    const volatilitySignals = [];
    let volatilityScore = 0;

    const bbUpper = latest.bbUpper;
    const bbLower = latest.bbLower;

    if (bbUpper != null && bbLower != null) {
        const bbRange = bbUpper - bbLower;
        const bbPosition = (price - bbLower) / bbRange;

        if (price > bbUpper) {
            volatilitySignals.push("Harga di atas Bollinger Band atas — Overextended");
            volatilityScore -= 1;
        } else if (price < bbLower) {
            volatilitySignals.push("Harga di bawah Bollinger Band bawah — Oversold");
            volatilityScore += 1;
        } else {
            volatilitySignals.push(`Harga dalam Bollinger Bands (posisi ${(bbPosition * 100).toFixed(0)}%)`);
        }
    }

    // ATR Analysis
    const atr = latest.atr;
    if (atr != null) {
        const atrPct = (atr / price) * 100;
        if (atrPct > 3) {
            volatilitySignals.push(`Volatilitas tinggi — ATR ${atrPct.toFixed(2)}% dari harga`);
        } else if (atrPct < 1) {
            volatilitySignals.push(`Volatilitas rendah — ATR ${atrPct.toFixed(2)}% dari harga`);
        } else {
            volatilitySignals.push(`Volatilitas normal — ATR ${atrPct.toFixed(2)}% dari harga`);
        }
    }

    analysis.signals.volatility = {
        score: volatilityScore,
        signals: volatilitySignals,
        direction: volatilityScore < 0 ? "volatilitas_tinggi" : volatilityScore > 0 ? "volatilitas_rendah" : "normal",
    };

    // ═══════════════════════════════════════════════════════════════
    // ANALISIS VOLUME
    // ═══════════════════════════════════════════════════════════════
    const volumeSignals = [];
    let volumeScore = 0;

    const volume = latest.volume;
    const avgVolume = df.slice(-20).reduce((sum, d) => sum + (d.volume || 0), 0) / 20;

    if (avgVolume > 0) {
        const volRatio = volume / avgVolume;

        if (volRatio > 2) {
            volumeSignals.push(`Volume ${volRatio.toFixed(1)}x rata-rata — Aktivitas sangat tinggi`);
            volumeScore += 2;
        } else if (volRatio > 1.5) {
            volumeSignals.push(`Volume ${volRatio.toFixed(1)}x rata-rata — Di atas normal`);
            volumeScore += 1;
        } else if (volRatio < 0.5) {
            volumeSignals.push(`Volume ${volRatio.toFixed(1)}x rata-rata — Aktivitas rendah`);
            volumeScore -= 1;
        } else {
            volumeSignals.push(`Volume ${volRatio.toFixed(1)}x rata-rata — Normal`);
        }

        // Volume + Price action
        const priceChange = price - prev.close;
        if (priceChange > 0 && volRatio > 1.2) {
            volumeSignals.push("Harga naik dengan volume tinggi — Konfirmasi bullish");
            volumeScore += 1;
        } else if (priceChange < 0 && volRatio > 1.2) {
            volumeSignals.push("Harga turun dengan volume tinggi — Konfirmasi bearish");
            volumeScore -= 1;
        }
    }

    analysis.signals.volume = {
        score: volumeScore,
        signals: volumeSignals,
        direction: volumeScore > 0 ? "bullish" : volumeScore < 0 ? "bearish" : "netral",
    };

    // ═══════════════════════════════════════════════════════════════
    // KEKUATAN TREND (ADX)
    // ═══════════════════════════════════════════════════════════════
    const adx = latest.adx;
    const adxSignals = [];
    let adxScore = 0;

    if (adx != null) {
        if (adx > 40) {
            adxSignals.push(`ADX (${adx.toFixed(1)}) — Trend sangat kuat`);
            adxScore += 2;
        } else if (adx > 25) {
            adxSignals.push(`ADX (${adx.toFixed(1)}) — Trend kuat`);
            adxScore += 1;
        } else if (adx > 20) {
            adxSignals.push(`ADX (${adx.toFixed(1)}) — Trend berkembang`);
        } else {
            adxSignals.push(`ADX (${adx.toFixed(1)}) — Trend lemah/sideways`);
            adxScore -= 1;
        }
    }

    analysis.signals.trend_strength = {
        score: adxScore,
        signals: adxSignals,
        direction: adxScore > 1 ? "kuat" : adxScore < 0 ? "lemah" : "sedang",
    };

    // ═══════════════════════════════════════════════════════════════
    // RINGKASAN & REKOMENDASI
    // ═══════════════════════════════════════════════════════════════
    const totalScore = (trendScore + momentumScore + volumeScore) / 3;

    let overall, action;
    if (totalScore >= 2) {
        overall = "SANGAT BULLISH";
        action = "BELI";
    } else if (totalScore >= 1) {
        overall = "BULLISH";
        action = "BELI / TAHAN";
    } else if (totalScore >= 0.5) {
        overall = "CENDERUNG BULLISH";
        action = "TAHAN / AKUMULASI";
    } else if (totalScore <= -2) {
        overall = "SANGAT BEARISH";
        action = "JUAL";
    } else if (totalScore <= -1) {
        overall = "BEARISH";
        action = "JUAL / HINDARI";
    } else if (totalScore <= -0.5) {
        overall = "CENDERUNG BEARISH";
        action = "TAHAN / KURANGI";
    } else {
        overall = "NETRAL";
        action = "TAHAN / TUNGGU";
    }

    analysis.summary = {
        overall,
        action,
        score: Math.round(totalScore * 100) / 100,
        confidence: Math.abs(totalScore) > 1.5 ? "tinggi" : Math.abs(totalScore) > 0.5 ? "sedang" : "rendah",
    };

    // Generate rekomendasi
    if (action.includes("JUAL")) {
        analysis.recommendations.push({
            type: "warning",
            text: `Pertimbangkan untuk mengurangi posisi atau pasang stop-loss ketat untuk ${ticker}`,
        });
    } else if (action.includes("BELI")) {
        analysis.recommendations.push({
            type: "opportunity",
            text: `${ticker} menunjukkan sinyal bullish — pertimbangkan akumulasi saat pullback`,
        });
    }

    if (bbLower != null && sma20 != null) {
        analysis.recommendations.push({
            type: "info",
            text: `Zona entry: ${Math.round(bbLower)} - ${Math.round(sma20)}`,
        });
    }

    if (bbUpper != null) {
        analysis.recommendations.push({
            type: "info",
            text: `Zona resistance: ${Math.round(bbUpper)} - ${Math.round(bbUpper * 1.02)}`,
        });
    }

    if (atr != null) {
        const stopLoss = price - atr * 2;
        analysis.recommendations.push({
            type: "risk",
            text: `Stop-loss disarankan: ${Math.round(stopLoss)} (2x ATR di bawah harga saat ini)`,
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
