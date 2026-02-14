import { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";

// ── Constants ──
const LOOKBACK_OPTIONS = [
    { value: 1, label: "1D" },
    { value: 3, label: "3D" },
    { value: 7, label: "7D" },
    { value: 14, label: "14D" },
    { value: 30, label: "30D" },
];

const STATUS_COLORS = {
    Bandar: "bg-red-500/20 text-red-400 border-red-500/30",
    Retail: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Whale: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "Retail / Bandar": "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const formatValue = (n) => {
    if (!n && n !== 0) return "-";
    const abs = Math.abs(n);
    const sign = n < 0 ? "-" : "";
    if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(1)} T`;
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(1)} B`;
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(0)} M`;
    return `${sign}${abs.toLocaleString("id-ID")}`;
};

// ── Mini Heatmap (inline bar chart of daily net values) ──
function MiniHeatmap({ dailyData }) {
    if (!dailyData?.length) return <span className="text-text-muted text-xs">—</span>;

    const maxAbs = Math.max(...dailyData.map((d) => Math.abs(d.net_value)), 1);

    return (
        <div className="flex items-end gap-[2px] h-5">
            {dailyData.map((d, i) => {
                const pct = Math.abs(d.net_value) / maxAbs;
                const h = Math.max(3, pct * 20);
                const isPositive = d.net_value >= 0;
                return (
                    <div
                        key={i}
                        className="w-[5px] rounded-[1px] shrink-0"
                        style={{
                            height: `${h}px`,
                            backgroundColor: isPositive ? "#22c55e" : "#ef4444",
                            opacity: 0.5 + pct * 0.5,
                        }}
                        title={`${new Date(d.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}: ${formatValue(d.net_value)}`}
                    />
                );
            })}
        </div>
    );
}

// ── Broker Selector ──
function BrokerSelector({ brokers, selected, onSelect }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const grouped = useMemo(() => {
        const groups = { Whale: [], Bandar: [], "Retail / Bandar": [], Retail: [] };
        (brokers || []).forEach((b) => {
            const key = groups[b.status] ? b.status : "Bandar";
            groups[key].push(b);
        });
        return groups;
    }, [brokers]);

    const selectedBroker = brokers?.find((b) => b.broker_code === selected);

    const filtered = useMemo(() => {
        if (!search) return grouped;
        const q = search.toLowerCase();
        const result = {};
        Object.entries(grouped).forEach(([k, v]) => {
            const f = v.filter((b) => b.broker_code.toLowerCase().includes(q) || b.broker_name.toLowerCase().includes(q));
            if (f.length > 0) result[k] = f;
        });
        return result;
    }, [grouped, search]);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 bg-surface-elevated border border-border rounded-xl px-4 py-2 text-sm text-text-primary hover:border-accent/50 transition-colors cursor-pointer"
            >
                <span className="font-bold text-accent">{selected}</span>
                <span className="text-text-muted truncate max-w-32">{selectedBroker?.broker_name || ""}</span>
                {selectedBroker && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${STATUS_COLORS[selectedBroker.status] || STATUS_COLORS.Bandar}`}>
                        {selectedBroker.status}
                    </span>
                )}
                <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 z-50 bg-surface-card border border-border rounded-xl shadow-xl w-80 max-h-96 overflow-hidden flex flex-col">
                        <div className="p-2 border-b border-border/50">
                            <input
                                autoFocus
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari broker..."
                                className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                            />
                        </div>
                        <div className="overflow-y-auto p-1">
                            {Object.entries(filtered).map(([status, items]) => (
                                <div key={status}>
                                    <p className="text-[10px] uppercase tracking-wider text-text-muted px-3 py-1.5 font-medium">{status}</p>
                                    {items.map((b) => (
                                        <button
                                            key={b.broker_code}
                                            onClick={() => { onSelect(b.broker_code); setOpen(false); setSearch(""); }}
                                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${b.broker_code === selected ? "bg-accent/10 text-accent" : "text-text-primary hover:bg-surface-elevated"
                                                }`}
                                        >
                                            <span className="font-bold w-7">{b.broker_code}</span>
                                            <span className="truncate">{b.broker_name}</span>
                                        </button>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// ── Flow Table (one side — Buy or Sell) ──
function FlowTable({ title, icon, stocks, loading, accentColor, limit, onLoadMore, hasMore }) {
    const isGreen = accentColor === "green";

    return (
        <div className="bg-surface-card border border-border rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <h3 className={`text-sm font-bold ${isGreen ? "text-emerald-400" : "text-red-400"}`}>{title}</h3>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Net Value</span>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[40px_60px_1fr_80px_65px_65px] gap-1 px-4 py-2 border-b border-border/30 text-[10px] uppercase tracking-wider text-text-muted font-medium">
                <span>Chart</span>
                <span>Stock</span>
                <span>Heatmap</span>
                <span className="text-right">Val</span>
                <span className="text-right">Avg</span>
                <span className="text-right">Ret %</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border/20">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="grid grid-cols-[40px_60px_1fr_80px_65px_65px] gap-1 px-4 py-3 animate-pulse">
                            <div className="h-4 w-4 bg-surface-elevated rounded" />
                            <div className="h-4 w-12 bg-surface-elevated rounded" />
                            <div className="h-4 bg-surface-elevated rounded" />
                            <div className="h-4 bg-surface-elevated rounded" />
                            <div className="h-4 bg-surface-elevated rounded" />
                            <div className="h-4 bg-surface-elevated rounded" />
                        </div>
                    ))
                ) : stocks?.length > 0 ? (
                    stocks.slice(0, limit).map((stock) => {
                        const ret = parseFloat(stock.period_return) || 0;
                        return (
                            <div
                                key={stock.stock_code}
                                className="grid grid-cols-[40px_60px_1fr_80px_65px_65px] gap-1 px-4 py-2.5 items-center hover:bg-surface-elevated/30 transition-colors"
                            >
                                {/* Chart icon */}
                                <button className="text-text-muted hover:text-accent transition-colors cursor-pointer" title="Lihat chart">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>

                                {/* Stock code */}
                                <span className={`text-xs font-bold ${isGreen ? "text-emerald-400" : "text-red-400"}`}>
                                    {stock.stock_code}
                                </span>

                                {/* Heatmap */}
                                <MiniHeatmap dailyData={stock.daily_data} />

                                {/* Value */}
                                <span className={`text-xs font-semibold text-right ${isGreen ? "text-emerald-400" : "text-red-400"}`}>
                                    {formatValue(stock.total_net_value)}
                                </span>

                                {/* Avg price */}
                                <span className="text-xs text-text-secondary text-right">
                                    {stock.broker_avg_price ? Number(stock.broker_avg_price).toLocaleString("id-ID") : "-"}
                                </span>

                                {/* Return */}
                                <span className={`text-xs font-semibold text-right ${ret >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                    {ret >= 0 ? "+" : ""}{stock.period_return}%
                                </span>
                            </div>
                        );
                    })
                ) : (
                    <div className="px-4 py-8 text-center text-text-muted text-xs">Tidak ada data</div>
                )}
            </div>

            {/* Load more */}
            {hasMore && !loading && (
                <div className="border-t border-border/30">
                    <button
                        onClick={onLoadMore}
                        className="w-full py-3 text-xs text-text-muted hover:text-accent transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                        Load More
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Main Page ──
export default function BrokerAnalysisPage() {
    const [brokers, setBrokers] = useState([]);
    const [selectedBroker, setSelectedBroker] = useState("AK");
    const [lookbackDays, setLookbackDays] = useState(7);
    const [buyData, setBuyData] = useState(null);
    const [sellData, setSellData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [brokersLoading, setBrokersLoading] = useState(true);
    const [buyLimit, setBuyLimit] = useState(10);
    const [sellLimit, setSellLimit] = useState(10);

    // Load broker list
    useEffect(() => {
        (async () => {
            try {
                const token = localStorage.getItem("ia_token");
                const res = await fetch("/api/brokers/list", { headers: { Authorization: `Bearer ${token}` } });
                const json = await res.json();
                if (json.success) setBrokers(json.data);
            } catch {
                toast.error("Gagal memuat daftar broker");
            } finally {
                setBrokersLoading(false);
            }
        })();
    }, []);

    // Fetch both accumulation + distribution in parallel
    const fetchFlow = useCallback(async () => {
        setLoading(true);
        setBuyLimit(10);
        setSellLimit(10);
        try {
            const token = localStorage.getItem("ia_token");
            const headers = { Authorization: `Bearer ${token}` };
            const [buyRes, sellRes] = await Promise.all([
                fetch(`/api/brokers/flow-trends?broker=${selectedBroker}&days=${lookbackDays}&type=accumulation&limit=20`, { headers }),
                fetch(`/api/brokers/flow-trends?broker=${selectedBroker}&days=${lookbackDays}&type=distribution&limit=20`, { headers }),
            ]);
            const [buyJson, sellJson] = await Promise.all([buyRes.json(), sellRes.json()]);

            setBuyData(buyJson.success ? buyJson.data : null);
            setSellData(sellJson.success ? sellJson.data : null);
        } catch {
            toast.error("Gagal memuat data broker");
        } finally {
            setLoading(false);
        }
    }, [selectedBroker, lookbackDays]);

    useEffect(() => {
        fetchFlow();
    }, [fetchFlow]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Analisis Broker
                    </h1>
                    <p className="text-sm text-text-muted mt-0.5">Lacak akumulasi & distribusi saham oleh broker</p>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-2">
                    {!brokersLoading && (
                        <BrokerSelector brokers={brokers} selected={selectedBroker} onSelect={setSelectedBroker} />
                    )}
                    <div className="flex gap-0.5 bg-surface-elevated/50 border border-border rounded-xl p-1">
                        {LOOKBACK_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setLookbackDays(opt.value)}
                                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${lookbackDays === opt.value
                                        ? "bg-accent/20 text-accent"
                                        : "text-text-muted hover:text-text-primary"
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Side-by-side tables */}
            <div className="grid gap-4 lg:grid-cols-2">
                <FlowTable
                    title="Top Buys"
                    icon="📈"
                    stocks={buyData?.stocks}
                    loading={loading}
                    accentColor="green"
                    limit={buyLimit}
                    hasMore={buyData?.stocks?.length > buyLimit}
                    onLoadMore={() => setBuyLimit((p) => p + 10)}
                />
                <FlowTable
                    title="Top Sells"
                    icon="📉"
                    stocks={sellData?.stocks}
                    loading={loading}
                    accentColor="red"
                    limit={sellLimit}
                    hasMore={sellData?.stocks?.length > sellLimit}
                    onLoadMore={() => setSellLimit((p) => p + 10)}
                />
            </div>
        </div>
    );
}
