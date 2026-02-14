
export const TRADER_BASE = "https://api.tradersaham.com/api";

// ── Token cache ──
let cachedToken = "";
let tokenExpiry = 0; // epoch ms
let traderCookies = "";

// ── Exchange refresh token for a fresh ID token ──
async function refreshIdToken() {
    const apiKey = process.env.TRADER_FIREBASE_KEY;
    const refreshToken = process.env.TRADER_REFRESH_TOKEN;

    if (!apiKey || !refreshToken) {
        throw new Error("Missing TRADER_FIREBASE_KEY or TRADER_REFRESH_TOKEN in .env");
    }

    const url = `https://securetoken.googleapis.com/v1/token?key=${apiKey}`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=refresh_token&refresh_token=${refreshToken}`
    });

    const data = await res.json();
    if (data.error) {
        throw new Error(`Token refresh failed: ${data.error.message}`);
    }

    // id_token is the JWT; expires_in is in seconds (usually 3600)
    cachedToken = data.id_token;
    tokenExpiry = Date.now() + (parseInt(data.expires_in, 10) - 60) * 1000; // refresh 1 min early
    console.log(`🔑 Trader token refreshed (expires in ${data.expires_in}s)`);
    return cachedToken;
}

// ── Get valid token (auto-refresh) ──
async function getTraderToken() {
    if (cachedToken && Date.now() < tokenExpiry) {
        return cachedToken;
    }
    return refreshIdToken();
}

// ── Generate X-Rq-* headers ──
export function generateTraderHeaders(pathname) {
    const xe = "trs_idx_v2_2024";
    const t = Date.now().toString();
    const sString = pathname.slice(-4) + t + xe;
    const s = Buffer.from(sString).toString('base64').slice(5, 21);
    return {
        "X-Rq-T": t,
        "X-Rq-S": s
    };
}

// ── Get or refresh cookies ──
async function getTraderCookies() {
    if (traderCookies) return traderCookies;
    try {
        const token = await getTraderToken();
        const res = await fetch(`${TRADER_BASE}/auth/login`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Length": "0",
                "Origin": "https://tradersaham.com",
                "Referer": "https://tradersaham.com/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });
        if (res.ok) {
            const rawCookies = res.headers.get("set-cookie");
            traderCookies = rawCookies || "";
        } else {
            console.error("Trader cookie login failed:", res.status);
        }
    } catch (e) {
        console.error("Trader cookie error:", e.message);
    }
    return traderCookies;
}

// ── Unified fetcher ──
export async function fetchTrader(path, options = {}) {
    const url = `${TRADER_BASE}${path}`;
    const token = await getTraderToken();
    const customHeaders = generateTraderHeaders(path.split('?')[0]);
    const cookies = await getTraderCookies();

    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
        "Referer": "https://tradersaham.com/",
        "Cookie": cookies,
        ...customHeaders,
        ...(options.headers || {})
    };

    try {
        const res = await fetch(url, { ...options, headers });
        if (!res.ok) {
            console.error(`Fetch ${path} failed: ${res.status} ${res.statusText}`);
            if (res.status === 401 || res.status === 403) {
                // Token might have been invalidated; force refresh on next request
                cachedToken = "";
                tokenExpiry = 0;
                traderCookies = "";
                throw new Error(`Auth Error: ${res.status} – token cleared, will retry on next request`);
            }
            return null;
        }
        return await res.json();
    } catch (e) {
        console.error(`Fetch ${path} exception:`, e.message);
        throw e;
    }
}
