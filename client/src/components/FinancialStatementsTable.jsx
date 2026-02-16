import { useState, useEffect } from "react";
import { formatNumber } from "../utils/formatters";

/**
 * FinancialStatementsTable — Tabbed table for Income Statement,
 * Balance Sheet, Cash Flow with annual/quarterly toggle.
 *
 * Matches Stokbit-style data layout: rows = metrics, columns = periods.
 */

/* ── Row definitions for each statement ─────────────────────── */
const INCOME_ROWS = [
    { key: "totalRevenue", label: "Total Revenue" },
    { key: "costOfRevenue", label: "Cost of Revenue" },
    { key: "grossProfit", label: "Gross Profit", bold: true },
    { key: "operatingExpense", label: "Operating Expenses" },
    { key: "operatingIncome", label: "Operating Income", bold: true },
    { key: "netInterestIncome", label: "Net Interest Income" },
    { key: "interestExpense", label: "Interest Expense" },
    { key: "pretaxIncome", label: "Pretax Income" },
    { key: "taxProvision", label: "Tax Provision" },
    { key: "netIncome", label: "Net Income", bold: true },
    { key: "ebitda", label: "EBITDA", bold: true },
    { key: "ebit", label: "EBIT" },
    { key: "basicEPS", label: "Basic EPS", format: "eps" },
    { key: "dilutedEPS", label: "Diluted EPS", format: "eps" },
    { key: "basicAverageShares", label: "Shares Outstanding" },
    { key: "dividendPerShare", label: "Dividend / Share", format: "eps" },
];

const BALANCE_ROWS = [
    { key: "totalAssets", label: "Total Assets", bold: true },
    { key: "currentAssets", label: "  Current Assets" },
    { key: "cashAndCashEquivalents", label: "    Cash & Equivalents" },
    { key: "accountsReceivable", label: "    Accounts Receivable" },
    { key: "inventory", label: "    Inventory" },
    { key: "totalNonCurrentAssets", label: "  Non-Current Assets" },
    { key: "netPPE", label: "    Net PP&E" },
    { key: "goodwill", label: "    Goodwill" },
    { key: "investmentsAndAdvances", label: "    Investments" },
    { key: "totalLiabilities", label: "Total Liabilities", bold: true },
    { key: "currentLiabilities", label: "  Current Liabilities" },
    { key: "totalNonCurrentLiabilities", label: "  Non-Current Liabilities" },
    { key: "totalDebt", label: "  Total Debt" },
    { key: "longTermDebt", label: "    Long-Term Debt" },
    { key: "currentDebt", label: "    Short-Term Debt" },
    { key: "netDebt", label: "  Net Debt" },
    { key: "totalEquity", label: "Total Equity", bold: true },
    { key: "retainedEarnings", label: "  Retained Earnings" },
    { key: "sharesIssued", label: "Shares Issued", format: "shares" },
    { key: "workingCapital", label: "Working Capital" },
    { key: "tangibleBookValue", label: "Tangible Book Value" },
    // Bank-specific
    { key: "totalDeposits", label: "Total Deposits" },
    { key: "netLoan", label: "Net Loans" },
];

const CASHFLOW_ROWS = [
    { key: "operatingCashFlow", label: "Operating Cash Flow", bold: true },
    { key: "depreciationAndAmortization", label: "  Depreciation & Amort." },
    { key: "stockBasedCompensation", label: "  Stock-Based Comp." },
    { key: "changeInWorkingCapital", label: "  Chg in Working Capital" },
    { key: "investingCashFlow", label: "Investing Cash Flow", bold: true },
    { key: "capitalExpenditure", label: "  Capital Expenditure" },
    { key: "financingCashFlow", label: "Financing Cash Flow", bold: true },
    { key: "dividendsPaid", label: "  Dividends Paid" },
    { key: "netIssuancePaymentsOfDebt", label: "  Net Debt Issuance" },
    { key: "repurchaseOfCapitalStock", label: "  Share Buybacks" },
    { key: "freeCashFlow", label: "Free Cash Flow", bold: true },
    { key: "beginningCashPosition", label: "Beginning Cash" },
    { key: "endCashPosition", label: "Ending Cash" },
    { key: "changesInCash", label: "Net Change in Cash" },
];

const TABS = [
    { id: "income", label: "Income Statement", rows: INCOME_ROWS, dataKey: "incomeStatement" },
    { id: "balance", label: "Balance Sheet", rows: BALANCE_ROWS, dataKey: "balanceSheet" },
    { id: "cashflow", label: "Cash Flow", rows: CASHFLOW_ROWS, dataKey: "cashFlow" },
];

/* ── Format a cell value ───────────────────────────────────── */
function fmtCell(val, format) {
    if (val == null) return "—";
    if (format === "eps") {
        return val.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (format === "shares") {
        return formatNumber(val);
    }
    return formatNumber(val);
}

/* ── Format period label ───────────────────────────────────── */
function periodLabel(period, type) {
    if (!period) return "—";
    const d = new Date(period);
    if (type === "quarterly") {
        const q = Math.ceil((d.getMonth() + 1) / 3);
        return `Q${q} ${d.getFullYear()}`;
    }
    return String(d.getFullYear());
}

/* ── YoY growth calculation ────────────────────────────────── */
function calcGrowth(current, previous) {
    if (current == null || previous == null || previous === 0) return null;
    return ((current - previous) / Math.abs(previous));
}

export default function FinancialStatementsTable({ ticker }) {
    const [activeTab, setActiveTab] = useState("income");
    const [periodType, setPeriodType] = useState("annual");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!ticker) return;
        setLoading(true);
        setError("");
        setData(null);

        fetch(`/api/stocks/${encodeURIComponent(ticker)}/financials?type=${periodType}`)
            .then((r) => r.json())
            .then((res) => {
                if (res.success) setData(res);
                else setError(res.error || "Failed to load");
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [ticker, periodType]);

    const tab = TABS.find((t) => t.id === activeTab);
    const rows = tab.rows;
    const items = data?.[tab.dataKey] || [];

    // Filter rows that have at least one non-null value
    const visibleRows = rows.filter((r) =>
        items.some((item) => item[r.key] != null)
    );

    return (
        <div className="bg-surface-card border border-border rounded-2xl overflow-hidden">
            {/* ── Header: Tabs + Period Toggle ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-border">
                {/* Tabs */}
                <div className="flex gap-1 bg-surface-elevated rounded-lg p-0.5">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${activeTab === t.id
                                    ? "bg-accent text-white shadow-sm"
                                    : "text-text-muted hover:text-text-secondary"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Annual / Quarterly toggle */}
                <div className="flex gap-1 bg-surface-elevated rounded-lg p-0.5">
                    {["annual", "quarterly"].map((type) => (
                        <button
                            key={type}
                            onClick={() => setPeriodType(type)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer capitalize ${periodType === type
                                    ? "bg-accent/20 text-accent"
                                    : "text-text-muted hover:text-text-secondary"
                                }`}
                        >
                            {type === "annual" ? "Tahunan" : "Kuartalan"}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Content ── */}
            {loading && (
                <div className="p-8 space-y-2 animate-pulse">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-8 bg-surface-elevated rounded" />
                    ))}
                </div>
            )}

            {error && (
                <div className="p-4 text-bear text-sm">{error}</div>
            )}

            {!loading && !error && data && items.length === 0 && (
                <div className="p-8 text-center text-text-muted text-sm">
                    Tidak ada data laporan keuangan tersedia.
                </div>
            )}

            {!loading && !error && items.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left text-text-muted text-xs font-medium px-4 py-2.5 sticky left-0 bg-surface-card z-10 min-w-[200px]">
                                    Metrik
                                </th>
                                {items.map((item, i) => (
                                    <th
                                        key={i}
                                        className="text-right text-text-muted text-xs font-medium px-4 py-2.5 min-w-[110px]"
                                    >
                                        {periodLabel(item.period, periodType)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {visibleRows.map((row) => (
                                <tr
                                    key={row.key}
                                    className={`border-b border-border/50 hover:bg-surface-elevated/50 transition-colors ${row.bold ? "bg-surface-elevated/30" : ""
                                        }`}
                                >
                                    <td
                                        className={`px-4 py-2 sticky left-0 bg-inherit z-10 whitespace-nowrap ${row.bold
                                                ? "font-semibold text-text-primary"
                                                : "text-text-secondary"
                                            }`}
                                    >
                                        {row.label}
                                    </td>
                                    {items.map((item, i) => {
                                        const val = item[row.key];
                                        const prevVal = i > 0 ? items[i - 1][row.key] : null;
                                        const growth = row.bold ? calcGrowth(val, prevVal) : null;

                                        return (
                                            <td
                                                key={i}
                                                className={`text-right px-4 py-2 tabular-nums ${row.bold
                                                        ? "font-semibold text-text-primary"
                                                        : "text-text-secondary"
                                                    }`}
                                            >
                                                <div>{fmtCell(val, row.format)}</div>
                                                {growth != null && (
                                                    <div
                                                        className={`text-[10px] ${growth >= 0 ? "text-bull" : "text-bear"
                                                            }`}
                                                    >
                                                        {growth >= 0 ? "▲" : "▼"}{" "}
                                                        {Math.abs(growth * 100).toFixed(1)}%
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Source */}
            <div className="px-4 py-2 border-t border-border">
                <p className="text-[10px] text-text-muted/50 text-right">
                    📡 Source: Yahoo Finance — {periodType === "annual" ? "Annual" : "Quarterly"} Data
                </p>
            </div>
        </div>
    );
}
