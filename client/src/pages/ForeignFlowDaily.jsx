
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

export default function ForeignFlowDaily({ date, setDate, data, loading, onRefresh }) {
    const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 bg-surface-card p-4 rounded-xl border border-border/50">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-text-muted">Tanggal</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-surface-elevated border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent"
                    />
                </div>
                <div className="mt-auto">
                    <button
                        onClick={onRefresh}
                        className="p-2 bg-surface-elevated hover:bg-surface-highlight border border-border rounded-lg text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {loading && !data && <div className="text-center py-10 text-text-muted">Memuat data...</div>}

            {data && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Accumulation */}
                    <div className="bg-surface-card rounded-xl border border-border/50 overflow-hidden">
                        <div className="p-4 border-b border-border/50 flex justify-between items-center bg-gradient-to-r from-emerald-500/5 to-transparent">
                            <h3 className="font-semibold text-emerald-400 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" /> Top Accumulation
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-surface-elevated text-text-muted text-xs uppercase border-b border-border/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Rank</th>
                                        <th className="px-4 py-3 text-left font-medium">Code</th>
                                        <th className="px-4 py-3 text-right font-medium">Net Value</th>
                                        <th className="px-4 py-3 text-right font-medium">Close</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {data.accumulation?.slice(0, 20).map((item, idx) => (
                                        <tr key={item.stock_code} className="hover:bg-surface-elevated/50 transition-colors">
                                            <td className="px-4 py-2.5 text-text-muted w-12 text-center">{item.rank}</td>
                                            <td className="px-4 py-2.5 font-medium text-text-primary">
                                                <div className="flex flex-col">
                                                    <span>{item.stock_code}</span>
                                                    <span className="text-[10px] text-text-muted hidden sm:inline truncate max-w-[120px]">{item.stock_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-medium text-emerald-400">{formatIDR(item.net_value)}</td>
                                            <td className="px-4 py-2.5 text-right text-text-secondary">{item.close_price.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Distribution */}
                    <div className="bg-surface-card rounded-xl border border-border/50 overflow-hidden">
                        <div className="p-4 border-b border-border/50 flex justify-between items-center bg-gradient-to-r from-rose-500/5 to-transparent">
                            <h3 className="font-semibold text-rose-400 flex items-center gap-2">
                                <TrendingDown className="w-4 h-4" /> Top Distribution
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-surface-elevated text-text-muted text-xs uppercase border-b border-border/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Rank</th>
                                        <th className="px-4 py-3 text-left font-medium">Code</th>
                                        <th className="px-4 py-3 text-right font-medium">Net Value</th>
                                        <th className="px-4 py-3 text-right font-medium">Close</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {data.distribution?.slice(0, 20).map((item, idx) => (
                                        <tr key={item.stock_code} className="hover:bg-surface-elevated/50 transition-colors">
                                            <td className="px-4 py-2.5 text-text-muted w-12 text-center">{item.rank}</td>
                                            <td className="px-4 py-2.5 font-medium text-text-primary">
                                                <div className="flex flex-col">
                                                    <span>{item.stock_code}</span>
                                                    <span className="text-[10px] text-text-muted hidden sm:inline truncate max-w-[120px]">{item.stock_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-medium text-rose-400">{formatIDR(item.net_value)}</td>
                                            <td className="px-4 py-2.5 text-right text-text-secondary">{item.close_price.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
