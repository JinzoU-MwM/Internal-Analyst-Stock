import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { createChart, LineSeries, LineStyle } from "lightweight-charts";
import { formatNumber, formatDec, formatPct } from "../utils/formatters";

const API = import.meta.env.VITE_API_URL || "";
const MEMBERS = ["Standard", "Small Cap", "Near Standard", "Near Small Cap", "All"];

// Default MSCI thresholds (Feb 2026 review)
const DEFAULTS = {
    standardFullMarketCap: 56097884000000,
    standardFreeFloatMarketCap: 28048942000000,
    smallFullMarketCap: 8648564000000,
    smallFreeFloatMarketCap: 4324282000000,
};

function msciNum(val) {
    if (val == null || isNaN(val)) return "—";
    const abs = Math.abs(val);
    if (abs >= 1e12) return (val / 1e12).toFixed(2) + "T";
    if (abs >= 1e9) return (val / 1e9).toFixed(2) + "B";
    if (abs >= 1e6) return (val / 1e6).toFixed(2) + "M";
    return val.toLocaleString("id-ID");
}

function pctBadge(val) {
    if (val == null) return "—";
    const pct = typeof val === "number" ? val : parseFloat(val);
    if (isNaN(pct)) return "—";
    const color = pct >= 100 ? "text-emerald-400" : pct >= 50 ? "text-yellow-400" : "text-red-400";
    return <span className={`font-semibold ${color}`}>{pct.toFixed(1)}%</span>;
}

function scoreBadge(score) {
    if (score == null) return "—";
    const bg = score >= 80 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
        : score >= 50 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
            : "bg-red-500/20 text-red-400 border-red-500/30";
    return (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${bg}`}>
            {score}
        </span>
    );
}

function memberBadge(member) {
    const colors = {
        Standard: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        "Small Cap": "bg-purple-500/20 text-purple-400 border-purple-500/30",
        "Near Standard": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
        "Near Small Cap": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };
    return (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${colors[member] || "bg-surface-elevated text-text-muted border-border"}`}>
            {member}
        </span>
    );
}

function statusBadge(near) {
    if (!near) return <span className="text-emerald-400 text-xs">✅ Masuk Kriteria Standard</span>;
    return <span className="text-yellow-400 text-xs">⚠️ {near}</span>;
}

/* ────────────────────────── History Chart ────────────────────── */
function HistoryChart({ stockCode, thresholds, member }) {
    const chartRef = useRef(null);
    const containerRef = useRef(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState("mcap"); // mcap | price | shares

    useEffect(() => {
        if (!stockCode) return;
        setLoading(true);
        fetch(`${API}/api/msci/history/${stockCode}`)
            .then(r => r.json())
            .then(d => {
                if (d.success && d.data) setHistory(d.data);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [stockCode]);

    useEffect(() => {
        if (!containerRef.current || history.length === 0) return;

        // Clean up previous chart
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
        }

        const chart = createChart(containerRef.current, {
            width: containerRef.current.clientWidth,
            height: 320,
            layout: {
                background: { color: "transparent" },
                textColor: "#9ca3af",
                fontSize: 11,
            },
            grid: {
                vertLines: { color: "rgba(255,255,255,0.04)" },
                horzLines: { color: "rgba(255,255,255,0.04)", style: LineStyle.Dashed },
            },
            rightPriceScale: {
                borderColor: "rgba(255,255,255,0.1)",
            },
            timeScale: {
                borderColor: "rgba(255,255,255,0.1)",
                timeVisible: false,
            },
            crosshair: {
                horzLine: { color: "rgba(255,255,255,0.15)" },
                vertLine: { color: "rgba(255,255,255,0.15)" },
            },
        });
        chartRef.current = chart;

        const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));

        if (tab === "mcap") {
            // Full Market Cap line
            const fullSeries = chart.addSeries(LineSeries, {
                color: "#22c55e",
                lineWidth: 2,
                title: "Full Market Cap",
                priceFormat: {
                    type: "custom",
                    formatter: v => msciNum(v),
                },
            });
            fullSeries.setData(sorted.map(d => ({ time: d.date, value: d.fullMarketCap })));

            // FF Market Cap line
            const ffSeries = chart.addSeries(LineSeries, {
                color: "#60a5fa",
                lineWidth: 2,
                title: "FF Market Cap",
                priceFormat: {
                    type: "custom",
                    formatter: v => msciNum(v),
                },
            });
            ffSeries.setData(sorted.map(d => ({ time: d.date, value: d.freeFloatMarketCap })));

            // Std Full threshold line
            const isSmall = member === "Small Cap";
            const stdFull = isSmall ? thresholds.smallFullMarketCap : thresholds.standardFullMarketCap;
            const stdFF = isSmall ? thresholds.smallFreeFloatMarketCap : thresholds.standardFreeFloatMarketCap;

            const fullThreshold = chart.addSeries(LineSeries, {
                color: "#f87171",
                lineWidth: 1,
                lineStyle: LineStyle.Dashed,
                title: `${isSmall ? "Small" : "Std"} Full: ${msciNum(stdFull)}`,
                crosshairMarkerVisible: false,
                lastValueVisible: true,
                priceFormat: { type: "custom", formatter: v => msciNum(v) },
            });
            fullThreshold.setData(sorted.map(d => ({ time: d.date, value: stdFull })));

            const ffThreshold = chart.addSeries(LineSeries, {
                color: "#38bdf8",
                lineWidth: 1,
                lineStyle: LineStyle.Dashed,
                title: `${isSmall ? "Small" : "Std"} FF: ${msciNum(stdFF)}`,
                crosshairMarkerVisible: false,
                lastValueVisible: true,
                priceFormat: { type: "custom", formatter: v => msciNum(v) },
            });
            ffThreshold.setData(sorted.map(d => ({ time: d.date, value: stdFF })));

        } else if (tab === "price") {
            const priceSeries = chart.addSeries(LineSeries, {
                color: "#a78bfa",
                lineWidth: 2,
                title: "Close Price",
                priceFormat: { type: "price", precision: 0, minMove: 1 },
            });
            priceSeries.setData(sorted.map(d => ({ time: d.date, value: d.closePrice })));

        } else if (tab === "shares") {
            const sharesSeries = chart.addSeries(LineSeries, {
                color: "#fbbf24",
                lineWidth: 2,
                title: "Listed Shares",
                priceFormat: {
                    type: "custom",
                    formatter: v => msciNum(v),
                },
            });
            sharesSeries.setData(sorted.map(d => ({ time: d.date, value: d.listedShares })));
        }

        chart.timeScale().fitContent();

        // Resize handling
        const ro = new ResizeObserver(entries => {
            for (const entry of entries) {
                chart.applyOptions({ width: entry.contentRect.width });
            }
        });
        ro.observe(containerRef.current);

        return () => {
            ro.disconnect();
            chart.remove();
            chartRef.current = null;
        };
    }, [history, tab, thresholds, member]);

    const TABS = [
        { key: "mcap", label: "MARKET CAP" },
        { key: "price", label: "PRICE" },
        { key: "shares", label: "SHARES" },
    ];

    return (
        <div className="px-5 pb-4">
            <div className="bg-surface-elevated border border-border rounded-xl overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-border/50">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-4 py-2.5 text-xs font-semibold tracking-wide transition-colors cursor-pointer ${tab === t.key
                                ? "text-accent border-b-2 border-accent"
                                : "text-text-muted hover:text-text-primary"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Chart Title */}
                <div className="px-4 pt-3">
                    <p className="text-sm font-semibold text-text-primary">
                        {tab === "mcap" ? "Market Cap History vs Thresholds" : tab === "price" ? "Price History" : "Listed Shares History"}
                    </p>
                </div>

                {/* Chart Container */}
                <div className="p-3">
                    {loading ? (
                        <div className="h-[320px] flex items-center justify-center">
                            <div className="animate-spin h-6 w-6 border-2 border-accent border-t-transparent rounded-full"></div>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="h-[320px] flex items-center justify-center text-text-muted text-sm">
                            No historical data available
                        </div>
                    ) : (
                        <div ref={containerRef} />
                    )}
                </div>

                {/* Legend for mcap tab */}
                {tab === "mcap" && !loading && history.length > 0 && (
                    <div className="flex flex-wrap items-center gap-4 px-4 pb-3 text-[10px] text-text-muted">
                        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-500 inline-block rounded"></span> Full Market Cap</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400 inline-block rounded"></span> FF Market Cap</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t border-dashed border-red-400 inline-block" style={{ width: 12 }}></span> Std Full</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t border-dashed border-sky-400 inline-block" style={{ width: 12 }}></span> Std FF</span>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ────────────────────────── Detail Modal ────────────────────────── */
function DetailModal({ stock, thresholds, onClose }) {
    if (!stock) return null;

    const fullCap = stock.fullMarketCap;
    const ffCap = stock.freeFloatMarketCap;
    const ffPct = stock.freeFloatPct;

    const isSmall = stock.member === "Small Cap";
    const passFullCap = fullCap >= (isSmall ? thresholds.smallFullMarketCap : thresholds.standardFullMarketCap);
    const passFFCap = ffCap >= (isSmall ? thresholds.smallFreeFloatMarketCap : thresholds.standardFreeFloatMarketCap);
    const passFreeFloat = ffPct >= 15;

    const targetFullCap = isSmall ? thresholds.smallFullMarketCap : thresholds.standardFullMarketCap;
    const targetFFCap = isSmall ? thresholds.smallFreeFloatMarketCap : thresholds.standardFreeFloatMarketCap;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-surface-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-border flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-bold text-text-primary">{stock.stockCode}</h2>
                            <span className="text-sm text-text-muted">{stock.stockName}</span>
                            {memberBadge(stock.member)}
                            {scoreBadge(stock.proximityScore)}
                        </div>
                        <p className="text-xs text-text-muted">MSCI Inclusion Analysis & Trends</p>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary text-2xl cursor-pointer">✕</button>
                </div>

                {/* ── Chart with Tabs ── */}
                <HistoryChart stockCode={stock.stockCode} thresholds={thresholds} member={stock.member} />

                {/* Market Cap Cards */}
                <div className="px-5 pb-4 grid grid-cols-3 gap-3">
                    <div className="bg-surface-elevated border border-border rounded-xl p-4">
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Full Market Cap</p>
                        <p className="text-xl font-black text-text-primary">{msciNum(fullCap)}</p>
                        <p className="text-xs mt-1">
                            Target: {msciNum(targetFullCap)}{" "}
                            <span className={passFullCap ? "text-emerald-400" : "text-red-400"}>
                                ({passFullCap ? "Pass" : "Fail"})
                            </span>
                        </p>
                    </div>

                    <div className="bg-surface-elevated border border-accent/30 rounded-xl p-4 relative">
                        <span className="absolute -top-2 left-3 text-[9px] bg-accent text-white px-2 py-0.5 rounded-md font-semibold">PRIMARY DRIVER</span>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Free Float Cap</p>
                        <p className="text-xl font-black text-accent">{msciNum(ffCap)}</p>
                        <p className="text-xs mt-1">
                            Target: {msciNum(targetFFCap)}{" "}
                            <span className={passFFCap ? "text-emerald-400" : "text-red-400"}>
                                ({passFFCap ? "Pass" : "Fail"})
                            </span>
                        </p>
                    </div>

                    <div className="bg-surface-elevated border border-border rounded-xl p-4">
                        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Free Float %</p>
                        <p className="text-xl font-black text-emerald-400">{formatDec(ffPct)}%</p>
                        <p className="text-xs mt-1">
                            Target: 15.0%{" "}
                            <span className={passFreeFloat ? "text-emerald-400" : "text-red-400"}>
                                ({passFreeFloat ? "Pass" : "Fail"})
                            </span>
                        </p>
                    </div>
                </div>

                {/* Liquidity Profile */}
                <div className="px-5 pb-4">
                    <div className="bg-surface-elevated border border-border rounded-xl p-4">
                        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Liquidity Profile</h4>
                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <p className="text-[10px] text-text-muted">ATVR 3M</p>
                                <p className="text-lg font-bold text-text-primary">{formatDec(stock.atvr3m)}%</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-text-muted">ATVR 12M</p>
                                <p className="text-lg font-bold text-text-primary">{formatDec(stock.atvr12m)}%</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-text-muted">FOT 12M</p>
                                <p className={`text-lg font-bold ${stock.fot12m >= 100 ? "text-emerald-400" : "text-yellow-400"}`}>
                                    {formatDec(stock.fot12m, 0)}%
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] text-text-muted">Trading Days 12M</p>
                                <p className="text-lg font-bold text-text-primary">{stock.tradedDays}/{stock.totalDays}</p>
                                <p className="text-[10px] text-emerald-400">
                                    {stock.totalDays > 0 ? ((stock.tradedDays / stock.totalDays) * 100).toFixed(1) : 0}% active
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Source */}
                <div className="px-5 pb-4 text-right">
                    <p className="text-[10px] text-text-muted/50">📡 Source: tradersaham.com</p>
                </div>
            </div>
        </div>
    );
}

/* ────────────────────────── Main Page ────────────────────────── */
export default function MSCIScreenerPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [member, setMember] = useState("Standard");
    const [date, setDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 1); // Yesterday
        return d.toISOString().split("T")[0];
    });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [count, setCount] = useState(0);
    const [search, setSearch] = useState("");
    const [selectedStock, setSelectedStock] = useState(null);
    const [sortBy, setSortBy] = useState("score");
    const [sortOrder, setSortOrder] = useState("DESC");
    const limit = 20;

    const fetchScreener = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                date,
                limit: String(limit),
                page: String(page),
                sortBy,
                sortOrder,
                ...DEFAULTS,
                method: "ksei_holders",
            });
            if (member !== "All") params.set("member", member);

            const res = await fetch(`${API}/api/msci/screener?${params}`);
            const json = await res.json();

            if (json.success) {
                setData(json.data || []);
                setTotalPages(json.total_pages || 1);
                setCount(json.count || 0);
            } else {
                toast.error(json.error || "Gagal memuat data MSCI");
                setData([]);
            }
        } catch (err) {
            toast.error("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    }, [date, page, member, sortBy, sortOrder]);

    useEffect(() => { fetchScreener(); }, [fetchScreener]);

    const filtered = search
        ? data.filter(d => d.stockCode?.toLowerCase().includes(search.toLowerCase()) || d.stockName?.toLowerCase().includes(search.toLowerCase()))
        : data;

    const toggleSort = (col) => {
        if (sortBy === col) {
            setSortOrder(prev => prev === "DESC" ? "ASC" : "DESC");
        } else {
            setSortBy(col);
            setSortOrder("DESC");
        }
        setPage(1);
    };

    const SortHeader = ({ col, label, className = "" }) => (
        <th
            className={`py-3 px-3 text-[10px] font-semibold text-text-muted uppercase tracking-wider cursor-pointer hover:text-accent select-none transition-colors ${className}`}
            onClick={() => toggleSort(col)}
        >
            <div className="flex items-center gap-1 justify-end">
                <span>{label}</span>
                {sortBy === col && (
                    <span className="text-accent">{sortOrder === "DESC" ? "↓" : "↑"}</span>
                )}
            </div>
        </th>
    );

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">MSCI Screener</h1>
                    <p className="text-sm text-text-muted">
                        Filter stocks based on MSCI criteria: Full Market Cap, Free Float Market Cap, ATVR (liquidity), and FOT.
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
                {/* Date */}
                <div className="flex items-center gap-2 bg-surface-card border border-border rounded-lg px-3 py-2">
                    <span className="text-xs text-text-muted">DATE</span>
                    <input
                        type="date"
                        value={date}
                        onChange={e => { setDate(e.target.value); setPage(1); }}
                        className="bg-transparent text-sm text-text-primary focus:outline-none cursor-pointer"
                    />
                </div>

                {/* Member Tabs */}
                <div className="flex gap-1 bg-surface-card border border-border rounded-lg p-1">
                    {MEMBERS.map(m => (
                        <button
                            key={m}
                            onClick={() => { setMember(m); setPage(1); }}
                            className={`text-xs px-3 py-1.5 rounded-md transition-all cursor-pointer ${member === m
                                ? "bg-accent text-white font-semibold"
                                : "text-text-muted hover:text-text-primary"
                                }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="🔍 Search ticker..."
                    className="bg-surface-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none w-40"
                />
            </div>

            {/* Count & Pagination */}
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-text-muted">
                    TOTAL: <span className="font-bold text-text-primary">{count} CANDIDATES</span>
                </p>
                <div className="flex items-center gap-1">
                    <button onClick={() => setPage(1)} disabled={page <= 1} className="p-1.5 rounded-md bg-surface-card border border-border text-text-muted hover:text-accent disabled:opacity-30 cursor-pointer text-xs">⟨⟨</button>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-md bg-surface-card border border-border text-text-muted hover:text-accent disabled:opacity-30 cursor-pointer text-xs">⟨</button>
                    <span className="text-sm text-text-muted px-2">{page} / {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded-md bg-surface-card border border-border text-text-muted hover:text-accent disabled:opacity-30 cursor-pointer text-xs">⟩</button>
                    <button onClick={() => setPage(totalPages)} disabled={page >= totalPages} className="p-1.5 rounded-md bg-surface-card border border-border text-text-muted hover:text-accent disabled:opacity-30 cursor-pointer text-xs">⟩⟩</button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-surface-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-surface-elevated/50">
                                <th className="py-3 px-3 text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider w-32">Kode</th>
                                <SortHeader col="fullMarketCap" label="Full MCap" />
                                <SortHeader col="freeFloatMarketCap" label="FF MCap (IDX)" />
                                <SortHeader col="freeFloatPct" label="Free Float %" />
                                <SortHeader col="atvr3m" label="ATVR 3M" />
                                <SortHeader col="atvr12m" label="ATVR 12M" />
                                <th className="py-3 px-3 text-right text-[10px] font-semibold text-text-muted uppercase tracking-wider">Trading Days</th>
                                <SortHeader col="fot12m" label="FOT 12M" />
                                <SortHeader col="score" label="Score" />
                                <th className="py-3 px-3 text-center text-[10px] font-semibold text-text-muted uppercase tracking-wider">Category</th>
                                <th className="py-3 px-3 text-center text-[10px] font-semibold text-text-muted uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={11} className="py-20 text-center text-text-muted">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full"></div>
                                            <span className="text-sm">Loading MSCI data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="py-20 text-center text-text-muted">
                                        <p className="text-lg mb-1">📭</p>
                                        <p className="text-sm">Tidak ada data ditemukan</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((row, idx) => (
                                    <tr
                                        key={row.stockCode}
                                        className="border-b border-border/30 hover:bg-surface-elevated/40 transition-colors cursor-pointer"
                                        onClick={() => setSelectedStock(row)}
                                    >
                                        {/* Ticker */}
                                        <td className="py-3 px-3">
                                            <div>
                                                <p className="text-sm font-bold text-accent hover:underline">{row.stockCode}</p>
                                                <p className="text-[10px] text-text-muted truncate max-w-[120px]">{row.stockName}</p>
                                            </div>
                                        </td>
                                        {/* Full MCap */}
                                        <td className="py-3 px-3 text-right text-sm text-text-primary font-medium">{msciNum(row.fullMarketCap)}</td>
                                        {/* FF MCap */}
                                        <td className="py-3 px-3 text-right text-sm text-accent font-medium">{msciNum(row.freeFloatMarketCap)}</td>
                                        {/* FF % */}
                                        <td className="py-3 px-3 text-right text-sm font-semibold text-emerald-400">{formatDec(row.freeFloatPct)}%</td>
                                        {/* ATVR 3M */}
                                        <td className="py-3 px-3 text-right text-sm text-text-primary">{formatDec(row.atvr3m)}%</td>
                                        {/* ATVR 12M */}
                                        <td className="py-3 px-3 text-right text-sm text-text-primary">{formatDec(row.atvr12m)}%</td>
                                        {/* Trading Days */}
                                        <td className="py-3 px-3 text-right text-sm text-text-primary">{row.tradedDays}/{row.totalDays}</td>
                                        {/* FOT */}
                                        <td className="py-3 px-3 text-right">{pctBadge(row.fot12m)}</td>
                                        {/* Score */}
                                        <td className="py-3 px-3 text-center">{scoreBadge(row.proximityScore)}</td>
                                        {/* Category */}
                                        <td className="py-3 px-3 text-center">{memberBadge(row.member)}</td>
                                        {/* Status */}
                                        <td className="py-3 px-3 text-center">
                                            {!row.nearStatus
                                                ? <span className="text-emerald-400">✅</span>
                                                : <span className="text-yellow-400 text-xs">⚠️</span>
                                            }
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-border/50 text-right">
                    <p className="text-[10px] text-text-muted/50">📡 Source: tradersaham.com</p>
                </div>
            </div>

            {/* Detail Modal */}
            <DetailModal
                stock={selectedStock}
                thresholds={DEFAULTS}
                onClose={() => setSelectedStock(null)}
            />
        </div>
    );
}
