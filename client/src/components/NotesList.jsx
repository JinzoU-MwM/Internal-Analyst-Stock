import { useState, useEffect } from "react";

/**
 * NotesList — Clickable list of fundamental notes for a ticker.
 * Fetches from GET /api/fundamental-notes/:ticker (lightweight, no content).
 *
 * @param {{ ticker: string, onSelect: (note) => void }} props
 */
export default function NotesList({ ticker, onSelect, refreshKey = 0 }) {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!ticker) return;
        setLoading(true);
        fetch(`/api/fundamental-notes/${encodeURIComponent(ticker)}`)
            .then((r) => r.json())
            .then((res) => {
                if (res.success) setNotes(res.data);
                else setNotes([]);
            })
            .catch(() => setNotes([]))
            .finally(() => setLoading(false));
    }, [ticker, refreshKey]);

    if (loading) {
        return (
            <div className="space-y-2 animate-pulse">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-surface-card border border-border rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-3/4 bg-surface-elevated rounded" />
                                <div className="flex gap-2">
                                    <div className="h-3 w-20 bg-surface-elevated rounded" />
                                    <div className="h-3 w-24 bg-surface-elevated rounded" />
                                </div>
                            </div>
                            <div className="h-5 w-14 bg-surface-elevated rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!notes.length) {
        return (
            <div className="bg-surface-card border border-border rounded-xl p-8 text-center text-text-muted text-sm">
                <p>Belum ada catatan fundamental untuk {ticker}.</p>
            </div>
        );
    }

    const methodColors = {
        DCF: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        Relative: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        AssetBased: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };

    return (
        <div className="space-y-2">
            {notes.map((n) => (
                <button
                    key={n._id}
                    onClick={() => onSelect(n)}
                    className="w-full text-left p-4 rounded-xl border bg-surface-card border-border hover:border-accent/30 hover:bg-accent/5 transition-all cursor-pointer group"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                                {n.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-xs text-text-muted">
                                    👤 {n.analystName}
                                </span>
                                <span className="text-xs text-text-muted">·</span>
                                <span className="text-xs text-text-muted">
                                    {new Date(n.date).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                        </div>
                        <span
                            className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border ${methodColors[n.valuationMethod] ?? "bg-surface-elevated text-text-muted border-border"
                                }`}
                        >
                            {n.valuationMethod}
                        </span>
                    </div>
                </button>
            ))}
        </div>
    );
}
