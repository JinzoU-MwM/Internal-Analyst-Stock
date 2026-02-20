import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import DOMPurify from "dompurify";
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
        label: "Volatilitas",
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

/** Lightweight markdown → HTML renderer */
function renderMarkdown(md) {
    if (!md) return "";
    const html = md
        .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-text-primary mt-5 mb-2">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-text-primary mt-6 mb-3 pb-2 border-b border-border">$1</h2>')
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-text-primary font-semibold">$1</strong>')
        .replace(/^[*-] (.+)$/gm, '<li class="ml-4 mb-1 list-disc list-inside">$1</li>')
        .replace(/^\|(.+)\|$/gm, (_, row) => {
            const cells = row.split("|").map((c) => c.trim());
            return `<tr>${cells.map((c) => `<td class="px-3 py-1.5 border border-border">${c}</td>`).join("")}</tr>`;
        })
        .replace(/((?:<tr>.*<\/tr>\n?)+)/g, '<table class="w-full border-collapse text-xs my-3">$1</table>')
        .replace(/<tr><td[^>]*>[\s-:]+<\/td>(<td[^>]*>[\s-:]+<\/td>)*<\/tr>/g, "")
        .replace(/^(?!<[htl])((?!<).+)$/gm, '<p class="mb-2">$1</p>')
        .replace(/\n/g, "");
    return DOMPurify.sanitize(html);
}

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

    // AI Insight state
    const [aiInsight, setAiInsight] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);

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
        setAiInsight("");
        setActiveTicker(symbol.toUpperCase());
        setTicker(symbol.toUpperCase());

        try {
            const res = await fetch(`/api/ta?ticker=${encodeURIComponent(symbol)}`);
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

    const generateAiInsight = useCallback(async () => {
        if (!activeTicker || !analysis) return;

        setAiLoading(true);
        setAiInsight("");
        setShowAiModal(true);

        try {
            const res = await fetch("/api/ai-insight/technical", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ticker: activeTicker,
                    taData: {
                        latest: latestData,
                        analysis: analysis,
                    },
                }),
            });
            const data = await res.json();

            if (data.success) {
                setAiInsight(data.insight);
            } else {
                setAiInsight(`Error: ${data.error}`);
            }
        } catch (err) {
            setAiInsight(`Error: ${err.message}`);
        } finally {
            setAiLoading(false);
        }
    }, [activeTicker, analysis, latestData]);

    const fmt = (v) => (v != null ? v.toLocaleString("id-ID") : "-");

    const getOverallColor = (overall) => {
        if (overall?.includes("SANGAT BULLISH")) return "text-emerald-400";
        if (overall?.includes("BULLISH")) return "text-green-400";
        if (overall?.includes("CENDERUNG BULLISH")) return "text-lime-400";
        if (overall?.includes("SANGAT BEARISH")) return "text-red-500";
        if (overall?.includes("BEARISH")) return "text-red-400";
        if (overall?.includes("CENDERUNG BEARISH")) return "text-orange-400";
        return "text-slate-400";
    };

    const getActionColor = (action) => {
        if (action?.includes("BELI")) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
        if (action?.includes("JUAL")) return "bg-red-500/20 text-red-400 border-red-500/30";
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    };

    const getConfidenceColor = (confidence) => {
        if (confidence === "tinggi") return "bg-emerald-500/20 text-emerald-400";
        if (confidence === "sedang") return "bg-amber-500/20 text-amber-400";
        return "bg-slate-500/20 text-slate-400";
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
                    title="Analisis Teknikal"
                    subtitle="Analisis teknikal komprehensif dengan indikator profesional. Data real-time dari Yahoo Finance dengan AI Insight."
                    tips={[
                        { icon: "📈", text: "Analisis Trend: SMA, EMA, deteksi Golden/Death Cross" },
                        { icon: "⚡", text: "Momentum: RSI, MACD, Stochastic dengan deteksi sinyal" },
                        { icon: "📉", text: "Volatilitas: Bollinger Bands, ATR, Keltner Channel" },
                        { icon: "🤖", text: "AI Insight: Analisis mendalam oleh Gemini AI" },
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
                                Analisis Teknikal • {chartData.length} candle • AI-powered
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {analysis?.summary && (
                                <>
                                    <span className={`text-lg font-bold ${getOverallColor(analysis.summary.overall)}`}>
                                        {analysis.summary.overall}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getActionColor(analysis.summary.action)}`}>
                                        {analysis.summary.action}
                                    </span>
                                </>
                            )}
                            <button
                                onClick={generateAiInsight}
                                disabled={aiLoading}
                                className="flex items-center gap-2 bg-gradient-to-r from-accent to-purple-500 hover:from-accent-hover hover:to-purple-400 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-accent/20"
                            >
                                <span className="text-base">✨</span>
                                {aiLoading ? "Menganalisis…" : "AI Insight"}
                            </button>
                        </div>
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
                                        📊 Ringkasan Analisis
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-text-muted">Sinyal</span>
                                            <span className={`text-sm font-bold ${getOverallColor(analysis.summary.overall)}`}>
                                                {analysis.summary.overall}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-text-muted">Aksi</span>
                                            <span className="text-sm text-text-primary font-medium">
                                                {analysis.summary.action}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-text-muted">Kepercayaan</span>
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceColor(analysis.summary.confidence)}`}
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
                                    <h3 className="text-sm font-semibold text-text-primary">🔍 Detail Sinyal</h3>

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
                                                            : data.direction?.includes("kuat")
                                                            ? "bg-cyan-500/20 text-cyan-400"
                                                            : data.direction?.includes("lemah")
                                                            ? "bg-orange-500/20 text-orange-400"
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
                                        💡 Rekomendasi
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

            {/* AI Insight Modal */}
            {showAiModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setShowAiModal(false)}
                >
                    <div
                        className="bg-surface-card border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl animate-scale-in flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">✨</span>
                                <h3 className="text-base font-semibold text-text-primary">
                                    AI Insight — {activeTicker}
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowAiModal(false)}
                                className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer rounded-lg hover:bg-surface-elevated"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="px-6 py-5 overflow-y-auto flex-1">
                            {aiLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                                    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3" />
                                    <p className="text-sm">Menghasilkan analisis dengan Gemini AI…</p>
                                </div>
                            ) : (
                                <div
                                    className="ai-insight-content text-text-secondary text-sm leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: renderMarkdown(aiInsight) }}
                                />
                            )}
                        </div>

                        {/* Modal footer */}
                        <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-end">
                            <button
                                onClick={() => setShowAiModal(false)}
                                className="text-sm text-text-muted hover:text-text-primary px-4 py-2.5 rounded-lg hover:bg-surface-elevated transition-all cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
