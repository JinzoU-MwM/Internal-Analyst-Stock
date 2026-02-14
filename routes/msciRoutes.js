import { Router } from "express";

const router = Router();

const TRADERSAHAM_BASE = "https://api.tradersaham.com/api/analytics/screener";

/* ── Token management ─────────────────────────────────────────── */
let cachedToken = null;
let tokenExpiry = 0; // epoch ms

/**
 * Exchange Firebase refresh-token for a fresh id-token.
 * Uses the Google securetoken endpoint (same as Firebase client SDK).
 */
async function getAccessToken() {
    const now = Date.now();
    // Re-use token if it's still valid (with 60s buffer)
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
 * Helper – proxy a request to tradersaham with auth.
 */
async function proxyRequest(url) {
    const token = await getAccessToken();
    return fetch(url, {
        headers: {
            authorization: `Bearer ${token}`,
            accept: "application/json",
            "user-agent": "Mozilla/5.0",
            origin: "https://tradersaham.com",
            referer: "https://tradersaham.com/",
        },
    });
}

/* ── Routes ───────────────────────────────────────────────────── */

/**
 * GET /api/msci/screener
 * Proxy to tradersaham MSCI screener API.
 */
router.get("/screener", async (req, res) => {
    try {
        const params = new URLSearchParams(req.query).toString();
        const url = `${TRADERSAHAM_BASE}/msci-candidates?${params}`;

        const response = await proxyRequest(url);

        if (!response.ok) {
            const text = await response.text();
            console.error("[MSCI] API error:", response.status, text);
            return res.status(response.status).json({
                success: false,
                error: `Tradersaham API error: ${response.status}`,
            });
        }

        const data = await response.json();
        return res.json({ success: true, ...data });
    } catch (error) {
        console.error("[MSCI] Error:", error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/msci/detail/:stockCode
 * Proxy to tradersaham MSCI detail/history API.
 */
router.get("/detail/:stockCode", async (req, res) => {
    try {
        const { stockCode } = req.params;
        const params = new URLSearchParams(req.query).toString();
        const url = `${TRADERSAHAM_BASE}/msci-candidates/${stockCode}?${params}`;

        const response = await proxyRequest(url);

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                error: `API error: ${response.status}`,
            });
        }

        const data = await response.json();
        return res.json({ success: true, ...data });
    } catch (error) {
        console.error("[MSCI Detail] Error:", error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
