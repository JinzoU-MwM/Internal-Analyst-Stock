import { useState, useMemo } from "react";

/* ═════════════════════════ CONSTANTS ═════════════════════════ */
const LOT_SIZE = 100;
const FEE_BUY = 0.0015;
const FEE_SELL = 0.0025;

const fmt = (v) => {
    if (v == null || isNaN(v)) return "0";
    return Number(v).toLocaleString("id-ID", { maximumFractionDigits: 2 });
};
const fmtCur = (v) => `Rp ${fmt(v)}`;
const fmtPct = (v) => `${(v * 100).toFixed(2)}%`;

/* ═══════════════════════ HELP TEXTS (ID) ════════════════════ */
const HELP = {
    avg: {
        title: "Cara Menggunakan Average Price", steps: [
            "Masukkan harga beli dan jumlah lot di setiap baris posisi.",
            "Klik '+ Tambah Posisi' untuk menambah baris baru.",
            "Sistem akan menghitung harga rata-rata tertimbang, total lot, total nilai, break even, dan target profit 1%.",
            "Tab 'Target Harga' untuk menghitung profit/loss berdasarkan harga jual target.",
        ]
    },
    profit: {
        title: "Cara Menggunakan Profit & ARA/ARB", steps: [
            "Masukkan harga beli saham.",
            "Tabel akan menampilkan proyeksi ARA (Auto Rejection Atas) dan ARB (Auto Rejection Bawah) selama 10 hari.",
            "Batas ARA/ARB: 35% (< Rp 200), 25% (Rp 200–5.000), 20% (> Rp 5.000).",
            "Gain/Loss % dihitung dari harga entry awal.",
        ]
    },
    pyramid: {
        title: "Cara Menggunakan Pyramid Entry", steps: [
            "Masukkan total modal, harga entry pertama, jumlah level, dan % penurunan per level.",
            "Sistem membagi modal secara tertimbang (level awal mendapat alokasi lebih besar).",
            "Tabel menampilkan harga entry, lot, nilai, lot kumulatif, dan harga rata-rata setiap level.",
        ]
    },
    possize: {
        title: "Cara Menggunakan Position Sizing", steps: [
            "Masukkan total modal, risiko % per trade, harga entry, dan harga stoploss.",
            "Sistem menghitung jumlah lot yang optimal berdasarkan toleransi risiko Anda.",
            "Hasilnya menampilkan jumlah lot, nilai posisi, dan persentase modal yang digunakan.",
        ]
    },
    rr: {
        title: "Cara Menggunakan Risk/Reward", steps: [
            "Masukkan harga entry, harga stoploss, dan harga target.",
            "Sistem menghitung rasio Risk/Reward (R:R).",
            "R:R ≥ 2 = Trade bagus ✅, R:R ≥ 1 = Cukup ⚠️, R:R < 1 = Hindari ❌.",
        ]
    },
    margin: {
        title: "Cara Menggunakan Margin & Biaya", steps: [
            "Masukkan harga saham dan jumlah lot.",
            "Fee default: Beli 0.15%, Jual 0.25% (bisa diubah).",
            "Sistem menghitung total biaya round-trip dan harga break even.",
        ]
    },
    dividend: {
        title: "Cara Menggunakan Kalkulator Dividen", steps: [
            "Masukkan harga saham, dividen per lembar, dan jumlah lot.",
            "Sistem menghitung yield dividen, pajak (10%), dividen bersih, dan estimasi BEP.",
            "BEP dihitung berdasarkan berapa tahun dividen menutupi harga beli.",
        ]
    },
    rights: {
        title: "Cara Menggunakan Simulasi Rights Issue", steps: [
            "Masukkan harga saham saat ini, harga pelaksanaan (exercise price), jumlah saham, dan rasio (lama:baru).",
            "Sistem menghitung harga teoritis ex-rights, dilusi, total biaya, dan nilai hak (right value).",
        ]
    },
};

/* ═══════════════════════ HELP MODAL ═════════════════════════ */
function HelpModal({ toolId, onClose }) {
    const help = HELP[toolId];
    if (!help) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-surface-card border border-border rounded-2xl w-full max-w-md shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-border flex items-center justify-between">
                    <h3 className="text-lg font-bold text-text-primary">❓ Bantuan</h3>
                    <button onClick={onClose} className="text-text-muted hover:text-text-primary text-xl cursor-pointer">✕</button>
                </div>
                <div className="p-5">
                    <h4 className="text-sm font-semibold text-accent mb-3">{help.title}</h4>
                    <ol className="space-y-2">
                        {help.steps.map((step, i) => (
                            <li key={i} className="flex gap-3 text-sm text-text-secondary">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center">{i + 1}</span>
                                <span>{step}</span>
                            </li>
                        ))}
                    </ol>
                </div>
                <div className="p-4 border-t border-border text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-accent/80">Mengerti</button>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════ TOOL HEADER ════════════════════════ */
function ToolHeader({ icon, title, toolId, onReset }) {
    const [showHelp, setShowHelp] = useState(false);
    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">{icon} {title}</h4>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowHelp(true)} className="text-xs text-text-muted hover:text-accent cursor-pointer flex items-center gap-1">❓ Bantuan</button>
                    {onReset && <button onClick={onReset} className="text-xs text-text-muted hover:text-red-400 cursor-pointer">↻ Reset</button>}
                </div>
            </div>
            {showHelp && <HelpModal toolId={toolId} onClose={() => setShowHelp(false)} />}
        </>
    );
}

/* ═══════════════════════ TOOL DEFINITIONS ═══════════════════ */
const TOOLS = [
    {
        section: "TRADING LOGIC", items: [
            { id: "avg", icon: "🔄", label: "Average Price", sub: "Simulator Naik/Turun" },
            { id: "profit", icon: "📈", label: "Profit & ARA/ARB", sub: "Target Harga" },
            { id: "pyramid", icon: "🔺", label: "Pyramid Entry", sub: "Skala Posisi" },
        ]
    },
    {
        section: "MANAJEMEN RISIKO", items: [
            { id: "possize", icon: "📐", label: "Position Sizing", sub: "Hitung Lot" },
            { id: "rr", icon: "⚖️", label: "Risk/Reward (R)", sub: "Analisis Rasio RR" },
            { id: "margin", icon: "💰", label: "Margin & Biaya", sub: "Cek Biaya" },
        ]
    },
    {
        section: "ANALISIS NILAI", items: [
            { id: "dividend", icon: "🎯", label: "Kalkulator Dividen", sub: "Yield & BEP" },
        ]
    },
    {
        section: "AKSI KORPORASI", items: [
            { id: "rights", icon: "📋", label: "Rights Issue", sub: "Simulasi Dilusi" },
        ]
    },
];

/* ═══════════════════════ AVERAGE PRICE ══════════════════════ */
function AvgPriceTool() {
    const [tab, setTab] = useState("blend"); // blend | target
    const [positions, setPositions] = useState([
        { price: 0, lots: 0 },
        { price: 0, lots: 0 },
    ]);

    const updatePos = (i, field, val) => {
        const next = [...positions];
        next[i] = { ...next[i], [field]: Number(val) || 0 };
        setPositions(next);
    };
    const addPos = () => setPositions([...positions, { price: 0, lots: 0 }]);
    const removePos = (i) => positions.length > 2 && setPositions(positions.filter((_, j) => j !== i));
    const reset = () => setPositions([{ price: 0, lots: 0 }, { price: 0, lots: 0 }]);

    const stats = useMemo(() => {
        const valid = positions.filter(p => p.price > 0 && p.lots > 0);
        const totalLots = valid.reduce((s, p) => s + p.lots, 0);
        const totalValue = valid.reduce((s, p) => s + p.price * p.lots * LOT_SIZE, 0);
        const avgPrice = totalLots > 0 ? totalValue / (totalLots * LOT_SIZE) : 0;
        const breakEven = avgPrice > 0 ? avgPrice * (1 + FEE_BUY + FEE_SELL) : 0;
        const profitTarget1 = avgPrice > 0 ? avgPrice * (1 + 0.01 + FEE_BUY + FEE_SELL) : 0;
        return { totalLots, totalValue, avgPrice, breakEven, profitTarget1, validCount: valid.length };
    }, [positions]);

    // Target Price Calculator
    const [targetEntry, setTargetEntry] = useState(0);
    const [targetLots, setTargetLots] = useState(0);
    const [targetPrice, setTargetPrice] = useState(0);

    const targetStats = useMemo(() => {
        if (!targetEntry || !targetLots || !targetPrice) return null;
        const shares = targetLots * LOT_SIZE;
        const buyValue = targetEntry * shares;
        const sellValue = targetPrice * shares;
        const buyFee = buyValue * FEE_BUY;
        const sellFee = sellValue * FEE_SELL;
        const netProfit = sellValue - buyValue - buyFee - sellFee;
        const pctReturn = buyValue > 0 ? netProfit / buyValue : 0;
        return { buyValue, sellValue, buyFee, sellFee, netProfit, pctReturn, shares };
    }, [targetEntry, targetLots, targetPrice]);

    return (
        <div>
            <ToolHeader icon="🔄" title="Average Price" toolId="avg" onReset={reset} />
            {/* Tabs */}
            <div className="flex gap-2 mb-5">
                {[["blend", "🎲 Position Blender"], ["target", "🎯 Target Harga"]].map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${tab === key ? "bg-accent text-white" : "bg-surface-elevated text-text-muted border border-border hover:text-text-primary"}`}>
                        {label}
                    </button>
                ))}
            </div>

            {tab === "blend" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Left: Position Inputs */}
                    <div className="bg-surface-elevated border border-border rounded-xl p-4">
                        <div className="grid grid-cols-[32px_1fr_1fr_1fr_32px] gap-2 text-[10px] text-text-muted uppercase tracking-wider mb-2 px-1">
                            <span>#</span><span>Harga</span><span>Lot</span><span>Nilai</span><span></span>
                        </div>
                        {positions.map((p, i) => (
                            <div key={i} className="grid grid-cols-[32px_1fr_1fr_1fr_32px] gap-2 mb-2 items-center">
                                <span className="text-xs text-text-muted text-center">{i + 1}</span>
                                <input type="number" value={p.price || ""} onChange={e => updatePos(i, "price", e.target.value)} placeholder="0"
                                    className="bg-surface-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none" />
                                <input type="number" value={p.lots || ""} onChange={e => updatePos(i, "lots", e.target.value)} placeholder="0"
                                    className="bg-surface-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none" />
                                <span className="text-sm text-text-muted truncate">{fmtCur(p.price * p.lots * LOT_SIZE)}</span>
                                <button onClick={() => removePos(i)} className={`text-lg cursor-pointer ${positions.length <= 2 ? "opacity-20" : "text-red-400 hover:text-red-300"}`} disabled={positions.length <= 2}>×</button>
                            </div>
                        ))}
                        <button onClick={addPos} className="w-full mt-2 py-2 border border-dashed border-border rounded-lg text-xs text-text-muted hover:border-accent hover:text-accent transition-colors cursor-pointer">
                            + Tambah Posisi
                        </button>
                    </div>

                    {/* Right: Results */}
                    <div>
                        <div className="bg-surface-elevated border border-border rounded-xl p-5 text-center mb-4">
                            <p className="text-xs text-text-muted mb-1 uppercase tracking-wider">Harga Rata-rata Tertimbang</p>
                            <p className="text-4xl font-black text-accent">{stats.avgPrice > 0 ? fmt(Math.round(stats.avgPrice)) : "0"}</p>
                            <div className="flex justify-between mt-4 text-sm">
                                <div><p className="text-[10px] text-text-muted">TOTAL LOTS</p><p className="text-lg font-bold text-text-primary">{stats.totalLots}</p></div>
                                <div className="text-right"><p className="text-[10px] text-text-muted">TOTAL VALUE</p><p className="text-lg font-bold text-accent">{fmtCur(stats.totalValue)}</p></div>
                            </div>
                        </div>
                        {stats.validCount >= 2 && (
                            <div className="bg-surface-elevated border border-border rounded-xl p-4">
                                <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">✨ Ringkasan</h4>
                                <p className="text-xs text-text-muted mb-2">Anda menggabungkan {stats.validCount} posisi.</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center bg-surface-card border border-border rounded-lg px-3 py-2">
                                        <span className="text-xs text-text-muted">Break Even (est. {((FEE_BUY + FEE_SELL) * 100).toFixed(1)}% fee)</span>
                                        <span className="text-sm font-bold text-text-primary">{fmt(Math.round(stats.breakEven))}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-surface-card border border-border rounded-lg px-3 py-2">
                                        <span className="text-xs text-text-muted">1% Profit Target</span>
                                        <span className="text-sm font-bold text-emerald-400">{fmt(Math.round(stats.profitTarget1))}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Target Price Tab */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="bg-surface-elevated border border-border rounded-xl p-4 space-y-3">
                        <h4 className="text-sm font-bold text-text-primary">🎯 Kalkulator Target Harga</h4>
                        {[["Harga Entry", targetEntry, setTargetEntry], ["Lot", targetLots, setTargetLots], ["Harga Target", targetPrice, setTargetPrice]].map(([lbl, val, set]) => (
                            <div key={lbl}>
                                <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">{lbl}</label>
                                <input type="number" value={val || ""} onChange={e => set(Number(e.target.value) || 0)} placeholder="0"
                                    className="w-full bg-surface-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none" />
                            </div>
                        ))}
                    </div>
                    {targetStats && (
                        <div className="bg-surface-elevated border border-border rounded-xl p-5">
                            <p className="text-xs text-text-muted mb-1 uppercase tracking-wider text-center">Laba/Rugi Bersih</p>
                            <p className={`text-4xl font-black text-center ${targetStats.netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {fmtCur(Math.round(targetStats.netProfit))}
                            </p>
                            <p className={`text-center text-sm font-semibold mt-1 ${targetStats.pctReturn >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {targetStats.pctReturn >= 0 ? "+" : ""}{fmtPct(targetStats.pctReturn)}
                            </p>
                            <div className="mt-4 space-y-2 text-xs">
                                {[["Nilai Beli", targetStats.buyValue], ["Fee Beli (0.15%)", targetStats.buyFee], ["Nilai Jual", targetStats.sellValue], ["Fee Jual (0.25%)", targetStats.sellFee]].map(([l, v]) => (
                                    <div key={l} className="flex justify-between bg-surface-card border border-border rounded-lg px-3 py-2">
                                        <span className="text-text-muted">{l}</span>
                                        <span className="text-text-primary font-medium">{fmtCur(Math.round(v))}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════ PROFIT & ARA/ARB ═══════════════════ */
function ProfitAraTool() {
    const [price, setPrice] = useState(0);
    const araSteps = useMemo(() => {
        if (!price || price <= 0) return [];
        let p = price; const results = [];
        for (let i = 1; i <= 10; i++) {
            let pctLimit;
            if (p < 200) pctLimit = 0.35;
            else if (p < 5000) pctLimit = 0.25;
            else pctLimit = 0.20;
            const ara = Math.round(p * (1 + pctLimit));
            const arb = Math.round(p * (1 - pctLimit));
            const gain = ((ara - price) / price * 100).toFixed(2);
            const loss = ((arb - price) / price * 100).toFixed(2);
            results.push({ day: i, ara, arb, gain, loss, pctLimit });
            p = ara; // next day uses previous ARA
        }
        return results;
    }, [price]);

    return (
        <div>
            <ToolHeader icon="📈" title="Profit & ARA/ARB" toolId="profit" />
            <div className="bg-surface-elevated border border-border rounded-xl p-4 mb-5 max-w-xs">
                <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">Harga Beli</label>
                <input type="number" value={price || ""} onChange={e => setPrice(Number(e.target.value) || 0)} placeholder="0"
                    className="w-full bg-surface-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none" />
            </div>
            {araSteps.length > 0 && (
                <div className="bg-surface-elevated border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-border bg-surface-card/50 text-[10px] text-text-muted uppercase tracking-wider">
                            <th className="py-2 px-3 text-center">Hari</th>
                            <th className="py-2 px-3 text-center">Batas</th>
                            <th className="py-2 px-3 text-right">ARA (↑)</th>
                            <th className="py-2 px-3 text-right">Untung %</th>
                            <th className="py-2 px-3 text-right">ARB (↓)</th>
                            <th className="py-2 px-3 text-right">Rugi %</th>
                        </tr></thead>
                        <tbody>
                            {araSteps.map(s => (
                                <tr key={s.day} className="border-b border-border/30 hover:bg-surface-card/30">
                                    <td className="py-2 px-3 text-center text-text-muted">{s.day}</td>
                                    <td className="py-2 px-3 text-center text-text-muted">{(s.pctLimit * 100).toFixed(0)}%</td>
                                    <td className="py-2 px-3 text-right font-semibold text-emerald-400">{fmt(s.ara)}</td>
                                    <td className="py-2 px-3 text-right text-emerald-400">+{s.gain}%</td>
                                    <td className="py-2 px-3 text-right font-semibold text-red-400">{fmt(s.arb)}</td>
                                    <td className="py-2 px-3 text-right text-red-400">{s.loss}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════ PYRAMID ENTRY ══════════════════════ */
function PyramidTool() {
    const [capital, setCapital] = useState(0);
    const [price, setPrice] = useState(0);
    const [levels, setLevels] = useState(3);
    const [dropPct, setDropPct] = useState(5);

    const pyramid = useMemo(() => {
        if (!capital || !price || price <= 0) return [];
        const result = [];
        // Weighted distribution: first level gets more
        const weights = Array.from({ length: levels }, (_, i) => levels - i);
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let cumLots = 0, cumValue = 0;

        for (let i = 0; i < levels; i++) {
            const entryPrice = Math.round(price * (1 - (dropPct / 100) * i));
            const allocation = (capital * weights[i]) / totalWeight;
            const lots = Math.floor(allocation / (entryPrice * LOT_SIZE));
            const value = lots * entryPrice * LOT_SIZE;
            cumLots += lots;
            cumValue += value;
            const avgPrice = cumLots > 0 ? cumValue / (cumLots * LOT_SIZE) : 0;
            result.push({ level: i + 1, price: entryPrice, lots, value, cumLots, avgPrice: Math.round(avgPrice), allocation: Math.round(allocation) });
        }
        return result;
    }, [capital, price, levels, dropPct]);

    return (
        <div>
            <ToolHeader icon="🔺" title="Pyramid Entry" toolId="pyramid" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[["Modal (Rp)", capital, setCapital], ["Harga Entry", price, setPrice], ["Jumlah Level", levels, setLevels], ["Drop % per Level", dropPct, setDropPct]].map(([lbl, val, set]) => (
                    <div key={lbl} className="bg-surface-elevated border border-border rounded-xl p-3">
                        <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">{lbl}</label>
                        <input type="number" value={val || ""} onChange={e => set(Number(e.target.value) || 0)} placeholder="0"
                            className="w-full bg-surface-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none" />
                    </div>
                ))}
            </div>
            {pyramid.length > 0 && (
                <div className="bg-surface-elevated border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-border bg-surface-card/50 text-[10px] text-text-muted uppercase tracking-wider">
                            <th className="py-2 px-3 text-center">Level</th>
                            <th className="py-2 px-3 text-right">Harga</th>
                            <th className="py-2 px-3 text-right">Alokasi</th>
                            <th className="py-2 px-3 text-right">Lot</th>
                            <th className="py-2 px-3 text-right">Nilai</th>
                            <th className="py-2 px-3 text-right">Lot Kum.</th>
                            <th className="py-2 px-3 text-right">Harga Rata²</th>
                        </tr></thead>
                        <tbody>
                            {pyramid.map(p => (
                                <tr key={p.level} className="border-b border-border/30 hover:bg-surface-card/30">
                                    <td className="py-2 px-3 text-center font-bold text-accent">{p.level}</td>
                                    <td className="py-2 px-3 text-right text-text-primary">{fmt(p.price)}</td>
                                    <td className="py-2 px-3 text-right text-text-muted">{fmtCur(p.allocation)}</td>
                                    <td className="py-2 px-3 text-right font-semibold text-text-primary">{p.lots}</td>
                                    <td className="py-2 px-3 text-right text-text-primary">{fmtCur(p.value)}</td>
                                    <td className="py-2 px-3 text-right text-yellow-400">{p.cumLots}</td>
                                    <td className="py-2 px-3 text-right font-bold text-emerald-400">{fmt(p.avgPrice)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════ POSITION SIZING ════════════════════ */
function PositionSizingTool() {
    const [capital, setCapital] = useState(0);
    const [riskPct, setRiskPct] = useState(2);
    const [entry, setEntry] = useState(0);
    const [stoploss, setStoploss] = useState(0);

    const result = useMemo(() => {
        if (!capital || !entry || !stoploss || entry <= 0 || stoploss <= 0 || entry <= stoploss) return null;
        const riskAmount = capital * (riskPct / 100);
        const riskPerShare = entry - stoploss;
        const shares = Math.floor(riskAmount / riskPerShare);
        const lots = Math.floor(shares / LOT_SIZE);
        const positionValue = lots * LOT_SIZE * entry;
        const capitalUsed = (positionValue / capital) * 100;
        return { riskAmount, riskPerShare, shares, lots, positionValue, capitalUsed };
    }, [capital, riskPct, entry, stoploss]);

    return (
        <div>
            <ToolHeader icon="📐" title="Position Sizing" toolId="possize" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-surface-elevated border border-border rounded-xl p-4 space-y-3">
                    {[["Total Modal (Rp)", capital, setCapital], ["Risiko % per Trade", riskPct, setRiskPct], ["Harga Entry", entry, setEntry], ["Harga Stoploss", stoploss, setStoploss]].map(([lbl, val, set]) => (
                        <div key={lbl}>
                            <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">{lbl}</label>
                            <input type="number" value={val || ""} onChange={e => set(Number(e.target.value) || 0)} placeholder="0"
                                className="w-full bg-surface-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none" />
                        </div>
                    ))}
                </div>
                {result && (
                    <div className="space-y-3">
                        <div className="bg-surface-elevated border border-border rounded-xl p-5 text-center">
                            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Ukuran Posisi Rekomendasi</p>
                            <p className="text-4xl font-black text-accent">{result.lots} Lot</p>
                            <p className="text-sm text-text-muted mt-1">{fmt(result.lots * LOT_SIZE)} lembar</p>
                        </div>
                        <div className="bg-surface-elevated border border-border rounded-xl p-4 space-y-2 text-xs">
                            {[["Jumlah Risiko", fmtCur(Math.round(result.riskAmount))], ["Risiko Per Lembar", fmtCur(result.riskPerShare)], ["Nilai Posisi", fmtCur(Math.round(result.positionValue))], ["Modal Terpakai", `${result.capitalUsed.toFixed(1)}%`]].map(([l, v]) => (
                                <div key={l} className="flex justify-between bg-surface-card border border-border rounded-lg px-3 py-2">
                                    <span className="text-text-muted">{l}</span>
                                    <span className="text-text-primary font-medium">{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════ RISK/REWARD ════════════════════════ */
function RiskRewardTool() {
    const [entry, setEntry] = useState(0);
    const [stoploss, setStoploss] = useState(0);
    const [target, setTarget] = useState(0);

    const rr = useMemo(() => {
        if (!entry || !stoploss || !target || entry <= stoploss || target <= entry) return null;
        const risk = entry - stoploss;
        const reward = target - entry;
        const ratio = reward / risk;
        const riskPct = (risk / entry) * 100;
        const rewardPct = (reward / entry) * 100;
        return { risk, reward, ratio, riskPct, rewardPct };
    }, [entry, stoploss, target]);

    const barWidth = rr ? Math.min(rr.ratio / (rr.ratio + 1) * 100, 95) : 50;

    return (
        <div>
            <ToolHeader icon="⚖️" title="Risk/Reward (R)" toolId="rr" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-surface-elevated border border-border rounded-xl p-4 space-y-3">
                    {[["Harga Entry", entry, setEntry], ["Harga Stoploss", stoploss, setStoploss], ["Harga Target", target, setTarget]].map(([lbl, val, set]) => (
                        <div key={lbl}>
                            <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">{lbl}</label>
                            <input type="number" value={val || ""} onChange={e => set(Number(e.target.value) || 0)} placeholder="0"
                                className="w-full bg-surface-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none" />
                        </div>
                    ))}
                </div>
                {rr && (
                    <div className="space-y-3">
                        <div className="bg-surface-elevated border border-border rounded-xl p-5 text-center">
                            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Rasio Risk/Reward</p>
                            <p className={`text-4xl font-black ${rr.ratio >= 2 ? "text-emerald-400" : rr.ratio >= 1 ? "text-yellow-400" : "text-red-400"}`}>
                                1 : {rr.ratio.toFixed(2)}
                            </p>
                            <p className={`text-sm mt-1 ${rr.ratio >= 2 ? "text-emerald-400" : rr.ratio >= 1 ? "text-yellow-400" : "text-red-400"}`}>
                                {rr.ratio >= 2 ? "✅ Trade Bagus" : rr.ratio >= 1 ? "⚠️ Cukup" : "❌ Hindari"}
                            </p>
                        </div>
                        <div className="bg-surface-elevated border border-border rounded-xl p-4">
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-red-400">Risiko: -{rr.riskPct.toFixed(2)}% ({fmtCur(rr.risk)})</span>
                                <span className="text-emerald-400">Potensi: +{rr.rewardPct.toFixed(2)}% ({fmtCur(rr.reward)})</span>
                            </div>
                            <div className="h-3 bg-red-500/20 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500/60 rounded-full transition-all" style={{ width: `${barWidth}%` }}></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════ MARGIN & FEES ══════════════════════ */
function MarginFeesTool() {
    const [price, setPrice] = useState(0);
    const [lots, setLots] = useState(0);
    const [customBuyFee, setCustomBuyFee] = useState(0.15);
    const [customSellFee, setCustomSellFee] = useState(0.25);

    const result = useMemo(() => {
        if (!price || !lots) return null;
        const shares = lots * LOT_SIZE;
        const grossValue = price * shares;
        const buyFee = grossValue * (customBuyFee / 100);
        const sellFee = grossValue * (customSellFee / 100);
        const totalFee = buyFee + sellFee;
        const breakEven = price * (1 + customBuyFee / 100 + customSellFee / 100);
        return { shares, grossValue, buyFee, sellFee, totalFee, breakEven: Math.round(breakEven) };
    }, [price, lots, customBuyFee, customSellFee]);

    return (
        <div>
            <ToolHeader icon="💰" title="Margin & Biaya" toolId="margin" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-surface-elevated border border-border rounded-xl p-4 space-y-3">
                    {[["Harga", price, setPrice], ["Lot", lots, setLots], ["Fee Beli (%)", customBuyFee, setCustomBuyFee], ["Fee Jual (%)", customSellFee, setCustomSellFee]].map(([lbl, val, set]) => (
                        <div key={lbl}>
                            <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">{lbl}</label>
                            <input type="number" value={val || ""} onChange={e => set(Number(e.target.value) || 0)} placeholder="0" step={lbl.includes("Fee") ? "0.01" : "1"}
                                className="w-full bg-surface-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none" />
                        </div>
                    ))}
                </div>
                {result && (
                    <div className="space-y-3">
                        <div className="bg-surface-elevated border border-border rounded-xl p-5 text-center">
                            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Biaya (Pulang-Pergi)</p>
                            <p className="text-3xl font-black text-red-400">{fmtCur(Math.round(result.totalFee))}</p>
                            <p className="text-sm text-text-muted mt-1">Break Even: <span className="text-accent font-bold">{fmt(result.breakEven)}</span></p>
                        </div>
                        <div className="bg-surface-elevated border border-border rounded-xl p-4 space-y-2 text-xs">
                            {[["Nilai Bruto", fmtCur(Math.round(result.grossValue))], ["Lembar Saham", fmt(result.shares)], ["Fee Beli", fmtCur(Math.round(result.buyFee))], ["Fee Jual", fmtCur(Math.round(result.sellFee))]].map(([l, v]) => (
                                <div key={l} className="flex justify-between bg-surface-card border border-border rounded-lg px-3 py-2">
                                    <span className="text-text-muted">{l}</span>
                                    <span className="text-text-primary font-medium">{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════ DIVIDEND CALC ══════════════════════ */
function DividendTool() {
    const [price, setPrice] = useState(0);
    const [dividend, setDividend] = useState(0);
    const [lots, setLots] = useState(0);

    const result = useMemo(() => {
        if (!price || !dividend || !lots) return null;
        const shares = lots * LOT_SIZE;
        const totalDiv = dividend * shares;
        const tax = totalDiv * 0.10; // 10% dividend tax
        const netDiv = totalDiv - tax;
        const yieldPct = (dividend / price) * 100;
        const bep = Math.ceil(price / dividend); // years to BEP from dividends alone
        return { shares, totalDiv, tax, netDiv, yieldPct, bep };
    }, [price, dividend, lots]);

    return (
        <div>
            <ToolHeader icon="🎯" title="Kalkulator Dividen" toolId="dividend" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-surface-elevated border border-border rounded-xl p-4 space-y-3">
                    {[["Harga Saham", price, setPrice], ["Dividen / Lembar (Rp)", dividend, setDividend], ["Lot", lots, setLots]].map(([lbl, val, set]) => (
                        <div key={lbl}>
                            <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">{lbl}</label>
                            <input type="number" value={val || ""} onChange={e => set(Number(e.target.value) || 0)} placeholder="0"
                                className="w-full bg-surface-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none" />
                        </div>
                    ))}
                </div>
                {result && (
                    <div className="space-y-3">
                        <div className="bg-surface-elevated border border-border rounded-xl p-5 text-center">
                            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Yield Dividen</p>
                            <p className="text-4xl font-black text-emerald-400">{result.yieldPct.toFixed(2)}%</p>
                            <p className="text-sm text-text-muted mt-1">BEP dalam ~{result.bep} tahun (dari dividen saja)</p>
                        </div>
                        <div className="bg-surface-elevated border border-border rounded-xl p-4 space-y-2 text-xs">
                            {[["Dividen Bruto", fmtCur(Math.round(result.totalDiv))], ["Pajak (10%)", fmtCur(Math.round(result.tax))], ["Dividen Bersih", fmtCur(Math.round(result.netDiv))], ["Lembar Saham", fmt(result.shares)]].map(([l, v]) => (
                                <div key={l} className="flex justify-between bg-surface-card border border-border rounded-lg px-3 py-2">
                                    <span className="text-text-muted">{l}</span>
                                    <span className="text-text-primary font-medium">{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════ RIGHTS ISSUE ═══════════════════════ */
function RightsIssueTool() {
    const [currentPrice, setCurrentPrice] = useState(0);
    const [exercisePrice, setExercisePrice] = useState(0);
    const [ratio, setRatio] = useState("1:2"); // old:new
    const [currentShares, setCurrentShares] = useState(0);

    const result = useMemo(() => {
        if (!currentPrice || !exercisePrice || !currentShares) return null;
        const parts = ratio.split(":").map(Number);
        if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
        const [oldR, newR] = parts;
        const newShares = Math.floor(currentShares / oldR) * newR;
        const theoreticPrice = ((currentShares * currentPrice) + (newShares * exercisePrice)) / (currentShares + newShares);
        const dilutionPct = (newShares / (currentShares + newShares)) * 100;
        const totalCost = newShares * exercisePrice;
        const rightValue = theoreticPrice - exercisePrice;
        return { newShares, theoreticPrice: Math.round(theoreticPrice), dilutionPct, totalCost, rightValue: Math.round(rightValue), totalAfter: currentShares + newShares };
    }, [currentPrice, exercisePrice, ratio, currentShares]);

    return (
        <div>
            <ToolHeader icon="📋" title="Rights Issue" toolId="rights" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-surface-elevated border border-border rounded-xl p-4 space-y-3">
                    {[["Harga Saat Ini", currentPrice, setCurrentPrice], ["Harga Pelaksanaan", exercisePrice, setExercisePrice],
                    ["Jumlah Saham", currentShares, setCurrentShares]].map(([lbl, val, set]) => (
                        <div key={lbl}>
                            <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">{lbl}</label>
                            <input type="number" value={val || ""} onChange={e => set(Number(e.target.value) || 0)} placeholder="0"
                                className="w-full bg-surface-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none" />
                        </div>
                    ))}
                    <div>
                        <label className="text-[10px] text-text-muted uppercase tracking-wider mb-1 block">Rasio (lama:baru)</label>
                        <input type="text" value={ratio} onChange={e => setRatio(e.target.value)} placeholder="1:2"
                            className="w-full bg-surface-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none" />
                    </div>
                </div>
                {result && (
                    <div className="space-y-3">
                        <div className="bg-surface-elevated border border-border rounded-xl p-5 text-center">
                            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Harga Teoritis ex-Rights</p>
                            <p className="text-4xl font-black text-accent">{fmt(result.theoreticPrice)}</p>
                            <p className="text-sm text-text-muted mt-1">Dilusi: <span className="text-yellow-400 font-bold">{result.dilutionPct.toFixed(1)}%</span></p>
                        </div>
                        <div className="bg-surface-elevated border border-border rounded-xl p-4 space-y-2 text-xs">
                            {[["Saham Baru Ditawarkan", fmt(result.newShares)], ["Total Saham Setelah", fmt(result.totalAfter)], ["Total Biaya Pelaksanaan", fmtCur(result.totalCost)], ["Nilai Hak (Right Value)", fmtCur(result.rightValue)]].map(([l, v]) => (
                                <div key={l} className="flex justify-between bg-surface-card border border-border rounded-lg px-3 py-2">
                                    <span className="text-text-muted">{l}</span>
                                    <span className="text-text-primary font-medium">{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════ TOOL REGISTRY ══════════════════════ */
const TOOL_COMPONENTS = {
    avg: AvgPriceTool,
    profit: ProfitAraTool,
    pyramid: PyramidTool,
    possize: PositionSizingTool,
    rr: RiskRewardTool,
    margin: MarginFeesTool,
    dividend: DividendTool,
    rights: RightsIssueTool,
};

/* ═══════════════════════ MAIN PAGE ══════════════════════════ */
export default function ToolsPage() {
    const [activeTool, setActiveTool] = useState("avg");
    const [search, setSearch] = useState("");

    const activeItem = TOOLS.flatMap(s => s.items).find(t => t.id === activeTool);
    const ActiveComponent = TOOL_COMPONENTS[activeTool];

    const filteredTools = TOOLS.map(sec => ({
        ...sec,
        items: sec.items.filter(t => t.label.toLowerCase().includes(search.toLowerCase()) || t.sub.toLowerCase().includes(search.toLowerCase())),
    })).filter(sec => sec.items.length > 0);

    return (
        <div className="flex h-[calc(100vh-64px)]">
            {/* Sidebar */}
            <div className="w-64 bg-surface-card border-r border-border flex flex-col shrink-0 overflow-y-auto hidden md:flex">
                <div className="p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <span className="text-accent">🧮</span> Kalkulator
                    </h2>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">IDX Market Suite</p>
                </div>
                <div className="px-3 pt-3">
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Cari tools..."
                        className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:border-accent focus:outline-none" />
                </div>
                <nav className="flex-1 py-3 px-2">
                    {filteredTools.map(sec => (
                        <div key={sec.section} className="mb-3">
                            <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest px-2 mb-1">{sec.section}</p>
                            {sec.items.map(t => (
                                <button key={t.id} onClick={() => setActiveTool(t.id)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all cursor-pointer mb-0.5 ${activeTool === t.id
                                        ? "bg-accent/10 border border-accent/30 text-accent"
                                        : "text-text-muted hover:bg-surface-elevated hover:text-text-primary border border-transparent"
                                        }`}>
                                    <span className="text-lg">{t.icon}</span>
                                    <div>
                                        <p className="text-sm font-semibold leading-tight">{t.label}</p>
                                        <p className="text-[10px] opacity-60">{t.sub}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Mobile Tool Selector */}
                <div className="md:hidden p-4 pb-0">
                    <select value={activeTool} onChange={e => setActiveTool(e.target.value)}
                        className="w-full bg-surface-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none cursor-pointer">
                        {TOOLS.flatMap(s => s.items).map(t => (
                            <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                        ))}
                    </select>
                </div>

                <div className="p-4 sm:p-6">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                        <span className="uppercase tracking-wider font-semibold">{TOOLS.find(s => s.items.some(t => t.id === activeTool))?.section}</span>
                        <span className="text-accent">›</span>
                        <span className="text-accent font-semibold uppercase tracking-wider">{activeItem?.label}</span>
                    </div>

                    {/* Title */}
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-3xl">{activeItem?.icon}</span>
                        <div>
                            <h1 className="text-2xl font-bold text-text-primary">{activeItem?.label}</h1>
                            <p className="text-sm text-text-muted">{activeItem?.sub}</p>
                        </div>
                    </div>

                    {/* Active Tool */}
                    {ActiveComponent && <ActiveComponent />}
                </div>
            </div>
        </div>
    );
}
