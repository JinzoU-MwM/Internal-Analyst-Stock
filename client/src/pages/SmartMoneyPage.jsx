import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

const LOOKBACK_OPTIONS = [
    { value: 1, label: "1D" },
    { value: 7, label: "7D" },
    { value: 14, label: "14D" },
    { value: 21, label: "21D" },
];

const formatValue = (n) => {
    if (!n && n !== 0) return "-";
    const v = typeof n === "string" ? parseFloat(n) : n;
    const abs = Math.abs(v);
    const sign = v >= 0 ? "" : "-";
    if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(1)}T`;
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(1)}B`;
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(1)}M`;
    return `${sign}${abs.toLocaleString("id-ID")}`;
};

const formatPrice = (n) => {
    if (!n) return "-";
    const v = typeof n === "string" ? parseFloat(n) : n;
    return v.toLocaleString("id-ID");
};

// ── Skeleton ──
const RowSkeleton = () => (
    <div className="grid grid-cols-[1fr_140px_140px_160px_160px] gap-2 px-5 py-4 animate-pulse items-center border-b border-border/10">
        {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 bg-surface-elevated/50 rounded" />
        ))}
    </div>
);

// ── Main Component ──
export default function SmartMoneyPage() {
    const [lookback, setLookback] = useState(7);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("ia_token");
            const res = await fetch(`/api/brokers/smart-money?lookback_days=${lookback}&limit=50`, {
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
            toast.error("Gagal memuat data smart money");
        } finally {
            setLoading(false);
        }
    }, [lookback]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const signals = data?.signals || [];
    const filteredSignals = search
        ? signals.filter(s => s.stock_code.toLowerCase().includes(search.toLowerCase()))
        : signals;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* ── Header Banner ── */}
            <div className="bg-surface-card border border-border rounded-2xl p-5 mb-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/20 to-emerald-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-text-primary">Smartmoney Nampung Retail Scanner</h2>
                            <p className="text-[11px] text-text-muted">Finding stocks where Smartmoney is accumulating while Retail is distributing</p>
                        </div>
                    </div>

                    {/* Lookback selector */}
                    <div className="flex items-center gap-1 bg-surface-elevated/50 border border-border rounded-xl p-1">
                        {LOOKBACK_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setLookback(opt.value)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${lookback === opt.value
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

            {/* ── Found count + Search ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <p className="text-sm font-semibold text-text-primary">
                    {loading ? "Scanning..." : `Found ${filteredSignals.length} stocks with absorption pattern`}
                </p>
                <div className="relative min-w-[140px] max-w-[200px]">
                    <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value.toUpperCase())}
                        placeholder="Cari saham..."
                        className="w-full bg-surface-elevated border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                    />
                </div>
            </div>

            {/* ── Table ── */}
            <div className="bg-surface-card border border-border rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[1fr_140px_140px_160px_160px] gap-2 px-5 py-3 border-b border-border/50 text-[10px] uppercase tracking-wider text-text-muted font-medium items-center">
                    <span>Stock</span>
                    <span className="text-right">Smartmoney Net</span>
                    <span className="text-right">Retail Net</span>
                    <span className="text-right">Smartmoney Avg / P/L</span>
                    <span className="text-right">Retail Avg / P/L</span>
                </div>

                {/* Rows */}
                <div className="divide-y divide-border/10">
                    {loading ? (
                        Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)
                    ) : filteredSignals.length > 0 ? (
                        filteredSignals.map((signal, idx) => (
                            <div
                                key={`${signal.stock_code}-${idx}`}
                                className="grid grid-cols-[1fr_140px_140px_160px_160px] gap-2 px-5 py-3.5 items-center hover:bg-surface-elevated/10 transition-colors"
                            >
                                {/* Stock */}
                                <span className="text-sm font-bold text-text-primary">{signal.stock_code}</span>

                                {/* Smartmoney Net */}
                                <span className="text-sm font-semibold text-emerald-400 text-right">
                                    {formatValue(signal.smart_net_value)}
                                </span>

                                {/* Retail Net */}
                                <span className="text-sm font-semibold text-red-400 text-right">
                                    {formatValue(signal.retail_total_dist)}
                                </span>

                                {/* Smartmoney Avg / P/L */}
                                <div className="text-right">
                                    <p className="text-sm font-medium text-text-primary">{formatPrice(signal.smart_avg_price)}</p>
                                    <p className={`text-xs font-semibold ${signal.smart_float_pl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                        {signal.smart_float_pl >= 0 ? "+" : ""}{signal.smart_float_pl.toFixed(2)}%
                                    </p>
                                </div>

                                {/* Retail Avg / P/L */}
                                <div className="text-right">
                                    <p className="text-sm font-medium text-text-primary">{formatPrice(signal.retail_avg_price)}</p>
                                    <p className={`text-xs font-semibold ${signal.retail_float_pl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                        {signal.retail_float_pl >= 0 ? "+" : ""}{signal.retail_float_pl.toFixed(2)}%
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="px-5 py-12 text-center text-text-muted text-sm">
                            {data ? "Tidak ada sinyal smart money pada periode ini" : "Memuat data..."}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
