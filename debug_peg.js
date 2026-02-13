import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

async function checkCurrencyAndPeg() {
    try {
        console.log("--- BBRI.JK ---");
        const res = await yahooFinance.quoteSummary("BBRI.JK", {
            modules: ["summaryDetail", "financialData", "defaultKeyStatistics", "price"],
        });

        const financial = res.financialData || {};
        const price = res.price || {};
        const summary = res.summaryDetail || {};
        const stats = res.defaultKeyStatistics || {};

        console.log("Financial Currency:", financial.financialCurrency);
        console.log("Price Currency:", price.currency);
        console.log("Currency Symbol:", price.currencySymbol);

        // Check value scales
        console.log("Current Price:", financial.currentPrice);
        console.log("Market Cap:", summary.marketCap);
        console.log("Total Revenue:", financial.totalRevenue);

        // PEG & Growth
        console.log("PEG Ratio (defaultKeyStatistics):", stats.pegRatio);
        console.log("Earnings Growth:", financial.earningsGrowth);
        console.log("Revenue Growth:", financial.revenueGrowth);
        console.log("Trailing PE:", summary.trailingPE);

    } catch (error) {
        console.error("Error:", error);
    }
}

checkCurrencyAndPeg();
