import yahooFinance from "yahoo-finance2";

const symbols = ["AAPL", "TSLA", "AMZN", "NFLX", "GOOGL"];

function simpleRecommendation(price, avg) {
  const diff = price - avg;
  if (diff < -1) return "BUY";
  if (diff > 1) return "SELL";
  return "HOLD";
}

export default async function handler(req, res) {
  try {
    const results = {
      buy: [],
      sell: [],
      hold: [],
    };

    for (const symbol of symbols) {
      const queryOptions = { period1: '2023-01-01', interval: '1d' };
      const history = await yahooFinance.historical(symbol, queryOptions);
      if (!history || history.length === 0) continue;

      // Võtame viimased 5 päeva sulgemishinnad
      const last5 = history.slice(-5);
      const closePrices = last5.map(day => day.close);
      const avgClose = closePrices.reduce((a,b) => a+b, 0) / closePrices.length;
      const lastPrice = closePrices[closePrices.length - 1];

      const rec = simpleRecommendation(lastPrice, avgClose);

      if (rec === "BUY") {
        results.buy.push({ symbol, buyPrice: lastPrice, sellPrice: avgClose });
      } else if (rec === "SELL") {
        results.sell.push({ symbol, sellPrice: lastPrice, buyPrice: avgClose });
      } else {
        results.hold.push({ symbol, price: lastPrice, buyPrice: avgClose * 0.99, sellPrice: avgClose * 1.01 });
      }
    }

    res.status(200).json(results);

  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: "Failed to fetch stock data" });
  }
}
