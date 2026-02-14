import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, LineChart, Line } from "recharts";
import toast from "react-hot-toast";

const COLORS = ["#00C49F", "#FFBB28", "#FF8042", "#0088FE", "#A855F7", "#EC4899", "#14B8A6", "#F97316", "#6366F1"];

const formatNumber = (n) => {
    if (!n && n !== 0) return "-";
    const num = typeof n === "string" ? parseInt(n) : n;
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toLocaleString("id-ID");
};

const formatShortDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
};

const BadgeTag = ({ badge }) => {
    const colors = {
        pengendali: "bg-red-500/20 text-red-400 border-red-500/30",
        direksi: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        komisaris: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    };
    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${colors[badge] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
            {badge}
        </span>
    );
};

// Skeleton
const SectionSkeleton = () => (
    <div className="bg-surface-card border border-border rounded-2xl p-5 animate-pulse">
        <div className="h-5 w-40 bg-surface-elevated rounded mb-4" />
        <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-surface-elevated rounded" style={{ width: `${90 - i * 15}%` }} />)}
        </div>
    </div>
);

export default function OwnershipPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [ticker, setTicker] = useState(searchParams.get("ticker") || "BBCA");
    const [inputVal, setInputVal] = useState(ticker);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async (t) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("ia_token");
            const res = await fetch(`/api/ownership?ticker=${t}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (json.success) {
                setData(json);
            } else {
                toast.error(json.error || "Gagal memuat data");
                setData(null);
            }
        } catch {
            toast.error("Gagal memuat data ownership");
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const t = searchParams.get("ticker");
        if (t && t !== ticker) {
            setTicker(t);
            setInputVal(t);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchData(ticker);
    }, [ticker, fetchData]);

    const handleSearch = (e) => {
        e.preventDefault();
        const clean = inputVal.replace(/\.JK$/i, "").toUpperCase().trim();
        if (clean) {
            setTicker(clean);
            setSearchParams({ ticker: clean });
        }
    };

    // ── Chart data ──
    const compositionData = useMemo(() => {
        if (!data?.investor_breakdown) return [];
        const b = data.investor_breakdown;
        return [
            { name: "Lokal", value: b.local_pct },
            { name: "Asing", value: b.foreign_pct },
        ];
    }, [data]);

    const investorTypeData = useMemo(() => {
        if (!data?.investor_breakdown) return [];
        const b = data.investor_breakdown;
        const total = b.total_securities || 1;
        const types = [
            { name: "Individu", local: b.local_detail.individual, foreign: b.foreign_detail.individual },
            { name: "Korporasi", local: b.local_detail.corporate, foreign: b.foreign_detail.corporate },
            { name: "Reksadana", local: b.local_detail.mutual_fund, foreign: b.foreign_detail.mutual_fund },
            { name: "Inv. Bank", local: b.local_detail.investment_bank, foreign: b.foreign_detail.investment_bank },
            { name: "Asuransi", local: b.local_detail.insurance, foreign: b.foreign_detail.insurance },
            { name: "Dana Pensiun", local: b.local_detail.pension_fund, foreign: b.foreign_detail.pension_fund },
            { name: "Sekuritas", local: b.local_detail.securities, foreign: b.foreign_detail.securities },
        ];
        return types
            .map((t) => ({
                name: t.name,
                local: ((t.local / total) * 100).toFixed(2),
                foreign: ((t.foreign / total) * 100).toFixed(2),
                localShares: t.local,
                foreignShares: t.foreign,
            }))
            .filter((t) => parseFloat(t.local) > 0.01 || parseFloat(t.foreign) > 0.01)
            .sort((a, b) => parseFloat(b.local) + parseFloat(b.foreign) - parseFloat(a.local) - parseFloat(a.foreign));
    }, [data]);

    const foreignTrendData = useMemo(() => {
        if (!data?.ownership_history?.length) return [];
        return data.ownership_history.map((d) => ({
            date: formatShortDate(d.date),
            foreign: parseFloat(d.foreign_pct),
            local: parseFloat(d.local_pct),
            price: d.price,
        }));
    }, [data]);

    const shareholderCountData = useMemo(() => {
        if (!data?.shareholder_counts?.length) return [];
        return data.shareholder_counts.map((d) => ({
            date: formatShortDate(d.date),
            count: d.count,
        }));
    }, [data]);

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            {/* Header + Search */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Ownership — {data?.ticker || ticker}
                    </h1>
                    <p className="text-sm text-text-muted mt-0.5">Data kepemilikan saham dari KSEI & IDX</p>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value.toUpperCase())}
                        placeholder="Kode saham..."
                        className="bg-surface-elevated border border-border rounded-xl px-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent w-36"
                    />
                    <button type="submit" className="bg-accent/10 text-accent px-4 py-2 rounded-xl text-sm font-medium hover:bg-accent/20 transition-colors border border-accent/30 cursor-pointer">
                        Cari
                    </button>
                </form>
            </div>

            {loading ? (
                <div className="grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map((i) => <SectionSkeleton key={i} />)}</div>
            ) : !data ? (
                <div className="text-center py-20 text-text-muted">Masukkan kode saham untuk melihat data kepemilikan.</div>
            ) : (
                <div className="space-y-6">
                    {/* ── Top Stats ── */}
                    {data.investor_breakdown && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <StatCard label="Asing" value={`${data.investor_breakdown.foreign_pct}%`} sub={formatNumber(data.investor_breakdown.foreign_total)} color="text-amber-400" />
                            <StatCard label="Lokal" value={`${data.investor_breakdown.local_pct}%`} sub={formatNumber(data.investor_breakdown.local_total)} color="text-emerald-400" />
                            <StatCard label="Total Saham" value={formatNumber(data.investor_breakdown.total_securities)} />
                            <StatCard label="Jumlah Pemegang" value={data.stats?.shareholder_count ? formatNumber(data.stats.shareholder_count) : "-"} />
                        </div>
                    )}

                    {/* ── Row 1: Composition + Foreign/Local Trend ── */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Composition Pie */}
                        {compositionData.length > 0 && (
                            <div className="bg-surface-card border border-border rounded-2xl p-5">
                                <h3 className="text-lg font-bold text-text-primary mb-4">Komposisi Lokal vs Asing</h3>
                                <div className="flex justify-center">
                                    <PieChart width={280} height={220}>
                                        <Pie data={compositionData} innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" cx="50%" cy="45%">
                                            {compositionData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: "#1e1e1e", borderColor: "#2d2d2d", color: "#fff" }} formatter={(v) => `${v.toFixed(2)}%`} />
                                        <Legend verticalAlign="bottom" height={30} />
                                    </PieChart>
                                </div>
                            </div>
                        )}

                        {/* Foreign/Local Trend */}
                        {foreignTrendData.length > 0 && (
                            <div className="bg-surface-card border border-border rounded-2xl p-5">
                                <h3 className="text-lg font-bold text-text-primary mb-4">Tren Asing vs Lokal (12 Bulan)</h3>
                                <ResponsiveContainer width="100%" height={220} minWidth={0} minHeight={0}>
                                    <AreaChart data={foreignTrendData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" />
                                        <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 11 }} />
                                        <YAxis tick={{ fill: "#888", fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                                        <Tooltip contentStyle={{ backgroundColor: "#1e1e1e", borderColor: "#2d2d2d", color: "#fff" }} formatter={(v) => `${v}%`} />
                                        <Area type="monotone" dataKey="local" stackId="1" fill="#00C49F" stroke="#00C49F" fillOpacity={0.3} name="Lokal" />
                                        <Area type="monotone" dataKey="foreign" stackId="1" fill="#FFBB28" stroke="#FFBB28" fillOpacity={0.3} name="Asing" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* ── Row 2: Investor Type Breakdown + Shareholder Count ── */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {investorTypeData.length > 0 && (
                            <div className="bg-surface-card border border-border rounded-2xl p-5">
                                <h3 className="text-lg font-bold text-text-primary mb-4">Breakdown Tipe Investor</h3>
                                <ResponsiveContainer width="100%" height={250} minWidth={0} minHeight={0}>
                                    <BarChart data={investorTypeData} layout="vertical" margin={{ left: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" />
                                        <XAxis type="number" tick={{ fill: "#888", fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                                        <YAxis dataKey="name" type="category" tick={{ fill: "#ccc", fontSize: 11 }} width={80} />
                                        <Tooltip contentStyle={{ backgroundColor: "#1e1e1e", borderColor: "#2d2d2d", color: "#fff" }} formatter={(v, name) => [`${v}%`, name === "local" ? "Lokal" : "Asing"]} />
                                        <Bar dataKey="local" fill="#00C49F" name="Lokal" stackId="a" radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="foreign" fill="#FFBB28" name="Asing" stackId="a" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {shareholderCountData.length > 0 && (
                            <div className="bg-surface-card border border-border rounded-2xl p-5">
                                <h3 className="text-lg font-bold text-text-primary mb-4">Jumlah Pemegang Saham</h3>
                                <ResponsiveContainer width="100%" height={250} minWidth={0} minHeight={0}>
                                    <LineChart data={shareholderCountData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" />
                                        <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 11 }} />
                                        <YAxis tick={{ fill: "#888", fontSize: 11 }} tickFormatter={(v) => formatNumber(v)} />
                                        <Tooltip contentStyle={{ backgroundColor: "#1e1e1e", borderColor: "#2d2d2d", color: "#fff" }} formatter={(v) => formatNumber(v)} />
                                        <Line type="monotone" dataKey="count" stroke="#A855F7" strokeWidth={2} dot={{ r: 3, fill: "#A855F7" }} name="Pemegang" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* ── Major Shareholders Table ── */}
                    {data.shareholders?.length > 0 && (
                        <div className="bg-surface-card border border-border rounded-2xl p-5 overflow-x-auto">
                            <h3 className="text-lg font-bold text-text-primary mb-4">Pemegang Saham Utama</h3>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/50 text-text-muted">
                                        <th className="text-left px-3 py-2 font-medium">Nama</th>
                                        <th className="text-right px-3 py-2 font-medium">Kepemilikan</th>
                                        <th className="text-right px-3 py-2 font-medium">Nilai</th>
                                        <th className="text-center px-3 py-2 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.shareholders.map((s, i) => (
                                        <tr key={i} className="border-b border-border/30 hover:bg-surface-elevated/30 transition-colors">
                                            <td className="px-3 py-3 text-text-primary font-medium">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {s.name}
                                                    {s.badges?.map((b) => <BadgeTag key={b} badge={b} />)}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                <span className="text-accent font-semibold">{s.percentage.toFixed(4)}%</span>
                                            </td>
                                            <td className="px-3 py-3 text-right text-text-secondary">{s.share_value || "-"}</td>
                                            <td className="px-3 py-3 text-center">
                                                {s.is_insider ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-blue-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Insider
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-text-muted">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ── Current KSEI Holders ── */}
                    {data.current_holders?.length > 0 && (
                        <div className="bg-surface-card border border-border rounded-2xl p-5 overflow-x-auto">
                            <h3 className="text-lg font-bold text-text-primary mb-1">Data KSEI (Terkini)</h3>
                            <p className="text-xs text-text-muted mb-4">
                                Terakhir dikumpulkan: {data.current_holders[0]?.date ? new Date(data.current_holders[0].date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                            </p>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/50 text-text-muted">
                                        <th className="text-left px-3 py-2 font-medium">Nama</th>
                                        <th className="text-right px-3 py-2 font-medium">Saham</th>
                                        <th className="text-right px-3 py-2 font-medium">%</th>
                                        <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Broker</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.current_holders.map((h, i) => (
                                        <tr key={i} className="border-b border-border/30 hover:bg-surface-elevated/30 transition-colors">
                                            <td className="px-3 py-3 text-text-primary font-medium">{h.name}</td>
                                            <td className="px-3 py-3 text-right text-text-secondary">{formatNumber(h.shares)}</td>
                                            <td className="px-3 py-3 text-right">
                                                <span className="text-accent font-semibold">{h.percentage.toFixed(2)}%</span>
                                            </td>
                                            <td className="px-3 py-3 text-left text-text-muted text-xs hidden sm:table-cell">{h.broker || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ── Executives ── */}
                    {data.executives?.length > 0 && (
                        <div className="bg-surface-card border border-border rounded-2xl p-5">
                            <h3 className="text-lg font-bold text-text-primary mb-4">Dewan Direksi & Komisaris</h3>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {data.executives.map((e, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-surface-elevated/30 rounded-xl">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent/20 to-purple-500/20 flex items-center justify-center text-accent text-sm font-bold shrink-0">
                                            {e.name?.[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-text-primary truncate">{e.name}</p>
                                            <p className="text-xs text-text-muted">{e.position}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Stat card component ──
function StatCard({ label, value, sub, color = "text-text-primary" }) {
    return (
        <div className="bg-surface-card border border-border rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-wider text-text-muted mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            {sub && <p className="text-xs text-text-muted mt-0.5">{sub} saham</p>}
        </div>
    );
}
