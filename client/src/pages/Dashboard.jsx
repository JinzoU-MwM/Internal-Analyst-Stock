import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StockChart from "../components/StockChart";
import AnalysisHistory from "../components/AnalysisHistory";
import AnalysisForm from "../components/AnalysisForm";
import UserListModal from "../components/UserListModal";
import toast from "react-hot-toast";

/** Lightweight markdown → HTML renderer */
function renderMarkdown(md) {
    if (!md) return "";
    return md
        // Headings
        .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-text-primary mt-5 mb-2">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-text-primary mt-6 mb-3 pb-2 border-b border-border">$1</h2>')
        // Bold
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-text-primary font-semibold">$1</strong>')
        // Unordered lists
        .replace(/^[*-] (.+)$/gm, '<li class="ml-4 mb-1 list-disc list-inside">$1</li>')
        // Table rows
        .replace(/^\|(.+)\|$/gm, (_, row) => {
            const cells = row.split("|").map((c) => c.trim());
            return `<tr>${cells.map((c) => `<td class="px-3 py-1.5 border border-border">${c}</td>`).join("")}</tr>`;
        })
        // Wrap consecutive <tr> in <table>
        .replace(/((?:<tr>.*<\/tr>\n?)+)/g, '<table class="w-full border-collapse text-xs my-3">$1</table>')
        // Remove table separator rows (---|---|---)
        .replace(/<tr><td[^>]*>[\s-:]+<\/td>(<td[^>]*>[\s-:]+<\/td>)*<\/tr>/g, "")
        // Paragraphs from remaining lines
        .replace(/^(?!<[htl])((?!<).+)$/gm, '<p class="mb-2">$1</p>')
        // Line breaks
        .replace(/\n/g, "");
}

export default function Dashboard() {
    const { isAdmin } = useAuth();
    const [ticker, setTicker] = useState("");
    const [activeTicker, setActiveTicker] = useState("");
    const [chartData, setChartData] = useState([]);
    const [analyses, setAnalyses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // AI Insight state
    const [aiInsight, setAiInsight] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);

    // Watchlist state
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [watchlistLoading, setWatchlistLoading] = useState(false);

    // Check if current ticker is in watchlist
    const checkWatchlistStatus = useCallback(async (symbol) => {
        try {
            const token = localStorage.getItem("ia_token");
            if (!token) return;

            const res = await fetch("/api/auth/watchlist", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                const exists = data.watchlist.some((item) => item.symbol === symbol);
                setIsInWatchlist(exists);
            }
        } catch (err) {
            console.error("Failed to check watchlist:", err);
        }
    }, []);

    const toggleWatchlist = async () => {
        if (!activeTicker) return;
        setWatchlistLoading(true);
        try {
            const token = localStorage.getItem("ia_token");
            const method = isInWatchlist ? "DELETE" : "POST";
            const url = isInWatchlist
                ? `/api/auth/watchlist/${activeTicker}`
                : "/api/auth/watchlist";
            const body = isInWatchlist ? undefined : JSON.stringify({ symbol: activeTicker });

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body,
            });
            const data = await res.json();

            if (data.success) {
                setIsInWatchlist(!isInWatchlist);
                toast.success(!isInWatchlist ? "Ditambahkan ke Watchlist" : "Dihapus dari Watchlist");
                // Dispatch event to update Sidebar
                window.dispatchEvent(new Event("watchlist-updated"));
            }
        } catch (err) {
            console.error("Failed to toggle watchlist:", err);
            toast.error("Gagal mengupdate watchlist");
        } finally {
            setWatchlistLoading(false);
        }
    };

    const fetchAnalyses = useCallback(async (symbol) => {
        try {
            const res = await fetch(`/api/analysis/${encodeURIComponent(symbol)}`);
            const data = await res.json();
            if (data.success) setAnalyses(data.data);
        } catch {
            /* silent */
        }
    }, []);

    const [searchParams, setSearchParams] = useSearchParams();

    // Refactored fetch logic
    const fetchStockData = useCallback(async (symbol) => {
        if (!symbol) return;

        // Auto-append .JK for Indonesian stocks
        if (!symbol.includes(".")) {
            symbol += ".JK";
        }

        setLoading(true);
        setError("");
        setChartData([]);
        setAnalyses([]);
        setAiInsight("");
        setActiveTicker(symbol);
        setTicker(symbol.split(".")[0]); // Display without .JK in input

        try {
            const [stockRes, analysisRes] = await Promise.allSettled([
                fetch(`/api/stocks/${encodeURIComponent(symbol)}`).then((r) => r.json()),
                fetch(`/api/analysis/${encodeURIComponent(symbol)}`).then((r) => r.json()),
            ]);

            if (stockRes.status === "fulfilled" && stockRes.value.success) {
                const formatted = stockRes.value.data.map((d) => ({
                    time: d.date?.split("T")[0],
                    open: d.open,
                    high: d.high,
                    low: d.low,
                    close: d.close,
                }));
                setChartData(formatted);
            } else {
                toast.error("Gagal memuat data saham. Periksa kode saham.");
            }

            if (analysisRes.status === "fulfilled" && analysisRes.value.success) {
                setAnalyses(analysisRes.value.data);
            }

            // Check watchlist status
            await checkWatchlistStatus(symbol);
        } catch (err) {
            toast.error(err.message || "Terjadi kesalahan.");
        } finally {
            setLoading(false);
        }
    }, [checkWatchlistStatus]);

    // Handle URL ticker param
    useEffect(() => {
        const urlTicker = searchParams.get("ticker");
        if (urlTicker && urlTicker !== activeTicker) {
            fetchStockData(urlTicker);
        }
    }, [searchParams, fetchStockData]);

    const searchTicker = useCallback(
        async (e) => {
            e.preventDefault();
            const symbol = ticker.trim().toUpperCase();
            if (symbol) {
                setSearchParams({ ticker: symbol }); // Update URL
                // fetchStockData will be triggered by useEffect
            }
        },
        [ticker, setSearchParams]
    );

    const handleAnalysisAdded = useCallback(() => {
        if (activeTicker) fetchAnalyses(activeTicker);
    }, [activeTicker, fetchAnalyses]);

    const generateAiInsight = useCallback(async () => {
        if (!activeTicker || !chartData.length) return;

        setAiLoading(true);
        setAiInsight("");
        setShowAiModal(true);

        try {
            const latest = chartData[chartData.length - 1];
            const res = await fetch("/api/ai-insight", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ticker: activeTicker,
                    price: latest
                        ? {
                            open: latest.open,
                            high: latest.high,
                            low: latest.low,
                            close: latest.close,
                        }
                        : undefined,
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
    }, [activeTicker, chartData]);

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            {/* ── Search Bar ────────────────────────────────────── */}
            <form onSubmit={searchTicker} className="mb-6">
                <div className="relative">
                    <input
                        type="text"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value)}
                        placeholder="Cari kode saham … contoh: BBRI, BBCA, TLKM"
                        className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 pl-11 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
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

            {/* ── Content ──────────────────────────────────────── */}
            <div>
                {loading && (
                    <div className="space-y-6 animate-pulse">
                        {/* Chart skeleton */}
                        <div className="bg-surface-card border border-border rounded-2xl p-4 h-[300px] md:h-[500px]">
                            <div className="h-4 w-32 bg-surface-elevated rounded mb-4" />
                            <div className="h-full bg-surface-elevated/60 rounded-xl" />
                        </div>
                        {/* Stats skeleton */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="bg-surface-card border border-border rounded-xl p-4">
                                    <div className="h-3 w-16 bg-surface-elevated rounded mb-2" />
                                    <div className="h-5 w-24 bg-surface-elevated rounded" />
                                </div>
                            ))}
                        </div>
                        {/* Analysis cards skeleton */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-surface-card border border-border rounded-xl p-4 space-y-3">
                                    <div className="flex justify-between">
                                        <div className="h-5 w-16 bg-surface-elevated rounded-full" />
                                        <div className="h-4 w-20 bg-surface-elevated rounded" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="h-8 bg-surface-elevated rounded" />
                                        <div className="h-8 bg-surface-elevated rounded" />
                                        <div className="h-8 bg-surface-elevated rounded" />
                                    </div>
                                    <div className="h-3 w-full bg-surface-elevated rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}



                {/* Empty state */}
                {!loading && !activeTicker && (
                    <div className="flex flex-col items-center justify-center py-32 text-text-muted">
                        <svg
                            className="w-16 h-16 mb-4 opacity-30"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 13l4-4 4 4 4-8 4 4"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 17h18"
                            />
                        </svg>
                        <p className="text-lg font-medium">
                            Masukkan kode saham untuk memulai
                        </p>
                        <p className="text-sm mt-1">contoh: BBRI, BBCA, TLKM</p>
                    </div>
                )}

                {/* Chart + Analysis layout */}
                {!loading && chartData.length > 0 && (
                    <div className="space-y-6">
                        {/* Ticker header + AI button */}
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold text-text-primary">
                                    {activeTicker}
                                </h2>
                                <button
                                    onClick={toggleWatchlist}
                                    disabled={watchlistLoading}
                                    className={`p-2 rounded-full transition-colors ${isInWatchlist
                                        ? "text-yellow-400 hover:bg-yellow-400/10"
                                        : "text-text-muted hover:text-yellow-400 hover:bg-surface-elevated"
                                        }`}
                                    title={isInWatchlist ? "Hapus dari Watchlist" : "Tambah ke Watchlist"}
                                >
                                    <svg className="w-6 h-6" fill={isInWatchlist ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                </button>
                                <span className="text-xs text-text-muted bg-surface-elevated px-2 py-1 rounded-full">
                                    {chartData.length} candle
                                </span>
                            </div>
                            {isAdmin && (
                                <button
                                    onClick={generateAiInsight}
                                    disabled={aiLoading}
                                    className="flex items-center gap-2 bg-gradient-to-r from-accent to-purple-500 hover:from-accent-hover hover:to-purple-400 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-accent/20"
                                >
                                    <span className="text-base">✨</span>
                                    {aiLoading ? "Menganalisis…" : "Analisis AI"}
                                </button>
                            )}
                        </div>

                        {/* Chart */}
                        <div className="bg-surface-card border border-border rounded-2xl p-3 sm:p-4 h-[300px] md:h-[500px]">
                            <StockChart data={chartData} />
                        </div>

                        {/* Two-column layout: Form + Analysis */}
                        <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-3' : ''} gap-6`}>
                            {/* Left: Form (admin only) */}
                            {isAdmin && (
                                <div className="lg:col-span-1">
                                    <AnalysisForm
                                        ticker={activeTicker}
                                        onAnalysisAdded={handleAnalysisAdded}
                                    />
                                </div>
                            )}

                            {/* Right: Analysis history */}
                            <div className="lg:col-span-2">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-text-primary">
                                        📊 Analisis Tim
                                    </h3>
                                    <span className="text-xs text-text-muted">
                                        {analyses.length} entri
                                    </span>
                                </div>

                                <AnalysisHistory
                                    analyses={analyses}
                                    emptyTicker={activeTicker}
                                    onDeleted={(id) => setAnalyses((prev) => prev.filter((a) => a._id !== id))}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── AI Insight Modal ──────────────────────────────── */}
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
                                    Analisis AI — {activeTicker}
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
                        {isAdmin && !aiLoading && aiInsight && (
                            <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between">
                                <button
                                    onClick={async () => {
                                        try {
                                            const token = localStorage.getItem("ia_token");
                                            const res = await fetch("/api/analysis", {
                                                method: "POST",
                                                headers: {
                                                    "Content-Type": "application/json",
                                                    Authorization: `Bearer ${token}`,
                                                },
                                                body: JSON.stringify({
                                                    ticker: activeTicker,
                                                    analystName: "AI Gemini",
                                                    action: "HOLD",
                                                    timeframe: "SWING",
                                                    notes: renderMarkdown(aiInsight),
                                                }),
                                            });
                                            const data = await res.json();
                                            if (data.success) {
                                                toast.success("Analisis AI berhasil disimpan!");
                                                fetchAnalyses(activeTicker);
                                                setShowAiModal(false);
                                            } else {
                                                toast.error(data.error || "Gagal menyimpan analisis");
                                            }
                                        } catch {
                                            toast.error("Terjadi kesalahan saat menyimpan");
                                        }
                                    }}
                                    className="flex items-center gap-2 text-sm font-medium bg-gradient-to-r from-accent to-purple-500 hover:from-accent-hover hover:to-purple-400 text-white px-4 py-2.5 rounded-lg transition-all cursor-pointer shadow-lg shadow-accent/20"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Simpan ke Analisis Tim
                                </button>
                                <button
                                    onClick={() => setShowAiModal(false)}
                                    className="text-sm text-text-muted hover:text-text-primary px-4 py-2.5 rounded-lg hover:bg-surface-elevated transition-all cursor-pointer"
                                >
                                    Tutup
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
