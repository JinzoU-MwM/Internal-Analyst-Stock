import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { formatNumber, formatPct, formatDec, formatCurrency, pctColor } from "../utils/formatters";

export default function ComparisonPage() {
    const [tickerA, setTickerA] = useState("");
    const [tickerB, setTickerB] = useState("");
    const [dataA, setDataA] = useState(null);
    const [dataB, setDataB] = useState(null);
    const [loadingA, setLoadingA] = useState(false);
    const [loadingB, setLoadingB] = useState(false);

    // Generic fetcher
    const fetchData = async (ticker, setData, setLoading) => {
        if (!ticker) return;
        setLoading(true);
        try {
            let symbol = ticker.toUpperCase();
            if (!symbol.includes(".")) symbol += ".JK";

            const res = await fetch(`/api/stocks/${encodeURIComponent(symbol)}/fundamental`);
            const json = await res.json();

            if (json.success) {
                setData(json.data);
            } else {
                toast.error(`Gagal memuat ${symbol}`);
                setData(null);
            }
        } catch (err) {
            toast.error(`Error loading ${ticker}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchA = (e) => {
        e.preventDefault();
        fetchData(tickerA, setDataA, setLoadingA);
    };

    const handleSearchB = (e) => {
        e.preventDefault();
        fetchData(tickerB, setDataB, setLoadingB);
    };

    // Helper to render a comparison row
    const Row = ({ label, valA, valB, format, colorFn, highlightBetter }) => {
        // highlightBetter: 'higher' | 'lower' | null
        const formattedA = format ? format(valA, dataA?.currency) : valA;
        const formattedB = format ? format(valB, dataB?.currency) : valB;

        const styleA = colorFn ? colorFn(valA) : "text-text-primary";
        const styleB = colorFn ? colorFn(valB) : "text-text-primary";

        let bgA = "";
        let bgB = "";

        if (highlightBetter && valA != null && valB != null) {
            if (highlightBetter === 'higher') {
                if (valA > valB) bgA = "bg-bull/10 font-bold";
                if (valB > valA) bgB = "bg-bull/10 font-bold";
            } else if (highlightBetter === 'lower') {
                if (valA < valB) bgA = "bg-bull/10 font-bold";
                if (valB < valA) bgB = "bg-bull/10 font-bold";
            }
        }

        return (
            <tr className="border-b border-border/50 hover:bg-surface-elevated/50 transition-colors">
                <td className="py-3 px-4 text-sm text-text-muted">{label}</td>
                <td className={`py-3 px-4 text-right text-sm ${styleA} ${bgA}`}>{formattedA ?? "—"}</td>
                <td className={`py-3 px-4 text-right text-sm ${styleB} ${bgB}`}>{formattedB ?? "—"}</td>
            </tr>
        );
    };

    const Section = ({ title, children }) => (
        <div className="mb-6">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2 px-4 bg-surface-elevated py-1 rounded">
                {title}
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-right text-xs text-text-muted border-b border-border">
                            <th className="text-left py-2 px-4 font-normal w-1/3">Metric</th>
                            <th className="py-2 px-4 font-normal w-1/3">{dataA?.ticker || "Stock A"}</th>
                            <th className="py-2 px-4 font-normal w-1/3">{dataB?.ticker || "Stock B"}</th>
                        </tr>
                    </thead>
                    <tbody>{children}</tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
                ⚖️ Bandingkan Saham
            </h1>

            {/* Search Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* Stock A */}
                <form onSubmit={handleSearchA} className="bg-surface-card border border-border rounded-xl p-4">
                    <label className="text-xs text-text-muted mb-1 block">Stock A</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={tickerA}
                            onChange={(e) => setTickerA(e.target.value)}
                            placeholder="Kode (e.g. BBRI)"
                            className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={loadingA}
                            className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-hover disabled:opacity-50"
                        >
                            {loadingA ? "..." : "Load"}
                        </button>
                    </div>
                </form>

                {/* Stock B */}
                <form onSubmit={handleSearchB} className="bg-surface-card border border-border rounded-xl p-4">
                    <label className="text-xs text-text-muted mb-1 block">Stock B</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={tickerB}
                            onChange={(e) => setTickerB(e.target.value)}
                            placeholder="Kode (e.g. BMRI)"
                            className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={loadingB}
                            className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-hover disabled:opacity-50"
                        >
                            {loadingB ? "..." : "Load"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Comparison Table */}
            {(dataA || dataB) && (
                <div className="bg-surface-card border border-border rounded-2xl p-4 shadow-sm animate-fade-in">

                    <Section title="Valuasi">
                        <Row label="Current Price" valA={dataA?.currentPrice} valB={dataB?.currentPrice} format={formatCurrency} />
                        <Row label="Market Cap" valA={dataA?.marketCap} valB={dataB?.marketCap} format={formatNumber} highlightBetter="higher" />
                        <Row label="PER (TTM)" valA={dataA?.peRatio} valB={dataB?.peRatio} format={formatDec} highlightBetter="lower" />
                        <Row label="PBV" valA={dataA?.pbRatio} valB={dataB?.pbRatio} format={formatDec} highlightBetter="lower" />
                        <Row label="PEG Ratio" valA={dataA?.pegRatio} valB={dataB?.pegRatio} format={formatDec} highlightBetter="lower" />
                        <Row label="EV / EBITDA" valA={dataA?.enterpriseToEbitda} valB={dataB?.enterpriseToEbitda} format={formatDec} highlightBetter="lower" />
                    </Section>

                    <Section title="Profitabilitas">
                        <Row label="ROE" valA={dataA?.roe} valB={dataB?.roe} format={formatPct} colorFn={pctColor} highlightBetter="higher" />
                        <Row label="ROA" valA={dataA?.roa} valB={dataB?.roa} format={formatPct} colorFn={pctColor} highlightBetter="higher" />
                        <Row label="Profit Margin" valA={dataA?.profitMargin} valB={dataB?.profitMargin} format={formatPct} colorFn={pctColor} highlightBetter="higher" />
                        <Row label="Operating Margin" valA={dataA?.operatingMargin} valB={dataB?.operatingMargin} format={formatPct} colorFn={pctColor} highlightBetter="higher" />
                        <Row label="Gross Margin" valA={dataA?.grossMargin} valB={dataB?.grossMargin} format={formatPct} colorFn={pctColor} highlightBetter="higher" />
                    </Section>

                    <Section title="Dividen">
                        <Row label="Yield" valA={dataA?.dividendYield} valB={dataB?.dividendYield} format={formatPct} colorFn={() => 'text-accent'} highlightBetter="higher" />
                        <Row label="Payout Ratio" valA={dataA?.payoutRatio} valB={dataB?.payoutRatio} format={formatPct} />
                    </Section>

                    <Section title="Kesehatan Keuangan">
                        <Row label="Revenue Growth" valA={dataA?.revenueGrowth} valB={dataB?.revenueGrowth} format={formatPct} colorFn={pctColor} highlightBetter="higher" />
                        <Row label="Earnings Growth" valA={dataA?.earningsGrowth} valB={dataB?.earningsGrowth} format={formatPct} colorFn={pctColor} highlightBetter="higher" />
                        <Row label="Debt / Equity" valA={dataA?.debtToEquity} valB={dataB?.debtToEquity} format={formatDec} highlightBetter="lower" />
                        <Row label="Current Ratio" valA={dataA?.currentRatio} valB={dataB?.currentRatio} format={formatDec} highlightBetter="higher" />
                    </Section>

                    <Section title="Target Analis">
                        <Row label="Rekomendasi" valA={dataA?.recommendationKey?.toUpperCase()} valB={dataB?.recommendationKey?.toUpperCase()} />
                        <Row label="Target Mean" valA={dataA?.targetMeanPrice} valB={dataB?.targetMeanPrice} format={formatCurrency} />
                        <Row label="Upside" valA={dataA && (dataA.targetMeanPrice / dataA.currentPrice - 1)} valB={dataB && (dataB.targetMeanPrice / dataB.currentPrice - 1)} format={formatPct} colorFn={pctColor} highlightBetter="higher" />
                    </Section>

                </div>
            )}
        </div>
    );
}
