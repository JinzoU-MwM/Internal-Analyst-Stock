import { useState } from "react";
import toast from "react-hot-toast";
import RichEditor from "./RichEditor";

const INITIAL = {
    analystName: "",
    action: "",
    timeframe: "",
    entryPrice: "",
    targetPrice: "",
    stopLoss: "",
    notes: "",
};

/**
 * AnalysisForm — submit a new stock analysis via POST /api/analysis.
 * Uses RichEditor for the notes field.
 *
 * @param {{ ticker: string, onAnalysisAdded: () => void }} props
 */
export default function AnalysisForm({ ticker, onAnalysisAdded }) {
    const [form, setForm] = useState(INITIAL);
    const [submitting, setSubmitting] = useState(false);

    const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const body = {
                ticker,
                analystName: form.analystName,
                action: form.action,
                timeframe: form.timeframe,
                entryPrice: form.entryPrice ? Number(form.entryPrice) : undefined,
                targetPrice: form.targetPrice ? Number(form.targetPrice) : undefined,
                stopLoss: form.stopLoss ? Number(form.stopLoss) : undefined,
                notes: form.notes || undefined,
            };

            const token = localStorage.getItem("ia_token");
            console.log("[AnalysisForm] Sending token:", token ? token.substring(0, 10) + "..." : "null");
            const res = await fetch("/api/analysis", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(
                    data.details?.join(", ") || data.error || "Failed to submit"
                );
            }

            toast.success("Analisis berhasil disimpan!");
            setForm(INITIAL);
            onAnalysisAdded?.();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    /* ── Shared input classes ─────────────────────────────────── */
    const inputCls =
        "w-full bg-surface border border-border rounded-lg px-3 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all";
    const labelCls = "block text-xs font-medium text-text-secondary mb-1";

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-surface-card border border-border rounded-2xl p-5 space-y-4"
        >
            <h4 className="text-base font-semibold text-text-primary flex items-center gap-2">
                ✏️ New Analysis
                <span className="text-xs font-normal text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                    {ticker}
                </span>
            </h4>



            {/* Row 1 — Analyst / Action / Timeframe */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                    <label className={labelCls}>Analyst Name *</label>
                    <input
                        type="text"
                        required
                        value={form.analystName}
                        onChange={set("analystName")}
                        placeholder="e.g. Andi"
                        className={inputCls}
                    />
                </div>
                <div>
                    <label className={labelCls}>Action *</label>
                    <select
                        required
                        value={form.action}
                        onChange={set("action")}
                        className={inputCls}
                    >
                        <option value="" disabled>
                            Select…
                        </option>
                        <option value="BUY">🟢 BUY</option>
                        <option value="SELL">🔴 SELL</option>
                        <option value="HOLD">🟡 HOLD</option>
                        <option value="WAIT">🔵 WAIT</option>
                    </select>
                </div>
                <div>
                    <label className={labelCls}>Timeframe *</label>
                    <select
                        required
                        value={form.timeframe}
                        onChange={set("timeframe")}
                        className={inputCls}
                    >
                        <option value="" disabled>
                            Select…
                        </option>
                        <option value="SCALPING">⚡ Scalping</option>
                        <option value="SWING">🔄 Swing</option>
                        <option value="INVEST">📈 Invest</option>
                    </select>
                </div>
            </div>

            {/* Row 2 — Prices */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                    <label className={labelCls}>Entry Price</label>
                    <input
                        type="number"
                        min="0"
                        step="any"
                        value={form.entryPrice}
                        onChange={set("entryPrice")}
                        placeholder="0"
                        className={inputCls}
                    />
                </div>
                <div>
                    <label className={labelCls}>Target Price</label>
                    <input
                        type="number"
                        min="0"
                        step="any"
                        value={form.targetPrice}
                        onChange={set("targetPrice")}
                        placeholder="0"
                        className={inputCls}
                    />
                </div>
                <div>
                    <label className={labelCls}>Stop Loss</label>
                    <input
                        type="number"
                        min="0"
                        step="any"
                        value={form.stopLoss}
                        onChange={set("stopLoss")}
                        placeholder="0"
                        className={inputCls}
                    />
                </div>
            </div>

            {/* Notes — Rich Text Editor */}
            <div>
                <label className={labelCls}>Notes</label>
                <RichEditor
                    value={form.notes}
                    onChange={(html) => setForm((f) => ({ ...f, notes: html }))}
                    placeholder="Technical analysis, key support/resistance levels, catalysts…"
                />
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={submitting}
                className="w-full bg-accent hover:bg-accent-hover text-white font-medium text-sm rounded-xl py-3 min-h-[44px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
                {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting…
                    </span>
                ) : (
                    "Submit Analysis"
                )}
            </button>
        </form>
    );
}
