/**
 * Shared formatters — Stockbit-style, clean & consistent.
 *
 * Conventions:
 *   - Numbers shortened > 1T, > 1B, > 1M, > 1K
 *   - Always 2 decimal places for ratios
 *   - Thousand separators (id-ID locale: 1.234,56)
 *   - "—" for null/undefined values
 */

/**
 * Format large numbers with T/B/M/K suffix.
 * Handles numbers of any magnitude correctly.
 *   1_500_000_000_000_000 → "1.500,0T" ✗  → "1.500T" ✓
 */
export function formatNumber(val) {
    if (val == null || isNaN(val)) return "—";

    const abs = Math.abs(val);
    const sign = val < 0 ? "-" : "";

    if (abs >= 1e15) return sign + (abs / 1e12).toLocaleString("id-ID", { maximumFractionDigits: 0 }) + "T";
    if (abs >= 1e12) return sign + (abs / 1e12).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "T";
    if (abs >= 1e9) return sign + (abs / 1e9).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "B";
    if (abs >= 1e6) return sign + (abs / 1e6).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "M";
    if (abs >= 1e3) return sign + (abs / 1e3).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "K";
    return val.toLocaleString("id-ID");
}

/**
 * Format a decimal ratio (PE, PBV, PEG, etc.) — always 2 decimal places.
 * Uses thousand separator for values ≥ 1000 (rare but possible).
 */
export function formatDec(val, decimals = 2) {
    if (val == null || isNaN(val)) return "—";
    return val.toLocaleString("id-ID", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

/**
 * Format a fractional value as percentage — val 0.15 → "15,00%".
 */
export function formatPct(val) {
    if (val == null || isNaN(val)) return "—";
    return (val * 100).toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }) + "%";
}

/**
 * Format a currency value — Rp 4.250 or $120.50
 * Uses thousand separators, no decimals for IDR, 2 decimals for others.
 */
export function formatCurrency(val, currency = "IDR") {
    if (val == null || isNaN(val)) return "—";

    const symbols = {
        IDR: "Rp ",
        USD: "$",
        EUR: "€",
        GBP: "£",
        JPY: "¥",
        SGD: "S$",
        AUD: "A$",
    };

    const prefix = symbols[currency] || (currency + " ");
    const decimals = currency === "IDR" ? 0 : 2;

    return prefix + val.toLocaleString("id-ID", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

/**
 * Return a Tailwind text-color class based on positive/negative value.
 */
export function pctColor(val) {
    if (val == null) return "text-text-primary";
    return val >= 0 ? "text-bull" : "text-bear";
}
