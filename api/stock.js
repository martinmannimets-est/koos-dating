// pages/api/stocks.js

export default async function handler(req, res) {
  try {
    const response = await fetch("https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?apiKey=demo");
    const data = await response.json();

    const topFive = data.tickers.slice(0, 5).map((ticker) => ({
      symbol: ticker.ticker,
      price: ticker.lastTrade.p,
    }));

    const recommendations = {
      buy: [],
      sell: [],
      hold: [],
    };

    topFive.forEach((stock) => {
      const { symbol, price } = stock;
      const mockSpread = 0.5;

      if (Math.floor(price) % 2 === 1) {
        recommendations.buy.push({
          symbol,
          buyPrice: price,
          sellPrice: price + mockSpread,
        });
      } else if (Math.floor(price) % 2 === 0) {
        recommendations.sell.push({
          symbol,
          sellPrice: price,
          buyPrice: price - mockSpread,
        });
      } else {
        recommendations.hold.push({
          symbol,
          price,
          buyPrice: price - mockSpread,
          sellPrice: price + mockSpread,
        });
      }
    });

    res.status(200).json(recommendations);
  } catch (error) {
    console.error("Stock fetch failed", error);
    res.status(500).json({ error: "Failed to fetch stock data" });
  }
}
