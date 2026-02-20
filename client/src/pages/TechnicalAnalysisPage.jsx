import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import TAChart from "../components/TAChart";
import WelcomeHint from "../components/WelcomeHint";

const INDICATORS = {
    trend: {
        label: "Trend",
        items: [
            { key: "sma20", label: "SMA 20", color: "#f59e0b" },
            { key: "sma50", label: "SMA 50", color: "#8b5cf6" },
            { key: "sma200", label: "SMA 200", color: "#06b6d4" },
            { key: "ema", label: "EMA 12/26", color: "#ec4899" },
        ],
    },
    volatility: {
        label: "Volatility",
        items: [{ key: "bb", label: "Bollinger Bands", color: "#3b82f6" }],
    },
    momentum: {
        label: "Momentum",
        items: [
            { key: "rsi", label: "RSI (14)", color: "#a855f7" },
            { key: "macd", label: "MACD", color: "#3b82f6" },
        ],
    },
};

const DEFAULT_INDICATORS = {
    sma20: true,
    sma50: true,
    sma200: false,
    ema: false,
    bb: true,
    rsi: true,
    macd: true,
};

export default function TechnicalAnalysisPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [ticker, setTicker] = useState("");
    const [activeTicker, setActiveTicker] = useState("");
    const [loading, setLoading] = useState(false);
    const [chartData, setChartData] = useState([]);
    const [indicators, setIndicators] = useState({});
    const [latestData, setLatestData] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [visibleIndicators, setVisibleIndicators] = useState(DEFAULT_INDICATORS);

    // Handle URL ticker param
    useEffect(() => {
        const urlTicker = searchParams.get("ticker");
        if (urlTicker) {
            setTicker(urlTicker);
            fetchTAData(urlTicker);
        }
    }, []);

    const fetchTAData = useCallback(async (symbol) => {
        if (!symbol) return;

        setLoading(true);
        setChartData([]);
        setIndicators({});
        setAnalysis(null);
        setActiveTicker(symbol.toUpperCase());
        setTicker(symbol.toUpperCase());

        try {
            // Call Python TA endpoint
            const res = await fetch(`/api/py/ta.py?ticker=${encodeURIComponent(symbol)}`);
            const data = await res.json();

            if (data.success) {
                setChartData(data.data);
                setIndicators(data.indicators);
                setLatestData(data.latest);
                setAnalysis(data.analysis);
            } else {
                toast.error(data.error || "Gagal memuat data teknikal");
            }
        } catch (err) {
            console.error("TA fetch error:", err);
            toast.error("Gagal menghubungi server analisis teknikal");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        const symbol = ticker.trim().toUpperCase();
        if (symbol) {
            setSearchParams({ ticker: symbol });
            fetchTAData(symbol);
        }
    };

    const toggleIndicator = (key) => {
        setVisibleIndicators((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const fmt = (v) => (v != null ? v.toLocaleString("id-ID") : "-");
    const fmtVol = (v) => {
        if (!v) return "-";
        if (v >= 1e9) return (v / 1e9).toFixed(1) + "B";
        if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
        if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
        return v.toString();
    };

    const getOverallColor = (overall) => {
        if (overall?.includes("STRONG BULLISH")) return "text-emerald-400";
        if (overall?.includes("BULLISH")) return "text-green-400";
        if (overall?.includes("SLIGHTLY BULLISH")) return "text-lime-400";
        if (overall?.includes("STRONG BEARISH")) return "text-red-500";
        if (overall?.includes("BEARISH")) return "text-red-400";
        if (overall?.includes("SLIGHTLY BEARISH")) return "text-orange-400";
        return "text-slate-400";
    };

    const getActionColor = (action) => {
        if (action?.includes("BUY")) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
        if (action?.includes("SELL")) return "bg-red-500/20 text-red-400 border-red-500/30";
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    };

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            {/* Search Bar */}
            <form onSubmit={handleSubmit} className="mb-6">
                <div className="relative">
                    <input
                        type="text"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value)}
                        placeholder="Cari kode saham untuk analisis teknikal… contoh: BBRI, BBCA, TLKM"
                        className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 pl-11 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all font-mono"
                    />
                    <svg
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                        />
                    </svg>
                </div>
            </form>

            {/* Empty State */}
            {!loading && !activeTicker && (
                <WelcomeHint
                    icon="📊"
                    title="Technical Analysis"
                    subtitle="Analisis teknikal komprehensif dengan indikator profesional. Data real-time dari Yahoo Finance dengan perhitungan Python."
                    tips={[
                        { icon: "📈", text: "Trend Analysis: SMA, EMA, Golden/Death Cross detection" },
                        { icon: "⚡", text: "Momentum: RSI, MACD, Stochastic dengan signal detection" },
                        { icon: "📉", text: "Volatility: Bollinger Bands, ATR, Keltner Channel" },
                        { icon: "📊", text: "Volume: OBV, CMF, MFI untuk konfirmasi trend" },
                    ]}
                    actions={[
                        { label: "🏠 Dashboard Utama", to: "/" },
                        { label: "📋 Fundamental", to: "/fundamental" },
                    ]}
                />
            )}

            {/* Loading State */}
            {loading && (
                <div className="space-y-4 animate-pulse">
                    <div className="bg-surface-card border border-border rounded-2xl h-[500px]" />
                    <div className="grid grid-cols-4 gap-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-surface-card border border-border rounded-xl p-4 h-24" />
                        ))}
                    </div>
                </div>
            )}

            {/* Content */}
            {!loading && chartData.length > 0 && (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-text-primary font-mono">
                                {activeTicker}
                            </h1>
                            <p className="text-sm text-text-muted">
                                Technical Analysis • {chartData.length} candles • Python-powered
                            </p>
                        </div>

                        {analysis?.summary && (
                            <div className="flex items-center gap-3">
                                <span className={`text-lg font-bold ${getOverallColor(analysis.summary.overall)}`}>
                                    {analysis.summary.overall}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getActionColor(analysis.summary.action)}`}>
                                    {analysis.summary.action}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Price Summary */}
                    {latestData && (
                        <div className="bg-surface-card border border-border rounded-2xl p-4">
                            <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
                                <div>
                                    <p className="text-3xl font-bold text-text-primary font-mono">
                                        {fmt(latestData.price)}
                                    </p>
                                    <p
                                        className={`text-sm font-semibold ${
                                            latestData.change >= 0 ? "text-emerald-400" : "text-red-400"
                                        }`}
                                    >
                                        {latestData.change >= 0 ? "+" : ""}
                                        {fmt(latestData.change)} ({latestData.change_pct >= 0 ? "+" : ""}
                                        {latestData.change_pct}%)
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-muted font-mono">
                                    <span>
                                        SMA20{" "}
                                        <span className="text-amber-400 font-medium">{fmt(latestData.sma_20)}</span>
                                    </span>
                                    <span>
                                        SMA50{" "}
                                        <span className="text-violet-400 font-medium">{fmt(latestData.sma_50)}</span>
                                    </span>
                                    <span>
                                        RSI{" "}
                                        <span
                                            className={`font-medium ${
                                                latestData.rsi > 70
                                                    ? "text-red-400"
                                                    : latestData.rsi < 30
                                                    ? "text-emerald-400"
                                                    : "text-purple-400"
                                            }`}
                                        >
                                            {latestData.rsi}
                                        </span>
                                    </span>
                                    <span>
                                        ADX{" "}
                                        <span className="text-cyan-400 font-medium">{latestData.adx}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Grid: Chart + Indicators Panel */}
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                        {/* Chart Area */}
                        <div className="xl:col-span-3 space-y-4">
                            {/* Indicator Toggles */}
                            <div className="bg-surface-card border border-border rounded-xl p-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    {Object.entries(INDICATORS).map(([category, { label, items }]) => (
                                        <div key={category} className="flex items-center gap-2">
                                            <span className="text-[10px] text-text-muted uppercase tracking-wider">
                                                {label}:
                                            </span>
                                            {items.map((item) => (
                                                <button
                                                    key={item.key}
                                                    onClick={() => toggleIndicator(item.key)}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                                        visibleIndicators[item.key]
                                                            ? "bg-accent/20 text-accent border border-accent/30"
                                                            : "bg-surface-elevated text-text-muted hover:text-text-primary"
                                                    }`}
                                                >
                                                    <span
                                                        className="inline-block w-2 h-2 rounded-full mr-1.5"
                                                        style={{ backgroundColor: item.color }}
                                                    />
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Chart */}
                            <TAChart
                                data={chartData}
                                indicators={indicators}
                                visibleIndicators={visibleIndicators}
                                height={400}
                            />
                        </div>

                        {/* Analysis Panel */}
                        <div className="xl:col-span-1 space-y-4">
                            {/* Summary Card */}
                            {analysis?.summary && (
                                <div className="bg-surface-card border border-border rounded-xl p-4">
                                    <h3 className="text-sm font-semibold text-text-primary mb-3">
                                        📊 Analysis Summary
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-text-muted">Signal</span>
                                            <span className={`text-sm font-bold ${getOverallColor(analysis.summary.overall)}`}>
                                                {analysis.summary.overall}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-text-muted">Action</span>
                                            <span className="text-sm text-text-primary font-medium">
                                                {analysis.summary.action}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-text-muted">Confidence</span>
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded-full ${
                                                    analysis.summary.confidence === "high"
                                                        ? "bg-emerald-500/20 text-emerald-400"
                                                        : analysis.summary.confidence === "medium"
                                                        ? "bg-amber-500/20 text-amber-400"
                                                        : "bg-slate-500/20 text-slate-400"
                                                }`}
                                            >
                                                {analysis.summary.confidence?.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Signal Breakdown */}
                            {analysis?.signals && (
                                <div className="bg-surface-card border border-border rounded-xl p-4 space-y-4">
                                    <h3 className="text-sm font-semibold text-text-primary">🔍 Signal Breakdown</h3>

                                    {Object.entries(analysis.signals).map(([key, data]) => (
                                        <div key={key} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                                                    {key.replace("_", " ")}
                                                </span>
                                                <span
                                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                                        data.direction?.includes("bullish")
                                                            ? "bg-emerald-500/20 text-emerald-400"
                                                            : data.direction?.includes("bearish")
                                                            ? "bg-red-500/20 text-red-400"
                                                            : "bg-slate-500/20 text-slate-400"
                                                    }`}
                                                >
                                                    {data.direction?.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                {data.signals?.slice(0, 3).map((signal, i) => (
                                                    <p
                                                        key={i}
                                                        className="text-[11px] text-text-secondary leading-relaxed"
                                                    >
                                                        • {signal}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Recommendations */}
                            {analysis?.recommendations?.length > 0 && (
                                <div className="bg-surface-card border border-border rounded-xl p-4">
                                    <h3 className="text-sm font-semibold text-text-primary mb-3">
                                        💡 Recommendations
                                    </h3>
                                    <div className="space-y-2">
                                        {analysis.recommendations.map((rec, i) => (
                                            <div
                                                key={i}
                                                className={`text-xs p-2 rounded-lg ${
                                                    rec.type === "warning"
                                                        ? "bg-amber-500/10 text-amber-400"
                                                        : rec.type === "opportunity"
                                                        ? "bg-emerald-500/10 text-emerald-400"
                                                        : rec.type === "risk"
                                                        ? "bg-red-500/10 text-red-400"
                                                        : "bg-blue-500/10 text-blue-400"
                                                }`}
                                            >
                                                {rec.text}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
