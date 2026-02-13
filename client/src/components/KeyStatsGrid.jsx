import { useState, useEffect } from "react";

/** Format large numbers: 1.2T, 345B, 12.5M, etc. */
function formatNumber(val) {
    if (val == null) return "—";
    const abs = Math.abs(val);
    if (abs >= 1e12) return (val / 1e12).toFixed(1) + "T";
    if (abs >= 1e9) return (val / 1e9).toFixed(1) + "B";
    if (abs >= 1e6) return (val / 1e6).toFixed(1) + "M";
    if (abs >= 1e3) return (val / 1e3).toFixed(1) + "K";
    return val.toLocaleString("id-ID");
}

/** Format as percentage */
function formatPct(val) {
    if (val == null) return "—";
    return (val * 100).toFixed(2) + "%";
}

/** Format as number with decimals */
function formatDec(val, decimals = 2) {
    if (val == null) return "—";
    return val.toFixed(decimals);
}

/** Format currency dynamically */
function formatCurrency(val, currency = "IDR") {
    if (val == null) return "—";

    // Simple symbol mapping
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

/** A single stat card */
function StatCard({ label, value, sub, color = "text-text-primary" }) {
    return (
        <div className="bg-surface-card border border-border rounded-xl p-4 sm:p-5 hover:border-accent/30 transition-colors">
            <p className="text-[10px] sm:text-xs text-text-muted mb-1 uppercase tracking-wide">{label}</p>
            <p className={`text-base sm:text-lg lg:text-xl font-bold ${color} truncate`}>{value}</p>
            {sub && <p className="text-[10px] sm:text-xs text-text-muted mt-1">{sub}</p>}
        </div>
    );
}

/** Determine color for percentage values */
function pctColor(val) {
    if (val == null) return "text-text-primary";
    return val >= 0 ? "text-bull" : "text-bear";
}

export default function KeyStatsGrid({ ticker }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!ticker) return;
        setLoading(true);
        setError("");
        setData(null);

        fetch(`/api/stocks/${encodeURIComponent(ticker)}/fundamental`)
            .then((r) => r.json())
            .then((res) => {
                if (res.success) setData(res.data);
                else setError(res.error || "Failed to load data");
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [ticker]);

    if (loading) {
        return (
            <div className="space-y-5 animate-pulse">
                {/* Company info skeleton */}
                <div className="flex items-center gap-3">
                    <div className="h-5 w-20 bg-surface-elevated rounded" />
                    <div className="h-5 w-28 bg-surface-elevated rounded-full" />
                </div>
                {/* Section skeletons */}
                {[...Array(3)].map((_, s) => (
                    <div key={s}>
                        <div className="h-4 w-32 bg-surface-elevated rounded mb-3" />
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-surface-card border border-border rounded-xl p-4 sm:p-5">
                                    <div className="h-3 w-16 bg-surface-elevated rounded mb-2" />
                                    <div className="h-5 w-20 bg-surface-elevated rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-bear/10 border border-bear/30 text-bear rounded-xl px-4 py-3 text-sm">
                {error}
            </div>
        );
    }

    if (!data) return null;

    const recommendColor = {
        buy: "text-bull",
        strong_buy: "text-bull",
        hold: "text-yellow-400",
        sell: "text-bear",
        strong_sell: "text-bear",
    };

    return (
        <div className="space-y-5">
            {/* Company info */}
            <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-lg font-bold text-text-primary">{data.ticker}</h3>
                {data.sector && (
                    <span className="text-xs bg-accent/10 text-accent border border-accent/20 px-2.5 py-0.5 rounded-full">
                        {data.sector}
                    </span>
                )}
                {data.industry && (
                    <span className="text-xs bg-surface-elevated text-text-muted border border-border px-2.5 py-0.5 rounded-full">
                        {data.industry}
                    </span>
                )}
            </div>

            {/* Valuation */}
            <div>
                <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                    📊 Valuasi
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <StatCard label="Market Cap" value={formatNumber(data.marketCap)} />
                    <StatCard label="PER (TTM)" value={formatDec(data.peRatio)} />
                    <StatCard label="Forward PE" value={formatDec(data.forwardPE)} />
                    <StatCard label="PBV" value={formatDec(data.pbRatio)} />
                    <StatCard label="PEG Ratio" value={formatDec(data.pegRatio)} />
                </div>
            </div>

            {/* Profitability */}
            <div>
                <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                    💰 Profitabilitas
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <StatCard label="ROE" value={formatPct(data.roe)} color={pctColor(data.roe)} />
                    <StatCard label="ROA" value={formatPct(data.roa)} color={pctColor(data.roa)} />
                    <StatCard label="Profit Margin" value={formatPct(data.profitMargin)} color={pctColor(data.profitMargin)} />
                    <StatCard label="Operating Margin" value={formatPct(data.operatingMargin)} color={pctColor(data.operatingMargin)} />
                    <StatCard label="Gross Margin" value={formatPct(data.grossMargin)} color={pctColor(data.grossMargin)} />
                </div>
            </div>

            {/* Dividends */}
            <div>
                <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                    🎯 Dividen
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <StatCard label="Dividend Yield" value={formatPct(data.dividendYield)} color="text-accent" />
                    <StatCard label="Dividend Rate" value={formatCurrency(data.dividendRate, data.currency)} />
                    <StatCard label="Payout Ratio" value={formatPct(data.payoutRatio)} />
                    <StatCard label="EV" value={formatNumber(data.enterpriseValue)} />
                </div>
            </div>

            {/* Financial Health */}
            <div>
                <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                    🏦 Kesehatan Keuangan
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <StatCard label="Total Revenue" value={formatNumber(data.totalRevenue)} />
                    <StatCard label="Revenue Growth" value={formatPct(data.revenueGrowth)} color={pctColor(data.revenueGrowth)} />
                    <StatCard label="Earnings Growth" value={formatPct(data.earningsGrowth)} color={pctColor(data.earningsGrowth)} />
                    <StatCard label="Debt / Equity" value={formatDec(data.debtToEquity)} />
                    <StatCard label="Current Ratio" value={formatDec(data.currentRatio)} />
                </div>
            </div>

            {/* Price Target & Recommendation */}
            <div>
                <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                    🎯 Target Harga Analis
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <StatCard label="Harga Saat Ini" value={formatCurrency(data.currentPrice, data.currency)} />
                    <StatCard label="Target Rendah" value={formatCurrency(data.targetLowPrice, data.currency)} />
                    <StatCard label="Target Rata-rata" value={formatCurrency(data.targetMeanPrice, data.currency)} color="text-accent" />
                    <StatCard label="Target Tinggi" value={formatCurrency(data.targetHighPrice, data.currency)} />
                    <StatCard
                        label="Rekomendasi"
                        value={data.recommendation?.toUpperCase() ?? "—"}
                        color={recommendColor[data.recommendation] ?? "text-text-primary"}
                        sub={data.numberOfAnalysts ? `${data.numberOfAnalysts} analis` : null}
                    />
                </div>
            </div>

            {/* Trading Info */}
            <div>
                <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                    📈 Info Perdagangan
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <StatCard label="52W High" value={formatCurrency(data.fiftyTwoWeekHigh, data.currency)} />
                    <StatCard label="52W Low" value={formatCurrency(data.fiftyTwoWeekLow, data.currency)} />
                    <StatCard label="MA-50" value={formatCurrency(data.fiftyDayAverage, data.currency)} />
                    <StatCard label="MA-200" value={formatCurrency(data.twoHundredDayAverage, data.currency)} />
                    <StatCard label="Beta" value={formatDec(data.beta)} />
                </div>
            </div>
        </div>
    );
}
