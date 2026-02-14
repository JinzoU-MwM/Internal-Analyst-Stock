import { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";

const formatValue = (n) => {
    if (!n && n !== 0) return "-";
    const abs = Math.abs(n);
    const sign = n < 0 ? "-" : "+";
    if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(1)}M`;
    return `${sign}${abs.toLocaleString("id-ID")}`;
};

const formatVol = (n) => {
    if (!n && n !== 0) return "-";
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
    return n.toLocaleString("id-ID");
};

const PERIOD_OPTIONS = [
    { value: 1, label: "1D" },
    { value: 3, label: "3D" },
    { value: 5, label: "5D" },
    { value: 7, label: "7D" },
    { value: 14, label: "14D" },
    { value: 30, label: "30D" },
];

// ── Skeleton ──
const TableSkeleton = () => (
    <div className="animate-pulse space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 bg-surface-elevated/40 rounded" />
        ))}
    </div>
);

// ── Net bar indicator ──
function NetBar({ value, maxAbs }) {
    if (!value || !maxAbs) return <span className="text-text-muted text-xs">—</span>;
    const pct = Math.min((Math.abs(value) / maxAbs) * 100, 100);
    const isPositive = value >= 0;

    return (
        <div className="flex items-center gap-2 w-full">
            <div className="flex-1 h-3 bg-surface-elevated/40 rounded-full overflow-hidden relative">
                <div
                    className={`h-full rounded-full ${isPositive ? "bg-emerald-500/60" : "bg-red-500/60"}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

// ── Main ──
export default function BroksumPage() {
    const [ticker, setTicker] = useState("BBCA");
    const [inputVal, setInputVal] = useState("BBCA");
    const [period, setPeriod] = useState(7);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({ start: "", end: "" });

    // Get trading days first to determine date range
    const fetchTradingDays = useCallback(async (days) => {
        try {
            const token = localStorage.getItem("ia_token");
            const res = await fetch(`/api/brokers/trading-days?days=${days}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (json.success && json.data) {
                setDateRange({ start: json.data.start_date, end: json.data.end_date });
                return json.data;
            }
        } catch {
            // fallback: calculate manually
        }
        return null;
    }, []);

    const fetchBroksum = useCallback(async (stock, startDate, endDate) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("ia_token");
            const res = await fetch(
                `/api/brokers/broksum?stock_code=${stock}&start_date=${startDate}&end_date=${endDate}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const json = await res.json();
            if (json.success) {
                setData(json.data);
            } else {
                // If backend proxy fails (403), try direct call to tradersaham
                const directRes = await fetch(
                    `https://api.tradersaham.com/api/analytics/broksum?stock_code=${stock}&start_date=${startDate}&end_date=${endDate}&analyze=true`
                );
                if (directRes.ok) {
                    const directData = await directRes.json();
                    setData(directData);
                } else {
                    toast.error("API memerlukan autentikasi. Pastikan CORS diizinkan.");
                    setData(null);
                }
            }
        } catch {
            toast.error("Gagal memuat data broksum");
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // Combined fetch
    const loadData = useCallback(async () => {
        const td = await fetchTradingDays(period);
        if (td) {
            fetchBroksum(ticker, td.start_date, td.end_date);
        }
    }, [ticker, period, fetchTradingDays, fetchBroksum]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSearch = (e) => {
        e.preventDefault();
        const clean = inputVal.replace(/\.JK$/i, "").toUpperCase().trim();
        if (clean) setTicker(clean);
    };

    // Parse broksum data — expected shape: { brokers: [...], analysis: {...} } or array of broker entries
    const brokerRows = useMemo(() => {
        if (!data) return [];
        // Handle various response shapes
        const raw = data.brokers || data.data || (Array.isArray(data) ? data : []);
        return raw
            .map((b) => ({
                code: b.broker_code || b.code || "",
                name: b.broker_name || b.name || "",
                buy_vol: parseInt(b.buy_vol || b.bvol || 0),
                sell_vol: parseInt(b.sell_vol || b.svol || 0),
                buy_val: parseFloat(b.buy_val || b.bval || 0),
                sell_val: parseFloat(b.sell_val || b.sval || 0),
                net_vol: parseInt(b.net_vol || b.nvol || (b.buy_vol || b.bvol || 0) - (b.sell_vol || b.svol || 0)),
                net_val: parseFloat(b.net_val || b.nval || (b.buy_val || b.bval || 0) - (b.sell_val || b.sval || 0)),
                avg_buy: parseFloat(b.avg_buy || b.bavg || 0),
                avg_sell: parseFloat(b.avg_sell || b.savg || 0),
            }))
            .filter((b) => b.code);
    }, [data]);

    // Separate top buyers and sellers
    const topBuyers = useMemo(() =>
        [...brokerRows].filter((b) => b.net_val > 0).sort((a, b) => b.net_val - a.net_val),
        [brokerRows]
    );

    const topSellers = useMemo(() =>
        [...brokerRows].filter((b) => b.net_val < 0).sort((a, b) => a.net_val - b.net_val),
        [brokerRows]
    );

    const maxBuyAbs = topBuyers.length > 0 ? topBuyers[0].net_val : 1;
    const maxSellAbs = topSellers.length > 0 ? Math.abs(topSellers[0].net_val) : 1;

    // Summary stats
    const summary = useMemo(() => {
        if (!brokerRows.length) return null;
        const totalBuyVal = brokerRows.reduce((s, b) => s + b.buy_val, 0);
        const totalSellVal = brokerRows.reduce((s, b) => s + b.sell_val, 0);
        const totalBuyVol = brokerRows.reduce((s, b) => s + b.buy_vol, 0);
        const totalSellVol = brokerRows.reduce((s, b) => s + b.sell_vol, 0);
        return {
            totalBuyVal, totalSellVal, totalBuyVol, totalSellVol,
            netVal: totalBuyVal - totalSellVal,
            netVol: totalBuyVol - totalSellVol,
            buyerCount: topBuyers.length,
            sellerCount: topSellers.length,
        };
    }, [brokerRows, topBuyers, topSellers]);

    // Analysis data (if API returns it)
    const analysis = data?.analysis || null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Broksum — {ticker}
                    </h1>
                    <p className="text-sm text-text-muted mt-0.5">
                        Ringkasan broker per saham
                        {dateRange.start && ` • ${dateRange.start} — ${dateRange.end}`}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="flex gap-1.5">
                        <input
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value.toUpperCase())}
                            placeholder="Kode saham..."
                            className="bg-surface-elevated border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent w-28"
                        />
                        <button type="submit" className="bg-accent/10 text-accent px-3 py-2 rounded-xl text-sm font-medium hover:bg-accent/20 transition-colors border border-accent/30 cursor-pointer">
                            Cari
                        </button>
                    </form>

                    {/* Period */}
                    <div className="flex gap-0.5 bg-surface-elevated/50 border border-border rounded-xl p-1">
                        {PERIOD_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setPeriod(opt.value)}
                                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${period === opt.value
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

            {/* Summary cards */}
            {summary && !loading && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="bg-surface-card border border-border rounded-2xl p-4">
                        <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Net Value</p>
                        <p className={`text-lg font-bold ${summary.netVal >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {formatValue(summary.netVal)}
                        </p>
                    </div>
                    <div className="bg-surface-card border border-border rounded-2xl p-4">
                        <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Net Volume</p>
                        <p className={`text-lg font-bold ${summary.netVol >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {formatVol(summary.netVol)}
                        </p>
                    </div>
                    <div className="bg-surface-card border border-border rounded-2xl p-4">
                        <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Buyer</p>
                        <p className="text-lg font-bold text-emerald-400">{summary.buyerCount} broker</p>
                    </div>
                    <div className="bg-surface-card border border-border rounded-2xl p-4">
                        <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Seller</p>
                        <p className="text-lg font-bold text-red-400">{summary.sellerCount} broker</p>
                    </div>
                </div>
            )}

            {/* Analysis box */}
            {analysis && !loading && (
                <div className="space-y-4 mb-6">

                    {/* Infographic Section */}
                    {(() => {
                        try {
                            const parsed = typeof analysis === "string" ? JSON.parse(analysis) : analysis;
                            const info = parsed.infographic;
                            if (!info) return null;

                            const Card = ({ title, items, color, icon }) => (
                                <div className="bg-surface-elevated/30 border border-border/50 rounded-xl p-3">
                                    <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${color} flex items-center gap-1.5`}>
                                        {icon} {title}
                                    </h4>
                                    <div className="space-y-2">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-text-primary bg-surface-card px-1.5 py-0.5 rounded border border-border/30 w-8 text-center">{item.code}</span>
                                                    {item.status && <span className="text-[9px] text-text-muted px-1 rounded bg-surface-elevated">{item.status}</span>}
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className={`font-medium ${item.val >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatValue(item.val)}</span>
                                                    {item.avg && <span className="text-[9px] text-text-muted">Avg: {Math.round(item.avg).toLocaleString("id-ID")}</span>}
                                                </div>
                                            </div>
                                        ))}
                                        {items.length === 0 && <span className="text-[10px] text-text-muted italic">None</span>}
                                    </div>
                                </div>
                            );

                            return (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    <Card
                                        title="Aggressive Haka"
                                        items={info.aggressive_haka}
                                        color="text-emerald-400"
                                        icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                                    />
                                    <Card
                                        title="Smart Accumula"
                                        items={info.smart_accumulation}
                                        color="text-emerald-400"
                                        icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                    />
                                    <Card
                                        title="Aggressive Haki"
                                        items={info.aggressive_haki}
                                        color="text-red-400"
                                        icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}
                                    />
                                    <Card
                                        title="Panic Selling"
                                        items={info.panic_selling}
                                        color="text-red-400"
                                        icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                                    />
                                </div>
                            );
                        } catch (e) { return null; }
                    })()}
                </div>
            )}

            {loading ? (
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="bg-surface-card border border-border rounded-2xl p-5"><TableSkeleton /></div>
                    <div className="bg-surface-card border border-border rounded-2xl p-5"><TableSkeleton /></div>
                </div>
            ) : brokerRows.length > 0 ? (
                /* Side-by-side top buyers / sellers */
                <div className="grid gap-4 lg:grid-cols-2">
                    {/* Top Buyers */}
                    <div className="bg-surface-card border border-border rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">📈 Top Buyers</h3>
                            <span className="text-[10px] uppercase tracking-wider text-text-muted">{topBuyers.length} broker</span>
                        </div>
                        <div className="grid grid-cols-[50px_1fr_80px_80px_70px] gap-1 px-4 py-2 border-b border-border/30 text-[10px] uppercase tracking-wider text-text-muted font-medium">
                            <span>Code</span>
                            <span>Net Bar</span>
                            <span className="text-right">Net Val</span>
                            <span className="text-right">Buy Vol</span>
                            <span className="text-right">Avg</span>
                        </div>
                        <div className="divide-y divide-border/20 max-h-[500px] overflow-y-auto">
                            {topBuyers.map((b) => (
                                <div key={b.code} className="grid grid-cols-[50px_1fr_80px_80px_70px] gap-1 px-4 py-2 items-center hover:bg-surface-elevated/30 transition-colors">
                                    <span className="text-xs font-bold text-emerald-400">{b.code}</span>
                                    <NetBar value={b.net_val} maxAbs={maxBuyAbs} />
                                    <span className="text-xs text-emerald-400 font-semibold text-right">{formatValue(b.net_val)}</span>
                                    <span className="text-xs text-text-secondary text-right">{formatVol(b.buy_vol)}</span>
                                    <span className="text-xs text-text-muted text-right">{b.avg_buy ? b.avg_buy.toLocaleString("id-ID") : "-"}</span>
                                </div>
                            ))}
                            {topBuyers.length === 0 && (
                                <div className="px-4 py-6 text-center text-text-muted text-xs">Tidak ada buyer</div>
                            )}
                        </div>
                    </div>

                    {/* Top Sellers */}
                    <div className="bg-surface-card border border-border rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                            <h3 className="text-sm font-bold text-red-400 flex items-center gap-1.5">📉 Top Sellers</h3>
                            <span className="text-[10px] uppercase tracking-wider text-text-muted">{topSellers.length} broker</span>
                        </div>
                        <div className="grid grid-cols-[50px_1fr_80px_80px_70px] gap-1 px-4 py-2 border-b border-border/30 text-[10px] uppercase tracking-wider text-text-muted font-medium">
                            <span>Code</span>
                            <span>Net Bar</span>
                            <span className="text-right">Net Val</span>
                            <span className="text-right">Sell Vol</span>
                            <span className="text-right">Avg</span>
                        </div>
                        <div className="divide-y divide-border/20 max-h-[500px] overflow-y-auto">
                            {topSellers.map((b) => (
                                <div key={b.code} className="grid grid-cols-[50px_1fr_80px_80px_70px] gap-1 px-4 py-2 items-center hover:bg-surface-elevated/30 transition-colors">
                                    <span className="text-xs font-bold text-red-400">{b.code}</span>
                                    <NetBar value={b.net_val} maxAbs={maxSellAbs} />
                                    <span className="text-xs text-red-400 font-semibold text-right">{formatValue(b.net_val)}</span>
                                    <span className="text-xs text-text-secondary text-right">{formatVol(b.sell_vol)}</span>
                                    <span className="text-xs text-text-muted text-right">{b.avg_sell ? b.avg_sell.toLocaleString("id-ID") : "-"}</span>
                                </div>
                            ))}
                            {topSellers.length === 0 && (
                                <div className="px-4 py-6 text-center text-text-muted text-xs">Tidak ada seller</div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-elevated/50 mb-4">
                        <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    </div>
                    <p className="text-text-muted text-sm mb-1">Data broksum tidak tersedia</p>
                    <p className="text-text-muted text-xs">API mungkin memerlukan autentikasi tradersaham</p>
                </div>
            )}
        </div>
    );
}
