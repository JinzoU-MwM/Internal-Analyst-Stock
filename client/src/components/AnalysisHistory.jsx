import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import DOMPurify from "dompurify";

/**
 * AnalysisHistory — Dual-view analysis list with delete capability.
 *
 * • Desktop (md+): HTML table with sortable columns
 * • Mobile:        Card list optimised for touch
 *
 * @param {{ analyses: Array, emptyTicker?: string, onDeleted?: (id: string) => void }} props
 */
export default function AnalysisHistory({ analyses = [], emptyTicker = "", onDeleted }) {
    const { isAdmin } = useAuth();
    const [confirmId, setConfirmId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const actionColors = {
        BUY: "bg-bull/15 text-bull border-bull/30",
        SELL: "bg-bear/15 text-bear border-bear/30",
        HOLD: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        WAIT: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    };

    const fmtDate = (d) =>
        new Date(d).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });

    const fmtPrice = (v) => (v != null ? v.toLocaleString("id-ID") : "—");

    const handleDelete = async (id) => {
        setDeleting(true);
        try {
            const token = localStorage.getItem("ia_token");
            const res = await fetch(`/api/analysis/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                onDeleted?.(id);
            }
        } catch {
            /* silent */
        } finally {
            setDeleting(false);
            setConfirmId(null);
        }
    };

    // ── Empty state ──────────────────────────────────────────
    if (!analyses.length) {
        return (
            <div className="bg-surface-card border border-border rounded-xl p-8 text-center text-text-muted">
                <p className="text-sm">
                    Belum ada analisis untuk {emptyTicker || "saham ini"}.
                </p>
                <p className="text-xs mt-1">
                    Gunakan form di samping untuk menambahkan analisis pertama.
                </p>
            </div>
        );
    }

    return (
        <>
            {/* ═══════════════════════════════════════════════════
                DESKTOP — Table (hidden below md)
               ═══════════════════════════════════════════════════ */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-surface-elevated text-text-muted text-xs uppercase tracking-wider">
                            <th className="text-left px-4 py-3 font-semibold">
                                Tanggal
                            </th>
                            <th className="text-left px-4 py-3 font-semibold">
                                Sinyal
                            </th>
                            <th className="text-left px-4 py-3 font-semibold">
                                Timeframe
                            </th>
                            <th className="text-right px-4 py-3 font-semibold">
                                Entry
                            </th>
                            <th className="text-right px-4 py-3 font-semibold">
                                Target
                            </th>
                            <th className="text-right px-4 py-3 font-semibold">
                                Stop Loss
                            </th>
                            <th className="text-left px-4 py-3 font-semibold">
                                Analis
                            </th>
                            {isAdmin && (
                                <th className="text-center px-4 py-3 font-semibold w-20">
                                    Aksi
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {analyses.map((a) => (
                            <React.Fragment key={a._id}>
                                <tr
                                    className="bg-surface-card hover:bg-surface-elevated/60 transition-colors"
                                >
                                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                                        {fmtDate(a.date)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${actionColors[a.action] ||
                                                "bg-surface-elevated text-text-secondary border-border"
                                                }`}
                                        >
                                            {a.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                                        {a.timeframe || "—"}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-text-primary tabular-nums">
                                        {fmtPrice(a.entryPrice)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-bull tabular-nums">
                                        {fmtPrice(a.targetPrice)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-bear tabular-nums">
                                        {fmtPrice(a.stopLoss)}
                                    </td>
                                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                                        {a.analystName || "—"}
                                    </td>
                                    {isAdmin && (
                                        <td className="px-4 py-3 text-center">
                                            {confirmId === a._id ? (
                                                <div className="flex items-center gap-1 justify-center">
                                                    <button
                                                        onClick={() => handleDelete(a._id)}
                                                        disabled={deleting}
                                                        className="text-[10px] font-medium text-bear bg-bear/15 hover:bg-bear/25 border border-bear/30 px-2 py-1 rounded cursor-pointer disabled:opacity-50"
                                                    >
                                                        {deleting ? "…" : "Ya"}
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmId(null)}
                                                        className="text-[10px] text-text-muted hover:text-text-primary px-2 py-1 rounded cursor-pointer"
                                                    >
                                                        Tidak
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmId(a._id)}
                                                    className="p-1.5 rounded-lg text-text-muted hover:text-bear hover:bg-bear/10 transition-all cursor-pointer"
                                                    title="Hapus analisis"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                                {/* Notes row */}
                                {a.notes && (
                                    <tr className="bg-surface-card/50">
                                        <td colSpan={isAdmin ? 8 : 7} className="px-4 py-2 border-t border-border/30">
                                            <div
                                                className="prose prose-invert prose-sm max-w-none text-text-secondary"
                                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(a.notes) }}
                                            />
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ═══════════════════════════════════════════════════
                MOBILE — Card list (hidden at md+)
               ═══════════════════════════════════════════════════ */}
            <div className="md:hidden space-y-3">
                {analyses.map((a) => (
                    <div
                        key={a._id}
                        className="bg-surface-card border border-border rounded-xl p-4 space-y-3"
                    >
                        {/* Top row: Signal badge + Timeframe */}
                        <div className="flex items-center justify-between">
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border ${actionColors[a.action] ||
                                    "bg-surface-elevated text-text-secondary border-border"
                                    }`}
                            >
                                {a.action}
                            </span>
                            <span className="text-xs text-text-muted">
                                {a.timeframe || "—"}
                            </span>
                        </div>

                        {/* Middle: Prices grid */}
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-text-muted">
                                    Entry
                                </p>
                                <p className="text-sm font-semibold text-text-primary tabular-nums">
                                    {fmtPrice(a.entryPrice)}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-text-muted">
                                    Target
                                </p>
                                <p className="text-sm font-semibold text-bull tabular-nums">
                                    {fmtPrice(a.targetPrice)}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-text-muted">
                                    Stop Loss
                                </p>
                                <p className="text-sm font-semibold text-bear tabular-nums">
                                    {fmtPrice(a.stopLoss)}
                                </p>
                            </div>
                        </div>

                        {/* Notes (if any) */}
                        {a.notes && (
                            <div
                                className="prose prose-invert prose-xs max-w-none text-text-secondary line-clamp-3"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(a.notes) }}
                            />
                        )}

                        {/* Bottom: Analyst + Date + Delete */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-text-muted">
                                    {a.analystName || "—"}
                                </span>
                                <span className="text-xs text-text-muted">
                                    {fmtDate(a.date)}
                                </span>
                            </div>
                            {isAdmin && (
                                confirmId === a._id ? (
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => handleDelete(a._id)}
                                            disabled={deleting}
                                            className="text-[11px] font-medium text-bear bg-bear/15 hover:bg-bear/25 border border-bear/30 px-2.5 py-1 rounded-lg cursor-pointer disabled:opacity-50"
                                        >
                                            {deleting ? "…" : "Hapus"}
                                        </button>
                                        <button
                                            onClick={() => setConfirmId(null)}
                                            className="text-[11px] text-text-muted px-2 py-1 cursor-pointer"
                                        >
                                            Batal
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setConfirmId(a._id)}
                                        className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-text-muted hover:text-bear hover:bg-bear/10 transition-all cursor-pointer"
                                        title="Hapus analisis"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
