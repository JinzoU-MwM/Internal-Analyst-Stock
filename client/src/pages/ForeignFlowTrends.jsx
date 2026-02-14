
import { RefreshCw, Filter } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from "recharts";

export default function ForeignFlowTrends({ type, setType, lookback, setLookback, data, loading, onRefresh }) {
    const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 bg-surface-card p-4 rounded-xl border border-border/50">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-text-muted">Tipe Flow</label>
                    <div className="flex bg-surface-elevated rounded-lg p-0.5 border border-border">
                        {['accumulation', 'distribution'].map(t => (
                            <button
                                key={t}
                                onClick={() => setType(t)}
                                className={`px-4 py-1.5 text-xs font-medium rounded-md capitalize transition-all cursor-pointer ${type === t
                                        ? (t === 'accumulation' ? 'bg-emerald-500/10 text-emerald-400 shadow-sm' : 'bg-rose-500/10 text-rose-400 shadow-sm')
                                        : 'text-text-muted hover:text-text-primary'
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-text-muted">Durasi (Hari)</label>
                    <select
                        value={lookback}
                        onChange={(e) => setLookback(Number(e.target.value))}
                        className="bg-surface-elevated border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent min-w-[100px]"
                    >
                        <option value={7}>7 Hari</option>
                        <option value={14}>14 Hari</option>
                        <option value={30}>30 Hari</option>
                    </select>
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

            {loading && !data && <div className="text-center py-20 text-text-muted">Memuat data trends...</div>}

            {data && (
                <div className="bg-surface-card rounded-xl border border-border/50 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-surface-elevated text-text-muted text-xs uppercase border-b border-border/50">
                                <tr>
                                    <th className="px-6 py-4 text-left font-medium">Rank</th>
                                    <th className="px-6 py-4 text-left font-medium">Stock</th>
                                    <th className="px-6 py-4 text-left font-medium">Consistency</th>
                                    <th className="px-6 py-4 text-right font-medium">Total Net Flow</th>
                                    <th className="px-6 py-4 text-right font-medium">Gain/Loss</th>
                                    <th className="px-6 py-4 text-center font-medium w-[180px]">Trend Chart</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {data.stocks?.map((stock, idx) => (
                                    <tr key={stock.stock_code} className="hover:bg-surface-elevated/50 group transition-colors">
                                        <td className="px-6 py-4 text-text-muted w-16 text-center">{idx + 1}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${type === 'accumulation' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                                    }`}>
                                                    {stock.stock_code.substring(0, 1)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-text-primary">{stock.stock_code}</div>
                                                    <div className="text-[10px] text-text-muted truncate max-w-[150px]">{stock.stock_name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-text-muted">Rate</span>
                                                    <span className="font-medium text-text-primary">{stock.appearance_rate}</span>
                                                </div>
                                                <div className="flex gap-1">
                                                    {/* Visualize consistency dots */}
                                                    {/* We don't have exact dot history easily mappable without complex logic, 
                                                         but we can show progress bar or just appearances count 
                                                         Actually stock.total_days is total, appearances is active.
                                                         Let's show a simple progress bar
                                                     */}
                                                    <div className="w-24 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${type === 'accumulation' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                            style={{ width: `${(stock.appearances / stock.total_days) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold tabular-nums ${type === 'accumulation' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {formatIDR(stock.total_net_value)}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-medium`}>
                                            <span className={`${Number(stock.period_return) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {stock.period_return}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 w-[180px]">
                                            <div className="w-[140px] h-[40px] mx-auto">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={stock.daily_data ? [...stock.daily_data].reverse() : []}>
                                                        <Line
                                                            type="monotone"
                                                            dataKey="n"
                                                            stroke={type === 'accumulation' ? '#10b981' : '#f43f5e'}
                                                            strokeWidth={2}
                                                            dot={false}
                                                            isAnimationActive={false}
                                                        />
                                                        <YAxis hide domain={['dataMin', 'dataMax']} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
