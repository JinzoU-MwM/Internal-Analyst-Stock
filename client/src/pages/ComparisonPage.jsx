import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { formatNumber, formatPct, formatDec, formatCurrency, pctColor } from "../utils/formatters";

const COLORS = ["#6366f1", "#f59e0b", "#22c55e", "#ec4899"];
const MAX_STOCKS = 4;

const PRESETS = [
    { label: "🏦 Big 4 Bank", tickers: ["BBCA", "BBRI", "BMRI", "BBNI"] },
    { label: "📡 Telco", tickers: ["TLKM", "EXCL", "ISAT"] },
    { label: "🏗️ Property", tickers: ["BSDE", "CTRA", "SMRA"] },
    { label: "⛏️ Mining", tickers: ["ADRO", "ITMG", "PTBA", "INDY"] },
    { label: "🛒 Consumer", tickers: ["ICBP", "UNVR", "MYOR"] },
];

const METRICS = [
    {
        section: "Valuasi", rows: [
            { label: "Market Cap", key: "marketCap", format: "number", better: "higher" },
            { label: "PER (TTM)", key: "peRatio", format: "dec", better: "lower" },
            { label: "Forward PE", key: "forwardPE", format: "dec", better: "lower" },
            { label: "PBV", key: "pbRatio", format: "dec", better: "lower" },
            { label: "PEG Ratio", key: "pegRatio", format: "dec", better: "lower" },
        ]
    },
    {
        section: "Profitabilitas", rows: [
            { label: "ROE", key: "roe", format: "pct", better: "higher", colorFn: true },
            { label: "ROA", key: "roa", format: "pct", better: "higher", colorFn: true },
            { label: "Profit Margin", key: "profitMargin", format: "pct", better: "higher", colorFn: true },
            { label: "Operating Margin", key: "operatingMargin", format: "pct", better: "higher", colorFn: true },
            { label: "Gross Margin", key: "grossMargin", format: "pct", better: "higher", colorFn: true },
        ]
    },
    {
        section: "Dividen", rows: [
            { label: "Yield", key: "dividendYield", format: "pct", better: "higher" },
            { label: "Payout Ratio", key: "payoutRatio", format: "pct", better: null },
        ]
    },
    {
        section: "Kesehatan Keuangan", rows: [
            { label: "Revenue", key: "totalRevenue", format: "number", better: "higher" },
            { label: "Revenue Growth", key: "revenueGrowth", format: "pct", better: "higher", colorFn: true },
            { label: "Earnings Growth", key: "earningsGrowth", format: "pct", better: "higher", colorFn: true },
            { label: "Debt / Equity", key: "debtToEquity", format: "dec", better: "lower" },
            { label: "Current Ratio", key: "currentRatio", format: "dec", better: "higher" },
        ]
    },
    {
        section: "Target Analis", rows: [
            { label: "Rekomendasi", key: "recommendation", format: "raw", better: null },
            { label: "Target Mean", key: "targetMeanPrice", format: "currency", better: "higher" },
            { label: "Upside", key: "_upside", format: "pct", better: "higher", colorFn: true, compute: (d) => d.targetMeanPrice && d.currentPrice ? (d.targetMeanPrice / d.currentPrice - 1) : null },
        ]
    },
];

function formatVal(val, format, currency) {
    if (val == null) return "—";
    switch (format) {
        case "number": return formatNumber(val);
        case "pct": return formatPct(val);
        case "dec": return formatDec(val);
        case "currency": return formatCurrency(val, currency);
        case "raw": return typeof val === "string" ? val.toUpperCase() : val;
        default: return val;
    }
}

/** Compute overall "wins" for each stock */
function computeScores(stocks) {
    const scores = stocks.map(() => ({ wins: 0, total: 0 }));
    for (const section of METRICS) {
        for (const row of section.rows) {
            if (!row.better) continue;
            const vals = stocks.map(s => {
                if (!s) return null;
                if (row.compute) return row.compute(s);
                return s[row.key] ?? null;
            });
            const validVals = vals.filter(v => v != null && v > 0);
            if (validVals.length < 2) continue;

            const bestVal = row.better === "higher" ? Math.max(...validVals) : Math.min(...validVals);
            vals.forEach((v, i) => {
                if (v != null && v > 0) {
                    scores[i].total++;
                    if (v === bestVal) scores[i].wins++;
                }
            });
        }
    }
    return scores;
}

/** Visual bar for a metric value relative to the max */
function MetricBar({ value, maxVal, color }) {
    if (value == null || maxVal == null || maxVal === 0) return null;
    const pct = Math.min(Math.abs(value / maxVal) * 100, 100);
    return (
        <div className="h-1 bg-surface-elevated rounded-full mt-1 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
    );
}

export default function ComparisonPage() {
    const [slots, setSlots] = useState(["", ""]);
    const [stocks, setStocks] = useState([null, null]);
    const [loadings, setLoadings] = useState([false, false]);

    const addSlot = () => {
        if (slots.length >= MAX_STOCKS) return;
        setSlots([...slots, ""]);
        setStocks([...stocks, null]);
        setLoadings([...loadings, false]);
    };

    const removeSlot = (idx) => {
        if (slots.length <= 2) return;
        setSlots(slots.filter((_, i) => i !== idx));
        setStocks(stocks.filter((_, i) => i !== idx));
        setLoadings(loadings.filter((_, i) => i !== idx));
    };

    const setTicker = (idx, val) => {
        const newSlots = [...slots];
        newSlots[idx] = val;
        setSlots(newSlots);
    };

    const fetchStock = async (idx) => {
        const ticker = slots[idx];
        if (!ticker) return;

        const newLoadings = [...loadings];
        newLoadings[idx] = true;
        setLoadings(newLoadings);

        try {
            let symbol = ticker.toUpperCase();
            if (!symbol.includes(".")) symbol += ".JK";
            const res = await fetch(`/api/stocks/${encodeURIComponent(symbol)}/fundamental`);
            const json = await res.json();
            const newStocks = [...stocks];
            if (json.success) {
                newStocks[idx] = json.data;
            } else {
                toast.error(`Gagal memuat ${symbol}`);
                newStocks[idx] = null;
            }
            setStocks(newStocks);
        } catch {
            toast.error(`Error loading ${ticker}`);
        } finally {
            const nl = [...loadings];
            nl[idx] = false;
            setLoadings(nl);
        }
    };

    const loadPreset = async (preset) => {
        const tickers = preset.tickers;
        const newSlots = [...tickers];
        while (newSlots.length < 2) newSlots.push("");
        setSlots(newSlots);
        setStocks(new Array(newSlots.length).fill(null));
        setLoadings(new Array(newSlots.length).fill(true));

        const results = await Promise.allSettled(
            tickers.map(async (t) => {
                const symbol = t.includes(".") ? t : t + ".JK";
                const res = await fetch(`/api/stocks/${encodeURIComponent(symbol)}/fundamental`);
                const json = await res.json();
                return json.success ? json.data : null;
            })
        );

        const newStocks = results.map(r => r.status === "fulfilled" ? r.value : null);
        while (newStocks.length < 2) newStocks.push(null);
        setStocks(newStocks);
        setLoadings(new Array(newStocks.length).fill(false));
    };

    const loadedStocks = stocks.filter(Boolean);
    const scores = useMemo(() => computeScores(stocks), [stocks]);

    // Find winner
    const winnerIdx = scores.reduce((best, s, i) => (s.wins > (scores[best]?.wins || 0) ? i : best), 0);

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-text-primary mb-2 flex items-center gap-2">
                ⚖️ Bandingkan Saham
            </h1>
            <p className="text-sm text-text-muted mb-6">
                Bandingkan fundamental hingga {MAX_STOCKS} saham secara bersamaan
            </p>

            {/* ── Quick Presets ── */}
            <div className="flex flex-wrap gap-2 mb-5">
                {PRESETS.map((p) => (
                    <button
                        key={p.label}
                        onClick={() => loadPreset(p)}
                        className="text-xs bg-surface-card border border-border rounded-lg px-3 py-1.5 text-text-muted hover:border-accent hover:text-accent transition-colors cursor-pointer"
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* ── Search Inputs ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {slots.map((ticker, idx) => (
                    <form
                        key={idx}
                        onSubmit={(e) => { e.preventDefault(); fetchStock(idx); }}
                        className="bg-surface-card border border-border rounded-xl p-3 relative"
                    >
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[10px] text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                                Stock {idx + 1}
                            </label>
                            {slots.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => removeSlot(idx)}
                                    className="text-text-muted hover:text-red-400 text-xs cursor-pointer"
                                >✕</button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={ticker}
                                onChange={(e) => setTicker(idx, e.target.value)}
                                placeholder="e.g. BBRI"
                                className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                            />
                            <button
                                type="submit"
                                disabled={loadings[idx]}
                                className="bg-accent text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-accent-hover disabled:opacity-50 cursor-pointer"
                            >
                                {loadings[idx] ? "..." : "Load"}
                            </button>
                        </div>
                        {stocks[idx] && (
                            <p className="text-[10px] text-text-muted mt-1.5 truncate">
                                {stocks[idx].sector} • {stocks[idx].industry}
                            </p>
                        )}
                    </form>
                ))}

                {slots.length < MAX_STOCKS && (
                    <button
                        onClick={addSlot}
                        className="border-2 border-dashed border-border rounded-xl p-3 flex items-center justify-center text-text-muted hover:border-accent hover:text-accent transition-colors cursor-pointer min-h-[88px]"
                    >
                        <span className="text-2xl mr-2">+</span>
                        <span className="text-sm">Tambah Saham</span>
                    </button>
                )}
            </div>

            {/* ── Score Summary ── */}
            {loadedStocks.length >= 2 && (
                <div className="bg-surface-card border border-border rounded-2xl p-5 mb-6 animate-fade-in">
                    <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
                        🏆 Skor Perbandingan
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {stocks.map((s, i) => {
                            if (!s) return null;
                            const score = scores[i];
                            const pct = score.total > 0 ? Math.round((score.wins / score.total) * 100) : 0;
                            const isWinner = i === winnerIdx && score.wins > 0;
                            return (
                                <div
                                    key={i}
                                    className={`rounded-xl p-4 border text-center transition-all ${isWinner
                                            ? "border-accent/50 bg-accent/5 shadow-lg shadow-accent/10"
                                            : "border-border bg-surface-elevated/30"
                                        }`}
                                >
                                    {isWinner && <p className="text-xs mb-1">🏆</p>}
                                    <p className="text-lg font-bold text-text-primary" style={{ color: COLORS[i] }}>
                                        {s.ticker?.replace(".JK", "")}
                                    </p>
                                    <p className="text-3xl font-black text-text-primary mt-1">{pct}%</p>
                                    <p className="text-[10px] text-text-muted mt-1">
                                        {score.wins} / {score.total} metrik unggul
                                    </p>
                                    {/* Score bar */}
                                    <div className="h-1.5 bg-surface rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{ width: `${pct}%`, backgroundColor: COLORS[i] }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Comparison Table ── */}
            {loadedStocks.length >= 1 && (
                <div className="bg-surface-card border border-border rounded-2xl shadow-sm animate-fade-in overflow-hidden">
                    {METRICS.map((section) => (
                        <div key={section.section}>
                            {/* Section Header */}
                            <div className="bg-surface-elevated/60 px-5 py-2 border-b border-border/50">
                                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                                    {section.section}
                                </h3>
                            </div>

                            {/* Column Headers */}
                            <div
                                className="grid gap-2 px-5 py-2 border-b border-border/30 text-[10px] text-text-muted uppercase tracking-wider"
                                style={{ gridTemplateColumns: `1fr repeat(${slots.length}, 1fr)` }}
                            >
                                <span>Metrik</span>
                                {stocks.map((s, i) => (
                                    <span key={i} className="text-right font-medium" style={{ color: COLORS[i] }}>
                                        {s?.ticker?.replace(".JK", "") || `Stock ${i + 1}`}
                                    </span>
                                ))}
                            </div>

                            {/* Rows */}
                            {section.rows.map((row) => {
                                const vals = stocks.map(s => {
                                    if (!s) return null;
                                    if (row.compute) return row.compute(s);
                                    return s[row.key] ?? null;
                                });
                                const numericVals = vals.filter(v => v != null && typeof v === "number" && v > 0);
                                const maxVal = numericVals.length > 0 ? Math.max(...numericVals.map(Math.abs)) : null;

                                // Find the best value
                                let bestIdx = -1;
                                if (row.better && numericVals.length >= 2) {
                                    const validPairs = vals.map((v, i) => ({ v, i })).filter(p => p.v != null && typeof p.v === "number" && p.v > 0);
                                    if (validPairs.length >= 2) {
                                        bestIdx = validPairs.reduce((best, p) => {
                                            if (row.better === "higher" && p.v > best.v) return p;
                                            if (row.better === "lower" && p.v < best.v) return p;
                                            return best;
                                        }).i;
                                    }
                                }

                                return (
                                    <div
                                        key={row.key}
                                        className="grid gap-2 px-5 py-3 border-b border-border/10 hover:bg-surface-elevated/30 transition-colors items-center"
                                        style={{ gridTemplateColumns: `1fr repeat(${slots.length}, 1fr)` }}
                                    >
                                        <span className="text-sm text-text-muted">{row.label}</span>
                                        {vals.map((v, i) => {
                                            const isBest = i === bestIdx;
                                            const colorClass = row.colorFn ? pctColor(v) : "text-text-primary";
                                            return (
                                                <div key={i} className="text-right">
                                                    <span className={`text-sm ${colorClass} ${isBest ? "font-bold" : ""}`}>
                                                        {formatVal(v, row.format, stocks[i]?.currency)}
                                                        {isBest && <span className="text-emerald-400 ml-1 text-[10px]">★</span>}
                                                    </span>
                                                    <MetricBar value={v} maxVal={maxVal} color={COLORS[i]} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {/* Source */}
                    <div className="px-5 py-3 text-right">
                        <p className="text-[10px] text-text-muted/50">
                            📡 Source: Yahoo Finance
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
