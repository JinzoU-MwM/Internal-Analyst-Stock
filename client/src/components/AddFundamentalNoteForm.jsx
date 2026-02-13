import { useState } from "react";
import RichEditor from "./RichEditor";

/**
 * AddFundamentalNoteForm — Modal form to create a new Fundamental Note.
 * Uses RichEditor for the content field.
 *
 * @param {{ ticker: string, onClose: () => void, onSuccess: () => void, initialTitle?: string, initialContent?: string }} props
 */
export default function AddFundamentalNoteForm({ ticker, onClose, onSuccess, initialTitle = "", initialContent = "" }) {
    const [form, setForm] = useState({
        title: initialTitle,
        analystName: "",
        valuationMethod: "DCF",
        content: initialContent,
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Strip HTML tags for empty check
        const plainContent = form.content.replace(/<[^>]*>/g, "").trim();
        if (!form.title.trim() || !form.analystName.trim() || !plainContent) {
            setError("Semua field wajib diisi.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/fundamental-notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, ticker }),
            });
            const data = await res.json();

            if (data.success) {
                onSuccess();
                onClose();
            } else {
                setError(data.details?.join(", ") || data.error || "Gagal menyimpan.");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-surface-card border border-border rounded-2xl w-full max-w-xl shadow-2xl animate-scale-in flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                    <h3 className="text-base font-semibold text-text-primary">
                        📝 Tambah Catatan — {ticker}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-all cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form body */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                        {error && (
                            <div className="bg-bear/10 border border-bear/30 text-bear rounded-lg px-3 py-2 text-xs">
                                {error}
                            </div>
                        )}

                        {/* Title */}
                        <div>
                            <label className="block text-xs font-medium text-text-muted mb-1.5">
                                Judul Catatan
                            </label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => update("title", e.target.value)}
                                placeholder="contoh: Analisis DCF BBRI Q1 2026"
                                maxLength={200}
                                className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
                            />
                        </div>

                        {/* Analyst + Method row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-text-muted mb-1.5">
                                    Nama Analis
                                </label>
                                <input
                                    type="text"
                                    value={form.analystName}
                                    onChange={(e) => update("analystName", e.target.value)}
                                    placeholder="contoh: Andi"
                                    className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-text-muted mb-1.5">
                                    Metode Valuasi
                                </label>
                                <select
                                    value={form.valuationMethod}
                                    onChange={(e) => update("valuationMethod", e.target.value)}
                                    className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-3 text-base text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all cursor-pointer"
                                >
                                    <option value="DCF">DCF (Discounted Cash Flow)</option>
                                    <option value="Relative">Relative Valuation</option>
                                    <option value="AssetBased">Asset-Based Valuation</option>
                                </select>
                            </div>
                        </div>

                        {/* Content — Rich Text Editor */}
                        <div>
                            <label className="block text-xs font-medium text-text-muted mb-1.5">
                                Konten Analisis
                            </label>
                            <RichEditor
                                value={form.content}
                                onChange={(html) => update("content", html)}
                                placeholder="Tulis analisis fundamental Anda di sini…"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-sm text-text-muted hover:text-text-primary px-4 py-3 min-h-[44px] rounded-lg hover:bg-surface-elevated transition-all cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="text-sm font-medium bg-gradient-to-r from-accent to-purple-500 hover:from-accent-hover hover:to-purple-400 text-white px-5 py-3 min-h-[44px] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-accent/20"
                        >
                            {submitting ? "Menyimpan…" : "Simpan Catatan"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
