import { GoogleGenerativeAI } from "@google/generative-ai";
import { cache } from "../utils/cache.js";
import { getHistoricalData } from "../services/stockService.js";
import { getFundamentalStatsData } from "../controllers/stockController.js"; // We need to export a helper from stockController

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/** AI insight cache TTL: 30 minutes */
const AI_CACHE_TTL = 1800;

/**
 * POST /api/ai-insight
 * Generate an AI-powered market insight for a given ticker.
 *
 * Body: { ticker: string, price?: { open, high, low, close } }
 *
 * Cached by ticker for 30 minutes to avoid redundant Gemini API calls.
 */
export const generateInsight = async (req, res) => {
    try {
        const { ticker } = req.body;
        let { price } = req.body;

        if (!ticker) {
            return res
                .status(400)
                .json({ success: false, error: "Ticker is required" });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res
                .status(500)
                .json({ success: false, error: "GEMINI_API_KEY is not configured" });
        }

        // Fetch price if missing
        if (!price) {
            try {
                const data = await getHistoricalData(ticker);
                if (data && data.length > 0) {
                    const latest = data[data.length - 1];
                    price = {
                        open: latest.open,
                        high: latest.high,
                        low: latest.low,
                        close: latest.close,
                        volume: latest.volume
                    };
                }
            } catch (err) {
                console.error("[AI] Failed to fetch price for insight:", err.message);
            }
        }

        // ── Check cache ───────────────────────────────────
        const cacheKey = `ai_insight_${ticker.toUpperCase()}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return res.json({ ...cached, fromCache: true });
        }

        // ── Build prompt ──────────────────────────────────
        let priceContext = "";
        if (price) {
            priceContext = `\nData harga terakhir (Real-time/Latest Close):\n- Open: ${price.open}\n- High: ${price.high}\n- Low: ${price.low}\n- Close: ${price.close}\n- Volume: ${price.volume}`;
        } else {
            priceContext = "\n(Data harga terkini tidak tersedia, gunakan pengetahuan umum jika valid, namun berikan disclaimer)";
        }

        const prompt = `Kamu adalah seorang analis saham senior di pasar modal Indonesia (IDX). Berikan analisis profesional untuk saham ${ticker}.
${priceContext}

Gunakan format berikut dengan Markdown yang rapi:

## 📊 Ringkasan Analisis ${ticker}

### Sentimen Pasar
(Jelaskan sentimen saat ini: Bullish / Bearish / Netral, beserta alasan singkat)

### Level Support & Resistance
(Sebutkan level-level kunci dalam bentuk tabel atau bullet point)

### Indikator Teknikal
(Berikan insight berdasarkan pola candlestick, volume, atau indikator populer seperti RSI, MACD jika relevan)

### 🎯 Rekomendasi & Aksi
(Berikan rekomendasi BUY/SELL/HOLD dengan target harga dan stop loss)

### ⚠️ Risiko
(Sebutkan faktor risiko yang perlu diperhatikan)

Jawab sepenuhnya dalam Bahasa Indonesia yang profesional. Gunakan angka dalam format Rupiah (tanpa desimal). Buat analisis yang ringkas, padat, dan actionable.`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const response = {
            success: true,
            ticker: ticker.toUpperCase(),
            insight: text,
        };

        // ── Store in cache ────────────────────────────────
        cache.set(cacheKey, response, AI_CACHE_TTL);

        return res.json({ ...response, fromCache: false });
    } catch (error) {
        console.error(`[AI Controller] ${error.message}`);
        return res.status(500).json({
            success: false,
            error: "Failed to generate AI insight",
        });
    }
};

/**
 * POST /api/ai-insight/fundamental
 * Generate an AI-powered fundamental insight for a given ticker.
 *
 * Body: { ticker: string, fundamentalData?: object }
 *
 * Cached by ticker for 30 minutes.
 */
export const generateFundamentalInsight = async (req, res) => {
    try {
        const { ticker } = req.body;
        let { fundamentalData } = req.body;

        if (!ticker) {
            return res
                .status(400)
                .json({ success: false, error: "Ticker is required" });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res
                .status(500)
                .json({ success: false, error: "GEMINI_API_KEY is not configured" });
        }

        // Fetch fundamentals if missing
        if (!fundamentalData) {
            try {
                // We need to fetch it using the controller logic, but refactored to be consistent
                // Ideally stockController exports a data fetcher function, not just regex handler
                // For now, let's assume we can call a helper
                fundamentalData = await getFundamentalStatsData(ticker);
            } catch (err) {
                console.error("[AI] Failed to fetch fundamentals:", err.message);
            }
        }

        // ── Check cache ───────────────────────────────────
        const cacheKey = `ai_fundamental_${ticker.toUpperCase()}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return res.json({ ...cached, fromCache: true });
        }

        // ── Build fundamental context ─────────────────────
        let fundamentalContext = "";
        if (fundamentalData) {
            const lines = Object.entries(fundamentalData)
                .map(([key, val]) => `- ${key}: ${val}`)
                .join("\n");
            fundamentalContext = `\nData fundamental terbaru:\n${lines}`;
        }

        const prompt = `Kamu adalah seorang analis fundamental senior di pasar modal Indonesia (IDX). Berikan analisis fundamental profesional untuk saham ${ticker}.
${fundamentalContext}

Gunakan format berikut dengan Markdown yang rapi:

## 📋 Analisis Fundamental ${ticker}

### Profil Perusahaan
(Jelaskan secara singkat bisnis inti, sektor, dan posisi di industri)

### Kinerja Keuangan
(Analisis rasio kunci: PE, PBV, ROE, ROA, DER, net profit margin. Bandingkan dengan rata-rata sektor jika relevan)

### Dividen & Yield
(Analisis kebijakan dividen, dividend yield, payout ratio, dan konsistensi pembayaran)

### Valuasi
(Berikan penilaian apakah saham undervalued/overvalued berdasarkan PE, PBV, dan metode DCF sederhana jika memungkinkan)

### 🎯 Fair Value & Rekomendasi
(Estimasi fair value dalam Rupiah, berikan rekomendasi BUY/SELL/HOLD dengan margin of safety)

### ⚠️ Risiko Fundamental
(Sebutkan risiko bisnis, regulasi, atau makroekonomi yang perlu diperhatikan)

Jawab sepenuhnya dalam Bahasa Indonesia yang profesional. Gunakan angka dalam format Rupiah (tanpa desimal). Buat analisis yang ringkas, padat, dan actionable.`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const response = {
            success: true,
            ticker: ticker.toUpperCase(),
            insight: text,
        };

        // ── Store in cache ────────────────────────────────
        cache.set(cacheKey, response, AI_CACHE_TTL);

        return res.json({ ...response, fromCache: false });
    } catch (error) {
        console.error(`[AI Controller - Fundamental] ${error.message}`);
        return res.status(500).json({
            success: false,
            error: "Failed to generate fundamental AI insight",
        });
    }
};

/**
 * POST /api/ai-insight/technical
 * Generate an AI-powered technical analysis insight for a given ticker.
 *
 * Body: { ticker: string, taData?: object }
 *
 * Cached by ticker for 30 minutes.
 */
export const generateTechnicalInsight = async (req, res) => {
    try {
        const { ticker } = req.body;
        let { taData, price } = req.body;

        if (!ticker) {
            return res
                .status(400)
                .json({ success: false, error: "Ticker diperlukan" });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res
                .status(500)
                .json({ success: false, error: "GEMINI_API_KEY tidak dikonfigurasi" });
        }

        // ── Check cache ───────────────────────────────────
        const cacheKey = `ai_technical_${ticker.toUpperCase()}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            return res.json({ ...cached, fromCache: true });
        }

        // ── Build technical context ─────────────────────
        let technicalContext = "";
        if (taData) {
            const { latest, analysis } = taData;

            technicalContext = `
Data harga terakhir:
- Harga: ${latest?.price}
- Perubahan: ${latest?.change} (${latest?.change_pct}%)
- SMA 20: ${latest?.sma_20 || 'N/A'}
- SMA 50: ${latest?.sma_50 || 'N/A'}
- SMA 200: ${latest?.sma_200 || 'N/A'}
- RSI: ${latest?.rsi || 'N/A'}
- MACD: ${latest?.macd || 'N/A'}
- MACD Signal: ${latest?.macd_signal || 'N/A'}
- Bollinger Upper: ${latest?.bb_upper || 'N/A'}
- Bollinger Lower: ${latest?.bb_lower || 'N/A'}
- ATR: ${latest?.atr || 'N/A'}
- ADX: ${latest?.adx || 'N/A'}

Ringkasan Analisis:
- Kesimpulan: ${analysis?.summary?.overall || 'N/A'}
- Aksi: ${analysis?.summary?.action || 'N/A'}
- Skor: ${analysis?.summary?.score || 'N/A'}
- Kepercayaan: ${analysis?.summary?.confidence || 'N/A'}

Sinyal Trend:
${analysis?.signals?.trend?.signals?.map(s => `- ${s}`).join('\n') || 'Tidak tersedia'}

Sinyal Momentum:
${analysis?.signals?.momentum?.signals?.map(s => `- ${s}`).join('\n') || 'Tidak tersedia'}

Sinyal Volatilitas:
${analysis?.signals?.volatility?.signals?.map(s => `- ${s}`).join('\n') || 'Tidak tersedia'}

Rekomendasi:
${analysis?.recommendations?.map(r => `- [${r.type}] ${r.text}`).join('\n') || 'Tidak tersedia'}
`;
        }

        const prompt = `Kamu adalah seorang analis teknikal senior di pasar modal Indonesia (IDX). Berikan analisis teknikal mendalam dan actionable untuk saham ${ticker}.
${technicalContext}

Gunakan format berikut dengan Markdown yang rapi:

## 📊 Analisis Teknikal ${ticker}

### Ringkasan Eksekutif
(Berikan kesimpulan cepat: apakah saham ini layak dibeli/dijual/ditahan dalam 1-2 kalimat)

### Analisis Trend
(Analisis trend berdasarkan SMA, EMA, dan pola harga. Jelaskan apakah trend bullish/bearish dan seberapa kuat)

### Analisis Momentum
(Analisis RSI, MACD, dan Stochastic. Identifikasi kondisi overbought/oversold dan potensi divergence)

### Volatilitas & Bollinger Bands
(Analisis posisi harga dalam Bollinger Bands, potensi breakout/squeeze, dan tingkat volatilitas)

### Volume Analysis
(Analisis volume trading, akumulasi/distribusi, dan konfirmasi pergerakan harga)

### 🎯 Setup Trading
Berikan setup trading konkret:
| Parameter | Nilai |
|-----------|-------|
| Entry Point | (harga spesifik) |
| Target 1 | (harga & persentase) |
| Target 2 | (harga & persentase) |
| Stop Loss | (harga & persentase) |
| Risk/Reward Ratio | (rasio) |

### ⚠️ Risiko & Peringatan
(Sebutkan risiko teknikal: support yang tembus, resistance kuat, sinyal berbalik, dll)

### Kesimpulan
(Berikan rekomendasi final: BUY/SELL/HOLD dengan timeframe dan level kunci)

Jawab sepenuhnya dalam Bahasa Indonesia yang profesional namun mudah dipahami. Gunakan angka dalam format Rupiah (tanpa desimal). Buat analisis yang ringkas, padat, dan langsung bisa ditindaklanjuti oleh trader.`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const response = {
            success: true,
            ticker: ticker.toUpperCase(),
            insight: text,
        };

        // ── Store in cache ────────────────────────────────
        cache.set(cacheKey, response, AI_CACHE_TTL);

        return res.json({ ...response, fromCache: false });
    } catch (error) {
        console.error(`[AI Controller - Technical] ${error.message}`);
        return res.status(500).json({
            success: false,
            error: "Gagal membuat analisis teknikal AI",
        });
    }
};
