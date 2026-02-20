import { Router } from "express";
import { protect, requirePremium } from "../middleware/auth.js";

const router = Router();

const TRADERSAHAM_API = "https://api.tradersaham.com/api";

/* ── Token management ─────────────────────────────────────────── */
let cachedToken = null;
let tokenExpiry = 0; // epoch ms

/**
 * Exchange Firebase refresh-token for a fresh id-token.
 */
async function getAccessToken() {
    const now = Date.now();
    if (cachedToken && now < tokenExpiry - 60_000) {
        return cachedToken;
    }

    const apiKey = process.env.TRADER_FIREBASE_KEY;
    const refreshToken = process.env.TRADER_REFRESH_TOKEN;

    if (!apiKey || !refreshToken) {
        throw new Error("Missing TRADER_FIREBASE_KEY or TRADER_REFRESH_TOKEN in .env");
    }

    const res = await fetch(
        `https://securetoken.googleapis.com/v1/token?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
        }
    );

    if (!res.ok) {
        const err = await res.text();
        console.error("[MSCI] Token refresh failed:", err);
        throw new Error("Failed to refresh tradersaham token");
    }

    const data = await res.json();
    cachedToken = data.id_token;
    tokenExpiry = now + parseInt(data.expires_in, 10) * 1000;
    console.log("[MSCI] Token refreshed, expires in", data.expires_in, "s");
    return cachedToken;
}

/**
 * Proxy fetch with auth + required X-RQ headers.
 */
async function proxyRequest(url) {
    const token = await getAccessToken();
    const t = Date.now();
    return fetch(url, {
        headers: {
            authorization: `Bearer ${token}`,
            accept: "application/json",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            referer: "https://tradersaham.com/",
            "x-rq-t": String(t),
            "x-rq-s": "jE" + Buffer.from(String(t)).toString("base64").slice(0, 12),
        },
    });
}

/* ── Routes ───────────────────────────────────────────────────── */

/**
 * GET /api/msci/screener
 * Proxy: screener list (msci-candidates).
 * Requires Premium subscription.
 */
router.get("/screener", protect, requirePremium, async (req, res) => {
    try {
        const params = new URLSearchParams(req.query).toString();
        const url = `${TRADERSAHAM_API}/analytics/screener/msci-candidates?${params}`;

        const response = await proxyRequest(url);
        if (!response.ok) {
            const text = await response.text();
            console.error("[MSCI] API error:", response.status, text);
            return res.status(response.status).json({ success: false, error: `API error: ${response.status}` });
        }

        const data = await response.json();
        return res.json({ success: true, ...data });
    } catch (error) {
        console.error("[MSCI] Error:", error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/msci/history/:stockCode
 * Proxy: MSCI market cap history for chart.
 * Requires Premium subscription.
 */
router.get("/history/:stockCode", protect, requirePremium, async (req, res) => {
    try {
        const { stockCode } = req.params;
        const url = `${TRADERSAHAM_API}/analytics/screener/msci-history/${stockCode}`;

        const response = await proxyRequest(url);
        if (!response.ok) {
            return res.status(response.status).json({ success: false, error: `API error: ${response.status}` });
        }

        const data = await response.json();
        return res.json({ success: true, ...data });
    } catch (error) {
        console.error("[MSCI History] Error:", error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/msci/ownership/:stockCode
 * Proxy: ownership/shares data.
 * Requires Premium subscription.
 */
router.get("/ownership/:stockCode", protect, requirePremium, async (req, res) => {
    try {
        const { stockCode } = req.params;
        const params = new URLSearchParams(req.query).toString();
        const url = `${TRADERSAHAM_API}/ownership/stock/${stockCode}?${params}`;

        const response = await proxyRequest(url);
        if (!response.ok) {
            return res.status(response.status).json({ success: false, error: `API error: ${response.status}` });
        }

        const data = await response.json();
        return res.json({ success: true, ...data });
    } catch (error) {
        console.error("[MSCI Ownership] Error:", error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
