// pages/api/stocks.js

let tradeLog = []; // In-memory log – reset every cold start
let balance = 10000; // Starting balance
let portfolio = {}; // Holdings

export default async function handler(req, res) {
  const symbols = ["AAPL", "TSLA", "AMZN", "NFLX", "GOOGL"];

  try {
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        const response = await fetch(
          `https://query1.finance.yahoo.com/v6/finance/quote?symbols=${symbol}`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0",
            },
          }
        );
        const data = await response.json();
        const quote = data.quoteResponse.result[0];

        return {
          symbol: quote.symbol,
          price: quote.regularMarketPrice,
        };
      })
    );

    const recommendations = {
      buy: [],
      sell: [],
      hold: [],
    };

    results.forEach((stock) => {
      const { symbol, price } = stock;
      const mockSpread = 0.5;
      const time = new Date().toISOString();
      const maxTrade = 1000;
      const fee = 1;

      // Simuleeri BUY
      if (Math.floor(price) % 2 === 1 && balance >= maxTrade + fee) {
        const amount = (maxTrade - fee) / price;
        balance -= maxTrade;
        portfolio[symbol] = (portfolio[symbol] || 0) + amount;
        tradeLog.push({
          time,
          action: "BUY",
          symbol,
          price,
          amount,
          fee,
          balance,
        });
        recommendations.buy.push({
          symbol,
          buyPrice: price,
          sellPrice: price + mockSpread,
        });
      }

      // Simuleeri SELL
      else if (Math.floor(price) % 2 === 0 && portfolio[symbol] > 0) {
        const amount = portfolio[symbol];
        const revenue = amount * price - fee;
        balance += revenue;
        portfolio[symbol] = 0;
        tradeLog.push({
          time,
          action: "SELL",
          symbol,
          price,
          amount,
          fee,
          revenue,
          balance,
        });
        recommendations.sell.push({
          symbol,
          sellPrice: price,
          buyPrice: price - mockSpread,
        });
      }

      // HOLD
      else {
        recommendations.hold.push({
          symbol,
          price,
          buyPrice: price - mockSpread,
          sellPrice: price + mockSpread,
        });
      }
    });

    const totalProfit =
      balance +
      Object.entries(portfolio).reduce(
        (sum, [sym, amt]) => {
          const latest = results.find((r) => r.symbol === sym);
          return sum + (latest?.price || 0) * amt;
        },
        0
      ) -
      10000;

    res.status(200).json({
      recommendations,
      tradeLog,
      balance,
      totalProfit: parseFloat(totalProfit.toFixed(2)),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch stock data" });
  }
}
