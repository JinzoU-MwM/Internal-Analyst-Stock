import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

// ── Constants ──
const LOOKBACK_OPTIONS = [
    { value: 1, label: "1D" },
    { value: 3, label: "3D" },
    { value: 7, label: "7D" },
    { value: 14, label: "14D" },
    { value: 30, label: "30D" },
];

const STATUS_FILTERS = [
    { value: "Whale", label: "Whale", color: "bg-amber-500/20 text-amber-400 border-amber-500/40" },
    { value: "Bandar", label: "Bandar", color: "bg-red-500/20 text-red-400 border-red-500/40" },
    { value: "Retail / Bandar", label: "Mix", color: "bg-purple-500/20 text-purple-400 border-purple-500/40" },
    { value: "Retail", label: "Retail", color: "bg-blue-500/20 text-blue-400 border-blue-500/40" },
];

const formatValue = (n) => {
    if (!n && n !== 0) return "-";
    const v = typeof n === "string" ? parseFloat(n) : n;
    const abs = Math.abs(v);
    const sign = v >= 0 ? "+" : "-";
    if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(1)} T`;
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(1)} B`;
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(0)} M`;
    return `${sign}${abs.toLocaleString("id-ID")}`;
};

const formatPrice = (n) => {
    if (!n) return "-";
    const v = typeof n === "string" ? parseFloat(n) : n;
    return v.toLocaleString("id-ID");
};

// ── Daily Heatmap (inline bar for each day) ──
function DailyHeatmap({ dailyData }) {
    if (!dailyData?.length) return <span className="text-text-muted text-xs">—</span>;

    const maxAbs = Math.max(...dailyData.map((d) => Math.abs(d.n)), 1);
    const len = dailyData.length;

    return (
        <div className="flex items-center gap-1">
            <span className="text-[9px] text-text-muted whitespace-nowrap">D-{len - 1}</span>
            <div className="flex items-end gap-[2px] h-[22px]">
                {dailyData.map((d, i) => {
                    const pct = Math.abs(d.n) / maxAbs;
                    const h = Math.max(2, pct * 22);
                    return (
                        <div
                            key={i}
                            className="w-[6px] rounded-[1px] shrink-0 transition-all"
                            style={{
                                height: `${h}px`,
                                backgroundColor: d.n >= 0 ? "#22c55e" : "#ef4444",
                                opacity: 0.55 + pct * 0.45,
                            }}
                            title={`${d.d}: ${formatValue(d.n)} | Price: ${d.p?.toLocaleString("id-ID")}`}
                        />
                    );
                })}
            </div>
            <span className="text-[9px] text-text-muted">D0</span>
        </div>
    );
}

// ── Expanded Detail Row with Chart + Table ──
function ExpandedRow({ item }) {
    const daily = item.daily_data || [];
    if (!daily.length) return null;

    // Reverse so oldest first (D-N → D0)
    const sorted = [...daily].reverse();
    const len = sorted.length;

    // Extract values
    const netValues = sorted.map((d) => d.n);
    const prices = sorted.map((d) => d.p);
    const avgPrices = sorted.map((d) => d.a || d.p);

    // Chart dimensions
    const W = 400, H = 180, PAD_L = 52, PAD_R = 16, PAD_T = 16, PAD_B = 28;
    const plotW = W - PAD_L - PAD_R;
    const plotH = H - PAD_T - PAD_B;

    // Net value scale
    const nMin = Math.min(...netValues);
    const nMax = Math.max(...netValues);
    const nRange = nMax - nMin || 1;
    const toY_net = (v) => PAD_T + plotH - ((v - nMin) / nRange) * plotH;

    // Price scale (right axis)
    const pMin = Math.min(...prices);
    const pMax = Math.max(...prices);
    const pRange = pMax - pMin || 1;
    const toY_price = (v) => PAD_T + plotH - ((v - pMin) / pRange) * plotH;

    const toX = (i) => PAD_L + (i / Math.max(len - 1, 1)) * plotW;

    // Build SVG paths
    const netPath = sorted.map((_, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY_net(netValues[i])}`).join(" ");
    const netAreaPath = `${netPath} L${toX(len - 1)},${PAD_T + plotH} L${toX(0)},${PAD_T + plotH} Z`;
    const pricePath = sorted.map((_, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY_price(prices[i])}`).join(" ");

    // Y-axis ticks for net value (5 ticks)
    const netTicks = Array.from({ length: 5 }, (_, i) => nMin + (nRange * i) / 4);
    // Y-axis ticks for price (right side, 5 ticks)
    const priceTicks = Array.from({ length: 5 }, (_, i) => pMin + (pRange * i) / 4);

    // Format date for display: "13 Feb" from "2026-02-13"
    const fmtDate = (dateStr) => {
        if (!dateStr) return "";
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        const parts = dateStr.split("-");
        return `${parseInt(parts[2])} ${months[parseInt(parts[1]) - 1]}`;
    };

    return (
        <div className="px-4 py-5 bg-surface-elevated/10 border-t border-border/20">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5">
                {/* ── Left: Net Value Flow Chart ── */}
                <div className="bg-surface-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            Net Value Flow
                        </h4>
                        <div className="flex items-center gap-3 text-[10px]">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Net Value
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-blue-400" /> Harga
                            </span>
                        </div>
                    </div>
                    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 200 }}>
                        {/* Grid lines */}
                        {netTicks.map((_, i) => {
                            const y = PAD_T + (plotH * (4 - i)) / 4;
                            return <line key={i} x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />;
                        })}
                        {/* Net value area fill */}
                        <path d={netAreaPath} fill="rgba(34,197,94,0.08)" />
                        {/* Net value line */}
                        <path d={netPath} fill="none" stroke="#22c55e" strokeWidth={2} strokeLinejoin="round" />
                        {/* Price line (dashed) */}
                        <path d={pricePath} fill="none" stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="4,3" strokeLinejoin="round" />
                        {/* Net value dots */}
                        {sorted.map((_, i) => (
                            <circle key={`n${i}`} cx={toX(i)} cy={toY_net(netValues[i])} r={3} fill="#22c55e" stroke="#0a0f1a" strokeWidth={1.5} />
                        ))}
                        {/* Price dots */}
                        {sorted.map((_, i) => (
                            <circle key={`p${i}`} cx={toX(i)} cy={toY_price(prices[i])} r={2.5} fill="#60a5fa" stroke="#0a0f1a" strokeWidth={1.5} />
                        ))}
                        {/* Left Y-axis labels (Net Value) */}
                        {netTicks.map((v, i) => {
                            const y = PAD_T + (plotH * (4 - i)) / 4;
                            return (
                                <text key={`yl${i}`} x={PAD_L - 4} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.35)" fontSize={8}>
                                    {formatValue(v)}
                                </text>
                            );
                        })}
                        {/* Right Y-axis labels (Price) */}
                        {priceTicks.map((v, i) => {
                            const y = PAD_T + (plotH * (4 - i)) / 4;
                            return (
                                <text key={`yr${i}`} x={W - PAD_R + 4} y={y + 3} textAnchor="start" fill="rgba(96,165,250,0.5)" fontSize={8}>
                                    {formatPrice(v)}
                                </text>
                            );
                        })}
                        {/* X-axis labels */}
                        {sorted.map((_, i) => (
                            <text key={`x${i}`} x={toX(i)} y={H - 6} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={8}>
                                {i === 0 ? `D-${len - 1}` : i === len - 1 ? "D0" : `D-${len - 1 - i}`}
                            </text>
                        ))}
                    </svg>
                </div>

                {/* ── Right: Detail Harian Table ── */}
                <div className="bg-surface-card border border-border rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-border/50">
                        <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Detail Harian
                        </h4>
                    </div>
                    <div className="grid grid-cols-[1fr_80px_90px_70px] gap-1 px-4 py-2 border-b border-border/30 text-[10px] uppercase tracking-wider text-text-muted font-medium">
                        <span>Tanggal</span>
                        <span className="text-right">Avg Price</span>
                        <span className="text-right">Net Value</span>
                        <span className="text-right">Harga</span>
                    </div>
                    <div className="divide-y divide-border/10 max-h-[220px] overflow-y-auto">
                        {daily.map((d, i) => {
                            const dayLabel = i === 0 ? "D0" : `D-${i}`;
                            return (
                                <div key={d.d} className="grid grid-cols-[1fr_80px_90px_70px] gap-1 px-4 py-2 items-center hover:bg-surface-elevated/20 transition-colors">
                                    <span className="text-xs">
                                        <span className="text-accent font-semibold">{dayLabel}</span>
                                        <span className="text-text-muted ml-1">({fmtDate(d.d)})</span>
                                    </span>
                                    <span className="text-xs text-text-secondary text-right font-medium">
                                        {formatPrice(d.a || d.p)}
                                    </span>
                                    <span className={`text-xs font-bold text-right ${d.n >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                        {formatValue(d.n)}
                                    </span>
                                    <span className="text-xs text-text-primary text-right font-medium">
                                        {formatPrice(d.p)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Skeleton ──
const RowSkeleton = () => (
    <div className="grid grid-cols-[36px_60px_140px_1fr_100px_80px_80px_80px_36px] gap-2 px-4 py-3 animate-pulse items-center">
        {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-4 bg-surface-elevated/50 rounded" />
        ))}
    </div>
);

// ── Main Page ──
export default function BrokerIntelPage() {
    const [mode, setMode] = useState("accum");
    const [lookback, setLookback] = useState(7);
    const [statuses, setStatuses] = useState(["Bandar", "Whale"]);
    const [search, setSearch] = useState("");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [expandedIdx, setExpandedIdx] = useState(null);

    const toggleStatus = (s) => {
        setStatuses((prev) =>
            prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
        );
        setPage(1);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setExpandedIdx(null);
        try {
            const token = localStorage.getItem("ia_token");
            const brokerStatus = statuses.length > 0 ? statuses.join(",") : "Bandar,Whale";
            const qs = new URLSearchParams({
                limit: 20,
                page,
                sort_by: "net_value",
                mode,
                lookback_days: lookback,
                broker_status: brokerStatus,
            }).toString();

            const res = await fetch(`/api/brokers/intelligence?${qs}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (json.success) {
                setData(json.data);
            } else {
                toast.error(json.error || "Gagal memuat data");
                setData(null);
            }
        } catch {
            toast.error("Gagal memuat data broker intelligence");
        } finally {
            setLoading(false);
        }
    }, [mode, lookback, statuses, page]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const activities = data?.activities || [];
    const filteredActivities = search
        ? activities.filter(
            (a) =>
                a.stock_code.toLowerCase().includes(search.toLowerCase()) ||
                a.broker_code.toLowerCase().includes(search.toLowerCase())
        )
        : activities;

    const tradingDays = data?.total_trading_days || 0;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* ── Top Controls ── */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
                {/* Mode Toggle: Accum / Dist */}
                <div className="flex bg-surface-elevated/50 border border-border rounded-xl p-1 gap-0.5">
                    <button
                        onClick={() => { setMode("accum"); setPage(1); }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mode === "accum"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : "text-text-muted hover:text-text-primary"
                            }`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Accum
                    </button>
                    <button
                        onClick={() => { setMode("distri"); setPage(1); }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${mode === "distri"
                            ? "bg-red-500/20 text-red-400 border border-red-500/40"
                            : "text-text-muted hover:text-text-primary"
                            }`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                        Dist
                    </button>
                </div>

                {/* Search */}
                <div className="relative flex-1 min-w-[120px] max-w-[200px]">
                    <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value.toUpperCase())}
                        placeholder="KODE"
                        className="w-full bg-surface-elevated border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                    />
                </div>

                {/* Status Filters */}
                <div className="flex gap-1">
                    {STATUS_FILTERS.map((sf) => (
                        <button
                            key={sf.value}
                            onClick={() => toggleStatus(sf.value)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${statuses.includes(sf.value)
                                ? sf.color
                                : "bg-transparent text-text-muted border-border/50 hover:border-border"
                                }`}
                        >
                            {sf.label}
                        </button>
                    ))}
                </div>

                {/* Lookback */}
                <div className="flex gap-0.5 bg-surface-elevated/50 border border-border rounded-xl p-1 ml-auto">
                    {LOOKBACK_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => { setLookback(opt.value); setPage(1); }}
                            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${lookback === opt.value
                                ? "bg-accent/20 text-accent"
                                : "text-text-muted hover:text-text-primary"
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Trading days info */}
            {tradingDays > 0 && (
                <p className="text-[10px] text-text-muted mb-3">
                    Menampilkan {filteredActivities.length} aktivitas dari {tradingDays} hari trading
                </p>
            )}

            {/* ── Table ── */}
            <div className="bg-surface-card border border-border rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[36px_60px_140px_1fr_100px_80px_80px_80px_36px] gap-2 px-4 py-2.5 border-b border-border/50 text-[10px] uppercase tracking-wider text-text-muted font-medium items-center">
                    <span>#</span>
                    <span>Broker</span>
                    <span>Stock</span>
                    <span>Daily Heatmap</span>
                    <span className="text-right">Net Value</span>
                    <span className="text-center">Consistency</span>
                    <span className="text-right">Avg Price</span>
                    <span className="text-right">Float P/L</span>
                    <span />
                </div>

                {/* Rows */}
                <div className="divide-y divide-border/20">
                    {loading ? (
                        Array.from({ length: 10 }).map((_, i) => <RowSkeleton key={i} />)
                    ) : filteredActivities.length > 0 ? (
                        filteredActivities.map((item, idx) => {
                            const isExpanded = expandedIdx === idx;
                            const netVal = typeof item.net_value === "string" ? parseFloat(item.net_value) : item.net_value;
                            const floatPl = parseFloat(item.float_pl_pct) || 0;
                            const consistencyNum = parseInt(item.buy_days) || 0;
                            const totalDays = parseInt(item.active_days) || tradingDays;
                            const globalIdx = (page - 1) * 20 + idx + 1;

                            return (
                                <div key={`${item.broker_code}-${item.stock_code}-${idx}`}>
                                    <div
                                        className={`grid grid-cols-[36px_60px_140px_1fr_100px_80px_80px_80px_36px] gap-2 px-4 py-3 items-center transition-colors cursor-pointer ${isExpanded ? "bg-surface-elevated/20" : "hover:bg-surface-elevated/10"
                                            }`}
                                        onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                                    >
                                        {/* # */}
                                        <span className="text-xs text-text-muted font-medium">{globalIdx}</span>

                                        {/* Broker */}
                                        <span className={`text-xs font-bold ${item.broker_status === "Whale" ? "text-amber-400"
                                            : item.broker_status === "Bandar" ? "text-red-400"
                                                : item.broker_status === "Retail" ? "text-blue-400"
                                                    : "text-purple-400"
                                            }`}>
                                            {item.broker_code}
                                        </span>

                                        {/* Stock */}
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-text-primary truncate">{item.stock_code}</p>
                                            <p className="text-[10px] text-text-muted truncate">{item.stock_name}</p>
                                        </div>

                                        {/* Heatmap */}
                                        <DailyHeatmap dailyData={item.daily_data} />

                                        {/* Net Value */}
                                        <span className={`text-xs font-bold text-right ${netVal >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                            {formatValue(netVal)}
                                        </span>

                                        {/* Consistency */}
                                        <div className="flex justify-center">
                                            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold ${consistencyNum >= totalDays
                                                ? "bg-emerald-500/20 text-emerald-400"
                                                : consistencyNum >= totalDays * 0.7
                                                    ? "bg-emerald-500/10 text-emerald-400/80"
                                                    : "bg-surface-elevated text-text-muted"
                                                }`}>
                                                {item.buy_days}/{totalDays}
                                            </span>
                                        </div>

                                        {/* Avg Price */}
                                        <span className="text-xs text-text-secondary text-right font-medium">
                                            {formatPrice(item.avg_price)}
                                        </span>

                                        {/* Float P/L */}
                                        <span className={`text-xs font-bold text-right ${floatPl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                            {floatPl >= 0 ? "+" : ""}{floatPl.toFixed(2)}%
                                        </span>

                                        {/* Expand chevron */}
                                        <svg
                                            className={`w-4 h-4 text-text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>

                                    {/* Expanded detail */}
                                    {isExpanded && <ExpandedRow item={item} />}
                                </div>
                            );
                        })
                    ) : (
                        <div className="px-4 py-12 text-center text-text-muted text-sm">
                            Tidak ada data untuk konfigurasi ini
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {!loading && activities.length > 0 && (
                    <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-border/30">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="px-3 py-1.5 text-xs rounded-lg border border-border text-text-muted hover:text-text-primary disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
                        >
                            ← Prev
                        </button>
                        <span className="text-xs text-text-muted">Page {page}</span>
                        <button
                            disabled={activities.length < 20}
                            onClick={() => setPage((p) => p + 1)}
                            className="px-3 py-1.5 text-xs rounded-lg border border-border text-text-muted hover:text-text-primary disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
