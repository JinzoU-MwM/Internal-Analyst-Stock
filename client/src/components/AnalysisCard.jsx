/**
 * AnalysisCard — Displays a single analysis entry.
 */
export default function AnalysisCard({ analysis }) {
    const {
        analystName,
        date,
        action,
        timeframe,
        entryPrice,
        targetPrice,
        stopLoss,
        notes,
        isActive,
    } = analysis;

    const actionColors = {
        BUY: "bg-bull/15 text-bull border-bull/30",
        SELL: "bg-bear/15 text-bear border-bear/30",
        HOLD: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        WAIT: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    };

    const timeframeLabels = {
        SCALPING: "⚡ Scalping",
        SWING: "🔄 Swing",
        INVEST: "📈 Invest",
    };

    const formattedDate = new Date(date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    return (
        <div className="bg-surface-card border border-border rounded-xl p-4 hover:border-accent/40 transition-all duration-300 group">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${actionColors[action] || "bg-surface-elevated text-text-secondary border-border"}`}
                >
                    {action}
                </span>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">
                        {timeframeLabels[timeframe] || timeframe}
                    </span>
                    {!isActive && (
                        <span className="text-xs text-text-muted bg-surface-elevated px-2 py-0.5 rounded-full">
                            Closed
                        </span>
                    )}
                </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-3 gap-2 mb-3">
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-text-muted">Entry</p>
                    <p className="text-sm font-semibold text-text-primary">
                        {entryPrice?.toLocaleString() ?? "—"}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-text-muted">Target</p>
                    <p className="text-sm font-semibold text-bull">
                        {targetPrice?.toLocaleString() ?? "—"}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-text-muted">Stop Loss</p>
                    <p className="text-sm font-semibold text-bear">
                        {stopLoss?.toLocaleString() ?? "—"}
                    </p>
                </div>
            </div>

            {/* Notes */}
            {notes && (
                <p className="text-xs text-text-secondary mb-3 leading-relaxed line-clamp-2">
                    {notes}
                </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-xs text-text-muted">{analystName}</span>
                <span className="text-xs text-text-muted">{formattedDate}</span>
            </div>
        </div>
    );
}
