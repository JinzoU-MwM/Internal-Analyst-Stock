export function formatNumber(val) {
    if (val == null) return "—";
    const abs = Math.abs(val);
    if (abs >= 1e12) return (val / 1e12).toFixed(1) + "T";
    if (abs >= 1e9) return (val / 1e9).toFixed(1) + "B";
    if (abs >= 1e6) return (val / 1e6).toFixed(1) + "M";
    if (abs >= 1e3) return (val / 1e3).toFixed(1) + "K";
    return val.toLocaleString("id-ID");
}

export function formatPct(val) {
    if (val == null) return "—";
    return (val * 100).toFixed(2) + "%";
}

export function formatDec(val, decimals = 2) {
    if (val == null) return "—";
    return val.toFixed(decimals);
}

export function formatCurrency(val, currency = "IDR") {
    if (val == null) return "—";

    const symbols = {
        "IDR": "Rp ",
        "USD": "$",
        "EUR": "€",
        "GBP": "£",
        "JPY": "¥",
        "SGD": "S$",
        "AUD": "A$"
    };

    const prefix = symbols[currency] || (currency + " ");
    return prefix + val.toLocaleString("id-ID");
}

export function pctColor(val) {
    if (val == null) return "text-text-primary";
    return val >= 0 ? "text-bull" : "text-bear";
}
