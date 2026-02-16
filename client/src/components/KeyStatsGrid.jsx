import { useState, useEffect, useRef } from "react";
import { formatNumber, formatPct, formatDec, formatCurrency, pctColor } from "../utils/formatters";

/* ── Tooltip Component ───────────────────────────────────── */
function InfoTip({ text }) {
    const [show, setShow] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!show) return;
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setShow(false);
        };
        document.addEventListener("pointerdown", handler);
        return () => document.removeEventListener("pointerdown", handler);
    }, [show]);

    if (!text) return null;

    return (
        <span className="relative inline-flex" ref={ref}>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShow((s) => !s); }}
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
                className="ml-1 w-3.5 h-3.5 rounded-full bg-text-muted/20 text-text-muted text-[8px] font-bold leading-none inline-flex items-center justify-center hover:bg-accent/20 hover:text-accent transition-colors cursor-help"
                aria-label="Info"
            >
                i
            </button>
            {show && (
                <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 px-3 py-2 text-[11px] leading-relaxed text-text-primary bg-surface-elevated border border-border rounded-lg shadow-xl pointer-events-none animate-fade-in">
                    {text}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-surface-elevated" />
                </span>
            )}
        </span>
    );
}

/* ── Card Components ─────────────────────────────────────── */

/** A single stat card */
function StatCard({ label, value, sub, color = "text-text-primary", info }) {
    return (
        <div className="bg-surface-card border border-border rounded-xl p-4 sm:p-5 hover:border-accent/30 transition-colors">
            <p className="text-[10px] sm:text-xs text-text-muted mb-1 uppercase tracking-wide">
                {label}
                <InfoTip text={info} />
            </p>
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
function ValuationCard({ label, value, rawValue, thresholds, info }) {
    if (rawValue == null) {
        return <StatCard label={label} value="—" info={info} />;
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
                <p className="text-[10px] sm:text-xs text-text-muted uppercase tracking-wide">
                    {label}
                    <InfoTip text={info} />
                </p>
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md border ${badge.color}`}>
                    {badge.text}
                </span>
            </div>
            <p className="text-base sm:text-lg lg:text-xl font-bold text-text-primary truncate">{value}</p>
        </div>
    );
}

/** Health gauge — progress bar with color coding */
function HealthCard({ label, value, displayValue, max, thresholds, inverse = false, info }) {
    if (value == null) {
        return <StatCard label={label} value="—" info={info} />;
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
            <p className="text-[10px] sm:text-xs text-text-muted mb-1 uppercase tracking-wide">
                {label}
                <InfoTip text={info} />
            </p>
            <p className="text-base sm:text-lg lg:text-xl font-bold text-text-primary truncate mb-2">{displayValue}</p>
            <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

/* ── Main Component ──────────────────────────────────────── */

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
                    <StatCard
                        label="Market Cap"
                        value={formatNumber(data.marketCap)}
                        info="Kapitalisasi pasar = harga saham × jumlah saham beredar. Menunjukkan total nilai perusahaan di bursa."
                    />
                    <ValuationCard
                        label="PER (TTM)"
                        value={formatDec(data.peRatio)}
                        rawValue={data.peRatio}
                        thresholds={[10, 25]}
                        info="Price-to-Earnings Ratio. Berapa kali harga saham dibanding laba per saham. PER rendah bisa berarti saham undervalued."
                    />
                    <ValuationCard
                        label="Forward PE"
                        value={formatDec(data.forwardPE)}
                        rawValue={data.forwardPE}
                        thresholds={[10, 25]}
                        info="PER berdasarkan estimasi laba tahun depan. Lebih rendah dari PER TTM biasanya sinyal pertumbuhan laba."
                    />
                    <ValuationCard
                        label="PBV"
                        value={formatDec(data.pbRatio)}
                        rawValue={data.pbRatio}
                        thresholds={[1, 3]}
                        info="Price-to-Book Value. Perbandingan harga saham terhadap nilai buku. PBV < 1 bisa berarti saham dijual di bawah nilai asetnya."
                    />
                    <ValuationCard
                        label="PEG Ratio"
                        value={formatDec(data.pegRatio)}
                        rawValue={data.pegRatio}
                        thresholds={[0.8, 1.5]}
                        info="Price/Earnings-to-Growth. PER dibagi pertumbuhan laba. PEG < 1 menandakan saham murah relatif terhadap pertumbuhannya."
                    />
                </div>
            </div>

            {/* ── Profitability ── */}
            <div>
                <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                    💰 Profitabilitas
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <StatCard
                        label="ROE"
                        value={formatPct(data.roe)}
                        color={pctColor(data.roe)}
                        info="Return on Equity. Seberapa efisien perusahaan menghasilkan laba dari modal pemegang saham. Semakin tinggi semakin baik."
                    />
                    <StatCard
                        label="ROA"
                        value={formatPct(data.roa)}
                        color={pctColor(data.roa)}
                        info="Return on Assets. Seberapa efisien perusahaan menghasilkan laba dari total asetnya. ROA > 5% umumnya bagus."
                    />
                    <StatCard
                        label="Profit Margin"
                        value={formatPct(data.profitMargin)}
                        color={pctColor(data.profitMargin)}
                        info="Net Profit Margin. Persentase laba bersih dari pendapatan. Semakin tinggi berarti perusahaan semakin efisien."
                    />
                    <StatCard
                        label="Operating Margin"
                        value={formatPct(data.operatingMargin)}
                        color={pctColor(data.operatingMargin)}
                        info="Margin laba operasional. Menunjukkan efisiensi operasional perusahaan sebelum beban bunga dan pajak."
                    />
                    <StatCard
                        label="Gross Margin"
                        value={formatPct(data.grossMargin)}
                        color={pctColor(data.grossMargin)}
                        info="Margin laba kotor. Persentase pendapatan yang tersisa setelah dikurangi biaya produksi langsung (COGS)."
                    />
                </div>
            </div>

            {/* ── Dividends ── */}
            <div>
                <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                    🎯 Dividen
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <StatCard
                        label="Dividend Yield"
                        value={formatPct(data.dividendYield)}
                        color="text-accent"
                        info="Persentase dividen tahunan relatif terhadap harga saham. Yield tinggi berarti pendapatan pasif lebih besar."
                    />
                    <StatCard
                        label="Dividend Rate"
                        value={formatCurrency(data.dividendRate, data.currency)}
                        info="Jumlah dividen per saham yang dibayarkan per tahun (dalam Rupiah)."
                    />
                    <StatCard
                        label="Payout Ratio"
                        value={formatPct(data.payoutRatio)}
                        info="Persentase laba bersih yang dibagikan sebagai dividen. Ratio terlalu tinggi (>80%) bisa tidak berkelanjutan."
                    />
                    <StatCard
                        label="EV"
                        value={formatNumber(data.enterpriseValue)}
                        info="Enterprise Value. Total nilai perusahaan termasuk utang dikurangi kas. Ukuran valuasi yang lebih lengkap dari Market Cap."
                    />
                </div>
            </div>

            {/* ── Financial Health (with gauges) ── */}
            <div>
                <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                    🏦 Kesehatan Keuangan
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <StatCard
                        label="Total Revenue"
                        value={formatNumber(data.totalRevenue)}
                        info="Total pendapatan perusahaan (trailing 12 bulan). Pertumbuhan revenue menunjukkan bisnis berkembang."
                    />
                    <StatCard
                        label="Revenue Growth"
                        value={formatPct(data.revenueGrowth)}
                        color={pctColor(data.revenueGrowth)}
                        info="Pertumbuhan pendapatan year-over-year. Positif berarti bisnis tumbuh, negatif berarti menyusut."
                    />
                    <StatCard
                        label="Earnings Growth"
                        value={formatPct(data.earningsGrowth)}
                        color={pctColor(data.earningsGrowth)}
                        info="Pertumbuhan laba bersih year-over-year. Salah satu indikator terpenting untuk valuasi saham."
                    />
                    <HealthCard
                        label="Debt / Equity"
                        value={data.debtToEquity}
                        displayValue={formatDec(data.debtToEquity)}
                        max={200}
                        thresholds={[50, 100]}
                        inverse={true}
                        info="Rasio utang terhadap ekuitas. DER < 1 menunjukkan perusahaan lebih banyak didanai ekuitas. DER tinggi berarti risiko lebih besar."
                    />
                    <HealthCard
                        label="Current Ratio"
                        value={data.currentRatio}
                        displayValue={formatDec(data.currentRatio)}
                        max={5}
                        thresholds={[1, 2]}
                        inverse={false}
                        info="Rasio aset lancar terhadap utang lancar. CR > 1 berarti perusahaan mampu membayar kewajiban jangka pendeknya."
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
                        info="Konsensus rekomendasi analis (Strong Buy, Buy, Hold, Sell). Berdasarkan rata-rata dari beberapa analis."
                    />
                </div>
            </div>

            {/* ── Trading Info ── */}
            <div>
                <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                    📈 Info Perdagangan
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <StatCard label="52W High" value={formatCurrency(data.fiftyTwoWeekHigh, data.currency)} info="Harga tertinggi saham dalam 52 minggu (1 tahun) terakhir." />
                    <StatCard label="52W Low" value={formatCurrency(data.fiftyTwoWeekLow, data.currency)} info="Harga terendah saham dalam 52 minggu (1 tahun) terakhir." />
                    <StatCard label="MA-50" value={formatCurrency(data.fiftyDayAverage, data.currency)} info="Moving Average 50 hari. Rata-rata harga 50 hari terakhir. Harga di atas MA-50 biasanya tren naik." />
                    <StatCard label="MA-200" value={formatCurrency(data.twoHundredDayAverage, data.currency)} info="Moving Average 200 hari. Tren jangka panjang. Golden cross terjadi ketika MA-50 memotong MA-200 ke atas." />
                    <StatCard label="Beta" value={formatDec(data.beta)} info="Ukuran volatilitas saham relatif terhadap pasar. Beta > 1 berarti lebih volatil dari IHSG, < 1 lebih stabil." />
                </div>
            </div>

            {/* ── Source Label ── */}
            <p className="text-[10px] text-text-muted/50 text-right mt-2">
                📡 Source: Yahoo Finance — data may differ from local providers (e.g. Stockbit)
            </p>
        </div>
    );
}
