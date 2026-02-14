import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
    { label: "🚗 Automotive", tickers: ["ASII", "AUTO", "SMSM"] },
    { label: "🏥 Healthcare", tickers: ["HEAL", "SILO", "KLBF"] },
];

const POPULAR_STOCKS = [
    { ticker: "BBCA", name: "Bank Central Asia" },
    { ticker: "BBRI", name: "Bank Rakyat Indonesia" },
    { ticker: "TLKM", name: "Telkom Indonesia" },
    { ticker: "ASII", name: "Astra International" },
    { ticker: "UNVR", name: "Unilever Indonesia" },
    { ticker: "ADRO", name: "Adaro Energy" },
    { ticker: "BMRI", name: "Bank Mandiri" },
    { ticker: "ICBP", name: "Indofood CBP" },
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

/* ═══════════════════════ AUTOCOMPLETE INPUT ═════════════════ */
function StockSearchInput({ idx, color, value, stock, loading, onSelect, onRemove, canRemove }) {
    const [query, setQuery] = useState(value || "");
    const [open, setOpen] = useState(false);
    const [focusIdx, setFocusIdx] = useState(-1);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    const [suggestions, setSuggestions] = useState([]);
    const [searching, setSearching] = useState(false);
    const debounceRef = useRef(null);

    // Sync external value changes (e.g. preset loads)
    useEffect(() => { setQuery(value || ""); }, [value]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Debounced API search
    useEffect(() => {
        if (!query || query.length < 1) { setSuggestions([]); return; }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
                const json = await res.json();
                if (json.success) setSuggestions(json.results || []);
            } catch { /* silent */ }
            setSearching(false);
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query]);

    const handleSelect = useCallback((ticker) => {
        setQuery(ticker);
        setOpen(false);
        setFocusIdx(-1);
        onSelect(ticker);
    }, [onSelect]);

    const handleKeyDown = (e) => {
        if (!open || suggestions.length === 0) {
            // Allow Enter to submit even without dropdown
            if (e.key === "Enter" && query.trim()) {
                e.preventDefault();
                handleSelect(query.trim().toUpperCase());
            }
            return;
        }
        if (e.key === "ArrowDown") { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, suggestions.length - 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)); }
        else if (e.key === "Enter") {
            e.preventDefault();
            if (focusIdx >= 0 && focusIdx < suggestions.length) handleSelect(suggestions[focusIdx].ticker);
            else if (query.trim()) handleSelect(query.trim().toUpperCase());
        }
        else if (e.key === "Escape") { setOpen(false); }
    };

    const displayTicker = stock?.ticker?.replace(".JK", "");

    return (
        <div ref={wrapperRef} className="relative">
            <div className={`bg-surface-card border rounded-xl transition-all ${open && suggestions.length > 0 ? "border-accent shadow-lg shadow-accent/5" : "border-border"} ${loading ? "animate-pulse" : ""}`}>
                {/* Label row */}
                <div className="flex items-center justify-between px-3 pt-2.5 pb-0">
                    <label className="text-[10px] text-text-muted uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        Stock {idx + 1}
                    </label>
                    {canRemove && (
                        <button type="button" onClick={onRemove}
                            className="text-text-muted hover:text-red-400 text-xs cursor-pointer transition-colors w-5 h-5 flex items-center justify-center rounded hover:bg-red-400/10">✕</button>
                    )}
                </div>

                {/* Search input */}
                <div className="px-3 pb-2.5 pt-1">
                    <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted text-xs">🔍</span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setOpen(true); setFocusIdx(-1); }}
                            onFocus={() => query.length >= 1 && setOpen(true)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ketik kode saham..."
                            className="w-full bg-surface border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none placeholder:text-text-muted/40"
                        />
                        {loading && (
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                <span className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin inline-block" />
                            </span>
                        )}
                    </div>
                </div>

                {/* Loaded stock info */}
                {stock && !loading && (
                    <div className="px-3 pb-2.5 border-t border-border/30 pt-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold" style={{ color }}>{displayTicker}</span>
                            <span className="text-[10px] text-text-muted truncate">{stock.sector} • {stock.industry}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Dropdown */}
            {open && (suggestions.length > 0 || searching) && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-surface-card border border-border rounded-xl shadow-xl shadow-black/30 overflow-hidden max-h-64 overflow-y-auto">
                    {searching && suggestions.length === 0 && (
                        <div className="px-3 py-3 text-center text-xs text-text-muted">
                            <span className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin inline-block mr-2" />
                            Mencari...
                        </div>
                    )}
                    {suggestions.map((s, i) => (
                        <button
                            key={s.ticker}
                            onClick={() => handleSelect(s.ticker)}
                            className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors cursor-pointer border-b border-border/10 last:border-b-0 ${i === focusIdx ? "bg-accent/10" : "hover:bg-surface-elevated"}`}
                        >
                            <span className="text-sm font-bold text-accent min-w-[48px]">{s.ticker}</span>
                            <span className="text-xs text-text-muted truncate">{s.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════ SKELETON LOADER ════════════════════ */
function SkeletonTable() {
    return (
        <div className="bg-surface-card border border-border rounded-2xl overflow-hidden animate-pulse">
            {/* Header */}
            <div className="bg-surface-elevated/60 px-5 py-3 border-b border-border/50">
                <div className="h-3 bg-border/30 rounded w-24" />
            </div>
            {/* Column headers */}
            <div className="grid grid-cols-3 gap-4 px-5 py-3 border-b border-border/30">
                <div className="h-2.5 bg-border/20 rounded w-16" />
                <div className="h-2.5 bg-border/20 rounded w-12 ml-auto" />
                <div className="h-2.5 bg-border/20 rounded w-12 ml-auto" />
            </div>
            {/* Rows */}
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="grid grid-cols-3 gap-4 px-5 py-3 border-b border-border/10">
                    <div className="h-3 bg-border/15 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
                    <div className="h-3 bg-border/15 rounded w-16 ml-auto" />
                    <div className="h-3 bg-border/15 rounded w-14 ml-auto" />
                </div>
            ))}
        </div>
    );
}

/* ═══════════════════════ MAIN PAGE ══════════════════════════ */
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

    const fetchStock = async (idx, ticker) => {
        if (!ticker) return;

        const newSlots = [...slots];
        newSlots[idx] = ticker;
        setSlots(newSlots);

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

    const loadPopularStock = (ticker) => {
        // Find first empty slot, or add new slot
        const emptyIdx = slots.findIndex(s => !s);
        if (emptyIdx >= 0) {
            fetchStock(emptyIdx, ticker);
        } else if (slots.length < MAX_STOCKS) {
            const newSlots = [...slots, ticker];
            const newStocks = [...stocks, null];
            const newLoadings = [...loadings, false];
            setSlots(newSlots);
            setStocks(newStocks);
            setLoadings(newLoadings);
            // Fetch after state update
            setTimeout(() => fetchStock(newSlots.length - 1, ticker), 0);
        }
    };

    const loadedStocks = stocks.filter(Boolean);
    const scores = useMemo(() => computeScores(stocks), [stocks]);
    const winnerIdx = scores.reduce((best, s, i) => (s.wins > (scores[best]?.wins || 0) ? i : best), 0);

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2.5">
                    <span className="text-3xl">⚖️</span> Bandingkan Saham
                </h1>
                <p className="text-sm text-text-muted mt-1">
                    Bandingkan fundamental hingga {MAX_STOCKS} saham secara bersamaan
                </p>
            </div>

            {/* ── Search Inputs ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {slots.map((ticker, idx) => (
                    <StockSearchInput
                        key={idx}
                        idx={idx}
                        color={COLORS[idx]}
                        value={ticker}
                        stock={stocks[idx]}
                        loading={loadings[idx]}
                        onSelect={(t) => fetchStock(idx, t)}
                        onRemove={() => removeSlot(idx)}
                        canRemove={slots.length > 2}
                    />
                ))}

                {slots.length < MAX_STOCKS && (
                    <button
                        onClick={addSlot}
                        className="border-2 border-dashed border-border rounded-xl flex items-center justify-center text-text-muted hover:border-accent hover:text-accent transition-all cursor-pointer group"
                        style={{ minHeight: "88px" }}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-2xl group-hover:scale-110 transition-transform">+</span>
                            <span className="text-sm font-medium">Tambah Saham</span>
                        </div>
                    </button>
                )}
            </div>

            {/* ── Quick Filter Chips ── */}
            <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold self-center mr-1">Quick:</span>
                {PRESETS.map((p) => (
                    <button
                        key={p.label}
                        onClick={() => loadPreset(p)}
                        className="text-xs bg-surface-card border border-border rounded-full px-4 py-2 text-text-muted hover:border-accent hover:text-accent hover:bg-accent/5 transition-all cursor-pointer font-medium"
                    >
                        {p.label}
                    </button>
                ))}
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
            {loadedStocks.length >= 1 ? (
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
            ) : (
                /* ── Empty State ── */
                <div className="space-y-6">
                    {/* Skeleton Preview */}
                    <SkeletonTable />

                    {/* Popular Stocks */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-base">🔥</span>
                            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
                                Pencarian Terpopuler
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {POPULAR_STOCKS.map((s) => (
                                <button
                                    key={s.ticker}
                                    onClick={() => loadPopularStock(s.ticker)}
                                    className="bg-surface-card border border-border rounded-xl p-3 text-left hover:border-accent hover:bg-accent/5 transition-all cursor-pointer group"
                                >
                                    <p className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">{s.ticker}</p>
                                    <p className="text-[10px] text-text-muted truncate">{s.name}</p>
                                </button>
                            ))}
                        </div>
                        <p className="text-center text-xs text-text-muted/50 mt-4">
                            Pilih saham di atas atau gunakan pencarian untuk mulai membandingkan
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
