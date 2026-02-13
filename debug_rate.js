import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

async function checkRate() {
    try {
        const result = await yahooFinance.quote("USDIDR=X");
        console.log("USDIDR Rate:", result.regularMarketPrice);
    } catch (error) {
        console.error("Error:", error);
    }
}

checkRate();
