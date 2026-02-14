import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { Users, ExternalLink, RefreshCw } from "lucide-react";

export default function KonglomeratPage() {
    const { token } = useAuth();
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState("");
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch available groups on mount
    useEffect(() => {
        fetchGroups();
    }, []);

    // Fetch data when group changes
    useEffect(() => {
        if (selectedGroup) {
            fetchData(selectedGroup);
        }
    }, [selectedGroup]);

    const fetchGroups = async () => {
        try {
            const res = await fetch("/api/konglomerat/list", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setGroups(json.groups);
                // Select "Prajogo Pangestu" by default if exists, else first one
                if (json.groups.includes("Prajogo Pangestu")) {
                    setSelectedGroup("Prajogo Pangestu");
                } else if (json.groups.length > 0) {
                    setSelectedGroup(json.groups[0]);
                }
            }
        } catch (e) {
            toast.error("Gagal memuat daftar grup");
        }
    };

    const fetchData = async (group) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/konglomerat?group=${encodeURIComponent(group)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                throw new Error(`Server returned non-JSON: ${res.status} ${text.substring(0, 50)}`);
            }

            const json = await res.json();
            if (json.success) {
                // Sort by Top Buyer Value (net_val) decending if available?
                // Or by price change?
                // Default API return seems random or sorted by code.
                const list = Array.isArray(json.data) ? json.data : [];
                // Helper to get change pct
                const getChange = (i) => {
                    if (i.priceChangePct !== undefined) return i.priceChangePct;
                    const p = (i.priceHistory && i.priceHistory[0]) || 0;
                    const prev = (i.priceHistory && i.priceHistory[1]) || p;
                    return prev ? ((p - prev) / prev) * 100 : 0;
                };
                const sorted = list.sort((a, b) => getChange(b) - getChange(a));
                setData(sorted);
            } else {
                toast.error(json.error || "Gagal memuat data");
                setData([]);
            }
        } catch (e) {
            console.error("Fetch error:", e);
            toast.error(`Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="min-h-screen bg-background text-text-primary pb-20">
            {/* Header */}
            <div className="border-b border-border/50 bg-surface-card/50 backdrop-blur-sm sticky top-0 md:top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-text-primary">Konglomerat Watch</h1>
                            <p className="text-xs text-text-muted">Pantau performa saham grup konglomerasi</p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Group Selector */}
                <div className="flex flex-wrap gap-2">
                    {groups.map(g => (
                        <button
                            key={g}
                            onClick={() => setSelectedGroup(g)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${selectedGroup === g
                                ? "bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-sm"
                                : "bg-surface-elevated text-text-muted border-transparent hover:text-text-primary"
                                }`}
                        >
                            {g}
                        </button>
                    ))}
                </div>

                {/* Data Table */}
                <div className="bg-surface-card rounded-xl border border-border/50 overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                        <h2 className="text-base font-semibold">{selectedGroup} Performance</h2>
                        <button
                            onClick={() => fetchData(selectedGroup)}
                            className="p-2 hover:bg-surface-elevated rounded-lg transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-4 h-4 text-text-muted ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-surface-elevated text-text-muted text-xs uppercase border-b border-border/50">
                                <tr>
                                    <th className="px-6 py-4 text-left font-medium">Stock</th>
                                    <th className="px-6 py-4 text-right font-medium">Price</th>
                                    <th className="px-6 py-4 text-right font-medium">Change %</th>
                                    <th className="px-6 py-4 text-left font-medium">Top Buyers</th>
                                    <th className="px-6 py-4 text-left font-medium">Top Sellers</th>
                                    {/* <th className="px-6 py-4 text-right font-medium">Vol Raw</th> */}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {loading && data.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-text-muted">
                                            Loading data...
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-text-muted">
                                            No data available for this group.
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((item, idx) => {
                                        const price = item.close || item.price || (item.priceHistory && item.priceHistory[0]) || 0;
                                        const prevPrice = (item.priceHistory && item.priceHistory[1]) || price;
                                        const change = price - prevPrice;
                                        const changePct = item.priceChangePct !== undefined ? item.priceChangePct : (prevPrice ? (change / prevPrice) * 100 : 0);

                                        return (
                                            <tr key={item.stockCode || item.code || idx} className="hover:bg-surface-elevated/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-text-primary">{item.stockCode || item.code}</div>
                                                    <div className="text-[10px] text-text-muted">{item.stockName || item.name || ''}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums text-text-primary font-medium">
                                                    {formatIDR(price)}
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${(changePct || 0) > 0
                                                        ? "bg-emerald-500/10 text-emerald-400"
                                                        : (changePct || 0) < 0
                                                            ? "bg-rose-500/10 text-rose-400"
                                                            : "bg-surface-elevated text-text-muted"
                                                        }`}>
                                                        {(changePct || 0).toFixed(2)}%
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        {(item.topBuyers || []).slice(0, 3).map(b => (
                                                            <span key={b} className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded border border-emerald-500/20">
                                                                {b}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        {(item.topSellers || []).slice(0, 3).map(s => (
                                                            <span key={s} className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 text-[10px] rounded border border-rose-500/20">
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
