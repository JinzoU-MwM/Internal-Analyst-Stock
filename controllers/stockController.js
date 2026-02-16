import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

/**
 * Normalize a ticker for the Indonesian market.
 * Appends .JK if no exchange suffix is present.
 */
function normalizeTicker(raw) {
    let t = raw.toUpperCase().trim();
    if (!t.includes(".")) t += ".JK";
    return t;
}

/**
 * GET /api/stocks/:ticker/fundamental
 *
 * Fetches fundamental data via Yahoo Finance quoteSummary.
 * Modules: summaryDetail, financialData, defaultKeyStatistics, assetProfile
 *
 * Returns a clean JSON object with professional fundamental metrics.
 */
/**
 * Fetch fundamental data (internal helper for controller & AI).
 */
export const getFundamentalStatsData = async (tickerRaw) => {
    const ticker = normalizeTicker(tickerRaw);

    const [result, quoteData] = await Promise.all([
        yahooFinance.quoteSummary(ticker, {
            modules: [
                "summaryDetail",
                "financialData",
                "defaultKeyStatistics",
                "assetProfile",
            ],
        }),
        yahooFinance.quote(ticker).catch(() => null),
    ]);

    const summary = result.summaryDetail ?? {};
    const financial = result.financialData ?? {};
    const keyStats = result.defaultKeyStatistics ?? {};
    const profile = result.assetProfile ?? {};
    const quote = quoteData ?? {};

    // ── Currency handling ──────────────────────────────────────
    // listingCurrency = stock's trading currency (IDR for .JK)
    // financialCurrency = reporting currency (can be USD for ADRO, etc.)
    // Market data (price, market cap, 52W range, targets) → listing currency
    // Financial data (revenue, debt, cash) → financial reporting currency
    const listingCurrency = summary.currency || quote.currency || "IDR";
    const financialCurrency = financial.financialCurrency || listingCurrency;
    let fxRate = 1;

    if (financialCurrency === "USD" && listingCurrency === "IDR") {
        try {
            const fxQuote = await yahooFinance.quote("USDIDR=X");
            if (fxQuote?.regularMarketPrice) {
                fxRate = fxQuote.regularMarketPrice;
            }
        } catch (err) {
            console.error("[StockController] Failed to fetch USDIDR rate:", err.message);
        }
    }

    // fc = convert financial-reporting-currency fields to IDR
    const fc = (val) => (val != null && fxRate !== 1 ? val * fxRate : val);

    // ── Compute PE with fallback chain ──
    const currentPrice = financial.currentPrice ?? quote.regularMarketPrice ?? null;
    const eps = quote.epsTrailingTwelveMonths ?? (keyStats.trailingEps ?? null);
    let peRatio = summary.trailingPE ?? quote.trailingPE ?? null;
    if (peRatio == null && currentPrice && eps && eps !== 0) {
        peRatio = currentPrice / eps;
    }

    let forwardPE = summary.forwardPE ?? quote.forwardPE ?? null;
    if (forwardPE == null && currentPrice && keyStats.forwardEps && keyStats.forwardEps !== 0) {
        forwardPE = currentPrice / keyStats.forwardEps;
    }

    // ── PEG — use Yahoo's native value only ──
    // (Our fallback using TTM earningsGrowth was unreliable for stocks
    // with volatile one-year earnings like ADRO)
    const pegRatio = keyStats.pegRatio ?? quote.trailingPegRatio ?? null;

    // ── Compute PBV with currency correction ──
    // Yahoo sometimes computes PBV as (IDR price / USD bookValue) = wrong
    // We recalculate: price / (bookValue × fxRate)
    let pbRatio = keyStats.priceToBook ?? null;
    if (fxRate !== 1 && currentPrice && keyStats.bookValue && keyStats.bookValue > 0) {
        pbRatio = currentPrice / (keyStats.bookValue * fxRate);
    }

    return {
        ticker,

        // ── Company Profile ─────────────────────────────
        currency: "IDR",
        sector: profile.sector ?? null,
        industry: profile.industry ?? null,
        longBusinessSummary: profile.longBusinessSummary ?? null,
        website: profile.website ?? null,
        fullTimeEmployees: profile.fullTimeEmployees ?? null,

        // ── Valuation (market data → listing currency, no conversion) ──
        marketCap: summary.marketCap ?? null,
        enterpriseValue: fc(keyStats.enterpriseValue ?? null),
        peRatio,
        forwardPE,
        pbRatio,
        pegRatio,

        // ── Profitability (ratios, no conversion) ───────
        roe: financial.returnOnEquity ?? null,
        roa: financial.returnOnAssets ?? null,
        profitMargin: keyStats.profitMargins ?? null,
        operatingMargin: financial.operatingMargins ?? null,
        grossMargin: financial.grossMargins ?? null,

        // ── Dividend (listing currency) ─────────────────
        dividendYield: summary.dividendYield ?? null,
        dividendRate: summary.dividendRate ?? null,
        payoutRatio: summary.payoutRatio ?? null,

        // ── Financial Health (reporting currency → convert) ──
        totalRevenue: fc(financial.totalRevenue ?? null),
        revenueGrowth: financial.revenueGrowth ?? null,
        earningsGrowth: financial.earningsGrowth ?? null,
        totalDebt: fc(financial.totalDebt ?? null),
        totalCash: fc(financial.totalCash ?? null),
        debtToEquity: financial.debtToEquity ?? null,
        currentRatio: financial.currentRatio ?? null,

        // ── Price Targets (listing currency, no conversion) ──
        currentPrice,
        targetHighPrice: financial.targetHighPrice ?? null,
        targetLowPrice: financial.targetLowPrice ?? null,
        targetMeanPrice: financial.targetMeanPrice ?? null,
        recommendation: financial.recommendationKey ?? null,
        numberOfAnalysts: financial.numberOfAnalystOpinions ?? null,

        // ── Trading Info (listing currency, no conversion) ──
        fiftyTwoWeekHigh: summary.fiftyTwoWeekHigh ?? null,
        fiftyTwoWeekLow: summary.fiftyTwoWeekLow ?? null,
        fiftyDayAverage: summary.fiftyDayAverage ?? null,
        twoHundredDayAverage: summary.twoHundredDayAverage ?? null,
        beta: summary.beta ?? null,
        volume: summary.volume ?? null,
        averageVolume: summary.averageVolume ?? null,
    };
};

/**
 * GET /api/stocks/:ticker/fundamental
 */
export const getFundamentalStats = async (req, res) => {
    try {
        const data = await getFundamentalStatsData(req.params.ticker);
        return res.json({
            success: true,
            ticker: data.ticker,
            data,
        });
    } catch (error) {
        console.error(`[StockController] ${error.message}`);

        const status = error.message.includes("No fundamentals data")
            ? 404
            : 500;

        return res.status(status).json({
            success: false,
            error: `Failed to fetch fundamental data for "${req.params.ticker}": ${error.message}`,
        });
    }
};

// ── Financial Statements (Income, Balance Sheet, Cash Flow) ──────

/**
 * GET /api/stocks/:ticker/financials?type=annual|quarterly
 *
 * Uses fundamentalsTimeSeries to get full financial statements.
 */
export const getFinancialStatements = async (req, res) => {
    try {
        const ticker = normalizeTicker(req.params.ticker);
        const periodType = req.query.type === "quarterly" ? "quarterly" : "annual";

        // Fetch last 6 years of data to ensure we get 5 full years
        const period1 = new Date();
        period1.setFullYear(period1.getFullYear() - 6);

        const rawData = await yahooFinance.fundamentalsTimeSeries(ticker, {
            period1: period1.toISOString().split("T")[0],
            type: periodType,
            module: "all",
        });

        if (!rawData || rawData.length === 0) {
            return res.json({
                success: true,
                ticker,
                type: periodType,
                incomeStatement: [],
                balanceSheet: [],
                cashFlow: [],
            });
        }

        // Check currency and get conversion rate
        let rate = 1;
        let currency = "IDR";
        try {
            const quoteData = await yahooFinance.quote(ticker);
            currency = quoteData?.currency || quoteData?.financialCurrency || "IDR";
            if (currency === "USD") {
                const fxQuote = await yahooFinance.quote("USDIDR=X");
                if (fxQuote?.regularMarketPrice) {
                    rate = fxQuote.regularMarketPrice;
                    currency = "IDR";
                }
            }
        } catch { /* keep rate=1 */ }

        const c = (val) => (val != null && rate !== 1 ? val * rate : val ?? null);

        // Map each period to structured objects
        const incomeStatement = [];
        const balanceSheet = [];
        const cashFlow = [];

        for (const row of rawData) {
            const period = row.date instanceof Date
                ? row.date.toISOString().split("T")[0]
                : String(row.date);

            // Income Statement
            incomeStatement.push({
                period,
                totalRevenue: c(row.totalRevenue),
                costOfRevenue: c(row.costOfRevenue),
                grossProfit: c(row.grossProfit),
                operatingExpense: c(row.operatingExpense),
                operatingIncome: c(row.operatingIncome),
                netInterestIncome: c(row.netInterestIncome),
                interestIncome: c(row.interestIncome),
                interestExpense: c(row.interestExpense),
                pretaxIncome: c(row.pretaxIncome),
                taxProvision: c(row.taxProvision),
                netIncome: c(row.netIncome),
                netIncomeCommonStockholders: c(row.netIncomeCommonStockholders),
                ebitda: c(row.EBITDA),
                ebit: c(row.EBIT),
                basicEPS: row.basicEPS ?? null,
                dilutedEPS: row.dilutedEPS ?? null,
                basicAverageShares: row.basicAverageShares ?? null,
                dilutedAverageShares: row.dilutedAverageShares ?? null,
                dividendPerShare: row.dividendPerShare ?? null,
                // Bank-specific
                nonInterestIncome: c(row.nonInterestIncome),
                nonInterestExpense: c(row.nonInterestExpense),
                creditLossesProvision: c(row.creditLossesProvision),
                feesAndCommissions: c(row.feesAndCommissions),
            });

            // Balance Sheet
            balanceSheet.push({
                period,
                totalAssets: c(row.totalAssets),
                currentAssets: c(row.currentAssets),
                cashAndCashEquivalents: c(row.cashAndCashEquivalents),
                inventory: c(row.inventory),
                accountsReceivable: c(row.accountsReceivable),
                totalNonCurrentAssets: c(row.totalNonCurrentAssets),
                netPPE: c(row.netPPE),
                goodwill: c(row.goodwill),
                investmentsAndAdvances: c(row.investmentsAndAdvances),
                totalLiabilities: c(row.totalLiabilitiesNetMinorityInterest),
                currentLiabilities: c(row.currentLiabilities),
                accountsPayable: c(row.accountsPayable),
                totalNonCurrentLiabilities: c(row.totalNonCurrentLiabilitiesNetMinorityInterest),
                totalDebt: c(row.totalDebt),
                longTermDebt: c(row.longTermDebt),
                currentDebt: c(row.currentDebt),
                netDebt: c(row.netDebt),
                totalEquity: c(row.stockholdersEquity),
                retainedEarnings: c(row.retainedEarnings),
                commonStock: c(row.commonStock),
                sharesIssued: row.shareIssued ?? null,
                ordinarySharesNumber: row.ordinarySharesNumber ?? null,
                workingCapital: c(row.workingCapital),
                tangibleBookValue: c(row.tangibleBookValue),
                // Bank-specific
                totalDeposits: c(row.totalDeposits),
                netLoan: c(row.netLoan),
            });

            // Cash Flow
            cashFlow.push({
                period,
                operatingCashFlow: c(row.operatingCashFlow),
                investingCashFlow: c(row.investingCashFlow),
                financingCashFlow: c(row.financingCashFlow),
                freeCashFlow: c(row.freeCashFlow),
                capitalExpenditure: c(row.capitalExpenditure),
                dividendsPaid: c(row.commonStockDividendPaid ?? row.cashDividendsPaid),
                netIssuancePaymentsOfDebt: c(row.netIssuancePaymentsOfDebt),
                repurchaseOfCapitalStock: c(row.repurchaseOfCapitalStock),
                depreciationAndAmortization: c(row.depreciationAndAmortization),
                stockBasedCompensation: c(row.stockBasedCompensation),
                changeInWorkingCapital: c(row.changeInWorkingCapital),
                beginningCashPosition: c(row.beginningCashPosition),
                endCashPosition: c(row.endCashPosition),
                changesInCash: c(row.changesInCash),
            });
        }

        // Sort by date ascending and limit
        const sortAsc = (a, b) => a.period.localeCompare(b.period);
        incomeStatement.sort(sortAsc);
        balanceSheet.sort(sortAsc);
        cashFlow.sort(sortAsc);

        // Limit: 5 years for annual, 8 quarters for quarterly
        const limit = periodType === "annual" ? 5 : 8;

        return res.json({
            success: true,
            ticker,
            type: periodType,
            currency,
            incomeStatement: incomeStatement.slice(-limit),
            balanceSheet: balanceSheet.slice(-limit),
            cashFlow: cashFlow.slice(-limit),
        });
    } catch (error) {
        console.error(`[StockController] getFinancialStatements: ${error.message}`);
        return res.status(500).json({
            success: false,
            error: `Failed to fetch financial statements for "${req.params.ticker}": ${error.message}`,
        });
    }
};
