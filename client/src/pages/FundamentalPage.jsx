import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import KeyStatsGrid from "../components/KeyStatsGrid";
import FinancialStatementsTable from "../components/FinancialStatementsTable";
import NotesList from "../components/NotesList";
import NoteModal from "../components/NoteModal";
import AddFundamentalNoteForm from "../components/AddFundamentalNoteForm";

/** Lightweight markdown → HTML renderer (same as Dashboard) */
function renderMarkdown(md) {
    if (!md) return "";
    return md
        .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-text-primary mt-5 mb-2">$1</h3>')
        .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-text-primary mt-6 mb-3 pb-2 border-b border-border">$1</h2>')
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-text-primary font-semibold">$1</strong>')
        .replace(/^[*-] (.+)$/gm, '<li class="ml-4 mb-1 list-disc list-inside">$1</li>')
        .replace(/^\|(.+)\|$/gm, (_, row) => {
            const cells = row.split("|").map((c) => c.trim());
            return `<tr>${cells.map((c) => `<td class="px-3 py-1.5 border border-border">${c}</td>`).join("")}</tr>`;
        })
        .replace(/((?:<tr>.*<\/tr>\n?)+)/g, '<table class="w-full border-collapse text-xs my-3">$1</table>')
        .replace(/<tr><td[^>]*>[\s-:]+<\/td>(<td[^>]*>[\s-:]+<\/td>)*<\/tr>/g, "")
        .replace(/^(?!<[htl])((?!<).+)$/gm, '<p class="mb-2">$1</p>')
        .replace(/\n/g, "");
}

export default function FundamentalPage() {
    const { ticker: urlTicker } = useParams();
    const { isAdmin } = useAuth();
    const [searchInput, setSearchInput] = useState(urlTicker || "");
    const [activeTicker, setActiveTicker] = useState(urlTicker || "");
    const [selectedNote, setSelectedNote] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [notesRefreshKey, setNotesRefreshKey] = useState(0);

    // AI Fundamental Insight state
    const [aiInsight, setAiInsight] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);

    // Forward AI to Notes
    const [showNoteForm, setShowNoteForm] = useState(false);

    /** Normalise ticker with .JK */
    const normalize = (t) => {
        let s = t.trim().toUpperCase();
        if (s && !s.includes(".")) s += ".JK";
        return s;
    };

    const handleSearch = useCallback(
        (e) => {
            e.preventDefault();
            const t = normalize(searchInput);
            if (t) {
                setActiveTicker(t);
                setSelectedNote(null);
                setAiInsight("");
            }
        },
        [searchInput]
    );

    const handleNoteSelect = useCallback((note) => {
        setSelectedNote(note);
    }, []);

    const handleNoteAdded = useCallback(() => {
        setNotesRefreshKey((k) => k + 1);
    }, []);

    const generateAiFundamental = useCallback(async () => {
        if (!activeTicker) return;

        setAiLoading(true);
        setAiInsight("");
        setShowAiModal(true);

        try {
            const res = await fetch("/api/ai-insight/fundamental", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticker: activeTicker }),
            });
            const data = await res.json();

            if (data.success) {
                setAiInsight(data.insight);
            } else {
                setAiInsight(`Error: ${data.error}`);
            }
        } catch (err) {
            setAiInsight(`Error: ${err.message}`);
        } finally {
            setAiLoading(false);
        }
    }, [activeTicker]);

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            {/* ── Search Bar ────────────────────────────────────── */}
            <form onSubmit={handleSearch} className="mb-6">
                <div className="relative">
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Cari kode saham … contoh: BBRI"
                        className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 pl-11 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
                    />
                    <svg
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                        />
                    </svg>
                </div>
            </form>

            {/* ── Content ──────────────────────────────────────── */}
            {/* Empty state */}
            {!activeTicker && (
                <div className="flex flex-col items-center justify-center py-32 text-text-muted">
                    <svg
                        className="w-16 h-16 mb-4 opacity-30"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                    </svg>
                    <p className="text-lg font-medium">Analisis Fundamental</p>
                    <p className="text-sm mt-1">
                        Masukkan kode saham untuk melihat data fundamental
                    </p>
                </div>
            )}

            {activeTicker && (
                <div className="space-y-8">
                    {/* ── Ticker header + AI button ──────────────────── */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h2 className="text-2xl font-bold text-text-primary">
                            {activeTicker}
                        </h2>
                        {isAdmin && (
                            <button
                                onClick={generateAiFundamental}
                                disabled={aiLoading}
                                className="flex items-center gap-2 text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-4 py-2.5 min-h-[44px] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-emerald-500/20"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                {aiLoading ? "Menganalisis…" : "✨ AI Fundamental"}
                            </button>
                        )}
                    </div>

                    {/* ── Top: Key Stats ────────────────────────────── */}
                    <section>
                        <KeyStatsGrid ticker={activeTicker} />
                    </section>

                    {/* ── Financial Statements Table ───────────────── */}
                    <section>
                        <h3 className="text-lg font-semibold text-text-primary mb-4">
                            📋 Laporan Keuangan
                        </h3>
                        <FinancialStatementsTable ticker={activeTicker} />
                    </section>

                    {/* ── Bottom: Internal Notes ────────────────────── */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-text-primary">
                                📝 Catatan Fundamental Internal
                            </h3>
                            {isAdmin && (
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    className="flex items-center gap-1.5 text-sm font-medium bg-gradient-to-r from-accent to-purple-500 hover:from-accent-hover hover:to-purple-400 text-white px-4 py-2 min-h-[44px] rounded-xl transition-all cursor-pointer shadow-lg shadow-accent/20"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Tambah Catatan
                                </button>
                            )}
                        </div>

                        <NotesList
                            ticker={activeTicker}
                            refreshKey={notesRefreshKey}
                            onSelect={handleNoteSelect}
                        />
                    </section>
                </div>
            )}

            {/* ── Note Detail Modal ──────────────────────────────── */}
            {selectedNote && (
                <NoteModal
                    noteId={selectedNote._id}
                    notePreview={selectedNote}
                    onClose={() => setSelectedNote(null)}
                    onDeleted={() => {
                        setSelectedNote(null);
                        handleNoteAdded();
                    }}
                />
            )}

            {/* ── Add Note Form Modal (admin only) ──────────────── */}
            {isAdmin && showAddForm && (
                <AddFundamentalNoteForm
                    ticker={activeTicker}
                    onClose={() => setShowAddForm(false)}
                    onSuccess={handleNoteAdded}
                />
            )}

            {/* ── AI Fundamental Insight Modal ──────────────────── */}
            {showAiModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setShowAiModal(false)}
                >
                    <div
                        className="bg-surface-card border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl animate-scale-in flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">📋</span>
                                <h3 className="text-base font-semibold text-text-primary">
                                    Analisis Fundamental AI — {activeTicker}
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowAiModal(false)}
                                className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer rounded-lg hover:bg-surface-elevated"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="px-6 py-5 overflow-y-auto flex-1">
                            {aiLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                                    <p className="text-sm">Menghasilkan analisis fundamental dengan Gemini AI…</p>
                                </div>
                            ) : (
                                <div
                                    className="ai-insight-content text-text-secondary text-sm leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: renderMarkdown(aiInsight) }}
                                />
                            )}
                        </div>

                        {/* Modal footer — Forward to Notes (admin only) */}
                        {isAdmin && aiInsight && !aiLoading && (
                            <div className="px-6 py-3 border-t border-border bg-surface-elevated/50 shrink-0 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowAiModal(false);
                                        setShowNoteForm(true);
                                    }}
                                    className="flex items-center gap-2 text-sm font-medium bg-gradient-to-r from-accent to-purple-500 hover:from-accent-hover hover:to-purple-400 text-white px-5 py-3 min-h-[44px] rounded-lg transition-all cursor-pointer shadow-lg shadow-accent/20"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Simpan ke Catatan Fundamental
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Forward AI to Note Form Modal ──────────────────── */}
            {showNoteForm && (
                <AddFundamentalNoteForm
                    ticker={activeTicker}
                    initialTitle={`Analisis Fundamental AI — ${activeTicker} (${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })})`}
                    initialContent={aiInsight}
                    onClose={() => setShowNoteForm(false)}
                    onSuccess={() => {
                        setShowNoteForm(false);
                        handleNoteAdded();
                    }}
                />
            )}
        </div>
    );
}
