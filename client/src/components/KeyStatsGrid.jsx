import { useState, useEffect } from "react";
import { formatNumber, formatPct, formatDec, formatCurrency, pctColor } from "../utils/formatters";

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

/** Range bar showing a value's position between min and max */
function RangeBar({ low, high, current, label, lowLabel = "Low", highLabel = "High" }) {
    if (low == null || high == null || current == null) return null;
    const range = high - low;
    const pct = range > 0 ? Math.min(Math.max(((current - low) / range) * 100, 0), 100) : 50;
    const fmt = (v) => v?.toLocaleString("id-ID") ?? "-";

    return (
        <div className="bg-surface-card border border-border rounded-xl p-4 sm:p-5">
            <p className="text-[10px] sm:text-xs text-text-muted mb-3 uppercase tracking-wide">{label}</p>
            <div className="relative h-2 bg-surface-elevated rounded-full overflow-hidden mb-2">
                <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-500"
                    style={{ width: "100%" }}
                />
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-accent rounded-full shadow-lg shadow-accent/30 -ml-1.5"
                    style={{ left: `${pct}%` }}
                />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted">
                <span>{lowLabel}: {fmt(low)}</span>
                <span className="font-semibold text-text-primary">{fmt(current)}</span>
                <span>{highLabel}: {fmt(high)}</span>
            </div>
        </div>
    );
}

/** Valuation badge — shows if a metric is cheap/fair/expensive */
function ValuationCard({ label, value, rawValue, thresholds }) {
    if (rawValue == null) {
        return <StatCard label={label} value="—" />;
    }

    let badge = { text: "Fair", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" };
    if (thresholds) {
        if (rawValue < 0) {
            badge = { text: "Rugi", color: "bg-red-500/15 text-red-400 border-red-500/30" };
        } else if (rawValue <= thresholds[0]) {
            badge = { text: "Murah", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
        } else if (rawValue >= thresholds[1]) {
            badge = { text: "Mahal", color: "bg-red-500/15 text-red-400 border-red-500/30" };
        }
    }

    return (
        <div className="bg-surface-card border border-border rounded-xl p-4 sm:p-5 hover:border-accent/30 transition-colors">
            <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] sm:text-xs text-text-muted uppercase tracking-wide">{label}</p>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md border ${badge.color}`}>
                    {badge.text}
                </span>
            </div>
            <p className="text-base sm:text-lg lg:text-xl font-bold text-text-primary truncate">{value}</p>
        </div>
    );
}

/** Health gauge — progress bar with color coding */
function HealthCard({ label, value, displayValue, max, thresholds, inverse = false }) {
    if (value == null) {
        return <StatCard label={label} value="—" />;
    }

    const pct = Math.min((Math.abs(value) / max) * 100, 100);
    let color = "bg-emerald-500";
    if (thresholds) {
        const v = Math.abs(value);
        if (inverse ? v <= thresholds[0] : v >= thresholds[1]) {
            color = "bg-red-500";
        } else if (inverse ? v <= thresholds[1] : v >= thresholds[0]) {
            color = "bg-yellow-500";
        }
    }

    return (
        <div className="bg-surface-card border border-border rounded-xl p-4 sm:p-5 hover:border-accent/30 transition-colors">
            <p className="text-[10px] sm:text-xs text-text-muted mb-1 uppercase tracking-wide">{label}</p>
            <p className="text-base sm:text-lg lg:text-xl font-bold text-text-primary truncate mb-2">{displayValue}</p>
            <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
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
                <div className="flex items-center gap-3">
                    <div className="h-5 w-20 bg-surface-elevated rounded" />
                    <div className="h-5 w-28 bg-surface-elevated rounded-full" />
                </div>
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
        <div className="space-y-6">
            {/* ── Company Profile Header ── */}
            <div className="bg-surface-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-3 flex-wrap mb-3">
                    <h3 className="text-xl font-bold text-text-primary">{data.ticker}</h3>
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
                    {data.website && (
                        <a
                            href={data.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-accent hover:underline"
                        >
                            🔗 {new URL(data.website).hostname}
                        </a>
                    )}
                </div>
                {data.longBusinessSummary && (
                    <p className="text-xs text-text-muted leading-relaxed line-clamp-3">
                        {data.longBusinessSummary}
                    </p>
                )}
                {data.fullTimeEmployees && (
                    <p className="text-[10px] text-text-muted mt-2">
                        👥 {data.fullTimeEmployees.toLocaleString("id-ID")} karyawan
                    </p>
                )}
            </div>

            {/* ── 52-Week Range + Price vs Target ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <RangeBar
                    low={data.fiftyTwoWeekLow}
                    high={data.fiftyTwoWeekHigh}
                    current={data.currentPrice}
                    label="📊 52-Week Range"
                    lowLabel="52W Low"
                    highLabel="52W High"
                />
                <RangeBar
                    low={data.targetLowPrice}
                    high={data.targetHighPrice}
                    current={data.currentPrice}
                    label="🎯 Analyst Price Target"
                    lowLabel="Target Low"
                    highLabel="Target High"
                />
            </div>

            {/* ── Valuation (with badges) ── */}
            <div>
                <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                    📊 Valuasi
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <StatCard label="Market Cap" value={formatNumber(data.marketCap)} />
                    <ValuationCard label="PER (TTM)" value={formatDec(data.peRatio)} rawValue={data.peRatio} thresholds={[10, 25]} />
                    <ValuationCard label="Forward PE" value={formatDec(data.forwardPE)} rawValue={data.forwardPE} thresholds={[10, 25]} />
                    <ValuationCard label="PBV" value={formatDec(data.pbRatio)} rawValue={data.pbRatio} thresholds={[1, 3]} />
                    <ValuationCard label="PEG Ratio" value={formatDec(data.pegRatio)} rawValue={data.pegRatio} thresholds={[0.8, 1.5]} />
                </div>
            </div>

            {/* ── Profitability ── */}
            <div>
                <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                    💰 Profitabilitas
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <StatCard label="ROE" value={formatPct(data.roe)} color={pctColor(data.roe)} />
                    <StatCard label="ROA" value={formatPct(data.roa)} color={pctColor(data.roa)} />
                    <StatCard label="Profit Margin" value={formatPct(data.profitMargin)} color={pctColor(data.profitMargin)} />
                    <StatCard label="Operating Margin" value={formatPct(data.operatingMargin)} color={pctColor(data.operatingMargin)} />
                    <StatCard label="Gross Margin" value={formatPct(data.grossMargin)} color={pctColor(data.grossMargin)} />
                </div>
            </div>

            {/* ── Dividends ── */}
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

            {/* ── Financial Health (with gauges) ── */}
            <div>
                <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                    🏦 Kesehatan Keuangan
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <StatCard label="Total Revenue" value={formatNumber(data.totalRevenue)} />
                    <StatCard label="Revenue Growth" value={formatPct(data.revenueGrowth)} color={pctColor(data.revenueGrowth)} />
                    <StatCard label="Earnings Growth" value={formatPct(data.earningsGrowth)} color={pctColor(data.earningsGrowth)} />
                    <HealthCard
                        label="Debt / Equity"
                        value={data.debtToEquity}
                        displayValue={formatDec(data.debtToEquity)}
                        max={200}
                        thresholds={[50, 100]}
                        inverse={true}
                    />
                    <HealthCard
                        label="Current Ratio"
                        value={data.currentRatio}
                        displayValue={formatDec(data.currentRatio)}
                        max={5}
                        thresholds={[1, 2]}
                        inverse={false}
                    />
                </div>
            </div>

            {/* ── Price Target & Recommendation ── */}
            <div>
                <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                    🎯 Target Harga Analis
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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

            {/* ── Trading Info ── */}
            <div>
                <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                    📈 Info Perdagangan
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <StatCard label="52W High" value={formatCurrency(data.fiftyTwoWeekHigh, data.currency)} />
                    <StatCard label="52W Low" value={formatCurrency(data.fiftyTwoWeekLow, data.currency)} />
                    <StatCard label="MA-50" value={formatCurrency(data.fiftyDayAverage, data.currency)} />
                    <StatCard label="MA-200" value={formatCurrency(data.twoHundredDayAverage, data.currency)} />
                    <StatCard label="Beta" value={formatDec(data.beta)} />
                </div>
            </div>

            {/* ── Source Label ── */}
            <p className="text-[10px] text-text-muted/50 text-right mt-2">
                📡 Source: Yahoo Finance — data may differ from local providers (e.g. Stockbit)
            </p>
        </div>
    );
}
