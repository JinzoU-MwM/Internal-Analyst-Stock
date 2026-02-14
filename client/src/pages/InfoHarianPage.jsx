import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

const TABS = [
    { key: "others", label: "Lainnya" },
    { key: "dividends", label: "Dividen" },
    { key: "rups", label: "RUPS" },
];

const ITEMS_PER_PAGE = 10;

// Category badge color map
const CATEGORY_COLORS = {
    "Financial Reports": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Volatility: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    "Corporate Action": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Report: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    "Bond/Sukuk": "bg-rose-500/20 text-rose-400 border-rose-500/30",
    Shareholders: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Interim: "bg-teal-500/20 text-teal-400 border-teal-500/30",
};

const getCategoryStyle = (cat) =>
    CATEGORY_COLORS[cat] || "bg-gray-500/20 text-gray-400 border-gray-500/30";

const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

const formatCurrency = (val) => {
    const n = Number(val);
    if (!n) return "-";
    if (n >= 1e12) return `Rp ${(n / 1e12).toFixed(1)}T`;
    if (n >= 1e9) return `Rp ${(n / 1e9).toFixed(1)}M`;
    if (n >= 1e6) return `Rp ${(n / 1e6).toFixed(1)}Jt`;
    return `Rp ${n.toLocaleString("id-ID")}`;
};

// Skeleton loader
const CardSkeleton = () => (
    <div className="bg-surface-card border border-border rounded-2xl p-5 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
            <div className="h-5 w-14 bg-surface-elevated rounded-full" />
            <div className="h-5 w-20 bg-surface-elevated rounded-full" />
            <div className="h-5 w-24 bg-surface-elevated rounded" />
        </div>
        <div className="h-5 w-3/4 bg-surface-elevated rounded mb-3" />
        <div className="space-y-2">
            <div className="h-3 w-full bg-surface-elevated rounded" />
            <div className="h-3 w-5/6 bg-surface-elevated rounded" />
        </div>
    </div>
);

// ─── Others / Generic disclosure card ───
const OthersCard = ({ item }) => (
    <div className="bg-surface-card border border-border rounded-2xl p-5 hover:border-accent/30 transition-colors group">
        {/* Header badges */}
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/20 text-accent border border-accent/30">
                    {item.ticker}
                </span>
                {item.category && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryStyle(item.category)}`}>
                        {item.category}
                    </span>
                )}
                <span className="text-xs text-text-muted">{formatDate(item.published_date)}</span>
            </div>
            {item.pdf_url && (
                <a
                    href={item.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors shrink-0"
                    title="Download PDF"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    PDF
                </a>
            )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-text-primary mb-2 leading-snug">
            {item.title || "(Tanpa judul)"}
        </h3>

        {/* Summary */}
        {item.summary && (
            <p className="text-xs text-text-muted leading-relaxed line-clamp-3">
                {item.summary}
            </p>
        )}
    </div>
);

// ─── Dividend card ───
const DividendCard = ({ item }) => (
    <div className="bg-surface-card border border-border rounded-2xl p-5 hover:border-accent/30 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/20 text-accent border border-accent/30">
                    {item.ticker}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryStyle(item.dividend_type || "Interim")}`}>
                    {item.dividend_type || "Dividen"}
                </span>
                <span className="text-xs text-text-muted">{formatDate(item.published_date)}</span>
            </div>
            {item.pdf_url && (
                <a href={item.pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    PDF
                </a>
            )}
        </div>

        <h3 className="text-sm font-bold text-text-primary mb-3 leading-snug">{item.title}</h3>

        {/* Dividend details grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-surface-elevated/40 rounded-lg p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5">Dividen/Saham</p>
                <p className="text-sm font-semibold text-accent">
                    {Number(item.dividend_per_share) > 0 ? `Rp ${Number(item.dividend_per_share).toLocaleString("id-ID")}` : "-"}
                </p>
            </div>
            <div className="bg-surface-elevated/40 rounded-lg p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5">Cum Date</p>
                <p className="text-sm font-semibold text-text-primary">{formatDate(item.cum_date)}</p>
            </div>
            <div className="bg-surface-elevated/40 rounded-lg p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5">Ex Date</p>
                <p className="text-sm font-semibold text-text-primary">{formatDate(item.ex_date)}</p>
            </div>
            <div className="bg-surface-elevated/40 rounded-lg p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-text-muted mb-0.5">Pembayaran</p>
                <p className="text-sm font-semibold text-text-primary">{formatDate(item.payment_date)}</p>
            </div>
        </div>
    </div>
);

// ─── RUPS card ───
const RupsCard = ({ item }) => (
    <div className="bg-surface-card border border-border rounded-2xl p-5 hover:border-accent/30 transition-colors">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/20 text-accent border border-accent/30">
                    {item.ticker}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                    RUPS
                </span>
                <span className="text-xs text-text-muted">{formatDate(item.published_date)}</span>
            </div>
            {item.pdf_url && (
                <a href={item.pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    PDF
                </a>
            )}
        </div>

        <h3 className="text-sm font-bold text-text-primary mb-2 leading-snug">{item.title}</h3>

        {item.summary && (
            <p className="text-xs text-text-muted leading-relaxed line-clamp-3">{item.summary}</p>
        )}
    </div>
);

// ─── Main page ───
export default function InfoHarianPage() {
    const [activeTab, setActiveTab] = useState("others");
    const [allData, setAllData] = useState([]);
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async (category) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("ia_token");
            const res = await fetch(`/api/disclosures/${category}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (json.success) {
                setAllData(json.data);
            } else {
                toast.error(json.error || "Gagal memuat data");
                setAllData([]);
            }
        } catch {
            toast.error("Gagal memuat data disclosure");
            setAllData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setVisibleCount(ITEMS_PER_PAGE);
        fetchData(activeTab);
    }, [activeTab, fetchData]);

    const visibleData = allData.slice(0, visibleCount);
    const hasMore = visibleCount < allData.length;

    const renderCard = (item) => {
        if (activeTab === "dividends") return <DividendCard key={item.id} item={item} />;
        if (activeTab === "rups") return <RupsCard key={item.id} item={item} />;
        return <OthersCard key={item.id} item={item} />;
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl">📢</span>
                    <h1 className="text-2xl font-bold text-text-primary">Informasi Harian</h1>
                </div>
                <p className="text-sm text-text-muted ml-10">Informasi penting dari emiten</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-border/50 overflow-x-auto">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 cursor-pointer ${activeTab === tab.key
                                ? "text-accent border-accent"
                                : "text-text-muted border-transparent hover:text-text-primary hover:border-border"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="space-y-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
                ) : visibleData.length > 0 ? (
                    visibleData.map(renderCard)
                ) : (
                    <div className="text-center py-12">
                        <p className="text-text-muted text-sm">Tidak ada data untuk kategori ini.</p>
                    </div>
                )}
            </div>

            {/* Load more */}
            {!loading && hasMore && (
                <div className="flex justify-center mt-6">
                    <button
                        onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                        className="px-6 py-2.5 text-sm font-medium text-accent bg-accent/10 hover:bg-accent/20 border border-accent/30 rounded-xl transition-all cursor-pointer"
                    >
                        Muat lebih banyak ({allData.length - visibleCount} tersisa)
                    </button>
                </div>
            )}
        </div>
    );
}
