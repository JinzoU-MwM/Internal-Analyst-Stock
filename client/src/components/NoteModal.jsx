import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import DOMPurify from "dompurify";

/**
 * NoteModal — Adaptive floating panel for full note content.
 *
 * • Mobile (default):  Bottom sheet sliding up (w-full, h-[90vh], rounded-t-2xl)
 * • Desktop (md+):     Side panel sliding in from the right (h-full, w-2/3 lg:w-1/2)
 *
 * Fetches the full document by ID from GET /api/fundamental-notes/detail/:id
 *
 * @param {{ noteId: string, notePreview: object, onClose: () => void, onDeleted?: () => void }} props
 */
export default function NoteModal({ noteId, notePreview, onClose, onDeleted }) {
    const { isAdmin } = useAuth();
    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [visible, setVisible] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const panelRef = useRef(null);

    // Trigger enter animation after mount
    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
    }, []);

    // Fetch note data
    useEffect(() => {
        if (!noteId) return;
        setLoading(true);
        fetch(`/api/fundamental-notes/detail/${noteId}`)
            .then((r) => r.json())
            .then((res) => {
                if (res.success) setNote(res.data);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [noteId]);

    // Close on Escape key
    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Escape") handleClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    /** Animate out then call onClose */
    const handleClose = () => {
        setVisible(false);
        setTimeout(onClose, 280);
    };

    /** Delete note with confirmation */
    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/fundamental-notes/${noteId}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.success) {
                setVisible(false);
                setTimeout(() => {
                    onClose();
                    onDeleted?.();
                }, 280);
            }
        } catch {
            /* silent */
        } finally {
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    const methodLabel = {
        DCF: {
            text: "Discounted Cash Flow",
            color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        },
        Relative: {
            text: "Relative Valuation",
            color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        },
        AssetBased: {
            text: "Asset-Based Valuation",
            color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        },
    };

    const method =
        methodLabel[note?.valuationMethod] ??
        methodLabel[notePreview?.valuationMethod];

    return (
        <div className="fixed inset-0 z-[100]">
            {/* ── Backdrop ────────────────────────────────────── */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"
                    }`}
                onClick={handleClose}
            />

            {/* ── Panel ───────────────────────────────────────── */}
            <div
                ref={panelRef}
                className={[
                    "absolute bg-surface-card shadow-2xl flex flex-col overflow-hidden",
                    "transition-transform duration-300 ease-out",
                    "inset-x-0 bottom-0 h-[90vh] rounded-t-2xl",
                    visible ? "translate-y-0" : "translate-y-full",
                    "md:inset-y-0 md:right-0 md:left-auto md:bottom-auto",
                    "md:w-2/3 lg:w-1/2 md:h-full md:rounded-t-none md:rounded-l-2xl",
                    visible ? "md:translate-x-0" : "md:translate-x-full",
                    visible ? "" : "md:translate-y-0",
                ]
                    .filter(Boolean)
                    .join(" ")}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Mobile drag handle ──────────────────────── */}
                <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1.5 rounded-full bg-text-muted/30" />
                </div>

                {/* ── Header ──────────────────────────────────── */}
                <div className="flex items-start justify-between px-5 sm:px-6 py-4 border-b border-border shrink-0">
                    <div className="min-w-0 flex-1 mr-4">
                        <h3 className="text-base sm:text-lg font-bold text-text-primary leading-snug">
                            {loading
                                ? (notePreview?.title ?? "Memuat…")
                                : note?.title}
                        </h3>
                        <div className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap">
                            <span className="text-[11px] sm:text-xs text-text-muted flex items-center gap-1">
                                <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                </svg>
                                {note?.analystName ??
                                    notePreview?.analystName ??
                                    "—"}
                            </span>
                            <span className="text-[11px] sm:text-xs text-text-muted flex items-center gap-1">
                                <svg
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                {new Date(
                                    note?.date ?? notePreview?.date
                                ).toLocaleDateString("id-ID", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </span>
                            {method && (
                                <span
                                    className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full border ${method.color}`}
                                >
                                    {method.text}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="shrink-0 p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-all cursor-pointer"
                        aria-label="Close"
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

                {/* ── Body ────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 overscroll-contain">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
                            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3" />
                            <p className="text-sm">Memuat catatan…</p>
                        </div>
                    ) : note ? (
                        <div
                            className="prose prose-invert prose-sm max-w-none text-text-secondary"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.content) }}
                        />
                    ) : (
                        <div className="text-center py-16 text-text-muted text-sm">
                            Catatan tidak ditemukan.
                        </div>
                    )}
                </div>

                {/* ── Footer ──────────────────────────────────── */}
                <div className="px-5 sm:px-6 py-3 border-t border-border bg-surface-elevated/50 shrink-0 flex items-center justify-between">
                    {/* Delete button (admin only) */}
                    {isAdmin && !loading && note ? (
                        confirmDelete ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-bear">Hapus catatan ini?</span>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="text-xs font-medium bg-bear/15 text-bear hover:bg-bear/25 border border-bear/30 px-3 py-2 min-h-[36px] rounded-lg transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {deleting ? "Menghapus…" : "Ya, Hapus"}
                                </button>
                                <button
                                    onClick={() => setConfirmDelete(false)}
                                    className="text-xs text-text-muted hover:text-text-primary px-3 py-2 min-h-[36px] rounded-lg hover:bg-surface-card transition-all cursor-pointer"
                                >
                                    Batal
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setConfirmDelete(true)}
                                className="flex items-center gap-1.5 text-xs text-text-muted hover:text-bear px-3 py-2 min-h-[36px] rounded-lg hover:bg-bear/10 transition-all cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Hapus
                            </button>
                        )
                    ) : (
                        <div />
                    )}

                    <button
                        onClick={handleClose}
                        className="text-xs text-text-muted hover:text-text-primary px-4 py-2 min-h-[36px] rounded-lg hover:bg-surface-card transition-all cursor-pointer"
                    >
                        Tutup (Esc)
                    </button>
                </div>
            </div>
        </div>
    );
}
