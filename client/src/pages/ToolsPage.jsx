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
    const [buyPrice, setBuyPrice] = useState(0);
    const [sellPrice, setSellPrice] = useState(0);
    const [lots, setLots] = useState(0);
    const [editFees, setEditFees] = useState(false);
    const [feeBuy, setFeeBuy] = useState(0.15);
    const [feeSell, setFeeSell] = useState(0.25);

    const profit = useMemo(() => {
        if (!buyPrice || !lots) return null;
        const shares = lots * LOT_SIZE;
        const totalCap = buyPrice * shares;
        const buyFee = totalCap * (feeBuy / 100);
        const totalVal = sellPrice * shares;
        const sellFee = totalVal * (feeSell / 100);
        const feesTotal = buyFee + sellFee;
        const net = totalVal - totalCap - feesTotal;
        const ret = totalCap > 0 ? (net / totalCap) * 100 : 0;
        return { totalCap, totalVal, buyFee, sellFee, feesTotal, net, ret, shares };
    }, [buyPrice, sellPrice, lots, feeBuy, feeSell]);

    const araSteps = useMemo(() => {
        if (!buyPrice || buyPrice <= 0) return [];
        let p = buyPrice; const results = [];
        for (let i = 1; i <= 5; i++) {
            let pct = p < 200 ? 0.35 : p < 5000 ? 0.25 : 0.20;
            const ara = Math.round(p * (1 + pct));
            const arb = Math.round(p * (1 - pct));
            results.push({ day: i, ara, arb, pct });
            p = ara;
        }
        return results;
    }, [buyPrice]);

    const setARA = () => { if (araSteps[0]) setSellPrice(araSteps[0].ara); };
    const setARB = () => { if (araSteps[0]) setSellPrice(araSteps[0].arb); };

    return (
        <div>
            <ToolHeader icon="📈" title="Profit & ARA/ARB" toolId="profit" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left: Profit Calculator */}
                <div className="bg-surface-elevated border border-border rounded-xl p-5">
                    <h4 className="text-base font-bold text-accent flex items-center gap-2 mb-5">💰 Profit Calculator</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-text-muted mb-1 block">Buy Price <span className="opacity-50">ⓘ</span></label>
                            <div className="relative">
                                <input type="number" value={buyPrice || ""} onChange={e => setBuyPrice(Number(e.target.value) || 0)} placeholder="0"
                                    className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none pr-24" />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                    <button onClick={setARB} className="px-2 py-1 bg-red-500/20 text-red-400 text-[10px] font-bold rounded cursor-pointer hover:bg-red-500/30">ARB</button>
                                    <button onClick={setARA} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded cursor-pointer hover:bg-emerald-500/30">ARA</button>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-text-muted mb-1 block">Sell Price Target <span className="opacity-50">ⓘ</span></label>
                            <input type="number" value={sellPrice || ""} onChange={e => setSellPrice(Number(e.target.value) || 0)} placeholder="0"
                                className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
                        </div>
                        <div>
                            <label className="text-xs text-text-muted mb-1 block">Lots <span className="opacity-50">ⓘ</span></label>
                            <input type="number" value={lots || ""} onChange={e => setLots(Number(e.target.value) || 0)} placeholder="0"
                                className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
                        </div>
                        <div className="flex justify-between items-center text-xs text-text-muted pt-1">
                            <span>Fees (Buy {feeBuy}% / Sell {feeSell}%)</span>
                            <button onClick={() => setEditFees(!editFees)} className="text-accent cursor-pointer hover:underline">Edit Fees</button>
                        </div>
                        {editFees && (
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[10px] text-text-muted block mb-1">Fee Beli (%)</label>
                                    <input type="number" step="0.01" value={feeBuy} onChange={e => setFeeBuy(Number(e.target.value) || 0)} className="w-full bg-surface-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none" /></div>
                                <div><label className="text-[10px] text-text-muted block mb-1">Fee Jual (%)</label>
                                    <input type="number" step="0.01" value={feeSell} onChange={e => setFeeSell(Number(e.target.value) || 0)} className="w-full bg-surface-card border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none" /></div>
                            </div>
                        )}
                    </div>
                    {profit && (
                        <div className="mt-5 bg-surface-card border border-border rounded-xl p-4">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div><p className="text-[10px] text-text-muted uppercase tracking-wider">NET PROFIT</p>
                                    <p className={`text-2xl font-black ${profit.net >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmtCur(Math.round(profit.net))}</p></div>
                                <div><p className="text-[10px] text-text-muted uppercase tracking-wider">RETURN</p>
                                    <p className={`text-2xl font-black ${profit.ret >= 0 ? "text-emerald-400" : "text-red-400"}`}>{profit.ret.toFixed(2)}%</p></div>
                            </div>
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between"><span className="text-text-muted">Total Capital</span><span className="text-text-primary">{fmtCur(Math.round(profit.totalCap))}</span></div>
                                <div className="flex justify-between"><span className="text-text-muted">Total Value</span><span className="text-text-primary">{fmtCur(Math.round(profit.totalVal))}</span></div>
                                <div className="flex justify-between"><span className="text-text-muted opacity-70">Fees & Tax</span><span className="text-red-400">-{fmtCur(Math.round(profit.feesTotal))}</span></div>
                            </div>
                        </div>
                    )}
                </div>
                {/* Right: ARA/ARB Projection */}
                <div className="bg-surface-elevated border border-border rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <h4 className="text-base font-bold text-accent flex items-center gap-2">🚀 ARA / ARB Projection</h4>
                        {buyPrice > 0 && <span className="text-[10px] text-text-muted border border-border rounded-full px-2 py-0.5">Based on {fmt(buyPrice)}</span>}
                    </div>
                    {araSteps.length > 0 ? (
                        <>
                            <div className="grid grid-cols-[40px_60px_1fr_1fr] text-[10px] text-text-muted uppercase tracking-wider mb-2 px-1">
                                <span>Day</span><span></span><span className="text-right">ARA <span className="opacity-60">(Limit)</span></span><span className="text-right">ARB <span className="opacity-60">(Limit)</span></span>
                            </div>
                            <div className="space-y-2">
                                {araSteps.map(s => (
                                    <div key={s.day} className="grid grid-cols-[40px_60px_1fr_1fr] items-center bg-surface-card border border-border/50 rounded-lg px-3 py-2.5">
                                        <span className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center">{s.day}</span>
                                        <span className="text-sm text-text-muted">T+{s.day}</span>
                                        <div className="text-right"><p className="text-sm font-bold text-emerald-400">{fmt(s.ara)}</p><p className="text-[10px] text-emerald-400/70">+{(s.pct * 100).toFixed(0)}%</p></div>
                                        <div className="text-right"><p className="text-sm font-bold text-red-400">{fmt(s.arb)}</p><p className="text-[10px] text-red-400/70">{(s.pct * 100).toFixed(0)}%</p></div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 bg-sky-500/10 border border-sky-500/20 rounded-lg p-3 text-xs text-sky-300/80">
                                <strong>Note:</strong> Auto Rejection limits are symmetrical (35% &lt; 200, 25% 200-5000, 20% &gt; 5000). Prices are rounded to the nearest tick fraction.
                            </div>
                        </>
                    ) : <p className="text-sm text-text-muted text-center py-8">Masukkan Buy Price untuk melihat proyeksi</p>}
                </div>
            </div>
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
                {/* Left: Inputs */}
                <div className="bg-surface-elevated border border-border rounded-xl p-5 space-y-4">
                    <div>
                        <label className="text-xs text-text-muted mb-1 block">Total Capital (Rp)</label>
                        <input type="number" value={capital || ""} onChange={e => setCapital(Number(e.target.value) || 0)} placeholder="0"
                            className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
                    </div>
                    <div>
                        <label className="text-xs text-text-muted mb-1 block">Risk per Trade (%)</label>
                        <input type="number" value={riskPct || ""} onChange={e => setRiskPct(Number(e.target.value) || 0)} placeholder="2"
                            className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
                        <p className="text-[10px] text-text-muted mt-1 opacity-60">Recommended: 1-3% per trade</p>
                    </div>
                    <div>
                        <label className="text-xs text-text-muted mb-1 block">Entry Price (Rp)</label>
                        <input type="number" value={entry || ""} onChange={e => setEntry(Number(e.target.value) || 0)} placeholder="0"
                            className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
                    </div>
                    <div>
                        <label className="text-xs text-text-muted mb-1 block">Stop Loss (Rp)</label>
                        <input type="number" value={stoploss || ""} onChange={e => setStoploss(Number(e.target.value) || 0)} placeholder="0"
                            className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
                    </div>
                </div>
                {/* Right: Results */}
                {result ? (
                    <div className="bg-surface-elevated border border-border rounded-xl p-5">
                        <h4 className="text-base font-bold text-accent flex items-center gap-2 mb-4">📊 Calculation Results</h4>
                        <div className="space-y-3">
                            <div className="bg-surface-card border border-border rounded-xl p-4">
                                <p className="text-[10px] text-text-muted uppercase tracking-wider">Maximum Risk Amount</p>
                                <p className="text-2xl font-black text-orange-400">{fmtCur(Math.round(result.riskAmount))}</p>
                                <p className="text-[10px] text-text-muted mt-0.5">{riskPct}% of {fmtCur(capital)}</p>
                            </div>
                            <div className="bg-surface-card border border-border rounded-xl p-4">
                                <p className="text-[10px] text-text-muted uppercase tracking-wider">Risk per Share</p>
                                <p className="text-xl font-bold text-text-primary">Rp {fmt(result.riskPerShare)}</p>
                                <p className="text-[10px] text-text-muted mt-0.5">Entry (Rp {fmt(entry)}) - SL (Rp {fmt(stoploss)})</p>
                            </div>
                            <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-5">
                                <p className="text-[10px] text-orange-400 uppercase tracking-wider font-bold mb-1">🎯 RECOMMENDED POSITION</p>
                                <p className="text-4xl font-black text-accent">{fmt(result.lots)}</p>
                                <p className="text-sm text-text-muted">Lots ({fmt(result.lots * LOT_SIZE)} shares)</p>
                                <div className="mt-3 pt-3 border-t border-orange-500/20">
                                    <p className="text-xs text-text-muted">Total Investment</p>
                                    <p className="text-lg font-bold text-text-primary">{fmtCur(Math.round(result.positionValue))}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-surface-elevated border border-border rounded-xl p-5 flex items-center justify-center">
                        <p className="text-sm text-text-muted text-center">Masukkan data untuk melihat hasil perhitungan</p>
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
    const [posLots, setPosLots] = useState(0);

    const rr = useMemo(() => {
        if (!entry || !stoploss || !target || entry <= stoploss || target <= entry) return null;
        const risk = entry - stoploss;
        const reward = target - entry;
        const ratio = reward / risk;
        const riskPct = (risk / entry) * 100;
        const rewardPct = (reward / entry) * 100;
        const riskVal = posLots > 0 ? risk * posLots * LOT_SIZE : null;
        const rewardVal = posLots > 0 ? reward * posLots * LOT_SIZE : null;
        return { risk, reward, ratio, riskPct, rewardPct, riskVal, rewardVal };
    }, [entry, stoploss, target, posLots]);

    const barRiskW = rr ? Math.round((rr.risk / (rr.risk + rr.reward)) * 100) : 50;

    return (
        <div>
            <ToolHeader icon="⚖️" title="Risk/Reward (R)" toolId="rr" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left: Inputs */}
                <div className="bg-surface-elevated border border-border rounded-xl p-5 space-y-4">
                    <div>
                        <label className="text-xs text-text-muted mb-1 block">Entry Price (Rp)</label>
                        <input type="number" value={entry || ""} onChange={e => setEntry(Number(e.target.value) || 0)} placeholder="0"
                            className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
                    </div>
                    <div>
                        <label className="text-xs text-text-muted mb-1 block"><span className="text-red-400">Stop Loss</span> (Rp)</label>
                        <input type="number" value={stoploss || ""} onChange={e => setStoploss(Number(e.target.value) || 0)} placeholder="0"
                            className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
                        {rr && <p className="text-[10px] text-red-400 mt-1">Risk: Rp {fmt(rr.risk)} per share</p>}
                    </div>
                    <div>
                        <label className="text-xs text-text-muted mb-1 block">Take Profit Target (Rp)</label>
                        <input type="number" value={target || ""} onChange={e => setTarget(Number(e.target.value) || 0)} placeholder="0"
                            className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
                        {rr && <p className="text-[10px] text-emerald-400 mt-1">Reward: Rp {fmt(rr.reward)} per share</p>}
                    </div>
                    <div>
                        <label className="text-xs text-text-muted mb-1 block">Position Size (Lots) - Optional</label>
                        <input type="number" value={posLots || ""} onChange={e => setPosLots(Number(e.target.value) || 0)} placeholder="0"
                            className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
                    </div>
                </div>
                {/* Right: Analysis */}
                {rr ? (
                    <div className="bg-surface-elevated border border-border rounded-xl p-5">
                        <h4 className="text-base font-bold text-accent flex items-center gap-2 mb-4">📊 Risk/Reward Analysis</h4>
                        {/* Big Ratio */}
                        <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-xl p-5 text-center mb-4">
                            <p className="text-[10px] text-pink-400/80 uppercase tracking-wider font-bold mb-1">⚖️ RISK:REWARD RATIO</p>
                            <p className={`text-5xl font-black ${rr.ratio >= 2 ? "text-emerald-400" : rr.ratio >= 1 ? "text-yellow-400" : "text-red-400"}`}>
                                1 : {rr.ratio.toFixed(2)}
                            </p>
                            <p className={`text-sm mt-1 ${rr.ratio >= 2 ? "text-emerald-400" : rr.ratio >= 1 ? "text-yellow-400" : "text-red-400"}`}>
                                {rr.ratio >= 2 ? "✅ Good setup" : rr.ratio >= 1 ? "⚠️ Acceptable" : "❌ Avoid"}
                            </p>
                        </div>
                        {/* Visual Bar */}
                        <div className="mb-4">
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-red-400 font-medium">Stop Loss</span>
                                <span className="text-text-primary font-bold">Entry</span>
                                <span className="text-emerald-400 font-medium">Target</span>
                            </div>
                            <div className="flex h-5 rounded-full overflow-hidden">
                                <div className="bg-red-500/40 h-full transition-all" style={{ width: `${barRiskW}%` }}></div>
                                <div className="w-0.5 bg-text-primary/60 flex-shrink-0"></div>
                                <div className="bg-emerald-500/40 h-full transition-all flex-1"></div>
                            </div>
                            <div className="flex justify-between text-[10px] mt-1">
                                <span className="text-red-400">Risk: Rp {fmt(rr.risk)}</span>
                                <span className="text-emerald-400">Reward: Rp {fmt(rr.reward)}</span>
                            </div>
                        </div>
                        {/* Value Display */}
                        {rr.riskVal && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-surface-card border border-border rounded-lg p-3 text-center">
                                    <p className="text-[10px] text-text-muted uppercase">Potential Loss</p>
                                    <p className="text-lg font-bold text-red-400">-{fmtCur(rr.riskVal)}</p>
                                </div>
                                <div className="bg-surface-card border border-border rounded-lg p-3 text-center">
                                    <p className="text-[10px] text-text-muted uppercase">Potential Gain</p>
                                    <p className="text-lg font-bold text-emerald-400">+{fmtCur(rr.rewardVal)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-surface-elevated border border-border rounded-xl p-5 flex items-center justify-center">
                        <p className="text-sm text-text-muted text-center">Masukkan Entry, Stop Loss, dan Target</p>
                    </div>
                )}
            </div>
        </div>
    );
}


/* ═══════════════════════ MARGIN & FEES ══════════════════════ */
function MarginFeesTool() {
    const [capital, setCapital] = useState(0);
    const [leverage, setLeverage] = useState("1");
    const [interestRate, setInterestRate] = useState(18);
    const [daysHeld, setDaysHeld] = useState(5);

    const result = useMemo(() => {
        if (!capital) return null;
        const lev = Number(leverage);
        const buyingPower = capital * lev;
        const loanAmount = buyingPower - capital;
        const dailyRate = interestRate / 100 / 365;
        const interestCost = loanAmount * dailyRate * daysHeld;
        const perDay = loanAmount > 0 ? loanAmount * dailyRate : 0;
        // Margin call estimate: how much drop causes force sell
        const marginCallPct = lev > 1 ? -(1 / lev) * 100 : 0;
        const breakEvenRise = capital > 0 ? (interestCost / buyingPower) * 100 : 0;
        return { buyingPower, loanAmount, interestCost, perDay, marginCallPct, breakEvenRise, lev };
    }, [capital, leverage, interestRate, daysHeld]);

    return (
        <div>
            <ToolHeader icon="💰" title="Margin & Fees" toolId="margin" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left: Margin Planner */}
                <div className="bg-surface-elevated border border-border rounded-xl p-5">
                    <h4 className="text-base font-bold text-accent flex items-center gap-2 mb-5">⚡ Margin Planner</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-text-muted mb-1 block">Your Capital (Cash)</label>
                            <input type="number" value={capital || ""} onChange={e => setCapital(Number(e.target.value) || 0)} placeholder="0"
                                className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-text-muted mb-1 block">Leverage Ratio</label>
                                <select value={leverage} onChange={e => setLeverage(e.target.value)}
                                    className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none cursor-pointer">
                                    <option value="1">1x (Cash)</option>
                                    <option value="2">2x (Margin)</option>
                                    <option value="3">3x (Margin)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-text-muted mb-1 block">Interest Rate (% p.a.)</label>
                                <input type="number" value={interestRate || ""} onChange={e => setInterestRate(Number(e.target.value) || 0)} placeholder="18"
                                    className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-text-muted mb-1 block">Days Held</label>
                            <input type="number" value={daysHeld || ""} onChange={e => setDaysHeld(Number(e.target.value) || 0)} placeholder="5"
                                className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
                            <input type="range" min="1" max="30" value={daysHeld} onChange={e => setDaysHeld(Number(e.target.value))}
                                className="w-full mt-2 accent-accent" />
                        </div>
                    </div>
                </div>
                {/* Right: Results */}
                {result ? (
                    <div className="space-y-4">
                        {result.lev > 1 && (
                            <div className="bg-surface-elevated border border-border rounded-xl p-5">
                                <h4 className="text-base font-bold text-accent flex items-center gap-2 mb-3">⚠️ Risk Simulation</h4>
                                <div className="text-center mb-3">
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider">MARGIN CALL / FORCE SELL EST.</p>
                                    <p className="text-5xl font-black text-red-400">{result.marginCallPct.toFixed(1)}%</p>
                                    <p className="text-xs text-text-muted">Price Drop</p>
                                </div>
                                <div className="bg-surface-card border border-border rounded-lg p-3 text-xs text-text-muted space-y-2">
                                    <p>With <span className="text-yellow-400 font-bold">{result.lev}x</span> leverage, a <span className="text-red-400 font-bold">1%</span> drop in stock price equals a <span className="text-red-400 font-bold">{result.lev}%</span> loss in your equity.</p>
                                    <p>To cover the <span className="text-orange-400 font-bold">{fmtCur(Math.round(result.interestCost))}</span> interest cost, the stock usually needs to rise at least <span className="text-emerald-400 font-bold">{result.breakEvenRise.toFixed(2)}%</span> during the {daysHeld} days.</p>
                                </div>
                            </div>
                        )}
                        <div className="bg-surface-elevated border border-border rounded-xl p-5 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-text-muted">Buying Power</span>
                                <span className="text-xl font-black text-accent">{fmtCur(Math.round(result.buyingPower))}</span>
                            </div>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between"><span className="text-text-muted">Loan Amount</span><span className="text-text-primary">{fmtCur(Math.round(result.loanAmount))}</span></div>
                                <div className="flex justify-between"><span className="text-text-muted font-bold">Est. Interest Cost</span><span className="text-orange-400 font-bold">{fmtCur(Math.round(result.interestCost))}</span></div>
                                {result.perDay > 0 && <div className="flex justify-between"><span className="text-text-muted opacity-60"></span><span className="text-text-muted text-[10px]">({fmtCur(Math.round(result.perDay))} / day)</span></div>}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-surface-elevated border border-border rounded-xl p-5 flex items-center justify-center">
                        <p className="text-sm text-text-muted text-center">Masukkan modal untuk melihat simulasi</p>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════ DIVIDEND CALC ══════════════════════ */
function DividendTool() {
    const [price, setPrice] = useState(0);
    const [lots, setLots] = useState(0);
    const [dividend, setDividend] = useState(0);
    const [taxRate, setTaxRate] = useState(10);
    const [includeFee, setIncludeFee] = useState(true);

    const result = useMemo(() => {
        if (!price || !dividend || !lots) return null;
        const shares = lots * LOT_SIZE;
        const totalDivGross = dividend * shares;
        const tax = totalDivGross * (taxRate / 100);
        const netDiv = totalDivGross - tax;
        const yieldGross = (dividend / price) * 100;
        const yieldNet = ((dividend * (1 - taxRate / 100)) / price) * 100;
        const totalInvestment = price * shares + (includeFee ? price * shares * FEE_BUY : 0);
        const effectiveCost = price - (dividend * (1 - taxRate / 100));
        const breakEvenPrice = effectiveCost;
        // Post-dividend scenarios
        const scenarios = [
            { label: "MARKET @ BREAK-EVEN", priceDrop: 0, marketPrice: breakEvenPrice },
            { label: "STOCK DROPS -5%", priceDrop: -5, marketPrice: Math.round(price * 0.95) },
            { label: "STOCK DROPS -10%", priceDrop: -10, marketPrice: Math.round(price * 0.90) },
            { label: "DOUBLE ARB (-30%)", priceDrop: -30, marketPrice: Math.round(price * 0.70) },
        ];
        const scenarioResults = scenarios.map(s => {
            const portfolioVal = s.marketPrice * shares + netDiv;
            const netGainLoss = portfolioVal - totalInvestment;
            const pctGainLoss = (netGainLoss / totalInvestment) * 100;
            return { ...s, netGainLoss, pctGainLoss };
        });
        return { shares, totalDivGross, tax, netDiv, yieldGross, yieldNet, totalInvestment, effectiveCost: Math.round(effectiveCost), breakEvenPrice: Math.round(breakEvenPrice), scenarioResults };
    }, [price, dividend, lots, taxRate, includeFee]);

    return (
        <div>
            <ToolHeader icon="🎯" title="Dividend Calc" toolId="dividend" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left: Calculator */}
                <div className="bg-surface-elevated border border-border rounded-xl p-5">
                    <h4 className="text-base font-bold text-accent flex items-center gap-2 mb-5">💰 Dividend Calculator</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-text-muted mb-1 block">Average Buy Price</label>
                            <input type="number" value={price || ""} onChange={e => setPrice(Number(e.target.value) || 0)} placeholder="0"
                                className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
                        </div>
                        <div>
                            <label className="text-xs text-text-muted mb-1 block">Lots (100 shares/lot)</label>
                            <input type="number" value={lots || ""} onChange={e => setLots(Number(e.target.value) || 0)} placeholder="0"
                                className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-text-muted mb-1 block">Dividend / Share</label>
                                <input type="number" value={dividend || ""} onChange={e => setDividend(Number(e.target.value) || 0)} placeholder="0"
                                    className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
                            </div>
                            <div>
                                <label className="text-xs text-text-muted mb-1 block">Tax Rate (%)</label>
                                <div className="relative">
                                    <input type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value) || 0)} placeholder="10"
                                        className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none pr-8" />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">%</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-text-muted">
                            <span>Include Broker Fee in Cost (0.15%)</span>
                            <button onClick={() => setIncludeFee(!includeFee)}
                                className={`w-10 h-5 rounded-full transition-all cursor-pointer ${includeFee ? "bg-accent" : "bg-border"}`}>
                                <div className={`w-4 h-4 rounded-full bg-white transition-all ${includeFee ? "ml-5" : "ml-0.5"}`}></div>
                            </button>
                        </div>
                    </div>
                    {result && (
                        <div className="mt-5 bg-surface-card border border-border rounded-xl p-4">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div><p className="text-[10px] text-text-muted uppercase tracking-wider">TOTAL DIVIDEND (NET)</p>
                                    <p className="text-2xl font-black text-emerald-400">{fmtCur(Math.round(result.netDiv))}</p>
                                    <p className="text-[10px] text-text-muted line-through">Gross: {fmtCur(Math.round(result.totalDivGross))}</p></div>
                                <div><p className="text-[10px] text-text-muted uppercase tracking-wider">YIELD (NET)</p>
                                    <p className="text-2xl font-black text-emerald-400">{result.yieldNet.toFixed(2)}%</p>
                                    <p className="text-[10px] text-text-muted line-through">Gross: {result.yieldGross.toFixed(2)}%</p></div>
                            </div>
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between"><span className="text-text-muted">Total Investment</span><span className="text-text-primary">{fmtCur(Math.round(result.totalInvestment))}</span></div>
                                <div className="flex justify-between"><span className="text-text-muted">Effective Cost <span className="opacity-60">(After Div)</span></span><span className="text-accent">{fmtCur(result.effectiveCost)}</span></div>
                                <div className="flex justify-between"><span className="text-text-muted opacity-70">Dividend Tax Payment</span><span className="text-red-400">-{fmtCur(Math.round(result.tax))}</span></div>
                            </div>
                        </div>
                    )}
                </div>
                {/* Right: Protection Analysis */}
                {result ? (
                    <div className="bg-surface-elevated border border-border rounded-xl p-5">
                        <h4 className="text-base font-bold text-accent flex items-center gap-2 mb-4">💡 Dividend Protection Analysis</h4>
                        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl p-5 mb-4">
                            <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold mb-1">Break-even Market Price</p>
                            <p className="text-3xl font-black text-text-primary">Rp {fmt(result.breakEvenPrice)}</p>
                            <p className="text-xs text-text-muted mt-2">Ini adalah harga pasar saham di mana nilai portofolio Anda (Harga Pasar + Dividen) sama dengan modal awal Anda. Selama harga saham berada di atas <span className="text-accent font-bold">Rp {fmt(result.breakEvenPrice)}</span>, investasi Anda secara total masih menguntungkan ("Green").</p>
                        </div>
                        <h5 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">POST-DIVIDEND SCENARIOS</h5>
                        <div className="space-y-2">
                            {result.scenarioResults.map(s => (
                                <div key={s.label} className="bg-surface-card border border-border rounded-lg p-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] font-bold text-text-muted uppercase">{s.label}</p>
                                            <p className="text-sm text-yellow-400">Price: Rp {fmt(s.marketPrice)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-text-muted uppercase">NET GAIN/LOSS</p>
                                            <p className={`text-sm font-bold ${s.netGainLoss >= 0 ? "text-emerald-400" : "text-red-400"}`}>{s.netGainLoss >= 0 ? "+" : ""}{fmtCur(Math.round(s.netGainLoss))}</p>
                                            <p className={`text-[10px] ${s.pctGainLoss >= 0 ? "text-emerald-400" : "text-red-400"}`}>({s.pctGainLoss >= 0 ? "+" : ""}{s.pctGainLoss.toFixed(2)}%)</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 bg-sky-500/10 border border-sky-500/20 rounded-lg p-3 text-xs text-sky-300/80">
                            <strong>Note:</strong> Perhitungan efektif mengasumsikan dividen digunakan untuk mengurangi modal awal (Average Down Psikologis). Pajak dividen di Indonesia untuk WNI Orang Pribadi adalah 10% bersifat final.
                        </div>
                    </div>
                ) : (
                    <div className="bg-surface-elevated border border-border rounded-xl p-5 flex items-center justify-center">
                        <p className="text-sm text-text-muted text-center">Masukkan data untuk melihat analisis</p>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════ RIGHTS ISSUE ═══════════════════════ */
function RightsIssueTool() {
    const [avgPrice, setAvgPrice] = useState(0);
    const [currentShares, setCurrentShares] = useState(0);
    const [ratioOld, setRatioOld] = useState(0);
    const [ratioNew, setRatioNew] = useState(0);
    const [exercisePrice, setExercisePrice] = useState(0);
    const [cumDatePrice, setCumDatePrice] = useState(0);

    const result = useMemo(() => {
        if (!avgPrice || !currentShares || !ratioOld || !ratioNew || !exercisePrice) return null;
        const newShares = Math.floor(currentShares / ratioOld) * ratioNew;
        const totalCost = newShares * exercisePrice;
        const priceForTerp = cumDatePrice || avgPrice;
        const terp = Math.round(((currentShares * priceForTerp) + (newShares * exercisePrice)) / (currentShares + newShares));
        const newAvg = Math.round(((currentShares * avgPrice) + (newShares * exercisePrice)) / (currentShares + newShares));
        const dilutionPct = (newShares / (currentShares + newShares)) * 100;
        const terpVsNewAvg = terp - newAvg;
        return { newShares, totalCost, terp, newAvg, dilutionPct, terpVsNewAvg, totalAfter: currentShares + newShares };
    }, [avgPrice, currentShares, ratioOld, ratioNew, exercisePrice, cumDatePrice]);

    return (
        <div>
            <ToolHeader icon="📋" title="Rights Issue" toolId="rights" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left: Data Input */}
                <div className="space-y-4">
                    <div className="bg-surface-elevated border border-border rounded-xl p-5">
                        <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-3">POSISI SAAT INI</p>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-text-muted mb-1 block">Harga Rata-rata Lama (Rp)</label>
                                <input type="number" value={avgPrice || ""} onChange={e => setAvgPrice(Number(e.target.value) || 0)} placeholder="0"
                                    className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
                            </div>
                            <div>
                                <label className="text-xs text-text-muted mb-1 block">Jumlah Lembar Saham</label>
                                <input type="number" value={currentShares || ""} onChange={e => setCurrentShares(Number(e.target.value) || 0)} placeholder="0"
                                    className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-surface-elevated border border-border rounded-xl p-5">
                        <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-3">INFO RIGHTS ISSUE</p>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-text-muted mb-1 block">Rasio Lama</label>
                                    <input type="number" value={ratioOld || ""} onChange={e => setRatioOld(Number(e.target.value) || 0)} placeholder="0"
                                        className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs text-text-muted mb-1 block">Rasio Baru</label>
                                    <input type="number" value={ratioNew || ""} onChange={e => setRatioNew(Number(e.target.value) || 0)} placeholder="0"
                                        className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-text-muted mb-1 block">Harga Tebus / Exercise Price (Rp)</label>
                                <input type="number" value={exercisePrice || ""} onChange={e => setExercisePrice(Number(e.target.value) || 0)} placeholder="0"
                                    className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
                            </div>
                            <div>
                                <label className="text-xs text-text-muted mb-1 block">Estimasi Harga Cum-Date (Rp)</label>
                                <input type="number" value={cumDatePrice || ""} onChange={e => setCumDatePrice(Number(e.target.value) || 0)} placeholder="0"
                                    className="w-full bg-surface-card border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none" />
                            </div>
                        </div>
                    </div>
                </div>
                {/* Right: Results */}
                <div className="space-y-4">
                    <div className="bg-surface-elevated border border-border rounded-xl p-5">
                        <h4 className="text-base font-bold text-accent flex items-center gap-2 mb-4">📈 Hasil Perhitungan</h4>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-surface-card border border-border rounded-xl p-4">
                                <p className="text-[10px] text-text-muted">Hak (Rights)</p>
                                <p className="text-xl font-bold text-accent">{result ? fmt(result.newShares) : 0}</p>
                                <p className="text-[10px] text-text-muted">lembar</p>
                            </div>
                            <div className="bg-surface-card border border-border rounded-xl p-4">
                                <p className="text-[10px] text-text-muted">Dana Tebus</p>
                                <p className="text-xl font-bold text-red-400">Rp {result ? fmt(result.totalCost) : 0}</p>
                                <p className="text-[10px] text-text-muted">cash required</p>
                            </div>
                        </div>
                        <div className="bg-surface-card border border-border rounded-xl p-4 mb-3">
                            <p className="text-[10px] text-text-muted">Harga Rata-rata Baru</p>
                            <p className="text-2xl font-bold text-accent">Rp {result ? fmt(result.newAvg) : 0}</p>
                            <p className="text-[10px] text-text-muted">setelah tebus semua rights</p>
                        </div>
                        <div className="bg-surface-card border border-yellow-500/30 rounded-xl p-4">
                            <p className="text-[10px] text-yellow-400 font-bold flex items-center gap-1">📊 TERP (Theoretical Ex-Rights Price)</p>
                            <p className="text-2xl font-bold text-text-primary">Rp {result ? fmt(result.terp) : 0}</p>
                            <p className="text-[10px] text-emerald-400">harga teoritis setelah rights issue</p>
                        </div>
                    </div>
                    {/* Dilution Warning */}
                    {result && (
                        <div className={`border rounded-xl p-5 ${result.terpVsNewAvg < 0 ? "bg-red-500/5 border-red-500/30" : "bg-emerald-500/5 border-emerald-500/30"}`}>
                            <h4 className="text-base font-bold flex items-center gap-2 mb-2">
                                {result.terpVsNewAvg < 0 ? <span className="text-red-400">📉 ⚠️ Potensi Dilusi</span> : <span className="text-emerald-400">📈 Positif</span>}
                            </h4>
                            <p className="text-xs text-text-muted mb-2">
                                TERP (Rp {fmt(result.terp)}) {result.terpVsNewAvg >= 0 ? "lebih tinggi" : "lebih rendah"} dari Average Baru (Rp {fmt(result.newAvg)}). {result.terpVsNewAvg < 0 ? "Jika tidak tebus, posisi Anda akan terdilusi." : "Posisi Anda berpotensi menguat."} Selisih: <span className={result.terpVsNewAvg >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>Rp {fmt(Math.abs(result.terpVsNewAvg))}</span> per lembar.
                            </p>
                            <div className="bg-surface-card border border-border rounded-lg p-3 text-xs">
                                <p className="text-text-muted">Rekomendasi:</p>
                                <p className="text-yellow-400 font-bold">⚠️ Pertimbangkan risiko dilusi vs opportunity cost</p>
                            </div>
                        </div>
                    )}
                    {/* Summary Table */}
                    <div className="bg-surface-elevated border border-border rounded-xl p-5">
                        <h4 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-3">📋 Ringkasan Total</h4>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between"><span className="text-text-muted">Lembar Lama</span><span className="text-text-primary">{fmt(currentShares)}</span></div>
                            <div className="flex justify-between"><span className="text-text-muted">Lembar Baru (Rights)</span><span className="text-accent">+ {result ? fmt(result.newShares) : 0}</span></div>
                            <div className="flex justify-between border-t border-border pt-2"><span className="text-text-primary font-bold">Total Lembar Akhir</span><span className="text-text-primary font-bold">{result ? fmt(result.totalAfter) : 0}</span></div>
                        </div>
                    </div>
                </div>
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
